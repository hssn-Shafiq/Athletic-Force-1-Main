'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Percent, ArrowLeft, TrendingUp, DollarSign, ShoppingBag,
  Calendar, Store, RefreshCw, Sliders, X,
  BarChart3, Loader2, ChevronDown, Check, Search,
  ArrowUpRight, PieChart, Layers
} from 'lucide-react';
import {
  adminGetCommissionAnalyticsApi,
  adminUpdateStoreCommissionApi,
  CommissionAnalyticsResponse,
  CommissionTimelinePoint,
  CommissionStoreBreakdown
} from '@/lib/api/vendorStores';

const TIMEFRAMES = [
  { id: 'today', label: 'Today', category: 'Quick' },
  { id: 'yesterday', label: 'Yesterday', category: 'Quick' },
  { id: '7d', label: 'Last 7 Days', category: 'Quick' },
  { id: 'this_week', label: 'This Week', category: 'Quick' },
  { id: 'this_month', label: 'This Month', category: 'Standard' },
  { id: '30d', label: 'Last 30 Days', category: 'Standard' },
  { id: 'year', label: 'This Year', category: 'Standard' },
  { id: 'all', label: 'All Time', category: 'Standard' },
  { id: 'custom', label: 'Custom Date Range', category: 'Custom' },
];

