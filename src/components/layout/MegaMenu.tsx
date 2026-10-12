"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronDown } from 'lucide-react';
import { fetchPublicNavMenu } from '@/lib/api/navMenu';
import { getPublicVendorStoresApi } from '@/lib/api/publicVendorStores';
import type { NavMenu, NavItem } from '@/lib/api/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getItemChildren(item: any): NavItem[] {
  if (Array.isArray(item.children) && item.children.length > 0) return item.children;
  if (Array.isArray(item.subItems) && item.subItems.length > 0) return item.subItems;
  return [];
}

// ─── Static fallback (used if the API has no menu yet) ───────────────────────
const FALLBACK_MENU: NavMenu = {
  key: 'header',
  label: 'Header',
  isActive: true,
  items: [
    {
      label: 'Custom Uniforms',
      categoryId: 'custom-uniforms',
      isActive: true,
      sortOrder: 0,
      children: [
        { label: 'Football', href: '/collections/custom-uniforms/football', isActive: true, sortOrder: 0, children: [] },
        { label: 'Basketball', href: '/collections/custom-uniforms/basketball', isActive: true, sortOrder: 1, children: [] },
        { label: '7v7 Uniforms', href: '/collections/custom-uniforms/7v7-uniforms', isActive: true, sortOrder: 2, children: [] },
        { label: 'Soccer', href: '/collections/custom-uniforms/soccer', isActive: true, sortOrder: 3, children: [] },
        { label: 'Track & Field', href: '/collections/custom-uniforms/track-field', isActive: true, sortOrder: 4, children: [] },
        { label: 'Coaches', href: '/collections/custom-uniforms/coaches', isActive: true, sortOrder: 5, children: [] },
        { label: 'Cheer', href: '/collections/custom-uniforms/cheer', isActive: true, sortOrder: 6, children: [] },
        { label: 'Wrestling', href: '/collections/custom-uniforms/wrestling', isActive: true, sortOrder: 7, children: [] },
        { label: 'Baseball', href: '/collections/custom-uniforms/baseball', isActive: true, sortOrder: 8, children: [] },
      ],
    },
    {
      label: 'Accessories',
      categoryId: 'accessories',
      isActive: true,
      sortOrder: 1,
      children: [
        { label: 'Spirit Pack', href: '/collections/accessories/spirit-pack', isActive: true, sortOrder: 0, children: [] },
        { label: 'Shirts', href: '/collections/accessories/shirts', isActive: true, sortOrder: 1, children: [] },
        { label: 'Polos', href: '/collections/accessories/polos', isActive: true, sortOrder: 2, children: [] },
        { label: 'Hoodies', href: '/collections/accessories/hoodies', isActive: true, sortOrder: 3, children: [] },
        { label: 'Warmups', href: '/collections/accessories/warmups', isActive: true, sortOrder: 4, children: [] },
        { label: 'Compressions', href: '/collections/accessories/compressions', isActive: true, sortOrder: 5, children: [] },
        { label: 'Shorts', href: '/collections/accessories/shorts', isActive: true, sortOrder: 6, children: [] },
        { label: 'Socks', href: '/collections/accessories/socks', isActive: true, sortOrder: 7, children: [] },
      ],
    },
    {
      label: 'Merchandise',
      categoryId: 'merchandise',
      isActive: true,
      sortOrder: 2,
      children: [
        { label: 'Towels', href: '/collections/merchandise/towels', isActive: true, sortOrder: 0, children: [] },
        { label: 'Mouthguards', href: '/collections/merchandise/mouthguards', isActive: true, sortOrder: 1, children: [] },
        { label: 'Helmet', href: '/collections/merchandise/helmet', isActive: true, sortOrder: 2, children: [] },
        { label: 'Leg Sleeves', href: '/collections/merchandise/leg-sleeves', isActive: true, sortOrder: 3, children: [] },
        { label: 'Arm Sleeves', href: '/collections/merchandise/arm-sleeves', isActive: true, sortOrder: 4, children: [] },
        { label: 'Gloves', href: '/collections/merchandise/gloves', isActive: true, sortOrder: 5, children: [] },
      ],
    },
    {
      label: 'Team Store',
      categoryId: 'team-store',
      isActive: true,
      sortOrder: 3,
      children: [
        { label: 'Bullard Jr Knights', href: '/team/bullard-jr-knights', isActive: true, sortOrder: 0, children: [] },
        { label: 'Exeter YFC', href: '/team/exeter-yfc', isActive: true, sortOrder: 1, children: [] },
        { label: 'Oxnard Knights', href: '/team/oxnard-knights', isActive: true, sortOrder: 2, children: [] },
      ],
    },
  ],
};

