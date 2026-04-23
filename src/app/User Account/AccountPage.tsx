
"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Package, MapPin, Heart, Settings, 
  LogOut, ChevronRight, CheckCircle2,
  Trophy, Shield, Clock, ArrowRight,
  ExternalLink,
  Loader2,
  Truck,
  ChevronLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { useWishlist } from '@/contexts/WishlistContext';

type TabType = 'dashboard' | 'orders' | 'profile' | 'addresses' | 'wishlist' | 'settings';

export const AccountPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const router = useRouter();
  const { user, logout, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'dashboard' || tab === 'orders' || tab === 'profile' || tab === 'addresses' || tab === 'wishlist' || tab === 'settings') {
      setActiveTab(tab);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AF';

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] pt-24 pb-24 flex items-center justify-center">
        <p className="text-slate-500 font-semibold">Loading your account...</p>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Trophy },
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
                  <span className="text-white text-2xl font-black italic">{initials}</span>
                </div>
                <div>
                  <h3 className="font-black italic uppercase tracking-tighter text-slate-900 leading-none">{user?.name ?? 'Athlete'}</h3>
                  <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-widest italic">{user?.email ?? 'member@athleticforce1.com'}</p>
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
                    onClick={handleLogout}
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

const OrdersView = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await apiClient.get('/api/orders/my-orders');
        if (data.ok) setOrders(data.orders);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'delivered': return 'bg-slate-900 text-white border-black';
      case 'cancelled': case 'refunded': case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      case 'dev_bypass': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'All') return true;
    if (filter === 'Shipped') return ['shipped', 'delivered'].includes(o.status);
    if (filter === 'Pending') return ['pending', 'paid', 'processing', 'dev_bypass'].includes(o.status);
    if (filter === 'Cancelled') return ['cancelled', 'failed', 'refunded'].includes(o.status);
    return true;
  });

  return (
    <div className="space-y-8">
      {selectedOrder ? (
        <div className="space-y-8">
          <button onClick={() => setSelectedOrder(null)} className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-black flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Back to Orders
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">
                Order #{selectedOrder.id.slice(-6).toUpperCase()}
              </h2>
              <p className="text-xs font-bold text-slate-500 mt-2">Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
            </div>
            <div className={`px-5 py-2 border rounded-full text-[10px] font-black uppercase tracking-widest italic flex items-center justify-center ${getStatusColor(selectedOrder.status)}`}>
              {selectedOrder.status.replace('_', ' ')}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Items List */}
              <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm space-y-6">
                <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 border-b border-slate-50 pb-4">Items Ordered</h3>
                <div className="space-y-6">
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4 border-b border-slate-50 pb-6 last:border-0 last:pb-0">
                      <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden shrink-0">
                        <img src={item.imageUrl || '/placeholder.png'} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">{item.name}</p>
                        {(item.size || item.color) && (
                          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
                            {[item.color, item.size].filter(Boolean).join(' / ')}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 font-bold mt-1">Qty: <span className="text-slate-900">{item.quantity}</span></p>
                      </div>
                      <p className="text-sm font-black text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Tracking info if exists */}
              {selectedOrder.trackingId && (
                <div className="bg-orange-50 border border-orange-100 rounded-[32px] p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <Truck className="w-6 h-6 text-orange-600" />
                    <h3 className="text-lg font-black uppercase tracking-tighter italic text-slate-900">Tracking Information</h3>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{selectedOrder.carrier || 'Carrier'}</p>
                  <p className="text-xl font-black text-orange-600 mt-1">{selectedOrder.trackingId}</p>
                  <button className="mt-4 flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-black uppercase italic tracking-widest text-xs hover:scale-105 transition-all">
                    Track Package <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-slate-50 rounded-[32px] p-8 space-y-4">
                <h3 className="text-lg font-black uppercase tracking-tighter italic text-slate-900 border-b border-slate-200 pb-4">Payment Summary</h3>
                <div className="space-y-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <div className="flex justify-between"><span>Subtotal</span><span className="text-slate-900">${selectedOrder.subtotal.toFixed(2)}</span></div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600"><span>Discount</span><span>-${selectedOrder.discountAmount.toFixed(2)}</span></div>
                  )}
                  <div className="flex justify-between"><span>Shipping</span><span className="text-slate-900">${selectedOrder.shippingFee.toFixed(2)}</span></div>
                  {selectedOrder.taxAmount > 0 && (
                    <div className="flex justify-between"><span>Tax</span><span className="text-slate-900">${selectedOrder.taxAmount.toFixed(2)}</span></div>
                  )}
                  <div className="flex justify-between pt-4 border-t border-slate-200 items-center">
                    <span className="text-base text-slate-900">Total</span>
                    <span className="text-2xl font-black text-orange-600 italic">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white border text-left border-slate-100 rounded-[32px] p-8 space-y-2">
                <h3 className="text-lg font-black uppercase tracking-tighter italic text-slate-900 border-b border-slate-50 pb-4 mb-4">Shipping To</h3>
                <p className="text-sm font-black text-slate-900">{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</p>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                  {selectedOrder.shippingAddress.address1} {selectedOrder.shippingAddress.address2}<br/>
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}<br/>
                  {selectedOrder.shippingAddress.country}
                </p>
                {selectedOrder.shippingAddress.phone && (
                  <p className="text-xs text-slate-500 font-bold mt-2">Phone: {selectedOrder.shippingAddress.phone}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">My Orders</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {['All', 'Pending', 'Shipped', 'Cancelled'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest italic transition-all shrink-0 border border-slate-100 ${
                filter === f ? 'bg-black text-white border-black' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100 space-y-4">
            <Package className="w-12 h-12 text-slate-200" />
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">No Orders Found</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm space-y-6 hover:shadow-xl transition-all group">
              <div className="flex flex-col md:flex-row justify-between pb-6 border-b border-slate-50 gap-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full md:w-auto">
                  <div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest italic">Order ID</p>
                    <p className="font-black text-sm italic tracking-tighter mt-1">#{order.id.slice(-6).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest italic">Date</p>
                    <p className="font-black text-sm italic tracking-tighter mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest italic">Total</p>
                    <p className="font-black text-sm italic tracking-tighter text-orange-600 mt-1">${order.total.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest italic">Items</p>
                    <p className="font-black text-sm italic tracking-tighter mt-1">{order.items.reduce((acc: any, i: any) => acc + i.quantity, 0)}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:items-end">
                  <div className={`px-4 py-1.5 border rounded-full text-[9px] font-black uppercase tracking-widest self-start md:self-auto italic ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex -space-x-4">
                  {order.items.slice(0, 4).map((item: any, idx: number) => (
                    <div key={idx} className="w-16 h-16 rounded-2xl bg-slate-50 border-4 border-white overflow-hidden shadow-sm ring-1 ring-slate-100 shrink-0">
                      <img src={item.imageUrl || '/placeholder.png'} className="w-full h-full object-cover" alt={item.name} />
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 border-4 border-white overflow-hidden shadow-sm ring-1 ring-slate-100 shrink-0 flex items-center justify-center">
                      <span className="text-xs font-black text-slate-500">+{order.items.length - 4}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  {order.trackingId && (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-4 py-3 rounded-2xl w-full md:w-auto justify-center border border-slate-100">
                      <Truck className="w-4 h-4 text-orange-500" />
                      <span>{order.carrier || 'Carrier'}: <span className="text-slate-900">{order.trackingId}</span></span>
                    </div>
                  )}
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="flex items-center justify-center w-full md:w-auto gap-2 border-2 border-slate-100 text-slate-700 px-6 py-3.5 rounded-2xl font-black uppercase italic tracking-widest text-[10px] hover:border-black hover:text-black transition-all"
                  >
                    View Details
                  </button>
                  {['shipped'].includes(order.status) && (
                    <button className="flex items-center justify-center w-full md:w-auto gap-3 bg-black text-white px-8 py-3.5 rounded-2xl font-black uppercase italic tracking-tighter text-xs hover:scale-105 transition-all shadow-md">
                      <span>Track Order</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </>
      )}
    </div>
  );
};

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

const WishlistView = () => {
  const { items, toggleItem, isLoading } = useWishlist();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Loading wishlist...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Wishlist</h2>
        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">{items.length} Saved Items</span>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.productId} className="bg-white rounded-[40px] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all group relative">
              <button 
                onClick={() => toggleItem({
                  productId: item.productId,
                  name: item.name,
                  imageUrl: item.imageUrl,
                  price: item.price
                })}
                className="absolute top-6 right-6 z-10 p-3 bg-red-50 rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
              >
                <Heart className="w-5 h-5 fill-current" />
              </button>
              <div className="aspect-square rounded-3xl bg-slate-50 overflow-hidden mb-6 relative">
                <img 
                  src={item.imageUrl || 'https://af1.groomyorlife.com/wp-content/uploads/2026/01/Background.png'} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt={item.name} 
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[#FF7348] text-[10px] font-black uppercase tracking-widest italic">Product</p>
                  <h4 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none mt-1 line-clamp-1">{item.name}</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black italic tracking-tighter text-slate-900">${item.price.toFixed(2)}</span>
                  <button 
                    onClick={() => router.push(`/products/${item.productId}`)} // Ideally we'd have slug, but for now fallback to ID
                    className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center hover:bg-orange-600 transition-all rotate-[-5deg] hover:rotate-0"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-slate-100 p-20 text-center space-y-6">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
            <Heart className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Your wishlist is empty</h3>
            <p className="text-slate-400 font-medium italic text-sm">Start adding some items you love!</p>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-xs hover:scale-105 transition-all shadow-xl shadow-black/10"
          >
            Explore Gear
          </button>
        </div>
      )}
    </div>
  );
};

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
