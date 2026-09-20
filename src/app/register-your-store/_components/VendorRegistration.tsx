'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import {
  Store, User, Mail, Image as ImageIcon, Tag, Package,
  ChevronDown, X, Plus, CheckCircle2, ArrowRight, ArrowLeft, Search, Loader2,
  Lock, Phone, MapPin, Palette, Ruler, Check, AlertCircle,
} from 'lucide-react';
import { getCollectionHierarchyApi } from '@/lib/api/publicCollections';
import { getExploreProductsApi } from '@/lib/api/publicProducts';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import type { CollectionHierarchy } from '@/lib/api/types';
import { submitVendorStoreApi, getMyVendorStoresApi, type MyVendorStore } from '@/lib/api/vendorStores';

const PAGE_SIZE = 24;

interface ProductVariantInfo {
  size?: string;
  color?: string;
  price?: number;
  imageUrl?: string;
}

interface ProductItemData {
  id: string;
  name: string;
  slug?: string;
  mainImageUrl?: string;
  basePrice?: number;
  variants?: ProductVariantInfo[];
}

interface SelectedProductConfig {
  id: string;
  name: string;
  slug?: string;
  mainImageUrl?: string;
  basePrice?: number;
  availableColors: string[];
  availableSizes: string[];
  selectedColors: string[];
  customColors: string[];
  selectedSizes: string[];
}

interface FetchCacheEntry {
  products: ProductItemData[];
  currentPage: number;
  hasMore: boolean;
}

/** Build a stable cache key from sorted slugs + search query */
const makeCacheKey = (slugs: string[], search: string) =>
  `${[...slugs].sort().join(',')}||${search.trim().toLowerCase()}`;

const isTeamStore = (name: string, slug: string) =>
  name.toLowerCase().includes('team store') || slug.toLowerCase().includes('team-store');

const truncate = (s: string, n = 22) => (s.length > n ? s.slice(0, n) + '…' : s);

