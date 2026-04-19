
"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Package, MapPin, Heart, Settings, 
  LogOut, ChevronRight,
  Trophy, Shield, Clock, ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type TabType = 'dashboard' | 'orders' | 'profile' | 'addresses' | 'wishlist' | 'settings';

export const AccountPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const router = useRouter();

  const menuItems = [
    { id: 'dashboard', label: 'Admin Dashboard', icon: Trophy },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'profile', label: 'Personal Info', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'orders': return <OrdersView />;
      case 'profile': return <ProfileView />;
      case 'addresses': return <AddressesView />;
      case 'wishlist': return <WishlistView />;
      case 'settings': return <SettingsView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar / Mobile Nav */}
          <aside className="lg:w-80 shrink-0 space-y-8">
            <div className="bg-white rounded-[40px] p-4 lg:p-8 border border-slate-100 shadow-sm space-y-8 lg:sticky lg:top-32 overflow-hidden">
              <div className="hidden lg:flex items-center gap-4">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center -rotate-3 shadow-lg">
                  <span className="text-white text-2xl font-black italic">JD</span>
                </div>
                <div>
                  <h3 className="font-black italic uppercase tracking-tighter text-slate-900 leading-none">John Doe</h3>
                  <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-widest italic">Elite Member</p>
                </div>
              </div>

              <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible no-scrollbar pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as TabType)}
                      className={`shrink-0 lg:w-full flex items-center justify-between p-3 lg:p-4 rounded-xl lg:rounded-2xl transition-all group ${
                        activeTab === item.id 
                          ? "bg-black text-white shadow-xl shadow-black/10 lg:translate-x-1" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-black"
                      }`}
                    >
                      <div className="flex items-center gap-3 lg:gap-4">
                        <Icon className={`w-4 h-4 lg:w-5 lg:h-5 ${activeTab === item.id ? "text-orange-500" : "text-slate-400 group-hover:text-black"}`} />
                        <span className="font-bold uppercase tracking-widest text-[9px] lg:text-[11px] italic whitespace-nowrap">{item.label}</span>
                      </div>
                      <ChevronRight className={`hidden lg:block w-4 h-4 transition-transform ${activeTab === item.id ? "rotate-90 text-orange-500" : "opacity-0 group-hover:opacity-100"}`} />
                    </button>
                  );
                })}
                <div className="hidden lg:block pt-4 mt-4 border-t border-slate-50">
                  <button 
                    onClick={() => router.push('/login')}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold uppercase tracking-widest text-[11px] italic"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

// --- Sub Views ---

