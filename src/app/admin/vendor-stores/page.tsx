'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { 
  Store, Search, Eye, Edit, ChevronLeft, ChevronRight, 
  CheckCircle, XCircle, Clock, PauseCircle, Trash2, Filter, Loader2,
  Percent
} from 'lucide-react';
import { 
  adminGetVendorStoresApi, 
  adminUpdateVendorStoreStatusApi, 
  adminDeleteVendorStoreApi, 
  AdminVendorStoreListResponse 
} from '@/lib/api/vendorStores';

export default function AdminVendorStoresPage() {
  const [data, setData] = useState<AdminVendorStoreListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'new' | 'old'>('new');
  
  // Search debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGetVendorStoresApi({
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
        page,
        pageSize: 20,
        sort
      });
      if (res?.ok) setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, page, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this store application? This action cannot be undone.')) return;
    try {
      const res = await adminDeleteVendorStoreApi(id);
      if (res?.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete store.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-max"><Clock className="w-3 h-3"/> Pending</span>;
      case 'approved': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-max"><CheckCircle className="w-3 h-3"/> Active</span>;
      case 'rejected': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-max"><XCircle className="w-3 h-3"/> Rejected</span>;
      case 'paused': return <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-max"><PauseCircle className="w-3 h-3"/> Paused</span>;
      default: return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest w-max">{status}</span>;
    }
  };

  const StatusCard = ({ title, count, colorClass, icon: Icon, active, onClick }: any) => (
    <div 
      onClick={onClick}
      className={`p-6 rounded-[24px] border cursor-pointer transition-all ${
        active ? `${colorClass} shadow-lg scale-[1.02]` : 'bg-white border-slate-100 hover:border-slate-300'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${active ? 'bg-white/20' : 'bg-slate-50'}`}>
          <Icon className={`w-6 h-6 ${active ? 'text-white' : 'text-slate-500'}`} />
        </div>
        <span className={`text-3xl font-black italic tracking-tighter ${active ? 'text-white' : 'text-slate-900'}`}>
          {count}
        </span>
      </div>
      <p className={`text-[11px] font-black uppercase tracking-[0.2em] italic ${active ? 'text-white/80' : 'text-slate-400'}`}>
        {title}
      </p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 leading-none mb-2">
            Vendor <span className="text-orange-600">Stores</span>
          </h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">
            Command Center / Ecosystem Partners
          </p>
        </div>

        <Link
          href="/admin/vendor-stores/commissions"
          className="flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Percent className="w-4 h-4" /> Platform Profits &amp; Commissions
        </Link>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatusCard 
          title="All" 
          count={data?.counts?.all || 0} 
          icon={Store} 
          colorClass="bg-black text-white border-black"
          active={statusFilter === ''}
          onClick={() => { setStatusFilter(''); setPage(1); }}
        />
        <StatusCard 
          title="Pending" 
          count={data?.counts?.pending || 0} 
          icon={Clock} 
          colorClass="bg-amber-500 border-amber-500"
          active={statusFilter === 'pending'}
          onClick={() => { setStatusFilter('pending'); setPage(1); }}
        />
        <StatusCard 
          title="Active/Approved" 
          count={data?.counts?.approved || 0} 
          icon={CheckCircle} 
          colorClass="bg-emerald-500 border-emerald-500"
          active={statusFilter === 'approved'}
          onClick={() => { setStatusFilter('approved'); setPage(1); }}
        />
        <StatusCard 
          title="Paused" 
          count={data?.counts?.paused || 0} 
          icon={PauseCircle} 
          colorClass="bg-slate-700 border-slate-700"
          active={statusFilter === 'paused'}
          onClick={() => { setStatusFilter('paused'); setPage(1); }}
        />
        <StatusCard 
          title="Rejected" 
          count={data?.counts?.rejected || 0} 
          icon={XCircle} 
          colorClass="bg-red-500 border-red-500"
          active={statusFilter === 'rejected'}
          onClick={() => { setStatusFilter('rejected'); setPage(1); }}
        />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search stores, vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-wider outline-none focus:border-black transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => setSort(s => s === 'new' ? 'old' : 'new')}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2"
          >
            Sort: {sort === 'new' ? 'Newest' : 'Oldest'}
          </button>
        </div>
      </div>

      {/* Stores Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Store Details</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Status</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Commission</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Submitted</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-bold italic">
                    No vendor stores found.
                  </td>
                </tr>
              ) : (
                data?.items.map((store) => (
                  <tr key={store.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                          {store.logoUrl ? (
                            <img src={store.logoUrl} alt={store.storeName} className="w-full h-full object-contain p-1" />
                          ) : (
                            <Store className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{store.storeName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{store.vendorName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      {getStatusBadge(store.status)}
                    </td>
                    <td className="p-6">
                      {store.isCommissionActive && (store.commissionRate ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                          <Percent className="w-2.5 h-2.5" /> {store.commissionRate}% Cut
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                          0% Free
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-xs font-bold text-slate-500 italic">
                      {new Date(store.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/admin/vendor-stores/${store.id}`}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link 
                          href={`/admin/vendor-stores/${store.id}?edit=true`}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-all shadow-sm"
                          title="Edit Store"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(store.id)}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm"
                          title="Delete Application"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                disabled={data.pagination.page === 1}
                onClick={() => setPage(p => p - 1)}
                className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-50 transition-all hover:bg-slate-50 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                disabled={data.pagination.page === data.pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-50 transition-all hover:bg-slate-50 shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
