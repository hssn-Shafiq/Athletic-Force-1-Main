"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { fetchPublicNavMenu } from '@/lib/api/navMenu';
import type { NavMenu, NavMenuItem } from '@/lib/api/types';

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
      subItems: [
        { label: 'Football', href: '/collections/custom-uniforms/football', isActive: true, sortOrder: 0 },
        { label: 'Basketball', href: '/collections/custom-uniforms/basketball', isActive: true, sortOrder: 1 },
        { label: '7v7 Uniforms', href: '/collections/custom-uniforms/7v7-uniforms', isActive: true, sortOrder: 2 },
        { label: 'Soccer', href: '/collections/custom-uniforms/soccer', isActive: true, sortOrder: 3 },
        { label: 'Track & Field', href: '/collections/custom-uniforms/track-field', isActive: true, sortOrder: 4 },
        { label: 'Coaches', href: '/collections/custom-uniforms/coaches', isActive: true, sortOrder: 5 },
        { label: 'Cheer', href: '/collections/custom-uniforms/cheer', isActive: true, sortOrder: 6 },
        { label: 'Wrestling', href: '/collections/custom-uniforms/wrestling', isActive: true, sortOrder: 7 },
        { label: 'Baseball', href: '/collections/custom-uniforms/baseball', isActive: true, sortOrder: 8 },
      ],
    },
    {
      label: 'Accessories',
      categoryId: 'accessories',
      isActive: true,
      sortOrder: 1,
      subItems: [
        { label: 'Spirit Pack', href: '/collections/accessories/spirit-pack', isActive: true, sortOrder: 0 },
        { label: 'Shirts', href: '/collections/accessories/shirts', isActive: true, sortOrder: 1 },
        { label: 'Polos', href: '/collections/accessories/polos', isActive: true, sortOrder: 2 },
        { label: 'Hoodies', href: '/collections/accessories/hoodies', isActive: true, sortOrder: 3 },
        { label: 'Warmups', href: '/collections/accessories/warmups', isActive: true, sortOrder: 4 },
        { label: 'Compressions', href: '/collections/accessories/compressions', isActive: true, sortOrder: 5 },
        { label: 'Shorts', href: '/collections/accessories/shorts', isActive: true, sortOrder: 6 },
        { label: 'Socks', href: '/collections/accessories/socks', isActive: true, sortOrder: 7 },
      ],
    },
    {
      label: 'Merchandise',
      categoryId: 'merchandise',
      isActive: true,
      sortOrder: 2,
      subItems: [
        { label: 'Towels', href: '/collections/merchandise/towels', isActive: true, sortOrder: 0 },
        { label: 'Mouthguards', href: '/collections/merchandise/mouthguards', isActive: true, sortOrder: 1 },
        { label: 'Helmet', href: '/collections/merchandise/helmet', isActive: true, sortOrder: 2 },
        { label: 'Leg Sleeves', href: '/collections/merchandise/leg-sleeves', isActive: true, sortOrder: 3 },
        { label: 'Arm Sleeves', href: '/collections/merchandise/arm-sleeves', isActive: true, sortOrder: 4 },
        { label: 'Gloves', href: '/collections/merchandise/gloves', isActive: true, sortOrder: 5 },
      ],
    },
    {
      label: 'Team Store',
      categoryId: 'team-store',
      isActive: true,
      sortOrder: 3,
      subItems: [
        { label: 'Bullard Jr Knights', href: '/team/bullard-jr-knights', isActive: true, sortOrder: 0 },
        { label: 'Exeter YFC', href: '/team/exeter-yfc', isActive: true, sortOrder: 1 },
        { label: 'Oxnard Knights', href: '/team/oxnard-knights', isActive: true, sortOrder: 2 },
      ],
    },
  ],
};

// ─── Separate async fetch function ───────────────────────────────────────────
async function fetchHeaderMenu(): Promise<NavMenu> {
  try {
    const res = await fetchPublicNavMenu('header');
    if (res.ok && res.menu && res.menu.items.length > 0) {
      return res.menu;
    }
    return FALLBACK_MENU;
  } catch {
    return FALLBACK_MENU;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  hierarchy: any[];
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen, onClose }) => {
  const [menu, setMenu] = useState<NavMenu | null>(null);

  // Fetch on first open
  useEffect(() => {
    if (!isOpen || menu) return;
    fetchHeaderMenu().then(setMenu);
  }, [isOpen]);

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const activeItems: NavMenuItem[] = (menu ?? FALLBACK_MENU).items
    .filter(it => it.isActive)
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

      {/* Menu Content */}
      <motion.div
        initial={{ y: '-100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '-100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 left-0 w-full h-fit max-h-[90vh] bg-white z-[70] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden rounded-b-[40px]"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-8 right-8 z-[80] w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-400 hover:bg-black hover:text-white hover:border-black transition-all shadow-sm group"
        >
          <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-8 lg:px-20 py-5 scrollbar-thin scrollbar-track-slate-50 scrollbar-thumb-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600 mb-2 italic flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
                Intelligence Hub
              </h2>
              <p className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">Browse Gear Sectors</p>
            </div>

            {/* Grid of categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-16">
              {activeItems.map((item) => {
                const allHref = item.categoryId
                  ? `/collections/${item.categoryId}`
                  : item.href || '#';

                const activeSubItems = item.subItems
                  .filter(s => s.isActive)
                  .sort((a, b) => a.sortOrder - b.sortOrder);

                return (
                  <div key={item._id || item.label} className="space-y-6">
                    <div className="category-header flex items-center justify-between border-b border-slate-100 pb-0">
                      <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">
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

                    <ul className="space-y-3.5">
                      {activeSubItems.map((sub) => (
                        <li key={sub._id || sub.label}>
                          <Link
                            href={sub.href}
                            onClick={onClose}
                            className="text-slate-500 hover:text-black font-bold transition-all text-sm uppercase tracking-wide flex items-center gap-2 group/link"
                          >
                            <span className="w-0 h-[2px] bg-orange-600 group-hover/link:w-3 transition-all" />
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-center gap-12">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">System Active: 24/7 Operations</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200" />
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Athletic Force 1 Tactical Gear</p>
        </div>
      </motion.div>
    </>
  );
};
