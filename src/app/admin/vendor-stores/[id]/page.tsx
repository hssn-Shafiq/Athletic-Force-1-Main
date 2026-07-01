'use client';

import React, { useState, useEffect, useRef, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Store, Mail, User, Tag, Package, CheckCircle, 
  XCircle, Clock, PauseCircle, Save, Loader2, Image as ImageIcon,
  ChevronDown, X, Search as SearchIcon, Plus
} from 'lucide-react';
import { 
  adminGetVendorStoreApi, 
  adminUpdateVendorStoreStatusApi, 
  adminUpdateVendorStoreApi,
  AdminVendorStoreDetail
} from '@/lib/api/vendorStores';
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
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [allowedResubmission, setAllowedResubmission] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  // Edit State
  const [editStoreName, setEditStoreName] = useState('');
  const [editVendorName, setEditVendorName] = useState('');
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
        setSelectedCollectionSlugs(res.store.collectionSlugs);
        setSelectedProducts(res.store.products.map(p => ({ id: p._id, name: p.name })));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to fetch store details');
    } finally {
      setLoading(false);
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
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-600">{store.email}</span>
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
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-4">Portfolio Preview ({store.products.length})</p>
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
                    <button onClick={() => handleStatusChange('approved')} disabled={statusLoading} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4"/> Approve Store
                    </button>
                    <button onClick={() => setRejectModalOpen(true)} disabled={statusLoading} className="w-full py-4 bg-white text-red-500 border border-red-200 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                      <XCircle className="w-4 h-4"/> Reject Store
                    </button>
                  </>
                )}

                {store.status === 'approved' && (
                  <>
                    <button onClick={() => handleStatusChange('paused')} disabled={statusLoading} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black shadow-lg transition-all flex items-center justify-center gap-2">
                      <PauseCircle className="w-4 h-4"/> Pause Store
                    </button>
                  </>
                )}

                {store.status === 'rejected' && (
                  <>
                    <button onClick={() => handleStatusChange('approved')} disabled={statusLoading} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4"/> Re-Approve Store
                    </button>
                  </>
                )}

                {store.status === 'paused' && (
                  <>
                    <button onClick={() => handleStatusChange('approved')} disabled={statusLoading} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4"/> Reactivate Store
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
}