export default function AdminCommissionsProfitPage() {
  const [data, setData] = useState<CommissionAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<string>('30d');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Dropdown UX State
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Graphical View State
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [showGrossSales, setShowGrossSales] = useState(true);

  // Table Search
  const [storeSearch, setStoreSearch] = useState('');

  // Quick edit modal
  const [editStore, setEditStore] = useState<{
    id: string;
    storeName: string;
    commissionRate: number;
    isCommissionActive: boolean;
    commissionNotes?: string;
  } | null>(null);
  const [savingCommission, setSavingCommission] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGetCommissionAnalyticsApi({
        range: timeframe,
        startDate: timeframe === 'custom' ? startDate : undefined,
        endDate: timeframe === 'custom' ? endDate : undefined,
      });
      if (res?.ok) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load commission analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [timeframe, startDate, endDate]);

  useEffect(() => {
    if (timeframe !== 'custom') {
      fetchAnalytics();
    } else if (startDate && endDate) {
      fetchAnalytics();
    }
  }, [timeframe, startDate, endDate, fetchAnalytics]);

  const handleSaveStoreCommission = async () => {
    if (!editStore) return;
    setSavingCommission(true);
    try {
      const res = await adminUpdateStoreCommissionApi(editStore.id, {
        commissionRate: editStore.commissionRate,
        isCommissionActive: editStore.isCommissionActive,
        commissionNotes: editStore.commissionNotes,
      });
      if (res?.ok) {
        setEditStore(null);
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Failed to update commission:', err);
      alert('Failed to save store commission');
    } finally {
      setSavingCommission(false);
    }
  };

  const totals = data?.totals || {
    totalPlatformProfit: 0,
    totalGrossSales: 0,
    totalVendorPayouts: 0,
    totalOrders: 0,
    totalItems: 0,
  };

  const timeline: CommissionTimelinePoint[] = data?.timeline || [];
  const stores: CommissionStoreBreakdown[] = data?.stores || [];

  const effectiveRate = totals.totalGrossSales > 0 
    ? ((totals.totalPlatformProfit / totals.totalGrossSales) * 100).toFixed(1)
    : '0.0';

  const currentTfLabel = TIMEFRAMES.find((tf) => tf.id === timeframe)?.label || 'Last 30 Days';

  // Filter stores in breakdown
  const filteredStores = stores.filter(
    (s) =>
      s.storeName.toLowerCase().includes(storeSearch.toLowerCase()) ||
      s.vendorName.toLowerCase().includes(storeSearch.toLowerCase())
  );

  // Top contributors sorted by profit
  const topContributors = [...stores]
    .sort((a, b) => b.platformProfit - a.platformProfit)
    .slice(0, 4);

  // Custom Tooltip for Recharts
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pData = payload[0].payload;
      return (
        <div className="bg-slate-950/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/10 text-xs space-y-2 min-w-[200px]">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 pb-1.5 border-b border-white/10 flex justify-between items-center">
            <span>{label}</span>
            <span className="text-slate-300 font-bold">{pData.orders || 0} Orders</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-indigo-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
              Platform Profit
            </span>
            <span className="font-black text-indigo-300">
              ${(pData.platformProfit || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
              Gross Volume
            </span>
            <span className="font-bold text-slate-200">
              ${(pData.grossSales || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
            <span className="text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Vendor Payout
            </span>
            <span className="font-bold text-emerald-300">
              ${(pData.vendorPayout || 0).toFixed(2)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Integrated Filter Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <Link
              href="/admin/vendor-stores"
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Vendor Stores
            </Link>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
            Platform <span className="text-indigo-600">Commission &amp; Profits</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic mt-1">
            Real-time merchant revenue share &amp; platform take analytics
          </p>
        </div>

        {/* Right Controls: Filter Selector Popover + Refresh */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          {/* Timeframe Dropdown (No tabs) */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="flex items-center gap-2.5 px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm"
            >
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>{currentTfLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {filterDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 z-50 w-72 bg-white rounded-3xl p-4 shadow-2xl border border-slate-100 space-y-3"
                >
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 pb-1 border-b border-slate-100">
                    Select Time Horizon
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {TIMEFRAMES.filter((tf) => tf.id !== 'custom').map((tf) => {
                      const isSelected = timeframe === tf.id;
                      return (
                        <button
                          key={tf.id}
                          onClick={() => {
                            setTimeframe(tf.id);
                            setFilterDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{tf.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Range Option */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setTimeframe('custom')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        timeframe === 'custom'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>Custom Date Range</span>
                      {timeframe === 'custom' && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>

                    {timeframe === 'custom' && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Start Date</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">End Date</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-indigo-500"
                          />
                        </div>
                        <button
                          onClick={() => {
                            if (startDate && endDate) {
                              fetchAnalytics();
                              setFilterDropdownOpen(false);
                            }
                          }}
                          disabled={!startDate || !endDate}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors mt-1"
                        >
                          Apply Range
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => fetchAnalytics()}
            disabled={loading}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl transition-all shadow-sm"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Platform Profit */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-black text-white p-7 rounded-[32px] shadow-xl shadow-indigo-950/20 relative overflow-hidden group">
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">
              Platform Net Profit
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/20 flex items-center justify-center text-indigo-300">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black italic tracking-tight text-white mb-1">
            ${totals.totalPlatformProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-200/80 uppercase tracking-wider">
            <span>Avg Take Rate: <strong className="text-white">{effectiveRate}%</strong></span>
          </div>
        </div>

        {/* Gross Merchandise Sales */}
        <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Gross Volume (GMV)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black italic tracking-tight text-slate-900 mb-1">
            ${totals.totalGrossSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Vendor Item Sales
          </div>
        </div>

        {/* Vendor Net Payouts */}
        <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Vendor Net Payouts
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black italic tracking-tight text-emerald-600 mb-1">
            ${totals.totalVendorPayouts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Net Paid To Merchant Stores
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Vendor Orders
            </span>
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black italic tracking-tight text-slate-900 mb-1">
            {totals.totalOrders.toLocaleString('en-US')}
          </div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {totals.totalItems || 0} Total Units Sold
          </div>
        </div>
      </div>

      {/* Graphical Representation Suite: Main Chart + Side Contribution Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 flex items-center gap-2.5">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
                Profit &amp; Sales Velocity
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Timeline visualization of revenue splits &amp; platform returns
              </p>
            </div>

            {/* Graphical Controls */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1">
                <button
                  onClick={() => setChartType('area')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                    chartType === 'area'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Area Curve
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                    chartType === 'bar'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Bar Chart
                </button>
              </div>

              <button
                onClick={() => setShowGrossSales(!showGrossSales)}
                className={`px-3 py-1.5 rounded-2xl text-[11px] font-black uppercase tracking-wider border transition-all ${
                  showGrossSales
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-400 border-slate-200'
                }`}
              >
                GMV Overlay
              </button>
            </div>
          </div>

          {/* Chart Display */}
          <div className="h-[360px] w-full pt-4">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : timeline.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 font-bold italic text-sm">
                <BarChart3 className="w-12 h-12 text-slate-200 mb-2" />
                No sales data recorded in this timeframe
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                      tickFormatter={(val) => val.slice(5)}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    {showGrossSales && (
                      <Area
                        type="monotone"
                        dataKey="grossSales"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        fill="url(#salesGrad)"
                        fillOpacity={1}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="platformProfit"
                      stroke="#6366f1"
                      strokeWidth={3.5}
                      fill="url(#profitGrad)"
                      fillOpacity={1}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                      tickFormatter={(val) => val.slice(5)}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    {showGrossSales && (
                      <Bar
                        dataKey="grossSales"
                        fill="#cbd5e1"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={28}
                      />
                    )}
                    <Bar
                      dataKey="platformProfit"
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={28}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>

          {/* Chart Legend Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-bold text-slate-500">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-indigo-600 inline-block" />
                <span className="text-slate-900 font-black uppercase text-[10px] tracking-wider">
                  Platform Profit (Cut)
                </span>
              </div>
              {showGrossSales && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-slate-300 inline-block" />
                  <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    Gross GMV
                  </span>
                </div>
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Interactive Data Nodes
            </span>
          </div>
        </div>

        {/* Side Card: Volume Distribution & Top Stores */}
        <div className="bg-slate-900 text-white p-8 rounded-[40px] flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-6 relative z-10">
            <div>
              <h4 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-400" /> Share Distribution
              </h4>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Volume split between platform &amp; sellers
              </p>
            </div>

            {/* Split Progress Bar */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${Math.min(Math.max(Number(effectiveRate), 5), 95)}%` }}
                  className="bg-indigo-500 h-full transition-all duration-500"
                  title={`Platform: ${effectiveRate}%`}
                />
                <div
                  style={{ width: `${100 - Math.min(Math.max(Number(effectiveRate), 5), 95)}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                  title={`Vendors: ${100 - Number(effectiveRate)}%`}
                />
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                <span className="text-indigo-400">Platform ({effectiveRate}%)</span>
                <span className="text-emerald-400">Vendors ({(100 - Number(effectiveRate)).toFixed(1)}%)</span>
              </div>
            </div>

            {/* Top Store Contributors */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Top Profit Contributors
              </div>

              {topContributors.length === 0 ? (
                <div className="py-4 text-center text-slate-500 text-xs italic">
                  No store sales recorded yet
                </div>
              ) : (
                topContributors.map((tc, idx) => {
                  const sharePct = totals.totalPlatformProfit > 0
                    ? Math.round((tc.platformProfit / totals.totalPlatformProfit) * 100)
                    : 0;
                  return (
                    <div
                      key={tc.storeId}
                      className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between gap-3 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-white/10 text-indigo-300 text-[10px] font-black flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="truncate">
                          <p className="text-xs font-black uppercase italic tracking-tight truncate text-white">
                            {tc.storeName}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            {tc.commissionRate}% cut • {tc.orderCount} orders
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-indigo-300 block">
                          +${tc.platformProfit.toFixed(2)}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                          {sharePct}% share
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-6 relative z-10 border-t border-white/10 mt-6">
            <Link
              href="/admin/vendor-stores"
              className="flex items-center justify-center gap-2 py-3 bg-white text-slate-950 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-lg shadow-black/20"
            >
              <Store className="w-3.5 h-3.5" /> Manage All Partner Stores
            </Link>
          </div>
        </div>
      </div>

      {/* Store Commission Breakdown Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 flex items-center gap-2.5">
              <Percent className="w-6 h-6 text-indigo-600" /> Store-By-Store Profit Breakdown
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Individual store sales volume &amp; take rate performance
            </p>
          </div>

          {/* Search filter for stores */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by store or vendor..."
              value={storeSearch}
              onChange={(e) => setStoreSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-600 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Store</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Commission Rate</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Orders</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Gross Sales</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 italic">Platform Profit</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Vendor Payout</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-slate-400 font-bold italic">
                    {storeSearch ? 'No stores match your search.' : 'No vendor stores registered yet.'}
                  </td>
                </tr>
              ) : (
                filteredStores.map((store: CommissionStoreBreakdown) => (
                  <tr key={store.storeId} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {store.logoUrl ? (
                            <img src={store.logoUrl} alt={store.storeName} className="w-full h-full object-contain p-1" />
                          ) : (
                            <Store className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/admin/vendor-stores/${store.storeId}`}
                            className="text-sm font-black text-slate-900 uppercase italic tracking-tight hover:text-indigo-600 transition-colors block"
                          >
                            {store.storeName}
                          </Link>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {store.vendorName}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      {store.isCommissionActive && (store.commissionRate ?? 0) > 0 ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-xs font-black uppercase tracking-wider">
                          <Percent className="w-3 h-3" /> {store.commissionRate}%
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-black uppercase tracking-wider">
                          0% Free
                        </div>
                      )}
                    </td>
                    <td className="p-6 text-sm font-black text-slate-800">
                      {store.orderCount.toLocaleString()}
                    </td>
                    <td className="p-6 text-sm font-black text-slate-900">
                      ${store.grossSales.toFixed(2)}
                    </td>
                    <td className="p-6 text-sm font-black text-indigo-600">
                      +${store.platformProfit.toFixed(2)}
                    </td>
                    <td className="p-6 text-sm font-black text-slate-700">
                      ${store.vendorPayout.toFixed(2)}
                    </td>
                    <td className="p-6 text-right">
                      <button
                        onClick={() =>
                          setEditStore({
                            id: store.storeId,
                            storeName: store.storeName,
                            commissionRate: store.commissionRate ?? 0,
                            isCommissionActive: store.isCommissionActive ?? false,
                          })
                        }
                        className="px-3.5 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all inline-flex items-center gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5" /> Adjust Rate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Adjust Rate Modal */}
      <AnimatePresence>
        {editStore && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditStore(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight text-slate-900">
                    Adjust Commission
                  </h3>
                  <p className="text-xs text-slate-400 font-bold">{editStore.storeName}</p>
                </div>
                <button
                  onClick={() => setEditStore(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Active Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Charge Commission
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold">Enable or pause take rate</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditStore({
                        ...editStore,
                        isCommissionActive: !editStore.isCommissionActive,
                      })
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      editStore.isCommissionActive ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        editStore.isCommissionActive ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {editStore.isCommissionActive && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Commission Rate (%)
                        </label>
                        <span className="text-lg font-black italic text-indigo-600">
                          {editStore.commissionRate}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="1"
                        value={editStore.commissionRate}
                        onChange={(e) =>
                          setEditStore({
                            ...editStore,
                            commissionRate: Number(e.target.value),
                          })
                        }
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <div className="flex gap-2 mt-3">
                        {[0, 10, 15, 20, 25].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() =>
                              setEditStore({
                                ...editStore,
                                commissionRate: preset,
                              })
                            }
                            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                              editStore.commissionRate === preset
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {preset === 0 ? '0%' : `${preset}%`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-xs">
                      <span className="text-slate-500 font-medium">On a $100.00 sale: </span>
                      <strong className="text-indigo-600 font-bold">${editStore.commissionRate.toFixed(2)}</strong> profit to platform,{' '}
                      <strong className="text-slate-800 font-bold">${(100 - editStore.commissionRate).toFixed(2)}</strong> to vendor.
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
                    Admin Notes
                  </label>
                  <textarea
                    value={editStore.commissionNotes || ''}
                    onChange={(e) =>
                      setEditStore({
                        ...editStore,
                        commissionNotes: e.target.value,
                      })
                    }
                    placeholder="e.g. Special partnership agreement..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-semibold outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditStore(null)}
                    className="flex-1 py-3.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-2xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStoreCommission}
                    disabled={savingCommission}
                    className="flex-1 py-3.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    {savingCommission ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
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
