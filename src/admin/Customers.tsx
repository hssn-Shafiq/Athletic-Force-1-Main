
"use client";

import React, { useCallback, useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  DollarSign,
  Eye,
  Edit2,
  Plus,
  ShoppingBag,
  MapPin,
  Calendar,
  X,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { getApiErrorMessage } from '@/lib/api/errors';
import { motion, AnimatePresence } from 'motion/react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  categories: Array<'direct' | 'request' | '3d' | 'manual'>;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  isRegistered: boolean;
  isManual: boolean;
  manualCustomerId?: string;
  billingAddress?: CustomerAddress;
  shippingAddress?: CustomerAddress;
  notes?: string;
}

interface CustomerAddress {
  label?: string;
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  isDefault?: boolean;
}

type CustomerAddressField = Exclude<keyof CustomerAddress, 'isDefault'>;

interface CustomerOrder {
  _id: string;
  status: string;
  total: number;
  createdAt: string;
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  billingAddress: CustomerAddress;
  shippingAddress: CustomerAddress;
  notes: string;
}

interface DetailedCustomer extends Customer {
  savedAddresses: CustomerAddress[];
}

interface CustomerDetailsResponse {
  ok: boolean;
  customer: DetailedCustomer;
  orders: CustomerOrder[];
}

const CustomerDetailsModal: React.FC<{ 
  customerId: string; 
  onClose: () => void;
}> = ({ customerId, onClose }) => {
  const [data, setData] = useState<CustomerDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await apiClient.get<CustomerDetailsResponse>(`/api/admin/customers/${customerId}`);
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
                      {data?.customer.isRegistered ? 'Registered' : data?.customer.isManual ? 'Manual contact' : 'Guest buyer'}
                    </span>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic px-2 flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-orange-500" /> Intelligence Nodes (Addresses)
                  </h4>
                  {(data?.customer.savedAddresses ?? []).length === 0 && !data?.customer.billingAddress && !data?.customer.shippingAddress ? (
                    <div className="text-center py-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase italic">No saved nodes found.</p>
                    </div>
                  ) : (
                    <>
                    {data?.customer.billingAddress && (
                      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                        <span className="bg-black text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md italic">Billing</span>
                        <p className="text-xs font-bold text-slate-900 mt-2">{data.customer.name}</p>
                        <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase italic">
                          {data.customer.billingAddress.address1}, {data.customer.billingAddress.city}<br />
                          {data.customer.billingAddress.state} {data.customer.billingAddress.postalCode}, {data.customer.billingAddress.country}
                        </p>
                      </div>
                    )}
                    {data?.customer.shippingAddress && (
                      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                        <span className="bg-black text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md italic">Shipping</span>
                        <p className="text-xs font-bold text-slate-900 mt-2">{data.customer.name}</p>
                        <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase italic">
                          {data.customer.shippingAddress.address1}, {data.customer.shippingAddress.city}<br />
                          {data.customer.shippingAddress.state} {data.customer.shippingAddress.postalCode}, {data.customer.shippingAddress.country}
                        </p>
                      </div>
                    )}
                    {data?.customer.savedAddresses.map((addr, i) => (
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
                    ))}
                    </>
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
                   data?.orders.map((order) => (
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
        </div>
      </motion.div>
    </div>
  );
};

const emptyAddress: CustomerAddress = { country: 'US' };

function getCustomerFormData(customer: Customer | null): CustomerFormData {
  return {
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    billingAddress: customer?.billingAddress || { ...emptyAddress },
    shippingAddress: customer?.shippingAddress || { ...emptyAddress },
    notes: customer?.notes || '',
  };
}

const ManualCustomerModal: React.FC<{
  customer: Customer | null;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSave: (formData: CustomerFormData) => Promise<void>;
}> = ({ customer, isSaving, error, onClose, onSave }) => {
  const [formData, setFormData] = useState<CustomerFormData>(() => getCustomerFormData(customer));

  const updateAddress = (kind: 'billingAddress' | 'shippingAddress', field: CustomerAddressField, value: string) => {
    setFormData((current) => ({
      ...current,
      [kind]: { ...current[kind], [field]: value },
    }));
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button aria-label="Close customer form" onClick={onClose} className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSave(formData);
        }}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[32px] bg-white p-7 shadow-2xl"
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tight text-slate-900">
              {customer ? 'Edit Manual Customer' : 'Add Manual Customer'}
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">Contact record only; no storefront login is created.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Name *
            <input required maxLength={200} value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 normal-case tracking-normal text-slate-900 outline-none focus:border-orange-500" />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Email *
            <input required type="email" maxLength={320} value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 normal-case tracking-normal text-slate-900 outline-none focus:border-orange-500" />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 sm:col-span-2">
            Phone
            <input maxLength={50} value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 normal-case tracking-normal text-slate-900 outline-none focus:border-orange-500" />
          </label>
        </div>

        {(['billingAddress', 'shippingAddress'] as const).map((kind) => (
          <section key={kind} className="mt-6">
            <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-800">
              {kind === 'billingAddress' ? 'Billing address' : 'Shipping address'}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                ['address1', 'Address line 1'],
                ['address2', 'Address line 2'],
                ['city', 'City'],
                ['state', 'State'],
                ['postalCode', 'Postal code'],
                ['country', 'Country'],
              ] as Array<[CustomerAddressField, string]>).map(([field, label]) => (
                <label key={field} className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {label}
                  <input value={formData[kind][field] || ''} onChange={(event) => updateAddress(kind, field, event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 normal-case tracking-normal text-slate-900 outline-none focus:border-orange-500" />
                </label>
              ))}
            </div>
          </section>
        ))}

        <label className="mt-6 block text-xs font-bold uppercase tracking-wider text-slate-500">
          Admin notes
          <textarea maxLength={2000} rows={3} value={formData.notes} onChange={(event) => setFormData({ ...formData, notes: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 normal-case tracking-normal text-slate-900 outline-none focus:border-orange-500" />
        </label>

        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-600">Cancel</button>
          <button disabled={isSaving} className="rounded-xl bg-orange-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
            {isSaving ? 'Saving…' : customer ? 'Save changes' : 'Create customer'}
          </button>
        </div>
      </form>
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
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'request' | '3d' | 'manual'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [customerFormError, setCustomerFormError] = useState('');

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<{ ok: boolean; customers: Customer[] }>('/api/admin/customers', { params: { search } });
      if (res.data.ok) {
        setCustomers(res.data.customers);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchCustomers(), 400);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const filteredCustomers = customers.filter(c => {
    return activeTab === 'all' || c.categories.includes(activeTab);
  });

  const openCustomerForm = (customer: Customer | null = null) => {
    setEditingCustomer(customer);
    setCustomerFormError('');
    setIsCustomerModalOpen(true);
  };

  const saveManualCustomer = async (formData: CustomerFormData) => {
    setIsSavingCustomer(true);
    setCustomerFormError('');
    try {
      if (editingCustomer?.manualCustomerId) {
        await apiClient.patch(`/api/admin/customers/manual/${editingCustomer.manualCustomerId}`, formData);
      } else {
        await apiClient.post('/api/admin/customers/manual', formData);
      }
      setIsCustomerModalOpen(false);
      setEditingCustomer(null);
      await fetchCustomers();
    } catch (error) {
      setCustomerFormError(getApiErrorMessage(error, 'Unable to save this customer. Please try again.'));
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const deleteManualCustomer = async (customer: Customer) => {
    if (!customer.manualCustomerId) return;
    if (!window.confirm(`Remove the admin-created contact for ${customer.name}? Order and account records will remain.`)) return;

    try {
      await apiClient.delete(`/api/admin/customers/manual/${customer.manualCustomerId}`);
      await fetchCustomers();
    } catch (error) {
      console.error('Failed to remove manual customer contact:', error);
      window.alert('Unable to remove this manual customer contact.');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Customer Directory</h1>
          <p className="text-slate-400 font-medium italic text-sm">Registered accounts, order buyers, and admin-created contacts.</p>
        </div>
        <div className="flex flex-col items-stretch gap-3 md:items-end">
          <button onClick={() => openCustomerForm()} className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700">
            <Plus className="h-4 w-4" /> Add Customer
          </button>
          <div className="flex flex-wrap gap-1.5 rounded-[22px] border border-slate-200/50 bg-slate-100 p-1.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'direct', label: 'Direct Orders' },
              { id: 'request', label: 'Request Form' },
              { id: '3d', label: '3D Product' },
              { id: 'manual', label: 'Manual' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`rounded-2xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest italic transition-all ${
                  activeTab === tab.id ? 'bg-white text-black shadow-lg shadow-black/5' : 'text-slate-400 hover:text-black'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
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
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                {filteredCustomers.length} {activeTab === 'all' ? 'customers' : `${activeTab} customers`}
              </span>
           </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Personnel Name</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Categories</th>
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
                         <span className={`text-[10px] font-black uppercase tracking-widest italic ${customer.isRegistered ? 'text-green-600' : customer.isManual ? 'text-blue-600' : 'text-orange-600'}`}>
                           {customer.isRegistered ? 'Registered' : customer.isManual ? 'Manual contact' : 'Guest buyer'}
                         </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {customer.categories.map((category) => (
                          <span key={category} className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-slate-600">
                            {category === '3d' ? '3D Product' : category === 'request' ? 'Request Form' : category === 'direct' ? 'Direct Order' : 'Manual'}
                          </span>
                        ))}
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
                         {customer.manualCustomerId && (
                           <>
                             <button
                               onClick={() => openCustomerForm(customer)}
                               className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all transform hover:scale-110 active:scale-95"
                               title="Edit manual contact"
                             >
                               <Edit2 className="w-4 h-4" />
                             </button>
                             <button
                               onClick={() => void deleteManualCustomer(customer)}
                               className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all transform hover:scale-110 active:scale-95"
                               title="Remove manual contact"
                             >
                               <X className="w-4 h-4" />
                             </button>
                           </>
                         )}
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
      {isCustomerModalOpen && (
        <ManualCustomerModal
          key={editingCustomer?.manualCustomerId || 'new'}
          customer={editingCustomer}
          isSaving={isSavingCustomer}
          error={customerFormError}
          onClose={() => {
            if (isSavingCustomer) return;
            setIsCustomerModalOpen(false);
            setEditingCustomer(null);
          }}
          onSave={saveManualCustomer}
        />
      )}
    </div>
  );
};


