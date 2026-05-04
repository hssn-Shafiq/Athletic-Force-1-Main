"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Plus, Search, Star, Trash2, Wand2, X, ChevronRight,
  Loader2, ImageIcon, Video, Tag, Package, BarChart3, Globe,
  ChevronDown, Check, Upload, Info, Eye, EyeOff, Grid3X3,
  Layers, Link2, Palette, ShoppingBag, MessageSquare, Play,
  AlertCircle, Sparkles, LayoutGrid, List
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useProductForm } from './hooks/useProductForm';
import { listAdminMedia, signAdminMediaUpload, uploadImageWithSignature, type AdminMediaItem } from '@/lib/api/media';
import { ProductMediaAsset } from '@/lib/api/types';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

type ProductFormProps = {
  productId?: string;
};

/* ─── small ui helpers ──────────────────────────────────────────── */

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, subtitle, action }: {
  icon?: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        {icon && <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500">{icon}</div>}
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
      {children}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function FieldInput({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all ${className}`}
    />
  );
}

function FieldTextarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none ${className}`}
    />
  );
}

function FieldSelect({ className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all bg-white ${className}`}
    />
  );
}

function Badge({ children, color = 'gray' }: { children: React.ReactNode; color?: 'gray' | 'green' | 'red' | 'yellow' | 'indigo' | 'orange' }) {
  const colors = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    orange: 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-2">{icon}</div>
      <p className="text-xs text-gray-400">{text}</p>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────────── */

export const ProductForm: React.FC<ProductFormProps> = ({ productId }) => {
  const router = useRouter();
  const routeParams = useParams<{ productId?: string | string[] }>();
  const routeProductId = Array.isArray(routeParams?.productId) ? routeParams.productId[0] : routeParams?.productId;
  const resolvedProductId = productId || routeProductId;

  const {
    isEditMode, isLoading, isSubmitting,
    name, setName, description, setDescription, benefits, setBenefits,
    faqs, addFaq, updateFaq, removeFaq,
    upsellProductIds, upsellOffers, upsellOptions, toggleUpsellProduct, updateUpsellOffer,
    upsellSearch, setUpsellSearch, filteredUpsellOptions,
    orderType, setOrderType, status, setStatus,
    regularPrice, setRegularPrice, salePrice, setSalePrice,
    badgeName, setBadgeName, useBasePriceForVariants, setUseBasePriceForVariants,
    globalStock, setGlobalStock,
    mainImageFile, setMainImageFile, mainImageUrl, mainImagePreview,
    galleryImageFiles, setGalleryImageFiles, galleryImages,
    setMainImageFromMedia, addGalleryImagesFromMedia, removeGalleryMedia,
    variants, updateVariant, setVariantImageFromMedia,
    bulkPrice, setBulkPrice, bulkStock, setBulkStock, applyBulkToVariants,
    videoReviews, addVideoReview, removeVideoReview, updateVideoReview, setVideoThumbnailFromMedia,
    reviews, addReview, updateReview, removeReview, setReviewAvatarFromMedia, setReviewAvatarFile, removeReviewAvatar,
    mainVideo, setMainVideoField, setMainVideoThumbnailFile, setMainVideoThumbnailFromMedia,
    filteredCollections, collections, isCollectionLoading, collectionSearch, setCollectionSearch,
    selectedCollectionIds, toggleCollection,
    brand, setBrand, gtin, setGtin, mpn, setMpn,
    mainImageAlt, setMainImageAlt, seoTitle, setSeoTitle, seoDescription, setSeoDescription,
    seoKeywords, setSeoKeywords, canonicalUrl, setCanonicalUrl, seoManualEdit, setSeoManualEdit,
    optionGroups, availableGlobalOptions, variantMode, setVariantMode,
    parentOptionKey, setParentOptionKey, childOptionKey, setChildOptionKey,
    parentGroup, childGroup, nonParentGroups,
    selectedParentValues, selectedChildValues, dependentChildSelections, setDependentChildrenForParent,
    parentImageMap, setParentValueImage, setParentValueImageFromMedia,
    addGlobalOptionDefinition, addOptionGroupToProduct, removeOptionGroupFromProduct,
    toggleOptionValueSelection, addOptionValue, updateOptionValueColor,
    regenerateVariantsFromOptions: regenerateVariants, submitProduct, submitProductUpdate,
    isProductComplete, selectedCollections,
  } = useProductForm(resolvedProductId);

  /* ── local state ── */
  const [openGeneratedVariantsByColor, setOpenGeneratedVariantsByColor] = useState<Record<string, boolean>>({});
  const [parentDropdownOpen, setParentDropdownOpen] = useState(false);
  const [selectedParentValueId, setSelectedParentValueId] = useState<string>('');
  const [mediaItems, setMediaItems] = useState<AdminMediaItem[]>([]);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaSort, setMediaSort] = useState<'new' | 'old'>('new');
  const [mediaPreviewItem, setMediaPreviewItem] = useState<AdminMediaItem | null>(null);
  const [mediaNextCursor, setMediaNextCursor] = useState<string | undefined>(undefined);
  const [isMediaPaginationLoading, setIsMediaPaginationLoading] = useState(false);
  const initialCreateSignatureRef = useRef<string | null>(null);
  const [mediaTarget, setMediaTarget] = useState<
    | { type: 'main' } | { type: 'gallery' } | { type: 'parent'; parentId: string }
    | { type: 'variant'; variantId: string } | { type: 'main-video-thumb' }
    | { type: 'video'; reviewId: string } | { type: 'review-avatar'; reviewId: string }
  >({ type: 'main' });
  const mediaTargetRef = useRef(mediaTarget);

  const [newGlobalOptionName, setNewGlobalOptionName] = useState('');
  const [newGlobalOptionType, setNewGlobalOptionType] = useState<'text' | 'color'>('text');
  const [newOptionGroupKey, setNewOptionGroupKey] = useState('');
  const [newValueByGroupId, setNewValueByGroupId] = useState<Record<string, string>>({});
  const [newColorByGroupId, setNewColorByGroupId] = useState<Record<string, string>>({});
  const [openChildDropdownByParent, setOpenChildDropdownByParent] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'media' | 'variants' | 'pricing' | 'reviews' | 'seo'>('details');
  const [bulkPanelOpen, setBulkPanelOpen] = useState(false);

  useEffect(() => { mediaTargetRef.current = mediaTarget; }, [mediaTarget]);

  const selectedVideoThumbs = useMemo(
    () => videoReviews.filter((r) => Boolean(r.thumbnailUrl)).slice(0, 10),
    [videoReviews]
  );
  const selectedMainVideoThumb = useMemo(() => mainVideo.thumbnailUrl || '', [mainVideo.thumbnailUrl]);

  useEffect(() => {
    if (!selectedParentValues.length) { if (selectedParentValueId) setSelectedParentValueId(''); return; }
    if (!selectedParentValueId || !selectedParentValues.some((e) => e.id === selectedParentValueId)) {
      setSelectedParentValueId(selectedParentValues[0].id);
    }
  }, [selectedParentValueId, selectedParentValues]);

  const activeParentValue = useMemo(
    () => selectedParentValues.find((e) => e.id === selectedParentValueId) || selectedParentValues[0] || null,
    [selectedParentValueId, selectedParentValues]
  );
  const remainingParentValues = useMemo(() => {
    if (!activeParentValue) return selectedParentValues;
    return selectedParentValues.filter((e) => e.id !== activeParentValue.id);
  }, [activeParentValue, selectedParentValues]);

  const colorPreviewByVariantColor = useMemo(() => {
    const map = new Map<string, string>();
    variants.forEach((v) => {
      const key = (v.color || '').trim().toLowerCase();
      if (!key || !v.imageUrl || map.has(key)) return;
      map.set(key, v.imageUrl);
    });
    return map;
  }, [variants]);

  const groupedGeneratedVariants = useMemo(() => {
    const map = new Map<string, { colorLabel: string; items: typeof variants }>();
    variants.forEach((v) => {
      const colorLabel = (v.color || 'Default').trim() || 'Default';
      const colorKey = colorLabel.toLowerCase();
      const existing = map.get(colorKey);
      if (!existing) { map.set(colorKey, { colorLabel, items: [v] }); return; }
      existing.items.push(v);
    });
    return Array.from(map.entries()).map(([colorKey, value]) => ({ colorKey, colorLabel: value.colorLabel, items: value.items }));
  }, [variants]);

  /* ── media helpers ── */
  async function fetchMedia(params: { search?: string; sort?: 'new' | 'old'; cursor?: string; append?: boolean }) {
    if (params.cursor) setIsMediaPaginationLoading(true); else setMediaLoading(true);
    try {
      const response = await listAdminMedia({ prefix: 'af1/products', pageSize: 20, search: params.search, sort: params.sort, cursor: params.cursor });
      if (params.append) setMediaItems((prev) => [...prev, ...(response.items || [])]);
      else setMediaItems(response.items || []);
      setMediaNextCursor(response.nextCursor);
    } catch { toast.error('Unable to load media library.'); }
    finally { setMediaLoading(false); setIsMediaPaginationLoading(false); }
  }

  async function openMediaModal(target: typeof mediaTarget) {
    mediaTargetRef.current = target; setMediaTarget(target); setMediaModalOpen(true);
    setMediaSearch(''); setMediaSort('new'); setMediaNextCursor(undefined);
    void fetchMedia({ search: '', sort: 'new' });
  }

  function applyMediaSelection(item: AdminMediaItem) {
    const target = mediaTargetRef.current;
    const asset = { url: item.secureUrl, publicId: item.publicId };
    if (target.type === 'main') { setMainImageFromMedia(asset); toast.success('Main image selected.'); setMediaModalOpen(false); return; }
    if (target.type === 'gallery') { addGalleryImagesFromMedia([asset]); toast.success('Gallery image added.'); return; }
    if (target.type === 'parent') { setParentValueImageFromMedia(target.parentId, asset); toast.success('Image selected.'); setMediaModalOpen(false); return; }
    if (target.type === 'variant') { setVariantImageFromMedia(target.variantId, asset); toast.success('Variant image selected.'); setMediaModalOpen(false); return; }
    if (target.type === 'main-video-thumb') { setMainVideoThumbnailFromMedia(asset); toast.success('Video thumbnail selected.'); setMediaModalOpen(false); return; }
    if (target.type === 'review-avatar') { setReviewAvatarFromMedia(target.reviewId, asset); toast.success('Avatar selected.'); setMediaModalOpen(false); return; }
    setVideoThumbnailFromMedia(target.reviewId, asset); toast.success('Thumbnail selected.'); setMediaModalOpen(false);
  }

  async function uploadMediaFiles(files: FileList | File[] | null) {
    if (!files || !files.length) return null;
    const batch = Array.from(files);
    const toastId = toast.loading(`Uploading ${batch.length} image${batch.length > 1 ? 's' : ''}...`);
    setUploadingMedia(true); setUploadProgress(0);
    try {
      let finished = 0; const uploaded: AdminMediaItem[] = [];
      for (const file of batch) {
        const signed = await signAdminMediaUpload('af1/products');
        const item = await uploadImageWithSignature(file, signed, (percent) => {
          setUploadProgress(Math.min(99, Math.round(((finished + percent / 100) / batch.length) * 100)));
        });
        finished += 1; setUploadProgress(Math.round((finished / batch.length) * 100)); uploaded.push(item);
      }
      if (uploaded.length) {
        setMediaItems((prev) => { const seen = new Set(prev.map((e) => e.publicId)); return [...uploaded.filter((e) => !seen.has(e.publicId)), ...prev]; });
        toast.update(toastId, { render: `${uploaded.length} image${uploaded.length > 1 ? 's' : ''} uploaded.`, type: 'success', isLoading: false, autoClose: 2500 });
      }
      return uploaded;
    } catch { 
      toast.update(toastId, { render: 'Upload failed. Please retry.', type: 'error', isLoading: false, autoClose: 3000 });
      return null;
    }
    finally { setUploadingMedia(false); setUploadProgress(0); }
  }

  async function handleSubmit(nextStatus?: 'active' | 'draft' | 'archived') {
    const isSuccess = isEditMode ? await submitProductUpdate(nextStatus) : await submitProduct(nextStatus);
    if (!isSuccess) return;
    router.push('/admin/products'); router.refresh();
  }

  const createFormSignature = useMemo(() => JSON.stringify({
    name: name.trim(), description: description.trim(), benefits: benefits.trim(), faqs,
    upsellProductIds: [...upsellProductIds].sort(),
    reviews: reviews.map((r) => ({ id: r.id, rating: r.rating, fullName: r.fullName, email: r.email, reviewText: r.reviewText, userAvatar: r.userAvatar?.publicId, userAvatarFile: Boolean(r.userAvatarFile) })),
    orderType, status, regularPrice, salePrice, badgeName: badgeName.trim(), useBasePriceForVariants,
    globalStock, selectedCollectionIds: [...selectedCollectionIds].sort(),
    mainImageFile: Boolean(mainImageFile), mainImageUrl, galleryImageFilesCount: galleryImageFiles.length,
    galleryImagesCount: galleryImages.length,
    variants: variants.map((v) => ({ id: v.id, comboKey: v.comboKey, parentValueId: v.parentValueId, size: v.size, color: v.color, sku: v.sku, stock: v.stock, price: v.price, hasImageFile: Boolean(v.imageFile), imageUrl: v.imageUrl || '', isActive: v.isActive })),
  }), [badgeName, benefits, description, faqs, galleryImageFiles.length, galleryImages.length, globalStock, mainImageFile, mainImageUrl, name, orderType, regularPrice, salePrice, reviews, selectedCollectionIds, upsellProductIds, status, useBasePriceForVariants, variants]);

  useEffect(() => {
    if (isEditMode || isLoading) return;
    if (initialCreateSignatureRef.current !== null) return;
    initialCreateSignatureRef.current = createFormSignature;
  }, [createFormSignature, isEditMode, isLoading]);

  const hasUnsavedCreateChanges = !isEditMode && !isLoading && !isSubmitting && initialCreateSignatureRef.current !== null && initialCreateSignatureRef.current !== createFormSignature;

  useEffect(() => {
    if (!hasUnsavedCreateChanges) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [hasUnsavedCreateChanges]);

  const confirmLeaveCreateFlow = () => { if (!hasUnsavedCreateChanges) return true; return window.confirm('You have unsaved changes. Leave this page?'); };

  /* ── tabs config ── */
  const tabs: Array<{ id: 'details' | 'media' | 'pricing' | 'variants' | 'reviews' | 'seo'; label: string; icon: React.ReactNode; badge?: string | number }> = [
    { id: 'details', label: 'Details', icon: <Package size={14} /> },
    { id: 'media', label: 'Media', icon: <ImageIcon size={14} /> },
    { id: 'pricing', label: 'Pricing', icon: <Tag size={14} /> },
    { id: 'variants', label: 'Variants', icon: <Grid3X3 size={14} />, badge: variants.length || undefined },
    { id: 'reviews', label: 'Reviews', icon: <MessageSquare size={14} />, badge: (reviews.length + videoReviews.length) || undefined },
    { id: 'seo', label: 'SEO', icon: <Globe size={14} /> },
  ];

  /* ─── skeleton loader ─── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
          <div className="h-10 w-48 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-white rounded-2xl border border-gray-200" />
          <div className="h-48 bg-white rounded-2xl border border-gray-200" />
        </div>
      </div>
    );
  }

  /* ─── render ─── */
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top Bar ── */}
      <div className=" bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { if (!confirmLeaveCreateFlow()) return; router.back(); }}
              className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-base font-semibold text-gray-900">{isEditMode ? 'Edit Product' : 'Add Product'}</h1>
              <p className="text-xs text-gray-400">Products / {isEditMode ? 'Edit' : 'New'}</p>
            </div>
            {hasUnsavedCreateChanges && <Badge color="yellow">Unsaved changes</Badge>}
          </div>

          <div className="flex items-center gap-2">
            {/* order type pill */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
              {(['direct', 'request'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setOrderType(t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${orderType === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {t === 'direct' ? '🛒 Direct' : '📋 Request'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => { setStatus('draft'); void handleSubmit('draft'); }}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Save Draft'}
            </button>
            <button
              type="button"
              onClick={() => { setStatus('active'); void handleSubmit('active'); }}
              disabled={isSubmitting || !isProductComplete}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : isEditMode ? 'Update' : 'Publish'}
              {!isProductComplete && <AlertCircle size={12} />}
            </button>
          </div>
        </div>

        {/* tabs */}
        <div className="sticky top-0 z-30 max-w-6xl mx-auto px-6 flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}{tab.label}
              {tab.badge ? <span className="ml-1 bg-indigo-100 text-indigo-700 rounded-full px-1.5 py-0.5 text-[10px] font-bold">{tab.badge}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ─── LEFT MAIN COLUMN ─── */}
          <div className="lg:col-span-2 space-y-5">

            {/* ══ DETAILS TAB ══ */}
            {activeTab === 'details' && (
              <div className="space-y-5">

                {/* Order type callout */}
                {orderType === 'request' && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700 font-medium">
                      <strong>Request Order Mode</strong> — Customers submit a request instead of buying directly. Price fields are optional.
                    </p>
                  </motion.div>
                )}

                {/* Basic Info */}
                <SectionCard>
                  <SectionHeader icon={<Package size={14} />} title="Product Information" subtitle="Basic details visible to customers" />
                  <div className="p-6 space-y-4">
                    <div>
                      <Label required>Product Name</Label>
                      <FieldInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tactical Combat Shirt" />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <div className="rounded-lg border border-gray-300 overflow-hidden [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[160px] [&_.ql-editor]:text-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                        <ReactQuill theme="snow" value={description} onChange={setDescription} placeholder="Describe your product…"
                          modules={{ toolbar: [[{ header: [1, 2, 3, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link', 'clean']] }} />
                      </div>
                    </div>
                    <div>
                      <Label>Key Benefits <span className="text-gray-400 font-normal ml-1">(optional)</span></Label>
                      <div className="rounded-lg border border-gray-300 overflow-hidden [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[120px] [&_.ql-editor]:text-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                        <ReactQuill theme="snow" value={benefits} onChange={setBenefits} placeholder="Add bullet points highlighting product benefits…"
                          modules={{ toolbar: [[{ header: [2, 3, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link', 'clean']] }} />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* FAQs */}
                <SectionCard>
                  <SectionHeader
                    icon={<MessageSquare size={14} />} title="Frequently Asked Questions"
                    subtitle="Help customers understand your product"
                    action={
                      <button type="button" onClick={addFaq}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-all">
                        <Plus size={12} /> Add FAQ
                      </button>
                    }
                  />
                  <div className="p-6 space-y-3">
                    <AnimatePresence>
                      {faqs.map((faq, index) => (
                        <motion.div key={faq.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                          className="rounded-xl border border-gray-200 p-4 space-y-3 bg-gray-50">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-gray-500">FAQ #{index + 1}</span>
                            <button type="button" onClick={() => removeFaq(index)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-all">
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <FieldInput value={faq.question} onChange={(e) => updateFaq(index, { question: e.target.value })} placeholder="Question" />
                          <FieldTextarea value={faq.answer} onChange={(e) => updateFaq(index, { answer: e.target.value })} rows={2} placeholder="Answer" />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {!faqs.length && <EmptyState icon={<MessageSquare size={18} />} text="No FAQs added yet. Click 'Add FAQ' to start." />}
                  </div>
                </SectionCard>

                {/* Next Button */}
                <div className="flex justify-end pt-4">
                  <button type="button" onClick={() => setActiveTab('media')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-all shadow-md">
                    Next: Media <ChevronRight size={16} />
                  </button>
                </div>

                {/* Upsell Products */}
                <SectionCard>
                  <SectionHeader icon={<ShoppingBag size={14} />} title="Upsell Products"
                    subtitle="Show related products to boost order value"
                    action={<Badge color={upsellProductIds.length ? 'indigo' : 'gray'}>{upsellProductIds.length} selected</Badge>}
                  />
                  <div className="p-6 space-y-4">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <FieldInput value={upsellSearch} onChange={(e) => setUpsellSearch(e.target.value)} placeholder="Search products…" className="pl-9" />
                    </div>

                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                      {filteredUpsellOptions.length === 0 ? (
                        <div className="py-6 text-center text-xs text-gray-400">No products found</div>
                      ) : filteredUpsellOptions.map((entry) => {
                        const checked = upsellProductIds.includes(entry.id);
                        return (
                          <label key={entry.id}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-b border-gray-100 last:border-0 ${checked ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                              {checked && <Check size={10} className="text-white" />}
                            </div>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {entry.mainImageUrl && <img src={entry.mainImageUrl} alt="" className="w-8 h-8 rounded-md object-cover border border-gray-200 flex-shrink-0" />}
                              <span className="text-sm font-medium text-gray-800 truncate">{entry.name}</span>
                            </div>
                            <span className="text-xs text-gray-500 font-medium flex-shrink-0">
                              ${Number(entry.salePrice || entry.regularPrice || entry.basePrice || 0).toFixed(2)}
                            </span>
                            <input type="checkbox" checked={checked} onChange={() => toggleUpsellProduct(entry.id)} className="hidden" />
                          </label>
                        );
                      })}
                    </div>

                    {/* Bundle pricing for selected upsells */}
                    {upsellProductIds.length > 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-2">
                        <div className="flex items-center gap-3">
                          <div className="h-px flex-1 bg-gray-100" />
                          <span className="text-xs font-semibold text-gray-400">Bundle Pricing (optional)</span>
                          <div className="h-px flex-1 bg-gray-100" />
                        </div>
                        {upsellProductIds.map((id) => {
                          const item = upsellOptions.find((o) => o.id === id);
                          if (!item) return null;
                          const mainPrice = Number(salePrice || regularPrice || 0);
                          const upsellPrice = Number(item.salePrice || item.regularPrice || item.basePrice || 0);
                          const currentTotal = mainPrice + upsellPrice;
                          return (
                            <div key={id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
                              <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                <img src={item.mainImageUrl || '/placeholder.png'} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">{item.name}</p>
                                <p className="text-[10px] text-gray-400">Regular combined: <strong className="text-gray-600">${currentTotal.toFixed(2)}</strong></p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Bundle total</span>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                  <input type="number" min="0" step="0.01" placeholder={currentTotal.toFixed(2)}
                                    value={upsellOffers[id] ?? ''}
                                    onChange={(e) => updateUpsellOffer(id, e.target.value ? Number(e.target.value) : undefined)}
                                    className="w-24 pl-6 pr-2 py-2 rounded-lg border border-gray-300 text-xs font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <p className="text-xs text-gray-400">Leave empty to use the regular combined price.</p>
                      </motion.div>
                    )}
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ══ MEDIA TAB ══ */}
            {activeTab === 'media' && (
              <div className="space-y-5">

                {/* Main Image */}
                <SectionCard>
                  <SectionHeader icon={<ImageIcon size={14} />} title="Main Product Image" subtitle="The primary image shown on listing and product page" />
                  <div className="p-6 space-y-4">
                    <div className="flex gap-3">
                      <button type="button" onClick={() => void openMediaModal({ type: 'main' })}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                        <LayoutGrid size={14} /> Media Library
                      </button>
                      <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer">
                        <Upload size={14} /> Upload File
                        <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              void openMediaModal({ type: 'main' });
                              void (async () => {
                                const uploaded = await uploadMediaFiles([file]);
                                if (uploaded && uploaded.length > 0) {
                                  setMediaPreviewItem(uploaded[0]);
                                }
                              })();
                            }
                          }} className="hidden" />
                      </label>
                    </div>

                    {mainImagePreview ? (
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50" style={{ height: 240 }}>
                        <img src={mainImagePreview} alt="Main image preview" className="w-full h-full object-contain" />
                        <div className="absolute bottom-3 left-3">
                          <Badge color="green">✓ Image selected</Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="h-40 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                        <div className="text-center">
                          <ImageIcon size={32} className="mx-auto mb-2 opacity-40" />
                          <p className="text-xs text-gray-400">No image selected</p>
                        </div>
                      </div>
                    )}

                    {mainImageFile && <p className="text-xs text-gray-500">File: {mainImageFile.name}</p>}
                    {!mainImageFile && mainImageUrl && <p className="text-xs text-green-600 font-medium">✓ Using media library image</p>}
                  </div>
                </SectionCard>

                {/* Gallery */}
                <SectionCard>
                  <SectionHeader icon={<Grid3X3 size={14} />} title="Gallery Images"
                    subtitle="Additional images shown in product carousel"
                    action={
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => void openMediaModal({ type: 'gallery' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-all">
                          <LayoutGrid size={12} /> Add from Library
                        </button>
                        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-all cursor-pointer">
                          <Upload size={12} /> Upload
                          <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files && files.length > 0) {
                                void openMediaModal({ type: 'gallery' });
                                void uploadMediaFiles(files);
                              }
                            }} className="hidden" />
                        </label>
                      </div>
                    }
                  />
                  <div className="p-6">
                    {galleryImages.length ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {galleryImages.map((item) => (
                          <div key={item.publicId} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
                            <img src={item.url} alt="Gallery" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button type="button" onClick={() => removeGalleryMedia(item.publicId)}
                                className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon={<Grid3X3 size={18} />} text="No gallery images added. Add from library or upload files." />
                    )}
                    {galleryImageFiles.length > 0 && <p className="text-xs text-gray-500 mt-2">{galleryImageFiles.length} file(s) queued for upload</p>}
                  </div>
                </SectionCard>

                {/* Main Video */}
                <SectionCard>
                  <SectionHeader icon={<Video size={14} />} title="Main Product Video" subtitle="Optional video shown on product page" />
                  <div className="p-6 space-y-4">
                    <div>
                      <Label>Video URL</Label>
                      <FieldInput value={mainVideo.url} onChange={(e) => setMainVideoField({ url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
                    </div>
                    <div>
                      <Label>Video Thumbnail</Label>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => void openMediaModal({ type: 'main-video-thumb' })}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                          <LayoutGrid size={14} /> Choose from Library
                        </button>
                        <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer">
                          <Upload size={14} /> Upload
                          <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp"
                            onChange={(e) => setMainVideoThumbnailFile(e.target.files?.[0] ?? null)} className="hidden" />
                        </label>
                      </div>
                      {mainVideo.thumbnailUrl && (
                        <div className="mt-3 w-36 h-24 rounded-xl overflow-hidden border border-gray-200 relative">
                          <img src={mainVideo.thumbnailUrl} alt="Video thumbnail" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                              <Play size={12} className="text-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </SectionCard>

                {/* Next Button */}
                <div className="flex justify-end pt-4">
                  <button type="button" onClick={() => setActiveTab('pricing')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-all shadow-md">
                    Next: Pricing <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ══ PRICING TAB ══ */}
            {activeTab === 'pricing' && (
              <div className="space-y-5">
                <SectionCard>
                  <SectionHeader icon={<Tag size={14} />} title="Pricing"
                    subtitle={orderType === 'request' ? 'Price is optional for request-type products' : 'Set the selling price for this product'}
                  />
                  <div className="p-6 space-y-4">
                    {orderType === 'request' && (
                      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                        <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-700">In Request mode, pricing is optional — customers submit inquiries instead of purchasing directly.</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label required={orderType === 'direct'}>
                          Regular Price {orderType === 'request' && <span className="text-gray-400 font-normal">(optional)</span>}
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">$</span>
                          <FieldInput type="number" min="0" value={regularPrice} onChange={(e) => setRegularPrice(e.target.value)} placeholder="0.00" className="pl-7" />
                        </div>
                      </div>
                      <div>
                        <Label>Sale Price <span className="text-gray-400 font-normal">(optional)</span></Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">$</span>
                          <FieldInput type="number" min="0" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="0.00" className="pl-7" />
                        </div>
                        {salePrice && regularPrice && Number(salePrice) < Number(regularPrice) && (
                          <p className="text-xs text-green-600 font-medium mt-1">
                            {Math.round((1 - Number(salePrice) / Number(regularPrice)) * 100)}% off
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Badge Label <span className="text-gray-400 font-normal">(optional)</span></Label>
                        <FieldInput value={badgeName} onChange={(e) => setBadgeName(e.target.value)} placeholder="e.g. New, Hot, Sale" />
                        <p className="text-xs text-gray-400 mt-1">Shown as a pill on the product card</p>
                      </div>
                      <div>
                        <Label>Global Stock</Label>
                        <FieldInput type="number" min="0" value={globalStock} onChange={(e) => setGlobalStock(e.target.value)} placeholder="0" />
                        <p className="text-xs text-gray-400 mt-1">Overridden by variant stock if variants exist</p>
                      </div>
                    </div>

                    <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-all">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Use base price for all variants</p>
                        <p className="text-xs text-gray-500">All variants will inherit the regular/sale price above</p>
                      </div>
                      <div className={`w-10 h-6 rounded-full relative transition-all ${useBasePriceForVariants ? 'bg-indigo-600' : 'bg-gray-300'}`}
                        onClick={() => setUseBasePriceForVariants(!useBasePriceForVariants)}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${useBasePriceForVariants ? 'left-5' : 'left-1'}`} />
                      </div>
                    </label>
                  </div>
                </SectionCard>

                {/* Status */}
                <SectionCard>
                  <SectionHeader icon={<BarChart3 size={14} />} title="Product Status" subtitle="Control visibility on your storefront" />
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { value: 'active', label: 'Active', desc: 'Visible to customers', color: 'green' },
                        { value: 'draft', label: 'Draft', desc: 'Hidden from storefront', color: 'gray' },
                        { value: 'archived', label: 'Archived', desc: 'Removed from store', color: 'red' },
                      ] as const).map((opt) => (
                        <button key={opt.value} type="button" onClick={() => setStatus(opt.value)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${status === opt.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className={`w-2 h-2 rounded-full mb-2 ${opt.color === 'green' ? 'bg-green-500' : opt.color === 'red' ? 'bg-red-500' : 'bg-gray-400'}`} />
                          <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </SectionCard>

                {/* Next Button */}
                <div className="flex justify-end pt-4">
                  <button type="button" onClick={() => setActiveTab('variants')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-all shadow-md">
                    Next: Variants <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ══ VARIANTS TAB ══ */}
            {activeTab === 'variants' && (
              <div className="space-y-5">

                {/* Option Setup */}
                <SectionCard>
                  <SectionHeader icon={<Layers size={14} />} title="Product Options"
                    subtitle="Define sizes, colors and other attributes"
                    action={
                      <button type="button" onClick={regenerateVariants}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-all">
                        <Wand2 size={12} /> Regenerate Variants
                      </button>
                    }
                  />
                  <div className="p-6 space-y-5">

                    {/* Variant mode */}
                    <div>
                      <Label>Variant Mode</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'global', label: 'All Combinations', desc: 'Every option combination creates a variant (e.g. S/Red, S/Blue, M/Red…)' },
                          { value: 'dependent', label: 'Parent / Child', desc: 'Child options depend on the parent selection (e.g. Color → available sizes change)' },
                        ].map((mode) => (
                          <button key={mode.value} type="button" onClick={() => setVariantMode(mode.value as 'global' | 'dependent')}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${variantMode === mode.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <p className="text-sm font-semibold text-gray-900 mb-1">{mode.label}</p>
                            <p className="text-xs text-gray-500 leading-relaxed">{mode.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Add existing global option */}
                    <div>
                      <Label>Add Option Type</Label>
                      <div className="flex gap-2">
                        <FieldSelect value={newOptionGroupKey} onChange={(e) => setNewOptionGroupKey(e.target.value)} className="flex-1">
                          <option value="">Choose from existing properties…</option>
                          {availableGlobalOptions.map((e) => <option key={e.key} value={e.key}>{e.name}</option>)}
                        </FieldSelect>
                        <button type="button"
                          onClick={() => { if (!newOptionGroupKey) return; addOptionGroupToProduct(newOptionGroupKey); setNewOptionGroupKey(''); }}
                          className="px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-all">
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Create new global option */}
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                      <p className="text-xs font-semibold text-gray-600">Or create a new option type</p>
                      <div className="flex gap-2">
                        <FieldInput value={newGlobalOptionName} onChange={(e) => setNewGlobalOptionName(e.target.value)}
                          placeholder="Option name (e.g. Sleeve Type)" className="flex-1" />
                        <FieldSelect value={newGlobalOptionType} onChange={(e) => setNewGlobalOptionType(e.target.value as 'text' | 'color')} className="w-36">
                          <option value="text">Text</option>
                          <option value="color">Color Swatch</option>
                        </FieldSelect>
                        <button type="button"
                          onClick={() => { addGlobalOptionDefinition(newGlobalOptionName, newGlobalOptionType === 'color'); setNewGlobalOptionName(''); }}
                          className="px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-all">
                          Create
                        </button>
                      </div>
                    </div>

                    {/* Dependent mode parent/child selectors */}
                    {variantMode === 'dependent' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Parent Option</Label>
                          <FieldSelect value={parentOptionKey} onChange={(e) => setParentOptionKey(e.target.value)}>
                            {optionGroups.map((e) => <option key={e.key} value={e.key}>{e.name}</option>)}
                          </FieldSelect>
                        </div>
                        <div>
                          <Label>Child Option</Label>
                          <FieldSelect value={childOptionKey} onChange={(e) => setChildOptionKey(e.target.value)}>
                            <option value="">None</option>
                            {nonParentGroups.map((e) => <option key={e.key} value={e.key}>{e.name}</option>)}
                          </FieldSelect>
                        </div>
                      </div>
                    )}

                    {/* Option groups */}
                    {optionGroups.length > 0 && (
                      <div className="space-y-4 pt-2">
                        <div className="h-px bg-gray-100" />
                        {optionGroups.map((group) => (
                          <div key={group.id} className="rounded-xl border border-gray-200 overflow-hidden">
                            <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                              <div className="flex items-center gap-2">
                                {group.isColor ? <Palette size={13} className="text-gray-500" /> : <List size={13} className="text-gray-500" />}
                                <span className="text-sm font-semibold text-gray-900">{group.name}</span>
                                <Badge color={group.isColor ? 'orange' : 'gray'}>{group.isColor ? 'Color' : 'Text'}</Badge>
                              </div>
                              <button type="button" onClick={() => removeOptionGroupFromProduct(group.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-all">
                                <X size={13} />
                              </button>
                            </div>
                            <div className="p-4 space-y-3">
                              {/* Value pills */}
                              <div className="flex flex-wrap gap-2">
                                {group.values.map((value) => {
                                  const active = group.selectedValueIds.includes(value.id);
                                  return (
                                    <button key={value.id} type="button" onClick={() => toggleOptionValueSelection(group.id, value.id)}
                                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-xs font-semibold transition-all ${active ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                                      {group.isColor && <span className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: value.colorHex || '#000' }} />}
                                      {value.label}
                                      {active && <Check size={10} />}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Color pickers */}
                              {group.isColor && group.values.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {group.values.map((value) => (
                                    <label key={value.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
                                      <span className="text-xs font-medium text-gray-700">{value.label}</span>
                                      <input type="color" value={value.colorHex || '#000000'}
                                        onChange={(e) => updateOptionValueColor(group.id, value.id, e.target.value)}
                                        className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white" />
                                    </label>
                                  ))}
                                </div>
                              )}

                              {/* Add new value */}
                              <div className="flex gap-2 pt-1">
                                <FieldInput value={newValueByGroupId[group.id] || ''} onChange={(e) => setNewValueByGroupId((p) => ({ ...p, [group.id]: e.target.value }))}
                                  placeholder={`Add ${group.name} value…`} />
                                {group.isColor && (
                                  <input type="color" value={newColorByGroupId[group.id] || '#000000'}
                                    onChange={(e) => setNewColorByGroupId((p) => ({ ...p, [group.id]: e.target.value }))}
                                    className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer p-1 bg-white" />
                                )}
                                <button type="button"
                                  onClick={() => { addOptionValue(group.id, newValueByGroupId[group.id] || '', newColorByGroupId[group.id] || '#000000'); setNewValueByGroupId((p) => ({ ...p, [group.id]: '' })); }}
                                  className="px-3 py-2.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-all whitespace-nowrap">
                                  <Plus size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Dependent mode parent mapping */}
                    {variantMode === 'dependent' && parentGroup && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                        <p className="text-xs font-semibold text-amber-800">Parent mapping: {parentGroup.name} → {childGroup?.name || 'Single variant'}</p>

                        {activeParentValue && (
                          <div className="relative">
                            <button type="button" onClick={() => setParentDropdownOpen((p) => !p)}
                              className="w-full flex items-center justify-between rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-sm font-medium">
                              <div className="flex items-center gap-2">
                                {parentGroup.isColor && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeParentValue.colorHex || '#000' }} />}
                                {activeParentValue.label}
                              </div>
                              <div className="flex items-center gap-2">
                                {remainingParentValues.length > 0 && <span className="text-xs text-gray-400">+{remainingParentValues.length} more</span>}
                                <ChevronDown size={14} className={`text-gray-400 transition-transform ${parentDropdownOpen ? 'rotate-180' : ''}`} />
                              </div>
                            </button>
                            {parentDropdownOpen && (
                              <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-48 overflow-auto">
                                {remainingParentValues.map((pv) => (
                                  <button key={pv.id} type="button" onClick={() => { setSelectedParentValueId(pv.id); setParentDropdownOpen(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-gray-50">
                                    {parentGroup.isColor && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pv.colorHex || '#000' }} />}
                                    {pv.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {(activeParentValue ? [activeParentValue] : []).map((parentValue) => {
                          const selectedChildren = dependentChildSelections[parentValue.id] || [];
                          return (
                            <div key={parentValue.id} className="rounded-lg border border-amber-200 bg-white p-3 space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                  {parentGroup.isColor && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: parentValue.colorHex || '#000' }} />}
                                  {parentValue.label}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button type="button" onClick={() => void openMediaModal({ type: 'parent', parentId: parentValue.id })}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                                    <ImageIcon size={11} /> Image
                                  </button>
                                  <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
                                    <Upload size={11} />
                                    <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp"
                                      onChange={(e) => setParentValueImage(parentValue.id, e.target.files?.[0] ?? null)} className="hidden" />
                                  </label>
                                </div>
                              </div>

                              {parentImageMap[parentValue.id]?.previewUrl && (
                                <img src={parentImageMap[parentValue.id].previewUrl} alt={parentValue.label}
                                  className="w-24 h-18 object-cover rounded-lg border border-gray-200" />
                              )}

                              {childGroup && (
                                <div>
                                  <button type="button"
                                    onClick={() => setOpenChildDropdownByParent((p) => ({ ...p, [parentValue.id]: !p[parentValue.id] }))}
                                    className="flex items-center justify-between w-full text-xs font-semibold text-gray-600 hover:text-gray-900">
                                    <span>Available {childGroup.name} ({selectedChildren.length || selectedChildValues.length} selected)</span>
                                    <ChevronDown size={12} className={`transition-transform ${openChildDropdownByParent[parentValue.id] ? 'rotate-180' : ''}`} />
                                  </button>
                                  {openChildDropdownByParent[parentValue.id] && (
                                    <div className="mt-2 max-h-40 overflow-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                                      {selectedChildValues.map((cv) => {
                                        const active = selectedChildren.includes(cv.id);
                                        return (
                                          <label key={cv.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${active ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                              {active && <Check size={10} className="text-white" />}
                                            </div>
                                            <span className="text-xs font-medium text-gray-700">{cv.label}</span>
                                            <input type="checkbox" checked={active} className="hidden"
                                              onChange={() => {
                                                const next = active ? selectedChildren.filter((id) => id !== cv.id) : [...selectedChildren, cv.id];
                                                setDependentChildrenForParent(parentValue.id, next);
                                              }} />
                                          </label>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </SectionCard>

                {/* Generated Variants */}
                {variants.length > 0 && (
                  <SectionCard>
                    <SectionHeader icon={<Package size={14} />} title="Generated Variants"
                      subtitle="Set price, stock and image for each variant"
                      action={
                        <div className="flex items-center gap-2">
                          <Badge color="indigo">{variants.length} variants</Badge>
                          <button type="button" onClick={() => setBulkPanelOpen((p) => !p)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-all">
                            <Sparkles size={12} /> Bulk Edit
                          </button>
                        </div>
                      }
                    />

                    {/* Bulk edit panel */}
                    <AnimatePresence>
                      {bulkPanelOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-b border-gray-100">
                          <div className="px-6 py-4 bg-indigo-50/50 space-y-3">
                            <p className="text-xs font-semibold text-indigo-700">Apply to all variants</p>
                            <div className="flex gap-3 flex-wrap">
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                <input type="number" min="0" value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value)} placeholder="Price"
                                  className="w-28 pl-6 pr-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-500" />
                              </div>
                              <input type="number" min="0" value={bulkStock} onChange={(e) => setBulkStock(e.target.value)} placeholder="Stock qty"
                                className="w-28 px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-500" />
                              <button type="button" onClick={applyBulkToVariants}
                                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all">
                                Apply to all
                              </button>
                            </div>
                            <p className="text-xs text-indigo-600/70">Leave a field empty to keep existing values for that field.</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="p-6 space-y-4">
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                        <Info size={14} className="text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-700">
                          Tip: Upload an image for the first variant of each color group — it will be shared across all sizes of that color automatically.
                        </p>
                      </div>

                      {groupedGeneratedVariants.map((group) => {
                        const isOpen = Boolean(openGeneratedVariantsByColor[group.colorKey]);
                        const visibleItems = isOpen ? group.items : group.items.slice(0, 1);
                        const colorPreview = colorPreviewByVariantColor.get(group.colorKey);

                        return (
                          <div key={group.colorKey} className="rounded-xl border border-gray-200 overflow-hidden">
                            {/* Color group header */}
                            <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                              <div className="flex items-center gap-3">
                                {colorPreview ? (
                                  <img src={colorPreview} alt={group.colorLabel} className="w-8 h-8 rounded-md object-cover border border-gray-200" />
                                ) : (
                                  <div className="w-8 h-8 rounded-md bg-gray-200 flex items-center justify-center">
                                    <Palette size={13} className="text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{group.colorLabel}</p>
                                  <p className="text-xs text-gray-400">{group.items.length} size{group.items.length !== 1 ? 's' : ''}</p>
                                </div>
                              </div>
                              {group.items.length > 1 && (
                                <button type="button"
                                  onClick={() => setOpenGeneratedVariantsByColor((p) => ({ ...p, [group.colorKey]: !p[group.colorKey] }))}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                                  {isOpen ? <><EyeOff size={11} /> Hide sizes</> : <><Eye size={11} /> Show {group.items.length - 1} more</>}
                                </button>
                              )}
                            </div>

                            {/* Variant rows */}
                            <div className="divide-y divide-gray-100">
                              {visibleItems.map((variant, idx) => {
                                const inheritedImage = colorPreviewByVariantColor.get((variant.color || '').trim().toLowerCase());
                                const displayImage = variant.imageUrl || (idx === 0 ? undefined : inheritedImage);

                                return (
                                  <div key={variant.id} className="p-4 space-y-3">
                                    {/* Variant label + inputs row */}
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <div className="flex items-center gap-2 min-w-0">
                                        {variant.colorHex && <span className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0" style={{ backgroundColor: variant.colorHex }} />}
                                        <span className="text-sm font-semibold text-gray-800 truncate">{variant.optionSummary}</span>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                      <div>
                                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">SKU</label>
                                        <FieldInput value={variant.sku} onChange={(e) => updateVariant(variant.id, { sku: e.target.value })} placeholder="SKU-001" />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Price</label>
                                        <div className="relative">
                                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                          <FieldInput type="number" min="0" value={variant.price} disabled={useBasePriceForVariants}
                                            onChange={(e) => updateVariant(variant.id, { price: e.target.value })}
                                            placeholder="0.00" className="pl-6 disabled:bg-gray-100 disabled:text-gray-400" />
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Stock</label>
                                        <FieldInput type="number" min="0" value={variant.stock}
                                          onChange={(e) => updateVariant(variant.id, { stock: Number(e.target.value) })} placeholder="0" />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Image</label>
                                        <div className="flex gap-1.5">
                                          <button type="button" onClick={() => void openMediaModal({ type: 'variant', variantId: variant.id })}
                                            className="flex-1 flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                                            <LayoutGrid size={11} />
                                          </button>
                                          <label className="flex-1 flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer">
                                            <Upload size={11} />
                                            <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden"
                                              onChange={(e) => updateVariant(variant.id, { imageFile: e.target.files?.[0] ?? undefined, imageUrl: undefined, imagePublicId: undefined })} />
                                          </label>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Image preview */}
                                    {displayImage && (
                                      <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-200">
                                        <img src={displayImage} alt={variant.optionSummary}
                                          className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                                        <div>
                                          <p className="text-xs font-semibold text-gray-700">
                                            {variant.imageUrl ? 'Custom image' : 'Inherited from color group'}
                                          </p>
                                          {!variant.imageUrl && <p className="text-[10px] text-gray-400">Upload to override for this size</p>}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </SectionCard>
                )}

                {/* Next Button */}
                <div className="flex justify-end pt-4">
                  <button type="button" onClick={() => setActiveTab('reviews')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-all shadow-md">
                    Next: Reviews <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ══ REVIEWS TAB ══ */}
            {activeTab === 'reviews' && (
              <div className="space-y-5">

                {/* Video Reviews */}
                <SectionCard>
                  <SectionHeader icon={<Play size={14} />} title="Video Reviews"
                    subtitle="Customer video testimonials"
                    action={
                      <button type="button" onClick={addVideoReview}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-all">
                        <Plus size={12} /> Add Video
                      </button>
                    }
                  />
                  <div className="p-6 space-y-3">
                    <AnimatePresence>
                      {videoReviews.map((review) => (
                        <motion.div key={review.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="rounded-xl border border-gray-200 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-600">Video Review</p>
                            <button type="button" onClick={() => removeVideoReview(review.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50">
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <FieldInput value={review.url} onChange={(e) => updateVideoReview(review.id, { url: e.target.value })} placeholder="Video URL" />
                          <div>
                            <Label>Thumbnail</Label>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => void openMediaModal({ type: 'video', reviewId: review.id })}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                                <LayoutGrid size={11} /> Library
                              </button>
                              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
                                <Upload size={11} /> Upload
                                <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden"
                                  onChange={(e) => updateVideoReview(review.id, { thumbnailFile: e.target.files?.[0] ?? undefined, thumbnailPublicId: undefined })} />
                              </label>
                              {review.thumbnailUrl && (
                                <img src={review.thumbnailUrl} alt="thumb" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {!videoReviews.length && <EmptyState icon={<Play size={18} />} text="No video reviews yet." />}
                  </div>
                </SectionCard>

                {/* Text Reviews */}
                <SectionCard>
                  <SectionHeader icon={<Star size={14} />} title="Product Reviews"
                    subtitle="Manage customer text reviews"
                    action={
                      <button type="button" onClick={addReview}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-all">
                        <Plus size={12} /> Add Review
                      </button>
                    }
                  />
                  <div className="p-6 space-y-4">
                    <AnimatePresence>
                      {reviews.map((review) => (
                        <motion.div key={review.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="rounded-xl border border-gray-200 p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((v) => (
                                <button key={v} type="button"
                                  onClick={() => updateReview(review.id, { rating: v, source: 'admin', isPublished: true })}>
                                  <Star size={18} className={review.rating >= v ? 'fill-orange-400 text-orange-400' : 'text-gray-200'} />
                                </button>
                              ))}
                            </div>
                            <button type="button" onClick={() => removeReview(review.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50">
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Full Name</Label>
                              <FieldInput value={review.fullName} onChange={(e) => updateReview(review.id, { fullName: e.target.value, source: 'admin', isPublished: true })} placeholder="Jane Smith" />
                            </div>
                            <div>
                              <Label>Email</Label>
                              <FieldInput type="email" value={review.email} onChange={(e) => updateReview(review.id, { email: e.target.value, source: 'admin', isPublished: true })} placeholder="jane@example.com" />
                            </div>
                          </div>

                          <div>
                            <Label>Review Text</Label>
                            <FieldTextarea rows={3} value={review.reviewText}
                              onChange={(e) => updateReview(review.id, { reviewText: e.target.value, source: 'admin', isPublished: true })}
                              placeholder="Customer's experience…" />
                          </div>

                          <div>
                            <Label>Avatar <span className="text-gray-400 font-normal">(optional)</span></Label>
                            <div className="flex items-center gap-3">
                              {(review.userAvatar || review.userAvatarFile) && (
                                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                                  <img src={review.userAvatarFile ? URL.createObjectURL(review.userAvatarFile) : review.userAvatar?.url} alt="Avatar" className="w-full h-full object-cover" />
                                  <button type="button" onClick={() => removeReviewAvatar(review.id)}
                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                    <X size={12} className="text-white" />
                                  </button>
                                </div>
                              )}
                              <div className="flex gap-2">
                                <button type="button" onClick={() => void openMediaModal({ type: 'review-avatar', reviewId: review.id })}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                                  <LayoutGrid size={11} /> Library
                                </button>
                                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
                                  <Upload size={11} /> Upload
                                  <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden"
                                    onChange={(e) => setReviewAvatarFile(review.id, e.target.files?.[0])} />
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge color="green">Published</Badge>
                            <Badge color="gray">Admin</Badge>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {!reviews.length && <EmptyState icon={<Star size={18} />} text="No reviews added yet." />}
                  </div>
                </SectionCard>

                {/* Next Button */}
                <div className="flex justify-end pt-4">
                  <button type="button" onClick={() => setActiveTab('seo')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-all shadow-md">
                    Next: SEO <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ══ SEO TAB ══ */}
            {activeTab === 'seo' && (
              <div className="space-y-5">
                <SectionCard>
                  <SectionHeader icon={<Globe size={14} />} title="Search Engine Optimization"
                    subtitle="Control how this product appears in search results"
                    action={
                      <button type="button" onClick={() => setSeoManualEdit(!seoManualEdit)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${seoManualEdit ? 'bg-indigo-600 text-white' : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
                        {seoManualEdit ? <><EyeOff size={12} /> Auto Mode</> : <><Eye size={12} /> Edit Manually</>}
                      </button>
                    }
                  />
                  <div className="p-6 space-y-5">
                    {/* Search preview */}
                    <div className="rounded-xl border border-gray-200 p-5 bg-white space-y-1">
                      <p className="text-xs text-[#202124] flex items-center gap-1">
                        athleticforce1.com <ChevronRight size={10} /> products <ChevronRight size={10} /> {name ? name.toLowerCase().replace(/\s+/g, '-') : '...'}
                      </p>
                      <p className="text-lg text-[#1a0dab] hover:underline cursor-pointer font-normal truncate">
                        {(seoManualEdit && seoTitle) ? seoTitle : (seoTitle || name || 'Product Name')} | Athletic Force 1
                      </p>
                      <p className="text-sm text-[#4d5156] line-clamp-2 leading-relaxed">
                        {(seoManualEdit && seoDescription) ? seoDescription
                          : (seoDescription || description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
                            || 'Complete your tactical gear with Athletic Force 1...')}
                      </p>
                    </div>

                    <AnimatePresence>
                      {seoManualEdit && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><Label>SEO Title</Label><FieldInput value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder={name || 'Custom title'} /></div>
                            <div><Label>Canonical URL</Label><FieldInput value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} placeholder="/products/your-slug" /></div>
                          </div>
                          <div><Label>Meta Description</Label><FieldTextarea rows={3} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="Shown in search results…" /></div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><Label>Keywords</Label><FieldInput value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} placeholder="tactical, gear, uniform…" /></div>
                            <div><Label>Main Image Alt Text</Label><FieldInput value={mainImageAlt} onChange={(e) => setMainImageAlt(e.target.value)} placeholder="Descriptive alt text…" /></div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-600 mb-3">Structured Data</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div><Label>Brand</Label><FieldInput value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Athletic Force 1" /></div>
                        <div><Label>GTIN / UPC</Label><FieldInput value={gtin} onChange={(e) => setGtin(e.target.value)} placeholder="123456789012" /></div>
                        <div><Label>MPN</Label><FieldInput value={mpn} onChange={(e) => setMpn(e.target.value)} placeholder="AF1-TAC-001" /></div>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

          </div>

          {/* ─── RIGHT SIDEBAR ─── */}
          <div className="space-y-5">

            {/* Quick summary */}
            <SectionCard>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Product Summary</p>
                  <Badge color={status === 'active' ? 'green' : status === 'draft' ? 'gray' : 'red'}>{status}</Badge>
                </div>

                {mainImagePreview && (
                  <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={mainImagePreview} alt="Preview" className="w-full h-36 object-cover" />
                  </div>
                )}

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Order Type</span>
                    <Badge color={orderType === 'direct' ? 'indigo' : 'orange'}>{orderType === 'direct' ? '🛒 Direct' : '📋 Request'}</Badge>
                  </div>
                  {regularPrice && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Price</span>
                      <span className="font-semibold text-gray-800">
                        {salePrice ? <><span className="line-through text-gray-400 mr-1">${regularPrice}</span>${salePrice}</> : `$${regularPrice}`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Variants</span>
                    <span className="font-semibold text-gray-800">{variants.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Gallery</span>
                    <span className="font-semibold text-gray-800">{galleryImages.length} images</span>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Collections */}
            <SectionCard>
              <SectionHeader icon={<Layers size={14} />} title="Collections" subtitle="Assign to one or more collections" />
              <div className="p-5 space-y-4">
                {/* Selected collections preview */}
                {selectedCollections.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-2">
                    {selectedCollections.map((col) => (
                      <Badge key={col.id} color="orange">
                        {col.name}
                        <button type="button" onClick={() => toggleCollection(col.id)} className="ml-1 hover:text-orange-900">
                          <X size={10} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <FieldInput value={collectionSearch} onChange={(e) => setCollectionSearch(e.target.value)} placeholder="Search collections…" className="pl-8 text-xs" />
                </div>

                <div className="border border-gray-200 rounded-xl max-h-64 overflow-y-auto">
                  {isCollectionLoading ? (
                    <div className="py-6 text-center text-xs text-gray-400">Loading…</div>
                  ) : filteredCollections.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-400">No collections found</div>
                  ) : (() => {
                    const parents = filteredCollections.filter((c) => !c.parentId);
                    const subs = filteredCollections.filter((c) => c.parentId);
                    const visibleParentIds = new Set(parents.map((p) => p.id));
                    const orphanSubs = subs.filter((s) => !visibleParentIds.has(s.parentId as string));

                    return (
                      <div className="divide-y divide-gray-100">
                        {parents.map((parent) => {
                          const children = subs.filter((s) => s.parentId === parent.id);
                          const isSelected = selectedCollectionIds.includes(parent.id);
                          const isAutoSelected = isSelected && children.some((c) => selectedCollectionIds.includes(c.id));
                          return (
                            <div key={parent.id}>
                              <label className={`flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer transition-all ${isAutoSelected ? 'bg-orange-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-800">{parent.name}</span>
                                  {isAutoSelected && <Badge color="orange">Auto</Badge>}
                                </div>
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}>
                                  {isSelected && <Check size={10} className="text-white" />}
                                </div>
                                <input type="checkbox" checked={isSelected} disabled={isAutoSelected} onChange={() => toggleCollection(parent.id)} className="hidden" />
                              </label>
                              {children.map((child) => (
                                <label key={child.id} className="flex items-center justify-between gap-2 pl-8 pr-3 py-2 hover:bg-gray-50 cursor-pointer transition-all">
                                  <span className="text-xs text-gray-600">{child.name}</span>
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedCollectionIds.includes(child.id) ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}>
                                    {selectedCollectionIds.includes(child.id) && <Check size={10} className="text-white" />}
                                  </div>
                                  <input type="checkbox" checked={selectedCollectionIds.includes(child.id)} onChange={() => toggleCollection(child.id)} className="hidden" />
                                </label>
                              ))}
                            </div>
                          );
                        })}
                        {orphanSubs.map((entry) => (
                          <label key={entry.id} className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-all">
                            <span className="text-xs font-semibold text-gray-700">{entry.name}</span>
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedCollectionIds.includes(entry.id) ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}>
                              {selectedCollectionIds.includes(entry.id) && <Check size={10} className="text-white" />}
                            </div>
                            <input type="checkbox" checked={selectedCollectionIds.includes(entry.id)} onChange={() => toggleCollection(entry.id)} className="hidden" />
                          </label>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                <p className="text-xs text-gray-400">
                  {selectedCollectionIds.filter((id) => {
                    const col = filteredCollections.find((c) => c.id === id) ?? collections.find((c) => c.id === id);
                    return Boolean(col?.parentId);
                  }).length} subcollection(s) selected
                </p>
              </div>
            </SectionCard>

            {/* Media thumbnails */}
            {(mainImagePreview || selectedMainVideoThumb || galleryImages.length || selectedVideoThumbs.length) ? (
              <SectionCard>
                <SectionHeader icon={<ImageIcon size={14} />} title="Selected Media" />
                <div className="p-4 grid grid-cols-3 gap-2">
                  {mainImagePreview && (
                    <div className="relative rounded-xl overflow-hidden aspect-square border border-gray-200">
                      <img src={mainImagePreview} alt="Main" className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[9px] text-center py-0.5 font-bold">MAIN</div>
                    </div>
                  )}
                  {selectedMainVideoThumb && (
                    <div className="relative rounded-xl overflow-hidden aspect-square border border-gray-200">
                      <img src={selectedMainVideoThumb} alt="Video" className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[9px] text-center py-0.5 font-bold">VIDEO</div>
                    </div>
                  )}
                  {galleryImages.map((item) => (
                    <div key={item.publicId} className="rounded-xl overflow-hidden aspect-square border border-gray-200">
                      <img src={item.url} alt="Gallery" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {selectedVideoThumbs.map((r) => (
                    <div key={r.id} className="rounded-xl overflow-hidden aspect-square border border-gray-200">
                      <img src={r.thumbnailUrl} alt="Video thumb" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </SectionCard>
            ) : null}

            {/* Bottom save actions in sidebar */}
            <div className="space-y-2">
              <button type="button" onClick={() => { setStatus('active'); void handleSubmit('active'); }}
                disabled={isSubmitting || !isProductComplete}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2">
                {isSubmitting ? 'Publishing…' : isEditMode ? 'Update Product' : 'Publish Product'}
                {!isProductComplete && <AlertCircle size={14} />}
              </button>
              <button type="button" onClick={() => { setStatus('draft'); void handleSubmit('draft'); }}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 disabled:opacity-50 transition-all">
                Save as Draft
              </button>
              <button type="button" onClick={() => { if (!confirmLeaveCreateFlow()) return; router.push('/admin/products'); }}
                className="w-full py-2.5 rounded-xl text-gray-400 font-medium text-sm hover:text-gray-600 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MEDIA MODAL ─── */}
      <AnimatePresence>
        {mediaModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

              {/* Modal header */}
              <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Media Library</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Upload once, reuse across products</p>
                </div>
                <button type="button" onClick={() => setMediaModalOpen(false)}
                  className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all">
                  <X size={16} />
                </button>
              </div>

              {/* Modal toolbar */}
              <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={mediaSearch}
                    onChange={(e) => { setMediaSearch(e.target.value); void fetchMedia({ search: e.target.value, sort: mediaSort }); }}
                    placeholder="Search images…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />
                </div>
                <FieldSelect value={mediaSort} onChange={(e) => { const s = e.target.value as 'new' | 'old'; setMediaSort(s); void fetchMedia({ search: mediaSearch, sort: s }); }} className="w-40">
                  <option value="new">Newest first</option>
                  <option value="old">Oldest first</option>
                </FieldSelect>
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-all cursor-pointer">
                  <Upload size={14} /> Upload
                  <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple 
                    onChange={(e) => {
                      void (async () => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        const uploaded = await uploadMediaFiles(files);
                        if (uploaded && uploaded.length > 0) {
                          setMediaPreviewItem(uploaded[0]);
                          if (mediaTarget.type !== 'gallery') {
                            // For single selection, we can auto-apply if we want, 
                            // but the user said "auto select" so let's set as preview.
                          }
                        }
                      })();
                    }} className="hidden" />
                </label>

                {uploadingMedia && (
                  <div className="w-full space-y-1">
                    <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} className="h-full bg-indigo-500 rounded-full" />
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Uploading… {uploadProgress}%</p>
                  </div>
                )}
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Modal grid */}
                <div className="flex-1 overflow-y-auto p-6 border-r border-gray-100">
                  {mediaLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {[...Array(12)].map((_, i) => <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />)}
                    </div>
                  ) : mediaItems.length === 0 ? (
                    <EmptyState icon={<ImageIcon size={24} />} text="No images found. Try a different search or upload new files." />
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {mediaItems.map((item) => {
                          const isSelectedPreview = mediaPreviewItem?.publicId === item.publicId;
                          return (
                            <button key={item.publicId} type="button" onClick={() => setMediaPreviewItem(item)}
                              className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all bg-gray-50 ${isSelectedPreview ? 'border-indigo-600 ring-2 ring-indigo-600/10' : 'border-gray-200 hover:border-gray-300'}`}>
                              <img src={item.secureUrl} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                              <div className={`absolute inset-0 transition-all flex items-center justify-center ${isSelectedPreview ? 'bg-indigo-600/10' : 'group-hover:bg-black/5'}`}>
                                {isSelectedPreview && (
                                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg animate-in fade-in zoom-in duration-200">
                                    <Check size={14} />
                                  </div>
                                )}
                              </div>
                              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-[9px] font-semibold text-white truncate">{item.publicId.split('/').pop()}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {mediaNextCursor && (
                        <div className="flex justify-center">
                          <button type="button"
                            onClick={() => void fetchMedia({ search: mediaSearch, sort: mediaSort, cursor: mediaNextCursor, append: true })}
                            disabled={isMediaPaginationLoading}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all">
                            {isMediaPaginationLoading ? <Loader2 size={14} className="animate-spin" /> : 'Load more'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="w-80 flex flex-col bg-gray-50/50">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {mediaPreviewItem ? (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                          <img src={mediaPreviewItem.secureUrl} alt="Preview" className="w-full h-full object-contain" />
                        </div>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">File Details</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between gap-4">
                                <span className="text-xs text-gray-500">Name</span>
                                <span className="text-xs font-semibold text-gray-900 truncate max-w-[120px]">{mediaPreviewItem.publicId.split('/').pop()}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-xs text-gray-500">Dimensions</span>
                                <span className="text-xs font-semibold text-gray-900">{mediaPreviewItem.width} × {mediaPreviewItem.height}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-xs text-gray-500">Format</span>
                                <span className="text-xs font-semibold text-gray-900 uppercase">{mediaPreviewItem.format}</span>
                              </div>
                            </div>
                          </div>
                          
                          {mediaTarget.type === 'gallery' && (
                            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                              <p className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wide mb-1">Gallery Mode</p>
                              <p className="text-xs text-indigo-600 leading-relaxed">Images are added immediately when clicked. Click Done to finish.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-40">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <ImageIcon size={20} className="text-gray-400" />
                        </div>
                        <p className="text-xs font-medium text-gray-500">Select an image to see details</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-6 border-t border-gray-100 bg-white grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setMediaModalOpen(false)}
                      className="py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                      Close
                    </button>
                    <button type="button" 
                      onClick={() => {
                        if (mediaPreviewItem) {
                          applyMediaSelection(mediaPreviewItem);
                          if (mediaTarget.type !== 'gallery') {
                            setMediaModalOpen(false);
                          }
                        }
                      }}
                      disabled={!mediaPreviewItem}
                      className="py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md">
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};