'use client';

import React, { useState, useEffect, useRef, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Store, Mail, User, Tag, Package, CheckCircle, 
  XCircle, Clock, PauseCircle, Save, Loader2, Image as ImageIcon,
  ChevronDown, X, Search as SearchIcon, Plus, Sparkles, Percent
} from 'lucide-react';
import { 
  adminGetVendorStoreApi, 
  adminUpdateVendorStoreStatusApi, 
  adminUpdateVendorStoreApi,
  adminUpdateStoreCommissionApi,
  AdminVendorStoreDetail
} from '@/lib/api/vendorStores';
import { VendorStoreApprovalModal } from '@/admin/components/VendorStoreApprovalModal';
import { getCollectionHierarchyApi } from '@/lib/api/publicCollections';
import { getExploreProductsApi } from '@/lib/api/publicProducts';
import type { CollectionHierarchy } from '@/lib/api/types';
import Link from 'next/link';

interface CachedProduct { id: string; name: string; }

export default function AdminVendorStoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get('edit') === 'true';
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [store, setStore] = useState<AdminVendorStoreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Status Modal
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [allowedResubmission, setAllowedResubmission] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  // Commission Edit Modal State
  const [commissionModalOpen, setCommissionModalOpen] = useState(false);
  const [modalCommissionRate, setModalCommissionRate] = useState<number>(15);
  const [modalIsCommissionActive, setModalIsCommissionActive] = useState<boolean>(true);
  const [modalCommissionNotes, setModalCommissionNotes] = useState<string>('');
  const [savingCommission, setSavingCommission] = useState(false);

  // Edit State
  const [editStoreName, setEditStoreName] = useState('');
  const [editVendorName, setEditVendorName] = useState('');
  const [editProductNamePrefix, setEditProductNamePrefix] = useState('');
  const [editLogoBase64, setEditLogoBase64] = useState<string | null>(null);
  const [selectedCollectionSlugs, setSelectedCollectionSlugs] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<CachedProduct[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Collections & Products State (for editing)
  const [collections, setCollections] = useState<CollectionHierarchy[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [products, setProducts] = useState<CachedProduct[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStore();
  }, [id]);

  const fetchStore = async () => {
    setLoading(true);
    try {
      const res = await adminGetVendorStoreApi(id);
      if (res?.ok) {
        setStore(res.store);
        // Init edit state
        setEditStoreName(res.store.storeName);
        setEditVendorName(res.store.vendorName);
        setEditProductNamePrefix(res.store.productNamePrefix || '');
        setSelectedCollectionSlugs(res.store.collectionSlugs);
        setSelectedProducts(res.store.products.map(p => ({ id: p._id, name: p.name })));
        if (res.store.commissionRate !== undefined) setModalCommissionRate(res.store.commissionRate);
        if (res.store.isCommissionActive !== undefined) setModalIsCommissionActive(res.store.isCommissionActive);
        if (res.store.commissionNotes !== undefined) setModalCommissionNotes(res.store.commissionNotes);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to fetch store details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCommission = async () => {
    setSavingCommission(true);
    try {
      const res = await adminUpdateStoreCommissionApi(id, {
        commissionRate: modalCommissionRate,
        isCommissionActive: modalIsCommissionActive,
        commissionNotes: modalCommissionNotes,
      });
      if (res?.ok) {
        setStore((prev) => prev ? {
          ...prev,
          commissionRate: res.store.commissionRate,
          isCommissionActive: res.store.isCommissionActive,
          commissionNotes: res.store.commissionNotes,
        } : null);
        setCommissionModalOpen(false);
      }
    } catch (err: any) {
      console.error('Failed to update commission:', err);
      alert(err?.response?.data?.message || 'Failed to update commission settings');
    } finally {
      setSavingCommission(false);
    }
  };

  // Fetch Collections
  useEffect(() => {
    if (isEditing) {
      getCollectionHierarchyApi()
        .then((res) => {
          if (res?.ok && res.hierarchy) setCollections(res.hierarchy);
        })
        .finally(() => setLoadingCollections(false));
    }
  }, [isEditing]);

  // Product Search Debounce & Click Outside
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(productSearch), 400);
    return () => clearTimeout(timer);
  }, [productSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchProducts = useCallback(async (page: number) => {
    setLoadingProducts(true);
    try {
      let nextProducts: CachedProduct[] = [];
      let nextHasMore = false;
      const search = debouncedSearch.trim() || undefined;

      if (selectedCollectionSlugs.length === 0) {
        const res = await getExploreProductsApi({ page, pageSize: 24, search });
        if (res?.ok) {
          nextProducts = res.items.map((p) => ({ id: p.id, name: p.name }));
          nextHasMore = res.pagination.page < res.pagination.totalPages;
        }
      } else {
        const calls = selectedCollectionSlugs.map((slug) =>
          getExploreProductsApi({ collection: slug, page, pageSize: 24, search }).catch(() => null)
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
      setProducts(nextProducts);
      setHasMore(nextHasMore);
      setCurrentPage(page);
    } finally {
      setLoadingProducts(false);
    }
  }, [selectedCollectionSlugs, debouncedSearch]);

  useEffect(() => {
    if (dropdownOpen) fetchProducts(1);
  }, [dropdownOpen, selectedCollectionSlugs, debouncedSearch, fetchProducts]);

  const toggleCollection = (slug: string) => {
    setSelectedCollectionSlugs((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);
  };

  const toggleProduct = (item: CachedProduct) => {
    setSelectedProducts((prev) => prev.some((p) => p.id === item.id) ? prev.filter((p) => p.id !== item.id) : [...prev, item]);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setEditLogoBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      await adminUpdateVendorStoreApi(id, {
        storeName: editStoreName,
        vendorName: editVendorName,
        productNamePrefix: editProductNamePrefix,
        collectionSlugs: selectedCollectionSlugs,
        productIds: selectedProducts.map(p => p.id),
        logoBase64: editLogoBase64 || undefined
      });
      router.replace(`/admin/vendor-stores/${id}`);
      fetchStore();
    } catch (err) {
      console.error(err);
      alert('Failed to update store.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (status: 'pending' | 'approved' | 'rejected' | 'paused') => {
    if (status === 'rejected' && !rejectModalOpen) {
      setRejectModalOpen(true);
      return;
    }
    
    setStatusLoading(true);
    try {
      await adminUpdateVendorStoreStatusApi(id, {
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
        allowedResubmission: status === 'rejected' ? allowedResubmission : undefined
      });
      setRejectModalOpen(false);
      fetchStore();
    } catch(err) {
      alert('Failed to update status.');
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading || !store) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/admin/vendor-stores')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors italic">
          <ArrowLeft className="w-4 h-4" /> Back to Stores
        </button>
        {!isEditing && (
          <button onClick={() => router.push(`?edit=true`)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest italic hover:bg-orange-600 transition-colors shadow-xl shadow-black/10">
            Edit Details
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Info & Edit */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-2xl relative overflow-hidden">
            {isEditing ? (
              <div className="space-y-6">
                <h2 className="text-xl font-black uppercase italic tracking-tighter mb-6">Edit Store Parameters</h2>
                
                {/* Logo Upload */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-2">Store Logo</label>
                  <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center hover:bg-slate-100 transition-colors overflow-hidden">
                    {editLogoBase64 || store.logoUrl ? (
                      <img src={editLogoBase64 || store.logoUrl!} alt="Logo" className="h-full object-contain p-4" />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upload New Logo</span>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-2">Store Name</label>
                    <input type="text" value={editStoreName} onChange={e => setEditStoreName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold italic outline-none focus:border-orange-400" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-2">Vendor Name</label>
                    <input type="text" value={editVendorName} onChange={e => setEditVendorName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold italic outline-none focus:border-orange-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                      Product Name Prefix (Pattern: AF1 [Prefix] Product)
                    </label>
                    <span className="text-[9px] font-bold text-orange-600 uppercase italic">
                      Preview: AF1 {editProductNamePrefix.trim() || 'Prefix'} HS Hoodie
                    </span>
                  </div>
                  <input
                    type="text"
                    value={editProductNamePrefix}
                    onChange={e => setEditProductNamePrefix(e.target.value)}
                    placeholder="e.g. Eagles"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold italic outline-none focus:border-orange-400"
                  />
                </div>

                {/* Collections */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-2">Assigned Collections</label>
                  <div className="flex flex-wrap gap-2">
                    {collections.map(col => (
                      <button key={col.slug} onClick={() => toggleCollection(col.slug)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic border ${selectedCollectionSlugs.includes(col.slug) ? 'bg-black text-white border-black' : 'bg-white text-slate-400 border-slate-200 hover:border-black'}`}>
                        {col.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products */}
                <div className="space-y-3 relative" ref={dropdownRef}>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-2">Linked Products</label>
                  <div onClick={() => setDropdownOpen(!dropdownOpen)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[60px] flex flex-wrap gap-2 cursor-pointer items-center">
                    {selectedProducts.map(p => (
                      <span key={p.id} className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase italic flex items-center gap-2">
                        {p.name.substring(0, 20)}... <X className="w-3 h-3 hover:text-red-500" onClick={(e) => { e.stopPropagation(); toggleProduct(p); }}/>
                      </span>
                    ))}
                    {selectedProducts.length === 0 && <span className="text-slate-400 text-xs italic">Select products...</span>}
                  </div>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-slate-100">
                          <input type="text" placeholder="Search products..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 text-xs outline-none" />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto p-2">
                          {loadingProducts ? <div className="p-4 text-center text-xs text-slate-400">Loading...</div> : 
                           products.map(p => (
                            <button key={p.id} onClick={() => toggleProduct(p)} className={`w-full text-left p-3 rounded-xl text-xs font-bold italic uppercase ${selectedProducts.some(x => x.id === p.id) ? 'bg-orange-50 text-orange-600' : 'hover:bg-slate-50'}`}>
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex gap-4 pt-6">
                  <button onClick={() => router.push(`/admin/vendor-stores/${id}`)} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSaveEdit} disabled={isSaving} className="flex-1 bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-orange-600 transition-colors shadow-xl flex items-center justify-center gap-2">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* View Mode */}
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center overflow-hidden shrink-0">
                    {store.logoUrl ? <img src={store.logoUrl} className="w-full h-full object-contain p-2"/> : <Store className="w-8 h-8 text-slate-300"/>}
                  </div>
                  <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter italic">{store.storeName}</h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{store.vendorName}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-600">{store.email}</span>
                      </div>
                      {store.productNamePrefix && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200/60 rounded-full">
                          <Tag className="w-3 h-3 text-[#FF7348]" />
                          <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">
                            Pattern: AF1 {store.productNamePrefix} [Product]
                          </span>
                        </div>
                      )}
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                        store.isCommissionActive
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}>
                        <Percent className="w-3 h-3 text-emerald-600" />
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          Commission: {store.isCommissionActive ? `${store.commissionRate || 0}%` : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-2">Collections</p>
                    <div className="flex flex-wrap gap-2">
                      {store.collectionSlugs.length > 0 ? store.collectionSlugs.map(s => (
                        <span key={s} className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-bold uppercase tracking-widest italic border border-slate-100">{s}</span>
                      )) : <span className="text-xs text-slate-400 italic">None</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-2">Submitted By</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                        {store.vendorId.avatarUrl ? <img src={store.vendorId.avatarUrl}/> : <User className="w-3 h-3 text-slate-500"/>}
                      </div>
                      <span className="text-xs font-bold text-slate-700 italic">{store.vendorId.name}</span>
                    </div>
                  </div>
                </div>

                {store.rejectionReason && (
                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest italic mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-900 italic font-medium">{store.rejectionReason}</p>
                    <p className="text-[10px] font-bold text-red-400 mt-2">Resubmission: {store.allowedResubmission ? 'Allowed' : 'Not Allowed'}</p>
                  </div>
                )}

                {/* Product Images Preview */}
                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                      {store.status === 'approved' ? 'Branded Store Products' : 'Requested Products (Catalog Templates)'} ({store.products.length})
                    </p>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      store.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                    }`}>
                      {store.status === 'approved' ? 'Vendor Catalog' : 'Form Selection'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2">
                    {store.products.map(p => (
                      <Link href={`/admin/products/${p._id}`} key={p._id} className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 hover:border-slate-200 transition-colors group">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-white">
                          <img src={p.mainImageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform"/>
                        </div>
                        <span className="text-xs font-black uppercase tracking-tight italic text-slate-900 group-hover:text-orange-600 transition-colors">{p.name}</span>
                      </Link>
                    ))}
                    {store.products.length === 0 && <span className="text-xs text-slate-400 italic">No products linked.</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Actions */}
        {!isEditing && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] italic text-slate-400">Command Actions</h3>
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Current Status</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  store.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                  store.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  store.status === 'paused' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-700'
                }`}>{store.status}</span>
              </div>

              <div className="space-y-3">
                {store.status === 'pending' && (
                  <>
                    <button
                      onClick={() => setApprovalModalOpen(true)}
                      disabled={statusLoading}
                      className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-100" /> Review Mockups &amp; Approve
                    </button>
                    <button
                      onClick={() => setRejectModalOpen(true)}
                      disabled={statusLoading}
                      className="w-full py-4 bg-white text-red-500 border border-red-200 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Reject Store
                    </button>
                  </>
                )}

                {store.status === 'approved' && (
                  <>
                    <button
                      onClick={() => setApprovalModalOpen(true)}
                      disabled={statusLoading}
                      className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-orange-200" /> Re-align Mockups &amp; Regenerate
                    </button>
                    <button
                      onClick={() => handleStatusChange('paused')}
                      disabled={statusLoading}
                      className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <PauseCircle className="w-4 h-4" /> Pause Store
                    </button>
                  </>
                )}

                {store.status === 'rejected' && (
                  <>
                    <button
                      onClick={() => setApprovalModalOpen(true)}
                      disabled={statusLoading}
                      className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Review Mockups &amp; Re-Approve
                    </button>
                  </>
                )}

                {store.status === 'paused' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('approved')}
                      disabled={statusLoading}
                      className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Reactivate Store
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Platform Commission Card */}
            <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Platform Commission</h3>
                    <p className="text-[11px] font-bold text-slate-400">Revenue split per sale</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  store.isCommissionActive && (store.commissionRate ?? 0) > 0
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {store.isCommissionActive && (store.commissionRate ?? 0) > 0
                    ? `${store.commissionRate}% Active`
                    : '0% Free'}
                </span>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-5 border border-slate-100 mb-5">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Take Rate</span>
                  <span className="text-2xl font-black italic tracking-tight text-slate-900">
                    {store.isCommissionActive ? `${store.commissionRate ?? 0}%` : '0%'}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                  {store.isCommissionActive && (store.commissionRate ?? 0) > 0 ? (
                    <>Platform deducts <strong className="text-indigo-600">{store.commissionRate}%</strong> from each completed item sale. Vendor nets <strong className="text-slate-800">{100 - (store.commissionRate ?? 0)}%</strong>.</>
                  ) : (
                    <>Store is currently <strong className="text-emerald-600">0% Commission-Free</strong>. Vendor keeps 100% of product sale revenue.</>
                  )}
                </p>
                {store.commissionNotes && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 italic">
                    <span className="font-bold text-slate-700 not-italic">Note: </span>
                    {store.commissionNotes}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setModalCommissionRate(store.commissionRate ?? 0);
                  setModalIsCommissionActive(store.isCommissionActive ?? false);
                  setModalCommissionNotes(store.commissionNotes || '');
                  setCommissionModalOpen(true);
                }}
                className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Percent className="w-3.5 h-3.5" /> Adjust Commission Rate
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Commission Modal */}
      <AnimatePresence>
        {commissionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setCommissionModalOpen(false)} 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 10 }} 
              className="relative bg-white w-full max-w-lg rounded-[32px] p-8 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Commission Settings</h3>
                    <p className="text-xs text-slate-400 font-semibold">{store?.storeName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setCommissionModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Active Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-slate-800">Charge Platform Commission</div>
                    <div className="text-[11px] text-slate-400 font-semibold">Enable or disable commission collection for this store</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalIsCommissionActive(!modalIsCommissionActive)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      modalIsCommissionActive ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span 
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        modalIsCommissionActive ? 'translate-x-6' : 'translate-x-0'
                      }`} 
                    />
                  </button>
                </div>

                {modalIsCommissionActive && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Commission Rate (%)</label>
                        <span className="text-lg font-black italic text-indigo-600">{modalCommissionRate}%</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="50"
                        step="1"
                        value={modalCommissionRate}
                        onChange={(e) => setModalCommissionRate(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <div className="flex gap-2 mt-3">
                        {[0, 10, 15, 20, 25].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setModalCommissionRate(preset)}
                            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                              modalCommissionRate === preset
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {preset === 0 ? '0% Free' : `${preset}%`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live Preview */}
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">Earnings Split on a $100.00 Sale</div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 bg-white rounded-xl border border-indigo-100">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Platform Profit</span>
                          <span className="text-base font-black text-indigo-600">${modalCommissionRate.toFixed(2)}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-indigo-100">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Vendor Payout</span>
                          <span className="text-base font-black text-slate-800">${(100 - modalCommissionRate).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
                    Internal Commission Notes (Optional)
                  </label>
                  <textarea
                    value={modalCommissionNotes}
                    onChange={(e) => setModalCommissionNotes(e.target.value)}
                    placeholder="e.g. Approved with standard 15% rate on launch promotion..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs font-semibold outline-none focus:border-indigo-400"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCommissionModalOpen(false)}
                    className="flex-1 py-3.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-2xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCommission}
                    disabled={savingCommission}
                    className="flex-1 py-3.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    {savingCommission ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      'Save Commission'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setRejectModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.95, opacity:0 }} className="relative bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 mb-6">Reject Application</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-2 block">Reason for rejection (Visible to vendor)</label>
                  <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold italic outline-none focus:border-red-400" placeholder="e.g. Logo resolution is too low..." />
                </div>
                <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer">
                  <input type="checkbox" checked={allowedResubmission} onChange={e => setAllowedResubmission(e.target.checked)} className="w-4 h-4 accent-red-500" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-widest italic">Allow Resubmission</span>
                </label>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setRejectModalOpen(false)} className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                  <button onClick={() => handleStatusChange('rejected')} disabled={statusLoading} className="flex-1 py-3 bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors">
                    {statusLoading ? 'Processing...' : 'Confirm Reject'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2D Mockup Review & Approval Modal */}
      {store && (
        <VendorStoreApprovalModal
          isOpen={approvalModalOpen}
          onClose={() => setApprovalModalOpen(false)}
          store={store}
          onApproved={fetchStore}
        />
      )}
    </div>
  );
}
