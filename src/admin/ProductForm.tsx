"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Search, Trash2, Wand2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useProductForm } from './hooks/useProductForm';
import { listAdminMedia, signAdminMediaUpload, uploadImageWithSignature, type AdminMediaItem } from '@/lib/api/media';

type ProductFormProps = {
  productId?: string;
};

export const ProductForm: React.FC<ProductFormProps> = ({ productId }) => {
  const router = useRouter();
  const routeParams = useParams<{ productId?: string | string[] }>();
  const routeProductId = Array.isArray(routeParams?.productId) ? routeParams.productId[0] : routeParams?.productId;
  const resolvedProductId = productId || routeProductId;

  const {
    isEditMode,
    isLoading,
    isSubmitting,
    name,
    setName,
    description,
    setDescription,
    orderType,
    setOrderType,
    status,
    setStatus,
    regularPrice,
    setRegularPrice,
    salePrice,
    setSalePrice,
    badgeName,
    setBadgeName,
    useBasePriceForVariants,
    setUseBasePriceForVariants,
    globalStock,
    setGlobalStock,
    mainImageFile,
    setMainImageFile,
    mainImageUrl,
    mainImagePreview,
    galleryImageFiles,
    setGalleryImageFiles,
    galleryImages,
    setMainImageFromMedia,
    addGalleryImagesFromMedia,
    removeGalleryMedia,
    variants,
    updateVariant,
    setVariantImageFromMedia,
    bulkPrice,
    setBulkPrice,
    bulkStock,
    setBulkStock,
    applyBulkToVariants,
    videoReviews,
    addVideoReview,
    removeVideoReview,
    updateVideoReview,
    setVideoThumbnailFromMedia,
    mainVideo,
    setMainVideoField,
    setMainVideoThumbnailFile,
    setMainVideoThumbnailFromMedia,
    filteredCollections,
    isCollectionLoading,
    collectionSearch,
    setCollectionSearch,
    selectedCollectionIds,
    toggleCollection,
    optionGroups,
    availableGlobalOptions,
    variantMode,
    setVariantMode,
    parentOptionKey,
    setParentOptionKey,
    childOptionKey,
    setChildOptionKey,
    parentGroup,
    childGroup,
    nonParentGroups,
    selectedParentValues,
    selectedChildValues,
    dependentChildSelections,
    setDependentChildrenForParent,
    parentImageMap,
    setParentValueImage,
    setParentValueImageFromMedia,
    addGlobalOptionDefinition,
    addOptionGroupToProduct,
    removeOptionGroupFromProduct,
    toggleOptionValueSelection,
    addOptionValue,
    updateOptionValueColor,
    regenerateVariantsFromOptions,
    submitProduct,
    submitProductUpdate,
  } = useProductForm(resolvedProductId);

  const [newGlobalOptionName, setNewGlobalOptionName] = useState('');
  const [newGlobalOptionType, setNewGlobalOptionType] = useState<'text' | 'color'>('text');
  const [newOptionGroupKey, setNewOptionGroupKey] = useState('');
  const [newValueByGroupId, setNewValueByGroupId] = useState<Record<string, string>>({});
  const [newColorByGroupId, setNewColorByGroupId] = useState<Record<string, string>>({});
  const [openChildDropdownByParent, setOpenChildDropdownByParent] = useState<Record<string, boolean>>({});
  const [openGeneratedVariantsByColor, setOpenGeneratedVariantsByColor] = useState<Record<string, boolean>>({});
  const [parentDropdownOpen, setParentDropdownOpen] = useState(false);
  const [selectedParentValueId, setSelectedParentValueId] = useState<string>('');
  const [mediaItems, setMediaItems] = useState<AdminMediaItem[]>([]);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const initialCreateSignatureRef = useRef<string | null>(null);
  const [mediaTarget, setMediaTarget] = useState<
    | { type: 'main' }
    | { type: 'gallery' }
    | { type: 'parent'; parentId: string }
    | { type: 'variant'; variantId: string }
    | { type: 'main-video-thumb' }
    | { type: 'video'; reviewId: string }
  >({ type: 'main' });
  const mediaTargetRef = useRef(mediaTarget);

  useEffect(() => {
    mediaTargetRef.current = mediaTarget;
  }, [mediaTarget]);

  const selectedVideoThumbs = useMemo(
    () => videoReviews.filter((review) => Boolean(review.thumbnailUrl)).slice(0, 10),
    [videoReviews]
  );

  const selectedMainVideoThumb = useMemo(() => mainVideo.thumbnailUrl || '', [mainVideo.thumbnailUrl]);

  useEffect(() => {
    if (!selectedParentValues.length) {
      if (selectedParentValueId) {
        setSelectedParentValueId('');
      }
      return;
    }

    if (!selectedParentValueId || !selectedParentValues.some((entry) => entry.id === selectedParentValueId)) {
      setSelectedParentValueId(selectedParentValues[0].id);
    }
  }, [selectedParentValueId, selectedParentValues]);

  const activeParentValue = useMemo(
    () => selectedParentValues.find((entry) => entry.id === selectedParentValueId) || selectedParentValues[0] || null,
    [selectedParentValueId, selectedParentValues]
  );

  const remainingParentValues = useMemo(() => {
    if (!activeParentValue) return selectedParentValues;
    return selectedParentValues.filter((entry) => entry.id !== activeParentValue.id);
  }, [activeParentValue, selectedParentValues]);

  const colorPreviewByVariantColor = useMemo(() => {
    const map = new Map<string, string>();
    variants.forEach((variant) => {
      const key = (variant.color || '').trim().toLowerCase();
      if (!key || !variant.imageUrl || map.has(key)) return;
      map.set(key, variant.imageUrl);
    });
    return map;
  }, [variants]);

  const groupedGeneratedVariants = useMemo(() => {
    const map = new Map<string, { colorLabel: string; items: typeof variants }>();

    variants.forEach((variant) => {
      const colorLabel = (variant.color || 'Default').trim() || 'Default';
      const colorKey = colorLabel.toLowerCase();
      const existing = map.get(colorKey);
      if (!existing) {
        map.set(colorKey, { colorLabel, items: [variant] });
        return;
      }
      existing.items.push(variant);
    });

    return Array.from(map.entries()).map(([colorKey, value]) => ({
      colorKey,
      colorLabel: value.colorLabel,
      items: value.items,
    }));
  }, [variants]);

  async function openMediaModal(target: typeof mediaTarget) {
    mediaTargetRef.current = target;
    setMediaTarget(target);
    setMediaModalOpen(true);
    setMediaLoading(true);
    try {
      const response = await listAdminMedia({ prefix: 'af1/products', pageSize: 100 });
      setMediaItems(response.items || []);
    } catch {
      toast.error('Unable to load media library.');
    } finally {
      setMediaLoading(false);
    }
  }

  function applyMediaSelection(item: AdminMediaItem) {
    const target = mediaTargetRef.current;
    const asset = { url: item.secureUrl, publicId: item.publicId };
    if (target.type === 'main') {
      setMainImageFromMedia(asset);
      toast.success('Main image selected from media library.');
      setMediaModalOpen(false);
      return;
    }

    if (target.type === 'gallery') {
      addGalleryImagesFromMedia([asset]);
      toast.success('Gallery image added.');
      return;
    }

    if (target.type === 'parent') {
      setParentValueImageFromMedia(target.parentId, asset);
      toast.success('Parent image selected.');
      setMediaModalOpen(false);
      return;
    }

    if (target.type === 'variant') {
      setVariantImageFromMedia(target.variantId, asset);
      toast.success('Variant image selected.');
      setMediaModalOpen(false);
      return;
    }

    if (target.type === 'main-video-thumb') {
      setMainVideoThumbnailFromMedia(asset);
      toast.success('Main video thumbnail selected.');
      setMediaModalOpen(false);
      return;
    }

    setVideoThumbnailFromMedia(target.reviewId, asset);
    toast.success('Video thumbnail selected.');
    setMediaModalOpen(false);
  }

  async function uploadMediaFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const batch = Array.from(files);
    const toastId = toast.loading(`Uploading ${batch.length} image${batch.length > 1 ? 's' : ''}...`);

    setUploadingMedia(true);
    setUploadProgress(0);

    try {
      let finished = 0;
      const uploaded: AdminMediaItem[] = [];

      for (const file of batch) {
        const signed = await signAdminMediaUpload('af1/products');
        const item = await uploadImageWithSignature(file, signed, (percent) => {
          const aggregate = Math.min(99, Math.round(((finished + percent / 100) / batch.length) * 100));
          setUploadProgress(aggregate);
        });

        finished += 1;
        setUploadProgress(Math.round((finished / batch.length) * 100));
        uploaded.push(item);
      }

      if (uploaded.length) {
        setMediaItems((prev) => {
          const seen = new Set(prev.map((entry) => entry.publicId));
          const merged = [...uploaded.filter((entry) => !seen.has(entry.publicId)), ...prev];
          return merged;
        });

        toast.update(toastId, {
          render: `${uploaded.length} image${uploaded.length > 1 ? 's' : ''} uploaded successfully.`,
          type: 'success',
          isLoading: false,
          autoClose: 2500,
        });
      }
    } catch {
      toast.update(toastId, {
        render: 'Image upload failed. Please retry.',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setUploadingMedia(false);
      setUploadProgress(0);
    }
  }

  async function handleSubmit(nextStatus?: 'active' | 'draft' | 'archived') {
    const isSuccess = isEditMode ? await submitProductUpdate(nextStatus) : await submitProduct(nextStatus);
    if (!isSuccess) return;
    router.push('/admin/products');
    router.refresh();
  }

  const createFormSignature = useMemo(
    () =>
      JSON.stringify({
        name: name.trim(),
        description: description.trim(),
        orderType,
        status,
        regularPrice,
        salePrice,
        badgeName: badgeName.trim(),
        useBasePriceForVariants,
        globalStock,
        selectedCollectionIds: [...selectedCollectionIds].sort(),
        mainImageFile: Boolean(mainImageFile),
        mainImageUrl,
        galleryImageFilesCount: galleryImageFiles.length,
        galleryImagesCount: galleryImages.length,
        variants: variants.map((variant) => ({
          id: variant.id,
          comboKey: variant.comboKey,
          parentValueId: variant.parentValueId,
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
          stock: variant.stock,
          price: variant.price,
          hasImageFile: Boolean(variant.imageFile),
          imageUrl: variant.imageUrl || '',
          isActive: variant.isActive,
        })),
      }),
    [
      badgeName,
      description,
      galleryImageFiles.length,
      galleryImages.length,
      globalStock,
      mainImageFile,
      mainImageUrl,
      name,
      orderType,
      regularPrice,
      salePrice,
      selectedCollectionIds,
      status,
      useBasePriceForVariants,
      variants,
    ]
  );

  useEffect(() => {
    if (isEditMode || isLoading) return;
    if (initialCreateSignatureRef.current !== null) return;
    initialCreateSignatureRef.current = createFormSignature;
  }, [createFormSignature, isEditMode, isLoading]);

  const hasUnsavedCreateChanges =
    !isEditMode &&
    !isLoading &&
    !isSubmitting &&
    initialCreateSignatureRef.current !== null &&
    initialCreateSignatureRef.current !== createFormSignature;

  useEffect(() => {
    if (!hasUnsavedCreateChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedCreateChanges]);

  const confirmLeaveCreateFlow = () => {
    if (!hasUnsavedCreateChanges) return true;
    return window.confirm('You have unsaved product changes. Leave this page?');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (!confirmLeaveCreateFlow()) return;
              router.back();
            }}
            className="w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tight text-slate-900">{isEditMode ? 'Edit Product' : 'New Product'}</h1>
            <p className="text-xs text-slate-500 font-semibold">Products / Add</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setStatus('draft');
              void handleSubmit('draft');
            }}
            disabled={isSubmitting || isLoading}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-wide disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={() => {
              setStatus('active');
              void handleSubmit('active');
            }}
            disabled={isSubmitting || isLoading}
            className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold uppercase tracking-wide disabled:opacity-50"
          >
            {isSubmitting ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <section className="bg-white border border-slate-100 rounded-3xl p-6 animate-pulse space-y-4">
          <div className="h-5 w-56 bg-slate-100 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-3 w-20 bg-slate-100 rounded" />
              <div className="h-11 w-full bg-slate-100 rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-24 bg-slate-100 rounded" />
              <div className="h-11 w-full bg-slate-100 rounded-xl" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <div className="h-3 w-28 bg-slate-100 rounded" />
              <div className="h-28 w-full bg-slate-100 rounded-xl" />
            </div>
          </div>
          <div className="h-44 w-full bg-slate-100 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
        </section>
      ) : null}

      {!isLoading ? (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Product Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
              placeholder="Product name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
              placeholder="Description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Main Image *</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void openMediaModal({ type: 'main' })}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-wide"
                >
                  Select From Media
                </button>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => setMainImageFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              {mainImageFile ? <p className="text-xs text-slate-500">{mainImageFile.name}</p> : null}
              {!mainImageFile && mainImageUrl ? <p className="text-xs text-emerald-600">Using uploaded media image</p> : null}
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gallery Images</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void openMediaModal({ type: 'gallery' })}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-wide"
                >
                  Add From Media
                </button>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  multiple
                  onChange={(e) => setGalleryImageFiles(Array.from(e.target.files ?? []))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              {galleryImageFiles.length ? <p className="text-xs text-slate-500">{galleryImageFiles.length} selected</p> : null}
              {galleryImages.length ? <p className="text-xs text-emerald-600">{galleryImages.length} media item(s) selected</p> : null}
            </div>
          </div>

          {galleryImages.length ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {galleryImages.map((item) => (
                <div key={item.publicId} className="relative border border-slate-200 rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt="Gallery media" className="h-24 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryMedia(item.publicId)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 border border-slate-200 text-xs"
                  >
                    <X className="w-3 h-3 mx-auto" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {mainImagePreview ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mainImagePreview} alt="Main preview" className="h-48 w-full object-cover rounded-lg" />
            </div>
          ) : null}

          <div className="border border-slate-200 rounded-2xl p-4 space-y-4">
            <h3 className="font-black uppercase tracking-wider text-sm">Main Video</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={mainVideo.url}
                onChange={(e) => setMainVideoField({ url: e.target.value })}
                placeholder="Main video URL"
                className="rounded-xl border border-slate-200 px-3 py-2"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void openMediaModal({ type: 'main-video-thumb' })}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-wide"
                >
                  Select Thumb
                </button>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => setMainVideoThumbnailFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
            </div>

            {mainVideo.thumbnailUrl ? (
              <div className="w-40 rounded-lg overflow-hidden border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mainVideo.thumbnailUrl} alt="Main video thumbnail" className="w-full h-24 object-cover" />
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Order Type</label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as 'direct' | 'request')}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
              >
                <option value="direct">Direct</option>
                <option value="request">Request</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'draft' | 'archived')}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Regular Price</label>
              <input
                type="number"
                min="0"
                value={regularPrice}
                onChange={(e) => setRegularPrice(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sale Price</label>
              <input
                type="number"
                min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Badge Name</label>
              <input
                value={badgeName}
                onChange={(e) => setBadgeName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
                placeholder="e.g. New, Top, Hot"
              />
            </div>
            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
              <span>Use base price for variants</span>
              <input
                type="checkbox"
                checked={useBasePriceForVariants}
                onChange={(e) => setUseBasePriceForVariants(e.target.checked)}
              />
            </label>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Global Stock</label>
              <input
                type="number"
                min="0"
                value={globalStock}
                onChange={(e) => setGlobalStock(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="font-black uppercase tracking-wider text-sm">Variant Options</h3>
              <button
                type="button"
                onClick={regenerateVariantsFromOptions}
                className="px-3 py-2 rounded-xl bg-black text-white text-xs font-bold uppercase tracking-wide flex items-center gap-1"
              >
                <Wand2 className="w-4 h-4" />
                Regenerate
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label className="rounded-xl border border-slate-200 px-3 py-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>Global Matrix</span>
                <input
                  type="radio"
                  checked={variantMode === 'global'}
                  onChange={() => setVariantMode('global')}
                />
              </label>
              <label className="rounded-xl border border-slate-200 px-3 py-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>Dependent Parent/Child</span>
                <input
                  type="radio"
                  checked={variantMode === 'dependent'}
                  onChange={() => setVariantMode('dependent')}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
              <select
                value={newOptionGroupKey}
                onChange={(e) => setNewOptionGroupKey(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2"
              >
                <option value="">Add existing global property</option>
                {availableGlobalOptions.map((entry) => (
                  <option key={entry.key} value={entry.key}>{entry.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!newOptionGroupKey) return;
                  addOptionGroupToProduct(newOptionGroupKey);
                  setNewOptionGroupKey('');
                }}
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-wide"
              >
                Add Property
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
              <input
                value={newGlobalOptionName}
                onChange={(e) => setNewGlobalOptionName(e.target.value)}
                placeholder="Create global property (e.g. Sleeve Type)"
                className="rounded-xl border border-slate-200 px-3 py-2"
              />
              <select
                value={newGlobalOptionType}
                onChange={(e) => setNewGlobalOptionType(e.target.value as 'text' | 'color')}
                className="rounded-xl border border-slate-200 px-3 py-2"
              >
                <option value="text">Text Option</option>
                <option value="color">Color Option</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  addGlobalOptionDefinition(newGlobalOptionName, newGlobalOptionType === 'color');
                  setNewGlobalOptionName('');
                }}
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-wide"
              >
                Add Global
              </button>
            </div>

            {variantMode === 'dependent' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <select
                  value={parentOptionKey}
                  onChange={(e) => setParentOptionKey(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2"
                >
                  {optionGroups.map((entry) => (
                    <option key={entry.key} value={entry.key}>Parent: {entry.name}</option>
                  ))}
                </select>
                <select
                  value={childOptionKey}
                  onChange={(e) => setChildOptionKey(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2"
                >
                  <option value="">No child option</option>
                  {nonParentGroups.map((entry) => (
                    <option key={entry.key} value={entry.key}>Child: {entry.name}</option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="space-y-4">
              {optionGroups.map((group) => (
                <div key={group.id} className="rounded-xl border border-slate-200 p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold uppercase tracking-wide text-slate-700">{group.name}</h4>
                    <button
                      type="button"
                      onClick={() => removeOptionGroupFromProduct(group.id)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {group.values.map((value) => {
                      const active = group.selectedValueIds.includes(value.id);
                      return (
                        <button
                          key={value.id}
                          type="button"
                          onClick={() => toggleOptionValueSelection(group.id, value.id)}
                          className={`px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wide flex items-center gap-2 ${
                            active ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-300'
                          }`}
                        >
                          {group.isColor ? (
                            <span className="inline-block w-3 h-3 rounded-full border border-white/50" style={{ backgroundColor: value.colorHex || '#000000' }} />
                          ) : null}
                          <span>{value.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {group.isColor ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {group.values.map((value) => (
                        <label key={value.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                          <span className="text-xs font-semibold text-slate-700">{value.label}</span>
                          <input
                            type="color"
                            value={value.colorHex || '#000000'}
                            onChange={(e) => updateOptionValueColor(group.id, value.id, e.target.value)}
                            className="w-8 h-8 p-0 border-none bg-transparent"
                          />
                        </label>
                      ))}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
                    <input
                      value={newValueByGroupId[group.id] || ''}
                      onChange={(e) => setNewValueByGroupId((prev) => ({ ...prev, [group.id]: e.target.value }))}
                      placeholder={`Add ${group.name} value`}
                      className="rounded-xl border border-slate-200 px-3 py-2"
                    />
                    {group.isColor ? (
                      <input
                        type="color"
                        value={newColorByGroupId[group.id] || '#000000'}
                        onChange={(e) => setNewColorByGroupId((prev) => ({ ...prev, [group.id]: e.target.value }))}
                        className="w-full md:w-14 h-10 rounded-lg border border-slate-200"
                      />
                    ) : (
                      <div />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        addOptionValue(group.id, newValueByGroupId[group.id] || '', newColorByGroupId[group.id] || '#000000');
                        setNewValueByGroupId((prev) => ({ ...prev, [group.id]: '' }));
                      }}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-wide"
                    >
                      Add Value
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {variantMode === 'dependent' && parentGroup ? (
              <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-3 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-orange-700">Parent Mapping: {parentGroup.name}</h4>

                {activeParentValue ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setParentDropdownOpen((prev) => !prev)}
                      className="w-full flex items-center justify-between rounded-lg border border-orange-200 bg-white px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        {parentGroup.isColor ? (
                          <span
                            className="inline-block w-3 h-3 rounded-full"
                            style={{ backgroundColor: activeParentValue.colorHex || '#000000' }}
                          />
                        ) : null}
                        <span className="text-sm font-semibold text-slate-700">{activeParentValue.label}</span>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        {remainingParentValues.length} more
                      </span>
                    </button>

                    {parentDropdownOpen ? (
                      <div className="absolute z-20 mt-1 w-full rounded-lg border border-orange-200 bg-white shadow-lg max-h-56 overflow-auto">
                        {remainingParentValues.length ? (
                          remainingParentValues.map((parentValue) => (
                            <button
                              key={parentValue.id}
                              type="button"
                              onClick={() => {
                                setSelectedParentValueId(parentValue.id);
                                setParentDropdownOpen(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-orange-50 flex items-center gap-2"
                            >
                              {parentGroup.isColor ? (
                                <span
                                  className="inline-block w-3 h-3 rounded-full"
                                  style={{ backgroundColor: parentValue.colorHex || '#000000' }}
                                />
                              ) : null}
                              <span className="text-sm font-semibold text-slate-700">{parentValue.label}</span>
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-2 text-xs text-slate-500">No more parent values.</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {(activeParentValue ? [activeParentValue] : []).map((parentValue) => {
                  const selectedChildren = dependentChildSelections[parentValue.id] || [];
                  return (
                    <div key={parentValue.id} className="rounded-lg border border-orange-200 bg-white p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          {parentGroup.isColor ? (
                            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: parentValue.colorHex || '#000000' }} />
                          ) : null}
                          <span>{parentValue.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void openMediaModal({ type: 'parent', parentId: parentValue.id })}
                            className="rounded-lg border border-slate-300 px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
                          >
                            Media
                          </button>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            onChange={(e) => setParentValueImage(parentValue.id, e.target.files?.[0] ?? null)}
                            className="text-xs"
                          />
                        </div>
                      </div>

                      {parentImageMap[parentValue.id]?.previewUrl ? (
                        <div className="rounded-md overflow-hidden border border-slate-200 w-28 h-20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={parentImageMap[parentValue.id].previewUrl} alt={`${parentValue.label} preview`} className="w-full h-full object-cover" />
                        </div>
                      ) : null}

                      {childGroup ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-semibold text-slate-500">Select {childGroup.name} for {parentValue.label}</p>
                            <button
                              type="button"
                              onClick={() =>
                                setOpenChildDropdownByParent((prev) => ({
                                  ...prev,
                                  [parentValue.id]: !prev[parentValue.id],
                                }))
                              }
                              className="px-2.5 py-1 rounded-lg border border-slate-300 text-[11px] font-bold uppercase tracking-wide bg-white"
                            >
                              {selectedChildren.length || selectedChildValues.length} selected
                            </button>
                          </div>

                          {openChildDropdownByParent[parentValue.id] ? (
                            <div className="max-h-40 overflow-auto rounded-lg border border-slate-200 p-2 bg-slate-50">
                              <div className="space-y-1.5">
                                {selectedChildValues.map((childValue) => {
                                  const active = selectedChildren.includes(childValue.id);
                                  return (
                                    <label key={childValue.id} className="flex items-center justify-between gap-2 rounded-md bg-white border border-slate-200 px-2 py-1.5">
                                      <span className="text-[11px] font-semibold text-slate-700">{childValue.label}</span>
                                      <input
                                        type="checkbox"
                                        checked={active}
                                        onChange={() => {
                                          const next = active
                                            ? selectedChildren.filter((id) => id !== childValue.id)
                                            : [...selectedChildren, childValue.id];
                                          setDependentChildrenForParent(parentValue.id, next);
                                        }}
                                      />
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500">No child option selected. This parent will create a single variant.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="border border-slate-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="font-black uppercase tracking-wider text-sm">Generated Variants</h3>
              <span className="text-xs font-semibold text-slate-500">Total: {variants.length}</span>
            </div>

            <p className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              Tip: Upload/select image once for the first size of a color. The same preview is reused for other sizes of that color.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="number"
                min="0"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                placeholder="Bulk price"
                className="rounded-xl border border-slate-200 px-3 py-2"
              />
              <input
                type="number"
                min="0"
                value={bulkStock}
                onChange={(e) => setBulkStock(e.target.value)}
                placeholder="Bulk stock"
                className="rounded-xl border border-slate-200 px-3 py-2"
              />
              <button type="button" onClick={applyBulkToVariants} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-wide">
                Apply Bulk
              </button>
            </div>

            <div className="space-y-3">
              {groupedGeneratedVariants.map((group) => {
                const isOpen = Boolean(openGeneratedVariantsByColor[group.colorKey]);
                const visibleItems = isOpen ? group.items : group.items.slice(0, 1);

                return (
                  <div key={group.colorKey} className="rounded-xl border border-slate-200 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-black uppercase tracking-wide text-slate-700">
                        {group.colorLabel} Variants ({group.items.length})
                      </div>
                      {group.items.length > 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setOpenGeneratedVariantsByColor((prev) => ({
                              ...prev,
                              [group.colorKey]: !prev[group.colorKey],
                            }))
                          }
                          className="rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
                        >
                          {isOpen ? 'Hide Sizes' : `Show ${group.items.length - 1} More`}
                        </button>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      {visibleItems.map((variant) => (
                        <div key={variant.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 rounded-xl border border-slate-200 p-3">
                          <div className="md:col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 flex items-center gap-2">
                            {variant.colorHex ? <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: variant.colorHex }} /> : null}
                            <span>{variant.optionSummary}</span>
                          </div>
                          <input
                            value={variant.sku}
                            onChange={(e) => updateVariant(variant.id, { sku: e.target.value })}
                            placeholder="SKU"
                            className="rounded-lg border border-slate-200 px-3 py-2"
                          />
                          <input
                            type="number"
                            min="0"
                            value={variant.price}
                            disabled={useBasePriceForVariants}
                            onChange={(e) => updateVariant(variant.id, { price: e.target.value })}
                            placeholder="Price"
                            className="rounded-lg border border-slate-200 px-3 py-2 disabled:bg-slate-100"
                          />
                          <input
                            type="number"
                            min="0"
                            value={variant.stock}
                            onChange={(e) => updateVariant(variant.id, { stock: Number(e.target.value) })}
                            placeholder="Stock"
                            className="rounded-lg border border-slate-200 px-3 py-2"
                          />
                          <div className="md:col-span-6 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-2">
                            <button
                              type="button"
                              onClick={() => void openMediaModal({ type: 'variant', variantId: variant.id })}
                              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-wide"
                            >
                              Select Media
                            </button>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              onChange={(e) =>
                                updateVariant(variant.id, {
                                  imageFile: e.target.files?.[0] ?? undefined,
                                  imageUrl: undefined,
                                  imagePublicId: undefined,
                                })
                              }
                              className="rounded-lg border border-slate-200 px-3 py-2"
                            />
                          </div>
                          {(variant.imageUrl || colorPreviewByVariantColor.get((variant.color || '').trim().toLowerCase())) ? (
                            <div className="md:col-span-6 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={variant.imageUrl || colorPreviewByVariantColor.get((variant.color || '').trim().toLowerCase())}
                                alt={`${variant.optionSummary} preview`}
                                className="w-16 h-16 rounded-md object-cover border border-slate-200"
                              />
                              <p className="text-xs font-semibold text-slate-600">
                                {variant.imageUrl ? 'Selected variant image preview' : 'Inherited color image preview'}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="font-black uppercase tracking-wider text-sm">Video Reviews</h3>
              <button type="button" onClick={addVideoReview} className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                <Plus className="w-4 h-4" />
                Add Review
              </button>
            </div>

            <div className="space-y-3">
              {videoReviews.map((review) => (
                <div key={review.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 rounded-xl border border-slate-200 p-3">
                  <input
                    value={review.url}
                    onChange={(e) => updateVideoReview(review.id, { url: e.target.value })}
                    placeholder="Video URL"
                    className="rounded-lg border border-slate-200 px-3 py-2"
                  />
                  <input
                    value={review.thumbnailUrl}
                    onChange={(e) => updateVideoReview(review.id, { thumbnailUrl: e.target.value })}
                    placeholder="Thumbnail URL (optional)"
                    className="rounded-lg border border-slate-200 px-3 py-2"
                  />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => updateVideoReview(review.id, { thumbnailFile: e.target.files?.[0] ?? undefined, thumbnailPublicId: undefined })}
                    className="rounded-lg border border-slate-200 px-3 py-2 md:col-span-2"
                  />
                  <button
                    type="button"
                    onClick={() => void openMediaModal({ type: 'video', reviewId: review.id })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-wide"
                  >
                    Select Media
                  </button>
                  <button
                    type="button"
                    onClick={() => removeVideoReview(review.id)}
                    className="rounded-lg border border-red-200 text-red-600 px-3 py-2 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 h-fit">
          <h3 className="font-black uppercase tracking-wider text-sm">Collections</h3>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={collectionSearch}
              onChange={(e) => setCollectionSearch(e.target.value)}
              placeholder="Search collections"
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5"
            />
          </div>

          <div className="max-h-64 overflow-auto border border-slate-200 rounded-xl p-2 space-y-1">
            {isCollectionLoading ? (
              <p className="text-sm text-slate-500 px-2 py-2">Loading collections...</p>
            ) : filteredCollections.length === 0 ? (
              <p className="text-sm text-slate-500 px-2 py-2">No collections found.</p>
            ) : (
              filteredCollections.map((entry) => (
                <label key={entry.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-slate-50 cursor-pointer">
                  <span className="text-sm font-semibold text-slate-700">{entry.name}</span>
                  <input
                    type="checkbox"
                    checked={selectedCollectionIds.includes(entry.id)}
                    onChange={() => toggleCollection(entry.id)}
                  />
                </label>
              ))
            )}
          </div>

          <p className="text-xs text-slate-500 font-medium">Selected: {selectedCollectionIds.length}</p>

          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Selected Thumbnails</h4>
            <div className="max-h-72 overflow-auto grid grid-cols-3 gap-2">
              {mainImagePreview ? (
                <div className="rounded-lg overflow-hidden border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mainImagePreview} alt="Main thumbnail" className="w-full h-16 object-cover" />
                </div>
              ) : null}

              {selectedMainVideoThumb ? (
                <div className="rounded-lg overflow-hidden border border-slate-200" title="Main video thumbnail">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedMainVideoThumb} alt="Main video thumbnail" className="w-full h-16 object-cover" />
                </div>
              ) : null}

              {galleryImages.map((item) => (
                <div key={item.publicId} className="rounded-lg overflow-hidden border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt="Gallery thumbnail" className="w-full h-16 object-cover" />
                </div>
              ))}

              {selectedVideoThumbs.map((review) => (
                <div key={review.id} className="rounded-lg overflow-hidden border border-slate-200" title="Video thumbnail">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={review.thumbnailUrl} alt="Video thumbnail" className="w-full h-16 object-cover" />
                </div>
              ))}
            </div>
            {!mainImagePreview && !selectedMainVideoThumb && !galleryImages.length && !selectedVideoThumbs.length ? (
              <p className="text-[11px] text-slate-500">No thumbnails selected yet.</p>
            ) : null}
          </div>
        </aside>
      </div>
      ) : null}

      {mediaModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
          <div className="w-full max-w-6xl max-h-[88vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Media Library</h3>
                <p className="text-xs text-slate-500">Upload once, then reuse across product images and variants.</p>
              </div>
              <button
                type="button"
                onClick={() => setMediaModalOpen(false)}
                className="w-9 h-9 rounded-lg border border-slate-200"
              >
                <X className="w-4 h-4 mx-auto" />
              </button>
            </div>

            <div className="px-4 py-3 border-b border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <label className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-wide cursor-pointer">
                  Upload Images
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    multiple
                    onChange={(e) => void uploadMediaFiles(e.target.files)}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void openMediaModal(mediaTarget)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-wide"
                >
                  Refresh
                </button>
              </div>

              {uploadingMedia ? (
                <div className="space-y-1">
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full bg-[#FF7348] transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-600">Uploading... {uploadProgress}%</p>
                </div>
              ) : null}
            </div>

            <div className="flex-1 overflow-auto p-4">
              {mediaLoading ? (
                <p className="text-sm font-semibold text-slate-500">Loading media...</p>
              ) : mediaItems.length === 0 ? (
                <p className="text-sm font-semibold text-slate-500">No uploaded images yet. Upload images above to start.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {mediaItems.map((item) => (
                    <button
                      key={item.publicId}
                      type="button"
                      onClick={() => applyMediaSelection(item)}
                      className="group border border-slate-200 rounded-lg overflow-hidden text-left"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.secureUrl} alt="Media item" className="h-28 w-full object-cover" />
                      <div className="p-2 text-[10px] text-slate-500 truncate group-hover:text-slate-700">{item.publicId}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {!isLoading ? (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              if (!confirmLeaveCreateFlow()) return;
              router.push('/admin/products');
            }}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-wide"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || isLoading}
            className="px-5 py-2.5 rounded-xl bg-[#FF7348] text-white text-xs font-bold uppercase tracking-wide disabled:opacity-60"
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      ) : (
        <div className="flex justify-end gap-3 animate-pulse">
          <div className="h-10 w-28 rounded-xl bg-slate-100" />
          <div className="h-10 w-36 rounded-xl bg-slate-100" />
        </div>
      )}
    </div>
  );
};
