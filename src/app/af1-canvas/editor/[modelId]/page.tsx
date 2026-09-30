"use client";

import React, { useEffect, useState, use } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  Layers,
  Box,
  AlertCircle,
  CheckCircle2,
  Share2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useCart } from "@/contexts/CartContext";
import { Model3DConfig, LogoTransform } from "@/components/3d/SmartCustomizer";

// Dynamically import SmartCustomizer with SSR disabled for optimal 3D Three.js performance
const SmartCustomizer = dynamic(
  () => import("@/components/3d/SmartCustomizer").then((m) => m.SmartCustomizer),
  {
    ssr: false,
    loading: () => <CustomizerSkeletonLoader text="Initializing 3D Canvas & WebGL Engine..." />,
  }
);

interface PageProps {
  params: Promise<{ modelId: string }>;
}

export default function CanvasEditorPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const modelId = resolvedParams.modelId;
  const searchParams = useSearchParams();
  const router = useRouter();
  const productIdFromQuery = searchParams.get("productId");

  const [model, setModel] = useState<Model3DConfig | null>(null);
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedData, setSavedData] = useState<any>(null);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const { addItem } = useCart();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    async function fetchModelData() {
      try {
        const { data } = await apiClient.get(`/api/public/3d-models/${modelId}`);
        if (!isMounted) return;

        if (data?.ok && data.model) {
          const m = data.model;
          setModel({
            id: m.id || m._id,
            name: m.name,
            modelUrl: m.modelUrl,
            thumbnailUrl: m.thumbnailUrl,
            printZones: m.printZones || [],
          });

          // If model has populated product info
          if (m.product) {
            setProductData(m.product);
          } else if (productIdFromQuery) {
            // Optional: fetch product directly if query param provided
            try {
              const prodRes = await apiClient.get(`/api/products/${productIdFromQuery}`);
              if (prodRes.data?.product && isMounted) {
                setProductData(prodRes.data.product);
              }
            } catch {
              // Non-critical, ignore
            }
          }
        } else {
          setError("3D model configuration not found or inactive.");
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.response?.data?.message || "Failed to load 3D model configuration. Please check the model ID.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (modelId) {
      fetchModelData();
    } else {
      setError("No Model ID provided in URL.");
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [modelId, productIdFromQuery]);

  const handleCustomizationSave = (data: {
    colors: Record<string, string>;
    zones: Record<
      string,
      {
        type: string;
        customImageUrl?: string;
        customLogoTransform?: LogoTransform;
        customText?: string;
        customTextColor?: string;
        fontSize?: number;
        isBold?: boolean;
        align?: string;
      }
    >;
  }) => {
    setSavedData(data);
    try {
      localStorage.setItem(`af1_custom_design_${modelId}`, JSON.stringify(data));
      localStorage.setItem("af1_custom_design_latest", JSON.stringify({ modelId, data }));
    } catch {
      // ignore storage errors
    }
    setShowSavedModal(true);
  };

  const handleDeployToCart = async () => {
    if (!productData && !model) return;
    setIsAddingToCart(true);

    try {
      await addItem({
        productId: productData?.id || productData?._id || modelId,
        variantSku: productData?.slug ? `${productData.slug.toUpperCase()}-3D` : "AF1-3D-CUSTOM",
        slug: productData?.slug || "custom-product",
        name: `${productData?.name || model?.name || "Apparel"} (3D Customized)`,
        imageUrl: model?.thumbnailUrl || productData?.mainImageUrl || "",
        price: Number(productData?.salePrice || productData?.basePrice || productData?.regularPrice || 0),
        quantity: 1,
      });

      setShowSavedModal(false);
      router.push("/cart");
    } catch (err) {
      console.error("Failed adding custom 3D item to cart", err);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // ── SKELETON LOADING STATE ──────────────────────────────────────────────
  if (loading) {
    return <CustomizerSkeletonLoader text="Loading 3D Model Configuration & Tactical Zones..." />;
  }

  // ── ERROR STATE ─────────────────────────────────────────────────────────
  if (error || !model) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex flex-col">
        {/* Simple Top Navigation */}
        <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-[#0e1017]">
          <Link
            href="/shop"
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Armory</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-red-400">
              Model Initialization Error
            </span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-5 bg-[#0f111a] border border-white/10 p-8 rounded-3xl shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-black uppercase italic tracking-wide text-white">
                3D Model Not Found
              </h1>
              <p className="text-xs text-white/50 leading-relaxed">
                {error || "The requested 3D product customizer model could not be found or has not been published yet."}
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2.5">
              {productData?.slug ? (
                <Link
                  href={`/products/${productData.slug}`}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#FF7348] text-white font-black uppercase text-xs tracking-wider hover:bg-[#e86339] transition-all shadow-lg"
                >
                  Return to {productData.name || "Product Page"}
                </Link>
              ) : (
                <Link
                  href="/shop"
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#FF7348] text-white font-black uppercase text-xs tracking-wider hover:bg-[#e86339] transition-all shadow-lg"
                >
                  Browse Available Products
                </Link>
              )}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-3 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-black uppercase text-xs tracking-wider transition-all border border-white/10 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Load</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN 3D CANVAS STUDIO ────────────────────────────────────────────────
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#07090e] text-white flex flex-col select-none">
      {/* ── TOP STUDIO NAVIGATION BAR ── */}
      <header className="h-16 flex-shrink-0 border-b border-white/10 px-4 sm:px-6 flex items-center justify-between bg-[#0B0D13]/90 backdrop-blur-md z-30">
        {/* Left: Back Link & Product Title */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {productData?.slug ? (
            <Link
              href={`/products/${productData.slug}`}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/10 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider shrink-0"
              title="Return to Product"
            >
              <ArrowLeft className="w-4 h-4 text-[#FF7348]" />
              <span className="hidden md:inline">Back to Gear</span>
            </Link>
          ) : (
            <Link
              href="/shop"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/10 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider shrink-0"
              title="Return to Shop"
            >
              <ArrowLeft className="w-4 h-4 text-[#FF7348]" />
              <span className="hidden md:inline">Armory</span>
            </Link>
          )}

          <div className="h-5 w-px bg-white/10 hidden sm:block" />

          {/* Breadcrumb / Title */}
          <div className="min-w-0 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
              <Box className="w-4 h-4 text-[#FF7348]" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF7348]">
                  AF1 3D Canvas
                </span>
                <span className="text-white/20 text-xs hidden sm:inline">&bull;</span>
                <span className="text-[10px] font-bold text-white/40 uppercase hidden sm:inline">
                  Interactive Studio
                </span>
              </div>
              <h1 className="text-xs sm:text-sm font-black uppercase italic tracking-wide text-white truncate max-w-[200px] sm:max-w-md">
                {productData?.name || model.name}
              </h1>
            </div>
          </div>
        </div>

        {/* Right: Live Engine Indicator & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {productData?.salePrice || productData?.basePrice ? (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white">
              <span className="text-white/40 uppercase text-[9px] font-bold tracking-widest">Base:</span>
              <span className="text-[#FF7348]">
                ${Number(productData.salePrice || productData.basePrice || 0).toFixed(2)}
              </span>
            </div>
          ) : null}

          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-black uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">3D Studio Live</span>
          </div>

          {savedData && (
            <button
              type="button"
              onClick={() => setShowSavedModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/20 text-[#FF7348] border border-orange-500/30 text-xs font-black uppercase tracking-wider hover:bg-orange-500/30 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Saved Design</span>
            </button>
          )}
        </div>
      </header>

      {/* ── 3D CANVAS & INTERACTIVE CUSTOMIZER VIEWPORT ── */}
      <main className="flex-1 relative overflow-hidden min-h-0">
        <SmartCustomizer
          modelConfig={model}
          className="w-full h-full min-h-0"
          onSave={handleCustomizationSave}
          onClose={() => {
            if (productData?.slug) {
              router.push(`/products/${productData.slug}`);
            } else {
              router.push("/shop");
            }
          }}
        />
      </main>

      {/* ── SAVED CUSTOMIZATION MODAL CONFIRMATION ── */}
      {showSavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f111a] border border-white/20 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black uppercase italic tracking-wide text-white">
                Customization Saved!
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Your custom graphics, logos, text details, and fabric colors have been bundled and attached to{" "}
                <span className="text-white font-bold">{productData?.name || model.name}</span>.
              </p>
            </div>

            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-left text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-white/40 uppercase font-bold tracking-wider">Zones Customized:</span>
                <span className="text-white font-black">
                  {Object.keys(savedData?.zones || {}).length} zones
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-white/40 uppercase font-bold tracking-wider">Garment Colors:</span>
                <span className="text-white font-black">
                  {Object.keys(savedData?.colors || {}).length} parts modified
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleDeployToCart}
                disabled={isAddingToCart}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF7348] to-[#ff8c69] hover:from-[#ff8660] hover:to-[#ffa082] text-black font-black uppercase tracking-wider text-xs shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4 text-black" />
                <span>{isAddingToCart ? "Deploying to Cart..." : "Deploy Custom Order to Cart"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSavedModal(false)}
                className="w-full py-3 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-black uppercase tracking-wider text-xs transition-all border border-white/10 cursor-pointer"
              >
                Continue Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── HIGH-TECH SKELETON LOADER COMPONENT ──────────────────────────────────────
function CustomizerSkeletonLoader({ text }: { text: string }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#07090e] text-white flex flex-col select-none">
      {/* Top Header Skeleton */}
      <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-[#0B0D13]">
        <div className="flex items-center gap-4">
          <div className="w-24 h-9 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-5 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white/5 animate-pulse" />
            <div className="space-y-1">
              <div className="w-28 h-3 rounded bg-white/10 animate-pulse" />
              <div className="w-40 h-4 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-28 h-8 rounded-xl bg-white/5 animate-pulse" />
          <div className="w-24 h-8 rounded-xl bg-white/5 animate-pulse" />
        </div>
      </div>

      {/* Main Studio Viewport & Configurator Skeleton */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-3 gap-3">
        {/* Center 3D Viewport Skeleton */}
        <div className="flex-1 min-h-0 bg-[#0B0D13] rounded-3xl border border-white/10 flex flex-col items-center justify-center p-8 relative overflow-hidden shadow-2xl">
          {/* Subtle Ambient Radial Glow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40 animate-pulse"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% 50%, #20273a 0%, #0d0f17 65%, #050609 100%)",
            }}
          />

          {/* Futuristic Tactical Loader Icon */}
          <div className="relative z-10 flex flex-col items-center gap-5 text-center max-w-sm">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/15 flex items-center justify-center shadow-2xl">
                <Box className="w-9 h-9 text-[#FF7348] animate-bounce" />
              </div>
              <div className="absolute -inset-1 rounded-3xl border border-[#FF7348]/40 animate-ping pointer-events-none" />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FF7348]">
                Tactical 3D Engine
              </p>
              <h2 className="text-sm sm:text-base font-black uppercase italic tracking-wider text-white">
                {text}
              </h2>
            </div>

            {/* Glowing Progress Indicator */}
            <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#FF7348] via-orange-400 to-[#FF7348] w-2/3 rounded-full animate-[shimmer_1.5s_infinite]" />
            </div>

            <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-white/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF7348] animate-ping" />
              <span>Calibrating Mesh Geometry & Decals</span>
            </div>
          </div>

          {/* Bottom Toolbar Mock Skeleton */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10 pointer-events-none">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-16 h-8 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>

        {/* Right Configuration Sidebar Skeleton */}
        <div className="w-full lg:w-[420px] flex-shrink-0 bg-[#0B0D13] rounded-3xl border border-white/10 p-5 flex flex-col gap-5 shadow-2xl">
          {/* Tabs Skeleton */}
          <div className="flex bg-white/5 p-1 rounded-2xl gap-1">
            <div className="flex-1 h-10 rounded-xl bg-white/10 animate-pulse" />
            <div className="flex-1 h-10 rounded-xl bg-white/5 animate-pulse" />
          </div>

          {/* Configuration Zone Cards Skeleton */}
          <div className="flex-1 space-y-3 overflow-hidden">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white/10 animate-pulse" />
                    <div className="w-24 h-4 rounded bg-white/10 animate-pulse" />
                  </div>
                  <div className="w-12 h-4 rounded-full bg-white/10 animate-pulse" />
                </div>
                <div className="w-full h-8 rounded-xl bg-white/5 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Bottom Action Skeleton */}
          <div className="pt-3 border-t border-white/10">
            <div className="w-full h-14 rounded-2xl bg-white/10 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
