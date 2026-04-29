"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Loader2, Package, ChevronLeft, ChevronRight, Eye, Clock, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrdersListClient({ fixedType }: { fixedType?: 'direct' | 'request' }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'direct' | 'request'>(fixedType || 'direct');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const { data } = await apiClient.get('/api/orders/admin/notifications');
      if (data.ok) setStats(data.details);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        status: statusFilter,
        type: typeFilter,
        search: search.trim()
      });
      const { data } = await apiClient.get(`/api/orders/admin/all?${query}`);
      if (data.ok) {
        setOrders(data.orders);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, typeFilter]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchOrders();
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'delivered': return 'bg-slate-900 text-white border-black';
      case 'cancelled': case 'refunded': case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      case 'dev_bypass': case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            {typeFilter === 'direct' ? 'Direct Orders' : 'Custom Requests'}
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-2 italic">
            {typeFilter === 'direct' 
              ? 'Manage standardized inventory sales and shipping.' 
              : 'Analyze tactical custom requirements and issue specialized quotes.'}
          </p>
        </div>
      </div>

      {/* Analytics Brief */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoadingStats ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm">
              <Skeleton className="h-3 w-24 mb-4" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : (
          <>
            <div className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest italic">Active Quotes</p>
                <h4 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">{stats?.quotes || 0}</h4>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center rotate-[-5deg]">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest italic">Pending Orders</p>
                <h4 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">{stats?.orders || 0}</h4>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center rotate-[-5deg]">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest italic">Shipping Delays</p>
                <h4 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">{stats?.delays || 0}</h4>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#FF7348] flex items-center justify-center rotate-[-5deg]">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Type Tabs - Only show if not fixed */}
      {!fixedType && (
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
          <button
            onClick={() => { setTypeFilter('direct'); setPage(1); }}
            className={`px-8 py-3 rounded-xl text-xs font-black uppercase italic tracking-widest transition-all ${typeFilter === 'direct' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Direct Orders
          </button>
          <button
            onClick={() => { setTypeFilter('request'); setPage(1); }}
            className={`px-8 py-3 rounded-xl text-xs font-black uppercase italic tracking-widest transition-all ${typeFilter === 'request' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Custom Requests
          </button>
        </div>
      )}

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-12 pr-4 text-xs font-bold outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl py-2.5 px-4 outline-none focus:border-orange-500 focus:bg-white transition-all w-full md:w-auto cursor-pointer uppercase tracking-widest"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Order ID</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Customer</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Date</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Total</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-4 px-6"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-4 px-6"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-6"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="py-4 px-6 flex justify-end"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-4 px-6 text-center"><Skeleton className="h-8 w-8 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm font-black uppercase tracking-widest">No orders found</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
                    <td className="py-4 px-6 text-sm font-bold text-slate-900 border-r border-transparent group-hover:border-slate-200">
                      #{order.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-black text-slate-900 truncate max-w-[200px]">
                        {order.userId?.name || `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold truncate max-w-[200px]">
                        {order.userId?.email || order.guestEmail || order.shippingAddress.email}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-xs font-bold text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center justify-center px-3 py-1 text-[9px] font-black uppercase tracking-widest italic rounded-full border ${getStatusBadge(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="text-sm font-black italic text-orange-600">
                        {order.type === 'request' ? 'QUOTE PENDING' : `$${order.total.toFixed(2)}`}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Link 
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center justify-center p-2 bg-white border border-slate-200 rounded-lg hover:border-black hover:text-orange-600 transition-all shadow-sm"
                        title="View Order Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
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
