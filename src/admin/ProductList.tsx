
"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Package,
  Columns3,
  MessageSquare
} from 'lucide-react';
import { deleteAdminProductApi, getAdminProductCollectionsApi, getAdminProductsApi } from '@/lib/api/products';
import { AdminProduct, ProductCollectionOption } from '@/lib/api/types';
import { getApiErrorMessage } from '@/lib/api/errors';
import { toast } from 'react-toastify';
import { ReviewModerationModal } from './components/ReviewModerationModal';

type ColumnKey = 'product' | 'sku' | 'type' | 'price' | 'stock' | 'status' | 'actions';

const DEFAULT_COLUMN_VISIBILITY: Record<ColumnKey, boolean> = {
  product: true,
  sku: true,
  type: true,
  price: true,
  stock: true,
  status: true,
  actions: true,
};

export const AdminProductList: React.FC = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [collections, setCollections] = useState<ProductCollectionOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'active' | 'draft' | 'archived' | ''>('');
  const [stockFilter, setStockFilter] = useState<'in-stock' | 'out-of-stock' | 'low-stock' | ''>('');
  const [collectionFilter, setCollectionFilter] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'name' | 'basePrice'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [resultCount, setResultCount] = useState(0);
  const [columnVisibility, setColumnVisibility] = useState(DEFAULT_COLUMN_VISIBILITY);
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [selectedProductForReviews, setSelectedProductForReviews] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCollections() {
      const response = await getAdminProductCollectionsApi({ page: 1, pageSize: 200 });
      if (!isMounted) return;
      setCollections(response.items);
    }

    void loadCollections();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      try {
        const response = await getAdminProductsApi({
          page,
          pageSize,
          search: search || undefined,
          status: statusFilter || undefined,
          stock: stockFilter || undefined,
          collectionId: collectionFilter || undefined,
          sortBy,
          sortDir,
        });

        if (!isMounted) return;

        setProducts(response.items);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
        setResultCount(response.pagination.resultCount);
      } finally {
        // Subtle delay to make the skeleton look intentional and premium
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [collectionFilter, page, pageSize, search, sortBy, sortDir, statusFilter, stockFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, stockFilter, collectionFilter, sortBy, sortDir]);

  const pageNumbers = useMemo(() => {
    const numbers: (number | '...')[] = [];
    const maxShown = 5;

    if (totalPages <= maxShown) {
      for (let i = 1; i <= totalPages; i += 1) numbers.push(i);
      return numbers;
    }

    numbers.push(1);
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    if (start > 2) numbers.push('...');
    for (let i = start; i <= end; i += 1) numbers.push(i);
    if (end < totalPages - 1) numbers.push('...');
    numbers.push(totalPages);
    return numbers;
  }, [page, totalPages]);

  const getFirstVariantSku = (product: AdminProduct) => product.variants?.[0]?.sku ?? '-';
  const getStockCount = (product: AdminProduct) => product.inventory?.globalStock ?? 0;
  const getStatusLabel = (product: AdminProduct) => {
    if (product.status === 'active') {
      return 'Active';
    }

    if (product.status === 'archived') {
      return 'Archived';
    }

    return 'Draft';
  };

  async function handleDeleteProduct(productId: string) {
    const confirmed = window.confirm('Delete this product? This action cannot be undone.');
    if (!confirmed) return;

    setIsDeleteSubmitting(true);

    try {
      const response = await deleteAdminProductApi(productId);
      if (response.message) {
        toast.warn(response.message);
      } else {
        toast.success('Product deleted successfully.');
      }

      setProducts((prev) => prev.filter((product) => product.id !== productId));
      setTotal((prev) => Math.max(0, prev - 1));
      setResultCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to delete product.'));
    } finally {
      setIsDeleteSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            Product Inventory
          </h1>
          <p className="text-slate-400 font-medium italic text-sm">Managing {total} products across all vectors.</p>
        </div>
        <button 
          onClick={() => router.push('/admin/products/add')}
          className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>Deploy New Product</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-[30px] border border-slate-100 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by ID, Name, or SKU..." 
            className="w-full bg-slate-50 border border-transparent focus:border-slate-200 focus:bg-white rounded-2xl py-3 pl-12 pr-4 outline-none text-xs font-medium transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsColumnsOpen((prev) => !prev)}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest italic text-slate-500 hover:text-black hover:border-slate-200 transition-all"
            >
              <Columns3 className="w-4 h-4" />
              Columns
            </button>

            {isColumnsOpen ? (
              <div className="absolute right-0 mt-2 min-w-48 rounded-2xl border border-slate-200 bg-white shadow-xl p-3 space-y-2 z-20">
                {(Object.keys(columnVisibility) as ColumnKey[]).map((column) => (
                  <label key={column} className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <span>{column}</span>
                    <input
                      type="checkbox"
                      checked={columnVisibility[column]}
                      onChange={(e) =>
                        setColumnVisibility((prev) => ({
                          ...prev,
                          [column]: e.target.checked,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider outline-none">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as any)} className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider outline-none">
            <option value="">All Stock</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out Of Stock</option>
          </select>
          <select value={collectionFilter} onChange={(e) => setCollectionFilter(e.target.value)} className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider outline-none">
            <option value="">All Collections</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>{collection.name}</option>
            ))}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider outline-none">
            <option value="createdAt">Sort By Created</option>
            <option value="updatedAt">Sort By Updated</option>
            <option value="name">Sort By Name</option>
            <option value="basePrice">Sort By Price</option>
          </select>
          <select value={sortDir} onChange={(e) => setSortDir(e.target.value as any)} className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider outline-none">
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto no-scrollbar">
        <table className="w-full text-left min-w-250">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-50">
              {columnVisibility.product ? <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Product Detail</th> : null}
              {columnVisibility.sku ? <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">ID / SKU</th> : null}
              {columnVisibility.type ? <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Type</th> : null}
              {columnVisibility.price ? <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Price</th> : null}
              {columnVisibility.stock ? <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Stock</th> : null}
              {columnVisibility.status ? <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Status</th> : null}
              {columnVisibility.actions ? <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Actions</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse">
                  {columnVisibility.product && (
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-slate-100 rounded" />
                          <div className="h-3 w-20 bg-slate-50 rounded" />
                        </div>
                      </div>
                    </td>
                  )}
                  {columnVisibility.sku && (
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        <div className="h-3 w-16 bg-slate-100 rounded" />
                        <div className="h-2 w-12 bg-slate-50 rounded" />
                      </div>
                    </td>
                  )}
                  {columnVisibility.type && (
                    <td className="px-8 py-6">
                      <div className="h-6 w-24 bg-slate-50 rounded-full" />
                    </td>
                  )}
                  {columnVisibility.price && (
                    <td className="px-8 py-6">
                      <div className="h-4 w-12 bg-slate-100 rounded" />
                    </td>
                  )}
                  {columnVisibility.stock && (
                    <td className="px-8 py-6">
                      <div className="h-4 w-16 bg-slate-100 rounded" />
                    </td>
                  )}
                  {columnVisibility.status && (
                    <td className="px-8 py-6">
                      <div className="h-4 w-20 bg-slate-100 rounded" />
                    </td>
                  )}
                  {columnVisibility.actions && (
                    <td className="px-8 py-6">
                      <div className="h-8 w-24 bg-slate-50 rounded-lg" />
                    </td>
                  )}
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-8 py-10 text-center text-sm font-semibold text-slate-500 italic">No products found in this vector.</td>
              </tr>
            ) : products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                {columnVisibility.product ? <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                      <img src={product.mainImageUrl} className="w-full h-full object-cover" alt={product.name} />
                    </div>
                    <div>
                      <h4 className="font-black italic uppercase tracking-tighter text-slate-900 line-clamp-1">{product.name}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{product.collections?.[0]?.name ?? '-'}</p>
                    </div>
                  </div>
                </td> : null}
                {columnVisibility.sku ? <td className="px-8 py-6">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-slate-900 tracking-tighter italic">{product.id.slice(-6).toUpperCase()}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{getFirstVariantSku(product)}</p>
                  </div>
                </td> : null}
                {columnVisibility.type ? <td className="px-8 py-6">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase italic tracking-widest ${
                    product.orderType === 'direct' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {product.orderType === 'direct' ? 'Direct' : 'Request'} Order
                  </span>
                </td> : null}
                {columnVisibility.price ? <td className="px-8 py-6 font-black italic tracking-tighter text-slate-900">${product.basePrice.toFixed(2)}</td> : null}
                {columnVisibility.stock ? <td className="px-8 py-6 text-sm font-bold text-slate-600 italic">{getStockCount(product)} units</td> : null}
                {columnVisibility.status ? <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    {product.status === 'active' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : product.status === 'archived' ? (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Package className="w-4 h-4 text-slate-300" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest italic">{getStatusLabel(product)}</span>
                  </div>
                </td> : null}
                {columnVisibility.actions ? <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProductForReviews({ id: product.id, name: product.name })}
                      className="p-2 hover:bg-orange-50 hover:text-[#FF7348] rounded-lg transition-all text-slate-400"
                      title="Moderate Reviews"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                      className="p-2 hover:bg-black hover:text-white rounded-lg transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={isDeleteSubmitting}
                      onClick={() => void handleDeleteProduct(product.id)}
                      className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Showing {resultCount} of {total} results</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-1">
            {pageNumbers.map((n, i) => (
              <button
                key={`${n}-${i}`}
                type="button"
                disabled={n === '...'}
                onClick={() => typeof n === 'number' && setPage(n)}
                className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                  n === page
                    ? 'bg-black text-white shadow-lg'
                    : 'hover:bg-slate-50 text-slate-400 hover:text-black'
                } ${n === '...' ? 'cursor-default' : ''}`}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {selectedProductForReviews && (
        <ReviewModerationModal
          productId={selectedProductForReviews.id}
          productName={selectedProductForReviews.name}
          onClose={() => setSelectedProductForReviews(null)}
        />
      )}
    </div>
  );
};
