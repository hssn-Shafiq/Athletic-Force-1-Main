"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight } from 'lucide-react';

type MenuSection = {
  categoryId: string;
  items: string[];
};

const MENU_SECTIONS: Record<string, MenuSection> = {
  'Custom Uniforms': {
    categoryId: 'custom-uniforms',
    items: ['Football', 'Basketball', '7v7 Uniforms', 'Soccer', 'Track & Field', 'Coaches', 'Cheer', 'Wrestling', 'Baseball'],
  },
  Accessories: {
    categoryId: 'accessories',
    items: ['Spirit Pack', 'Shirts', 'Polos', 'Hoodies', 'Warmups', 'Compressions', 'Shorts', 'Socks', 'Jackets', 'Bags', 'Gloves'],
  },
  Merchandise: {
    categoryId: 'merchandise',
    items: ['Towels', 'Mouthguards', 'Helmet', 'Leg Sleeves', 'Arm Sleeves', 'Visors', 'Wristband', 'Poms', 'Shoes', 'Practice Gear', 'Spirit Pack', 'Gloves'],
  },
  'Team Store': {
    categoryId: 'team-store',
    items: ['Find Your Team Store', 'Bulk Orders'],
  },
};

interface MobileMenuSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenuSidebar: React.FC<MobileMenuSidebarProps> = ({ isOpen, onClose }) => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const categoryEntries = useMemo(() => Object.entries(MENU_SECTIONS), []);

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
            className="fixed inset-0 z-[130] bg-black/40"
          />

          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed inset-y-0 left-0 z-[140] w-[90vw] max-w-sm bg-white border-r border-slate-200 overflow-y-auto"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-800">Menu</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="p-2 text-slate-700 hover:text-black"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            <div className="divide-y divide-slate-200 border-b border-slate-200">
              <Link
                href="/"
                onClick={onClose}
                className="block px-6 py-4 text-[17px] font-bold uppercase tracking-tight text-slate-800"
              >
                Home
              </Link>

              {categoryEntries.map(([title, section]) => {
                const expanded = openSection === title;

                return (
                  <div key={title}>
                    <button
                      type="button"
                      onClick={() => setOpenSection(expanded ? null : title)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left"
                    >
                      <span className="text-[17px] font-bold uppercase tracking-tight text-slate-800">{title}</span>
                      <ChevronRight className={`w-5 h-5 text-slate-800 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                    </button>

                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-3 space-y-1">
                            <Link
                              href={`/collections/${section.categoryId}`}
                              onClick={onClose}
                              className="block py-1.5 text-xs font-bold uppercase tracking-wider text-slate-900"
                            >
                              View All {title}
                            </Link>
                            {section.items.map((item) => (
                              <button
                                key={item}
                                type="button"
                                onClick={onClose}
                                className="block w-full text-left py-1 text-xs font-medium text-slate-600"
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              <Link
                href="/request-order-form"
                onClick={onClose}
                className="block px-6 py-4 text-[17px] font-bold uppercase tracking-tight text-slate-800"
              >
                Custom Request Form
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
