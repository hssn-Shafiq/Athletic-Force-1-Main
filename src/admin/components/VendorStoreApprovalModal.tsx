'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, CheckCircle2, RotateCw, ZoomIn, ZoomOut, Move,
  Maximize2, ChevronRight, ChevronLeft, Store, Image as ImageIcon,
  Sparkles, Loader2, AlertCircle, RefreshCw, Layers
} from 'lucide-react';
import * as fabric from 'fabric';
import {
  adminUploadMockupRenderApi,
  adminApproveAndGenerateProductsApi,
  type AdminVendorStoreDetail,
  type MockupConfigPayload,
  type ApproveAndGenerateProductItem
} from '@/lib/api/vendorStores';

interface VendorStoreApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: AdminVendorStoreDetail;
  onApproved: () => void;
}

interface ProductEditorState {
  productId: string;
  masterName: string;
  customName: string;
  basePrice: number;
  mockups: Array<{
    viewName: string;
    color?: string;
    baseImageUrl: string;
    baseImagePublicId?: string;
    printZones: Array<{
      zoneId: string;
      label: string;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation?: number;
    }>;
    renderedImageUrl?: string;
    renderedImagePublicId?: string;
    logoTransform?: {
      logoUrl: string;
      xPercent: number;
      yPercent: number;
      scaleX: number;
      scaleY: number;
      rotation: number;
    };
  }>;
}

function formatVendorProductName(masterName: string, prefix?: string): string {
  const p = (prefix || '').trim();
  if (!p) return masterName;

  if (/^af1\b/i.test(masterName)) {
    const withoutAf1 = masterName.replace(/^af1\s*[-_]?\s*/i, '').trim();
    return `AF1 ${p} ${withoutAf1}`;
  }

  return `AF1 ${p} ${masterName.trim()}`;
}

