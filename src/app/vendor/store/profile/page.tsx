"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Store,
  ExternalLink,
  ShieldCheck,
  Tag,
  Clock,
  Sparkles,
  Save,
  CheckCircle2,
  RefreshCw,
  Copy,
} from 'lucide-react';
import {
  getVendorStoreProfileApi,
  type VendorStoreProfile,
} from '@/lib/api/vendorDashboard';

export default function VendorStoreProfilePage() {
  const [store, setStore] = useState<VendorStoreProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const res = await getVendorStoreProfileApi();
        if (res?.ok) setStore(res.store);
      } catch (err) {
        console.error('Failed to load store profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 space-y-2">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#FF7348]" />
        <p className="text-xs font-bold uppercase tracking-widest">Loading Store Profile...</p>
      </div>
    );
  }

  if (!store) return null;

  const teamStoreRelativePath = `/team/${store.teamStoreSlug || store.collectionSlugs?.[0] || 'store'}`;
  const fullLiveUrl = typeof window !== 'undefined' ? `${window.location.origin}${teamStoreRelativePath}` : teamStoreRelativePath;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF7348] italic">
          Identity &amp; Brand
        </span>
        <h1 className="text-3xl font-black italic uppercase tracking-tight text-white mt-1">
          Store Profile
        </h1>
        <p className="text-xs font-medium text-slate-400 mt-1">
          Your public team store identity, brand prefix, and customer storefront presence.
        </p>
      </div>

      {/* ── Store Identity Showcase ──────────────────────────────────────── */}
      <div className="p-8 rounded-3xl bg-[#151921] border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Logo Showcase */}
          <div className="w-24 h-24 rounded-3xl bg-black/70 border border-white/15 overflow-hidden flex items-center justify-center p-2 shrink-0 shadow-xl">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.storeName} className="w-full h-full object-contain" />
            ) : (
              <Store className="w-10 h-10 text-slate-400" />
            )}
          </div>

          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">
                {store.storeName}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Approved Merchant
              </span>
            </div>

            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Manager: {store.vendorName} &bull; {store.email}
            </p>

            {store.productNamePrefix && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#FF7348] text-xs font-bold mt-1">
                <Tag className="w-3 h-3" />
                <span>Catalog Naming: AF1 {store.productNamePrefix} [Product Title]</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Storefront Link Bar */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">
              Public Team Storefront URL:
            </p>
            <p className="text-xs font-mono text-white mt-0.5 select-all">
              {fullLiveUrl}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyUrl(fullLiveUrl)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider border border-white/10 transition-colors flex items-center gap-1.5"
            >
              <Copy className="w-3 h-3" /> {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <Link
              href={teamStoreRelativePath}
              target="_blank"
              className="px-3.5 py-1.5 rounded-xl bg-[#FF7348] hover:bg-[#ff8660] text-black text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
            >
              Visit Store <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Metadata Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-[#151921] border border-white/10 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
            Assigned Collection Slugs
          </span>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {store.collectionSlugs?.length > 0 ? (
              store.collectionSlugs.map((s) => (
                <span
                  key={s}
                  className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 uppercase tracking-wider font-mono"
                >
                  {s}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">Dedicated collection assigned</span>
            )}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-[#151921] border border-white/10 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
            Store Registration Date
          </span>
          <p className="text-sm font-bold text-white pt-1">
            {new Date(store.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
