'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Percent, Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface StoreSettings {
  shippingRate: number;
  freeShippingThreshold: number;
  taxRate: number;
  taxLabel: string;
  taxEnabled: boolean;
}

export default function ShippingTaxSettings() {
  const [settings, setSettings] = useState<StoreSettings>({
    shippingRate: 0,
    freeShippingThreshold: 0,
    taxRate: 0,
    taxLabel: 'Tax',
    taxEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Preview values
  const previewCartTotal = 85;
  const previewShipping =
    settings.freeShippingThreshold > 0 && previewCartTotal >= settings.freeShippingThreshold
      ? 0
      : settings.shippingRate;
  const previewTax = settings.taxEnabled
    ? +(previewCartTotal * (settings.taxRate / 100)).toFixed(2)
    : 0;
  const previewTotal = +(previewCartTotal + previewShipping + previewTax).toFixed(2);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await apiClient.get('/api/admin/settings/shipping-tax');
        if (data.ok) setSettings(data.settings);
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      const { data } = await apiClient.put('/api/admin/settings/shipping-tax', settings);
      if (data.ok) {
        setSettings(data.settings);
        setStatus({ type: 'success', message: 'Settings saved successfully!' });
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err?.response?.data?.message || 'Failed to save settings.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatus(null), 4000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">
          Shipping & Tax
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Configure shipping rates and tax settings applied at checkout.
        </p>
      </div>

      {/* Status */}
      {status && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
          status.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {status.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <p className="text-sm font-bold">{status.message}</p>
        </div>
      )}

      {/* Shipping Section */}
      <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
            <Truck className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">
              Shipping Rate
            </h2>
            <p className="text-xs text-slate-400 font-medium">Applied to every order at checkout</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Flat Shipping Rate (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.shippingRate}
                onChange={(e) => setSettings((s) => ({ ...s, shippingRate: +e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-400">Set to 0 for always-free shipping</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Free Shipping Above (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings((s) => ({ ...s, freeShippingThreshold: +e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-400">Set to 0 to disable free shipping threshold</p>
          </div>
        </div>
      </div>

      {/* Tax Section */}
      <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Percent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">
                Tax Configuration
              </h2>
              <p className="text-xs text-slate-400 font-medium">Added on top of subtotal at checkout</p>
            </div>
          </div>
          {/* Toggle */}
          <button
            onClick={() => setSettings((s) => ({ ...s, taxEnabled: !s.taxEnabled }))}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
              settings.taxEnabled ? 'bg-orange-500' : 'bg-slate-200'
            }`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
              settings.taxEnabled ? 'left-7' : 'left-1'
            }`} />
          </button>
        </div>

        {settings.taxEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Tax Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settings.taxRate}
                  onChange={(e) => setSettings((s) => ({ ...s, taxRate: +e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 pr-10 py-3 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Tax Label
              </label>
              <input
                type="text"
                value={settings.taxLabel}
                onChange={(e) => setSettings((s) => ({ ...s, taxLabel: e.target.value }))}
                placeholder="e.g. VAT, GST, Sales Tax"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* Live Preview */}
      <div className="bg-slate-900 rounded-[32px] p-8 space-y-4 text-white">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          Live Preview — $85 Cart
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 font-medium">Subtotal</span>
            <span className="font-black">${previewCartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 font-medium">Shipping</span>
            <span className={`font-black ${previewShipping === 0 ? 'text-green-400' : ''}`}>
              {previewShipping === 0 ? 'FREE' : `$${previewShipping.toFixed(2)}`}
            </span>
          </div>
          {settings.taxEnabled && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">{settings.taxLabel} ({settings.taxRate}%)</span>
              <span className="font-black">${previewTax.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-slate-700 pt-3 flex justify-between">
            <span className="font-black text-lg italic uppercase tracking-tighter">Total</span>
            <span className="font-black text-xl text-orange-400">${previewTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="flex items-center gap-3 bg-black text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-orange-600 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
      >
        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {isSaving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
