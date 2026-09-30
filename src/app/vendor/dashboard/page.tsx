"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  PlusCircle,
  Package,
  Store,
  Layers,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Receipt,
  HelpCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  getVendorDashboardSummaryApi,
  type VendorDashboardSummaryResponse,
  type VendorTimelinePoint,
  type VendorDailyBreakdown,
} from '@/lib/api/vendorDashboard';

type PeriodPreset = 'today' | 'yesterday' | '7d' | 'this_month' | 'custom';

export default function VendorDashboardPage() {
  const [data, setData] = useState<VendorDashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [period, setPeriod] = useState<PeriodPreset>('this_month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [chartMetric, setChartMetric] = useState<'both' | 'net' | 'gross'>('both');

  const fetchDashboard = async (p = period, s = startDate, e = endDate) => {
    setLoading(true);
    try {
      const params: { period?: string; startDate?: string; endDate?: string } = { period: p };
      if (p === 'custom' && s && e) {
        params.startDate = s;
        params.endDate = e;
      }
      const res = await getVendorDashboardSummaryApi(params);
      if (res?.ok) {
        setData(res);
        setError(null);
        // Sync dates if returned from server
        if (res.filter) {
          if (!startDate && res.filter.startDate) setStartDate(res.filter.startDate);
          if (!endDate && res.filter.endDate) setEndDate(res.filter.endDate);
        }
      } else {
        setError('Unable to load sales analytics');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch vendor sales metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(period);
  }, [period]);

  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    setPeriod('custom');
    fetchDashboard('custom', startDate, endDate);
  };

  const store = data?.store;
  const metrics = data?.metrics;
  const timeline: VendorTimelinePoint[] = data?.timeline || [];
  const breakdown: VendorDailyBreakdown[] = data?.breakdown || [];

  // Format currency helper
  const fmt = (num?: number) =>
    (num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-8">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF7348] italic">
              Financial & Sales Analytics
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tight text-white mt-1">
            {store?.storeName || 'Vendor'} Hub
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Real-time sales tracking, commission splits, and net payout analytics for your branded merchandise.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchDashboard()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors disabled:opacity-50"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#FF7348]' : ''}`} />
          </button>

          <Link
            href="/vendor/products/add"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF7348] hover:bg-[#ff8660] text-black font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" /> Request Product
          </Link>
        </div>
      </div>

      {/* ── Interactive Date Filter Bar ──────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#151921] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic mr-1">
            Timeframe:
          </span>
          {(
            [
              { key: 'today', label: 'Today' },
              { key: 'yesterday', label: 'Yesterday' },
              { key: '7d', label: 'Last 7 Days' },
              { key: 'this_month', label: 'This Month' },
              { key: 'custom', label: 'Custom Range' },
            ] as const
          ).map((p) => {
            const active = period === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                  active
                    ? 'bg-[#FF7348] text-black border-[#FF7348] shadow-md shadow-orange-500/20'
                    : 'bg-white/5 text-slate-300 hover:text-white border-white/5 hover:border-white/10'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Date Pickers (Custom range or quick override) */}
        <form onSubmit={handleApplyCustomDates} className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-500">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPeriod('custom');
              }}
              className="bg-transparent text-white text-xs outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-500">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPeriod('custom');
              }}
              className="bg-transparent text-white text-xs outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider transition-all border border-white/10"
          >
            <Calendar className="w-3.5 h-3.5 text-[#FF7348]" /> Apply
          </button>
        </form>
      </div>

      {/* ── Active Date Banner ────────────────────────────────────────────── */}
      {data?.filter && (
        <div className="text-[11px] font-medium text-slate-400 flex items-center gap-2 px-1">
          <span className="w-2 h-2 rounded-full bg-[#FF7348]" />
          <span>
            Active Range: <strong className="text-white">{data.filter.startDate}</strong> through{' '}
            <strong className="text-white">{data.filter.endDate}</strong>
          </span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-slate-400">
            Total Transactions: <strong className="text-white">{metrics?.salesCount || 0}</strong>
          </span>
        </div>
      )}

      {/* ── 6-Card Stats Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Net Realized Earnings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-6 rounded-3xl bg-gradient-to-br from-[#151921] to-[#111c18] border border-emerald-500/20 relative overflow-hidden group shadow-lg shadow-emerald-950/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 italic">
              Vendor Net Takehome
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black italic tracking-tight text-white">
              ${fmt(metrics?.totalNetEarnings)}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                85% Share
              </span>
              <p className="text-[10px] font-medium text-slate-400">
                Direct vendor net allocation
              </p>
            </div>
          </div>
        </motion.div>

        {/* 2. Gross Merchandise Volume */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.04 }}
          className="p-6 rounded-3xl bg-[#151921] border border-white/10 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
              Gross Merchandise Volume
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FF7348]/10 border border-[#FF7348]/20 flex items-center justify-center text-[#FF7348]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black italic tracking-tight text-white">
              ${fmt(metrics?.totalGrossRevenue)}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#FF7348]/10 text-[#FF7348] border border-[#FF7348]/20">
                {metrics?.salesCount || 0} Sales
              </span>
              <p className="text-[10px] font-medium text-slate-400">
                Total customer cart checkout value
              </p>
            </div>
          </div>
        </motion.div>

        {/* 3. Platform Fee (15%) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.08 }}
          className="p-6 rounded-3xl bg-[#151921] border border-white/10 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
              Platform Service Fee
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black italic tracking-tight text-white">
              ${fmt(metrics?.totalPlatformFee)}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                15% Split
              </span>
              <p className="text-[10px] font-medium text-slate-400">
                Platform hosting & card processing
              </p>
            </div>
          </div>
        </motion.div>

        {/* 4. Average Sale Value */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.12 }}
          className="p-6 rounded-3xl bg-[#151921] border border-white/10 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
              Avg Transaction Value
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black italic tracking-tight text-white">
              ${fmt(metrics?.avgSaleValue)}
            </h3>
            <p className="text-[10px] font-medium text-slate-400 mt-2">
              Average gross value per customer order
            </p>
          </div>
        </motion.div>

        {/* 5. Pending Disbursement */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.16 }}
          className="p-6 rounded-3xl bg-[#151921] border border-white/10 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
              Pending Disbursement
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF7348]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black italic tracking-tight text-white">
              ${fmt(metrics?.pendingPayout)}
            </h3>
            <p className="text-[10px] font-medium text-slate-400 mt-2">
              Scheduled for next admin payout batch
            </p>
          </div>
        </motion.div>

        {/* 6. Disbursed / Paid Payout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
          className="p-6 rounded-3xl bg-[#151921] border border-white/10 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
              Paid Out To Date
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black italic tracking-tight text-white">
              ${fmt(metrics?.paidPayout)}
            </h3>
            <p className="text-[10px] font-medium text-slate-400 mt-2">
              Successfully disbursed bank settlement
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Graphical Sales & Earnings Analytics Chart ────────────────────── */}
      <div className="bg-[#151921] border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black italic uppercase tracking-wider text-white">
                Sales & Earnings Trajectory
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-white/5 border border-white/10 text-slate-400">
                Timeline
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Daily revenue volume vs net vendor compensation across selected window
            </p>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setChartMetric('both')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                chartMetric === 'both' ? 'bg-[#FF7348] text-black shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Both
            </button>
            <button
              onClick={() => setChartMetric('net')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                chartMetric === 'net' ? 'bg-emerald-400 text-black shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Net
            </button>
            <button
              onClick={() => setChartMetric('gross')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                chartMetric === 'gross' ? 'bg-[#FF7348] text-black shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Gross
            </button>
          </div>
        </div>

        {/* Recharts Area Container */}
        <div className="h-80 w-full pt-4">
          {timeline.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-white/[0.01] border border-white/5">
              <TrendingUp className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No sales recorded in this period</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Try selecting a broader timeframe like &quot;This Month&quot; or a custom range above.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF7348" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FF7348" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#232936" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#232936' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#232936' }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload as VendorTimelinePoint;
                      return (
                        <div className="p-3 rounded-2xl bg-[#0F1115] border border-white/20 shadow-2xl text-xs space-y-1.5 min-w-[180px]">
                          <p className="font-black text-white uppercase italic tracking-wider border-b border-white/10 pb-1">
                            {dataPoint.date}
                          </p>
                          <div className="flex justify-between items-center text-slate-400">
                            <span>Transactions:</span>
                            <strong className="text-white">{dataPoint.salesCount}</strong>
                          </div>
                          <div className="flex justify-between items-center text-[#FF7348]">
                            <span>Gross Volume:</span>
                            <strong>${fmt(dataPoint.grossRevenue)}</strong>
                          </div>
                          <div className="flex justify-between items-center text-amber-400">
                            <span>Platform Fee (15%):</span>
                            <strong>${fmt(dataPoint.platformFee)}</strong>
                          </div>
                          <div className="flex justify-between items-center text-emerald-400 font-bold border-t border-white/10 pt-1">
                            <span>Net Earnings (85%):</span>
                            <strong>${fmt(dataPoint.netEarnings)}</strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }}
                />
                {(chartMetric === 'both' || chartMetric === 'gross') && (
                  <Area
                    type="monotone"
                    name="Gross Volume"
                    dataKey="grossRevenue"
                    stroke="#FF7348"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#grossGrad)"
                  />
                )}
                {(chartMetric === 'both' || chartMetric === 'net') && (
                  <Area
                    type="monotone"
                    name="Net Takehome"
                    dataKey="netEarnings"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#netGrad)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Daily Financial Audit Breakdown Table ─────────────────────────── */}
      <div className="bg-[#151921] border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black italic uppercase tracking-wider text-white">
                Daily Financial Breakdown
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                Audited
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Daily settlement summary between the selected timeframe dates
            </p>
          </div>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
            {breakdown.length} Active Days
          </span>
        </div>

        {breakdown.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white/[0.01] border border-white/5">
            <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-400 italic">No daily breakdown entries for this range</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.03] text-slate-400 uppercase tracking-widest text-[9px] font-black border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Transactions</th>
                  <th className="py-3 px-4">Gross Cart Volume</th>
                  <th className="py-3 px-4">Platform Fee (15%)</th>
                  <th className="py-3 px-4 text-emerald-400">Vendor Net (85%)</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {breakdown.map((row) => (
                  <tr key={row.date} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                      {row.formattedDate || row.date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 font-mono text-[11px]">
                        {row.salesCount} {row.salesCount === 1 ? 'sale' : 'sales'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white font-mono">
                      ${fmt(row.grossRevenue)}
                    </td>
                    <td className="py-3.5 px-4 text-amber-400/90 font-mono">
                      ${fmt(row.platformFee)}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-400 font-mono text-sm">
                      ${fmt(row.netEarnings)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Settled (85%)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white/[0.04] font-black text-xs text-white border-t border-white/10">
                <tr>
                  <td className="py-3.5 px-4 uppercase italic">Total Selected</td>
                  <td className="py-3.5 px-4 font-mono">{metrics?.salesCount || 0} sales</td>
                  <td className="py-3.5 px-4 font-mono text-[#FF7348]">${fmt(metrics?.totalGrossRevenue)}</td>
                  <td className="py-3.5 px-4 font-mono text-amber-400">${fmt(metrics?.totalPlatformFee)}</td>
                  <td className="py-3.5 px-4 font-mono text-emerald-400 text-sm">
                    ${fmt(metrics?.totalNetEarnings)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-[10px] text-slate-400 uppercase">
                    Audited
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Brand & Store Hub Summary ─────────────────────────────────────── */}
      <div className="bg-[#151921] border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black italic uppercase tracking-wider text-white">
              Brand & Store Portfolio Status
            </h2>
            <p className="text-[11px] font-medium text-slate-400">
              Your official vendor clearance and athletic merchandise deployment
            </p>
          </div>
          <Link
            href="/vendor/store/profile"
            className="text-[11px] font-bold text-[#FF7348] hover:text-[#ff8660] flex items-center gap-1 transition-colors uppercase tracking-wider"
          >
            Edit Profile <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Store Name
            </span>
            <p className="text-sm font-black italic text-white truncate">
              {store?.storeName || 'Official Store'}
            </p>
            <p className="text-[10px] text-slate-400">
              Operated by {store?.vendorName || 'Vendor Partner'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Product Title Prefix
            </span>
            <p className="text-sm font-black italic text-[#FF7348] truncate">
              [{store?.productNamePrefix || store?.storeName || 'AF1'}]
            </p>
            <p className="text-[10px] text-slate-400">
              Prepended to all merchandise
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Store Clearance
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                {store?.status || 'Active'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Authorized vendor partner
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Assigned Collections
            </span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {(store?.collectionSlugs || []).length > 0 ? (
                store?.collectionSlugs.map((slug) => (
                  <span
                    key={slug}
                    className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-white/5 border border-white/10 text-slate-300"
                  >
                    {slug}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">Universal Storefront</span>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-transparent border border-[#FF7348]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-white">
              Expand Your Merchandise Line
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select master products from the AF1 catalog to request new branded mockups with your team logo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/vendor/products"
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-wider text-[11px] border border-white/10 transition-colors"
            >
              View Products
            </Link>
            <Link
              href="/vendor/products/add"
              className="px-4 py-2 rounded-xl bg-[#FF7348] hover:bg-[#ff8660] text-black font-black uppercase tracking-wider text-[11px] shrink-0 transition-all shadow-md shadow-orange-500/15"
            >
              Add Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
