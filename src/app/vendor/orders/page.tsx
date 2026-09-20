"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  RefreshCw,
  X,
  Loader2,
  Package,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  MapPin,
  User,
  Mail,
  Phone,
  Sliders,
  Send,
  ArrowUpRight
} from 'lucide-react';
import {
  getVendorOrdersApi,
  updateVendorOrderStatusApi,
  type VendorOrderDetail,
} from '@/lib/api/vendorDashboard';

const CARRIER_PRESETS = ['USPS', 'UPS', 'FedEx', 'DHL', 'Custom'];

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<VendorOrderDetail[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({
    all: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Fulfillment landscape modal state
  const [selectedOrder, setSelectedOrder] = useState<VendorOrderDetail | null>(null);
  const [modalStatus, setModalStatus] = useState<any>('processing');
  const [modalCarrier, setModalCarrier] = useState('');
  const [modalTracking, setModalTracking] = useState('');
  const [modalTrackingUrl, setModalTrackingUrl] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getVendorOrdersApi({
        status: statusTab !== 'all' ? statusTab : undefined,
        search: search || undefined,
        page,
        pageSize,
      });

      if (res?.ok) {
        setOrders(res.items);
        setCounts(res.counts);
        setTotalPages(res.pagination.totalPages);
        setTotalOrders(res.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchOrders, 300);
    return () => clearTimeout(timer);
  }, [statusTab, search, page, pageSize]);

  const openFulfillModal = (order: VendorOrderDetail) => {
    setSelectedOrder(order);
    setModalStatus(order.status);
    setModalCarrier(order.carrier || '');
    setModalTracking(order.trackingNumber || '');
    setModalTrackingUrl(order.trackingUrl || '');
    setModalNotes(order.notes || '');
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    try {
      const res = await updateVendorOrderStatusApi(selectedOrder.id, {
        status: modalStatus,
        carrier: modalCarrier.trim() || undefined,
        trackingNumber: modalTracking.trim() || undefined,
        trackingUrl: modalTrackingUrl.trim() || undefined,
        notes: modalNotes.trim() || undefined,
      });

      if (res?.ok) {
        setSelectedOrder(null);
        fetchOrders();
      } else {
        alert(res?.message || 'Failed to update order');
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const tabs = [
    { key: 'all', label: 'All Orders' },
    { key: 'pending', label: 'Pending' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/25">
            <Truck className="w-3 h-3" /> Shipped
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/25">
            <Package className="w-3 h-3" /> Processing
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/25">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/25">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF7348] italic">
            Fulfillment Logistics
          </span>
          <h1 className="text-3xl font-black italic uppercase tracking-tight text-white mt-1">
            Vendor Orders ({counts.all || 0})
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Track customer orders, manage shipments, and dispatch tracking to your buyers.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* ── Status Tabs & Search Filter ──────────────────────────────────── */}
      <div className="space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const count = counts[tab.key] ?? 0;
            const isActive = statusTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusTab(tab.key);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#FF7348] text-black shadow-lg shadow-orange-500/20 font-black'
                    : 'bg-[#151921] hover:bg-white/5 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                    isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="p-3.5 rounded-2xl bg-[#151921] border border-white/10 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by sub-order #, product name, or tracking #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* ── Orders Table Layout ─────────────────────────────────────────── */}
      <div className="bg-[#151921] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="p-5 text-[11px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  Sub-Order ID
                </th>
                <th className="p-5 text-[11px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  Customer &amp; Shipping
                </th>
                <th className="p-5 text-[11px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  Items Ordered
                </th>
                <th className="p-5 text-[11px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  Financials (Net)
                </th>
                <th className="p-5 text-[11px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  Status &amp; Tracking
                </th>
                <th className="p-5 text-[11px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FF7348] mb-2" />
                    <span className="text-xs font-bold uppercase tracking-widest">Loading orders...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-slate-500 mb-3">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-300 italic">No vendor orders found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {search ? 'Try clearing your search criteria.' : 'New orders will automatically appear here once buyers checkout.'}
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const custName = o.customer?.name || (o.shippingAddress ? `${o.shippingAddress.firstName || ''} ${o.shippingAddress.lastName || ''}`.trim() : 'Customer');
                  const location = o.shippingAddress
                    ? [o.shippingAddress.city, o.shippingAddress.state, o.shippingAddress.country].filter(Boolean).join(', ')
                    : 'Standard Delivery';

                  return (
                    <tr key={o.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Sub-Order & Date */}
                      <td className="p-5 whitespace-nowrap min-w-[170px]">
                        <span className="font-mono text-xs font-black tracking-wider text-white bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/10 inline-block shadow-sm">
                          {o.subOrderNumber}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 block mt-2">
                          {new Date(o.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </td>

                      {/* Customer & Destination */}
                      <td className="p-5 min-w-[180px]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[#FF7348]">
                            <User className="w-3 h-3" />
                          </div>
                          <span className="text-xs font-bold text-white truncate max-w-[150px]">
                            {custName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5 truncate max-w-[180px]">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{location}</span>
                        </div>
                      </td>

                      {/* Items Ordered */}
                      <td className="p-5 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 p-1">
                            {o.items[0]?.imageUrl ? (
                              <img src={o.items[0].imageUrl} alt={o.items[0].name} className="w-full h-full object-contain" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate max-w-[160px]" title={o.items[0]?.name}>
                              {o.items[0]?.name || 'Vendor Product'}
                            </p>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-bold text-slate-300 mt-1 border border-white/5">
                              {o.items.reduce((s, it) => s + it.quantity, 0)} unit(s)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Financials */}
                      <td className="p-5 whitespace-nowrap min-w-[140px]">
                        <div className="text-sm font-black text-emerald-400 tracking-tight">
                          +${o.vendorNetEarnings.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                          Sale: ${o.subtotal.toFixed(2)}
                          {o.platformFee > 0 && (
                            <span className="text-slate-500 font-normal"> • -${o.platformFee.toFixed(2)} fee</span>
                          )}
                        </div>
                      </td>

                      {/* Status & Tracking */}
                      <td className="p-5 whitespace-nowrap min-w-[150px]">
                        <div>{getStatusBadge(o.status)}</div>
                        {o.trackingNumber ? (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-slate-300">
                            <Truck className="w-3 h-3 text-slate-500" />
                            <span>{o.carrier ? `${o.carrier}: ` : ''}{o.trackingNumber}</span>
                            {o.trackingUrl && (
                              <a
                                href={o.trackingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#FF7348] hover:text-white"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mt-1.5">
                            Unfulfilled
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => openFulfillModal(o)}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-[#FF7348] hover:text-black text-white text-xs font-black uppercase tracking-wider transition-all shadow-sm border border-white/10 hover:border-[#FF7348] inline-flex items-center gap-1.5 active:scale-95"
                        >
                          <Sliders className="w-3.5 h-3.5" /> Fulfill
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar - Always Visible */}
        <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 bg-white/[0.01]">
          {/* Left: Summary text + Rows per page */}
          <div className="flex items-center gap-4">
            <span className="font-medium text-slate-400">
              Showing <strong className="text-white font-black">{totalOrders === 0 ? 0 : (page - 1) * pageSize + 1}</strong> to{' '}
              <strong className="text-white font-black">{Math.min(page * pageSize, totalOrders)}</strong> of{' '}
              <strong className="text-white font-black">{totalOrders}</strong> orders
            </span>

            <div className="flex items-center gap-2 pl-4 border-l border-white/10">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Per Page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-[#0B0E14] border border-white/10 text-white rounded-xl px-2.5 py-1 text-xs font-bold outline-none focus:border-[#FF7348] cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Right: Page numbers & Navigation buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-25 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>

            {/* Page Number Buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-1 text-slate-600">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                        page === p
                          ? 'bg-[#FF7348] text-black shadow-md shadow-orange-500/20'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-25 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Wide Landscape Fulfillment Modal ────────────────────────────── */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Wide Landscape Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-[#11141B] w-full max-w-5xl rounded-[36px] border border-white/15 p-6 sm:p-8 shadow-2xl z-10 my-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FF7348]/10 border border-[#FF7348]/20 flex items-center justify-center text-[#FF7348]">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-2xl font-black uppercase italic tracking-tight text-white">
                        {selectedOrder.subOrderNumber}
                      </h3>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Order Placed on{' '}
                      {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 2-Column Wide Landscape Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ── Left Column (5 cols): Order & Delivery Details ── */}
                <div className="lg:col-span-5 space-y-5 bg-black/40 p-6 rounded-3xl border border-white/5">
                  {/* Customer & Shipping Information */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF7348] mb-3 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> Shipping Destination
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <p className="font-black text-white text-sm">
                        {selectedOrder.customer?.name ||
                          (selectedOrder.shippingAddress
                            ? `${selectedOrder.shippingAddress.firstName || ''} ${selectedOrder.shippingAddress.lastName || ''}`.trim()
                            : 'Customer')}
                      </p>
                      {selectedOrder.customer?.email && (
                        <p className="text-slate-400 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-500" /> {selectedOrder.customer.email}
                        </p>
                      )}
                      {selectedOrder.shippingAddress && (
                        <div className="pt-2 text-slate-300 space-y-0.5 leading-relaxed">
                          <p>{selectedOrder.shippingAddress.address1}</p>
                          {selectedOrder.shippingAddress.address2 && (
                            <p>{selectedOrder.shippingAddress.address2}</p>
                          )}
                          <p>
                            {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{' '}
                            {selectedOrder.shippingAddress.postalCode}
                          </p>
                          <p className="font-bold text-white uppercase text-[11px]">
                            {selectedOrder.shippingAddress.country || 'US'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items Ordered */}
                  <div className="pt-4 border-t border-white/10">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
                      <Package className="w-3.5 h-3.5" /> Ordered Items ({selectedOrder.items.length})
                    </h4>
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {selectedOrder.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3"
                        >
                          <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 overflow-hidden shrink-0">
                            {it.imageUrl ? (
                              <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-black italic text-xs text-white truncate">{it.name}</p>
                            <p className="text-[10px] text-slate-400">
                              Qty: {it.quantity} &bull; ${(it.price * it.quantity).toFixed(2)}
                            </p>
                            {(it.color || it.size) && (
                              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-white/10 text-[9px] font-mono text-slate-300">
                                {it.color} {it.size ? `/ Size ${it.size}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial Breakdown Card */}
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Subtotal Sale</span>
                      <span className="font-bold text-white">${selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Platform Fee ({selectedOrder.commissionRate}%)</span>
                      <span className="text-red-400 font-bold">-${selectedOrder.platformFee.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-emerald-500/20 flex justify-between items-center text-sm font-black italic">
                      <span className="text-white">Your Net Earnings</span>
                      <span className="text-emerald-400">+${selectedOrder.vendorNetEarnings.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* ── Right Column (7 cols): Fulfillment Controls ── */}
                <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
                  <div className="space-y-5">
                    {/* Status Selector */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic mb-2 block">
                        Update Fulfillment Status
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { val: 'pending', label: 'Pending', icon: Clock },
                          { val: 'processing', label: 'Processing', icon: Package },
                          { val: 'shipped', label: 'Shipped', icon: Truck },
                          { val: 'delivered', label: 'Delivered', icon: CheckCircle2 },
                        ].map((st) => (
                          <button
                            key={st.val}
                            type="button"
                            onClick={() => setModalStatus(st.val)}
                            className={`p-3 rounded-2xl border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                              modalStatus === st.val
                                ? 'bg-[#FF7348] text-black border-[#FF7348] shadow-lg shadow-orange-500/20'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <st.icon className="w-3.5 h-3.5" />
                            <span>{st.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Carrier with Quick Presets */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">
                          Shipping Carrier
                        </label>
                        <div className="flex items-center gap-1.5">
                          {CARRIER_PRESETS.map((cp) => (
                            <button
                              key={cp}
                              type="button"
                              onClick={() => setModalCarrier(cp === 'Custom' ? '' : cp)}
                              className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition-colors ${
                                modalCarrier === cp
                                  ? 'bg-[#FF7348] text-black'
                                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
                              }`}
                            >
                              {cp}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. USPS, FedEx, UPS, DHL..."
                        value={modalCarrier}
                        onChange={(e) => setModalCarrier(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF7348]"
                      />
                    </div>

                    {/* Tracking Number & URL in Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic mb-2 block">
                          Tracking Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 9400100000000000000000"
                          value={modalTracking}
                          onChange={(e) => setModalTracking(e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#FF7348]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic mb-2 block">
                          Tracking URL (Optional)
                        </label>
                        <input
                          type="url"
                          placeholder="https://tools.usps.com/..."
                          value={modalTrackingUrl}
                          onChange={(e) => setModalTrackingUrl(e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF7348]"
                        />
                      </div>
                    </div>

                    {/* Internal Notes */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic mb-2 block">
                        Internal Logistics Notes (Optional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Notes on custom prints, packing slips, or handover..."
                        value={modalNotes}
                        onChange={(e) => setModalNotes(e.target.value)}
                        className="w-full p-3.5 bg-white/5 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF7348]"
                      />
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-6 border-t border-white/10 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={handleUpdateStatus}
                      className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#FF7348] hover:bg-[#ff8660] text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Save &amp; Dispatch
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
