"use client";
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingCart, Heart, User, Menu, ChevronDown, X } from 'lucide-react';
import { MegaMenu } from './MegaMenu';
import { CartSidebar } from './CartSidebar';
import { MobileMenuSidebar } from './MobileMenuSidebar';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';

interface HeaderProps {
  onHomeClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onHomeClick }) => {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { items: cartItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const isAdminUser = Boolean(user?.roles?.some((role) => role === 'admin' || role === 'superadmin'));

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
        setIsMegaMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);

    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() ?? 'U';

  async function handleLogout() {
    try {
      await logout();
    } finally {
      setIsProfileMenuOpen(false);
      router.push('/login');
    }
  }

  return (
    <>
      <header className="w-full relative bg-white z-100">
        {/* Announcement Bar */}
        <div className="bg-black text-white text-[10px] md:text-xs py-2 px-3 sm:px-4 flex items-center justify-between gap-2 font-medium">
          <div className="min-w-0 flex-1">
            <span>Get <span className="text-orange-500 font-bold">20% Off</span> on Every Customized Uniform</span>
          </div>
          <div className="hidden sm:flex items-center space-x-4 md:space-x-6 shrink-0">
            <button className="flex items-center uppercase tracking-widest font-bold text-[10px] whitespace-nowrap">
              USD <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
            </button>
            <button className="flex items-center uppercase tracking-widest font-bold text-[10px] whitespace-nowrap">
              ENG <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Main Header */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between gap-3 sm:gap-6">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden inline-flex items-center justify-center h-11 w-11 rounded-xl border border-slate-200 text-slate-800"
            aria-label="Open categories menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo - Refined to match image */}
          <Link
            href="/"
            onClick={(event) => {
              if (onHomeClick) {
                event.preventDefault();
                onHomeClick();
              }
            }}
            className="shrink-0 flex items-center"
          >
            <Image
              src="/main-logo.png"
              alt="Athletic Force 1"
              width={280}
              height={92}
              priority
              className="h-10 sm:h-12 md:h-14 w-auto"
            />
          </Link>

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
          <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-10">
            {!isLoading && isAuthenticated && isAdminUser ? (
              <Link
                href="/admin"
                className="hidden md:inline-flex items-center px-4 py-2.5 rounded-full bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-colors"
              >
                Admin Dashboard
              </Link>
            ) : null}
            <button 
              id="af1-header-cart-trigger"
              onClick={() => setIsCartOpen(true)}
              className="relative flex flex-col items-center group"
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-slate-900 group-hover:scale-110 transition-transform" />
                <span suppressHydrationWarning className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-black border-2 border-white shadow-sm animate-bounce">
                  {cartItems.length}
                </span>
              </div>
              <span className="hidden md:block text-[10px] font-bold mt-1.5 uppercase tracking-widest text-slate-500 group-hover:text-black">Cart</span>
            </button>
            <Link href="/account?tab=wishlist" className="flex flex-col items-center group relative">
              <div className="relative">
                <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-slate-900 group-hover:scale-110 transition-transform" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FF7348] text-white text-[8px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-black border-2 border-white shadow-sm">
                    {wishlistItems.length}
                  </span>
                )}
              </div>
              <span className="hidden md:block text-[10px] font-bold mt-1.5 uppercase tracking-widest text-slate-500 group-hover:text-black">Saved</span>
            </Link>
            <div className="relative" ref={profileMenuRef}>
              {isAuthenticated && !isLoading ? (
                <button
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="flex flex-col items-center group"
                >
                  <div className="hover:bg-slate-100 rounded-full p-1.5 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-sm font-black">
                      {userInitial}
                    </div>
                  </div>
                  <span className="hidden md:block text-[10px] font-bold mt-1.5 uppercase tracking-widest text-slate-500 group-hover:text-black">Profile</span>
                </button>
              ) : (
                <Link href="/login" className="flex flex-col items-center group">
                  <div className="hover:bg-slate-100 rounded-full p-1.5 transition-colors">
                    <User className="w-6 h-6 sm:w-7 sm:h-7 text-slate-900" />
                  </div>
                  <span className="hidden md:block text-[10px] font-bold mt-1.5 uppercase tracking-widest text-slate-500 group-hover:text-black">Profile</span>
                </Link>
              )}

              <AnimatePresence>
                {isProfileMenuOpen && isAuthenticated ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-64 rounded-2xl border border-slate-100 bg-white shadow-xl p-2 z-50"
                  >
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-900 truncate">{user?.name || user?.email}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>

                    <Link
                      href="/account"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="block px-3 py-2 text-sm font-semibold text-slate-700 rounded-xl hover:bg-slate-50"
                    >
                      My Account
                    </Link>
                    <Link
                      href="/account?tab=orders"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="block px-3 py-2 text-sm font-semibold text-slate-700 rounded-xl hover:bg-slate-50"
                    >
                      Check Orders
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="mt-1 w-full text-left px-3 py-2 text-sm font-semibold text-red-600 rounded-xl hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
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
      <MobileMenuSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Mobile Search - Only visible on small screens */}
      <div className="md:hidden px-3 sm:px-4 pb-4 bg-white border-b border-slate-100 space-y-3">
        <div className="flex items-center border border-slate-100 rounded-full px-5 py-3 bg-[#F9F9F9]">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input type="text" placeholder="Search for gear..." className="bg-transparent text-sm w-full outline-none font-medium" />
        </div>
      </div>
    </>
  );
};
