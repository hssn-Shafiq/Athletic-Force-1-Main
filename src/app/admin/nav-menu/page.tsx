"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Navigation, Plus, Trash2, ChevronDown, ChevronUp, ChevronRight,
  Save, RefreshCw, Eye, EyeOff, X, AlertCircle, CheckCircle,
  ArrowUp, ArrowDown, ShieldAlert, Sparkles, Layers,
  ExternalLink, FolderTree, Check
} from 'lucide-react';
import {
  fetchAdminNavMenus, createNavMenu, updateNavMenu, deleteNavMenu
} from '@/lib/api/navMenu';
import type { NavMenu, NavItem } from '@/lib/api/types';

type Toast = { id: number; type: 'success' | 'error'; message: string };

let toastId = 0;

// ─── Tree Helper Utilities ───────────────────────────────────────────────────

function getItemChildren(item: NavItem): NavItem[] {
  if (Array.isArray(item.children) && item.children.length > 0) return item.children;
  if (Array.isArray(item.subItems) && item.subItems.length > 0) return item.subItems;
  return [];
}

/**
 * Immutable recursive update for any node in the tree by index path
 */
function updateNodeAtPath(items: NavItem[], path: number[], patch: Partial<NavItem>): NavItem[] {
  if (path.length === 0) return items;
  const [head, ...rest] = path;
  return items.map((item, idx) => {
    if (idx !== head) return item;
    if (rest.length === 0) {
      return { ...item, ...patch };
    }
    const currentChildren = getItemChildren(item);
    const updatedChildren = updateNodeAtPath(currentChildren, rest, patch);
    return { ...item, children: updatedChildren, subItems: updatedChildren };
  });
}

/**
 * Immutable addition of a child node at path.
 * Strictly limits addition to depth < 4.
 */
function addChildAtPath(items: NavItem[], path: number[]): NavItem[] {
  if (path.length >= 4) {
    // Strictly forbidden: Max 4 levels (Parent -> Child -> Sub Child -> Grand Sub Child)
    return items;
  }

  if (path.length === 0) {
    // Add top-level item
    const newParent: NavItem = {
      label: 'New Item',
      href: '/',
      categoryId: '',
      isActive: true,
      sortOrder: items.length,
      children: [],
      subItems: [],
    };
    return [...items, newParent];
  }

  const [head, ...rest] = path;
  return items.map((item, idx) => {
    if (idx !== head) return item;
    if (rest.length === 0) {
      const currentChildren = getItemChildren(item);
      const defaultLabel = 'New Item';

      const newChild: NavItem = {
        label: defaultLabel,
        href: '/',
        categoryId: '',
        isActive: true,
        sortOrder: currentChildren.length,
        children: [],
        subItems: [],
      };
      const updatedChildren = [...currentChildren, newChild];
      return { ...item, children: updatedChildren, subItems: updatedChildren };
    }
    const currentChildren = getItemChildren(item);
    const updatedChildren = addChildAtPath(currentChildren, rest);
    return { ...item, children: updatedChildren, subItems: updatedChildren };
  });
}

/**
 * Immutable removal of a node at path
 */
function removeNodeAtPath(items: NavItem[], path: number[]): NavItem[] {
  if (path.length === 0) return items;
  const [head, ...rest] = path;
  if (rest.length === 0) {
    return items.filter((_, idx) => idx !== head);
  }
  return items.map((item, idx) => {
    if (idx !== head) return item;
    const currentChildren = getItemChildren(item);
    const updatedChildren = removeNodeAtPath(currentChildren, rest);
    return { ...item, children: updatedChildren, subItems: updatedChildren };
  });
}

/**
 * Move node up or down among siblings at path
 */
function moveNodeAtPath(items: NavItem[], path: number[], direction: 'up' | 'down'): NavItem[] {
  if (path.length === 0) return items;
  const [head, ...rest] = path;
  if (rest.length === 0) {
    const targetIdx = direction === 'up' ? head - 1 : head + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return items;
    const copy = [...items];
    const temp = copy[head];
    copy[head] = copy[targetIdx];
    copy[targetIdx] = temp;
    // Update sortOrder
    return copy.map((it, i) => ({ ...it, sortOrder: i }));
  }
  return items.map((item, idx) => {
    if (idx !== head) return item;
    const currentChildren = getItemChildren(item);
    const updatedChildren = moveNodeAtPath(currentChildren, rest, direction);
    return { ...item, children: updatedChildren, subItems: updatedChildren };
  });
}

