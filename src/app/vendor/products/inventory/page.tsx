"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Warehouse,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Package,
  Boxes,
  Sliders,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  ArrowUpDown,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import {
  getVendorProductsApi,
  updateVendorProductInventoryApi,
  type VendorProductItem,
} from '@/lib/api/vendorDashboard';

export default function VendorInventoryPage() {
  const [products, setProducts] = useState<VendorProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'stock_asc' | 'stock_desc' | 'name' | 'price'>('stock_asc');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Popup Modal State for Adjusting Inventory
  const [selectedProduct, setSelectedProduct] = useState<VendorProductItem | null>(null);
  const [modalVariantStocks, setModalVariantStocks] = useState<Record<string, number>>({});
  const [modalGlobalStock, setModalGlobalStock] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await getVendorProductsApi({ pageSize: 150 });
      if (res?.ok) {
        setProducts(res.items);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Compute KPI summary metrics
  const stats = useMemo(() => {
    let totalItems = products.length;
    let totalUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let inStockCount = 0;

    products.forEach((p) => {
      totalUnits += p.totalStock || 0;
      if (p.totalStock <= 0) {
        outOfStockCount++;
      } else if (p.totalStock <= 10) {
        lowStockCount++;
      } else {
        inStockCount++;
      }
    });

    return {
      totalItems,
      totalUnits,
      inStockCount,
      lowStockCount,
      outOfStockCount,
    };
  }, [products]);

  // Open Adjust Stock Modal
  const openAdjustModal = (product: VendorProductItem) => {
    setSelectedProduct(product);
    if (product.variants && product.variants.length > 0) {
      const initialMap: Record<string, number> = {};
      product.variants.forEach((v) => {
        initialMap[v.sku || 'default'] = v.stock;
      });
      setModalVariantStocks(initialMap);
    } else {
      setModalGlobalStock(product.globalStock || 0);
    }
  };

  // Save modal adjustments
  const handleSaveModalStock = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    try {
      if (selectedProduct.variants && selectedProduct.variants.length > 0) {
        const variantStocks = selectedProduct.variants.map((v) => ({
          sku: v.sku || '',
          stock: modalVariantStocks[v.sku || 'default'] ?? v.stock,
        }));
        await updateVendorProductInventoryApi(selectedProduct.id, { variantStocks });
      } else {
        await updateVendorProductInventoryApi(selectedProduct.id, {
          globalStock: modalGlobalStock,
        });
      }

      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      console.error('Failed to update inventory:', err);
      alert('Failed to save stock update.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter and Sort Products
  const processedProducts = useMemo(() => {
    let list = products.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          (p.variants || []).some((v) => v.sku?.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (stockFilter === 'out') return p.totalStock <= 0;
      if (stockFilter === 'low') return p.totalStock > 0 && p.totalStock <= 10;
      if (stockFilter === 'in_stock') return p.totalStock > 10;
      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'stock_asc') return a.totalStock - b.totalStock;
      if (sortBy === 'stock_desc') return b.totalStock - a.totalStock;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return b.basePrice - a.basePrice;
      return 0;
    });

    return list;
  }, [products, search, stockFilter, sortBy]);

  // Pagination Slicing
  const totalFiltered = processedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedProducts.slice(start, start + pageSize);
  }, [processedProducts, page, pageSize]);

  // Reset page when filter or search changes
  useEffect(() => {
    setPage(1);
  }, [search, stockFilter, pageSize]);

  // Total units currently computed in modal
  const modalTotalUnits = selectedProduct?.variants && selectedProduct.variants.length > 0
    ? Object.values(modalVariantStocks).reduce((a, b) => a + b, 0)
    : modalGlobalStock;

  return (
    <div className="space-y-6 pb-16">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/vendor/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
          </Link>
          <h1 className="text-3xl font-black italic uppercase tracking-tight text-white">
            Inventory &amp; Stock Balances
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Real-time warehouse balance tracking, variant stock matrix, and threshold alerts.
          </p>
        </div>

        <button
          onClick={fetchProducts}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Stock
        </button>
      </div>

      {/* ── KPI Stats Cards (Clickable Quick Filters) ────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div
          onClick={() => setStockFilter('all')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            stockFilter === 'all'
              ? 'bg-white/10 border-white/30 shadow-lg'
              : 'bg-[#151921] border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Total Catalog Items
            </span>
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black italic tracking-tight text-white mb-0.5">
            {stats.totalItems}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Active store products
          </p>
        </div>

        {/* Total Units */}
        <div className="p-5 rounded-3xl bg-[#151921] border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Total Available Units
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black italic tracking-tight text-indigo-400 mb-0.5">
            {stats.totalUnits.toLocaleString()}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total units across variants
          </p>
        </div>

        {/* Low Stock (<= 10) */}
        <div
          onClick={() => setStockFilter('low')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            stockFilter === 'low'
              ? 'bg-amber-500/15 border-amber-500/40 shadow-lg'
              : 'bg-[#151921] border-white/10 hover:border-amber-500/20'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
              Low Stock Alert (≤10)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black italic tracking-tight text-amber-400 mb-0.5">
            {stats.lowStockCount}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Reorder recommended
          </p>
        </div>

        {/* Out of Stock (0) */}
        <div
          onClick={() => setStockFilter('out')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            stockFilter === 'out'
              ? 'bg-red-500/15 border-red-500/40 shadow-lg'
              : 'bg-[#151921] border-white/10 hover:border-red-500/20'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
              Out of Stock (0 Units)
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black italic tracking-tight text-red-400 mb-0.5">
            {stats.outOfStockCount}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Hidden / sold out items
          </p>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ─────────────────────────────────────── */}
      <div className="p-4 rounded-3xl bg-[#151921] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF7348] transition-colors"
          />
        </div>

        {/* Health Pills + Sort */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: `All (${stats.totalItems})` },
              { id: 'in_stock', label: `In Stock (${stats.inStockCount})` },
              { id: 'low', label: `Low (≤10) (${stats.lowStockCount})` },
              { id: 'out', label: `Out (0) (${stats.outOfStockCount})` },
            ].map((f) => {
              const active = stockFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setStockFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    active
                      ? 'bg-[#FF7348] text-black shadow-md shadow-orange-500/20'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#0B0E14] border border-white/10 text-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none focus:border-[#FF7348] cursor-pointer"
            >
              <option value="stock_asc">Stock: Low to High</option>
              <option value="stock_desc">Stock: High to Low</option>
              <option value="name">Product Name</option>
              <option value="price">Base Price</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Inventory Table ──────────────────────────────────────────────── */}
      <div className="bg-[#151921] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="p-5 text-[11px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  Product Details
                </th>
                <th className="p-5 text-[11px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  Variants &amp; Tracking
                </th>
                <th className="p-5 text-[11px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  Stock Health
                </th>
                <th className="p-5 text-[11px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  Available Units
                </th>
                <th className="p-5 text-[11px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  Total Sold
                </th>
                <th className="p-5 text-[11px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FF7348] mb-2" />
                    <span className="text-xs font-bold uppercase tracking-widest">Loading inventory matrix...</span>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-slate-500 mb-3">
                      <Warehouse className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-300 italic">No inventory records found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {search ? 'Try adjusting your search criteria.' : 'Products generated for your store will appear here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const hasVariants = p.variants && p.variants.length > 0;
                  const isLow = p.totalStock > 0 && p.totalStock <= 10;
                  const isOut = p.totalStock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Product Details */}
                      <td className="p-5 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 p-1">
                            {p.mainImageUrl ? (
                              <img src={p.mainImageUrl} alt={p.name} className="w-full h-full object-contain" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block truncate max-w-[200px]" title={p.name}>
                              {p.name}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 mt-0.5 block">
                              Base: ${p.basePrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Variants & Tracking Mode */}
                      <td className="p-5 whitespace-nowrap min-w-[160px]">
                        {hasVariants ? (
                          <div>
                            <span className="text-xs font-bold text-white">
                              {p.variants.length} SKU Variant(s)
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Matrix Tracked
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-xs font-bold text-slate-300">
                              Global Stock
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              Single Pool
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Stock Health */}
                      <td className="p-5 whitespace-nowrap min-w-[140px]">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/25">
                            <XCircle className="w-3 h-3" /> Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/25">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                            <CheckCircle2 className="w-3 h-3" /> In Stock
                          </span>
                        )}
                      </td>

                      {/* Available Units */}
                      <td className="p-5 whitespace-nowrap min-w-[120px]">
                        <div className="text-base font-black text-white font-mono tracking-tight">
                          {p.totalStock}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {p.totalStock === 1 ? '1 unit left' : `${p.totalStock} units available`}
                        </span>
                      </td>

                      {/* Units Sold */}
                      <td className="p-5 whitespace-nowrap min-w-[100px]">
                        <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                          <span>{p.soldCount || 0} sold</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => openAdjustModal(p)}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-[#FF7348] hover:text-black text-white text-xs font-black uppercase tracking-wider transition-all shadow-sm border border-white/10 hover:border-[#FF7348] inline-flex items-center gap-1.5 active:scale-95"
                        >
                          <Sliders className="w-3.5 h-3.5" /> Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Toolbar ───────────────────────────────────────────── */}
        <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <span className="font-medium text-slate-400">
              Showing <strong className="text-white font-black">{totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1}</strong> to{' '}
              <strong className="text-white font-black">{Math.min(page * pageSize, totalFiltered)}</strong> of{' '}
              <strong className="text-white font-black">{totalFiltered}</strong> products
            </span>

            <div className="flex items-center gap-2 pl-4 border-l border-white/10">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Per Page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-[#0B0E14] border border-white/10 text-white rounded-xl px-2.5 py-1 text-xs font-bold outline-none focus:border-[#FF7348] cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-25 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-1 text-slate-600">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                        page === p
                          ? 'bg-[#FF7348] text-black shadow-md shadow-orange-500/20'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-25 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Adjust Stock Popup Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-[#11141B] w-full max-w-2xl rounded-[32px] border border-white/15 p-6 sm:p-8 shadow-2xl z-10 my-auto space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-white/10">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-black/50 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 p-1">
                    {selectedProduct.mainImageUrl ? (
                      <img
                        src={selectedProduct.mainImageUrl}
                        alt={selectedProduct.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase italic tracking-tight text-white line-clamp-1">
                      {selectedProduct.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Base Price: ${selectedProduct.basePrice.toFixed(2)} &bull; Current Total:{' '}
                      <strong className="text-white font-mono">{selectedProduct.totalStock} units</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedProduct(null)}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body: Variants Matrix or Global Stock */}
              {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#FF7348]">
                      Variant SKU Allocation
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const updated: Record<string, number> = {};
                          selectedProduct.variants.forEach((v) => {
                            const current = modalVariantStocks[v.sku || 'default'] ?? v.stock;
                            updated[v.sku || 'default'] = current + 10;
                          });
                          setModalVariantStocks(updated);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300"
                      >
                        +10 to All
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated: Record<string, number> = {};
                          selectedProduct.variants.forEach((v) => {
                            updated[v.sku || 'default'] = 0;
                          });
                          setModalVariantStocks(updated);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold"
                      >
                        Clear All (0)
                      </button>
                    </div>
                  </div>

                  {/* Scrollable list of variant rows */}
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {selectedProduct.variants.map((v, idx) => {
                      const skuKey = v.sku || 'default';
                      const currentVal = modalVariantStocks[skuKey] ?? v.stock;

                      return (
                        <div
                          key={idx}
                          className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {v.color || 'Standard'} {v.size ? `/ Size ${v.size}` : ''}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-white/10 text-[9px] font-mono text-slate-300">
                                {v.sku}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                              Unit Price: ${(v.price || selectedProduct.basePrice).toFixed(2)}
                            </span>
                          </div>

                          {/* Stepper Input */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setModalVariantStocks((prev) => ({
                                  ...prev,
                                  [skuKey]: Math.max(0, (prev[skuKey] ?? v.stock) - 1),
                                }))
                              }
                              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={currentVal}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                setModalVariantStocks((prev) => ({ ...prev, [skuKey]: val }));
                              }}
                              className="w-16 h-8 bg-black/60 border border-white/10 text-white text-center rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#FF7348]"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setModalVariantStocks((prev) => ({
                                  ...prev,
                                  [skuKey]: (prev[skuKey] ?? v.stock) + 1,
                                }))
                              }
                              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Global Stock Stepper */
                <div className="space-y-4 py-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#FF7348] block">
                    Global Inventory Units
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setModalGlobalStock((s) => Math.max(0, s - 1))}
                      className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={modalGlobalStock}
                      onChange={(e) => setModalGlobalStock(Math.max(0, parseInt(e.target.value) || 0))}
                      className="flex-1 h-11 bg-black/60 border border-white/10 text-white text-center rounded-2xl text-base font-mono font-black focus:outline-none focus:border-[#FF7348]"
                    />
                    <button
                      type="button"
                      onClick={() => setModalGlobalStock((s) => s + 1)}
                      className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    {[5, 10, 25, 50, 100].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => setModalGlobalStock((s) => s + inc)}
                        className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors"
                      >
                        +{inc}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setModalGlobalStock(0)}
                      className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors"
                    >
                      Reset (0)
                    </button>
                  </div>
                </div>
              )}

              {/* Total Summary Box */}
              <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    Calculated Total Units
                  </span>
                  <span className="text-xs text-slate-500">
                    Will reflect across product cards &amp; customer checkout
                  </span>
                </div>
                <span className="text-xl font-black text-white font-mono">
                  {modalTotalUnits} units
                </span>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveModalStock}
                  className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-[#FF7348] hover:bg-[#ff8660] text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Save Inventory
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