export const VendorStoreApprovalModal: React.FC<VendorStoreApprovalModalProps> = ({
  isOpen,
  onClose,
  store,
  onApproved,
}) => {
  const [productPrefix, setProductPrefix] = useState(store.productNamePrefix || '');
  const [currentLogoUrl, setCurrentLogoUrl] = useState(store.logoUrl || '');
  const [commissionRate, setCommissionRate] = useState<number>(store.commissionRate !== undefined ? store.commissionRate : 15);
  const [isCommissionActive, setIsCommissionActive] = useState<boolean>(
    store.isCommissionActive !== undefined ? store.isCommissionActive : true
  );
  const [commissionNotes, setCommissionNotes] = useState<string>(store.commissionNotes || '');
  const [productsState, setProductsState] = useState<ProductEditorState[]>([]);
  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const [activeMockupIndex, setActiveMockupIndex] = useState(0);

  // Canvas & Interaction state
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const activeLogoObjectRef = useRef<fabric.FabricImage | null>(null);
  const guidelineRectRef = useRef<fabric.Rect | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [canvasLoading, setCanvasLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize products from store.products on mount or open
  useEffect(() => {
    if (!isOpen || !store.products) return;

    const initialPrefix = store.productNamePrefix || '';
    setProductPrefix(initialPrefix);
    setCurrentLogoUrl(store.logoUrl || '');
    if (store.commissionRate !== undefined) setCommissionRate(store.commissionRate);
    if (store.isCommissionActive !== undefined) setIsCommissionActive(store.isCommissionActive);
    if (store.commissionNotes !== undefined) setCommissionNotes(store.commissionNotes);

    const initialStates: ProductEditorState[] = store.products.map((p: any) => {
      const generatedName = formatVendorProductName(p.name, initialPrefix);

      // If product has mockups configured in admin, use them; otherwise create a default front mockup from mainImageUrl
      let mockupsList = (p.mockups || []).map((m: any, mIdx: number) => ({
        viewName: m.viewName || 'front',
        color: m.color,
        baseImageUrl: m.baseImageUrl || p.mainImageUrl || '',
        baseImagePublicId: m.baseImagePublicId || p.mainImagePublicId || `mockup_base_${Date.now()}_${mIdx}`,
        printZones: (m.printZones && m.printZones.length > 0) ? m.printZones : [
          { zoneId: 'zone_center', label: 'Front Chest', x: 28, y: 22, width: 44, height: 42, rotation: 0 }
        ],
        renderedImageUrl: m.renderedImageUrl,
        renderedImagePublicId: m.renderedImagePublicId,
        logoTransform: m.logoTransform,
      }));

      if (mockupsList.length === 0) {
        mockupsList = [
          {
            viewName: 'front',
            baseImageUrl: p.mainImageUrl || '',
            baseImagePublicId: p.mainImagePublicId || `mockup_base_${Date.now()}_0`,
            printZones: [
              { zoneId: 'zone_center', label: 'Front Chest', x: 28, y: 22, width: 44, height: 42, rotation: 0 }
            ],
          }
        ];
      }

      return {
        productId: p.parentProductId ? String(p.parentProductId) : p._id,
        masterName: p.name,
        customName: generatedName,
        basePrice: p.basePrice || 0,
        mockups: mockupsList,
      };
    });

    setProductsState(initialStates);
    setActiveProductIndex(0);
    const firstProduct = initialStates[0];
    const frontIdx = firstProduct?.mockups?.findIndex((m: any) => m.viewName?.toLowerCase() === 'front');
    setActiveMockupIndex(frontIdx !== undefined && frontIdx >= 0 ? frontIdx : 0);
  }, [isOpen, store]);

  // Update custom names whenever the prefix is edited
  const handlePrefixChange = (newPrefix: string) => {
    setProductPrefix(newPrefix);
    setProductsState((prev) =>
      prev.map((item) => ({
        ...item,
        customName: formatVendorProductName(item.masterName, newPrefix),
      }))
    );
  };

  const activeProduct = productsState[activeProductIndex];
  const activeMockup = activeProduct?.mockups[activeMockupIndex];

  // ── Render / Update Fabric Canvas ──────────────────────────────────────────
  const setupCanvas = useCallback(async () => {
    const container = containerRef.current;
    if (!container || !activeMockup || !activeMockup.baseImageUrl) return;

    setCanvasLoading(true);
    setErrorMsg(null);

    // Dispose old canvas if existing
    if (fabricCanvasRef.current) {
      try {
        fabricCanvasRef.current.dispose();
      } catch (e) {
        console.warn('Fabric dispose error:', e);
      }
      fabricCanvasRef.current = null;
    }

    // Clean container completely so React virtual DOM reconciliation never touches Fabric elements
    container.innerHTML = '';

    const canvasElement = document.createElement('canvas');
    canvasElement.id = 'mockup-fabric-canvas';
    canvasElement.className = 'rounded-2xl';
    container.appendChild(canvasElement);

    const canvasWidth = 560;
    const canvasHeight = 560;

    const canvas = new fabric.Canvas(canvasElement, {
      width: canvasWidth,
      height: canvasHeight,
      selection: true,
      preserveObjectStacking: true,
      backgroundColor: '#f8fafc',
    });
    fabricCanvasRef.current = canvas;

    try {
      // 1. Load Base Mockup Image
      const baseCrossOrigin = activeMockup.baseImageUrl.startsWith('data:') ? undefined : 'anonymous';
      const baseImg = await fabric.FabricImage.fromURL(activeMockup.baseImageUrl, {
        crossOrigin: baseCrossOrigin,
      });

      // Fit base image to canvas keeping aspect ratio and center it perfectly
      const imgW = baseImg.width || 1;
      const imgH = baseImg.height || 1;
      const scale = Math.min(canvasWidth / imgW, canvasHeight / imgH);

      baseImg.set({
        originX: 'center',
        originY: 'center',
        scaleX: scale,
        scaleY: scale,
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        selectable: false,
        evented: false,
      });
      canvas.add(baseImg);

      // 2. Draw Print Zone Guidelines (matching ProductForm percentages)
      const zone = activeMockup.printZones[0] || { x: 30, y: 25, width: 40, height: 40, rotation: 0 };
      const zoneLeft = (zone.x / 100) * canvasWidth;
      const zoneTop = (zone.y / 100) * canvasHeight;
      const zoneWidth = (zone.width / 100) * canvasWidth;
      const zoneHeight = (zone.height / 100) * canvasHeight;

      const guideline = new fabric.Rect({
        originX: 'left',
        originY: 'top',
        left: zoneLeft,
        top: zoneTop,
        width: zoneWidth,
        height: zoneHeight,
        angle: zone.rotation || 0,
        fill: 'rgba(255, 115, 72, 0.08)',
        stroke: '#FF7348',
        strokeDashArray: [6, 6],
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });
      guidelineRectRef.current = guideline;
      canvas.add(guideline);

      // 3. Load & Position Vendor Logo
      if (currentLogoUrl) {
        const logoCrossOrigin = currentLogoUrl.startsWith('data:') ? undefined : 'anonymous';
        const logoImg = await fabric.FabricImage.fromURL(currentLogoUrl, {
          crossOrigin: logoCrossOrigin,
        });

        // Compute fit scale inside print zone (85% fill)
        const logoW = logoImg.width || 1;
        const logoH = logoImg.height || 1;
        const fitScale = Math.min((zoneWidth * 0.85) / logoW, (zoneHeight * 0.85) / logoH);

        // Check if saved transform exists
        const savedTransform = activeMockup.logoTransform;
        if (savedTransform) {
          logoImg.set({
            originX: 'center',
            originY: 'center',
            left: (savedTransform.xPercent / 100) * canvasWidth,
            top: (savedTransform.yPercent / 100) * canvasHeight,
            scaleX: savedTransform.scaleX,
            scaleY: savedTransform.scaleY,
            angle: savedTransform.rotation || 0,
          });
        } else {
          logoImg.set({
            originX: 'center',
            originY: 'center',
            left: zoneLeft + zoneWidth / 2,
            top: zoneTop + zoneHeight / 2,
            scaleX: fitScale,
            scaleY: fitScale,
          });
        }

        activeLogoObjectRef.current = logoImg;
        canvas.add(logoImg);
        canvas.setActiveObject(logoImg);
      }

      canvas.renderAll();
    } catch (err: any) {
      console.error('[VendorStoreApprovalModal] setupCanvas error:', err);
      setErrorMsg('Failed to render mockup canvas. Ensure images allow cross-origin access.');
    } finally {
      setCanvasLoading(false);
    }
  }, [activeMockup, currentLogoUrl]);

  useEffect(() => {
    if (isOpen) {
      setupCanvas();
    }
    return () => {
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.dispose();
        } catch {}
        fabricCanvasRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [isOpen, activeProductIndex, activeMockupIndex, setupCanvas]);

  // Center logo horizontally in the active print zone
  const centerLogoHorizontal = () => {
    const canvas = fabricCanvasRef.current;
    const logo = activeLogoObjectRef.current;
    const zone = activeMockup?.printZones[0];
    if (!canvas || !logo || !zone) return;

    const canvasWidth = canvas.getWidth();
    const zoneLeft = (zone.x / 100) * canvasWidth;
    const zoneWidth = (zone.width / 100) * canvasWidth;

    logo.set('left', zoneLeft + zoneWidth / 2);
    logo.setCoords();
    canvas.renderAll();
  };

  // Center logo vertically in the active print zone
  const centerLogoVertical = () => {
    const canvas = fabricCanvasRef.current;
    const logo = activeLogoObjectRef.current;
    const zone = activeMockup?.printZones[0];
    if (!canvas || !logo || !zone) return;

    const canvasHeight = canvas.getHeight();
    const zoneTop = (zone.y / 100) * canvasHeight;
    const zoneHeight = (zone.height / 100) * canvasHeight;

    logo.set('top', zoneTop + zoneHeight / 2);
    logo.setCoords();
    canvas.renderAll();
  };

  // Reset logo to standard zone fit
  const resetLogoToZone = () => {
    const canvas = fabricCanvasRef.current;
    const logo = activeLogoObjectRef.current;
    const zone = activeMockup?.printZones[0];
    if (!canvas || !logo || !zone) return;

    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const zoneLeft = (zone.x / 100) * canvasWidth;
    const zoneTop = (zone.y / 100) * canvasHeight;
    const zoneWidth = (zone.width / 100) * canvasWidth;
    const zoneHeight = (zone.height / 100) * canvasHeight;

    const logoW = logo.width || 1;
    const logoH = logo.height || 1;
    const fitScale = Math.min((zoneWidth * 0.85) / logoW, (zoneHeight * 0.85) / logoH);

    logo.set({
      left: zoneLeft + zoneWidth / 2,
      top: zoneTop + zoneHeight / 2,
      scaleX: fitScale,
      scaleY: fitScale,
      angle: 0,
    });
    logo.setCoords();
    canvas.renderAll();
  };

  // Save current transform state into active mockup
  const saveCurrentTransform = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const logo = activeLogoObjectRef.current;
    if (!canvas || !logo) return;

    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    const transform = {
      logoUrl: currentLogoUrl,
      xPercent: ((logo.left || 0) / canvasWidth) * 100,
      yPercent: ((logo.top || 0) / canvasHeight) * 100,
      scaleX: logo.scaleX || 1,
      scaleY: logo.scaleY || 1,
      rotation: logo.angle || 0,
    };

    setProductsState((prev) => {
      const clone = [...prev];
      const prod = clone[activeProductIndex];
      if (prod && prod.mockups[activeMockupIndex]) {
        prod.mockups[activeMockupIndex].logoTransform = transform;
      }
      return clone;
    });
  }, [activeProductIndex, activeMockupIndex, currentLogoUrl]);

  // Handle local logo swap by Admin
  const handleAdminLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      if (dataUrl) {
        setCurrentLogoUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };
 
  // ── Helper: Render any mockup view offscreen with vendor logo ──────────────
  const renderMockupOffscreen = async (
    baseImageUrl: string,
    logoUrl: string,
    printZone: { x: number; y: number; width: number; height: number; rotation?: number },
    transform?: { xPercent: number; yPercent: number; scaleX: number; scaleY: number; rotation: number }
  ): Promise<string> => {
    const canvasWidth = 560;
    const canvasHeight = 560;
    const offscreenCanvasEl = document.createElement('canvas');
    offscreenCanvasEl.width = canvasWidth;
    offscreenCanvasEl.height = canvasHeight;

    const offscreenCanvas = new fabric.Canvas(offscreenCanvasEl, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: '#ffffff',
    });

    try {
      const baseCrossOrigin = baseImageUrl.startsWith('data:') ? undefined : 'anonymous';
      const baseImg = await fabric.FabricImage.fromURL(baseImageUrl, {
        crossOrigin: baseCrossOrigin,
      });

      const imgW = baseImg.width || 1;
      const imgH = baseImg.height || 1;
      const scale = Math.min(canvasWidth / imgW, canvasHeight / imgH);

      baseImg.set({
        originX: 'center',
        originY: 'center',
        scaleX: scale,
        scaleY: scale,
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        selectable: false,
        evented: false,
      });
      offscreenCanvas.add(baseImg);

      const logoCrossOrigin = logoUrl.startsWith('data:') ? undefined : 'anonymous';
      const logoImg = await fabric.FabricImage.fromURL(logoUrl, {
        crossOrigin: logoCrossOrigin,
      });

      const zoneLeft = (printZone.x / 100) * canvasWidth;
      const zoneTop = (printZone.y / 100) * canvasHeight;
      const zoneWidth = (printZone.width / 100) * canvasWidth;
      const zoneHeight = (printZone.height / 100) * canvasHeight;

      const logoW = logoImg.width || 1;
      const logoH = logoImg.height || 1;
      const fitScale = Math.min((zoneWidth * 0.85) / logoW, (zoneHeight * 0.85) / logoH);

      if (transform && transform.xPercent !== undefined) {
        logoImg.set({
          originX: 'center',
          originY: 'center',
          left: (transform.xPercent / 100) * canvasWidth,
          top: (transform.yPercent / 100) * canvasHeight,
          scaleX: transform.scaleX,
          scaleY: transform.scaleY,
          angle: transform.rotation || 0,
        });
      } else {
        logoImg.set({
          originX: 'center',
          originY: 'center',
          left: zoneLeft + zoneWidth / 2,
          top: zoneTop + zoneHeight / 2,
          scaleX: fitScale,
          scaleY: fitScale,
          angle: printZone.rotation || 0,
        });
      }

      offscreenCanvas.add(logoImg);
      offscreenCanvas.renderAll();

      const dataUrl = offscreenCanvas.toDataURL({
        format: 'png',
        multiplier: 2,
      });

      return dataUrl;
    } finally {
      try {
        offscreenCanvas.dispose();
      } catch {}
    }
  };

  // ── Final Approve & Generate All Products ──────────────────────────────────
  const handleApproveAndGenerate = async () => {
    saveCurrentTransform();
    setIsGenerating(true);
    setErrorMsg(null);

    const candidateSlug = store.storeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const storeSlug = candidateSlug || 'vendor-store';

    try {
      const canvas = fabricCanvasRef.current;
      const guideline = guidelineRectRef.current;

      // 1. Calculate total mockups across all products for granular progress
      const totalMockups = productsState.reduce((acc, p) => acc + p.mockups.length, 0);
      let processedMockupCount = 0;

      const finalizedProductsPayload: ApproveAndGenerateProductItem[] = [];

      for (let pIdx = 0; pIdx < productsState.length; pIdx++) {
        const prod = productsState[pIdx];
        const updatedMockups: MockupConfigPayload[] = [];

        for (let mIdx = 0; mIdx < prod.mockups.length; mIdx++) {
          const mockup = prod.mockups[mIdx];
          processedMockupCount++;

          // Case A: Currently active mockup on live canvas -> export directly
          if (pIdx === activeProductIndex && mIdx === activeMockupIndex && canvas) {
            setGenerationProgress({
              current: processedMockupCount,
              total: totalMockups,
              message: `Exporting "${prod.customName}" (${mockup.viewName} view)...`,
            });

            if (guideline) guideline.set('visible', false);
            canvas.discardActiveObject();
            canvas.renderAll();

            const dataUrl = canvas.toDataURL({
              format: 'png',
              multiplier: 2, // Crisp 2x HD output
            });

            if (guideline) guideline.set('visible', true);
            canvas.renderAll();

            // Upload rendered composite to Cloudinary
            const uploadRes = await adminUploadMockupRenderApi({
              storeSlug,
              imageBase64: dataUrl,
            });

            updatedMockups.push({
              ...mockup,
              baseImagePublicId: mockup.baseImagePublicId || uploadRes.publicId || `mockup_base_${Date.now()}_${mIdx}`,
              renderedImageUrl: uploadRes.url,
              renderedImagePublicId: uploadRes.publicId,
            });
          } else if (currentLogoUrl && mockup.baseImageUrl) {
            // Case B: Non-active view or other product -> render offscreen with logo!
            setGenerationProgress({
              current: processedMockupCount,
              total: totalMockups,
              message: `Rendering mockups for "${prod.customName}" (${mockup.viewName} view)...`,
            });

            try {
              const zone = mockup.printZones?.[0] || { x: 30, y: 25, width: 40, height: 40, rotation: 0 };
              const dataUrl = await renderMockupOffscreen(
                mockup.baseImageUrl,
                currentLogoUrl,
                zone,
                mockup.logoTransform
              );

              const uploadRes = await adminUploadMockupRenderApi({
                storeSlug,
                imageBase64: dataUrl,
              });

              updatedMockups.push({
                ...mockup,
                baseImagePublicId: mockup.baseImagePublicId || uploadRes.publicId || `mockup_base_${Date.now()}_${mIdx}`,
                renderedImageUrl: uploadRes.url,
                renderedImagePublicId: uploadRes.publicId,
              });
            } catch (renderErr) {
              console.warn('[VendorStoreApprovalModal] offscreen render fallback:', renderErr);
              updatedMockups.push({
                ...mockup,
                baseImagePublicId: mockup.baseImagePublicId || `mockup_base_${Date.now()}_${mIdx}`,
                renderedImageUrl: mockup.renderedImageUrl || mockup.baseImageUrl,
                renderedImagePublicId: mockup.renderedImagePublicId || mockup.baseImagePublicId || `mockup_rnd_${Date.now()}_${mIdx}`,
              });
            }
          } else {
            updatedMockups.push({
              ...mockup,
              baseImagePublicId: mockup.baseImagePublicId || `mockup_base_${Date.now()}_${mIdx}`,
              renderedImageUrl: mockup.renderedImageUrl || mockup.baseImageUrl,
              renderedImagePublicId: mockup.renderedImagePublicId || mockup.baseImagePublicId || `mockup_rnd_${Date.now()}_${mIdx}`,
            });
          }
        }

        finalizedProductsPayload.push({
          masterProductId: prod.productId,
          customName: prod.customName,
          basePrice: prod.basePrice,
          mockups: updatedMockups,
        });
      }

      // 2. Send finalized products payload to backend to approve store & create products
      setGenerationProgress({
        current: totalMockups,
        total: totalMockups,
        message: 'Creating branded catalog in database...',
      });

      const storeId = store._id || store.id;
      const res = await adminApproveAndGenerateProductsApi(storeId, {
        productNamePrefix: productPrefix,
        commissionRate,
        isCommissionActive,
        commissionNotes: commissionNotes || undefined,
        products: finalizedProductsPayload,
      });

      if (res.ok) {
        onApproved();
        onClose();
      } else {
        setErrorMsg(res.message || 'Approval failed.');
      }
    } catch (err: any) {
      console.error('[VendorStoreApprovalModal] approve error:', err);
      setErrorMsg(err?.response?.data?.message || err.message || 'Failed to approve store and generate products.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white rounded-[36px] shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-1 shadow-xs shrink-0">
              {currentLogoUrl ? (
                <img src={currentLogoUrl} alt="Store Logo" className="w-full h-full object-contain" />
              ) : (
                <Store className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                  {store.storeName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#FF7348]">
                  Mockup Review &amp; Approval
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                Vendor: <span className="text-slate-700">{store.vendorName}</span> • Products to Branded: <strong className="text-slate-900">{productsState.length}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white border border-slate-200 hover:border-orange-300 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs"
            >
              Swap Logo File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAdminLogoUpload}
            />

            <button
              onClick={onClose}
              disabled={isGenerating}
              className="p-2.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Product Prefix Banner */}
        <div className="px-8 py-3 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-b border-orange-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF7348]" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              Catalog Naming Formula: <span className="text-[#FF7348]">AF1 [Prefix] Product Name</span>
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
              Prefix:
            </span>
            <input
              type="text"
              value={productPrefix}
              onChange={(e) => handlePrefixChange(e.target.value)}
              placeholder="e.g. Eagles, Westlake High"
              className="bg-white border border-slate-200 focus:border-orange-400 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none w-48 shadow-2xs italic"
            />
          </div>
        </div>

        {/* Platform Commission Controls Banner */}
        <div className="px-8 py-3.5 bg-slate-900 text-white border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FF7348]/20 text-[#FF7348] flex items-center justify-center font-black text-sm shrink-0">
              %
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-black uppercase italic tracking-wider text-white">Platform Commission</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCommissionActive}
                    onChange={(e) => setIsCommissionActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#FF7348]"></div>
                </label>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  isCommissionActive ? 'bg-[#FF7348]/20 text-[#FF7348]' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isCommissionActive ? 'Active' : 'Disabled (0% Fee)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isCommissionActive
                  ? `Platform fee of ${commissionRate}% is deducted from gross sales. Vendor earns ${100 - commissionRate}%.`
                  : 'Commission is disabled for this store. The vendor receives 100% of all product revenue.'}
              </p>
            </div>
          </div>

          {isCommissionActive && (
            <div className="flex items-center gap-2.5 w-full md:w-auto self-end md:self-auto">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Commission Rate:</span>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-20 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white text-right pr-6 focus:border-[#FF7348] focus:outline-none"
                />
                <span className="absolute right-2 top-1.5 text-xs font-black text-slate-400 pointer-events-none">%</span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1">
                {[0, 10, 15, 20].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCommissionRate(preset)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${
                      commissionRate === preset
                        ? 'bg-[#FF7348] text-black font-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Workspace: Left Products List, Right Interactive Editor */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left: Product Selection List (4 cols) */}
          <div className="lg:col-span-4 border-r border-slate-100 p-5 overflow-y-auto space-y-3 bg-slate-50/30">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                Selected Products ({productsState.length})
              </span>
              <span className="text-[10px] font-bold text-slate-400 italic">
                Click to inspect &amp; align
              </span>
            </div>

            {productsState.map((prod, idx) => {
              const isActive = idx === activeProductIndex;
              return (
                <div
                  key={prod.productId}
                  onClick={() => {
                    saveCurrentTransform();
                    setActiveProductIndex(idx);
                    const targetProd = productsState[idx];
                    const frontIdx = targetProd?.mockups?.findIndex((m: any) => m.viewName?.toLowerCase() === 'front');
                    setActiveMockupIndex(frontIdx !== undefined && frontIdx >= 0 ? frontIdx : 0);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white border-orange-400 shadow-md shadow-orange-500/5 ring-2 ring-orange-400/20'
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {prod.mockups[0]?.baseImageUrl ? (
                        <img
                          src={prod.mockups[0].baseImageUrl}
                          alt={prod.masterName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">
                          Product #{idx + 1}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {prod.mockups.length} view{prod.mockups.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={prod.customName}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProductsState((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, customName: val } : item))
                          );
                        }}
                        className="w-full text-xs font-black italic uppercase tracking-tight text-slate-900 truncate mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-orange-400 outline-none pb-0.5"
                      />
                      <p className="text-[10px] text-slate-400 truncate italic">
                        Master: {prod.masterName}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Fabric.js Canvas & Controls (8 cols) */}
          <div className="lg:col-span-8 p-6 flex flex-col justify-between overflow-y-auto bg-white">
            {activeProduct ? (
              <div className="space-y-4">
                {/* View Switcher & Title */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black italic uppercase text-slate-900">
                      {activeProduct.customName}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium italic">
                      Drag, resize, or rotate the logo inside the dashed print zone.
                    </p>
                  </div>

                  {/* Views tabs */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    {activeProduct.mockups.map((m, mIdx) => (
                      <button
                        key={`${m.color || 'default'}_${m.viewName || 'view'}_${mIdx}`}
                        onClick={() => {
                          saveCurrentTransform();
                          setActiveMockupIndex(mIdx);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                          mIdx === activeMockupIndex
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {m.color ? `${m.color} (${m.viewName})` : m.viewName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Canvas Workspace */}
                <div className="relative w-full aspect-square max-w-[560px] mx-auto bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden flex items-center justify-center shadow-inner">
                  {canvasLoading && (
                    <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 pointer-events-none">
                      <Loader2 className="w-8 h-8 text-[#FF7348] animate-spin" />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Rendering Mockup Engine...
                      </span>
                    </div>
                  )}

                  {/* Isolated DOM container: Fabric creates and manages canvas inside here */}
                  <div ref={containerRef} className="w-full h-full flex items-center justify-center" />
                </div>

                {/* Canvas Toolbar Controls */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={centerLogoHorizontal}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    Align Horizontal
                  </button>
                  <button
                    type="button"
                    onClick={centerLogoVertical}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    Align Vertical
                  </button>
                  <button
                    type="button"
                    onClick={resetLogoToZone}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3 text-[#FF7348]" />
                    Reset to Zone Fit
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm">No product selected</p>
              </div>
            )}

            {/* Error Message if any */}
            {errorMsg && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-medium">
            Approving will create <strong className="text-slate-900">{productsState.length}</strong> branded products under{' '}
            <strong className="text-slate-900">{store.storeName}</strong>.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 sm:flex-none px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-700 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleApproveAndGenerate}
              disabled={isGenerating || productsState.length === 0}
              className="flex-1 sm:flex-none px-8 py-3.5 bg-black hover:bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-orange-600/10 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                  <span>
                    {generationProgress ? generationProgress.message : 'Generating Branded Catalog...'}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Approve Store &amp; Generate Products</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
