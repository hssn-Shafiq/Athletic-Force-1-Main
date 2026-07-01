
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronDown } from 'lucide-react';

interface MobileMenuSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  hierarchy: any[];
}

export const MobileMenuSidebar: React.FC<MobileMenuSidebarProps> = ({ isOpen, onClose, hierarchy }) => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onEscape);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[130] bg-black/40 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed inset-y-0 left-0 z-[140] w-[85vw] max-w-sm bg-white border-r border-slate-200 overflow-y-auto rounded-r-[32px] shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100">
              <div className="flex flex-col">
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Tactical Menu</h2>
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mt-0.5">Navigation Hub</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-800 hover:bg-black hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 px-2 py-4">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-4 text-sm font-black uppercase italic tracking-widest text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                Home Base
              </Link>

              {hierarchy.map((category) => {
                const expanded = openSection === category.id;

                return (
                  <div key={category.id} className="py-1">
                    <button
                      type="button"
                      onClick={() => setOpenSection(expanded ? null : category.id)}
                      className={`w-full px-4 py-4 flex items-center justify-between text-left rounded-2xl transition-all ${expanded ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full transition-all ${expanded ? 'bg-orange-600 animate-pulse' : 'bg-slate-200'}`} />
                        <span className={`text-sm font-black uppercase italic tracking-widest ${expanded ? 'text-orange-600' : 'text-slate-900'}`}>{category.name}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180 text-orange-600' : ''}`} />
                    </button>

                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-8 pb-4 pt-2 space-y-2">
                             <Link
                                href={`/shop?collection=${category.slug}`}
                                onClick={onClose}
                                className="block py-2 text-[11px] font-black text-slate-400 hover:text-black transition-colors uppercase tracking-[0.2em] italic flex items-center justify-between"
                              >
                                View All {category.name} <ChevronRight className="w-3 h-3" />
                              </Link>
                            {category.subcategories.map((sub: any) => (
                              <Link
                                key={sub.id}
                                href={`/collections/${category.slug}/${sub.slug}`}
                                onClick={onClose}
                                className="block w-full text-left py-2.5 text-[12px] font-bold text-slate-600 hover:text-orange-600 transition-colors uppercase tracking-tight flex items-center gap-3"
                              >
                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                {sub.name}
                                {sub.productCount > 0 && (
                                  <span className="text-[10px] font-black text-slate-300 ml-auto">{sub.productCount}</span>
                                )}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              <div className="pt-4 space-y-2">
                <Link
                  href="/shop"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-4 text-sm font-black uppercase italic tracking-widest text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-black" />
                  Full Armory
                </Link>
                <Link
                  href="/request-order-form"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-4 text-sm font-black uppercase italic tracking-widest text-orange-600 bg-orange-50 rounded-2xl transition-all"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                  Custom Uniform Request
                </Link>
              </div>
            </div>

            <div className="mt-auto p-8 bg-slate-50/50">
               <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 italic text-center leading-loose">
                  Athletic Force 1<br/>Tactical Support Unit
               </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