const DashboardView = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-black p-8 rounded-[40px] text-white space-y-4 relative overflow-hidden group">
        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-orange-600 rounded-full blur-3xl opacity-40 group-hover:scale-150 transition-transform" />
        <Clock className="w-8 h-8 text-orange-500 relative z-10" />
        <div className="relative z-10">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest italic">Pending Orders</p>
          <h4 className="text-4xl font-black italic uppercase tracking-tighter">02</h4>
        </div>
      </div>
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4">
        <Package className="w-8 h-8 text-slate-900" />
        <div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest italic">Total Spent</p>
          <h4 className="text-4xl font-black italic uppercase tracking-tighter">$1,240</h4>
        </div>
      </div>
      <div className="bg-[#FF7348] p-8 rounded-[40px] text-white space-y-4">
        <Trophy className="w-8 h-8 text-white" />
        <div>
          <p className="text-white/70 text-xs font-black uppercase tracking-widest italic">Reward Points</p>
          <h4 className="text-4xl font-black italic uppercase tracking-tighter">850</h4>
        </div>
      </div>
    </div>

    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Recent Activity</h2>
        <button className="text-xs font-bold uppercase tracking-widest text-[#FF7348] hover:underline">View All</button>
      </div>
      <div className="bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-sm">
        <div className="divide-y divide-slate-50">
          {[1, 2].map(i => (
            <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden">
                  <img src="https://af1.groomyorlife.com/wp-content/uploads/2026/01/Background.png" className="w-full h-full object-cover" alt="Product" />
                </div>
                <div>
                  <h5 className="font-black italic uppercase tracking-tighter text-slate-900">Custom 7v7 Uniform Pro-Fit</h5>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Order #AF-{1024 + i} • Shipped</p>
                </div>
              </div>
              <button className="p-3 hover:bg-white rounded-xl shadow-sm transition-all">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

const OrdersView = () => (
  <div className="space-y-8">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">My Orders</h2>
      <div className="flex items-center gap-3">
        {['All', 'Shipped', 'Pending', 'Cancelled'].map(filter => (
          <button key={filter} className="px-5 py-2.5 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest italic hover:bg-black hover:text-white transition-all shadow-sm">
            {filter}
          </button>
        ))}
      </div>
    </div>
    
    <div className="space-y-6">
      {[1026, 1025, 1024].map(id => (
        <div key={id} className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm space-y-6 hover:shadow-xl transition-all group">
          <div className="flex flex-col md:flex-row justify-between pb-6 border-b border-slate-50 gap-4">
            <div className="flex gap-8">
              <div>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest italic">Order ID</p>
                <p className="font-black text-sm italic tracking-tighter">#AF-{id}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest italic">Date</p>
                <p className="font-black text-sm italic tracking-tighter">Oct 12, 2024</p>
              </div>
              <div>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest italic">Total</p>
                <p className="font-black text-sm italic tracking-tighter text-orange-600">$249.00</p>
              </div>
            </div>
            <div className="px-6 py-2 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest self-start italic">
              Shipped
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex -space-x-4">
              {[1, 2, 3].map(item => (
                <div key={item} className="w-16 h-16 rounded-2xl bg-slate-50 border-4 border-white overflow-hidden shadow-sm ring-1 ring-slate-100">
                  <img src="https://af1.groomyorlife.com/wp-content/uploads/2026/01/Background.png" className="w-full h-full object-cover" alt="Product" />
                </div>
              ))}
            </div>
            <button className="flex items-center gap-3 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-xs hover:scale-105 transition-all">
              <span>Track Order</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ProfileView = () => (
  <div className="max-w-2xl space-y-12">
    <div className="space-y-4 text-center md:text-left">
      <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Personal Info</h2>
      <p className="text-slate-500 font-medium italic">Manage your profile information and how we contact you.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">First Name</label>
        <input type="text" defaultValue="John" className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-orange-600 transition-all font-bold text-slate-900 shadow-sm" />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Last Name</label>
        <input type="text" defaultValue="Doe" className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-orange-600 transition-all font-bold text-slate-900 shadow-sm" />
      </div>
      <div className="md:col-span-2 space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Email Address</label>
        <input type="email" defaultValue="john.doe@example.com" className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-orange-600 transition-all font-bold text-slate-900 shadow-sm" />
      </div>
      <div className="md:col-span-2 space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Phone Number</label>
        <input type="tel" defaultValue="+1 (555) 000-0000" className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-orange-600 transition-all font-bold text-slate-900 shadow-sm" />
      </div>
    </div>

    <button className="bg-black text-white px-12 py-5 rounded-[30px] font-black uppercase italic tracking-tighter text-lg hover:scale-105 transition-all shadow-xl shadow-black/10">
      Save Changes
    </button>
  </div>
);

const AddressesView = () => (
  <div className="space-y-8">
    <div className="flex justify-between items-center">
      <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Shipping Addresses</h2>
      <button className="bg-black text-white p-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] italic shadow-lg shadow-black/10">Add New</button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2].map(i => (
        <div key={i} className={`p-8 rounded-[40px] border relative group transition-all ${i === 1 ? 'bg-black text-white border-black shadow-2xl' : 'bg-white text-slate-900 border-slate-100 shadow-sm'}`}>
          {i === 1 && (
            <div className="absolute top-8 right-8 bg-orange-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full italic">Default</div>
          )}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className={`text-xl font-black italic uppercase tracking-tighter ${i === 1 ? 'text-white' : 'text-slate-900'}`}>Primary Residence</h4>
              <p className={`text-sm font-medium ${i === 1 ? 'text-slate-400' : 'text-slate-500'}`}>
                123 Athletic Way, Floor 4<br />
                Performance City, CA 90210<br />
                United States
              </p>
            </div>
            <div className="flex gap-4">
              <button className={`text-[10px] font-black uppercase tracking-widest italic hover:underline ${i === 1 ? 'text-orange-500' : 'text-[#FF7348]'}`}>Edit</button>
              <button className={`text-[10px] font-black uppercase tracking-widest italic hover:underline ${i === 1 ? 'text-slate-500' : 'text-slate-400'}`}>Remove</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const WishlistView = () => (
  <div className="space-y-8">
    <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Wishlist</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-[40px] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all group relative">
          <button className="absolute top-6 right-6 z-10 p-3 bg-red-50 rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm">
            <Heart className="w-5 h-5 fill-current" />
          </button>
          <div className="aspect-square rounded-3xl bg-slate-50 overflow-hidden mb-6 relative">
            <img src="https://af1.groomyorlife.com/wp-content/uploads/2026/01/Background.png" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Product" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[#FF7348] text-[10px] font-black uppercase tracking-widest italic">Accessories</p>
              <h4 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none mt-1">Spirit Pack Pro-Elite</h4>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black italic tracking-tighter text-slate-900">$129.00</span>
              <button className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center hover:bg-orange-600 transition-all rotate-[-5deg] hover:rotate-0">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SettingsView = () => (
  <div className="max-w-2xl space-y-12">
    <div className="space-y-4">
      <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Security & Settings</h2>
      <p className="text-slate-500 font-medium italic">Control your account&apos;s security and notification preferences.</p>
    </div>

    <div className="space-y-6">
      <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm space-y-8">
        <h4 className="text-lg font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
          <Shield className="w-5 h-5 text-green-500" />
          Password Management
        </h4>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Current Password</label>
            <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-orange-600 transition-all font-medium" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">New Password</label>
              <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-orange-600 transition-all font-medium" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Confirm New Password</label>
              <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-orange-600 transition-all font-medium" />
            </div>
          </div>
        </div>
        <button className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-xs hover:scale-105 transition-all">
          Update Password
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">Two-Factor Authentication</h4>
            <p className="text-slate-400 text-xs italic">Add an extra layer of security to your account.</p>
          </div>
          <button className="px-6 py-2 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest italic hover:bg-black hover:text-white transition-all">
            Enable
          </button>
        </div>
      </div>
    </div>
  </div>
);
