
"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Upload, 
  Plus, 
  Trash2, 
  Edit,
  ChevronDown,
  Info,
  LayoutGrid,
  Settings,
  Target,
  Video,
  Play,
  Image as ImageIcon,
  Globe,
  Warehouse,
  Truck,
  Users
} from 'lucide-react';

interface Variant {
  id: string;
  size: string;
  color: string;
  price: string;
  sku: string;
  image: string;
}

interface VideoReview {
  id: string;
  thumbnail: string;
  url: string;
}

export const ProductForm: React.FC = () => {
  const router = useRouter();
  const [orderType, setOrderType] = useState<'direct' | 'request'>('direct');
  const [variants, setVariants] = useState<Variant[]>([
    { id: '1', size: 'M', color: 'Black', price: '45.00', sku: 'AF-BLK-M-01', image: '' }
  ]);
  const [videoReviews, setVideoReviews] = useState<VideoReview[]>([
    { id: '1', thumbnail: '', url: '' }
  ]);

  const addVariant = () => {
    setVariants([...variants, { 
      id: Date.now().toString(), 
      size: '', 
      color: '', 
      price: '', 
      sku: '',
      image: ''
    }]);
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const addVideoReview = () => {
    setVideoReviews([...videoReviews, { id: Date.now().toString(), thumbnail: '', url: '' }]);
  };

  const removeVideoReview = (id: string) => {
    setVideoReviews(videoReviews.filter(v => v.id !== id));
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push('/admin/products')}
            className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="space-y-1">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
              New Mission Asset
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium italic text-xs">Path: Products / Add New /</span>
              <span className="text-orange-600 font-black italic text-xs uppercase tracking-widest">{orderType} Order</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="px-8 py-4 bg-white border border-slate-100 rounded-2xl text-[11px] font-black uppercase italic tracking-widest text-slate-500 hover:text-black transition-all">
            Save Draft
          </button>
          <button className="px-8 py-4 bg-[#FF7348] text-white rounded-2xl text-[11px] font-black uppercase italic tracking-widest hover:bg-orange-600 shadow-xl shadow-orange-600/20 transition-all">
            Publish Live
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Fields */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Information */}
          <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
              <Info className="w-5 h-5 text-orange-600" />
              General Intelligence
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Product Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Pro-Elite Performance Hoodie" 
                  className="w-full bg-slate-50 border border-transparent focus:border-slate-200 focus:bg-white rounded-2xl py-4 px-6 outline-none text-sm font-bold transition-all italic"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Description</label>
                <textarea 
                  rows={6}
                  placeholder="Tell the story of this asset..." 
                  className="w-full bg-slate-50 border border-transparent focus:border-slate-200 focus:bg-white rounded-3xl py-4 px-6 outline-none text-sm font-medium transition-all"
                />
              </div>
            </div>
          </section>

          {/* Media Section */}
          <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-12">
            <div className="space-y-8">
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                <Upload className="w-5 h-5 text-orange-600" />
                Image Assets
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-slate-100 hover:border-orange-500 transition-all group">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5 text-slate-400" />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Add Image</span>
                </button>
                {[1, 2].map(i => (
                  <div key={i} className="aspect-square rounded-3xl bg-slate-100 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button className="p-2 bg-white rounded-lg text-slate-900 hover:text-orange-600 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button className="p-2 bg-white rounded-lg text-slate-900 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <img src="https://picsum.photos/seed/product/400/400" className="w-full h-full object-cover" alt="Product" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-slate-50 space-y-8">
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                <Video className="w-5 h-5 text-orange-600" />
                Main Product Video
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Video URL (YouTube/Vimeo/Direct)</label>
                  <div className="relative group">
                    <Play className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-orange-600 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="https://..." 
                      className="w-full bg-slate-50 border border-transparent focus:border-slate-200 focus:bg-white rounded-2xl py-4 pl-12 pr-6 outline-none text-sm font-bold transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Video Thumbnail</label>
                  <div className="flex gap-4">
                    <button className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center hover:bg-slate-100 hover:border-orange-500 transition-all group shrink-0">
                      <Plus className="w-5 h-5 text-slate-400" />
                    </button>
                    <div className="flex-1 bg-slate-50 rounded-2xl p-4 flex items-center justify-center border border-slate-100">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic text-center">No thumbnail selected</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Video Review Gallery */}
          <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                <Users className="w-5 h-5 text-orange-600" />
                Video Review Gallery
              </h3>
              <button 
                onClick={addVideoReview}
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic hover:bg-slate-800 transition-all"
              >
                <Plus className="w-3 h-3" />
                Add Review Row
              </button>
            </div>
            
            <div className="space-y-4">
              {videoReviews.map((review) => (
                <div key={review.id} className="grid grid-cols-[120px_1fr_40px] gap-4 items-end bg-slate-50 p-4 rounded-3xl border border-transparent hover:border-slate-200 transition-all group">
                   <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 italic">Thumbnail</label>
                    <button className="w-full aspect-video bg-white border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-50 hover:border-orange-500 transition-all">
                      <ImageIcon className="w-4 h-4 text-slate-300" />
                    </button>
                   </div>
                   <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 italic">Video URL</label>
                    <input 
                      type="text" 
                      placeholder="Insert video link..." 
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none text-[11px] font-bold transition-all focus:border-orange-500"
                    />
                   </div>
                   <button 
                    onClick={() => removeVideoReview(review.id)}
                    className="p-3 bg-white text-slate-300 hover:text-red-500 rounded-xl shadow-sm transition-colors mb-0.5"
                   >
                    <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              ))}
            </div>
          </section>

          {/* Inventory Tracking */}
          <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
              <Warehouse className="w-5 h-5 text-orange-600" />
              Inventory Control
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Track Quantity</label>
                    <input type="checkbox" className="w-5 h-5 accent-black" defaultChecked />
                 </div>
                 <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Continue selling when out of stock</label>
                    <input type="checkbox" className="w-5 h-5 accent-black" />
                 </div>
              </div>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Global Inventory Count</label>
                    <input type="number" defaultValue={0} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none text-sm font-bold" />
                 </div>
              </div>
            </div>
          </section>

          {/* Shipping Section */}
          <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
              <Truck className="w-5 h-5 text-orange-600" />
              Weight & Logistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">This is a physical product</label>
                    <input type="checkbox" className="w-5 h-5 accent-black" defaultChecked />
                 </div>
                 <div className="space-y-2 pt-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Weight (kg)</label>
                    <input type="text" placeholder="0.0" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none text-sm font-bold" />
                 </div>
              </div>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">HS (Harmonized System) Code</label>
                    <input type="text" placeholder="6109.10" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none text-sm font-bold" />
                 </div>
              </div>
            </div>
          </section>

          {/* Shopify-like Variants Section */}
          <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                  <LayoutGrid className="w-5 h-5 text-orange-600" />
                  Options & Variants
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Define colors, sizes, and specific variant assets</p>
              </div>
              <button 
                onClick={addVariant}
                className="bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest italic hover:scale-105 transition-all shadow-xl shadow-black/10"
              >
                Create Variant
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_40px] gap-6 px-6 border-b border-slate-50 pb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Image</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Size</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Color</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Price</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">SKU</span>
                <div />
              </div>
              
              <div className="space-y-4">
                {variants.map((v) => (
                  <div key={v.id} className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_40px] gap-6 items-center p-4 rounded-[30px] border border-slate-50 hover:border-orange-200 transition-all hover:shadow-lg hover:shadow-orange-500/5 group">
                    <button className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center hover:bg-slate-100 hover:border-orange-500 transition-all relative overflow-hidden">
                      {v.image ? (
                        <img src={v.image} className="w-full h-full object-cover" alt="Variant" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-300" />
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[7px] text-white font-black uppercase text-center">Select</p>
                      </div>
                    </button>
                    
                    <div className="space-y-1">
                      <input type="text" defaultValue={v.size} placeholder="S, M, L..." className="w-full bg-slate-50 border border-transparent focus:border-slate-200 rounded-xl p-3 text-[11px] font-bold outline-none uppercase italic" />
                    </div>
                    
                    <div className="space-y-1">
                      <input type="text" defaultValue={v.color} placeholder="Black, Gold..." className="w-full bg-slate-50 border border-transparent focus:border-slate-200 rounded-xl p-3 text-[11px] font-bold outline-none uppercase italic" />
                    </div>

                    <div className="relative group/price">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black">$</span>
                      <input type="text" defaultValue={v.price} placeholder="0.00" className="w-full bg-slate-50 border border-transparent focus:border-slate-200 rounded-xl py-3 pl-6 pr-3 text-[11px] font-bold outline-none" />
                    </div>

                    <div className="space-y-1">
                      <input type="text" defaultValue={v.sku} placeholder="SKU-123" className="w-full bg-slate-50 border border-transparent focus:border-slate-200 rounded-xl p-3 text-[10px] font-bold outline-none uppercase tracking-widest" />
                    </div>

                    <button 
                      onClick={() => removeVariant(v.id)}
                      className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SEO & Global Hub */}
          <section className="bg-[#050505] p-10 rounded-[40px] text-white border border-white/5 shadow-2xl space-y-12">
            <div className="space-y-2">
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-white flex items-center gap-3">
                <Globe className="w-5 h-5 text-orange-500" />
                Search Engine Listing
              </h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">How this asset appears in the global digital index</p>
            </div>

            <div className="p-8 bg-white/5 rounded-3xl border border-white/10 space-y-4">
              <p className="text-[#3b82f6] text-lg font-medium hover:underline cursor-pointer truncate">Elite Performance Pro Jersey | Athletic Force 1</p>
              <p className="text-[#10b981] text-xs truncate">https://af1.com/products/elite-performance-pro-jersey</p>
              <p className="text-slate-400 text-sm line-clamp-2">Elevate your team&apos;s tactical edge with the AF1 Pro Jersey. Engineered for high-velocity play and professional durability.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Page Title</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none text-sm font-bold transition-all focus:border-orange-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Meta Description</label>
                <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 px-6 outline-none text-sm font-medium transition-all focus:border-orange-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">URL Handle</label>
                <div className="flex bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                  <span className="px-6 py-4 text-slate-500 text-sm font-medium border-r border-white/10">af1.com/products/</span>
                  <input type="text" className="flex-1 bg-transparent py-4 px-6 outline-none text-sm font-bold text-orange-500" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-8">
          {/* Order Type Selector */}
          <section className="bg-black p-8 rounded-[40px] text-white space-y-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-orange-600 rounded-full blur-3xl opacity-40 group-hover:scale-150 transition-transform" />
            <div className="relative z-10 flex items-center justify-between">
              <h3 className="text-lg font-black italic uppercase tracking-tighter">Order Model</h3>
              <Target className="w-5 h-5 text-orange-500" />
            </div>
            <div className="relative z-10 grid grid-cols-1 gap-3">
              <button 
                onClick={() => setOrderType('direct')}
                className={`p-4 rounded-2xl border transition-all text-left space-y-1 ${
                  orderType === 'direct' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <p className="font-black italic uppercase tracking-widest text-[10px]">Direct Add-to-Cart</p>
                <p className={`text-[8px] font-bold ${orderType === 'direct' ? 'text-slate-500' : 'text-slate-400'}`}>Instant purchase flow for standard stock items.</p>
              </button>
              <button 
                onClick={() => setOrderType('request')}
                className={`p-4 rounded-2xl border transition-all text-left space-y-1 ${
                  orderType === 'request' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <p className="font-black italic uppercase tracking-widest text-[10px]">Request Order Form</p>
                <p className={`text-[8px] font-bold ${orderType === 'request' ? 'text-slate-500' : 'text-slate-400'}`}>Custom uniforms and bulk quotes via inquiry.</p>
              </button>
            </div>
          </section>

          {/* Organization */}
          <section className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
              <Settings className="w-5 h-5 text-slate-400" />
              Category Setup
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Major Category</label>
                <div className="relative">
                  <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 outline-none text-[11px] font-bold appearance-none uppercase italic">
                    <option>Custom Uniforms</option>
                    <option>Merchandise</option>
                    <option>Accessories</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Sub-Collection</label>
                <div className="relative">
                  <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 outline-none text-[11px] font-bold appearance-none uppercase italic">
                    <option>7v7 Gear</option>
                    <option>Training</option>
                    <option>Fan wear</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Tags</label>
                <input 
                  type="text" 
                  placeholder="New, Elite, Performance..." 
                  className="w-full bg-slate-50 border border-transparent focus:border-slate-200 focus:bg-white rounded-2xl py-3 px-4 outline-none text-[11px] font-bold transition-all"
                />
              </div>
            </div>
          </section>

          {/* Status */}
          <section className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">Visibility</h3>
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            </div>
            <div className="space-y-4">
              {['Active', 'Draft', 'Archived'].map(s => (
                <label key={s} className="flex items-center justify-between cursor-pointer group">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-black italic transition-colors">{s}</span>
                  <input type="radio" name="status" defaultChecked={s === 'Active'} className="w-4 h-4 accent-black" />
                </label>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
