'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Trash2, Edit2, X, RefreshCw, CheckCircle2, AlertCircle,
  Tag, ToggleLeft, ToggleRight, Copy, Zap
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo';

interface Discount {
  id: string;
  code: string;
  description?: string;
  type: DiscountType;
  value: number;
  bogoRequiredQty?: number;
  bogoFreeQty?: number;
  minOrderAmount: number;
  maxUsageCount: number;
  usedCount: number;
  perCustomerLimit: number;
  appliesTo: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
}

const typeLabels: Record<DiscountType, string> = {
  percentage: '% Off',
  fixed_amount: '$ Off',
  free_shipping: 'Free Shipping',
  bogo: 'Buy X Get Y',
};

const typeColors: Record<DiscountType, string> = {
  percentage: 'bg-purple-100 text-purple-700',
  fixed_amount: 'bg-green-100 text-green-700',
  free_shipping: 'bg-blue-100 text-blue-700',
  bogo: 'bg-orange-100 text-orange-700',
};

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const emptyForm = {
  code: '',
  description: '',
  type: 'percentage' as DiscountType,
  value: 10,
  bogoRequiredQty: 2,
  bogoFreeQty: 1,
  minOrderAmount: 0,
  maxUsageCount: 0,
  perCustomerLimit: 0,
  startDate: '',
  endDate: '',
  isActive: true,
};

