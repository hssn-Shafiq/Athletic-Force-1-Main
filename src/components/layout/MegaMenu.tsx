
import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { X, ChevronRight } from 'lucide-react';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  hierarchy: any[];
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen, onClose, hierarchy }) => {
  // --- Tactical Scroll Lock ---
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Sorting hierarchy to ensure Merchandise and Accessories are prominent
  const sortedHierarchy = [...hierarchy].sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    if (aName.includes('merchandise')) return -1;
    if (bName.includes('merchandise')) return 1;
    if (aName.includes('accessories')) return -1;
    if (bName.includes('accessories')) return 1;
    return 0;
  });

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
        {/* Close Asset */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-8 right-8 z-[80] w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-400 hover:bg-black hover:text-white hover:border-black transition-all shadow-sm group"
        >
          <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Scrollable Intel Area */}
        <div className="flex-1 overflow-y-auto px-8 lg:px-20 py-8 scrollbar-thin scrollbar-track-slate-50 scrollbar-thumb-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600 mb-2 italic flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
                Intelligence Hub
              </h2>
              <p className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">Browse Gear Sectors</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-16">
              {sortedHierarchy.map((category) => (
                <div key={category.id} className="space-y-6 group/category">
                  <div className="category-header flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight group-hover/category:text-orange-600 transition-colors">
                      {category.name}
                    </h3>
                    <Link
                      href={`/shop?collection=${category.slug}`}
                      onClick={onClose}
                      className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-black flex items-center gap-1 transition-colors"
                    >
                      All <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <ul className="space-y-3.5">
                    {category.subcategories.map((sub: any) => (
                      <li key={sub.id}>
                        <Link
                          href={`/collections/${category.slug}/${sub.slug}`}
                          onClick={onClose}
                          className="text-slate-500 hover:text-black font-bold transition-all text-sm uppercase tracking-wide flex items-center gap-2 group/link"
                        >
                          <span className="w-0 h-[2px] bg-orange-600 group-hover/link:w-3 transition-all" />
                          {sub.name}
                          {sub.productCount > 0 && (
                             <span className="text-[9px] font-bold opacity-30 ml-auto group-hover/link:opacity-60 transition-opacity">({sub.productCount})</span>
                          )}
                        </Link>
                      </li>
                    ))}
                    {category.subcategories.length === 0 && (
                      <p className="text-[10px] font-bold text-slate-300 uppercase italic">No sub-sectors identified</p>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tactical Footer */}
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
