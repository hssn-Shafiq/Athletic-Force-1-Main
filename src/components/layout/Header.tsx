"use client";
import React, { useEffect, useState } from 'react';
import { Search, ShoppingCart, Heart, User, Menu, ChevronDown, X } from 'lucide-react';
import { MegaMenu } from './MegaMenu';
import { CartSidebar } from './CartSidebar';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  onHomeClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onHomeClick }) => {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(() => {
    if (typeof window === 'undefined') return 2;
    const stored = window.localStorage.getItem('af1-cart-count');
    const parsed = stored ? Number.parseInt(stored, 10) : 2;
    return Number.isNaN(parsed) ? 2 : parsed;
  });

  useEffect(() => {
    const onCartAdd = (event: Event) => {
      const customEvent = event as CustomEvent<{ qty?: number }>;
      const qty = Math.max(1, customEvent.detail?.qty ?? 1);

      setCartCount((prev) => {
        const next = prev + qty;
        window.localStorage.setItem('af1-cart-count', String(next));
        return next;
      });
    };

    window.addEventListener('af1:add-to-cart', onCartAdd as EventListener);

    return () => {
      window.removeEventListener('af1:add-to-cart', onCartAdd as EventListener);
    };
  }, []);

  return (
    <>
      <header className="w-full relative bg-white z-100">
        {/* Announcement Bar */}
        <div className="bg-black text-white text-[10px] md:text-xs py-2 px-4 flex justify-between items-center font-medium">
          <div className="flex-1">
            <span>Get <span className="text-orange-500 font-bold">20% Off</span> on Every Customized Uniform</span>
          </div>
          <div className="flex items-center space-x-6">
            <button className="flex items-center uppercase tracking-widest font-bold text-[10px]">
              USD <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
            </button>
            <button className="flex items-center uppercase tracking-widest font-bold text-[10px]">
              ENG <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Main Header */}
        <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between gap-6">
          {/* Logo - Refined to match image */}
          <div 
            className="shrink-0 flex items-center gap-3 cursor-pointer group"
            onClick={onHomeClick}
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-linear-to-tr from-orange-600 to-red-600 rounded-lg blur-sm opacity-0 group-hover:opacity-20 transition-opacity" />
              <div className="flex items-center justify-center bg-black text-white w-14 h-14 rounded-xl rotate-[-5deg] group-hover:rotate-0 transition-transform duration-500">
                <span className="text-3xl font-black italic tracking-tighter">A</span>
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm tracking-[.4em] font-black text-slate-400 uppercase">Athletic</span>
              <span className="text-2xl tracking-tighter font-black italic uppercase text-slate-900">Force 1</span>
            </div>
          </div>

          {/* Search & Categories */}
          <div className="flex-1 max-w-2xl hidden md:flex items-center gap-3">
            <button 
              onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
              className={`px-8 py-3.5 flex items-center gap-3 font-bold text-sm rounded-full transition-all ${
                isMegaMenuOpen 
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" 
                  : "bg-black text-white hover:bg-slate-800"
              }`}
            >
              <AnimatePresence mode="wait">
                {isMegaMenuOpen ? (
                  <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
                    <X className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }}>
                    <Menu className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
              <span className="uppercase tracking-widest">Categories</span>
            </button>
            <div className="flex-1 flex items-center px-6 py-3.5 bg-[#F9F9F9] rounded-full border border-slate-100 focus-within:bg-white focus-within:border-slate-300 focus-within:shadow-sm transition-all">
              <Search className="w-5 h-5 text-slate-400 mr-3" />
              <input 
                type="text" 
                placeholder="Search for gear..." 
                className="w-full bg-transparent outline-none text-sm placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center space-x-4 md:space-x-10">
            <button 
              id="af1-header-cart-trigger"
              onClick={() => setIsCartOpen(true)}
              className="relative flex flex-col items-center group"
            >
              <div className="relative">
                <ShoppingCart className="w-7 h-7 text-slate-900 group-hover:scale-110 transition-transform" />
                <span suppressHydrationWarning className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-black border-2 border-white shadow-sm animate-bounce">
                  {cartCount}
                </span>
              </div>
              <span className="hidden md:block text-[10px] font-bold mt-1.5 uppercase tracking-widest text-slate-500 group-hover:text-black">Cart</span>
            </button>
            <button className="flex flex-col items-center group">
              <Heart className="w-7 h-7 text-slate-900 group-hover:scale-110 transition-transform" />
              <span className="hidden md:block text-[10px] font-bold mt-1.5 uppercase tracking-widest text-slate-500 group-hover:text-black">Saved</span>
            </button>
            <button className="flex flex-col items-center group">
              <div className="hover:bg-slate-100 rounded-full p-1.5 transition-colors">
                <User className="w-7 h-7 text-slate-900" />
              </div>
              <span className="hidden md:block text-[10px] font-bold mt-1.5 uppercase tracking-widest text-slate-500 group-hover:text-black">Profile</span>
            </button>
          </div>
        </div>

        {/* Mega Menu Overlay */}
        <AnimatePresence>
          {isMegaMenuOpen && (
            <MegaMenu isOpen={isMegaMenuOpen} onClose={() => setIsMegaMenuOpen(false)} />
          )}
        </AnimatePresence>
      </header>

      {/* Cart Sidebar Overlay */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Mobile Search - Only visible on small screens */}
      <div className="md:hidden px-4 pb-6 bg-white border-b border-slate-100">
        <div className="flex items-center border border-slate-100 rounded-full px-5 py-3 bg-[#F9F9F9]">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input type="text" placeholder="Search for gear..." className="bg-transparent text-sm w-full outline-none font-medium" />
        </div>
      </div>
    </>
  );
};
