"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  DollarSign,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  RefreshCw,
  CreditCard,
  FileText,
} from 'lucide-react';
import {
  getVendorEarningsApi,
  type VendorEarningsResponse,
} from '@/lib/api/vendorDashboard';

export default function VendorEarningsPage() {
  const [data, setData] = useState<VendorEarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const res = await getVendorEarningsApi();
      if (res?.ok) setData(res);
    } catch (err) {
      console.error('Failed to load earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const summary = data?.summary || {
    totalGross: 0,
    totalNet: 0,
    totalFee: 0,
    pendingPayout: 0,
    paidPayout: 0,
    commissionRate: 15,
  };

  const payoutHistory = data?.payoutHistory || [];

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF7348] italic">
            Revenue &amp; Payouts
          </span>
          <h1 className="text-3xl font-black italic uppercase tracking-tight text-white mt-1">
            Merchant Earnings
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Financial summary, platform commission breakdown, and distribution history.
          </p>
        </div>

        <button
          onClick={fetchEarnings}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Financials
        </button>
      </div>

      {/* ── Earnings Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Earnings */}
        <div className="p-6 rounded-3xl bg-[#151921] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
              Net Take-Home
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black italic text-white">
            ${summary.totalNet.toFixed(2)}
          </h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Total realized vendor revenue
          </p>
        </div>

        {/* Gross Sales */}
        <div className="p-6 rounded-3xl bg-[#151921] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
              Gross Volume
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FF7348]/10 border border-[#FF7348]/20 flex items-center justify-center text-[#FF7348]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black italic text-white">
            ${summary.totalGross.toFixed(2)}
          </h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Total checkout cart value
          </p>
        </div>

        {/* Pending Payout */}
        <div className="p-6 rounded-3xl bg-[#151921] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
              Pending Payout
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black italic text-amber-400">
            ${summary.pendingPayout.toFixed(2)}
          </h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Awaiting payout distribution
          </p>
        </div>

        {/* Paid Out */}
        <div className="p-6 rounded-3xl bg-[#151921] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
              Settled / Paid
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black italic text-white">
            ${summary.paidPayout.toFixed(2)}
          </h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Disbursed to merchant
          </p>
        </div>
      </div>

      {/* ── Payout Breakdown Table ────────────────────────────────────────── */}
      <div className="bg-[#151921] border border-white/10 rounded-3xl overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black italic uppercase tracking-wider text-white">
              Financial Breakdown History
            </h2>
            <p className="text-[11px] font-medium text-slate-400">
              Transaction fee and net balance per fulfilled sub-order
            </p>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Standard Fee: {summary.commissionRate}%
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#FF7348]" />
            <p className="text-xs font-bold uppercase tracking-widest">Loading Transactions...</p>
          </div>
        ) : payoutHistory.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
            <CreditCard className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-400 italic">No transactions recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                  <th className="p-3 pl-4">Sub-Order #</th>
                  <th className="p-3">Gross Cart</th>
                  <th className="p-3">Platform Fee</th>
                  <th className="p-3">Net Earnings</th>
                  <th className="p-3">Payout Status</th>
                  <th className="p-3 pr-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payoutHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 pl-4 font-mono font-bold text-white uppercase italic">
                      {item.subOrderNumber}
                    </td>
                    <td className="p-3 font-bold text-slate-300">${item.subtotal.toFixed(2)}</td>
                    <td className="p-3 text-red-400 font-mono">-${item.platformFee.toFixed(2)}</td>
                    <td className="p-3 font-black italic text-emerald-400">
                      +${item.netEarnings.toFixed(2)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          item.payoutStatus === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : item.payoutStatus === 'processing'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {item.payoutStatus}
                      </span>
                    </td>
                    <td className="p-3 pr-4 text-right text-slate-500 text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
