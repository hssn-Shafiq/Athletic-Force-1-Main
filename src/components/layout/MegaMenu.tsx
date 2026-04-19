
import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';

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
      "Find Your Team Store", "Bulk Orders"
    ]
  }
};

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[2px]"
      />
      
      {/* Menu Content */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className="absolute top-full left-0 w-full bg-white z-50 shadow-2xl border-t border-slate-100 py-12"
      >
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {Object.entries(MENU_DATA).map(([category, data]) => (
            <div key={category} className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-2">
                {category}
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href={`/collections/${data.categoryId}`}
                    onClick={onClose}
                    className="text-slate-900 hover:text-orange-600 font-black uppercase tracking-wider transition-colors text-xs md:text-sm text-left w-full block"
                  >
                    View All {category}
                  </Link>
                </li>
                {data.items.map((item) => (
                  <li key={item}>
                    <button 
                      className="text-slate-500 hover:text-orange-600 font-medium transition-colors text-sm md:text-base text-left w-full"
                      onClick={onClose}
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
};
