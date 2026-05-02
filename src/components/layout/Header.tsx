"use client";
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  ChevronDown,
  X,
  LayoutDashboard
} from 'lucide-react';
import { MegaMenu } from './MegaMenu';
import { CartSidebar } from './CartSidebar';
import { MobileMenuSidebar } from './MobileMenuSidebar';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';

import { getExploreProductsApi } from '@/lib/api/publicProducts';
import { getPublicBlogPostsApi, BlogPost } from '@/lib/api/blog';
import { PublicProduct } from '@/lib/api/types';

interface HeaderProps {
  onHomeClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onHomeClick }) => {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const { isCartOpen, setIsCartOpen, items: cartItems } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { items: wishlistItems } = useWishlist();

  // --- Live Search Command Center ---
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ products: PublicProduct[], blogs: BlogPost[] }>({ products: [], blogs: [] });

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults({ products: [], blogs: [] });
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [prodRes, blogRes] = await Promise.all([
          getExploreProductsApi({ search: searchQuery, pageSize: 6 }),
          getPublicBlogPostsApi({ search: searchQuery, limit: 4 })
        ]);

        setSearchResults({
          products: prodRes.ok ? prodRes.items : [],
          blogs: blogRes.ok ? blogRes.posts : []
        });
      } catch (err) {
        console.error("Search blackout:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchActive(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
        setIsMegaMenuOpen(false);
        setIsMobileMenuOpen(false);
        setIsSearchActive(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);

    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const isAdminUser = Boolean(user?.roles?.some((role) => role !== 'customer'));

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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 sm:h-24  flex items-center justify-between gap-3 sm:gap-6">
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
          <div className="flex-1 max-w-2xl hidden md:flex items-center gap-3 relative" ref={searchRef}>
            <button
              onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
              className={`px-8 py-3.5 flex items-center gap-3 font-bold text-sm rounded-full transition-all ${isMegaMenuOpen
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
            <div className="flex-1 flex items-center px-6 py-3.5 bg-[#F9F9F9] rounded-full border border-slate-100 focus-within:bg-white focus-within:border-slate-300 focus-within:shadow-sm transition-all group">
              <Search className={`w-5 h-5 mr-3 transition-colors ${isSearchActive ? 'text-orange-600' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="Identify gear or intel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchActive(true)}
                className="w-full bg-transparent outline-none text-sm placeholder:text-slate-400 font-medium"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="ml-2 p-1 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>

            <AnimatePresence>
              {isSearchActive && searchQuery.trim().length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="fixed top-[112px] md:top-[128px] left-0 right-0 w-full bg-white/95 backdrop-blur-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border-b border-slate-100 z-[100] overflow-hidden"
                >
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    {isSearching ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-5">
                        <div className="relative w-16 h-16">
                          <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                          <div className="absolute inset-0 border-4 border-t-orange-600 rounded-full animate-spin" />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Scanning Tactical Network...</p>
                      </div>
                    ) : (searchResults.products.length === 0 && searchResults.blogs.length === 0) ? (
                      <div className="text-center py-20">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Search className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-lg font-black italic uppercase text-slate-400 tracking-tight">No Matching Signal Detected</p>
                        <p className="text-xs text-slate-300 uppercase font-bold mt-2 tracking-widest">Adjust your parameters and retry</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-12 gap-12">
                        {/* Products Column */}
                        <div className="col-span-12 lg:col-span-8">
                          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-4 bg-orange-600" />
                              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 italic">Identified Gear ({searchResults.products.length})</h3>
                            </div>
                            <Link href={`/shop?search=${searchQuery}`} onClick={() => setIsSearchActive(false)} className="group flex items-center gap-2 text-[10px] font-black text-orange-600 uppercase tracking-widest italic hover:text-black transition-colors">
                              Full Armory View <ChevronDown className="w-3 h-3 -rotate-90 group-hover:translate-x-1 transition-transform" />
                            </Link>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {searchResults.products.map(product => (
                              <Link
                                key={product.id}
                                href={`/products/${product.slug}`}
                                onClick={() => { setIsSearchActive(false); setSearchQuery(""); }}
                                className="group flex items-center gap-5 p-4 rounded-[24px] hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-black/5"
                              >
                                <div className="w-20 h-20 bg-white rounded-2xl p-2 shrink-0 border border-slate-50 overflow-hidden shadow-sm">
                                  <img src={product.mainImageUrl} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[8px] font-black px-1.5 py-0.5 bg-black text-white uppercase italic rounded">Gear</span>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{product.collections?.[0]?.name || 'Tactical'}</p>
                                  </div>
                                  <h4 className="text-[13px] font-black italic uppercase text-slate-900 truncate group-hover:text-orange-600 transition-colors font-sora mb-1.5">{product.name}</h4>
                                  <div className="flex items-center gap-3">
                                    <p className="text-sm font-black text-slate-900">
                                      ${product.salePrice || product.basePrice}
                                    </p>
                                    {product.regularPrice && product.salePrice && (
                                      <span className="text-[10px] line-through text-slate-300 font-bold">${product.regularPrice}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                                  <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-600/30">
                                    <ChevronDown className="w-4 h-4 -rotate-90" />
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* Blogs Column */}
                        <div className="col-span-12 lg:col-span-4 bg-slate-50/50 rounded-[32px] p-8">
                          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/50">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-4 bg-black" />
                              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 italic">Tactical Intel</h3>
                            </div>
                          </div>

                          <div className="space-y-6">
                            {searchResults.blogs.map(post => (
                              <Link
                                key={post.slug}
                                href={`/blog/${post.slug}`}
                                onClick={() => { setIsSearchActive(false); setSearchQuery(""); }}
                                className="group flex gap-4 items-start"
                              >
                                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                                  <img src={post.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-orange-600 italic">
                                    {typeof post.category === 'object' ? post.category.name : 'JOURNAL'}
                                  </p>
                                  <h4 className="text-xs font-black italic uppercase text-slate-900 leading-tight group-hover:text-orange-600 transition-colors line-clamp-2 font-sora">
                                    {post.title}
                                  </h4>
                                  <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">
                                    <span>{new Date(post.publishedAt || post.createdAt || "").toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>Read Intel</span>
                                  </div>
                                </div>
                              </Link>
                            ))}
                            {searchResults.blogs.length === 0 && (
                              <div className="py-10 text-center">
                                <p className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">No matching intel reports</p>
                              </div>
                            )}
                            <Link href="/blog" onClick={() => setIsSearchActive(false)} className="block w-full py-4 bg-white border border-slate-200 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition-all shadow-sm">
                              Explore Full Journal
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
                  <span className="absolute -top-1 -right-1 bg-[var(--color-accent)] text-white text-[8px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-black border-2 border-white shadow-sm">
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

                    {isAdminUser && (
                      <Link
                        href="/admin"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-orange-600 rounded-xl hover:bg-orange-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}

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
      <div className="md:hidden px-3 sm:px-4 pb-4 bg-white border-b border-slate-100 space-y-3 relative z-[101]">
        <div className="flex items-center border border-slate-100 rounded-full px-5 py-3 bg-[#F9F9F9] focus-within:bg-white focus-within:shadow-sm transition-all">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search for gear or intel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchActive(true)}
            className="bg-transparent text-sm w-full outline-none font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="ml-2">
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Mobile Search Results */}
        <AnimatePresence>
          {isSearchActive && searchQuery.trim().length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute left-0 right-0 top-full mx-3 sm:mx-4 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[102] p-5 max-h-[70vh] overflow-y-auto"
            >
              {isSearching ? (
                <div className="py-10 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-3 border-slate-100 border-t-orange-600 rounded-full animate-spin" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Scanning Gear...</p>
                </div>
              ) : (searchResults.products.length === 0 && searchResults.blogs.length === 0) ? (
                <p className="text-center py-10 text-xs font-black uppercase text-slate-300">No assets detected</p>
              ) : (
                <div className="space-y-6">
                  {/* Mobile Products */}
                  {searchResults.products.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Gear</h3>
                      <div className="space-y-2">
                        {searchResults.products.map(product => (
                          <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            onClick={() => { setIsSearchActive(false); setSearchQuery(""); }}
                            className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100"
                          >
                            <img src={product.mainImageUrl} alt="" className="w-10 h-10 object-contain mix-blend-multiply" />
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase truncate">{product.name}</p>
                              <p className="text-[11px] font-bold text-slate-900">${product.salePrice || product.basePrice}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mobile Blogs */}
                  {searchResults.blogs.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Intel</h3>
                      <div className="space-y-2">
                        {searchResults.blogs.map(post => (
                          <Link
                            key={post.slug}
                            href={`/blog/${post.slug}`}
                            onClick={() => { setIsSearchActive(false); setSearchQuery(""); }}
                            className="block p-3 rounded-xl bg-slate-50 border border-slate-100"
                          >
                            <p className="text-[8px] font-black uppercase text-orange-600 italic mb-1">
                              {typeof post.category === 'object' ? post.category.name : 'JOURNAL'}
                            </p>
                            <h4 className="text-[11px] font-black uppercase italic leading-tight line-clamp-2">{post.title}</h4>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