export default function Discounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchDiscounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/api/discounts');
      if (data.ok) setDiscounts(data.discounts);
    } catch (err) {
      console.error('Failed to load discounts', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchDiscounts(); }, [fetchDiscounts]);

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 4000);
  };

  const openCreate = () => {
    setForm({ ...emptyForm, code: generateCode() });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (d: Discount) => {
    setForm({
      code: d.code,
      description: d.description || '',
      type: d.type,
      value: d.value,
      bogoRequiredQty: d.bogoRequiredQty ?? 2,
      bogoFreeQty: d.bogoFreeQty ?? 1,
      minOrderAmount: d.minOrderAmount,
      maxUsageCount: d.maxUsageCount,
      perCustomerLimit: d.perCustomerLimit,
      startDate: d.startDate ? d.startDate.slice(0, 16) : '',
      endDate: d.endDate ? d.endDate.slice(0, 16) : '',
      isActive: d.isActive,
    });
    setEditingId(d.id);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) return;
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase(),
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      };

      if (editingId) {
        await apiClient.patch(`/api/discounts/${editingId}`, payload);
        showStatus('success', 'Discount updated successfully!');
      } else {
        await apiClient.post('/api/discounts', payload);
        showStatus('success', 'Discount created successfully!');
      }
      setIsModalOpen(false);
      fetchDiscounts();
    } catch (err: any) {
      showStatus('error', err?.response?.data?.message || 'Failed to save discount.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/discounts/${deleteId}`);
      showStatus('success', 'Discount deleted.');
      setDeleteId(null);
      fetchDiscounts();
    } catch {
      showStatus('error', 'Failed to delete discount.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (d: Discount) => {
    const now = new Date();
    if (!d.isActive) return <span className="px-2 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-400 uppercase tracking-wider">Inactive</span>;
    if (d.endDate && new Date(d.endDate) < now) return <span className="px-2 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-600 uppercase tracking-wider">Expired</span>;
    if (d.startDate && new Date(d.startDate) > now) return <span className="px-2 py-1 rounded-full text-[10px] font-black bg-yellow-100 text-yellow-700 uppercase tracking-wider">Scheduled</span>;
    return <span className="px-2 py-1 rounded-full text-[10px] font-black bg-green-100 text-green-700 uppercase tracking-wider">Active</span>;
  };

  const filteredDiscounts = discounts.filter((d) =>
    d.code.toLowerCase().includes(search.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Discounts</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Create and manage coupon codes and promotions</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Create Discount
        </button>
      </div>

      {/* Status */}
      {status && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
          status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-bold">{status.message}</p>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: discounts.length, color: 'text-slate-900' },
          { label: 'Active', value: discounts.filter((d) => d.isActive).length, color: 'text-green-600' },
          { label: 'Expired', value: discounts.filter((d) => d.endDate && new Date(d.endDate) < new Date()).length, color: 'text-red-500' },
          { label: 'Total Uses', value: discounts.reduce((sum, d) => sum + d.usedCount, 0), color: 'text-orange-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <p className={`text-3xl font-black italic tracking-tighter ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search discount codes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium outline-none focus:border-orange-500 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : filteredDiscounts.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Tag className="w-10 h-10 text-slate-200 mx-auto" />
            <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">
              {search ? 'No discounts match your search' : 'No discounts yet'}
            </p>
            {!search && (
              <button onClick={openCreate} className="text-orange-600 font-black text-xs uppercase tracking-widest hover:underline">
                Create your first discount →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Code</th>
                  <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Value</th>
                  <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usage</th>
                  <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry</th>
                  <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-4 py-4" />
                </tr>
              </thead>
              <tbody>
                {filteredDiscounts.map((d) => (
                  <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 tracking-wider text-sm">{d.code}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(d.code)}
                          className="text-slate-300 hover:text-slate-600 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {d.description && <p className="text-xs text-slate-400 mt-0.5 font-medium">{d.description}</p>}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${typeColors[d.type]}`}>
                        {typeLabels[d.type]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-black text-slate-700">
                      {d.type === 'percentage' && `${d.value}%`}
                      {d.type === 'fixed_amount' && `$${d.value.toFixed(2)}`}
                      {d.type === 'free_shipping' && '—'}
                      {d.type === 'bogo' && `B${d.bogoRequiredQty ?? 1}G${d.bogoFreeQty ?? 1}`}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      <span className="font-black text-slate-900">{d.usedCount}</span>
                      {d.maxUsageCount > 0 && <span className="text-slate-400"> / {d.maxUsageCount}</span>}
                      {d.maxUsageCount === 0 && <span className="text-slate-400"> / ∞</span>}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400 font-medium">
                      {d.endDate ? new Date(d.endDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(d)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(d)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(d.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">
                {editingId ? 'Edit Discount' : 'Create Discount'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Code */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Coupon Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SUMMER20"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={() => setForm((f) => ({ ...f, code: generateCode() }))}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-2 text-xs font-black text-slate-600"
                  >
                    <Zap className="w-3.5 h-3.5" /> Auto
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Description (optional)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Summer sale 20% off"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>

              {/* Type Picker */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Discount Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.entries(typeLabels) as [DiscountType, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setForm((f) => ({ ...f, type: key }))}
                      className={`py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
                        form.type === key
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value */}
              {form.type !== 'free_shipping' && form.type !== 'bogo' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {form.type === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount ($)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">
                      {form.type === 'percentage' ? '%' : '$'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max={form.type === 'percentage' ? 100 : undefined}
                      value={form.value}
                      onChange={(e) => setForm((f) => ({ ...f, value: +e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm font-bold outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* BOGO */}
              {form.type === 'bogo' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Buy (qty)</label>
                    <input
                      type="number" min="1"
                      value={form.bogoRequiredQty}
                      onChange={(e) => setForm((f) => ({ ...f, bogoRequiredQty: +e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Get Free (qty)</label>
                    <input
                      type="number" min="1"
                      value={form.bogoFreeQty}
                      onChange={(e) => setForm((f) => ({ ...f, bogoFreeQty: +e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Min Order ($)</label>
                  <input
                    type="number" min="0"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: +e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Max Uses (0=∞)</label>
                  <input
                    type="number" min="0"
                    value={form.maxUsageCount}
                    onChange={(e) => setForm((f) => ({ ...f, maxUsageCount: +e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Per Customer (0=∞)</label>
                  <input
                    type="number" min="0"
                    value={form.perCustomerLimit}
                    onChange={(e) => setForm((f) => ({ ...f, perCustomerLimit: +e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Start Date (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">End Date (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <p className="text-sm font-black uppercase tracking-wider text-slate-700">Active</p>
                  <p className="text-xs text-slate-400 font-medium">Make this discount available immediately</p>
                </div>
                <button onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}>
                  {form.isActive
                    ? <ToggleRight className="w-8 h-8 text-orange-500" />
                    : <ToggleLeft className="w-8 h-8 text-slate-300" />
                  }
                </button>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !form.code.trim()}
                className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50"
              >
                {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                {editingId ? 'Update' : 'Create Discount'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] p-8 max-w-sm w-full shadow-2xl space-y-6">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Delete Discount?</h3>
            <p className="text-sm text-slate-500 font-medium">This action cannot be undone. The coupon code will be permanently removed.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-sm font-black uppercase tracking-widest text-slate-500 hover:border-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
