
"use client";

import React, { useState } from 'react';
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
  Warehouse
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarItemProps {
  icon: any;
  label: string;
  href?: string;
  subItems?: { label: string; href: string }[];
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, href, subItems }) => {
  const pathname = usePathname();
  const isActive = href ? pathname === href : subItems?.some((item) => pathname === item.href);
  const [isOpen, setIsOpen] = useState(Boolean(isActive));

  const linkBaseClass = 'block p-2 text-[10px] font-bold uppercase tracking-widest italic transition-colors';

  if (subItems) {
    return (
      <div className="space-y-1">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${
            isActive ? "bg-orange-600 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-black"
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-black"}`} />
            <span className="font-bold uppercase tracking-widest text-[11px] italic">{label}</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {isOpen && (
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
    <Link
      href={href!}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${pathname === href ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-slate-500 hover:bg-slate-50 hover:text-black'}`}
    >
      <Icon className={`w-5 h-5 ${pathname === href ? 'text-white' : 'text-slate-400 group-hover:text-black'}`} />
      <span className="font-bold uppercase tracking-widest text-[11px] italic">{label}</span>
    </Link>
  );
};

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const isAdmin = Boolean(user?.roles?.some((role) => role === 'admin' || role === 'superadmin'));

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
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center px-6">
        <p className="text-lg font-black italic uppercase tracking-tighter text-slate-700">Checking Admin Access...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center px-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-center max-w-lg">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-red-700">Access Denied</h1>
          <p className="mt-2 text-sm font-semibold text-red-700">Admin dashboard is available only for users with admin role.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-slate-100 flex flex-col transition-all duration-300 z-50 fixed lg:static inset-y-0 left-0 ${
        isSidebarOpen ? "w-72" : "w-20 -translate-x-full lg:translate-x-0"
      }`}>
        <div className="p-8 flex items-center gap-3">
          <div className="bg-black text-white w-10 h-10 rounded-xl flex items-center justify-center shrink-0 rotate-[-5deg]">
            <span className="text-2xl font-black italic">A</span>
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col leading-none">
              <span className="text-[10px] tracking-[.3em] font-black text-slate-400 uppercase">Admin</span>
              <span className="text-xl tracking-tighter font-black italic uppercase text-slate-900 leading-tight">Force 1</span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
          <SidebarItem icon={BarChart3} label="Insights" href="/admin" />
          <SidebarItem 
            icon={Box} 
            label="Products" 
            subItems={[
              { label: "All Products", href: "/admin/products" },
              { label: "Add Product", href: "/admin/products/add" },
              { label: "Collections", href: "/admin/collections" }
            ]} 
          />
          <SidebarItem 
            icon={ClipboardList} 
            label="Orders" 
            subItems={[
              { label: "Direct Orders", href: "/admin/orders" },
              { label: "Request Orders", href: "/admin/orders/requests" }
            ]} 
          />
          <SidebarItem icon={Warehouse} label="Inventory" href="/admin/inventory" />
          <SidebarItem icon={Users} label="Customers" href="/admin/customers" />
          <div className="pt-4 mt-4 border-t border-slate-50">
            <SidebarItem icon={Settings} label="Settings" href="/admin/settings" />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-50">
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <User className="w-5 h-5 text-orange-600" />
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-slate-900 truncate uppercase tracking-tighter italic">Admin User</p>
                <p className="text-[8px] text-slate-400 font-bold truncate">support@af1.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-slate-50 rounded-xl"
            >
              <Menu className="w-6 h-6" />
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
            <button className="relative p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <Bell className="w-5 h-5 text-slate-400" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-orange-600 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-[1px] bg-slate-100 mx-2" />
            <Link
              href="/"
              className="text-[10px] font-black uppercase tracking-widest text-[#FF7348] hover:underline italic"
            >
              View Storefront
            </Link>
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