// ─── Module-Level Cache (survives component unmounts) ────────────────────────
// This ensures the menu is fetched only ONCE per browser session,
// regardless of how many times MegaMenu mounts/unmounts.
let _menuCache: NavMenu | null = null;
let _menuPromise: Promise<NavMenu> | null = null;

async function fetchHeaderMenu(): Promise<NavMenu> {
  // Return cached data immediately if available
  if (_menuCache) return _menuCache;

  // Return the in-flight promise if a fetch is already running
  if (_menuPromise) return _menuPromise;

  _menuPromise = (async () => {
    try {
      const [navRes, vendorRes] = await Promise.allSettled([
        fetchPublicNavMenu('header'),
        getPublicVendorStoresApi(),
      ]);

      let baseMenu: NavMenu = FALLBACK_MENU;
      if (navRes.status === 'fulfilled' && navRes.value.ok && navRes.value.menu && navRes.value.menu.items.length > 0) {
        baseMenu = navRes.value.menu;
      }

      const approvedStores = vendorRes.status === 'fulfilled' && vendorRes.value.ok ? vendorRes.value.stores : [];

      if (approvedStores.length > 0) {
        const updatedItems = baseMenu.items.map((item) => {
          if (item.categoryId === 'team-store' || item.label.toLowerCase() === 'team store') {
            const existingChildren = getItemChildren(item);

            const dynamicStores: NavItem[] = approvedStores.map((store, index) => ({
              label: store.storeName,
              href: `/team/${store.slug}`,
              isActive: true,
              sortOrder: existingChildren.length + index,
              children: [],
            }));

            const seenHrefs = new Set(existingChildren.map((s) => (s.href || '').toLowerCase()));
            const uniqueStores = dynamicStores.filter((s) => !seenHrefs.has((s.href || '').toLowerCase()));

            const mergedChildren = [...existingChildren, ...uniqueStores];
            return {
              ...item,
              children: mergedChildren,
              subItems: mergedChildren,
            };
          }
          return item;
        });

        baseMenu = { ...baseMenu, items: updatedItems };
      }

      _menuCache = baseMenu;
      return baseMenu;
    } catch {
      _menuCache = FALLBACK_MENU;
      return FALLBACK_MENU;
    } finally {
      // Clear the in-flight promise so errors can be retried
      _menuPromise = null;
    }
  })();

  return _menuPromise;
}

/** Call this once on app mount to pre-warm the cache before the user opens the menu */
export function prefetchHeaderMenu(): void {
  if (!_menuCache && !_menuPromise) {
    fetchHeaderMenu();
  }
}

// ─── Interactive Multi-Tier Dropdown Item Components ──────────────────────────

interface SubChildItemProps {
  subChild: NavItem;
  onClose: () => void;
}

/**
 * Level 3 (Sub Child) Item with optional Level 4 (Grand Sub Child) dropdown
 */
