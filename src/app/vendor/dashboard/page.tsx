"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  DollarSign,
  ShoppingBag,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  PlusCircle,
  Warehouse,
  ExternalLink,
  Sparkles,
  Layers,
  ArrowUpRight,
  Store,
  RefreshCw,
} from 'lucide-react';
import {
  getVendorDashboardSummaryApi,
  type VendorDashboardSummaryResponse,
} from '@/lib/api/vendorDashboard';

export default function VendorDashboardPage() {
  const [data, setData] = useState<VendorDashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await getVendorDashboardSummaryApi();
      if (res?.ok) {
        setData(res);
        setError(null);
      } else {
        setError('Unable to load dashboard metrics');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch vendor metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-3xl border border-white/5" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white/5 rounded-3xl border border-white/5" />
          <div className="h-96 bg-white/5 rounded-3xl border border-white/5" />
        </div>
      </div>
    );
  }

  const store = data?.store;
  const metrics = data?.metrics;
  const recentOrders = data?.recentOrders || [];
  const topProducts = data?.topProducts || [];

  return (
    <div className="space-y-8">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF7348] italic">
              Terminal Overview
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tight text-white mt-1">
            {store?.storeName || 'Vendor'} Dashboard
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Track performance, fulfill orders, and monitor your branded AF1 catalog.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/vendor/products/add"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF7348] hover:bg-[#ff8660] text-black font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" /> Request Product
          </Link>
        </div>
      </div>

      {/* ── Metric Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Earnings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-6 rounded-3xl bg-[#151921] border border-white/10 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
              Net Earnings
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black italic tracking-tight text-white">
              ${(metrics?.totalNetEarnings || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
              Platform fee deducted (15%)
            </p>
          </div>
        </motion.div>

        {/* Gross Sales */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="p-6 rounded-3xl bg-[#151921] border border-white/10 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
              Gross Volume
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FF7348]/10 border border-[#FF7348]/20 flex items-center justify-center text-[#FF7348]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black italic tracking-tight text-white">
              ${(metrics?.totalGrossRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
              Total Customer Cart Value
            </p>
          </div>
        </motion.div>

        {/* Total Orders */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="p-6 rounded-3xl bg-[#151921] border border-white/10 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
              Total Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black italic tracking-tight text-white">
                {metrics?.totalOrders || 0}
              </h3>
              {(metrics?.ordersByStatus.pending || 0) > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {metrics?.ordersByStatus.pending} pending
                </span>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
              Fulfillment sub-orders
            </p>
          </div>
        </motion.div>

        {/* Active Branded Products */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="p-6 rounded-3xl bg-[#151921] border border-white/10 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
              Live Products
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black italic tracking-tight text-white">
              {metrics?.activeProductsCount || 0}
            </h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
              Branded active in team store
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Quick Action Command Bar ─────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic px-2">
          Fast Actions:
        </span>
        <Link
          href="/vendor/products"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white border border-white/5 transition-colors"
        >
          <Package className="w-3.5 h-3.5 text-[#FF7348]" /> Manage Catalog
        </Link>
        <Link
          href="/vendor/products/inventory"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white border border-white/5 transition-colors"
        >
          <Warehouse className="w-3.5 h-3.5 text-blue-400" /> Stock Balances
        </Link>
        <Link
          href="/vendor/orders"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white border border-white/5 transition-colors"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" /> Fulfill Orders
        </Link>
        <Link
          href="/vendor/store/profile"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white border border-white/5 transition-colors"
        >
          <Store className="w-3.5 h-3.5 text-purple-400" /> Store Profile
        </Link>
      </div>

      {/* ── Content Grid: Recent Orders & Top Products ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Sub-Orders */}
        <div className="lg:col-span-2 bg-[#151921] border border-white/10 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black italic uppercase tracking-wider text-white">
                Recent Sub-Orders
              </h2>
              <p className="text-[11px] font-medium text-slate-400">
                Latest customer purchases requiring vendor fulfillment
              </p>
            </div>
            <Link
              href="/vendor/orders"
              className="text-[11px] font-bold text-[#FF7348] hover:text-[#ff8660] flex items-center gap-1 transition-colors uppercase tracking-wider"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/5">
                <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400 italic">No orders received yet</p>
                <p className="text-xs text-slate-600 mt-1">
                  Once customers buy products from your store, sub-orders will appear here.
                </p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black tracking-tight text-white uppercase italic">
                        {order.subOrderNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          order.status === 'delivered'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : order.status === 'shipped'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : order.status === 'processing'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : order.status === 'cancelled'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      {order.itemCount} items &bull; Ordered{' '}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-black italic text-emerald-400">
                      +${order.vendorNetEarnings.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-500">Gross: ${order.subtotal.toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Top Products */}
        <div className="bg-[#151921] border border-white/10 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black italic uppercase tracking-wider text-white">
                Top Products
              </h2>
              <p className="text-[11px] font-medium text-slate-400">
                Most popular items in your store
              </p>
            </div>
            <Link
              href="/vendor/products"
              className="text-[11px] font-bold text-[#FF7348] hover:text-[#ff8660] flex items-center gap-1 transition-colors uppercase tracking-wider"
            >
              Catalog <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/5">
                <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400 italic">No products available</p>
              </div>
            ) : (
              topProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 transition-colors flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 overflow-hidden shrink-0">
                    <img src={p.mainImageUrl} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-white italic truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      ${p.basePrice.toFixed(2)} &bull; {p.soldCount} sold
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
