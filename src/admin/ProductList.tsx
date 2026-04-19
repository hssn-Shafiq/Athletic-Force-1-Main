
"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Package
} from 'lucide-react';

interface ProductRow {
  id: string;
  name: string;
  image: string;
  category: string;
  price: string;
  sku: string;
  stock: number;
  status: 'Active' | 'Draft' | 'Out of Stock';
  type: 'Direct' | 'Request';
}

const MOCK_PRODUCTS: ProductRow[] = [
  { 
    id: 'P-101', 
    name: 'Custom 7v7 Uniform Pro-Fit', 
    image: 'https://af1.groomyorlife.com/wp-content/uploads/2026/01/Background.png',
    category: 'Uniforms',
    price: '$249.00',
    sku: 'AF-7V7-001',
    stock: 45,
    status: 'Active',
    type: 'Request'
  },
  { 
    id: 'P-102', 
    name: 'Athletic Performance Arm Sleeve', 
    image: 'https://af1.groomyorlife.com/wp-content/uploads/2026/01/Background.png',
    category: 'Accessories',
    price: '$25.00',
    sku: 'AF-ACC-042',
    stock: 120,
    status: 'Active',
    type: 'Direct'
  },
  { 
    id: 'P-103', 
    name: 'Elite Pro Padded Compression', 
    image: 'https://af1.groomyorlife.com/wp-content/uploads/2026/01/Background.png',
    category: 'Apparel',
    price: '$85.00',
    sku: 'AF-APP-012',
    stock: 0,
    status: 'Out of Stock',
    type: 'Direct'
  },
  { 
    id: 'P-104', 
    name: 'Varsity Team Spirit Pack', 
    image: 'https://af1.groomyorlife.com/wp-content/uploads/2026/01/Background.png',
    category: 'Custom Packs',
    price: 'Custom',
    sku: 'AF-PAK-002',
    stock: 15,
    status: 'Draft',
    type: 'Request'
  }
];

export const AdminProductList: React.FC = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            Product Inventory
          </h1>
          <p className="text-slate-400 font-medium italic text-sm">Managing {MOCK_PRODUCTS.length} active units across all vectors.</p>
        </div>
        <button 
          onClick={() => router.push('/admin/products/add')}
          className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>Deploy New Product</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-[30px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by ID, Name, or SKU..." 
            className="w-full bg-slate-50 border border-transparent focus:border-slate-200 focus:bg-white rounded-2xl py-3 pl-12 pr-4 outline-none text-xs font-medium transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest italic text-slate-500 hover:text-black hover:border-slate-200 transition-all">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest italic text-slate-500 hover:text-black hover:border-slate-200 transition-all">
            Export
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto no-scrollbar">
        <table className="w-full text-left min-w-250">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-50">
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Product Detail</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">ID / SKU</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Type</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Price</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Stock</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Status</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {MOCK_PRODUCTS.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                      <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                    </div>
                    <div>
                      <h4 className="font-black italic uppercase tracking-tighter text-slate-900 line-clamp-1">{product.name}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{product.category}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-slate-900 tracking-tighter italic">{product.id}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{product.sku}</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase italic tracking-widest ${
                    product.type === 'Direct' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {product.type} Order
                  </span>
                </td>
                <td className="px-8 py-6 font-black italic tracking-tighter text-slate-900">
                  {product.price}
                </td>
                <td className="px-8 py-6 text-sm font-bold text-slate-600 italic">
                  {product.stock} units
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    {product.status === 'Active' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : product.status === 'Out of Stock' ? (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Package className="w-4 h-4 text-slate-300" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest italic">{product.status}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-black hover:text-white rounded-lg transition-all">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-slate-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Showing 1 to 10 of 420 results</p>
        <div className="flex items-center gap-2">
          <button className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-1">
            {[1, 2, 3, '...', 12].map((n, i) => (
              <button key={i} className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                n === 1 ? 'bg-black text-white shadow-lg' : 'hover:bg-slate-50 text-slate-400 hover:text-black'
              }`}>
                {n}
              </button>
            ))}
          </div>
          <button className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
