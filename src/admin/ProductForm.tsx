"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, Search, Star, Trash2, Wand2, X, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useProductForm } from './hooks/useProductForm';
import { listAdminMedia, signAdminMediaUpload, uploadImageWithSignature, type AdminMediaItem } from '@/lib/api/media';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

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
    benefits,
    setBenefits,
    faqs,
    addFaq,
    updateFaq,
    removeFaq,
    upsellProductIds,
    upsellOffers,
    upsellOptions,
    toggleUpsellProduct,
    updateUpsellOffer,
    upsellSearch,
    setUpsellSearch,
    filteredUpsellOptions,
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
    reviews,
    addReview,
    updateReview,
    removeReview,
    setReviewAvatarFromMedia,
    setReviewAvatarFile,
    removeReviewAvatar,
    mainVideo,
    setMainVideoField,
    setMainVideoThumbnailFile,
    setMainVideoThumbnailFromMedia,
    filteredCollections,
    collections,
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
  const [mediaNextCursor, setMediaNextCursor] = useState<string | undefined>(undefined);
  const [isMediaPaginationLoading, setIsMediaPaginationLoading] = useState(false);
  const initialCreateSignatureRef = useRef<string | null>(null);
  const [mediaTarget, setMediaTarget] = useState<
    | { type: 'main' }
    | { type: 'gallery' }
    | { type: 'parent'; parentId: string }
    | { type: 'variant'; variantId: string }
    | { type: 'main-video-thumb' }
    | { type: 'video'; reviewId: string }
    | { type: 'review-avatar'; reviewId: string }
  >({ type: 'main' });
  const mediaTargetRef = useRef(mediaTarget);

  const [newGlobalOptionName, setNewGlobalOptionName] = useState('');
  const [newGlobalOptionType, setNewGlobalOptionType] = useState<'text' | 'color'>('text');
  const [newOptionGroupKey, setNewOptionGroupKey] = useState('');
  const [newValueByGroupId, setNewValueByGroupId] = useState<Record<string, string>>({});
  const [newColorByGroupId, setNewColorByGroupId] = useState<Record<string, string>>({});
  const [openChildDropdownByParent, setOpenChildDropdownByParent] = useState<Record<string, boolean>>({});

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

  async function fetchMedia(params: { search?: string; sort?: 'new' | 'old'; cursor?: string; append?: boolean }) {
    if (params.cursor) setIsMediaPaginationLoading(true);
    else setMediaLoading(true);

    try {
      const response = await listAdminMedia({
        prefix: 'af1/products',
        pageSize: 20,
        search: params.search,
        sort: params.sort,
        cursor: params.cursor,
      });

      if (params.append) {
        setMediaItems((prev) => [...prev, ...(response.items || [])]);
      } else {
        setMediaItems(response.items || []);
      }
      setMediaNextCursor(response.nextCursor);
    } catch {
      toast.error('Unable to load media library.');
    } finally {
      setMediaLoading(false);
      setIsMediaPaginationLoading(false);
    }
  }

  async function openMediaModal(target: typeof mediaTarget) {
    mediaTargetRef.current = target;
    setMediaTarget(target);
    setMediaModalOpen(true);
    setMediaSearch('');
    setMediaSort('new');
    setMediaNextCursor(undefined);
    void fetchMedia({ search: '', sort: 'new' });
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

    if (target.type === 'review-avatar') {
      setReviewAvatarFromMedia(target.reviewId, asset);
      toast.success('Review avatar selected.');
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
        benefits: benefits.trim(),
        faqs,
        upsellProductIds: [...upsellProductIds].sort(),
        reviews: reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          fullName: review.fullName,
          email: review.email,
          reviewText: review.reviewText,
          userAvatar: review.userAvatar?.publicId,
          userAvatarFile: Boolean(review.userAvatarFile),
        })),
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
      benefits,
      description,
      faqs,
      galleryImageFiles.length,
      galleryImages.length,
      globalStock,
      mainImageFile,
      mainImageUrl,
      name,
      orderType,
      regularPrice,
      salePrice,
      reviews,
      selectedCollectionIds,
      upsellProductIds,
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
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white [&_.ql-toolbar]:border-0 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[180px]">
                <ReactQuill
                  theme="snow"
                  value={description}
                  onChange={setDescription}
                  placeholder="Write rich product description"
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link', 'clean'],
                    ],
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Benefits (Optional)</label>
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white [&_.ql-toolbar]:border-0 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[160px]">
                <ReactQuill
                  theme="snow"
                  value={benefits}
                  onChange={setBenefits}
                  placeholder="Add product benefits"
                  modules={{
                    toolbar: [
                      [{ header: [2, 3, false] }],
                      ['bold', 'italic', 'underline'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link', 'clean'],
                    ],
                  }}
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="font-black uppercase tracking-wider text-sm">FAQs</h3>
                <button type="button" onClick={addFaq} className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Add FAQ
                </button>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <div key={`${faq.question}-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 rounded-xl border border-slate-200 p-3">
                    <input
                      value={faq.question}
                      onChange={(e) => updateFaq(index, { question: e.target.value })}
                      placeholder="FAQ question"
                      className="rounded-lg border border-slate-200 px-3 py-2"
                    />
                    <textarea
                      value={faq.answer}
                      onChange={(e) => updateFaq(index, { answer: e.target.value })}
                      rows={2}
                      placeholder="FAQ answer"
                      className="rounded-lg border border-slate-200 px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="rounded-lg border border-red-200 text-red-600 px-3 py-2 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {!faqs.length ? <p className="text-xs text-slate-500">No FAQs added yet.</p> : null}
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="font-black uppercase tracking-wider text-sm">Upsell Products</h3>
                <span className="text-xs font-semibold text-slate-500">Selected: {upsellProductIds.length}</span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={upsellSearch}
                  onChange={(e) => setUpsellSearch(e.target.value)}
                  placeholder="Search product by name"
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5"
                />
              </div>

              <div className="max-h-56 overflow-auto border border-slate-200 rounded-xl p-2 space-y-1">
                {filteredUpsellOptions.length === 0 ? (
                  <p className="text-sm text-slate-500 px-2 py-2">No products found.</p>
                ) : (
                  filteredUpsellOptions.map((entry) => {
                    const checked = upsellProductIds.includes(entry.id);
                    return (
                      <label key={entry.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-slate-50 cursor-pointer">
                        <span className="text-sm font-semibold text-slate-700 truncate">{entry.name}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleUpsellProduct(entry.id)}
                        />
                      </label>
                    );
                  })
                )}
              </div>

              {upsellProductIds.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-slate-100"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tactical Bundle Pricing (Optional)</p>
                    <div className="h-px flex-1 bg-slate-100"></div>
                  </div>
                  <div className="space-y-2">
                    {upsellProductIds.map((id) => {
                      const item = upsellOptions.find((o) => o.id === id);
                      if (!item) return null;

                      const mainPrice = Number(salePrice || regularPrice || 0);
                      const upsellPrice = Number(item.salePrice || item.regularPrice || item.basePrice || 0);
                      const currentTotal = mainPrice + upsellPrice;

                      return (
                        <div key={id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 overflow-hidden flex-shrink-0">
                              <img src={item.mainImageUrl || '/placeholder.png'} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-700 truncate">{item.name}</p>
                              <p className="text-[10px] font-semibold text-slate-400">Current Combined: <span className="text-slate-600">${currentTotal.toFixed(2)}</span></p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Bundle Total</label>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="e.g. 99.99"
                                  value={upsellOffers[id] ?? ''}
                                  onChange={(e) => updateUpsellOffer(id, e.target.value ? Number(e.target.value) : undefined)}
                                  className="w-28 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-slate-400 italic">Set the total price of the bundle (Main + Upsell). Leave empty to use the current combined price.</p>
                </div>
              )}
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
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Regular Price {orderType === 'request' && '(Optional)'}
                </label>
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
                <h3 className="font-black uppercase tracking-wider text-sm">
                  Variant Options {orderType === 'request' && <span className="opacity-50 text-[10px] lowercase font-bold ml-2">(Optional)</span>}
                </h3>
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
                            className={`px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wide flex items-center gap-2 ${active ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-300'
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

            <div className="border border-slate-200 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="font-black uppercase tracking-wider text-sm">Product Reviews</h3>
                <button type="button" onClick={addReview} className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Add Review
                </button>
              </div>

              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-slate-200 p-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                        <input
                          value={review.fullName}
                          onChange={(e) => updateReview(review.id, { fullName: e.target.value, source: 'admin', isPublished: true })}
                          placeholder="John Doe"
                          className="rounded-lg border border-slate-200 px-3 py-2 w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                        <input
                          type="email"
                          value={review.email}
                          onChange={(e) => updateReview(review.id, { email: e.target.value, source: 'admin', isPublished: true })}
                          placeholder="john@example.com"
                          className="rounded-lg border border-slate-200 px-3 py-2 w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => updateReview(review.id, { rating: value, source: 'admin', isPublished: true })}
                            className="p-1"
                          >
                            <Star className={`w-6 h-6 ${review.rating >= value ? 'fill-[#FF7348] text-[#FF7348]' : 'text-slate-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Review Text</label>
                      <textarea
                        value={review.reviewText}
                        onChange={(e) => updateReview(review.id, { reviewText: e.target.value, source: 'admin', isPublished: true })}
                        rows={4}
                        placeholder="Share experience..."
                        className="rounded-lg border border-slate-200 px-3 py-2 w-full"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={(e) => setReviewAvatarFile(review.id, e.target.files?.[0])}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => void openMediaModal({ type: 'review-avatar', reviewId: review.id })}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-wide whitespace-nowrap"
                      >
                        Select Avatar
                      </button>
                      <button
                        type="button"
                        onClick={() => removeReview(review.id)}
                        className="rounded-lg border border-red-200 text-red-600 px-3 py-2 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {(review.userAvatar || review.userAvatarFile) && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={review.userAvatarFile ? URL.createObjectURL(review.userAvatarFile) : review.userAvatar?.url}
                            alt="Review avatar"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeReviewAvatar(review.id)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black uppercase tracking-wider text-slate-800 truncate">
                            Athlete Avatar
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {review.userAvatarFile ? review.userAvatarFile.name : review.userAvatar?.publicId}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="text-[11px] font-semibold text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                      Source: Admin | Status: Published
                    </div>
                  </div>
                ))}
                {!reviews.length ? <p className="text-xs text-slate-500">No reviews added yet.</p> : null}
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
              ) : (() => {
                // Separate parents from subcollections
                const parents = filteredCollections.filter((c) => !c.parentId);
                const subs = filteredCollections.filter((c) => c.parentId);
                // Orphan subs (parent not in filtered list)
                const visibleParentIds = new Set(parents.map((p) => p.id));
                const orphanSubs = subs.filter((s) => !visibleParentIds.has(s.parentId as string));

                return (
                  <>
                    {parents.map((parent) => {
                      const children = subs.filter((s) => s.parentId === parent.id);
                      const isSelected = selectedCollectionIds.includes(parent.id);
                      const isAutoSelected = isSelected && children.some((c) => selectedCollectionIds.includes(c.id));
                      return (
                        <div key={parent.id} className="space-y-0.5">
                          {/* Parent row */}
                          <label
                            className={`flex items-center justify-between gap-2 rounded-lg px-2 py-2 ${isAutoSelected ? 'bg-orange-50 cursor-not-allowed opacity-80' : 'hover:bg-slate-50 cursor-pointer'}`}
                            title={isAutoSelected ? 'Auto-included because a subcollection is selected' : undefined}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm font-bold text-slate-800 truncate">{parent.name}</span>
                              {isAutoSelected && (
                                <span className="shrink-0 text-[9px] font-black uppercase tracking-widest bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full border border-orange-200">
                                  Auto
                                </span>
                              )}
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isAutoSelected}
                              onChange={() => toggleCollection(parent.id)}
                              className="shrink-0 accent-orange-500"
                            />
                          </label>

                          {/* Subcollection rows — indented */}
                          {children.map((child) => {
                            const isChildSelected = selectedCollectionIds.includes(child.id);
                            return (
                              <label
                                key={child.id}
                                className="flex items-center justify-between gap-2 rounded-lg pl-6 pr-2 py-1.5 hover:bg-slate-50 cursor-pointer"
                              >
                                <span className="text-sm font-semibold text-slate-600">{child.name}</span>
                                <input
                                  type="checkbox"
                                  checked={isChildSelected}
                                  onChange={() => toggleCollection(child.id)}
                                  className="shrink-0 accent-orange-500"
                                />
                              </label>
                            );
                          })}
                        </div>
                      );
                    })}

                    {/* Orphan subs (their parent didn't match the search) */}
                    {orphanSubs.map((entry) => (
                      <label
                        key={entry.id}
                        className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-slate-50 cursor-pointer"
                      >
                        <span className="text-sm font-semibold text-slate-700">{entry.name}</span>
                        <input
                          type="checkbox"
                          checked={selectedCollectionIds.includes(entry.id)}
                          onChange={() => toggleCollection(entry.id)}
                          className="shrink-0 accent-orange-500"
                        />
                      </label>
                    ))}
                  </>
                );
              })()}
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Selected: {selectedCollectionIds.filter((id) => {
                const col = filteredCollections.find((c) => c.id === id) ?? collections.find((c) => c.id === id);
                return Boolean(col?.parentId); // Only count subcollections (parents are auto)
              }).length} subcollection(s) · {selectedCollectionIds.length} total IDs stored
            </p>

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
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center backdrop-blur-sm">
          <div className="w-full max-w-6xl max-h-[88vh] overflow-hidden rounded-[40px] border border-slate-200 bg-white shadow-2xl flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Media Library</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Upload once, then reuse across product images and variants.</p>
              </div>
              <button
                type="button"
                onClick={() => setMediaModalOpen(false)}
                className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all hover:rotate-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={mediaSearch}
                    onChange={(e) => {
                      setMediaSearch(e.target.value);
                      void fetchMedia({ search: e.target.value, sort: mediaSort });
                    }}
                    placeholder="Search by name..."
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-[#FF7348] transition-all shadow-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={mediaSort}
                    onChange={(e) => {
                      const sort = e.target.value as 'new' | 'old';
                      setMediaSort(sort);
                      void fetchMedia({ search: mediaSearch, sort });
                    }}
                    className="pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold uppercase tracking-wide outline-none appearance-none cursor-pointer focus:border-[#FF7348] transition-all shadow-sm"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                  >
                    <option value="new">Newest First</option>
                    <option value="old">Oldest First</option>
                  </select>
                </div>

                <div className="h-10 w-px bg-slate-200 mx-2" />

                <label className="bg-black text-white px-6 py-3 rounded-2xl text-xs font-black uppercase italic tracking-tighter cursor-pointer hover:bg-[var(--color-accent)] transition-all shadow-lg active:scale-95">
                  Upload New
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    multiple
                    onChange={(e) => void uploadMediaFiles(e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>

              {uploadingMedia ? (
                <div className="space-y-2">
                  <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      className="h-full bg-[var(--color-accent)]"
                    />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Processing Mission Assets... {uploadProgress}%</p>
                </div>
              ) : null}
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/20">
              {mediaLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="aspect-[4/3] rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />
                  ))}
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                    <Search className="w-8 h-8 text-slate-200" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase italic tracking-tighter text-slate-900">No Assets Found</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Try a different search or upload new files.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {mediaItems.map((item) => (
                      <button
                        key={item.publicId}
                        type="button"
                        onClick={() => applyMediaSelection(item)}
                        className="group relative aspect-[4/3] rounded-3xl overflow-hidden border border-slate-200 bg-white hover:border-[#FF7348] hover:shadow-xl hover:shadow-orange-500/10 transition-all text-left"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.secureUrl} alt="Media item" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                          <p className="text-[10px] font-black uppercase text-white tracking-widest truncate">{item.publicId.split('/').pop()}</p>
                          <p className="text-[8px] font-bold text-white/70 uppercase tracking-widest mt-0.5">{item.format?.toUpperCase()} | {Math.round((item.bytes || 0) / 1024)}KB</p>
                        </div>
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                          <Plus className="w-4 h-4 text-[#FF7348]" />
                        </div>
                      </button>
                    ))}
                  </div>

                  {mediaNextCursor && (
                    <div className="flex justify-center pb-4">
                      <button
                        type="button"
                        onClick={() => void fetchMedia({ search: mediaSearch, sort: mediaSort, cursor: mediaNextCursor, append: true })}
                        disabled={isMediaPaginationLoading}
                        className="group flex items-center gap-2 bg-white border border-slate-200 px-8 py-3 rounded-2xl font-black uppercase italic tracking-tighter text-sm hover:border-[#FF7348] hover:text-[#FF7348] transition-all shadow-sm active:scale-95 disabled:opacity-50"
                      >
                        {isMediaPaginationLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <span>Load More Mission Assets</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
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
            className="px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-xs font-bold uppercase tracking-wide disabled:opacity-60"
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
