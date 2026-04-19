
"use client";

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  MoreVertical, 
  Eye, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  Phone,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';

interface Order {
  id: string;
  customer: { name: string; email: string };
  date: string;
  total: string;
  status: 'Paid' | 'Pending' | 'Shipped' | 'Cancelled';
  type: 'Direct' | 'Request';
}

const MOCK_ORDERS: Order[] = [
  { id: 'ORD-8921', customer: { name: 'Alex Sanders', email: 'alex@example.com' }, date: 'Oct 12, 2024', total: '$249.00', status: 'Paid', type: 'Direct' },
  { id: 'REQ-4402', customer: { name: 'Coach Miller', email: 'miller@tigers.com' }, date: 'Oct 11, 2024', total: 'Pending Quote', status: 'Pending', type: 'Request' },
  { id: 'ORD-8920', customer: { name: 'Sarah Chen', email: 'sarah.c@gmail.com' }, date: 'Oct 10, 2024', total: '$85.00', status: 'Shipped', type: 'Direct' },
  { id: 'REQ-4401', customer: { name: 'Derek James', email: 'derek@hawks.edu' }, date: 'Oct 09, 2024', total: 'Quoted', status: 'Paid', type: 'Request' },
];

export const AdminOrderList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'request'>('all');

  const filteredOrders = MOCK_ORDERS.filter(order => {
    if (activeTab === 'all') return true;
    return order.type.toLowerCase() === activeTab;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            Mission Operations
          </h1>
          <p className="text-slate-400 font-medium italic text-sm">Tracking all active checkouts and custom inquiries.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          {(['all', 'direct', 'request'] as const).map(t => (
            <button 
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all ${
                activeTab === t ? "bg-black text-white shadow-lg" : "text-slate-400 hover:text-black"
              }`}
            >
              {t === 'all' ? 'All Units' : t === 'direct' ? 'Direct Orders' : 'Inquiry Requests'}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Brief */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Unprocessed Requests', value: '12', color: 'bg-orange-600', icon: Mail },
          { label: 'Pending Shipments', value: '45', color: 'bg-black', icon: Clock },
          { label: 'Revenue (MTD)', value: '$42,850', color: 'bg-[#FF7348]', icon: CheckCircle2 },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
            <div>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest italic">{stat.label}</p>
              <h4 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">{stat.value}</h4>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center rotate-[-5deg]`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto no-scrollbar">
        <table className="w-full text-left min-w-[900px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-50">
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Reference ID</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Customer Detail</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Operational Type</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Total Value</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Status</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-8 py-6 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${order.type === 'Request' ? 'bg-orange-600' : 'bg-black'} shrink-0`}>
                    <ArrowUpRight className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-black italic tracking-tighter text-sm">{order.id}</span>
                </td>
                <td className="px-8 py-6">
                  <div>
                    <h5 className="font-black italic uppercase tracking-tighter text-slate-900 leading-none">{order.customer.name}</h5>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">{order.customer.email}</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`text-[10px] font-black uppercase tracking-widest italic ${
                    order.type === 'Request' ? 'text-orange-600' : 'text-slate-500'
                  }`}>
                    {order.type} Flow
                  </span>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-2">
                    <span className="font-black italic tracking-tighter text-slate-900">{order.total}</span>
                    {order.type === 'Request' && <ExternalLink className="w-3 h-3 text-slate-400" />}
                   </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      order.status === 'Paid' ? 'bg-green-500' : 
                      order.status === 'Shipped' ? 'bg-blue-500' : 
                      'bg-orange-500 animate-pulse'
                    }`} />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">{order.status}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <button className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:bg-black hover:text-white transition-all transform hover:scale-105 active:scale-95">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
