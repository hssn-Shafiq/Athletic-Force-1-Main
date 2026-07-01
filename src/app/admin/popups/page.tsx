"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, Edit3, Save, RefreshCw, Eye, EyeOff, LayoutTemplate,
  Calendar, Clock, Target, CheckCircle, AlertCircle, X, ChevronRight
} from 'lucide-react';
import {
  fetchAdminPopups, createPopup, updatePopup, togglePopup, deletePopup,
  type Popup, type PopupFormData, type PopupType, type PopupLayout
} from '@/lib/api/popups';
import { PopupPreview } from '@/admin/components/PopupPreview';
import { apiClient } from '@/lib/api/client';

// --- Pre-built templates ---
const TEMPLATES: Partial<PopupFormData>[] = [
  {
    name: 'Flash Sale (Bold)',
    type: 'flash_sale',
    layout: 'bold',
    title: '48 HOUR FLASH SALE',
    subtitle: 'Get 20% off all custom gear. Time is running out!',
    discountCode: 'FLASH20',
    ctaLabel: 'Shop Now',
    ctaUrl: '/collections/custom-uniforms',
    showCountdown: true,
    accentColor: '#ea580c',
    audience: 'all',
    trigger: 'page_load',
    triggerValue: 2,
    frequency: 'once_per_day',
    size: 'medium',
    pageTarget: 'all',
    showCloseButton: true,
    showEmailCapture: false
  },
  {
    name: 'Newsletter (Minimal)',
    type: 'newsletter',
    layout: 'minimal',
    title: 'Join the Force',
    subtitle: 'Subscribe for exclusive drops and VIP early access.',
    showEmailCapture: true,
    emailPlaceholder: 'Enter your best email',
    emailButtonLabel: 'Subscribe',
    accentColor: '#ea580c',
    audience: 'guests',
    trigger: 'scroll_percent',
    triggerValue: 50,
    frequency: 'once_per_session',
    size: 'small',
    pageTarget: 'all',
    showCloseButton: true,
    showCountdown: false
  },
  {
    name: 'Exit Intent (Dark)',
    type: 'exit_intent',
    layout: 'dark',
    title: 'Wait! Don\'t Leave Empty Handed',
    subtitle: 'Take 10% off your first order today only.',
    discountCode: 'TAKE10',
    ctaLabel: 'Claim My Discount',
    ctaUrl: '/collections/custom-uniforms',
    accentColor: '#ea580c',
    audience: 'all',
    trigger: 'exit_intent',
    frequency: 'once_per_session',
    size: 'medium',
    pageTarget: 'all',
    showCloseButton: true,
    showCountdown: false,
    showEmailCapture: false
  },
  {
    name: 'Welcome Offer (Split Image)',
    type: 'welcome_offer',
    layout: 'split_image',
    title: 'Welcome to AF1',
    subtitle: 'Premium gear for elite athletes. Check out our new arrivals.',
    ctaLabel: 'Shop New',
    ctaUrl: '/shop',
    accentColor: '#ea580c',
    audience: 'guests',
    trigger: 'time_on_page',
    triggerValue: 10,
    frequency: 'once_per_session',
    size: 'large',
    pageTarget: 'all',
    showCloseButton: true,
    showCountdown: false,
    showEmailCapture: false,
    imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80' // Placeholder
  },
  {
    name: 'Announcement (Fullscreen)',
    type: 'announcement',
    layout: 'fullscreen',
    title: 'NEW SEASON DROP',
    subtitle: 'The highly anticipated 2026 Collection is finally here.',
    ctaLabel: 'Explore Collection',
    ctaUrl: '/collections',
    accentColor: '#ea580c',
    audience: 'all',
    trigger: 'page_load',
    triggerValue: 0,
    frequency: 'once_ever',
    size: 'large',
    pageTarget: 'all',
    showCloseButton: true,
    showCountdown: false,
    showEmailCapture: false
  }
];

type Toast = { id: number; type: 'success' | 'error'; message: string };
let toastId = 0;

