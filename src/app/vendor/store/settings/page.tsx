"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  MapPin,
  Store,
  Mail,
} from 'lucide-react';
import {
  getVendorStoreProfileApi,
  updateVendorStoreProfileApi,
  type VendorStoreProfile,
} from '@/lib/api/vendorDashboard';

export default function VendorStoreSettingsPage() {
  const [store, setStore] = useState<VendorStoreProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const res = await getVendorStoreProfileApi();
        if (res?.ok && res.store) {
          setStore(res.store);
          setStoreName(res.store.storeName);
          setPhone(res.store.phone || '');
          setAddress(res.store.address || '');
        }
      } catch (err) {
        console.error('Failed to load store settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const res = await updateVendorStoreProfileApi({
        storeName: storeName.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });

      if (res?.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMsg(res?.message || 'Failed to save store settings');
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Error updating settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 space-y-2">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FF7348]" />
        <p className="text-xs font-bold uppercase tracking-widest">Loading Store Configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF7348] italic">
          Operations &amp; Contact
        </span>
        <h1 className="text-3xl font-black italic uppercase tracking-tight text-white mt-1">
          Store Settings
        </h1>
        <p className="text-xs font-medium text-slate-400 mt-1">
          Configure business details, merchant contact channels, and fulfillment addresses.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Store settings updated successfully.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 text-xs font-bold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Form Card ────────────────────────────────────────────────────── */}
      <form onSubmit={handleSave} className="p-8 rounded-3xl bg-[#151921] border border-white/10 space-y-6">
        {/* Store Name */}
        <div>
          <label className="text-xs font-black uppercase tracking-widest text-slate-300 italic mb-2 block">
            Store Name
          </label>
          <div className="relative">
            <Store className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF7348]"
            />
          </div>
        </div>

        {/* Support Phone */}
        <div>
          <label className="text-xs font-black uppercase tracking-widest text-slate-300 italic mb-2 block">
            Contact Phone
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF7348]"
            />
          </div>
        </div>

        {/* Business Address */}
        <div>
          <label className="text-xs font-black uppercase tracking-widest text-slate-300 italic mb-2 block">
            Business / Warehouse Address
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <textarea
              rows={3}
              placeholder="Street address, City, State, ZIP..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF7348]"
            />
          </div>
        </div>

        {/* Account Email (Read-Only) */}
        <div>
          <label className="text-xs font-black uppercase tracking-widest text-slate-300 italic mb-2 block">
            Linked Account Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              disabled
              value={store?.email || ''}
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-slate-500 cursor-not-allowed"
            />
          </div>
          <span className="text-[10px] text-slate-600 mt-1 block">
            Account email is managed in user profile settings.
          </span>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF7348] hover:bg-[#ff8660] text-black font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
