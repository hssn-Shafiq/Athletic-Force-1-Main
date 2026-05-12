
"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3,
  Package,
  Users,
  Settings,
  ChevronDown,
  Box,
  Search,
  Bell,
  User,
  Menu,
  ClipboardList,
  Warehouse,
  Truck,
  Tag,
  Mail,
  Globe,
  BookOpen,
  LogOut,
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
  Wand2,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Layout,
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';

interface SidebarItemProps {
  icon: any;
  label: string;
  href?: string;
  subItems?: { label: string; href: string }[];
  isCollapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, href, subItems, isCollapsed }) => {
  const pathname = usePathname();
  const isActive = href ? pathname === href : subItems?.some((item) => pathname === item.href);
  const [isOpen, setIsOpen] = useState(Boolean(isActive));
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const itemRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (isCollapsed && itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      setCoords({ top: rect.top, left: rect.right });
    }
    setIsHovered(true);
  };

  const linkBaseClass = 'block p-2 text-[10px] font-bold uppercase tracking-widest italic transition-colors';

  if (subItems) {
    return (
      <div className="space-y-1 relative" ref={itemRef}>
        <button
          onClick={() => !isCollapsed && setIsOpen(!isOpen)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setIsHovered(false)}
          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${isActive ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "text-slate-500 hover:bg-slate-50 hover:text-black"
            } ${isCollapsed ? "justify-center" : ""}`}
        >
          <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-black"}`} />
            {!isCollapsed && <span className="font-bold uppercase tracking-widest text-[11px] italic truncate">{label}</span>}
          </div>
          {!isCollapsed && <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />}
        </button>

        {/* Tooltip / Mini-Menu for Collapsed State */}
        <AnimatePresence>
          {isCollapsed && isHovered && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="fixed z-[100] ml-1 pl-3"
              style={{ top: coords.top, left: coords.left }}
            >
              <div className="bg-black text-white rounded-xl shadow-2xl overflow-hidden min-w-[180px] border border-white/10">
                <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest italic opacity-60">Tactical Menu</p>
                  <p className="text-[11px] font-black uppercase tracking-tighter italic">{label}</p>
                </div>

                {subItems ? (
                  <div className="p-1.5">
                    {subItems.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`block px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest italic transition-all hover:bg-orange-600 hover:text-white ${pathname === sub.href ? 'text-orange-500' : 'text-slate-300'
                          }`}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    href={href!}
                    className="block px-4 py-3 text-[10px] font-bold uppercase tracking-widest italic text-slate-300 hover:bg-orange-600 hover:text-white transition-all"
                  >
                    Open {label}
                  </Link>
                )}
              </div>
              <div className="absolute left-[8px] top-5 w-3 h-3 bg-black rotate-45 border-l border-b border-white/10" />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!isCollapsed && isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pl-11 space-y-1"
            >
              {subItems.map((sub) => (
                <Link
                  key={sub.href}
                  href={sub.href}
                  className={`${linkBaseClass} ${pathname === sub.href ? 'text-orange-600' : 'text-slate-400 hover:text-black'}`}
                >
                  {sub.label}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative" ref={itemRef}>
      <Link
        href={href!}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${pathname === href ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-slate-500 hover:bg-slate-50 hover:text-black'
          } ${isCollapsed ? "justify-center" : ""}`}
      >
        <Icon className={`w-5 h-5 shrink-0 ${pathname === href ? 'text-white' : 'text-slate-400 group-hover:text-black'}`} />
        {!isCollapsed && <span className="font-bold uppercase tracking-widest text-[11px] italic truncate">{label}</span>}
      </Link>

      {/* Tooltip / Mini-Menu for Collapsed State */}
      <AnimatePresence>
        {isCollapsed && isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="fixed z-[100] ml-1 pl-3"
            style={{ top: coords.top, left: coords.left }}
          >
            <div className="bg-black text-white rounded-xl shadow-2xl overflow-hidden min-w-[150px] border border-white/10">
              <Link
                href={href!}
                className="block px-4 py-3 text-[10px] font-black uppercase tracking-widest italic text-slate-100 hover:bg-orange-600 hover:text-white transition-all"
              >
                Access {label}
              </Link>
            </div>
            <div className="absolute left-[8px] top-5 w-3 h-3 bg-black rotate-45 border-l border-b border-white/10" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Handle initial sidebar state and window resizing
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  const userRoles = user?.roles || [];
  const isSuperAdmin = userRoles.includes('superadmin');
  const isManager = userRoles.includes('manager');
  const isSalesAdmin = userRoles.includes('sales_admin');
  const isEditor = userRoles.includes('editor');
  const isSeoSpecialist = userRoles.includes('seo_specialist');
  const isViewer = userRoles.includes('viewer');

  const isAdmin = userRoles.some(r => r !== 'customer');

  const getHighestRole = () => {
    if (isSuperAdmin) return 'Super Admin';
    if (isManager) return 'Manager';
    if (isSalesAdmin) return 'Sales Admin';
    if (isEditor) return 'Editor';
    if (isSeoSpecialist) return 'SEO Specialist';
    if (isViewer) return 'Viewer';
    return 'Staff';
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const [notifications, setNotifications] = useState<{
    count: number;
    details?: {
      orders: number;
      lowStock: number;
      outOfStock: number;
      reviews: number;
      failedPayments: number;
      quotes: number;
      delays: number;
    };
    recentOrders: any[];
  }>({ count: 0, recentOrders: [] });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());

  const dismissItem = (key: string) => {
    setDismissedKeys(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const fetchNotifications = async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const { data } = await apiClient.get('/api/orders/admin/notifications');
      if (data.ok) {
        setNotifications({
          count: data.pendingCount,
          details: data.details,
          recentOrders: data.recentOrders || []
        });
      }
    } catch (e) {
    } finally {
      if (manual) {
        setTimeout(() => setIsRefreshing(false), 600);
      }
    }
  };

  React.useEffect(() => {
    if (!isAdmin) return;
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(), 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  React.useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!isAdmin) {
      router.replace('/account');
    }
  }, [isLoading, isAuthenticated, isAdmin, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center px-6 text-center">
        <div>
          <div className="w-12 h-12 border-4 border-slate-200 border-t-black rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-black italic uppercase tracking-tighter text-slate-700">Verifying Tactical Clearance...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center px-6">
        <div className="rounded-[40px] border border-red-200 bg-red-50 p-12 text-center max-w-lg shadow-2xl shadow-red-100">
          <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Settings className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-red-700">Access Denied</h1>
          <p className="mt-4 text-sm font-bold text-red-800 uppercase tracking-widest opacity-60">Insufficient Tactical Clearance identified</p>
          <button
            onClick={() => router.push('/')}
            className="mt-8 px-8 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20"
          >
            Abort & Return Home
          </button>
        </div>
      </div>
    );
  }

  // --- Permission Matrix ---
  const canSeeInsights = isSuperAdmin || isManager || isSalesAdmin || isViewer;
  const canSeeProducts = isSuperAdmin || isManager;
  const canSeeOrders = isSuperAdmin || isSalesAdmin || isManager;
  const canSeeJournal = isSuperAdmin || isEditor || isManager || isSeoSpecialist;
  const canSeeInventory = isSuperAdmin || isSalesAdmin || isManager;
  const canSeeCustomers = isSuperAdmin || isSalesAdmin;
  const canSeeEmails = isSuperAdmin;
  const canSeeSettings = isSuperAdmin;
  const canSeeSeo = isSuperAdmin || isSeoSpecialist;
  const canSeePages = isSuperAdmin || isSeoSpecialist || isEditor || isManager;
  const canSeeStaff = isSuperAdmin;

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex">
      {/* Sidebar Backdrop - Mobile only */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-[45] lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Fixed Positioning */}
      <aside className={`bg-white border-r border-slate-100 flex flex-col transition-all duration-300 z-50 fixed inset-y-0 left-0 ${isSidebarOpen
          ? (isSidebarCollapsed ? "w-20 translate-x-0" : "w-72 translate-x-0")
          : "w-72 -translate-x-full lg:translate-x-0 lg:w-20"
        }`}>
        <div className={`p-8 flex items-center justify-between gap-3 ${isSidebarCollapsed ? "px-5" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="bg-black text-white w-10 h-10 rounded-xl flex items-center justify-center shrink-0 rotate-[-5deg]">
              <span className="text-2xl font-black italic">A</span>
            </div>
            {(!isSidebarCollapsed || (isSidebarOpen && isMobile)) && (
              <div className="flex flex-col leading-none">
                <span className="text-[10px] tracking-[.3em] font-black text-slate-400 uppercase">Admin</span>
                <span className="text-xl tracking-tighter font-black italic uppercase text-slate-900 leading-tight">Force 1</span>
              </div>
            )}
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-slate-50 rounded-xl text-slate-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
          {canSeeInsights && <SidebarItem icon={BarChart3} label="Insights" href="/admin" isCollapsed={isSidebarCollapsed} />}

          {canSeeProducts && (
            <SidebarItem
              icon={Box}
              label="Products"
              isCollapsed={isSidebarCollapsed}
              subItems={[
                { label: "All Products", href: "/admin/products" },
                { label: "Add Product", href: "/admin/products/add" },
                { label: "Collections", href: "/admin/collections" }
              ]}
            />
          )}

          {canSeeOrders && (
            <SidebarItem
              icon={ClipboardList}
              label="Orders"
              isCollapsed={isSidebarCollapsed}
              subItems={[
                { label: "Direct Orders", href: "/admin/orders" },
                { label: "Request Orders", href: "/admin/orders/requests" }
              ]}
            />
          )}

          {canSeeJournal && (
            <SidebarItem
              icon={BookOpen}
              label="Journal"
              isCollapsed={isSidebarCollapsed}
              subItems={[
                { label: "Manage Blogs", href: "/admin/blog" },
                { label: "Add Blog", href: "/admin/blog/add" },
                { label: "Blog Categories", href: "/admin/blog/categories" }
              ]}
            />
          )}

          {canSeePages && (
            <SidebarItem
              icon={Layout}
              label="Pages"
              isCollapsed={isSidebarCollapsed}
              subItems={[
                { label: "Home Page", href: "/admin/pages/home" },
                { label: "About Page", href: "/admin/pages/about" },
                { label: "Privacy Policy", href: "/admin/pages/legal/privacy" },
                { label: "Terms & Conditions", href: "/admin/pages/legal/terms" },
                { label: "SEO Meta", href: "/admin/seo" }
              ]}
            />
          )}

          {canSeeInventory && <SidebarItem icon={Warehouse} label="Inventory" href="/admin/inventory" isCollapsed={isSidebarCollapsed} />}
          {canSeeCustomers && <SidebarItem icon={Users} label="Customers" href="/admin/customers" isCollapsed={isSidebarCollapsed} />}
          {canSeeEmails && <SidebarItem icon={Mail} label="Emails" href="/admin/emails" isCollapsed={isSidebarCollapsed} />}

          <div className={`pt-4 mt-4 border-t border-slate-50 space-y-1 ${isSidebarCollapsed ? "text-center" : ""}`}>
            {!isSidebarCollapsed && <p className="px-3 pb-1 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Strategy</p>}
            {canSeeSeo && <SidebarItem icon={Globe} label="SEO Command" href="/admin/seo" isCollapsed={isSidebarCollapsed} />}
            {canSeeSettings && <SidebarItem icon={Truck} label="Shipping & Tax" href="/admin/settings/shipping-tax" isCollapsed={isSidebarCollapsed} />}
            {canSeeStaff && <SidebarItem icon={Users} label="Staff Management" href="/admin/users" isCollapsed={isSidebarCollapsed} />}
            <SidebarItem icon={Settings} label="Settings" href="/admin/settings" isCollapsed={isSidebarCollapsed} />
          </div>
        </nav>

        <div className="mt-auto p-4 border-t border-slate-50 bg-white">
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-orange-600" />
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-slate-900 truncate uppercase tracking-tighter italic font-sora">
                  {user?.name || 'Tactical Unit'}
                </p>
                <p className="text-[8px] text-slate-400 font-bold truncate font-inter">
                  {user?.email || 'clearance@af1.com'}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area - Dedicated Scroll Container */}
      <div className={`flex-1 flex flex-col h-screen overflow-y-auto min-w-0 transition-all duration-300 ${isSidebarOpen
          ? (isSidebarCollapsed ? "lg:ml-20" : "lg:ml-72")
          : "ml-0"
        }`}>
        {/* Topbar - Locked Tactical Header */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-slate-50 rounded-xl"
            >
              <Menu className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-black transition-colors"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            <div className="relative group hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search analytics, products..."
                className="bg-slate-50 border border-transparent focus:border-slate-200 focus:bg-white rounded-xl py-2 pl-12 pr-4 w-64 outline-none text-xs font-medium transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="relative p-2 hover:bg-slate-50 rounded-xl transition-colors inline-block pt-3"
              >
                <Bell className="w-5 h-5 text-slate-400" />
                {notifications.count > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-orange-600 rounded-full border-2 border-white text-[9px] font-black text-white flex items-center justify-center px-1">
                    {notifications.count > 99 ? '99+' : notifications.count}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-black uppercase tracking-widest italic text-slate-900">Tactical Notifications</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchNotifications(true);
                          }}
                          className={`p-1.5 hover:bg-slate-200 rounded-md transition-all ${isRefreshing ? 'animate-spin text-orange-600' : 'text-slate-400'}`}
                          disabled={isRefreshing}
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-2 py-1 rounded-md">{notifications.count} Active</span>
                    </div>

                    <div className="max-h-[450px] overflow-y-auto no-scrollbar">
                      {/* Alerts Summary */}
                      {notifications.details && (
                        <div className="p-4 bg-orange-50/30 border-b border-slate-50 space-y-2">
                          {notifications.details.outOfStock > 0 && !dismissedKeys.has('outOfStock') && (
                            <div className="group relative">
                              <Link href="/admin/inventory" onClick={() => setIsDropdownOpen(false)} className="flex items-center justify-between p-2 bg-white rounded-xl border border-red-100 shadow-sm hover:scale-[1.02] transition-transform pr-10">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                  <span className="text-[10px] font-black uppercase tracking-tighter text-red-600">Critical: {notifications.details.outOfStock} Out of Stock</span>
                                </div>
                                <ChevronDown className="-rotate-90 w-3 h-3 text-red-400" />
                              </Link>
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissItem('outOfStock'); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-red-50 rounded-md text-red-300 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          {notifications.details.lowStock > 0 && !dismissedKeys.has('lowStock') && (
                            <div className="group relative">
                              <Link href="/admin/inventory" onClick={() => setIsDropdownOpen(false)} className="flex items-center justify-between p-2 bg-white rounded-xl border border-orange-100 shadow-sm hover:scale-[1.02] transition-transform pr-10">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-orange-600" />
                                  <span className="text-[10px] font-black uppercase tracking-tighter text-orange-600">Warning: {notifications.details.lowStock} Low Stock</span>
                                </div>
                                <ChevronDown className="-rotate-90 w-3 h-3 text-orange-400" />
                              </Link>
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissItem('lowStock'); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-orange-50 rounded-md text-orange-300 hover:text-orange-600 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          {notifications.details.delays > 0 && !dismissedKeys.has('delays') && (
                            <div className="group relative">
                              <Link href="/admin/orders" onClick={() => setIsDropdownOpen(false)} className="flex items-center justify-between p-2 bg-white rounded-xl border border-orange-200 bg-orange-50/50 shadow-sm hover:scale-[1.02] transition-transform pr-10">
                                <div className="flex items-center gap-3">
                                  <AlertTriangle className="w-3.5 h-3.5 text-orange-700" />
                                  <span className="text-[10px] font-black uppercase tracking-tighter text-orange-700">Delayed: {notifications.details.delays} Orders {'>'} 48H</span>
                                </div>
                                <ChevronDown className="-rotate-90 w-3 h-3 text-orange-400" />
                              </Link>
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissItem('delays'); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-orange-100 rounded-md text-orange-400 hover:text-orange-700 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          {notifications.details.failedPayments > 0 && !dismissedKeys.has('failedPayments') && (
                            <div className="group relative">
                              <Link href="/admin/orders" onClick={() => setIsDropdownOpen(false)} className="flex items-center justify-between p-2 bg-white rounded-xl border border-red-200 bg-red-50/30 shadow-sm hover:scale-[1.02] transition-transform pr-10">
                                <div className="flex items-center gap-3">
                                  <ShieldAlert className="w-3.5 h-3.5 text-red-700" />
                                  <span className="text-[10px] font-black uppercase tracking-tighter text-red-700">Alert: {notifications.details.failedPayments} Failed Payments</span>
                                </div>
                                <ChevronDown className="-rotate-90 w-3 h-3 text-red-400" />
                              </Link>
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissItem('failedPayments'); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-red-100 rounded-md text-red-400 hover:text-red-700 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          {notifications.details.quotes > 0 && !dismissedKeys.has('quotes') && (
                            <div className="group relative">
                              <Link href="/admin/orders/requests" onClick={() => setIsDropdownOpen(false)} className="flex items-center justify-between p-2 bg-white rounded-xl border border-indigo-100 shadow-sm hover:scale-[1.02] transition-transform pr-10">
                                <div className="flex items-center gap-3">
                                  <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                                  <span className="text-[10px] font-black uppercase tracking-tighter text-indigo-600">Incoming: {notifications.details.quotes} Quote Requests</span>
                                </div>
                                <ChevronDown className="-rotate-90 w-3 h-3 text-indigo-400" />
                              </Link>
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissItem('quotes'); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-indigo-50 rounded-md text-indigo-300 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          {notifications.details.reviews > 0 && !dismissedKeys.has('reviews') && (
                            <div className="group relative">
                              <Link href="/admin/products" onClick={() => setIsDropdownOpen(false)} className="flex items-center justify-between p-2 bg-white rounded-xl border border-blue-100 shadow-sm hover:scale-[1.02] transition-transform pr-10">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                                  <span className="text-[10px] font-black uppercase tracking-tighter text-blue-600">{notifications.details.reviews} New Reviews Pending</span>
                                </div>
                                <ChevronDown className="-rotate-90 w-3 h-3 text-blue-400" />
                              </Link>
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissItem('reviews'); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-blue-50 rounded-md text-blue-300 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Orders Section */}
                      <div className="p-3 bg-slate-50/30 border-b border-slate-50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Recent Mission Orders</p>
                      </div>

                      {notifications.recentOrders.filter(o => !dismissedKeys.has(o.id)).length === 0 ? (
                        <div className="p-6 text-center">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No new orders</p>
                        </div>
                      ) : (
                        notifications.recentOrders.filter(o => !dismissedKeys.has(o.id)).map((order) => (
                          <div key={order.id} className="group relative">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              onClick={() => {
                                setIsDropdownOpen(false);
                              }}
                              className="block p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors last:border-0 pr-12"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  Order #{order.id.slice(-6).toUpperCase()}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm font-black text-slate-900 truncate uppercase italic tracking-tighter">
                                {order.userId?.name || order.shippingAddress.firstName + ' ' + order.shippingAddress.lastName}
                              </p>
                              <p className="text-xs font-bold text-slate-500 mt-1">${order.total.toFixed(2)}</p>
                            </Link>
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissItem(order.id); }}
                              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 rounded-xl text-slate-300 hover:text-slate-600 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                      <Link href="/admin/orders" onClick={() => setIsDropdownOpen(false)} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-black hover:underline italic">
                        Access All Command Logs
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-3 lg:px-4 py-2 rounded-2xl border border-slate-100">
              <ShieldAlert className="w-4 h-4 text-orange-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 font-sora truncate max-w-[80px]">{getHighestRole()}</span>
            </div>

            <div className="h-8 w-[1px] bg-slate-100 mx-1 lg:mx-2 hidden xs:block" />

            <div className="flex items-center gap-2 lg:gap-6">
              <Link
                href="/"
                className="hidden md:block text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-black italic transition-colors font-sora"
              >
                View Store
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm font-sora group"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
