"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Navigation, Plus, Trash2, ChevronDown, ChevronUp,
  Save, RefreshCw, Edit3, Eye, EyeOff, GripVertical, X, AlertCircle, CheckCircle
} from 'lucide-react';
import {
  fetchAdminNavMenus, createNavMenu, updateNavMenu, deleteNavMenu
} from '@/lib/api/navMenu';
import type { NavMenu, NavMenuItem, NavSubItem } from '@/lib/api/types';

type Toast = { id: number; type: 'success' | 'error'; message: string };

let toastId = 0;

export default function NavMenuAdminPage() {
  const [menus, setMenus] = useState<NavMenu[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingMenu, setEditingMenu] = useState<NavMenu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMenuKey, setNewMenuKey] = useState('');
  const [newMenuLabel, setNewMenuLabel] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = ++toastId;
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminNavMenus();
      setMenus(res.menus);
      if (res.menus.length > 0 && !activeMenuId) {
        const first = res.menus[0];
        setActiveMenuId(first._id!);
        setEditingMenu(JSON.parse(JSON.stringify(first)));
      }
    } catch { addToast('error', 'Failed to load menus'); }
    finally { setIsLoading(false); }
  }, [activeMenuId, addToast]);

  useEffect(() => { load(); }, []);

  const selectMenu = (menu: NavMenu) => {
    setActiveMenuId(menu._id!);
    setEditingMenu(JSON.parse(JSON.stringify(menu)));
    setExpandedItems(new Set());
  };

  // ── Item helpers ─────────────────────────────────────────────────────────────
  const addItem = () => {
    if (!editingMenu) return;
    const newItem: NavMenuItem = { label: 'New Item', href: '', categoryId: '', isActive: true, sortOrder: editingMenu.items.length, subItems: [] };
    const updated = { ...editingMenu, items: [...editingMenu.items, newItem] };
    setEditingMenu(updated);
    setExpandedItems(p => new Set([...p, updated.items.length - 1]));
  };

  const removeItem = (idx: number) => {
    if (!editingMenu) return;
    setEditingMenu({ ...editingMenu, items: editingMenu.items.filter((_, i) => i !== idx) });
  };

  const updateItem = (idx: number, patch: Partial<NavMenuItem>) => {
    if (!editingMenu) return;
    const items = editingMenu.items.map((it, i) => i === idx ? { ...it, ...patch } : it);
    setEditingMenu({ ...editingMenu, items });
  };

  const addSubItem = (itemIdx: number) => {
    if (!editingMenu) return;
    const sub: NavSubItem = { label: 'New Link', href: '/', isActive: true, sortOrder: editingMenu.items[itemIdx].subItems.length };
    const items = editingMenu.items.map((it, i) => i === itemIdx ? { ...it, subItems: [...it.subItems, sub] } : it);
    setEditingMenu({ ...editingMenu, items });
  };

  const removeSubItem = (itemIdx: number, subIdx: number) => {
    if (!editingMenu) return;
    const items = editingMenu.items.map((it, i) =>
      i === itemIdx ? { ...it, subItems: it.subItems.filter((_, si) => si !== subIdx) } : it
    );
    setEditingMenu({ ...editingMenu, items });
  };

  const updateSubItem = (itemIdx: number, subIdx: number, patch: Partial<NavSubItem>) => {
    if (!editingMenu) return;
    const items = editingMenu.items.map((it, i) =>
      i === itemIdx ? { ...it, subItems: it.subItems.map((s, si) => si === subIdx ? { ...s, ...patch } : s) } : it
    );
    setEditingMenu({ ...editingMenu, items });
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!editingMenu || !activeMenuId) return;
    setIsSaving(true);
    try {
      const res = await updateNavMenu(activeMenuId, {
        label: editingMenu.label,
        items: editingMenu.items,
        isActive: editingMenu.isActive,
      });
      setMenus(p => p.map(m => m._id === activeMenuId ? res.menu : m));
      setEditingMenu(JSON.parse(JSON.stringify(res.menu)));
      addToast('success', 'Menu saved successfully!');
    } catch { addToast('error', 'Save failed. Please try again.'); }
    finally { setIsSaving(false); }
  };

  // ── Create ────────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newMenuKey.trim() || !newMenuLabel.trim()) return;
    try {
      const res = await createNavMenu({ key: newMenuKey.trim(), label: newMenuLabel.trim() });
      setMenus(p => [...p, res.menu]);
      setShowCreateModal(false);
      setNewMenuKey(''); setNewMenuLabel('');
      selectMenu(res.menu);
      addToast('success', `Menu "${res.menu.label}" created!`);
    } catch (e: any) {
      addToast('error', e?.response?.data?.message || 'Create failed.');
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async (menuId: string) => {
    if (!confirm('Delete this menu? This cannot be undone.')) return;
    try {
      await deleteNavMenu(menuId);
      const remaining = menus.filter(m => m._id !== menuId);
      setMenus(remaining);
      if (activeMenuId === menuId) {
        if (remaining.length > 0) { selectMenu(remaining[0]); }
        else { setActiveMenuId(null); setEditingMenu(null); }
      }
      addToast('success', 'Menu deleted.');
    } catch { addToast('error', 'Delete failed.'); }
  };

  const toggleExpand = (idx: number) => {
    setExpandedItems(p => {
      const n = new Set(p);
      n.has(idx) ? n.delete(idx) : n.add(idx);
      return n;
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Nav Menu Builder</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage dynamic header navigation menus</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition text-slate-500">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-lg">
            <Plus className="w-4 h-4" /> New Menu
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: menu list */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] px-1 mb-3">Menus</p>
          {menus.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <Navigation className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No menus yet</p>
            </div>
          )}
          {menus.map(menu => (
            <div key={menu._id} className={`group relative rounded-2xl border p-4 cursor-pointer transition-all ${activeMenuId === menu._id ? 'border-orange-300 bg-orange-50/60 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}
              onClick={() => selectMenu(menu)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-tight text-slate-900 italic">{menu.label}</p>
                  <p className="text-[9px] font-bold text-slate-400 tracking-widest">{menu.key}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${menu.isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
                  <button onClick={e => { e.stopPropagation(); handleDelete(menu._id!); }}
                    className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-red-100 rounded-lg text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p className="text-[9px] font-bold text-slate-400 mt-2">{menu.items.length} items</p>
            </div>
          ))}
        </div>

        {/* Editor */}
        <div className="lg:col-span-3">
          {!editingMenu ? (
            <div className="rounded-3xl border border-dashed border-slate-200 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Navigation className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-sm font-black text-slate-300 uppercase tracking-widest italic">Select or create a menu</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Menu meta */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-black uppercase tracking-widest italic text-slate-900">Menu Settings</h2>
                  <button onClick={() => setEditingMenu({ ...editingMenu, isActive: !editingMenu.isActive })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editingMenu.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    {editingMenu.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {editingMenu.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Menu Label</label>
                    <input value={editingMenu.label} onChange={e => setEditingMenu({ ...editingMenu, label: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-orange-400" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Menu Key (read-only)</label>
                    <input readOnly value={editingMenu.key}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-400 cursor-not-allowed outline-none" />
                  </div>
                </div>
              </div>

              {/* Items editor */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-black uppercase tracking-widest italic text-slate-900">Menu Items</h2>
                  <button onClick={addItem} className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-100 transition">
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                {editingMenu.items.length === 0 && (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No items yet. Click "Add Item" to begin.</p>
                  </div>
                )}

                <div className="space-y-3">
                  {editingMenu.items.map((item, idx) => (
                    <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden">
                      {/* Item header */}
                      <div className="flex items-center gap-3 p-4 bg-slate-50/50">
                        <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Label</label>
                            <input value={item.label} onChange={e => updateItem(idx, { label: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-orange-400" />
                          </div>
                          <div>
                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Category ID (slug)</label>
                            <input value={item.categoryId || ''} onChange={e => updateItem(idx, { categoryId: e.target.value })}
                              placeholder="e.g. custom-uniforms"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-orange-400" />
                          </div>
                          <div>
                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Direct Link (optional)</label>
                            <input value={item.href || ''} onChange={e => updateItem(idx, { href: e.target.value })}
                              placeholder="/collections/..."
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-orange-400" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => updateItem(idx, { isActive: !item.isActive })}
                            className={`p-1.5 rounded-lg transition ${item.isActive ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}>
                            {item.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => toggleExpand(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition">
                            {expandedItems.has(idx) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button onClick={() => removeItem(idx)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Sub-items */}
                      <AnimatePresence>
                        {expandedItems.has(idx) && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-slate-100 bg-white">
                            <div className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sub-Menu Links ({item.subItems.length})</p>
                                <button onClick={() => addSubItem(idx)} className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition">
                                  <Plus className="w-3 h-3" /> Add Link
                                </button>
                              </div>

                              {item.subItems.length === 0 && (
                                <p className="text-[10px] font-bold text-slate-300 text-center py-3">No sub-items. Add links that appear in the dropdown.</p>
                              )}

                              {item.subItems.map((sub, si) => (
                                <div key={si} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                  <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                  <div className="flex-1 grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Label</label>
                                      <input value={sub.label} onChange={e => updateSubItem(idx, si, { label: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-orange-400" />
                                    </div>
                                    <div>
                                      <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Link (href)</label>
                                      <input value={sub.href} onChange={e => updateSubItem(idx, si, { href: e.target.value })}
                                        placeholder="/collections/..."
                                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-orange-400" />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button onClick={() => updateSubItem(idx, si, { isActive: !sub.isActive })}
                                      className={`p-1.5 rounded-lg transition ${sub.isActive ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-100'}`}>
                                      {sub.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                    </button>
                                    <button onClick={() => removeSubItem(idx, si)}
                                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save button */}
              <div className="flex justify-end">
                <button onClick={handleSave} disabled={isSaving}
                  className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl disabled:opacity-60">
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Save Menu'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowCreateModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Create New Menu</h2>
                  <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1.5">Menu Key <span className="text-orange-500">*</span></label>
                    <input value={newMenuKey} onChange={e => setNewMenuKey(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      placeholder="e.g. header, footer-nav"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-orange-400" />
                    <p className="text-[9px] text-slate-400 font-bold mt-1">Unique identifier used to fetch this menu on the frontend.</p>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1.5">Display Label <span className="text-orange-500">*</span></label>
                    <input value={newMenuLabel} onChange={e => setNewMenuLabel(e.target.value)}
                      placeholder="e.g. Header Navigation"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-orange-400" />
                  </div>
                  <button onClick={handleCreate} disabled={!newMenuKey.trim() || !newMenuLabel.trim()}
                    className="w-full py-3 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50 mt-2">
                    Create Menu
                  </button>
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
            <motion.div key={t.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white text-[11px] font-black uppercase tracking-widest pointer-events-auto ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
              {t.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
