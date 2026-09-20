"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Package,
  Boxes,
  PlusCircle,
  ShoppingBag,
  Store,
  Settings as SettingsIcon,
  Star,
  DollarSign,
  TrendingUp,
  KeyRound,
  ChevronDown,
  ExternalLink,
  Menu,
  X,
  LogOut,
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
  User,
  ShieldCheck,
  Warehouse,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getVendorStoreProfileApi, type VendorStoreProfile } from '@/lib/api/vendorDashboard';

interface NavItem {
  label: string;
  href?: string;
  icon: any;
  badge?: string | number;
  subItems?: { label: string; href: string; icon?: any }[];
}

export const VendorLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const [store, setStore] = useState<VendorStoreProfile | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [storeError, setStoreError] = useState<string | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    Product: true,
    Store: true,
  });

  // Fetch Vendor Store details once when authenticated (do not re-trigger on route changes)
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    // If store is already loaded in state, don't re-fetch on navigation
    if (store) return;

    let isMounted = true;
    async function checkStore() {
      setStoreLoading(true);
      try {
        const res = await getVendorStoreProfileApi();
        if (isMounted) {
          if (res?.ok && res.store) {
            setStore(res.store);
            setStoreError(null);
          } else {
            setStoreError('No approved vendor store found');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setStoreError(err?.response?.data?.message || 'Access clearance required');
        }
      } finally {
        if (isMounted) setStoreLoading(false);
      }
    }

    checkStore();
    return () => {
      isMounted = false;
    };
  }, [isLoading, isAuthenticated, router, store]);

  // Auto-expand active submenu
  useEffect(() => {
    if (pathname.startsWith('/vendor/products')) {
      setOpenSubMenus((prev) => ({ ...prev, Product: true }));
    }
    if (pathname.startsWith('/vendor/store')) {
      setOpenSubMenus((prev) => ({ ...prev, Store: true }));
    }
  }, [pathname]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleSubMenu = (key: string) => {
    setOpenSubMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/vendor/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Product',
      icon: Package,
      subItems: [
        { label: 'All products', href: '/vendor/products', icon: Boxes },
        { label: 'Add product', href: '/vendor/products/add', icon: PlusCircle },
        { label: 'Inventory', href: '/vendor/products/inventory', icon: Warehouse },
      ],
    },
    {
      label: 'Order',
      href: '/vendor/orders',
      icon: ShoppingBag,
    },
    {
      label: 'Store',
      icon: Store,
      subItems: [
        { label: 'Store profile', href: '/vendor/store/profile', icon: Store },
        { label: 'Store setting', href: '/vendor/store/settings', icon: SettingsIcon },
      ],
    },
    {
      label: 'Reviews',
      href: '/vendor/reviews',
      icon: Star,
    },
    {
      label: 'Earnings',
      href: '/vendor/earnings',
      icon: DollarSign,
    },
    {
      label: 'Analytics',
      href: '/vendor/analytics',
      icon: TrendingUp,
    },
    {
      label: 'Setting',
      href: '/vendor/settings',
      icon: KeyRound,
    },
  ];

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading || storeLoading) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-3xl border-2 border-orange-500/20 border-t-[#FF7348] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Store className="w-6 h-6 text-[#FF7348] animate-pulse" />
          </div>
        </div>
        <h2 className="text-xl font-black italic uppercase tracking-wider text-white">
          Initializing Vendor Terminal
        </h2>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-2">
          Verifying Merchant Credentials &amp; Store Permissions...
        </p>
      </div>
    );
  }

  // ── No Approved Store / Error State ───────────────────────────────────────
  if (!store || storeError) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#181B21] border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl space-y-6 text-center"
        >
          <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto text-[#FF7348]">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">
              Vendor Clearance Required
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              You must have an approved Athletic Force 1 Vendor Store to access this terminal.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/register-your-store"
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#FF7348] hover:bg-[#ff8660] text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" /> Check Application / Register Store
            </Link>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold uppercase tracking-widest text-xs rounded-xl border border-white/5 transition-colors"
            >
              Return to HQ
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const teamStoreUrl = `/team/${store.teamStoreSlug || store.collectionSlugs?.[0] || 'store'}`;

  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-100 flex antialiased selection:bg-[#FF7348] selection:text-black">
      {/* ── Sidebar (Fixed & Scrollable) ─────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-[#12151B] border-r border-white/10 flex flex-col h-screen transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Store Identity Box */}
        <div className="p-4 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between mb-3 lg:hidden">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF7348] italic">
              Menu
            </span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/15 overflow-hidden flex items-center justify-center shrink-0">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.storeName} className="w-full h-full object-contain p-1" />
              ) : (
                <Store className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-black italic tracking-tight text-white truncate">
                  {store.storeName}
                </h3>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </div>
              {store.productNamePrefix && (
                <p className="text-[10px] font-bold text-[#FF7348] uppercase tracking-wider truncate">
                  Prefix: {store.productNamePrefix}
                </p>
              )}
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">
                {store.vendorName}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links - Scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasSub = Boolean(item.subItems && item.subItems.length > 0);
            const isSubActive = hasSub && item.subItems?.some((s) => pathname === s.href);
            const isDirectActive = item.href ? pathname === item.href : false;
            const isActive = isDirectActive || isSubActive;
            const isExpanded = openSubMenus[item.label] ?? false;

            if (hasSub) {
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => toggleSubMenu(item.label)}
                    className={`
                      w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold uppercase tracking-widest text-xs italic transition-all group
                      ${
                        isActive
                          ? 'bg-[#FF7348]/15 text-[#FF7348] border border-[#FF7348]/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF7348]' : 'text-slate-400 group-hover:text-white'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-white' : 'text-slate-500'}`}
                    />
                  </button>

                  {/* Submenu links */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-7 pr-2 space-y-1 overflow-hidden"
                      >
                        {item.subItems?.map((sub) => {
                          const isSubLinkActive = pathname === sub.href;
                          const SubIcon = sub.icon;
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={`
                                flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all
                                ${
                                  isSubLinkActive
                                    ? 'bg-white/10 text-white font-black'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }
                              `}
                            >
                              {SubIcon && <SubIcon className="w-3.5 h-3.5 opacity-70" />}
                              <span>{sub.label}</span>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href || '#'}
                className={`
                  flex items-center justify-between px-3.5 py-3 rounded-xl font-bold uppercase tracking-widest text-xs italic transition-all group
                  ${
                    isActive
                      ? 'bg-[#FF7348] text-black font-black shadow-lg shadow-orange-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-slate-400 group-hover:text-white'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white/20 text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / User & Logout */}
        <div className="p-4 border-t border-white/10 shrink-0 bg-[#12151B]">
          <div className="flex items-center justify-between text-xs px-1">
            <div className="truncate">
              <p className="text-[11px] font-bold text-white truncate">{user?.name}</p>
              <p className="text-[9px] text-slate-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={async () => {
                await logout();
                router.push('/login');
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ── Main Workspace Content Area (Offset by lg:pl-72) ─────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 min-h-screen">
        {/* ── Top Header Navigation ────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 h-16 border-b border-white/10 bg-[#12151B]/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 border border-white/10 transition-colors"
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Brand Logo & Portal Tag */}
            <Link href="/vendor/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center border border-white/15 group-hover:border-[#FF7348]/60 transition-colors overflow-hidden">
                <span className="font-black italic text-sm text-[#FF7348]">AF1</span>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white italic leading-tight">
                  Vendor Portal
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  Merchant Operations
                </span>
              </div>
            </Link>
          </div>

          {/* Center / Right Header controls */}
          <div className="flex items-center gap-3">
            {/* Status Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Operational Live
              </span>
            </div>

            {/* Live Storefront Link */}
            <Link
              href={teamStoreUrl}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider group"
            >
              <span>Storefront</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FF7348] transition-colors" />
            </Link>

            {/* User Profile avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── Main Workspace Content ──────────────────────────────────────── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
