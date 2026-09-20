"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Package,
  Search,
  PlusCircle,
  ExternalLink,
  Warehouse,
  Boxes,
  Eye,
  CheckCircle2,
  AlertCircle,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  getVendorProductsApi,
  type VendorProductItem,
} from '@/lib/api/vendorDashboard';

export default function VendorProductsPage() {
  const [products, setProducts] = useState<VendorProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await getVendorProductsApi({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        pageSize: 15,
      });
      if (res?.ok) {
        setProducts(res.items);
        setTotalPages(res.pagination.totalPages);
        setTotalCount(res.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, page]);

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF7348] italic">
            Catalog Management
          </span>
          <h1 className="text-3xl font-black italic uppercase tracking-tight text-white mt-1">
            All Products ({totalCount})
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Branded products deployed to your store with placed logos and variation mockups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/vendor/products/inventory"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Warehouse className="w-4 h-4 text-blue-400" /> Stock Levels
          </Link>
          <Link
            href="/vendor/products/add"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF7348] hover:bg-[#ff8660] text-black font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" /> Add Product
          </Link>
        </div>
      </div>

      {/* ── Filters Bar ──────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#151921] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by title or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF7348]/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status:</span>
          {['all', 'active', 'draft'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                statusFilter === s
                  ? 'bg-[#FF7348] text-black font-black'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Products List / Table ─────────────────────────────────────────── */}
      <div className="bg-[#151921] border border-white/10 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#FF7348]" />
            <p className="text-xs font-bold uppercase tracking-widest">Loading Catalog Items...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-600">
              <Package className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black italic uppercase tracking-wider text-white">
                No Products Found
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {search
                  ? 'No products matched your search query. Try adjusting your filters.'
                  : 'You do not have any active branded products in your store yet.'}
              </p>
            </div>
            <Link
              href="/vendor/products/add"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF7348] text-black text-xs font-black uppercase tracking-widest hover:bg-[#ff8660] transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> Request Products from Catalog
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                  <th className="p-4 pl-6">Product</th>
                  <th className="p-4">Base Price</th>
                  <th className="p-4">Variations</th>
                  <th className="p-4">Available Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-medium">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Product Identity */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 overflow-hidden shrink-0">
                          <img src={p.mainImageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black italic text-white text-xs truncate max-w-xs">{p.name}</p>
                          <span className="text-[10px] text-slate-500 font-mono">/{p.slug}</span>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="p-4 font-bold text-white">
                      ${p.basePrice.toFixed(2)}
                      {p.salePrice && (
                        <span className="ml-1.5 text-[10px] text-emerald-400 line-through opacity-70">
                          ${p.regularPrice?.toFixed(2)}
                        </span>
                      )}
                    </td>

                    {/* Variations count */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Boxes className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-300 font-bold">{p.variantsCount} variants</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {p.mockupsCount} view mockups
                      </span>
                    </td>

                    {/* Stock */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          p.totalStock > 10
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : p.totalStock > 0
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {p.totalStock > 0 ? `${p.totalStock} in stock` : 'Out of Stock'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          p.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/shop`}
                          target="_blank"
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-colors"
                          title="View Live Store Page"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href="/vendor/products/inventory"
                          className="p-2 rounded-xl bg-white/5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 border border-white/5 transition-colors"
                          title="Update Inventory"
                        >
                          <Warehouse className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-xs text-slate-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
