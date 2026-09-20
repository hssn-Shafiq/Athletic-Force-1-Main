"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  DollarSign,
  Package,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import {
  getVendorAnalyticsApi,
  type VendorAnalyticsResponse,
} from '@/lib/api/vendorDashboard';

export default function VendorAnalyticsPage() {
  const [data, setData] = useState<VendorAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await getVendorAnalyticsApi();
      if (res?.ok) setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const timeline = data?.salesTimeline || [];
  const topPerforming = data?.topPerforming || [];

  const maxRevenue = Math.max(...timeline.map((t) => t.revenue), 100);
  const totalPeriodRevenue = timeline.reduce((acc, t) => acc + t.revenue, 0);
  const totalPeriodOrders = timeline.reduce((acc, t) => acc + t.orders, 0);
  const aov = totalPeriodOrders > 0 ? totalPeriodRevenue / totalPeriodOrders : 0;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF7348] italic">
            Telemetry &amp; Trends
          </span>
          <h1 className="text-3xl font-black italic uppercase tracking-tight text-white mt-1">
            Store Analytics
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1">
            30-day revenue cadence, customer conversion metrics, and top-selling gear.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Analytics
        </button>
      </div>

      {/* ── Quick KPI Strip ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-[#151921] border border-white/10 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
            30-Day Net Volume
          </span>
          <h3 className="text-2xl font-black italic text-emerald-400">
            ${totalPeriodRevenue.toFixed(2)}
          </h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Across fulfilled orders</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#151921] border border-white/10 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
            30-Day Orders Count
          </span>
          <h3 className="text-2xl font-black italic text-white">
            {totalPeriodOrders} sub-orders
          </h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Logged from web checkout</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#151921] border border-white/10 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
            Average Order Value (AOV)
          </span>
          <h3 className="text-2xl font-black italic text-[#FF7348]">
            ${aov.toFixed(2)}
          </h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Average basket size</p>
        </div>
      </div>

      {/* ── 30-Day Sales Visual Chart Bar ─────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-[#151921] border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black italic uppercase tracking-wider text-white">
              Revenue Cadence (Past 30 Days)
            </h2>
            <p className="text-[11px] font-medium text-slate-400">
              Daily net earnings progression
            </p>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Past 30 Days
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#FF7348]" />
            <p className="text-xs font-bold uppercase tracking-widest">Compiling Telemetry...</p>
          </div>
        ) : timeline.length === 0 ? (
          <div className="p-16 text-center bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
            <BarChart3 className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-400 italic">
              No daily sales data recorded in the last 30 days.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-48 flex items-end gap-2 pt-4 px-2 overflow-x-auto">
              {timeline.map((day) => {
                const heightPct = Math.max(8, (day.revenue / maxRevenue) * 100);
                return (
                  <div
                    key={day.date}
                    className="flex-1 min-w-[28px] flex flex-col items-center gap-1.5 group relative"
                  >
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                      <div className="bg-black/90 border border-white/15 px-2.5 py-1.5 rounded-xl text-[10px] font-mono text-white whitespace-nowrap shadow-xl">
                        <p className="font-bold text-emerald-400">${day.revenue.toFixed(2)}</p>
                        <p className="text-slate-400">{day.orders} orders &bull; {day.date}</p>
                      </div>
                    </div>

                    <div
                      className="w-full bg-[#FF7348]/20 group-hover:bg-[#FF7348] border border-[#FF7348]/30 rounded-t-lg transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[8px] font-mono text-slate-500 truncate w-full text-center">
                      {day.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Top Performing Products Table ─────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-[#151921] border border-white/10 space-y-4">
        <h2 className="text-base font-black italic uppercase tracking-wider text-white">
          Velocity Leaders
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {topPerforming.map((p, idx) => (
            <div
              key={p.id}
              className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3"
            >
              <span className="text-lg font-black italic text-slate-600 w-5">#{idx + 1}</span>
              <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 overflow-hidden shrink-0">
                <img src={p.mainImageUrl} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black italic uppercase text-white truncate">{p.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  ${p.basePrice.toFixed(2)} &bull; <strong className="text-white">{p.soldCount}</strong> units sold
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
