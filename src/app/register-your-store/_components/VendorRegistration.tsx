'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import {
  Store, User, Mail, Image as ImageIcon, Tag, Package,
  ChevronDown, X, Plus, CheckCircle2, ArrowRight, Search, Loader2,
} from 'lucide-react';
import { getCollectionHierarchyApi } from '@/lib/api/publicCollections';
import { getExploreProductsApi } from '@/lib/api/publicProducts';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import type { CollectionHierarchy } from '@/lib/api/types';
import { submitVendorStoreApi, getMyVendorStoresApi, type MyVendorStore } from '@/lib/api/vendorStores';

const PAGE_SIZE = 24;

interface CachedProduct { id: string; name: string; }

interface FetchCacheEntry {
  products: CachedProduct[];
  currentPage: number;
  hasMore: boolean;
}

/** Build a stable cache key from sorted slugs + search query */
const makeCacheKey = (slugs: string[], search: string) =>
  `${[...slugs].sort().join(',')}||${search.trim().toLowerCase()}`;

const isTeamStore = (name: string, slug: string) =>
  name.toLowerCase().includes('team store') || slug.toLowerCase().includes('team-store');

const truncate = (s: string, n = 18) => s.length > n ? s.slice(0, n) + '…' : s;

export const VendorRegistration: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // ── auth guard ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/register-your-store');
    }
  }, [authLoading, isAuthenticated, router]);

  // ── form ────────────────────────────────────────────────────────────────────
  const [storeName, setStoreName] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCollectionSlugs, setSelectedCollectionSlugs] = useState<string[]>([]);
  // store {id, name} so we always have the label even after page changes
  const [selectedProducts, setSelectedProducts] = useState<CachedProduct[]>([]);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── existing applications ──────────────────────────────────────────────────
  const [existingStores, setExistingStores] = useState<MyVendorStore[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(true);

  useEffect(() => {
    if (authLoading) return; // Wait until auth status is resolved

    if (isAuthenticated) {
      setLoadingExisting(true);
      getMyVendorStoresApi()
        .then(res => {
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
      if (user.name)  setVendorName(user.name);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  // ── collections (fetched once on mount) ───────────────────────────────────
  const [collections, setCollections] = useState<CollectionHierarchy[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);

  // ── product dropdown state ────────────────────────────────────────────────
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<CachedProduct[]>([]);
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
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [productSearch]);

  // ── close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── focus search when dropdown opens ──────────────────────────────────────
  useEffect(() => {
    if (dropdownOpen) setTimeout(() => searchRef.current?.focus(), 80);
    else setProductSearch('');
  }, [dropdownOpen]);

  // ── core product fetch (writes to cache after every successful load) ───────
  const fetchProducts = useCallback(async (page: number, append: boolean) => {
    append ? setLoadingMore(true) : setLoadingProducts(true);

    const search = debouncedSearch.trim() || undefined;
    const cacheKey = makeCacheKey(selectedCollectionSlugs, debouncedSearch);

    try {
      let nextProducts: CachedProduct[] = [];
      let nextHasMore = false;

      if (selectedCollectionSlugs.length === 0) {
        const res = await getExploreProductsApi({ page, pageSize: PAGE_SIZE, search });
        if (res?.ok) {
          nextProducts = res.items.map((p) => ({ id: p.id, name: p.name }));
          nextHasMore = res.pagination.page < res.pagination.totalPages;
        }
      } else {
        const calls = selectedCollectionSlugs.map((slug) =>
          getExploreProductsApi({ collection: slug, page, pageSize: PAGE_SIZE, search })
            .catch(() => null)
        );
        const results = await Promise.all(calls);
        const merged = new Map<string, CachedProduct>();
        results.forEach((res) => {
          if (res?.ok && res.items) {
            res.items.forEach((p) => merged.set(p.id, { id: p.id, name: p.name }));
            if (res.pagination.page < res.pagination.totalPages) nextHasMore = true;
          }
        });
        nextProducts = Array.from(merged.values());
      }

      setProducts((prev) => {
        const merged = append
          ? (() => { const m = new Map(prev.map((p) => [p.id, p])); nextProducts.forEach((p) => m.set(p.id, p)); return Array.from(m.values()); })()
          : nextProducts;
        // ── write to cache ──────────────────────────────────────────────────
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
  }, [selectedCollectionSlugs, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── on open / collection / search change: restore from cache or fetch ──────
  useEffect(() => {
    if (!dropdownOpen) return;

    const cacheKey = makeCacheKey(selectedCollectionSlugs, debouncedSearch);
    const cached = fetchCacheRef.current.get(cacheKey);

    if (cached) {
      // Instant restore — no network
      setProducts(cached.products);
      setCurrentPage(cached.currentPage);
      setHasMore(cached.hasMore);
      return;
    }

    // Cache miss — go fetch page 1
    setCurrentPage(1);
    fetchProducts(1, false);
  }, [dropdownOpen, selectedCollectionSlugs, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = () => {
    fetchProducts(currentPage + 1, true);
  };

  // ── togglers ──────────────────────────────────────────────────────────────
  const toggleCollection = (slug: string) => {
    setSelectedCollectionSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const toggleProduct = (item: CachedProduct) => {
    setSelectedProducts((prev) =>
      prev.some((p) => p.id === item.id)
        ? prev.filter((p) => p.id !== item.id)
        : [...prev, item]
    );
  };

  // ── logo ──────────────────────────────────────────────────────────────────
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogoBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await submitVendorStoreApi({
        storeName,
        vendorName,
        email,
        collectionSlugs: selectedCollectionSlugs,
        productIds: selectedProducts.map((p) => p.id),
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
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
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
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
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
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
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
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
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
                {latestStore.logoUrl ? <img src={latestStore.logoUrl} className="w-full h-full object-contain p-2" /> : <Store className="w-8 h-8 text-slate-300" />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-1">Store Identity</p>
                <h3 className="text-3xl font-black italic tracking-tighter text-slate-900 leading-none mb-2">{latestStore.storeName}</h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{latestStore.vendorName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-2">Assigned Collections</p>
                <div className="flex flex-wrap gap-2">
                  {latestStore.collectionSlugs?.length > 0 ? latestStore.collectionSlugs.map(s => {
                    const colName = collections.find(c => c.slug === s)?.name || s;
                    return (
                      <span key={s} className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-bold uppercase tracking-widest italic border border-slate-100">{colName}</span>
                    );
                  }) : <span className="text-xs text-slate-400 italic">None</span>}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-2">Registration Email</p>
                <p className="text-sm font-bold text-slate-700 italic">{latestStore.email}</p>
              </div>
            </div>

            {latestStore.products?.length > 0 && (
              <div className="pt-4 border-t border-slate-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-4">Portfolio Highlights ({latestStore.products.length})</p>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                  {latestStore.products.slice(0, 5).map(p => (
                    <div key={p._id} className="aspect-square bg-slate-50 rounded-xl overflow-hidden border border-slate-100 group relative">
                      <img src={p.mainImageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform"/>
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
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
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
                Please contact support for more details regarding your store's status.
              </p>
            </div>
          </div>

          <div className="text-left mt-8 border-t border-slate-100 pt-8 space-y-6 opacity-70 grayscale">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center overflow-hidden shrink-0">
                {latestStore.logoUrl ? <img src={latestStore.logoUrl} className="w-full h-full object-contain p-2" /> : <Store className="w-8 h-8 text-slate-300" />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-1">Store Identity</p>
                <h3 className="text-3xl font-black italic tracking-tighter text-slate-900 leading-none mb-2">{latestStore.storeName}</h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{latestStore.vendorName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-2">Assigned Collections</p>
                <div className="flex flex-wrap gap-2">
                  {latestStore.collectionSlugs?.length > 0 ? latestStore.collectionSlugs.map(s => {
                    const colName = collections.find(c => c.slug === s)?.name || s;
                    return (
                      <span key={s} className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-bold uppercase tracking-widest italic border border-slate-100">{colName}</span>
                    );
                  }) : <span className="text-xs text-slate-400 italic">None</span>}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-2">Registration Email</p>
                <p className="text-sm font-bold text-slate-700 italic">{latestStore.email}</p>
              </div>
            </div>

            {latestStore.products?.length > 0 && (
              <div className="pt-4 border-t border-slate-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-4">Portfolio Highlights ({latestStore.products.length})</p>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                  {latestStore.products.slice(0, 5).map(p => (
                    <div key={p._id} className="aspect-square bg-slate-50 rounded-xl overflow-hidden border border-slate-100 group relative">
                      <img src={p.mainImageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform"/>
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
            className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase italic tracking-widest text-sm hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98] mt-8"
          >
            Return to HQ
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── main form ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      {/* Header */}
      <div className="mb-16 space-y-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="inline-block bg-orange-50 px-6 py-2 rounded-full mb-4">
          <span className="text-[#FF7348] text-xs font-black uppercase tracking-[0.3em] italic">Operational Expansion</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-6xl md:text-7xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
          Vendor <br /><span className="text-[#FF7348]">Enlistment</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-slate-400 font-medium italic text-lg max-w-xl mx-auto pt-4">
          Integrate your brand into the AF1 ecosystem. Professional-grade commerce for elite players.
        </motion.p>
      </div>

      <motion.form initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        onSubmit={handleSubmit}
        className="bg-white p-8 md:p-16 rounded-[60px] border border-slate-100 shadow-2xl space-y-12"
      >
        {latestStore?.status === 'rejected' && latestStore?.allowedResubmission && (
          <div className="p-6 bg-red-50 border border-red-100 rounded-3xl -mt-4">
            <h3 className="text-[11px] font-black text-red-600 uppercase tracking-widest italic mb-2">Previous Application Rejected</h3>
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

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-2">
              <Store className="w-3.5 h-3.5" />Store Name
            </label>
            <input required type="text" placeholder="e.g. Apex Performance Gear"
              className="w-full bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl py-5 px-8 outline-none text-sm font-bold transition-all italic placeholder:text-slate-300"
              value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-2">
              <User className="w-3.5 h-3.5" />Vendor Name
            </label>
            <input required type="text" placeholder="Full Name"
              className="w-full bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl py-5 px-8 outline-none text-sm font-bold transition-all italic placeholder:text-slate-300"
              value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-2">
            <Mail className="w-3.5 h-3.5" />Email Address
          </label>
          <input required type="email" placeholder="operations@yourbrand.com"
            className="w-full bg-slate-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-2xl py-5 px-8 outline-none text-sm font-bold transition-all italic placeholder:text-slate-300"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        {/* Logo Upload */}
        <div className="space-y-6">
          <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-2">
            <ImageIcon className="w-3.5 h-3.5" />Store Logo
          </label>
          <div onClick={() => fileInputRef.current?.click()}
            className="group cursor-pointer aspect-video md:aspect-[3/1] bg-slate-50 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center gap-4 hover:bg-slate-100 hover:border-orange-300/30 transition-all overflow-hidden">
            {logoBase64
              ? <img src={logoBase64} alt="Store Logo" className="w-full h-full object-contain" />
              : <>
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6 text-[#FF7348]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[12px] font-black text-slate-900 uppercase italic tracking-wider">Drag &amp; Drop Logo</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">SVG, PNG, or JPG (Max 5MB)</p>
                  </div>
                </>
            }
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>
        </div>

        {/* Product Verticals */}
        <div className="space-y-6">
          <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic ml-2">
            <Tag className="w-3.5 h-3.5" />Product Verticals
          </label>
          {loadingCollections ? (
            <div className="flex flex-wrap gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-36 rounded-2xl" />
              ))}
            </div>
          ) : collections.length === 0 ? (
            <p className="text-sm text-slate-400 italic ml-2">No collections available.</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {collections.map((col) => {
                const active = selectedCollectionSlugs.includes(col.slug);
                return (
                  <button key={col.slug} type="button" onClick={() => toggleCollection(col.slug)}
                    className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest italic transition-all border-2 ${
                      active ? 'bg-black text-white border-black shadow-lg shadow-black/20'
                             : 'bg-white text-slate-400 border-slate-100 hover:border-orange-200'
                    }`}>
                    {col.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Portfolio dropdown */}
        <div className="space-y-6">
          <div className="flex items-center justify-between ml-2">
            <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
              <Package className="w-3.5 h-3.5" />Existing Product Portfolio
            </label>
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">Optional</span>
          </div>

          <div className="relative" ref={dropdownRef}>
            {/* Trigger */}
            <div
              onClick={() => setDropdownOpen((o) => !o)}
              className={`w-full bg-slate-50 border rounded-3xl p-6 min-h-[80px] flex flex-wrap gap-2 cursor-pointer transition-all items-center ${
                dropdownOpen ? 'border-orange-200 bg-white' : 'border-transparent'
              }`}
            >
              {selectedProducts.length > 0
                ? selectedProducts.map((p) => (
                    <span key={p.id}
                      className="bg-white border border-slate-200 py-2.5 px-5 rounded-xl text-[10px] font-bold uppercase italic text-slate-700 flex items-center gap-2 shadow-sm">
                      {truncate(p.name)}
                      <X className="w-3 h-3 hover:text-red-500 cursor-pointer flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); setSelectedProducts((prev) => prev.filter((x) => x.id !== p.id)); }} />
                    </span>
                  ))
                : <span className="text-slate-300 text-sm italic font-medium ml-2">Select relevant performance assets...</span>
              }
              <div className="ml-auto pr-2 flex-shrink-0">
                <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {/* Dropdown panel */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-50 w-full mt-3 bg-white border border-slate-100 rounded-[32px] shadow-2xl overflow-hidden"
                >
                  {/* Search */}
                  <div className="px-5 pt-5 pb-3">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        ref={searchRef} type="text" placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold italic placeholder:text-slate-300 outline-none focus:border-orange-200 focus:bg-white transition-all"
                      />
                      {productSearch && (
                        <button type="button" onClick={() => setProductSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Product list */}
                  <div className="max-h-[280px] overflow-y-auto px-4 pb-2 space-y-1">
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
                          <button key={product.id} type="button" onClick={() => toggleProduct(product)}
                            className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-all ${
                              isSelected ? 'bg-orange-50 text-[#FF7348]' : 'hover:bg-slate-50 text-slate-600'
                            }`}>
                            <span className="text-sm font-black uppercase italic tracking-tight pr-4">{product.name}</span>
                            {isSelected
                              ? <div className="w-2 h-2 bg-[#FF7348] rounded-full shadow-[0_0_10px_rgba(255,115,72,0.5)] flex-shrink-0" />
                              : <div className="w-4 h-4 rounded-sm border-2 border-slate-100 flex-shrink-0" />
                            }
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Footer: load more + counts */}
                  <div className="px-5 py-4 border-t border-slate-50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {hasMore && (
                        <button type="button" onClick={handleLoadMore} disabled={loadingMore}
                          className="flex items-center gap-2 h-9 px-5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-black uppercase italic tracking-widest text-slate-500 hover:bg-black hover:text-white hover:border-black transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                          {loadingMore
                            ? <><Loader2 className="w-3 h-3 animate-spin" />Loading...</>
                            : <>Load More <ChevronDown className="w-3 h-3" /></>
                          }
                        </button>
                      )}
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                        {products.length} asset{products.length !== 1 ? 's' : ''}{hasMore ? '+' : ''}
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

        {/* Submit */}
        <div className="pt-8 border-t border-slate-50">
          {submitError && (
            <div className="mb-6 px-6 py-4 bg-red-50 border border-red-100 rounded-2xl">
              <p className="text-xs font-bold text-red-500 italic uppercase tracking-wider">
                {submitError}
              </p>
            </div>
          )}
          <button type="submit" disabled={isSubmitting}
            className="group w-full bg-black text-white py-6 rounded-[30px] font-black uppercase italic tracking-[0.2em] text-lg hover:bg-[#FF7348] transition-all duration-500 shadow-2xl flex items-center justify-center gap-4 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed">
            {isSubmitting ? (
              <><Loader2 className="w-6 h-6 animate-spin" />Deploying...</>
            ) : (
              <>Deploy Credentials<ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform" /></>
            )}
          </button>
          <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-8 italic">
            By clicking deploy, you agree to our Vendor Service Protocols and Tactical Standards.
          </p>
        </div>
      </motion.form>
    </div>
  );
};