export default function AdminPopupsPage() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [editingPopup, setEditingPopup] = useState<Partial<Popup> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [activeDiscounts, setActiveDiscounts] = useState<any[]>([]);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = ++toastId;
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminPopups();
      setPopups(res.popups);
      const { data } = await apiClient.get('/api/discounts');
      if (data.ok) setActiveDiscounts(data.discounts.filter((d: any) => d.isActive && !d.isAutomatic));
    } catch { addToast('error', 'Failed to load popups'); }
    finally { setIsLoading(false); }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const handleEdit = (p: Popup) => {
    setEditingPopup(JSON.parse(JSON.stringify(p)));
    setIsCreating(false);
  };

  const handleCreateFromTemplate = (t: Partial<PopupFormData>) => {
    setEditingPopup({
      ...t,
      // Add countdown default if true
      countdownDeadline: t.showCountdown ? new Date(Date.now() + 86400000 * 2).toISOString() : undefined,
    });
    setIsCreating(true);
    setShowTemplateModal(false);
  };

  const handleSave = async (publish: boolean) => {
    if (!editingPopup || !editingPopup.name || !editingPopup.title) {
      addToast('error', 'Name and Title are required');
      return;
    }
    setIsSaving(true);
    try {
      const payload = { ...editingPopup, isActive: publish };
      if (isCreating) {
        const res = await createPopup(payload as PopupFormData);
        setPopups([res.popup, ...popups]);
        addToast('success', publish ? 'Popup published successfully' : 'Draft saved successfully');
        setEditingPopup(res.popup);
        setIsCreating(false);
      } else {
        const res = await updatePopup(editingPopup._id!, payload as PopupFormData);
        setPopups(popups.map(p => p._id === res.popup._id ? res.popup : p));
        addToast('success', publish ? 'Popup updated and published' : 'Popup saved as draft');
        setEditingPopup(res.popup);
      }
    } catch (e: any) {
      addToast('error', e?.response?.data?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await togglePopup(id);
      setPopups(popups.map(p => p._id === res.popup._id ? res.popup : p));
      if (editingPopup?._id === id) {
        setEditingPopup({ ...editingPopup, isActive: res.popup.isActive });
      }
      addToast('success', `Popup ${res.popup.isActive ? 'activated' : 'deactivated'}`);
    } catch {
      addToast('error', 'Toggle failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this popup? This cannot be undone.')) return;
    try {
      await deletePopup(id);
      setPopups(popups.filter(p => p._id !== id));
      if (editingPopup?._id === id) setEditingPopup(null);
      addToast('success', 'Popup deleted');
    } catch {
      addToast('error', 'Delete failed');
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Popups & Offers</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage marketing modals and announcements</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition text-slate-500">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowTemplateModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-lg">
            <Plus className="w-4 h-4" /> New Popup
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* List */}
        <div className="lg:col-span-4 space-y-3">
          {popups.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center">
              <LayoutTemplate className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No popups found</p>
            </div>
          )}
          {popups.map(p => (
            <div key={p._id} className={`group relative rounded-2xl border p-5 cursor-pointer transition-all ${editingPopup?._id === p._id ? 'border-orange-300 bg-orange-50/50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'}`}
              onClick={() => handleEdit(p)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 italic">{p.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.type.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={e => { e.stopPropagation(); handleToggle(p._id); }} className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(p._id); }} className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-red-100 rounded-lg text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Impressions</p>
                  <p className="text-xs font-bold text-slate-700">{p.impressions}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Dismissals</p>
                  <p className="text-xs font-bold text-slate-700">{p.dismissals}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Trigger</p>
                  <p className="text-[9px] font-bold text-slate-700 uppercase">{p.trigger.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Editor */}
        <div className="lg:col-span-8">
          {!editingPopup ? (
             <div className="rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center min-h-[500px] bg-slate-50/50">
               <Target className="w-12 h-12 text-slate-200 mb-4" />
               <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Select or Create a Popup</p>
             </div>
          ) : (
            <div className="space-y-6">
              {/* Preview */}
              <div className="bg-slate-100 rounded-3xl p-8 border border-slate-200 flex items-center justify-center min-h-[400px] relative">
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-white px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-slate-500 shadow-sm">Live Preview</span>
                  <span className="bg-white px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-slate-500 shadow-sm">{editingPopup.layout} • {editingPopup.size}</span>
                </div>
                <div className="w-full">
                  <PopupPreview popup={editingPopup} />
                </div>
              </div>

              {/* Form */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-lg font-black uppercase tracking-widest italic text-slate-900">
                    {isCreating ? 'Create Popup' : 'Edit Popup'}
                  </h2>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setEditingPopup(null)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900">Cancel</button>
                    <button onClick={() => handleSave(false)} disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition disabled:opacity-50">
                      Save Draft
                    </button>
                    <button onClick={() => handleSave(true)} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-700 transition shadow-lg shadow-orange-600/20 disabled:opacity-50">
                      {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      {editingPopup.isActive ? 'Update Live' : 'Publish'}
                    </button>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Left Col: Basics & Content */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-2 mb-4">Basic Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Internal Name *</label>
                          <input value={editingPopup.name || ''} onChange={e => setEditingPopup({ ...editingPopup, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-orange-400" placeholder="e.g. Winter Sale 2026" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Type</label>
                            <select value={editingPopup.type || 'announcement'} onChange={e => setEditingPopup({ ...editingPopup, type: e.target.value as PopupType })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400">
                              <option value="flash_sale">Flash Sale</option>
                              <option value="newsletter">Newsletter</option>
                              <option value="welcome_offer">Welcome Offer</option>
                              <option value="exit_intent">Exit Intent</option>
                              <option value="announcement">Announcement</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Layout</label>
                            <select value={editingPopup.layout || 'bold'} onChange={e => setEditingPopup({ ...editingPopup, layout: e.target.value as PopupLayout })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400">
                              <option value="minimal">Minimal</option>
                              <option value="bold">Bold</option>
                              <option value="dark">Dark</option>
                              <option value="split_image">Split Image</option>
                              <option value="fullscreen">Fullscreen</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Size</label>
                            <select value={editingPopup.size || 'medium'} onChange={e => setEditingPopup({ ...editingPopup, size: e.target.value as 'small'|'medium'|'large' })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400">
                              <option value="small">Small</option>
                              <option value="medium">Medium</option>
                              <option value="large">Large</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Accent Color</label>
                            <div className="flex gap-2">
                              <input type="color" value={editingPopup.accentColor || '#ea580c'} onChange={e => setEditingPopup({ ...editingPopup, accentColor: e.target.value })} className="h-8 w-10 p-0 border-0 rounded cursor-pointer" />
                              <input type="text" value={editingPopup.accentColor || '#ea580c'} onChange={e => setEditingPopup({ ...editingPopup, accentColor: e.target.value })} className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-2 mb-4">Content</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Headline *</label>
                          <input value={editingPopup.title || ''} onChange={e => setEditingPopup({ ...editingPopup, title: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-orange-400" />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Subtitle</label>
                          <textarea value={editingPopup.subtitle || ''} onChange={e => setEditingPopup({ ...editingPopup, subtitle: e.target.value })} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">CTA Button Label</label>
                            <input value={editingPopup.ctaLabel || ''} onChange={e => setEditingPopup({ ...editingPopup, ctaLabel: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400" />
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">CTA URL</label>
                            <input value={editingPopup.ctaUrl || ''} onChange={e => setEditingPopup({ ...editingPopup, ctaUrl: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Discount Code</label>
                            <select value={editingPopup.discountCode || ''} onChange={e => setEditingPopup({ ...editingPopup, discountCode: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400 uppercase">
                              <option value="">-- None --</option>
                              {activeDiscounts.map(d => {
                                let label = '';
                                if (d.type === 'percentage') label = d.value + '% Off';
                                else if (d.type === 'fixed_amount') label = '$' + d.value + ' Off';
                                else if (d.type === 'free_shipping') label = 'Free Shipping';
                                else if (d.type === 'bogo') label = 'BOGO';
                                else label = d.type;
                                return <option key={d._id} value={d.code}>{d.code} - {label}</option>
                              })}
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Dismiss Button Label</label>
                            <input value={editingPopup.dismissLabel || ''} onChange={e => setEditingPopup({ ...editingPopup, dismissLabel: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400" />
                          </div>
                        </div>
                        {['split_image', 'fullscreen'].includes(editingPopup.layout || '') && (
                           <div>
                             <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Image URL</label>
                             <input value={editingPopup.imageUrl || ''} onChange={e => setEditingPopup({ ...editingPopup, imageUrl: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400" placeholder="https://" />
                           </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Col: Features, Trigger, Audience */}
                  <div className="space-y-6">
                     <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-2 mb-4">Features</h3>
                      <div className="space-y-4">
                        <label className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
                          <input type="checkbox" checked={editingPopup.showCountdown || false} onChange={e => setEditingPopup({ ...editingPopup, showCountdown: e.target.checked })} className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500" />
                          <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Show Countdown Timer</p>
                          </div>
                        </label>
                        {editingPopup.showCountdown && (
                          <div className="pl-7">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Deadline</label>
                            <input type="datetime-local" value={editingPopup.countdownDeadline ? editingPopup.countdownDeadline.slice(0, 16) : ''} onChange={e => setEditingPopup({ ...editingPopup, countdownDeadline: new Date(e.target.value).toISOString() })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400" />
                          </div>
                        )}

                        <label className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
                          <input type="checkbox" checked={editingPopup.showEmailCapture || false} onChange={e => setEditingPopup({ ...editingPopup, showEmailCapture: e.target.checked })} className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500" />
                          <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Show Email Capture</p>
                          </div>
                        </label>
                        {editingPopup.showEmailCapture && (
                          <div className="pl-7 grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Placeholder</label>
                              <input value={editingPopup.emailPlaceholder || ''} onChange={e => setEditingPopup({ ...editingPopup, emailPlaceholder: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Button text</label>
                              <input value={editingPopup.emailButtonLabel || ''} onChange={e => setEditingPopup({ ...editingPopup, emailButtonLabel: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-2 mb-4">Display Rules</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Trigger</label>
                            <select value={editingPopup.trigger || 'page_load'} onChange={e => setEditingPopup({ ...editingPopup, trigger: e.target.value as any })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400">
                              <option value="page_load">Time on Page Load</option>
                              <option value="time_on_page">Time on Page</option>
                              <option value="scroll_percent">Scroll %</option>
                              <option value="exit_intent">Exit Intent</option>
                            </select>
                          </div>
                          {['page_load', 'time_on_page', 'scroll_percent'].includes(editingPopup.trigger || '') && (
                            <div>
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                                {editingPopup.trigger === 'scroll_percent' ? 'Scroll %' : 'Seconds delay'}
                              </label>
                              <input type="number" value={editingPopup.triggerValue || 0} onChange={e => setEditingPopup({ ...editingPopup, triggerValue: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400" />
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Audience</label>
                            <select value={editingPopup.audience || 'all'} onChange={e => setEditingPopup({ ...editingPopup, audience: e.target.value as any })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400">
                              <option value="all">Everyone</option>
                              <option value="guests">Guests Only</option>
                              <option value="logged_in">Customers Only</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Frequency</label>
                            <select value={editingPopup.frequency || 'once_per_session'} onChange={e => setEditingPopup({ ...editingPopup, frequency: e.target.value as any })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400">
                              <option value="every_visit">Every Visit</option>
                              <option value="once_per_session">Once Per Session</option>
                              <option value="once_per_day">Once Per Day</option>
                              <option value="once_ever">Once Ever</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Page Targeting</label>
                          <select value={editingPopup.pageTarget || 'all'} onChange={e => setEditingPopup({ ...editingPopup, pageTarget: e.target.value as any })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400">
                            <option value="all">All Pages</option>
                            <option value="homepage">Homepage Only</option>
                            <option value="shop">Shop/Collections Only</option>
                            <option value="custom">Custom Pattern</option>
                          </select>
                        </div>
                        {editingPopup.pageTarget === 'custom' && (
                          <div>
                             <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Custom Pattern (e.g. /products/*)</label>
                             <input value={editingPopup.pageTargetPattern || ''} onChange={e => setEditingPopup({ ...editingPopup, pageTargetPattern: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400" />
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowTemplateModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Select Template</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Start from a pre-built layout</p>
                  </div>
                  <button onClick={() => setShowTemplateModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition min-h-[250px]" onClick={() => handleCreateFromTemplate({ name: 'Custom Popup', type: 'announcement', layout: 'bold', size: 'medium', title: 'New Popup', audience: 'all', frequency: 'once_per_session', trigger: 'page_load', triggerValue: 0, pageTarget: 'all', accentColor: '#ea580c', showCloseButton: true, showCountdown: false, showEmailCapture: false })}>
                     <Plus className="w-10 h-10 text-slate-300 mb-3" />
                     <p className="text-sm font-black uppercase tracking-widest text-slate-500">Blank Canvas</p>
                  </div>
                  {TEMPLATES.map((t, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 cursor-pointer hover:border-orange-400 hover:shadow-lg transition relative overflow-hidden group" onClick={() => handleCreateFromTemplate(t)}>
                      <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent pointer-events-none" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-1 relative z-10">{t.type?.replace(/_/g, ' ')}</p>
                      <h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-900 mb-2 relative z-10">{t.name}</h3>
                      <p className="text-xs text-slate-500 font-medium relative z-10 mb-6">{t.subtitle}</p>
                      
                      <div className="mt-auto space-y-1 relative z-10">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                          <span>Layout</span><span className="text-slate-700">{t.layout}</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                          <span>Features</span>
                          <span className="text-slate-700">
                            {[t.showCountdown && 'Timer', t.showEmailCapture && 'Email', t.discountCode && 'Code'].filter(Boolean).join(' • ') || 'None'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="absolute right-4 bottom-4 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 z-10">
                        <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-lg"><ChevronRight className="w-4 h-4" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[100] space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white text-[11px] font-black uppercase tracking-widest pointer-events-auto ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
              {t.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
