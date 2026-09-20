"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Star,
  MessageSquare,
  Package,
  RefreshCw,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import {
  getVendorReviewsApi,
  type VendorReviewItem,
} from '@/lib/api/vendorDashboard';

export default function VendorReviewsPage() {
  const [reviews, setReviews] = useState<VendorReviewItem[]>([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    avgRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
  });
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await getVendorReviewsApi();
      if (res?.ok) {
        setReviews(res.reviews);
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF7348] italic">
            Customer Sentiment
          </span>
          <h1 className="text-3xl font-black italic uppercase tracking-tight text-white mt-1">
            Product Reviews ({stats.totalReviews})
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Feedback and ratings submitted by buyers of your branded team gear.
          </p>
        </div>

        <button
          onClick={fetchReviews}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Reviews
        </button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Average Rating */}
        <div className="p-6 rounded-3xl bg-[#151921] border border-white/10 flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center text-amber-400">
            <span className="text-3xl font-black italic leading-none">{stats.avgRating}</span>
            <div className="flex items-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-2.5 h-2.5 ${
                    s <= Math.round(stats.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-base font-black italic uppercase text-white">Overall Score</h3>
            <p className="text-xs text-slate-400 mt-1">Based on {stats.totalReviews} verified reviews</p>
          </div>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-[#151921] border border-white/10 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.ratingDistribution[star] || 0;
            const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-bold text-slate-400 flex items-center gap-1">
                  {star} <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-slate-500 text-[11px] font-mono">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Reviews Feed ──────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#FF7348]" />
            <p className="text-xs font-bold uppercase tracking-widest">Loading Reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-16 text-center bg-[#151921] border border-white/10 rounded-3xl space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-400 italic">No reviews received yet</p>
            <p className="text-xs text-slate-600">
              Reviews left by buyers on your products will be organized here.
            </p>
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="p-6 rounded-3xl bg-[#151921] border border-white/10 space-y-4 hover:border-white/20 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-black/60 border border-white/10 overflow-hidden shrink-0">
                    <img src={r.productImage} alt={r.productName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black italic uppercase text-white truncate max-w-sm">
                      {r.productName}
                    </h4>
                    <p className="text-[10px] text-slate-500">Buyer: {r.fullName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-medium bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                &ldquo;{r.reviewText}&rdquo;
              </p>

              {r.photos && r.photos.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  {r.photos.map((photo, pIdx) => (
                    <div
                      key={pIdx}
                      className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-black/40"
                    >
                      <img src={photo.url} alt="Review attachment" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
