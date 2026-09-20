"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  PlusCircle,
  ArrowLeft,
  Search,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  Loader2,
  AlertCircle,
  ChevronRight,
  Boxes,
} from 'lucide-react';
import { getExploreProductsApi } from '@/lib/api/publicProducts';
import { requestVendorProductApi } from '@/lib/api/vendorDashboard';

export default function VendorAddProductPage() {
  const [search, setSearch] = useState('');
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Customization choices for selected template
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [newColorInput, setNewColorInput] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch available master catalog products to pick from
  useEffect(() => {
    let isMounted = true;
    async function searchCatalog() {
      setLoadingCatalog(true);
      try {
        const res = await getExploreProductsApi({ search, pageSize: 24 });
        if (isMounted && res.ok) {
          setCatalogProducts(res.items || []);
        }
      } catch (err) {
        console.error('Failed to load master products:', err);
      } finally {
        if (isMounted) setLoadingCatalog(false);
      }
    }

    const timer = setTimeout(searchCatalog, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search]);

  // When a master product is picked, auto-populate available colors and sizes
  const handleSelectProduct = (prod: any) => {
    setSelectedProduct(prod);
    setSuccessMessage(null);
    setErrorMessage(null);

    const variants = prod.variants || [];
    const colors = Array.from(new Set(variants.map((v: any) => v.color).filter(Boolean))) as string[];
    const sizes = Array.from(new Set(variants.map((v: any) => v.size).filter(Boolean))) as string[];

    setSelectedColors(colors);
    setCustomColors([]);
    setSelectedSizes(sizes);
  };

  const toggleColor = (col: string) => {
    setSelectedColors((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const toggleSize = (sz: string) => {
    setSelectedSizes((prev) =>
      prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]
    );
  };

  const handleAddCustomColor = () => {
    const trimmed = newColorInput.trim();
    if (!trimmed) return;
    if (!customColors.includes(trimmed)) {
      setCustomColors((prev) => [...prev, trimmed]);
    }
    setNewColorInput('');
  };

  const handleSubmitRequest = async () => {
    if (!selectedProduct) return;
    if (selectedColors.length === 0 && customColors.length === 0) {
      setErrorMessage('Please select or specify at least one colorway.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await requestVendorProductApi({
        masterProductId: selectedProduct.id,
        selectedColors,
        customColors,
        selectedSizes,
        notes: notes.trim() || undefined,
      });

      if (res?.ok) {
        setSuccessMessage('Product customization request submitted! Our performance lead will align your logo mockups and deploy it to your store catalog.');
        setSelectedProduct(null);
      } else {
        setErrorMessage(res?.message || 'Failed to submit product request.');
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
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
            Add Store Product
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Choose a master apparel or gear template from the AF1 catalog to brand with your logo.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 text-xs font-bold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── Step 1: Browse & Pick Template ───────────────────────────────── */}
      {!selectedProduct ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#151921] border border-white/10 flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search catalog by apparel type, silhouette, or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {loadingCatalog ? (
            <div className="p-16 text-center text-slate-500 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FF7348]" />
              <p className="text-xs font-bold uppercase tracking-widest">Searching Master Catalog...</p>
            </div>
          ) : catalogProducts.length === 0 ? (
            <div className="p-16 text-center bg-[#151921] border border-white/10 rounded-3xl">
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-400 italic">No master templates found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {catalogProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  className="bg-[#151921] hover:bg-[#1a1f29] border border-white/10 hover:border-[#FF7348]/50 rounded-3xl p-4 cursor-pointer transition-all group relative flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-square bg-black/40 rounded-2xl overflow-hidden border border-white/5 mb-3">
                      <img
                        src={p.mainImageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <h3 className="font-black italic text-xs uppercase tracking-tight text-white group-hover:text-[#FF7348] transition-colors line-clamp-2">
                      {p.name}
                    </h3>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold text-white">${p.basePrice?.toFixed(2)}</span>
                    <span className="text-[10px] font-black uppercase text-[#FF7348] flex items-center gap-1">
                      Customize <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Step 2: Configure Custom Variations & Submit ───────────────── */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#151921] border border-white/10 rounded-3xl p-6 lg:p-8 space-y-8"
        >
          {/* Selected Template Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-black/60 border border-white/15 overflow-hidden shrink-0">
                <img src={selectedProduct.mainImageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF7348] italic">
                  Selected Master Template
                </span>
                <h2 className="text-xl font-black italic uppercase tracking-tight text-white">
                  {selectedProduct.name}
                </h2>
                <p className="text-xs font-bold text-slate-400 mt-0.5">
                  Base Catalog Price: ${selectedProduct.basePrice?.toFixed(2)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedProduct(null)}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors"
            >
              Change Template
            </button>
          </div>

          {/* Variations Selection */}
          <div className="space-y-6">
            {/* Colors */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-300 italic mb-2 block">
                Available Colors
              </label>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set((selectedProduct.variants || []).map((v: any) => v.color).filter(Boolean))).map((col: any) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => toggleColor(col)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedColors.includes(col)
                        ? 'bg-[#FF7348] text-black font-black'
                        : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>

              {/* Add Custom Color */}
              <div className="mt-3 flex items-center gap-2 max-w-sm">
                <input
                  type="text"
                  placeholder="Request additional color..."
                  value={newColorInput}
                  onChange={(e) => setNewColorInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF7348]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomColor}
                  className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl border border-white/10 transition-colors"
                >
                  Add
                </button>
              </div>

              {customColors.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {customColors.map((c) => (
                    <span
                      key={c}
                      className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[#FF7348] text-xs font-bold flex items-center gap-1.5"
                    >
                      {c} (Custom)
                      <button
                        type="button"
                        onClick={() => setCustomColors((prev) => prev.filter((x) => x !== c))}
                        className="hover:text-white"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sizes */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-300 italic mb-2 block">
                Offered Sizes
              </label>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set((selectedProduct.variants || []).map((v: any) => v.size).filter(Boolean))).map((sz: any) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedSizes.includes(sz)
                        ? 'bg-white text-black font-black'
                        : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-300 italic mb-2 block">
                Special Placement Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Specific logo placement request (e.g. 'Prefer left chest placement with secondary sleeve emblem')..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF7348]"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold uppercase tracking-wider text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitRequest}
              className="flex items-center gap-2 px-6 py-3 bg-[#FF7348] hover:bg-[#ff8660] text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting Request...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Submit Product Request
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
