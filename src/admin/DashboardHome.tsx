"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  ShoppingCart, 
  Target,
  TrendingUp,
  PackageCheck,
  Eye,
  Package
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';

const StatCard: React.FC<{ 
  title: string; 
  value: string; 
  change?: string; 
  isPositive?: boolean; 
  icon: any;
  color: string;
  isLoading: boolean;
}> = ({ title, value, change, isPositive, icon: Icon, color, isLoading }) => (
  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4 hover:shadow-xl transition-all group">
    <div className="flex items-center justify-between">
      <div className={`p-4 rounded-2xl ${color} rotate-[-5deg] group-hover:rotate-0 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {change && (
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          <span>{change}</span>
        </div>
      )}
    </div>
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">{title}</p>
      {isLoading ? (
        <Skeleton className="h-10 w-32 mt-2" />
      ) : (
        <h4 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">{value}</h4>
      )}
    </div>
  </div>
);

export const AdminDashboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState('7D');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>({
    metrics: { totalRevenue: 0, totalOrders: 0 },
    chartData: [],
    topProducts: [],
    recentOrders: []
  });

  useEffect(() => {
    const fetchInsights = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get(`/api/orders/admin/insights?range=${timeframe}`);
        if (res.data.ok) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch insights', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInsights();
  }, [timeframe]);

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
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            Force Insights
          </h1>
          <p className="text-slate-400 font-medium italic">Welcome back, Commander. Here's your operational status.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          {['24H', '7D', '30D', '1Y'].map(t => (
            <button 
              key={t} 
              onClick={() => setTimeframe(t)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all ${
                timeframe === t ? "bg-black text-white shadow-lg" : "text-slate-400 hover:text-black"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        <StatCard 
          title="Total Revenue (Completed)" 
          value={`$${(data.metrics.totalRevenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
          icon={DollarSign} 
          color="bg-black"
          isLoading={isLoading}
        />
        <StatCard 
          title="Direct Orders (Completed)" 
          value={(data.metrics.totalOrders || 0).toLocaleString()} 
          icon={ShoppingCart} 
          color="bg-orange-600"
          isLoading={isLoading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
              <PackageCheck className="w-6 h-6 text-orange-600" />
              Sales Velocity
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sales</span>
              </div>
            </div>
          </div>
          <div className="h-[400px]">
            {isLoading ? (
               <Skeleton className="w-full h-full rounded-2xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} 
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#ea580c" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorSales)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Products / Vendor Status */}
        <div className="bg-black rounded-[40px] p-10 text-white space-y-8 relative overflow-hidden group">
          <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-orange-600 rounded-full blur-[100px] opacity-20 group-hover:scale-125 transition-transform" />
          
          <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white relative z-10 font-bold">
            Top Selling Products
          </h3>

          <div className="space-y-6 relative z-10">
            {isLoading ? (
               Array.from({length: 4}).map((_, i) => (
                 <div key={i} className="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-2xl">
                   <div className="space-y-2 w-1/2">
                     <Skeleton className="h-4 w-full bg-white/20" />
                     <Skeleton className="h-3 w-2/3 bg-white/20" />
                   </div>
                   <Skeleton className="h-4 w-12 bg-white/20" />
                 </div>
               ))
            ) : data.topProducts.length === 0 ? (
               <p className="text-sm text-slate-400 font-bold italic py-8 text-center">No sales in this timeframe.</p>
            ) : (
              data.topProducts.map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                  <div className="flex-1 pr-4">
                    <h5 className="font-black italic uppercase tracking-tighter text-sm line-clamp-1">{p.label}</h5>
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">
                      <span className={p.status === 'Active' ? 'text-green-400' : p.status === 'Low Stock' ? 'text-orange-400' : 'text-red-400'}>
                        {p.status}
                      </span> 
                      &nbsp;• {p.qty} Sold
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-orange-500 font-black italic text-sm">{p.price}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link href="/admin/products" className="block text-center w-full bg-white text-black py-4 rounded-3xl font-black uppercase italic tracking-tighter text-xs hover:scale-105 transition-all relative z-10 shadow-xl">
            View Inventory Management
          </Link>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">
            Recent Orders Activity
          </h3>
          <Link href="/admin/orders" className="text-xs font-black uppercase tracking-widest text-orange-600 hover:text-black italic transition-colors">
            View All orders
          </Link>
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
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-4 px-6"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-4 px-6"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-6"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="py-4 px-6 flex justify-end"><Skeleton className="h-4 w-16" /></td>
                  </tr>
                ))
              ) : data.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm font-black uppercase tracking-widest">No active orders</p>
                  </td>
                </tr>
              ) : (
                data.recentOrders.map((order: any) => (
                  <tr key={order.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
                    <td className="py-4 px-6">
                      <Link href={`/admin/orders/${order.id}`} className="text-sm font-bold text-orange-600 hover:text-black transition-colors">
                        #{order.id.slice(-6).toUpperCase()}
                      </Link>
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
                      <span className="text-sm font-black italic text-slate-900">${order.total.toFixed(2)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