/**
 * Live tree statistics counter
 */
function countTreeLevels(items: NavItem[]) {
  let parents = items.length;
  let children = 0;
  let subChildren = 0;
  let grandSubChildren = 0;

  for (const p of items) {
    const cList = getItemChildren(p);
    children += cList.length;
    for (const c of cList) {
      const scList = getItemChildren(c);
      subChildren += scList.length;
      for (const sc of scList) {
        const gscList = getItemChildren(sc);
        grandSubChildren += gscList.length;
      }
    }
  }

  return {
    parents,
    children,
    subChildren,
    grandSubChildren,
    total: parents + children + subChildren + grandSubChildren,
  };
}

// ─── Visual Indentation Config ────────────────────────────────────────────────
const LEVEL_CONFIG = {
  1: {
    border: 'border-slate-300',
    headerBg: 'bg-slate-50',
    indent: 'ml-0',
    cardShadow: 'shadow-sm',
  },
  2: {
    border: 'border-slate-200',
    headerBg: 'bg-slate-50/60',
    indent: 'ml-4 sm:ml-8',
    cardShadow: '',
  },
  3: {
    border: 'border-slate-200',
    headerBg: 'bg-slate-50/40',
    indent: 'ml-8 sm:ml-16',
    cardShadow: '',
  },
  4: {
    border: 'border-slate-200',
    headerBg: 'bg-slate-50/20',
    indent: 'ml-12 sm:ml-24',
    cardShadow: '',
  },
} as const;

// ─── Recursive Tree Node Component ───────────────────────────────────────────

interface NavNodeEditorProps {
  item: NavItem;
  depth: 1 | 2 | 3 | 4;
  path: number[];
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (path: number[], patch: Partial<NavItem>) => void;
  onAddChild: (path: number[]) => void;
  onRemove: (path: number[]) => void;
  onMove: (path: number[], direction: 'up' | 'down') => void;
  expandedPaths: Set<string>;
  onToggleExpand: (pathStr: string) => void;
}

