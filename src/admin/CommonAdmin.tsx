
"use client";

import React from 'react';
import { Users, Tag, Plus, ExternalLink } from 'lucide-react';

export const AdminCustomers: React.FC = () => (
  <div className="space-y-8">
     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="space-y-1">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Intelligence Roster</h1>
        <p className="text-slate-400 font-medium italic text-sm">Managing the database of active players and team coaches.</p>
      </div>
    </div>
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden p-20 flex flex-col items-center text-center space-y-6">
      <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center rotate-[-10deg]">
        <Users className="w-12 h-12 text-slate-300" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Elite Customer Access</h3>
        <p className="text-slate-400 font-medium italic text-sm">Customer management module is currently stabilizing. Live data will populate here as the ecosystem expands.</p>
      </div>
      <button className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-xl">
        <Plus className="w-5 h-5" />
        Record Entry
      </button>
    </div>
  </div>
);

export const AdminCollections: React.FC = () => (
  <div className="space-y-8">
     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="space-y-1">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Tactical Collections</h1>
        <p className="text-slate-400 font-medium italic text-sm">Organizing assets into logical operational vectors.</p>
      </div>
      <button className="bg-[#FF7348] text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-orange-600/20">
        <Plus className="w-5 h-5" />
        New Collection
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {['Custom Uniforms', 'Merchandise', 'Elite Accessories', 'Training Gear', 'Fan Wear'].map((c, i) => (
        <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
          <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-orange-600 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-all opacity" />
          <div className="flex flex-col gap-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center rotate-[-5deg] group-hover:bg-black group-hover:text-white transition-all shadow-sm">
              <Tag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">{c}</h4>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">12 Active Products</p>
            </div>
            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest italic text-orange-600">Active Campaign</span>
              <ExternalLink className="w-4 h-4 text-slate-300" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
