
import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

const MENU_DATA = {
  "Custom Uniforms": {
    categoryId: 'custom-uniforms',
    items: [
      "Football", "Basketball", "7v7 Uniforms", "Soccer",
      "Track & Field", "Coaches", "Cheer", "Wrestling", "Baseball"
    ]
  },
  "Accessories": {
    categoryId: 'accessories',
    items: [
      "Spirit Pack", "Shirts", "Polos", "Hoodies", "Warmups",
      "Compressions", "Shorts", "Socks", "Jackets", "Bags", "Gloves"
    ]
  },
  "Merchandise": {
    categoryId: 'merchandise',
    items: [
      "Towels", "Mouthguards", "Helmet", "Leg Sleeves",
      "Arm Sleeves", "Visors", "Wristband", "Poms",
      "Shoes", "Practice Gear", "Spirit Pack", "Gloves"
    ]
  },
  "Team Store": {
    categoryId: 'team-store',
    items: [
      "Bullard Jr Knights", "Exeter YFC", "Oxnard Knights"
    ]
  }
};

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen, onClose }) => {
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
        {/* Close Asset - Tactical Absolute Position */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-8 right-8 z-[80] w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-400 hover:bg-black hover:text-white hover:border-black transition-all shadow-sm group"
        >
          <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Scrollable Intel Area */}
        <div className="flex-1 overflow-y-auto px-8 lg:px-20 py-5 scrollbar-thin scrollbar-track-slate-50 scrollbar-thumb-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600 mb-2 italic">Intelligence Hub</h2>
              <p className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Browse Gear Sectors</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-16">
              {Object.entries(MENU_DATA).map(([category, data]) => (
                <div key={category} className="space-y-6">
                  <div className="category-header flex items-center justify-between border-b border-slate-100 pb-0">
                    <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">
                      {category}
                    </h3>
                    <Link
                      href={`/collections/${data.categoryId}`}
                      onClick={onClose}
                      className="text-orange-600 text-[10px] font-black uppercase tracking-widest hover:underline"
                    >
                      All
                    </Link>
                  </div>

                  <ul className="space-y-3.5">
                    {data.items.map((item) => {
                      const itemSlug = item.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-').replace(/7v7/g, '7v7');
                      return (
                        <li key={item}>
                          <Link
                            href={`/collections/${data.categoryId}/${itemSlug}`}
                            onClick={onClose}
                            className="text-slate-500 hover:text-black font-bold transition-all text-sm uppercase tracking-wide flex items-center gap-2 group/link"
                          >
                            <span className="w-0 h-[2px] bg-orange-600 group-hover/link:w-3 transition-all" />
                            {item}
                          </Link>
                        </li>
                      );
                    })}
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
