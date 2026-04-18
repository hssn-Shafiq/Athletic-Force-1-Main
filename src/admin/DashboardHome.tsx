
"use client";

import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  LineChart, Line
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Target,
  TrendingUp,
  PackageCheck
} from 'lucide-react';

const MOCK_SALES_DATA = [
  { name: 'Mon', sales: 4000, orders: 240 },
  { name: 'Tue', sales: 3000, orders: 198 },
  { name: 'Wed', sales: 2000, orders: 150 },
  { name: 'Thu', sales: 2780, orders: 190 },
  { name: 'Fri', sales: 1890, orders: 120 },
  { name: 'Sat', sales: 2390, orders: 170 },
  { name: 'Sun', sales: 3490, orders: 210 },
];

const StatCard: React.FC<{ 
  title: string; 
  value: string; 
  change: string; 
  isPositive: boolean; 
  icon: any;
  color: string;
}> = ({ title, value, change, isPositive, icon: Icon, color }) => (
  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4 hover:shadow-xl transition-all group">
    <div className="flex items-center justify-between">
      <div className={`p-4 rounded-2xl ${color} rotate-[-5deg] group-hover:rotate-0 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        <span>{change}</span>
      </div>
    </div>
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">{title}</p>
      <h4 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">{value}</h4>
    </div>
  </div>
);

export const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            Force Insights
          </h1>
          <p className="text-slate-400 font-medium italic">Welcome back, Commander. Here's your mission status.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          {['24H', '7D', '30D', '1Y'].map(t => (
            <button key={t} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all ${
              t === '7D' ? "bg-black text-white shadow-lg" : "text-slate-400 hover:text-black"
            }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value="$128,430" 
          change="+12.5%" 
          isPositive={true} 
          icon={DollarSign} 
          color="bg-black"
        />
        <StatCard 
          title="Direct Orders" 
          value="1,420" 
          change="+8.2%" 
          isPositive={true} 
          icon={ShoppingCart} 
          color="bg-orange-600"
        />
        <StatCard 
          title="Request Forms" 
          value="450" 
          change="-2.4%" 
          isPositive={false} 
          icon={Target} 
          color="bg-slate-400"
        />
        <StatCard 
          title="Conversion" 
          value="4.2%" 
          change="+1.1%" 
          isPositive={true} 
          icon={TrendingUp} 
          color="bg-[#FF7348]"
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
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Orders</span>
              </div>
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_SALES_DATA}>
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
          </div>
        </div>

        {/* Top Products / Vendor Status */}
        <div className="bg-black rounded-[40px] p-10 text-white space-y-8 relative overflow-hidden group">
          <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-orange-600 rounded-full blur-[100px] opacity-20 group-hover:scale-125 transition-transform" />
          
          <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white relative z-10 font-bold">
            Live Action List
          </h3>

          <div className="space-y-6 relative z-10">
            {[
              { label: 'Elite Pro Jersey', price: '$85.00', qty: 24, status: 'In Stock' },
              { label: 'Varsity 7v7 Pack', price: '$240.00', qty: 12, status: 'Low Stock' },
              { label: 'Force Arm Sleeves', price: '$22.00', qty: 156, status: 'Active' },
              { label: 'Player Mouthguards', price: '$15.00', qty: 89, status: 'Active' },
            ].map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                <div>
                  <h5 className="font-black italic uppercase tracking-tighter text-sm line-clamp-1">{p.label}</h5>
                  <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">{p.status} • {p.qty} Units</p>
                </div>
                <div className="text-right">
                  <p className="text-orange-500 font-black italic text-sm">{p.price}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full bg-white text-black py-4 rounded-3xl font-black uppercase italic tracking-tighter text-xs hover:scale-105 transition-all relative z-10 shadow-xl">
            View Inventory Management
          </button>
        </div>
      </div>
    </div>
  );
};
