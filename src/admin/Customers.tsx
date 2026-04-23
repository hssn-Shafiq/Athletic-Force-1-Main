
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  ShieldCheck, 
  Mail, 
  LayoutGrid, 
  Table,
  DollarSign,
  UserCheck,
  UserPlus,
  Eye,
  Edit2,
  Ban,
  ShoppingBag,
  MapPin,
  Calendar,
  X,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { motion, AnimatePresence } from 'motion/react';

interface Customer {
  id: string;
  name: string;
  email: string;
  roles: string[];
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  hasRequestOrder: boolean;
  isRegistered: boolean;
}

interface DetailedCustomer extends Customer {
  savedAddresses: any[];
}

const CustomerDetailsModal: React.FC<{ 
  customerId: string; 
  onClose: () => void;
}> = ({ customerId, onClose }) => {
  const [data, setData] = useState<{ customer: DetailedCustomer; orders: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await apiClient.get(`/api/admin/customers/${customerId}`);
        if (res.data.ok) setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [customerId]);

  if (!data && isLoading) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
       <div className="bg-white p-12 rounded-[40px] animate-pulse">
         <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
       </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-5xl bg-white rounded-[45px] shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col"
      >
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center font-black italic uppercase text-2xl shadow-xl rotate-[-3deg]">
                {data?.customer.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">{data?.customer.name}</h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest italic">{data?.customer.email}</p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
             <X className="w-6 h-6 text-slate-400" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT: Stats & Info */}
            <div className="space-y-8">
               <div className="bg-slate-50 rounded-[35px] p-6 space-y-4 border border-slate-100">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic mb-4">Strategic Overview</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase italic">Lifetime Value</span>
                    <span className="text-xl font-black italic text-orange-600">${(data?.customer.totalSpent ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase italic">Total Operations</span>
                    <span className="text-xl font-black italic text-slate-900">{(data?.orders ?? []).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase italic">Status</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest italic px-2 py-1 rounded-lg ${data?.customer.isRegistered ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {data?.customer.isRegistered ? 'Registered' : 'Guest Lead'}
                    </span>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic px-2 flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-orange-500" /> Intelligence Nodes (Addresses)
                  </h4>
                  {(data?.customer.savedAddresses ?? []).length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase italic">No saved nodes found.</p>
                    </div>
                  ) : (
                    data?.customer.savedAddresses.map((addr: any, i: number) => (
                      <div key={i} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <span className="bg-black text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md italic">Node #{i+1}</span>
                          {addr.isDefault && <span className="text-orange-500 text-[9px] font-black uppercase italic">Default</span>}
                        </div>
                        <p className="text-xs font-bold text-slate-900 mb-1">{addr.firstName} {addr.lastName}</p>
                        <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase italic">
                          {addr.address1}, {addr.city} <br />
                          {addr.state && addr.state + ','} {addr.postalCode}, {addr.country}
                        </p>
                      </div>
                    ))
                  )}
               </div>
            </div>

            {/* RIGHT: History */}
            <div className="lg:col-span-2 space-y-6">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic px-2 flex items-center gap-2">
                 <ShoppingBag className="w-4 h-4 text-orange-500" /> Operational History (Orders)
               </h4>
               <div className="space-y-4">
                 {(data?.orders ?? []).length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                       <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                       <p className="text-xs font-bold text-slate-400 uppercase italic">No missions recorded yet.</p>
                    </div>
                 ) : (
                   data?.orders.map((order: any) => (
                     <div key={order._id} className="group bg-slate-50/50 hover:bg-white border border-slate-100/50 hover:border-slate-200 rounded-3xl p-6 transition-all hover:shadow-xl hover:shadow-black/5 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm group-hover:rotate-6 transition-transform">
                              <ShoppingBag className="w-5 h-5 text-slate-400" />
                           </div>
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">#{order._id.slice(-8).toUpperCase()}</span>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  order.status === 'paid' || order.status === 'delivered' || order.status === 'dev_bypass' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3 text-slate-300" />
                                  <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <DollarSign className="w-3 h-3 text-slate-300" />
                                  <span className="text-[10px] font-black text-slate-900 uppercase italic">${(order.total ?? 0).toFixed(2)}</span>
                                </div>
                              </div>
                           </div>
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-slate-200 group-hover:text-black group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                     </div>
                   ))
                 )}
               </div>
            </div>
          </div>
        </div>
        
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-4">
           <button onClick={onClose} className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest italic hover:bg-slate-50 transition-all text-slate-500">Close Dossier</button>
           <button className="px-8 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic hover:bg-slate-900 shadow-xl shadow-black/10 transition-all">Edit Clearance</button>
        </div>
      </motion.div>
    </div>
  );
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-8 py-6"><div className="h-4 bg-slate-100 rounded w-32" /></td>
    <td className="px-8 py-6"><div className="h-3 bg-slate-100 rounded w-48" /></td>
    <td className="px-8 py-6"><div className="h-3 bg-slate-100 rounded w-20" /></td>
    <td className="px-8 py-6"><div className="h-4 bg-slate-100 rounded w-12" /></td>
    <td className="px-8 py-6"><div className="h-4 bg-slate-100 rounded w-16" /></td>
    <td className="px-8 py-6"><div className="h-8 bg-slate-100 rounded-xl w-8" /></td>
  </tr>
);

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeTab, setActiveTab] = useState<'direct' | 'request'>('direct');
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/api/admin/customers', { params: { search } });
      if (res.data.ok) {
        setCustomers(res.data.customers);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchCustomers(), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const filteredCustomers = customers.filter(c => {
    if (activeTab === 'request') return c.hasRequestOrder;
    return !c.hasRequestOrder || (c.hasRequestOrder && c.orderCount > 1); 
    // Show direct customers in Direct tab. If they have both, we show them as potential direct customers.
  });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Intelligence Roster</h1>
          <p className="text-slate-400 font-medium italic text-sm">Real-time database of active players and strategic leads.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-[22px] border border-slate-200/50">
          {[
            { id: 'direct', label: 'Registered Operations', icon: UserCheck },
            { id: 'request', label: 'Custom Inquiries', icon: UserPlus }
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest italic transition-all ${
                activeTab === t.id ? "bg-white text-black shadow-lg shadow-black/5" : "text-slate-400 hover:text-black"
              }`}
            >
              <t.icon className={`w-3.5 h-3.5 ${activeTab === t.id ? 'text-orange-600' : 'text-slate-300'}`} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Database', value: customers.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Registered Players', value: customers.filter(c => c.isRegistered).length, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Strategic Leads', value: customers.filter(c => !c.isRegistered).length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Catalog LTV (Avg)', value: `$${(customers.reduce((acc, c) => acc + c.totalSpent, 0) / (customers.length || 1)).toFixed(0)}`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm">
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4 rotate-[-5deg]`}>
               <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">{stat.label}</p>
            <h4 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mt-1">{stat.value}</h4>
          </div>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search rosters..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-50 border border-transparent focus:border-slate-200 focus:bg-white rounded-xl py-3 pl-12 pr-4 w-72 outline-none text-xs font-bold transition-all"
                />
              </div>
              <button 
                onClick={fetchCustomers}
                className={`p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 hover:text-black hover:bg-slate-100 transition-all ${isLoading ? 'animate-spin' : ''}`}
                title="Refresh Database"
              >
                <Clock className="w-4 h-4" />
              </button>
           </div>
           
           <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic pr-2">Filter Status:</span>
              <button className="px-4 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-widest italic text-slate-500 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-2 border border-slate-100">
                <Filter className="w-3 h-3" />
                All Activities
              </button>
           </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Personnel Name</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Login Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic text-center">Orders</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic text-center">LTV (Spent)</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Activation Date</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300 italic font-black uppercase tracking-widest text-sm">
                       <Users className="w-12 h-12 opacity-20" />
                       No personnel found in this sector
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black italic uppercase transition-all ${
                          customer.isRegistered 
                            ? "bg-black text-white shadow-xl shadow-black/10" 
                            : "bg-slate-100 text-slate-400"
                        }`}>
                           {customer.name.charAt(0)}
                        </div>
                        <div>
                          <h5 className="font-black italic uppercase tracking-tighter text-slate-900 leading-none">{customer.name}</h5>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${customer.isRegistered ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`} />
                         <span className={`text-[10px] font-black uppercase tracking-widest italic ${customer.isRegistered ? 'text-green-600' : 'text-orange-600'}`}>
                           {customer.isRegistered ? 'Registered Operations' : 'Lead (Ghost User)'}
                         </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="font-black italic tracking-tighter text-slate-900 border border-slate-100 px-3 py-1 rounded-lg bg-slate-50">
                        {customer.orderCount}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="font-black italic tracking-tighter text-slate-900">
                        ${customer.totalSpent.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest italic">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center items-center gap-3">
                         <button 
                           onClick={() => setSelectedCustomerId(customer.id)}
                           className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-all transform hover:scale-110 active:scale-95 group/btn"
                           title="Detailed Intelligence"
                         >
                           <Eye className="w-4 h-4" />
                         </button>
                         <button 
                           className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all transform hover:scale-110 active:scale-95 group/btn"
                           title="Edit Clearances"
                         >
                           <Edit2 className="w-4 h-4" />
                         </button>
                         <button 
                           className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all transform hover:scale-110 active:scale-95 group/btn"
                           title="Suspend Sector"
                         >
                           <Ban className="w-4 h-4" />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedCustomerId && (
          <CustomerDetailsModal 
            customerId={selectedCustomerId} 
            onClose={() => setSelectedCustomerId(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};