const NavNodeEditor: React.FC<NavNodeEditorProps> = React.memo(({
  item,
  depth,
  path,
  isFirst,
  isLast,
  onUpdate,
  onAddChild,
  onRemove,
  onMove,
  expandedPaths,
  onToggleExpand,
}) => {
  const pathKey = path.join('-');
  const isExpanded = expandedPaths.has(pathKey);
  const children = getItemChildren(item);
  const cfg = LEVEL_CONFIG[depth];

  return (
    <div className={`relative mb-3 transition-all ${cfg.indent}`}>
      {/* Visual connector line for nested children */}
      {depth > 1 && (
        <div className="absolute -left-4 sm:-left-6 top-6 w-3 sm:w-5 h-[2px] bg-slate-300" />
      )}

      <div
        className={`rounded-2xl border ${cfg.border} overflow-hidden bg-white ${cfg.cardShadow} transition-all hover:border-orange-300`}
      >
        {/* Node Header & Inputs */}
        <div className={`p-3.5 sm:p-4 ${cfg.headerBg} flex flex-col md:flex-row md:items-center gap-3`}>
          {/* Status & Active toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {depth === 4 && (
              <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                Max Depth
              </span>
            )}
            <button
              type="button"
              onClick={() => onUpdate(path, { isActive: !item.isActive })}
              title={item.isActive ? 'Active (Click to disable)' : 'Inactive (Click to enable)'}
              className={`p-1.5 rounded-lg transition ${
                item.isActive
                  ? 'text-green-600 bg-green-50 hover:bg-green-100'
                  : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {item.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Input Fields: Only Title and URL */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Title / Name */}
            <div>
              <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">
                Title <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={item.label}
                onChange={(e) => onUpdate(path, { label: e.target.value })}
                placeholder="Menu item title"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            {/* URL */}
            <div>
              <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">
                URL <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={item.href || ''}
                onChange={(e) => onUpdate(path, { href: e.target.value })}
                placeholder="/collections/..."
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
            {/* Move Up */}
            <button
              type="button"
              disabled={isFirst}
              onClick={() => onMove(path, 'up')}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-black hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Move Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>

            {/* Move Down */}
            <button
              type="button"
              disabled={isLast}
              onClick={() => onMove(path, 'down')}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-black hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Move Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>

            {/* Add Child Button (Strictly depth < 4) */}
            {depth < 4 ? (
              <button
                type="button"
                onClick={() => {
                  onAddChild(path);
                  if (!isExpanded) onToggleExpand(pathKey);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                title="Add Child"
              >
                <Plus className="w-3 h-3" />
                <span className="hidden sm:inline">Add Child</span>
              </button>
            ) : (
              <span
                className="text-[8px] font-bold text-slate-400 italic px-2 py-1 bg-slate-100 rounded-lg select-none"
                title="Grand Sub Child is the maximum nesting level allowed"
              >
                Limit: Grand Child
              </span>
            )}

            {/* Expand / Collapse toggle if has children */}
            {depth < 4 && children.length > 0 && (
              <button
                type="button"
                onClick={() => onToggleExpand(pathKey)}
                className="flex items-center gap-1 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                title={isExpanded ? 'Collapse Children' : 'Expand Children'}
              >
                <span className="text-[9px] font-black px-1">
                  {children.length}
                </span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Delete Node */}
            <button
              type="button"
              onClick={() => {
                if (
                  children.length === 0 ||
                  confirm(`Delete "${item.label}" and its ${children.length} child item(s)?`)
                ) {
                  onRemove(path);
                }
              }}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
              title="Delete this item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Children Sub-Tree */}
        {depth < 4 && children.length > 0 && (
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-slate-100 bg-slate-50/30 p-3 sm:p-4"
              >
                <div className="space-y-2 relative">
                  {/* Vertical branch line */}
                  <div className="absolute left-2 sm:left-4 top-2 bottom-4 w-[1px] bg-slate-200 pointer-events-none" />

                  {children.map((child, cIdx) => (
                    <NavNodeEditor
                      key={child._id || `${pathKey}-${cIdx}`}
                      item={child}
                      depth={(depth + 1) as 2 | 3 | 4}
                      path={[...path, cIdx]}
                      isFirst={cIdx === 0}
                      isLast={cIdx === children.length - 1}
                      onUpdate={onUpdate}
                      onAddChild={onAddChild}
                      onRemove={onRemove}
                      onMove={onMove}
                      expandedPaths={expandedPaths}
                      onToggleExpand={onToggleExpand}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
});

NavNodeEditor.displayName = 'NavNodeEditor';

// ─── Live Header Dropdown Preview Modal ──────────────────────────────────────

interface LivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  menuLabel: string;
}

const LivePreviewModal: React.FC<LivePreviewModalProps> = ({
  isOpen,
  onClose,
  items,
  menuLabel,
}) => {
  const [activeParentIdx, setActiveParentIdx] = useState<number>(0);
  const [activeChildIdx, setActiveChildIdx] = useState<number | null>(null);
  const [activeSubChildIdx, setActiveSubChildIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const activeParents = items.filter((p) => p.isActive);
  const currentParent = activeParents[activeParentIdx] || activeParents[0];
  const currentChildren = currentParent ? getItemChildren(currentParent).filter((c) => c.isActive) : [];
  const currentChild = activeChildIdx !== null ? currentChildren[activeChildIdx] : null;
  const currentSubChildren = currentChild ? getItemChildren(currentChild).filter((sc) => sc.isActive) : [];
  const currentSubChild = activeSubChildIdx !== null ? currentSubChildren[activeSubChildIdx] : null;
  const currentGrandSubChildren = currentSubChild ? getItemChildren(currentSubChild).filter((gsc) => gsc.isActive) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                Interactive Dropdown Preview • {menuLabel}
              </h3>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
              Simulates how customers navigate Parent ➔ Child ➔ Sub Child ➔ Grand Sub Child on the storefront
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-black rounded-xl hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Interactive 4-Tier Flyout Columns */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Level 1: Parent Horizontal Tabs */}
          <div className="mb-6">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Level 1: Parents (Header Top Bar)
            </p>
            <div className="flex flex-wrap gap-2">
              {activeParents.map((parent, pIdx) => {
                const isSelected = activeParentIdx === pIdx;
                const kidsCount = getItemChildren(parent).length;
                return (
                  <button
                    key={pIdx}
                    onClick={() => {
                      setActiveParentIdx(pIdx);
                      setActiveChildIdx(null);
                      setActiveSubChildIdx(null);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-black text-white shadow-lg'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{parent.label}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        isSelected ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {kidsCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nested Columns for Level 2, Level 3, Level 4 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-200 rounded-2xl p-4 bg-slate-50/50 min-h-[320px]">
            {/* Column 1: Sub-items */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                  Sub-Items
                </span>
                <span className="text-[9px] font-bold text-slate-400">
                  {currentChildren.length} items
                </span>
              </div>
              {currentChildren.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8">
                  No items under &ldquo;{currentParent?.label}&rdquo;
                </p>
              ) : (
                <div className="space-y-1">
                  {currentChildren.map((child, cIdx) => {
                    const isSelected = activeChildIdx === cIdx;
                    const scCount = getItemChildren(child).length;
                    return (
                      <div
                        key={cIdx}
                        onClick={() => {
                          setActiveChildIdx(cIdx);
                          setActiveSubChildIdx(null);
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-sm'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="truncate">
                          <span className="truncate">{child.label}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {scCount > 0 && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {scCount}
                            </span>
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Column 2: Nested Items */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                  Nested Items
                </span>
                <span className="text-[9px] font-bold text-slate-400">
                  {currentSubChildren.length} items
                </span>
              </div>
              {!currentChild ? (
                <p className="text-xs text-slate-400 italic text-center py-8">
                  Select an item to view nested sub-items
                </p>
              ) : currentSubChildren.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8">
                  No nested items under &ldquo;{currentChild.label}&rdquo;
                </p>
              ) : (
                <div className="space-y-1">
                  {currentSubChildren.map((subChild, scIdx) => {
                    const isSelected = activeSubChildIdx === scIdx;
                    const gscCount = getItemChildren(subChild).length;
                    return (
                      <div
                        key={scIdx}
                        onClick={() => setActiveSubChildIdx(scIdx)}
                        className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-sm'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="truncate">
                          <span className="truncate">{subChild.label}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {gscCount > 0 && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {gscCount}
                            </span>
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Column 3: Terminal Items */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                  Terminal Links
                </span>
                <span className="text-[9px] font-bold text-slate-400">
                  {currentGrandSubChildren.length} items
                </span>
              </div>
              {!currentSubChild ? (
                <p className="text-xs text-slate-400 italic text-center py-8">
                  Select an item to view terminal links
                </p>
              ) : currentGrandSubChildren.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8">
                  No terminal links under &ldquo;{currentSubChild.label}&rdquo;
                </p>
              ) : (
                <div className="space-y-1">
                  {currentGrandSubChildren.map((grandChild, gscIdx) => (
                    <div
                      key={gscIdx}
                      className="flex items-center justify-between p-2.5 rounded-lg text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200"
                    >
                      <div className="truncate">
                        <span className="truncate">{grandChild.label}</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 truncate max-w-[120px]">
                        {grandChild.href || '/'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400">
            Hierarchy Rule: Strictly capped at 4 levels.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-orange-600 transition"
          >
            Close Preview
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Admin Nav Menu Page Component ──────────────────────────────────────

export default function NavMenuAdminPage() {
  const [menus, setMenus] = useState<NavMenu[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingMenu, setEditingMenu] = useState<NavMenu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [newMenuKey, setNewMenuKey] = useState('');
  const [newMenuLabel, setNewMenuLabel] = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = ++toastId;
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
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
    } catch {
      addToast('error', 'Failed to load menus');
    } finally {
      setIsLoading(false);
    }
  }, [activeMenuId, addToast]);

  useEffect(() => {
    load();
  }, []);

  const selectMenu = (menu: NavMenu) => {
    setActiveMenuId(menu._id!);
    setEditingMenu(JSON.parse(JSON.stringify(menu)));
    setExpandedPaths(new Set());
  };

  // ── Node tree operations ───────────────────────────────────────────────────

  const handleUpdateNode = useCallback((path: number[], patch: Partial<NavItem>) => {
    setEditingMenu((prev) => {
      if (!prev) return prev;
      const updatedItems = updateNodeAtPath(prev.items, path, patch);
      return { ...prev, items: updatedItems };
    });
  }, []);

  const handleAddChild = useCallback((path: number[]) => {
    setEditingMenu((prev) => {
      if (!prev) return prev;
      const updatedItems = addChildAtPath(prev.items, path);
      return { ...prev, items: updatedItems };
    });
  }, []);

  const handleRemoveNode = useCallback((path: number[]) => {
    setEditingMenu((prev) => {
      if (!prev) return prev;
      const updatedItems = removeNodeAtPath(prev.items, path);
      return { ...prev, items: updatedItems };
    });
  }, []);

  const handleMoveNode = useCallback((path: number[], direction: 'up' | 'down') => {
    setEditingMenu((prev) => {
      if (!prev) return prev;
      const updatedItems = moveNodeAtPath(prev.items, path, direction);
      return { ...prev, items: updatedItems };
    });
  }, []);

  const toggleExpand = useCallback((pathStr: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(pathStr)) {
        next.delete(pathStr);
      } else {
        next.add(pathStr);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    if (!editingMenu) return;
    const allPaths = new Set<string>();
    const recurse = (items: NavItem[], prefix: number[]) => {
      items.forEach((it, idx) => {
        const cur = [...prefix, idx];
        allPaths.add(cur.join('-'));
        const kids = getItemChildren(it);
        if (kids.length > 0) recurse(kids, cur);
      });
    };
    recurse(editingMenu.items, []);
    setExpandedPaths(allPaths);
  }, [editingMenu]);

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!editingMenu || !activeMenuId) return;
    setIsSaving(true);
    try {
      const res = await updateNavMenu(activeMenuId, {
        label: editingMenu.label,
        items: editingMenu.items,
        isActive: editingMenu.isActive,
      });
      setMenus((p) => p.map((m) => (m._id === activeMenuId ? res.menu : m)));
      setEditingMenu(JSON.parse(JSON.stringify(res.menu)));
      addToast('success', '4-Tier Navigation Menu saved successfully!');
    } catch {
      addToast('error', 'Save failed. Please ensure items do not exceed 4 levels.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newMenuKey.trim() || !newMenuLabel.trim()) return;
    try {
      const res = await createNavMenu({
        key: newMenuKey.trim(),
        label: newMenuLabel.trim(),
      });
      setMenus((p) => [...p, res.menu]);
      setShowCreateModal(false);
      setNewMenuKey('');
      setNewMenuLabel('');
      selectMenu(res.menu);
      addToast('success', `Menu "${res.menu.label}" created!`);
    } catch (e: any) {
      addToast('error', e?.response?.data?.message || 'Create failed.');
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (menuId: string) => {
    if (!confirm('Delete this menu? This action cannot be undone.')) return;
    try {
      await deleteNavMenu(menuId);
      const remaining = menus.filter((m) => m._id !== menuId);
      setMenus(remaining);
      if (activeMenuId === menuId) {
        if (remaining.length > 0) {
          selectMenu(remaining[0]);
        } else {
          setActiveMenuId(null);
          setEditingMenu(null);
        }
      }
      addToast('success', 'Menu deleted.');
    } catch {
      addToast('error', 'Delete failed.');
    }
  };

  // Live stats computed
  const stats = useMemo(() => {
    return countTreeLevels(editingMenu?.items || []);
  }, [editingMenu?.items]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">
            Nav Menu Builder
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            Manage navigation menus and links
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition text-slate-600"
            title="Refresh menus"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4" /> New Menu
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Menus List */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] px-1 mb-3">
            Available Menus
          </p>
          {menus.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <Navigation className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                No menus yet
              </p>
            </div>
          )}
          {menus.map((menu) => (
            <div
              key={menu._id}
              className={`group relative rounded-2xl border p-4 cursor-pointer transition-all ${
                activeMenuId === menu._id
                  ? 'border-orange-400 bg-orange-50/60 shadow-md ring-2 ring-orange-200'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              onClick={() => selectMenu(menu)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-tight text-slate-900 italic">
                    {menu.label}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 tracking-widest">
                    key: {menu.key}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      menu.isActive ? 'bg-green-500' : 'bg-slate-300'
                    }`}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(menu._id!);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-red-100 rounded-lg text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                <span className="text-[9px] font-bold text-slate-500">
                  {menu.items.length} parents
                </span>
                <span className="text-[9px] font-black text-orange-600 uppercase tracking-wider">
                  Select ➔
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-3">
          {!editingMenu ? (
            <div className="rounded-3xl border border-dashed border-slate-200 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Navigation className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-sm font-black text-slate-300 uppercase tracking-widest italic">
                  Select or create a menu to begin
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Menu Meta Settings */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-black uppercase tracking-widest italic text-slate-900">
                    Menu Properties
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowPreviewModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Preview Dropdown
                    </button>
                    <button
                      onClick={() =>
                        setEditingMenu({ ...editingMenu, isActive: !editingMenu.isActive })
                      }
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        editingMenu.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {editingMenu.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {editingMenu.isActive ? 'Active on Store' : 'Inactive'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                      Menu Label
                    </label>
                    <input
                      value={editingMenu.label}
                      onChange={(e) =>
                        setEditingMenu({ ...editingMenu, label: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                      Menu Key (API Slug)
                    </label>
                    <input
                      readOnly
                      value={editingMenu.key}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-400 cursor-not-allowed outline-none"
                    />
                  </div>
                </div>

                {/* Total count summary */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold">
                    Nested menu structure (up to 4 levels)
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-lg text-slate-700">
                    Total: {stats.total} items
                  </span>
                </div>
              </div>

              {/* Hierarchy Tree Builder */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-widest italic text-slate-900 flex items-center gap-2">
                      <FolderTree className="w-4 h-4 text-orange-600" />
                      Menu Items
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                      Nested navigation menu (up to 4 levels)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={expandAll}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-wider transition"
                    >
                      Expand All
                    </button>
                    <button
                      type="button"
                      onClick={collapseAll}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-wider transition"
                    >
                      Collapse All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddChild([])}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Item
                    </button>
                  </div>
                </div>

                {/* Empty State */}
                {editingMenu.items.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl p-8">
                    <Navigation className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">
                      No Menu Items Yet
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click &ldquo;Add Item&rdquo; to begin building your navigation menu.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAddChild([])}
                      className="mt-4 px-5 py-2.5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-orange-600 transition shadow-md"
                    >
                      + Add First Item
                    </button>
                  </div>
                )}

                {/* Tree Items List */}
                <div className="space-y-4">
                  {editingMenu.items.map((parentItem, pIdx) => (
                    <NavNodeEditor
                      key={parentItem._id || `root-${pIdx}`}
                      item={parentItem}
                      depth={1}
                      path={[pIdx]}
                      isFirst={pIdx === 0}
                      isLast={pIdx === editingMenu.items.length - 1}
                      onUpdate={handleUpdateNode}
                      onAddChild={handleAddChild}
                      onRemove={handleRemoveNode}
                      onMove={handleMoveNode}
                      expandedPaths={expandedPaths}
                      onToggleExpand={toggleExpand}
                    />
                  ))}
                </div>
              </div>

              {/* Bottom Save Action Bar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-300 bg-white text-slate-700 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  Live Storefront Preview
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2.5 px-8 py-3.5 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl disabled:opacity-60"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? 'Saving Changes...' : 'Save Navigation Menu'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create New Menu Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 px-4"
            >
              <div
                className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">
                    Create New Menu
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1.5">
                      Menu Key <span className="text-orange-500">*</span>
                    </label>
                    <input
                      value={newMenuKey}
                      onChange={(e) =>
                        setNewMenuKey(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                      }
                      placeholder="e.g. header, footer-nav"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-orange-500"
                    />
                    <p className="text-[9px] text-slate-400 font-bold mt-1">
                      Unique identifier used to fetch this menu on the storefront.
                    </p>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1.5">
                      Display Label <span className="text-orange-500">*</span>
                    </label>
                    <input
                      value={newMenuLabel}
                      onChange={(e) => setNewMenuLabel(e.target.value)}
                      placeholder="e.g. Header Navigation"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-orange-500"
                    />
                  </div>
                  <button
                    onClick={handleCreate}
                    disabled={!newMenuKey.trim() || !newMenuLabel.trim()}
                    className="w-full py-3.5 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50 mt-2 shadow-lg"
                  >
                    Create Menu
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Live Preview Modal */}
      <LivePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        items={editingMenu?.items || []}
        menuLabel={editingMenu?.label || 'Navigation'}
      />

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[100] space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white text-[11px] font-black uppercase tracking-widest pointer-events-auto ${
                t.type === 'success' ? 'bg-green-600' : 'bg-red-600'
              }`}
            >
              {t.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
