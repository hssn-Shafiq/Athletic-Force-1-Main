
"use client";

import React from 'react';
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  TrendingDown, 
  Package, 
  History,
  RotateCcw,
  RefreshCw,
  Box
} from 'lucide-react';

export const AdminInventory: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            Inventory Terminal
          </h1>
          <p className="text-slate-400 font-medium italic text-sm">Monitoring structural stock levels across the AF1 ecosystem.</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm">
            <RotateCcw className="w-5 h-5 text-slate-400" />
          </button>
          <button className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-xl">
            <Plus className="w-5 h-5" />
            <span>Adjust Stock</span>
          </button>
        </div>
      </div>

      {/* Analytics Brief */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Out of Stock', value: '14', color: 'bg-red-500', icon: AlertTriangle },
          { label: 'Low Stock Items', value: '28', color: 'bg-orange-500', icon: TrendingDown },
          { label: 'Total Units', value: '18,432', color: 'bg-black', icon: Box },
          { label: 'Stock Valuation', value: '$84.2K', color: 'bg-[#FF7348]', icon: Package },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm space-y-3">
             <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl ${stat.color} rotate-[-5deg]`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400">Total</span>
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest italic">{stat.label}</p>
              <h4 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
           <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Critical Units</h3>
           <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 focus-within:text-orange-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Filter by SKU or variant..." 
              className="bg-slate-50 border border-transparent focus:border-slate-200 focus:bg-white rounded-xl py-2 pl-12 pr-4 w-64 outline-none text-xs font-medium transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-200">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Item Info</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Variant</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Current Level</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Incoming</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Commitments</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[1, 2, 3, 4, 5].map((item) => (
                <tr key={item} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6">
                    <div>
                      <h5 className="font-black italic uppercase tracking-tighter text-slate-900 leading-none">Elite Compression Pack</h5>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">AF-ELT-PACK-00{item}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest italic">XL / Stealth Black</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${item % 2 === 0 ? 'bg-orange-500 w-1/4 animate-pulse' : 'bg-green-500 w-3/4'}`} />
                      </div>
                      <span className="font-black italic tracking-tighter text-sm">{item % 2 === 0 ? 12 : 145}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-400 italic">+200</td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-600 italic">15</td>
                  <td className="px-8 py-6">
                    <button className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:bg-black hover:text-white transition-all text-[10px] font-black uppercase italic tracking-widest">
                      <RefreshCw className="w-3 h-3" />
                      Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