export const VendorRegistration: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // ── step wizard ─────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // ── auth guard ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/register-your-store');
    }
  }, [authLoading, isAuthenticated, router]);

  // ── form: Step 1 (Personal & Store Details) ──────────────────────────────────
  const [storeName, setStoreName] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [productNamePrefix, setProductNamePrefix] = useState('');
  const [selectedCollectionSlugs, setSelectedCollectionSlugs] = useState<string[]>([]);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoDimensions, setLogoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [hasTransparency, setHasTransparency] = useState<boolean>(false);

  // ── form: Step 2 (Product & Variation Selection) ────────────────────────────
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductConfig[]>([]);
  const [customColorInputs, setCustomColorInputs] = useState<Record<string, string>>({});

  // ── submission state ────────────────────────────────────────────────────────
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── existing applications ──────────────────────────────────────────────────
  const [existingStores, setExistingStores] = useState<MyVendorStore[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated) {
      setLoadingExisting(true);
      getMyVendorStoresApi()
        .then((res) => {
          if (res?.ok) setExistingStores(res.stores);
        })
        .catch(console.error)
        .finally(() => setLoadingExisting(false));
    } else {
      setLoadingExisting(false);
    }
  }, [isAuthenticated, authLoading]);

  const latestStore = existingStores.length > 0 ? existingStores[0] : null;

  // ── autofill from logged-in user ──────────────────────────────────
  useEffect(() => {
    if (user) {
      if (user.name) setVendorName(user.name);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  // If latestStore has phone / address and user fields are empty, prefill
  useEffect(() => {
    if (latestStore) {
      if (latestStore.phone && !phone) setPhone(latestStore.phone);
      if (latestStore.address && !address) setAddress(latestStore.address);
      if (latestStore.storeName && !storeName) setStoreName(latestStore.storeName);
      if (latestStore.productNamePrefix && !productNamePrefix) setProductNamePrefix(latestStore.productNamePrefix);
    }
  }, [latestStore]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── collections (fetched once on mount) ───────────────────────────────────
  const [collections, setCollections] = useState<CollectionHierarchy[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);

  // ── product dropdown state ────────────────────────────────────────────────
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<ProductItemData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // ── result cache keyed by (slugs + search) ────────────────────────────────
  const fetchCacheRef = useRef<Map<string, FetchCacheEntry>>(new Map());

  // ── fetch collections once ────────────────────────────────────────────────
  useEffect(() => {
    getCollectionHierarchyApi()
      .then((res) => {
        if (res?.ok && res.hierarchy) {
          setCollections(res.hierarchy.filter((h) => !isTeamStore(h.name, h.slug)));
        }
      })
      .catch(console.error)
      .finally(() => setLoadingCollections(false));
  }, []);

  // ── debounce search input ─────────────────────────────────────────────────
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(productSearch), 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [productSearch]);

  // ── close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── focus search when dropdown opens ──────────────────────────────────────
  useEffect(() => {
    if (dropdownOpen) setTimeout(() => searchRef.current?.focus(), 80);
    else setProductSearch('');
  }, [dropdownOpen]);

  // ── core product fetch ────────────────────────────────────────────────────
  const fetchProducts = useCallback(
    async (page: number, append: boolean) => {
      append ? setLoadingMore(true) : setLoadingProducts(true);

      const search = debouncedSearch.trim() || undefined;
      const cacheKey = makeCacheKey(selectedCollectionSlugs, debouncedSearch);

      try {
        let nextProducts: ProductItemData[] = [];
        let nextHasMore = false;

        if (selectedCollectionSlugs.length === 0) {
          const res = await getExploreProductsApi({ page, pageSize: PAGE_SIZE, search });
          if (res?.ok) {
            nextProducts = res.items.map((p) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              mainImageUrl: p.mainImageUrl,
              basePrice: p.basePrice,
              variants: p.variants?.map((v) => ({
                size: v.size,
                color: v.color,
                price: v.price,
                imageUrl: v.imageUrl,
              })) || [],
            }));
            nextHasMore = res.pagination.page < res.pagination.totalPages;
          }
        } else {
          const calls = selectedCollectionSlugs.map((slug) =>
            getExploreProductsApi({ collection: slug, page, pageSize: PAGE_SIZE, search }).catch(() => null)
          );
          const results = await Promise.all(calls);
          const merged = new Map<string, ProductItemData>();
          results.forEach((res) => {
            if (res?.ok && res.items) {
              res.items.forEach((p) =>
                merged.set(p.id, {
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  mainImageUrl: p.mainImageUrl,
                  basePrice: p.basePrice,
                  variants: p.variants?.map((v) => ({
                    size: v.size,
                    color: v.color,
                    price: v.price,
                    imageUrl: v.imageUrl,
                  })) || [],
                })
              );
              if (res.pagination.page < res.pagination.totalPages) nextHasMore = true;
            }
          });
          nextProducts = Array.from(merged.values());
        }

        setProducts((prev) => {
          const merged = append
            ? (() => {
                const m = new Map(prev.map((p) => [p.id, p]));
                nextProducts.forEach((p) => m.set(p.id, p));
                return Array.from(m.values());
              })()
            : nextProducts;
          fetchCacheRef.current.set(cacheKey, { products: merged, currentPage: page, hasMore: nextHasMore });
          return merged;
        });
        setHasMore(nextHasMore);
        setCurrentPage(page);
      } catch (err) {
        console.error('[VendorRegistration] fetchProducts error:', err);
      } finally {
        setLoadingProducts(false);
        setLoadingMore(false);
      }
    },
    [selectedCollectionSlugs, debouncedSearch]
  );

  // ── on open / collection / search change: restore from cache or fetch ──────
  useEffect(() => {
    if (!dropdownOpen) return;

    const cacheKey = makeCacheKey(selectedCollectionSlugs, debouncedSearch);
    const cached = fetchCacheRef.current.get(cacheKey);

    if (cached) {
      setProducts(cached.products);
      setCurrentPage(cached.currentPage);
      setHasMore(cached.hasMore);
      return;
    }

    setCurrentPage(1);
    fetchProducts(1, false);
  }, [dropdownOpen, selectedCollectionSlugs, debouncedSearch, fetchProducts]);

  const handleLoadMore = () => {
    fetchProducts(currentPage + 1, true);
  };

  // ── togglers ──────────────────────────────────────────────────────────────
  const toggleCollection = (slug: string) => {
    setSelectedCollectionSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const toggleProduct = (item: ProductItemData) => {
    setSelectedProducts((prev) => {
      const exists = prev.some((p) => p.id === item.id);
      if (exists) {
        return prev.filter((p) => p.id !== item.id);
      }

      // Extract unique colors and sizes from variants
      const colors = Array.from(
        new Set(
          (item.variants || [])
            .map((v) => v.color?.trim())
            .filter((c): c is string => Boolean(c))
        )
      );
      const sizes = Array.from(
        new Set(
          (item.variants || [])
            .map((v) => v.size?.trim())
            .filter((s): s is string => Boolean(s))
        )
      );

      const newConfig: SelectedProductConfig = {
        id: item.id,
        name: item.name,
        slug: item.slug,
        mainImageUrl: item.mainImageUrl,
        basePrice: item.basePrice,
        availableColors: colors,
        availableSizes: sizes,
        selectedColors: [...colors],
        customColors: [],
        selectedSizes: [...sizes],
      };

      return [...prev, newConfig];
    });
  };

  const removeProduct = (id: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // ── variations handlers ───────────────────────────────────────────────────
  const toggleProductColor = (productId: string, color: string) => {
    setSelectedProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const exists = p.selectedColors.includes(color);
        return {
          ...p,
          selectedColors: exists
            ? p.selectedColors.filter((c) => c !== color)
            : [...p.selectedColors, color],
        };
      })
    );
  };

  const toggleProductSize = (productId: string, size: string) => {
    setSelectedProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const exists = p.selectedSizes.includes(size);
        return {
          ...p,
          selectedSizes: exists
            ? p.selectedSizes.filter((s) => s !== size)
            : [...p.selectedSizes, size],
        };
      })
    );
  };

  const handleAddCustomColor = (productId: string) => {
    const rawVal = (customColorInputs[productId] || '').trim();
    if (!rawVal) return;

    setSelectedProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        if (p.customColors.some((c) => c.toLowerCase() === rawVal.toLowerCase())) {
          return p;
        }
        return {
          ...p,
          customColors: [...p.customColors, rawVal],
        };
      })
    );

    setCustomColorInputs((prev) => ({ ...prev, [productId]: '' }));
  };

  const handleRemoveCustomColor = (productId: string, colorToRemove: string) => {
    setSelectedProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          customColors: p.customColors.filter((c) => c !== colorToRemove),
        };
      })
    );
  };

  // ── logo validation: resolution & transparency ────────────────────────────
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setLogoError('Logo must have a transparent background. Please upload a PNG, WEBP, or SVG file (JPEG is not supported).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Logo file size must be less than 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      if (!dataUrl) return;

      if (file.type === 'image/svg+xml') {
        setLogoBase64(dataUrl);
        setLogoDimensions({ width: 1000, height: 1000 });
        setHasTransparency(true);
        setLogoError(null);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        setLogoDimensions({ width: w, height: h });

        if (w < 500 || h < 500) {
          setLogoError(`Logo resolution is too low (${w}×${h}px). Minimum required is 500×500px so it prints sharply on mockups.`);
          setLogoBase64(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(w, 400);
          canvas.height = Math.min(h, 400);
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let hasAlpha = false;

            for (let i = 3; i < imgData.length; i += 4) {
              if (imgData[i] < 245) {
                hasAlpha = true;
                break;
              }
            }

            if (!hasAlpha) {
              setLogoError('Solid background detected! Please upload a logo with a transparent background (PNG or WEBP) so it prints seamlessly on products without a white box.');
              setLogoBase64(null);
              setHasTransparency(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
              return;
            }
          }
        } catch {
          // fallback
        }

        setHasTransparency(true);
        setLogoBase64(dataUrl);
        setLogoError(null);
      };

      img.onerror = () => {
        setLogoError('Unable to process the image file. Please verify it is a valid PNG or WEBP image.');
        setLogoBase64(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  };

  // ── Step 1 Validation & Proceed to Step 2 ─────────────────────────────────
  const handleProceedToStep2 = () => {
    setStep1Error(null);

    if (!storeName.trim() || storeName.trim().length < 2) {
      setStep1Error('Please enter a valid Store Name (minimum 2 characters).');
      return;
    }
    if (!productNamePrefix.trim() || productNamePrefix.trim().length < 2) {
      setStep1Error('Product Name Prefix is required (e.g. Eagles, Westlake High).');
      return;
    }
    if (!phone.trim()) {
      setStep1Error('Please provide a contact Phone Number.');
      return;
    }
    if (!address.trim()) {
      setStep1Error('Please provide your operational or business Address.');
      return;
    }
    if (!logoBase64 && (!latestStore || !latestStore.logoUrl)) {
      setStep1Error('A transparent store logo (PNG, WEBP, or SVG) is required.');
      return;
    }

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── submit (Step 2 final) ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!productNamePrefix.trim()) {
      setSubmitError('Product name prefix is required (e.g. Eagles, Westlake High).');
      return;
    }

    if (!logoBase64 && (!latestStore || !latestStore.logoUrl)) {
      setSubmitError('A transparent store logo (PNG, WEBP, or SVG) is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitVendorStoreApi({
        storeName: storeName.trim(),
        vendorName: vendorName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        productNamePrefix: productNamePrefix.trim(),
        collectionSlugs: selectedCollectionSlugs,
        productIds: selectedProducts.map((p) => p.id),
        selectedProducts: selectedProducts.map((p) => ({
          productId: p.id,
          selectedColors: p.selectedColors,
          customColors: p.customColors,
          selectedSizes: p.selectedSizes,
        })),
        logoBase64: logoBase64 ?? undefined,
      });
      setIsSubmitted(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Submission failed. Please check your connection and try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── auth loading skeleton ────────────────────────────────────────────────
  if (authLoading || loadingExisting) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="bg-white p-8 md:p-16 rounded-[60px] border border-slate-100 shadow-2xl space-y-12">
          <div className="space-y-4 flex flex-col items-center">
            <Skeleton className="h-6 w-40 rounded-full" />
            <Skeleton className="h-16 w-80 rounded-2xl" />
            <Skeleton className="h-4 w-64 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-40 rounded-[32px]" />
        </div>
      </div>
    );
  }

  // ─── success ──────────────────────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-12 rounded-[40px] border border-slate-100 shadow-2xl text-center space-y-8"
        >
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12 text-[#FF7348]" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-tight">
              Deployment Successful
            </h2>
            <p className="text-slate-500 font-medium italic">
              Your vendor application has been logged. Our performance leads will review your store credentials within 24 hours.
            </p>
          </div>
          <button
            onClick={() => (window.location.href = '/')}
            className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase italic tracking-widest text-sm hover:bg-orange-600 transition-all shadow-xl shadow-orange-600/10 active:scale-[0.98]"
          >
            Return to HQ
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── pending state ────────────────────────────────────────────────────────
  if (latestStore && latestStore.status === 'pending' && !isSubmitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-12 rounded-[40px] border border-slate-100 shadow-2xl text-center space-y-8"
        >
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
            <Loader2 className="w-12 h-12 text-[#FF7348] animate-spin" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-tight">
              Application Pending
            </h2>
            <p className="text-slate-500 font-medium italic">
              Your vendor application for <span className="font-bold text-slate-900">{latestStore.storeName}</span> is currently under review by our team. You will be notified once a decision has been made.
            </p>
          </div>
          <button
            onClick={() => (window.location.href = '/')}
            className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase italic tracking-widest text-sm hover:bg-orange-600 transition-all shadow-xl shadow-orange-600/10 active:scale-[0.98]"
          >
            Return to HQ
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── rejected state (no resubmission) ─────────────────────────────────────
  if (latestStore && latestStore.status === 'rejected' && !latestStore.allowedResubmission && !isSubmitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-12 rounded-[40px] border border-slate-100 shadow-2xl text-center space-y-8"
        >
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <X className="w-12 h-12 text-red-500" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-tight">
              Application Rejected
            </h2>
            <p className="text-slate-500 font-medium italic">
              Unfortunately, your vendor application for <span className="font-bold text-slate-900">{latestStore.storeName}</span> has been declined.
            </p>
            {latestStore.rejectionReason && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-1">Reason</p>
                <p className="text-sm text-slate-800 font-medium italic">{latestStore.rejectionReason}</p>
              </div>
            )}
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic mt-4">
              Resubmission is currently not allowed.
            </p>
          </div>
          <button
            onClick={() => (window.location.href = '/')}
            className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase italic tracking-widest text-sm hover:bg-red-600 transition-all shadow-xl shadow-red-600/10 active:scale-[0.98]"
          >
            Return to HQ
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── approved state ───────────────────────────────────────────────────────
  if (latestStore && latestStore.status === 'approved' && !isSubmitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-white p-12 rounded-[40px] border border-slate-100 shadow-2xl text-center space-y-8"
        >
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-tight">
              Store Active
            </h2>
            <p className="text-slate-500 font-medium italic">
              Your vendor store <span className="font-bold text-slate-900">{latestStore.storeName}</span> is currently active and approved.
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-4 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Approved On</span>
              <span className="text-sm text-slate-800 font-bold italic">
                {new Date(latestStore.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="text-left mt-8 border-t border-slate-100 pt-8 space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center overflow-hidden shrink-0">
                {latestStore.logoUrl ? (
                  <img src={latestStore.logoUrl} className="w-full h-full object-contain p-2" alt="Store logo" />
                ) : (
                  <Store className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-1">Store Identity</p>
                <h3 className="text-3xl font-black italic tracking-tighter text-slate-900 leading-none mb-2">{latestStore.storeName}</h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{latestStore.vendorName}</p>
                {latestStore.productNamePrefix && (
                  <p className="text-[11px] font-bold text-[#FF7348] italic mt-1">
                    Catalog Naming: AF1 {latestStore.productNamePrefix} [Product]
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-2">Assigned Collections</p>
                <div className="flex flex-wrap gap-2">
                  {latestStore.collectionSlugs?.length > 0 ? (
                    latestStore.collectionSlugs.map((s) => {
                      const colName = collections.find((c) => c.slug === s)?.name || s;
                      return (
                        <span key={s} className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-bold uppercase tracking-widest italic border border-slate-100">
                          {colName}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-400 italic">None</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-2">Registration Email</p>
                <p className="text-sm font-bold text-slate-700 italic">{latestStore.email}</p>
              </div>
            </div>

            {latestStore.products?.length > 0 && (
              <div className="pt-4 border-t border-slate-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-4">
                  Store Products ({latestStore.products.length})
                </p>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                  {latestStore.products.slice(0, 5).map((p) => (
                    <div key={p._id} className="aspect-square bg-slate-50 rounded-xl overflow-hidden border border-slate-100 group relative">
                      <img src={p.mainImageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                  ))}
                  {latestStore.products.length > 5 && (
                    <div className="aspect-square bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center">
                      <span className="text-xs font-black italic text-slate-400">+{latestStore.products.length - 5}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => (window.location.href = '/')}
            className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase italic tracking-widest text-sm hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-600/10 active:scale-[0.98] mt-8"
          >
            Return to HQ
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── paused state ─────────────────────────────────────────────────────────
  if (latestStore && latestStore.status === 'paused' && !isSubmitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-white p-12 rounded-[40px] border border-slate-100 shadow-2xl text-center space-y-8"
        >
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
            <Store className="w-12 h-12 text-slate-500" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-tight">
              Store Paused
            </h2>
            <p className="text-slate-500 font-medium italic">
              Your vendor store <span className="font-bold text-slate-900">{latestStore.storeName}</span> has been temporarily paused by administration.
            </p>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 mt-4 text-center">
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-widest italic">
                Please contact support for more details regarding your store&apos;s status.
              </p>
            </div>
          </div>

          <button
            onClick={() => (window.location.href = '/')}
            className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase italic tracking-widest text-sm hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98] mt-8"
          >
            Return to HQ
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── MAIN 2-STEP FORM ─────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-12 space-y-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block bg-orange-50 px-6 py-2 rounded-full mb-2"
        >
          <span className="text-[#FF7348] text-xs font-black uppercase tracking-[0.3em] italic">Operational Expansion</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-slate-900 leading-none"
        >
          Vendor <span className="text-[#FF7348]">Enlistment</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 font-medium italic text-base md:text-lg max-w-xl mx-auto pt-2"
        >
          Integrate your brand into the AF1 ecosystem. Professional-grade commerce for elite players.
        </motion.p>
      </div>

      {/* 2-Step Interactive Progress Bar */}
      <div className="mb-10 max-w-2xl mx-auto">
        <div className="grid grid-cols-2 gap-4 relative">
          {/* Step 1 Button/Indicator */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3.5 text-left ${
              currentStep === 1
                ? 'bg-black text-white border-black shadow-xl shadow-black/10'
                : 'bg-white text-slate-700 border-emerald-500/40 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                currentStep === 1
                  ? 'bg-[#FF7348] text-white'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}
            >
              {currentStep === 2 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Step 1</p>
              <p className="text-xs font-black uppercase tracking-tight italic truncate">Store & Personal Details</p>
            </div>
          </button>

          {/* Step 2 Button/Indicator */}
          <button
            type="button"
            onClick={() => {
              if (currentStep === 1) handleProceedToStep2();
            }}
            className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3.5 text-left ${
              currentStep === 2
                ? 'bg-black text-white border-black shadow-xl shadow-black/10'
                : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200 shadow-sm'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                currentStep === 2 ? 'bg-[#FF7348] text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              2
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Step 2</p>
              <p className="text-xs font-black uppercase tracking-tight italic truncate">Products & Variations</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Form Container */}
      <motion.form
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white p-6 md:p-14 rounded-[48px] md:rounded-[60px] border border-slate-100 shadow-2xl space-y-12"
      >
        {latestStore?.status === 'rejected' && latestStore?.allowedResubmission && (
          <div className="p-6 bg-red-50 border border-red-100 rounded-3xl -mt-4">
            <h3 className="text-[11px] font-black text-red-600 uppercase tracking-widest italic mb-2">
              Previous Application Rejected
            </h3>
            <p className="text-sm font-medium text-red-500 italic mb-4">
              Your previous application for <strong className="text-red-700">{latestStore.storeName}</strong> was rejected. You have been granted permission to resubmit. Ensure you use the exact same Store Name to update your application.
            </p>
            {latestStore.rejectionReason && (
              <div className="bg-white/60 p-4 rounded-2xl border border-red-100/50">
                <p className="text-[10px] font-black text-red-400/80 uppercase tracking-widest italic mb-1">Admin Feedback</p>
                <p className="text-sm font-bold text-red-900 italic">{latestStore.rejectionReason}</p>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 1: STORE & PERSONAL DETAILS
           ════════════════════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.25 }}
            className="space-y-12"
          >
            {/* ── Section A: Personal Details ── */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-[#FF7348]">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 italic">
                      Personal Information
                    </h2>
                    <p className="text-[10px] text-slate-400 italic">Account owner credentials</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                  <Lock className="w-3 h-3 text-slate-400" /> Account Verified
                </span>
              </div>

              {/* Name & Email (Auto-fetched & unchangeable) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-2">
                    <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 italic">
                      <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
                    </label>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Auto-Fetched
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={vendorName}
                      className="w-full bg-slate-100/70 border border-slate-200/80 rounded-2xl py-4 px-6 text-sm font-bold italic text-slate-700 cursor-not-allowed select-none outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-2">
                    <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 italic">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
                    </label>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Auto-Fetched
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      readOnly
                      value={email}
                      className="w-full bg-slate-100/70 border border-slate-200/80 rounded-2xl py-4 px-6 text-sm font-bold italic text-slate-700 cursor-not-allowed select-none outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Phone & Address (Editable) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-700 italic ml-2">
                    <Phone className="w-3.5 h-3.5 text-[#FF7348]" /> Phone Number <span className="text-[#FF7348]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl py-4 px-6 outline-none text-sm font-bold transition-all italic placeholder:text-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-700 italic ml-2">
                    <MapPin className="w-3.5 h-3.5 text-[#FF7348]" /> Operational Address <span className="text-[#FF7348]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Street address, City, State, ZIP"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl py-4 px-6 outline-none text-sm font-bold transition-all italic placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* ── Section B: Store Information ── */}
            <div className="space-y-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2.5 pb-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-[#FF7348]">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 italic">
                    Store Identity & Branding
                  </h2>
                  <p className="text-[10px] text-slate-400 italic">Brand name, naming pattern and transparent logo</p>
                </div>
              </div>

              {/* Store Name & Prefix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-700 italic ml-2">
                    <Store className="w-3.5 h-3.5 text-[#FF7348]" /> Store Name <span className="text-[#FF7348]">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Apex Performance Gear"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl py-4 px-6 outline-none text-sm font-bold transition-all italic placeholder:text-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-2">
                    <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-700 italic">
                      <Tag className="w-3.5 h-3.5 text-[#FF7348]" /> Product Name Prefix <span className="text-[#FF7348]">*</span>
                    </label>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
                      AF1 [Prefix] Product
                    </span>
                  </div>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Eagles, Westlake High, Apex"
                    value={productNamePrefix}
                    onChange={(e) => setProductNamePrefix(e.target.value)}
                    className="w-full bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl py-4 px-6 outline-none text-sm font-bold transition-all italic placeholder:text-slate-300"
                  />
                  <p className="text-[11px] text-slate-400 italic ml-2">
                    {productNamePrefix.trim() ? (
                      <span>
                        Live Preview: <strong className="text-slate-900 not-italic">AF1 {productNamePrefix.trim()} HS Hoodie</strong>
                      </span>
                    ) : (
                      'Prefix attached to all product titles generated for your store.'
                    )}
                  </p>
                </div>
              </div>

              {/* Logo Upload with Transparent Background & Resolution Checking */}
              <div className="space-y-3">
                <div className="flex items-center justify-between ml-2">
                  <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-700 italic">
                    <ImageIcon className="w-3.5 h-3.5 text-[#FF7348]" /> Store Logo (Transparent Background) <span className="text-[#FF7348]">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                    PNG, WEBP, or SVG • Min. 500×500px
                  </span>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`group cursor-pointer aspect-video md:aspect-[3/1] rounded-[32px] flex flex-col items-center justify-center gap-4 transition-all overflow-hidden relative ${
                    logoError
                      ? 'bg-red-50/50 border-2 border-dashed border-red-300 hover:bg-red-50'
                      : logoBase64
                      ? 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50 border-2 border-emerald-400 shadow-inner'
                      : 'bg-slate-50 border-2 border-dashed border-slate-200 hover:bg-slate-100 hover:border-orange-300/60'
                  }`}
                >
                  {logoBase64 ? (
                    <div className="relative w-full h-full flex items-center justify-center p-6">
                      <img src={logoBase64} alt="Store Logo" className="max-w-full max-h-full object-contain drop-shadow-sm" />
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {hasTransparency ? 'Transparent OK' : 'Verified'}{' '}
                          {logoDimensions ? `(${logoDimensions.width}×${logoDimensions.height}px)` : ''}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/75 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to replace logo
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6 text-[#FF7348]" />
                      </div>
                      <div className="text-center px-4">
                        <p className="text-[12px] font-black text-slate-900 uppercase italic tracking-wider">
                          Upload Transparent Logo
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          PNG, WEBP, or SVG • Must have a transparent background • Min. 500×500px
                        </p>
                      </div>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.webp,.svg,image/png,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>

                {logoError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{logoError}</span>
                  </div>
                )}
              </div>

              {/* Product Verticals */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between ml-2">
                  <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 italic">
                    <Tag className="w-3.5 h-3.5" /> Product Verticals / Categories
                  </label>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
                    Optional
                  </span>
                </div>
                {loadingCollections ? (
                  <div className="flex flex-wrap gap-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-14 w-36 rounded-2xl" />
                    ))}
                  </div>
                ) : collections.length === 0 ? (
                  <p className="text-sm text-slate-400 italic ml-2">No collections available.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {collections.map((col) => {
                      const active = selectedCollectionSlugs.includes(col.slug);
                      return (
                        <button
                          key={col.slug}
                          type="button"
                          onClick={() => toggleCollection(col.slug)}
                          className={`px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest italic transition-all border-2 ${
                            active
                              ? 'bg-black text-white border-black shadow-lg shadow-black/20'
                              : 'bg-white text-slate-500 border-slate-100 hover:border-orange-200'
                          }`}
                        >
                          {col.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Error & Step 1 Next Action */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              {step1Error && (
                <div className="px-6 py-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-xs font-bold text-red-700 italic uppercase tracking-wider">{step1Error}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleProceedToStep2}
                className="group w-full bg-black text-white py-6 rounded-[28px] font-black uppercase italic tracking-[0.2em] text-base md:text-lg hover:bg-[#FF7348] transition-all duration-500 shadow-2xl flex items-center justify-center gap-4 active:scale-[0.99]"
              >
                <span>Continue to Product Selection</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-3 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 2: PRODUCT SELECTION & VARIATIONS
           ════════════════════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-12"
          >
            {/* Step 2 Back & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-[#FF7348]">
                    <Package className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 italic">
                    Product Selection & Variations
                  </h2>
                </div>
                <p className="text-xs text-slate-400 italic">
                  Select products from the catalog and customize the colorways and sizes for your store.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-colors italic"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Step 1</span>
              </button>
            </div>

            {/* Product Selector Dropdown */}
            <div className="space-y-4">
              <div className="flex items-center justify-between ml-2">
                <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 italic">
                  <Search className="w-3.5 h-3.5 text-[#FF7348]" /> Browse & Choose Catalog Products
                </label>
                <span className="text-[10px] font-black text-[#FF7348] uppercase tracking-widest italic">
                  {selectedProducts.length} Product{selectedProducts.length !== 1 ? 's' : ''} Selected
                </span>
              </div>

              <div className="relative" ref={dropdownRef}>
                {/* Trigger */}
                <div
                  onClick={() => setDropdownOpen((o) => !o)}
                  className={`w-full bg-slate-50 border rounded-3xl p-5 min-h-[72px] flex flex-wrap gap-2 cursor-pointer transition-all items-center ${
                    dropdownOpen ? 'border-orange-200 bg-white shadow-md' : 'border-slate-200/60 hover:bg-slate-100/60'
                  }`}
                >
                  {selectedProducts.length > 0 ? (
                    selectedProducts.map((p) => (
                      <span
                        key={p.id}
                        className="bg-white border border-slate-200 py-2 px-4 rounded-xl text-[11px] font-bold uppercase italic text-slate-700 flex items-center gap-2 shadow-sm"
                      >
                        {truncate(p.name)}
                        <X
                          className="w-3.5 h-3.5 hover:text-red-500 cursor-pointer flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeProduct(p.id);
                          }}
                        />
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-sm italic font-medium ml-2">
                      Click to search & select catalog products for your store...
                    </span>
                  )}
                  <div className="ml-auto pr-2 flex-shrink-0">
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                        dropdownOpen ? 'rotate-180 text-black' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Dropdown panel */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-50 w-full mt-3 bg-white border border-slate-200 rounded-[32px] shadow-2xl overflow-hidden"
                    >
                      {/* Search bar inside dropdown */}
                      <div className="px-5 pt-5 pb-3 bg-slate-50/50 border-b border-slate-100">
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            ref={searchRef}
                            type="text"
                            placeholder="Search catalog products..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold italic placeholder:text-slate-300 outline-none focus:border-orange-400 transition-all"
                          />
                          {productSearch && (
                            <button
                              type="button"
                              onClick={() => setProductSearch('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Product list items */}
                      <div className="max-h-[300px] overflow-y-auto px-4 py-2 space-y-1.5">
                        {loadingProducts ? (
                          <div className="py-6 space-y-2">
                            {[1, 2, 3, 4].map((i) => (
                              <Skeleton key={i} className="h-12 w-full rounded-xl" />
                            ))}
                          </div>
                        ) : products.length === 0 ? (
                          <div className="py-10 text-center">
                            <p className="text-sm font-black italic uppercase tracking-tight text-slate-300">
                              {debouncedSearch ? 'No products match your search' : 'No products available'}
                            </p>
                          </div>
                        ) : (
                          products.map((product) => {
                            const isSelected = selectedProducts.some((p) => p.id === product.id);
                            return (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => toggleProduct(product)}
                                className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all ${
                                  isSelected
                                    ? 'bg-orange-50 text-[#FF7348] border border-orange-200/60'
                                    : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {product.mainImageUrl ? (
                                    <img
                                      src={product.mainImageUrl}
                                      alt={product.name}
                                      className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                      <Package className="w-5 h-5 text-slate-400" />
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-sm font-black uppercase italic tracking-tight line-clamp-1">
                                      {product.name}
                                    </span>
                                    {product.basePrice !== undefined && (
                                      <span className="text-[10px] font-bold text-slate-400">
                                        Base: ${product.basePrice}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {isSelected ? (
                                  <div className="w-6 h-6 rounded-full bg-[#FF7348] text-white flex items-center justify-center shadow-md shrink-0">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-lg border-2 border-slate-200 shrink-0" />
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Footer */}
                      <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {hasMore && (
                            <button
                              type="button"
                              onClick={handleLoadMore}
                              disabled={loadingMore}
                              className="flex items-center gap-2 h-9 px-5 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase italic tracking-widest text-slate-600 hover:bg-black hover:text-white transition-all disabled:opacity-50"
                            >
                              {loadingMore ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  Load More <ChevronDown className="w-3 h-3" />
                                </>
                              )}
                            </button>
                          )}
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                            {products.length} product{products.length !== 1 ? 's' : ''}{hasMore ? '+' : ''}
                          </span>
                        </div>
                        {selectedProducts.length > 0 && (
                          <span className="text-[10px] font-black text-[#FF7348] uppercase tracking-widest italic">
                            {selectedProducts.length} selected
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Selected Products Cards with Variation Controls */}
            <div className="space-y-6">
              <div className="flex items-center justify-between ml-2">
                <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 italic">
                  <Palette className="w-3.5 h-3.5 text-[#FF7348]" /> Selected Products & Variations Configuration
                </label>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                  Colors & Sizes customization
                </span>
              </div>

              {selectedProducts.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-slate-200 rounded-[32px] text-center bg-slate-50/50 space-y-3">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-slate-300">
                    <Package className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-black uppercase italic text-slate-700 tracking-wider">
                    No products added yet
                  </h3>
                  <p className="text-xs text-slate-400 italic max-w-sm mx-auto">
                    Use the product dropdown above to select items. Each selected product will show its available colorways and sizes for customization.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedProducts.map((p, idx) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 md:p-8 bg-slate-50/70 border border-slate-200/80 rounded-[32px] hover:border-slate-300 transition-all space-y-6 relative"
                    >
                      {/* Product Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                            {p.mainImageUrl ? (
                              <img src={p.mainImageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-7 h-7 text-slate-300" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#FF7348] italic">
                                #{idx + 1}
                              </span>
                              <h3 className="text-base md:text-lg font-black italic uppercase tracking-tight text-slate-900 leading-tight">
                                {p.name}
                              </h3>
                            </div>
                            <p className="text-xs text-slate-400 italic mt-0.5">
                              Catalog Naming: <span className="font-bold text-slate-700">AF1 {productNamePrefix.trim() || '[Prefix]'} {p.name}</span>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeProduct(p.id)}
                          className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                          title="Remove product"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-slate-200/60" />

                      {/* Variations Controls: Colors */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 italic flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5 text-[#FF7348]" /> Color Variations
                          </label>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                            {p.selectedColors.length + p.customColors.length} color(s) active
                          </span>
                        </div>

                        {/* Available Colors from Product */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 italic">
                            Available in Master Product:
                          </p>
                          {p.availableColors.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No predefined colors found on this product.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {p.availableColors.map((color) => {
                                const isColorSelected = p.selectedColors.includes(color);
                                return (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => toggleProductColor(p.id, color)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase italic tracking-wider transition-all flex items-center gap-1.5 border ${
                                      isColorSelected
                                        ? 'bg-black text-white border-black shadow-sm'
                                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    {isColorSelected && <Check className="w-3 h-3 text-[#FF7348] stroke-[3]" />}
                                    <span>{color}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Custom Colors added by Vendor */}
                        <div className="space-y-2 pt-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 italic">
                            Custom Colors for your Store:
                          </p>
                          <div className="flex flex-wrap gap-2 items-center">
                            {p.customColors.map((color) => (
                              <span
                                key={color}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase italic tracking-wider bg-orange-100/70 text-[#FF7348] border border-orange-200 flex items-center gap-1.5"
                              >
                                <span>{color}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomColor(p.id, color)}
                                  className="hover:text-red-600 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}

                            {/* Add Custom Color Input */}
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Add custom color..."
                                value={customColorInputs[p.id] || ''}
                                onChange={(e) =>
                                  setCustomColorInputs((prev) => ({ ...prev, [p.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCustomColor(p.id);
                                  }
                                }}
                                className="h-8 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold italic placeholder:text-slate-300 outline-none focus:border-[#FF7348] transition-all w-36 sm:w-44"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddCustomColor(p.id)}
                                className="h-8 px-3 rounded-xl bg-slate-900 text-white hover:bg-[#FF7348] text-[10px] font-black uppercase tracking-wider italic transition-colors flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Variations Controls: Sizes (Optional) */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 italic flex items-center gap-1.5">
                            <Ruler className="w-3.5 h-3.5 text-[#FF7348]" /> Size Variations (Optional)
                          </label>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                            {p.selectedSizes.length} size(s) selected
                          </span>
                        </div>

                        {p.availableSizes.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No specific sizes defined for this product.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {p.availableSizes.map((size) => {
                              const isSizeSelected = p.selectedSizes.includes(size);
                              return (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => toggleProductSize(p.id, size)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase italic tracking-wider transition-all flex items-center gap-1.5 border ${
                                    isSizeSelected
                                      ? 'bg-black text-white border-black shadow-sm'
                                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  {isSizeSelected && <Check className="w-3 h-3 text-[#FF7348] stroke-[3]" />}
                                  <span>{size}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2 Submit Action */}
            <div className="pt-8 border-t border-slate-100 space-y-4">
              {submitError && (
                <div className="px-6 py-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-xs font-bold text-red-700 italic uppercase tracking-wider">{submitError}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-8 py-5 rounded-[28px] border-2 border-slate-200 text-slate-700 font-black uppercase italic tracking-wider text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Step 1</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group flex-1 w-full bg-black text-white py-6 rounded-[28px] font-black uppercase italic tracking-[0.2em] text-base md:text-lg hover:bg-[#FF7348] transition-all duration-500 shadow-2xl flex items-center justify-center gap-4 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Deploying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Deploy Credentials & Register Store</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-3 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6 italic">
                By clicking deploy, you agree to our Vendor Service Protocols and Tactical Standards.
              </p>
            </div>
          </motion.div>
        )}
      </motion.form>
    </div>
  );
};