const SubChildItem: React.FC<SubChildItemProps> = ({ subChild, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const grandChildren = getItemChildren(subChild).filter((g) => g.isActive);
  const hasGrandChildren = grandChildren.length > 0;
  const href = subChild.href || '#';

  return (
    <div className="space-y-0.5">
      {/* Level 3 row — orange dash on hover */}
      <div className="group/sub flex items-center gap-2 py-1 transition-all">
        {/* Orange dash indicator */}
        <span className="block w-4 h-[2px] bg-orange-500 shrink-0 scale-x-0 group-hover/sub:scale-x-100 origin-left transition-transform duration-200" />
        <div className="flex items-center justify-between flex-1 min-w-0">
          <Link
            href={href}
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 group-hover/sub:text-black group-hover/sub:font-black transition-all uppercase tracking-tight truncate"
          >
            {subChild.label}
          </Link>

          {hasGrandChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen((prev) => !prev);
              }}
              className="p-1 text-slate-400 group-hover/sub:text-black transition shrink-0"
              title="Toggle submenu"
            >
              <ChevronDown
                className={`w-3 h-3 transition-transform ${
                  isOpen ? 'rotate-180 text-orange-600' : ''
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Level 4: Grand Sub Children dropdown */}
      {hasGrandChildren && (
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden pl-6 pr-1 py-1 space-y-0.5"
            >
              {grandChildren.map((gc) => (
                <div key={gc._id || gc.label} className="group/grand flex items-center gap-2 py-0.5 transition-all">
                  <span className="block w-3 h-[2px] bg-orange-400 shrink-0 scale-x-0 group-hover/grand:scale-x-100 origin-left transition-transform duration-150" />
                  <Link
                    href={gc.href || '#'}
                    onClick={onClose}
                    className="text-[11px] font-medium text-slate-400 group-hover/grand:text-black group-hover/grand:font-bold transition-all uppercase tracking-tight truncate"
                  >
                    {gc.label}
                  </Link>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

interface ChildDropdownItemProps {
  child: NavItem;
  onClose: () => void;
}

/**
 * Level 2 (Child) Item with dropdown for Level 3 & Level 4 children
 */
const ChildDropdownItem: React.FC<ChildDropdownItemProps> = ({ child, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const subChildren = getItemChildren(child).filter((sc) => sc.isActive);
  const hasSubChildren = subChildren.length > 0;
  const href = child.href || '#';

  return (
    <div className="space-y-1">
      {/* Level 2 Child Row — orange dash on hover */}
      <div className="group/child flex items-center gap-3 py-1.5 transition-all">
        {/* Orange dash indicator */}
        <span className="block w-5 h-[2.5px] bg-orange-500 shrink-0 scale-x-0 group-hover/child:scale-x-100 origin-left transition-transform duration-200" />
        <div className="flex items-center justify-between flex-1 min-w-0">
          <Link
            href={href}
            onClick={onClose}
            className="text-slate-600 group-hover/child:text-black font-bold group-hover/child:font-black transition-all text-sm uppercase tracking-wide truncate"
          >
            {child.label}
          </Link>

          {hasSubChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen((prev) => !prev);
              }}
              className="p-1 text-slate-400 group-hover/child:text-black transition shrink-0 ml-1"
              title="Toggle submenu"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-orange-600' : ''
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Level 3 Sub Children Dropdown */}
      {hasSubChildren && (
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden pl-3 pr-1 py-1 space-y-0.5 border-l border-slate-200 ml-2"
            >
              {subChildren.map((subChild) => (
                <SubChildItem
                  key={subChild._id || subChild.label}
                  subChild={subChild}
                  onClose={onClose}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

// ─── MegaMenu Main Component ──────────────────────────────────────────────────

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  hierarchy?: any[];
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen, onClose }) => {
  const [menu, setMenu] = useState<NavMenu | null>(_menuCache);

  // Fetch data — uses module-level cache so only one network request ever fires
  useEffect(() => {
    if (menu) return; // Already have data (from cache or previous fetch)
    fetchHeaderMenu().then(setMenu);
  }, [menu]);

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Show skeleton while data is loading (only on very first visit before cache is warm)
  const isLoading = !menu;
  const activeItems: NavItem[] = (menu ?? FALLBACK_MENU).items
    .filter((it) => it.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-[4px]"
      />

      {/* Menu Overlay Content */}
      <motion.div
        initial={{ y: '-100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '-100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 left-0 w-full h-fit max-h-[92vh] bg-white z-[70] shadow-[0_25px_60px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden rounded-b-[40px]"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-8 right-8 z-[80] w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-400 hover:bg-black hover:text-white hover:border-black transition-all shadow-sm group"
        >
          <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-12 lg:px-20 py-8 scrollbar-thin scrollbar-track-slate-50 scrollbar-thumb-slate-200">
          <div className="max-w-7xl mx-auto">
            {/* Header Title */}
            <div className="mb-8">
              <p className="text-3xl sm:text-4xl font-black text-slate-900 italic uppercase tracking-tighter">
                Browse Gear Sectors
              </p>
            </div>

            {/* Grid of Categories (Level 1: Parents) */}
            {isLoading ? (
              // Skeleton loader — shown only on very first load before cache is warm
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-12">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-4 animate-pulse">
                    <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2">
                      <div className="h-5 bg-slate-200 rounded w-2/3" />
                      <div className="h-3 bg-slate-100 rounded w-6" />
                    </div>
                    <div className="space-y-2">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className="h-4 bg-slate-100 rounded w-full" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-12">
                {activeItems.map((item) => {
                  const allHref = item.href || (item.categoryId ? `/collections/${item.categoryId}` : '#');

                  const activeChildren = getItemChildren(item)
                    .filter((c) => c.isActive)
                    .sort((a, b) => a.sortOrder - b.sortOrder);

                  return (
                    <div key={item._id || item.label} className="space-y-4">
                      {/* Level 1: Parent Header */}
                      <div className="category-header flex items-center justify-between border-b-2 border-slate-100 pb-2">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase italic tracking-tight">
                          {item.label}
                        </h3>
                        <Link
                          href={allHref}
                          onClick={onClose}
                          className="text-orange-600 text-[10px] font-black uppercase tracking-widest hover:underline"
                        >
                          All
                        </Link>
                      </div>

                      {/* Level 2: Children List with Dropdown Accordion */}
                      <div className="space-y-1">
                        {activeChildren.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-2">
                            No sub-categories listed
                          </p>
                        ) : (
                          activeChildren.map((child) => (
                            <ChildDropdownItem
                              key={child._id || child.label}
                              child={child}
                              onClose={onClose}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Athletic Force 1 Tactical Gear
          </p>
        </div>
      </motion.div>
    </>
  );
};
