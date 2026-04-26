"use client";

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  UserPlus, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  RefreshCcw, 
  ShoppingCart,
  Eye,
  Instagram,
  Facebook,
  Twitter,
  Globe,
  Save,
  FileText,
  Type,
  XCircle,
  Banknote,
  ShoppingBag,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-toastify';

// ─── TYPES ───────────────────────────────────────────────────────────────────
type EmailType = 
  | 'welcome' 
  | 'order_placed' 
  | 'order_shipped'
  | 'order_cancelled'
  | 'order_refunded'
  | 'low_stock_alert'
  | 'abandoned_cart';

interface EmailTemplateData {
  type: string;
  subject: string;
  heading: string;
  body: string;
  buttonText: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_ORDER = {
  id: 'AF1-69EB6',
  date: 'April 25, 2026',
  total: 129.99,
  subtotal: 124.99,
  shippingFee: 5.00,
  items: [
    { 
        name: 'Tactical Drift Pro Shirt', 
        quantity: 1, 
        price: 89.99, 
        color: 'Shadow Black', 
        size: 'XL',
        image: 'https://res.cloudinary.com/dv1xqw5um/image/upload/v1776781646/af1/products/ci8kjg6q3sb55eyvulsn.png'
    },
    { 
        name: 'Elite Training Shorts', 
        quantity: 1, 
        price: 40.00, 
        color: 'Safety Orange', 
        size: 'L',
        image: 'https://res.cloudinary.com/dv1xqw5um/image/upload/v1776781646/af1/products/ci8kjg6q3sb55eyvulsn.png'
    }
  ],
  shipping: {
    name: 'Alex Johnson',
    address: '4807 Greenleaf Ct, Ste DModesto, CA 95356'
  }
};

const DossierSummary = ({ items, total, subtotal, shippingFee, isCancelled = false }: any) => (
    <div className="space-y-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Your Dossier Items</p>
        <div className="space-y-4">
            {items.map((item: any, i: number) => (
                <div key={i} className={`flex gap-4 items-center ${isCancelled ? 'opacity-40' : ''}`}>
                    <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow">
                        <p className={`text-xs font-black uppercase italic ${isCancelled ? 'line-through decoration-red-500' : ''}`}>{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{item.size} &middot; Qty: {item.quantity}</p>
                    </div>
                    <p className={`text-xs font-black ${isCancelled ? 'line-through opacity-50' : ''}`}>${item.price.toFixed(2)}</p>
                </div>
            ))}
        </div>
        <div className="pt-6 border-t border-slate-100 space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-green-600 uppercase tracking-widest">
                <span>Shipping</span>
                <span>FREE</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t-2 border-slate-100">
                <span className="text-sm font-black uppercase italic">Total Paid</span>
                <span className="text-xl font-black text-black">${total.toFixed(2)}</span>
            </div>
        </div>
    </div>
);

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

const EmailWrapper = ({ children, hideHeader = false }: { children: React.ReactNode; hideHeader?: boolean }) => (
  <div className="w-full max-w-2xl mx-auto bg-white shadow-2xl rounded-[30px] overflow-hidden border border-slate-100 my-4 animate-in fade-in zoom-in duration-500">
    {!hideHeader && (
      <div className="bg-[#1a1a1a] p-10 text-center relative">
        <img src="https://res.cloudinary.com/dv1xqw5um/image/upload/v1777093836/logo-new-white_mwj1xw.png" alt="Athletic Force 1" className="h-10 mx-auto mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF7348] italic">Elite Sports Uniforms and Accessoires</p>
      </div>
    )}
    
    <div className="p-0">
      {children}
    </div>

    {/* Footer */}
    <div className="bg-[#F8FAFC] p-10 text-center border-t border-slate-100">
        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest leading-loose">
            4807 Greenleaf Ct, Ste DModesto, CA 95356 <br />
            Call us: 707-741-5737 | Email: info@athleticforce1.com <br />
        </p>
        <div className="flex justify-center gap-6 mt-6">
            <Instagram className="w-4 h-4 text-[#64748B]" />
            <Facebook className="w-4 h-4 text-[#64748B]" />
            <Twitter className="w-4 h-4 text-[#64748B]" />
        </div>
        <p className="text-[10px] font-bold text-[#94A3B8] mt-8 uppercase tracking-widest leading-loose">
            © 2026 Athletic Force 1. All Rights Reserved.
        </p>
    </div>
  </div>
);

const DynamicTemplate = ({ type, data }: { type: EmailType; data: EmailTemplateData }) => {
    switch (type) {
        case 'welcome':
            return (
                <div className="p-12 text-center space-y-8">
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-[#0F172A] leading-none whitespace-pre-wrap">{data.heading}</h1>
                    <p className="text-[#64748B] text-lg font-medium whitespace-pre-wrap leading-relaxed">{data.body}</p>
                    <button className="bg-black text-white px-10 py-5 rounded-lg font-black uppercase italic tracking-tighter text-xl shadow-xl">
                        {data.buttonText}
                    </button>
                </div>
            );
        case 'order_placed':
            return (
                <div className="bg-[#f4f1eb]">
                    <div className="bg-black p-16 text-center">
                        <div className="w-20 h-20 bg-white/10 border-2 border-white/20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🛍️</div>
                        <h1 className="text-3xl font-black italic uppercase text-white mb-2">{data.heading}</h1>
                        <p className="text-slate-400 text-sm">We've received your order and we're already on it. 🎯</p>
                    </div>
                    <div className="bg-[#fff8e6] py-3 text-center border-b border-[#f5d98a]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#7a5000]">✅ &nbsp; Order #AF1-2026 Placed Successfully</p>
                    </div>
                    <div className="p-12 space-y-10 text-left">
                        <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Hey,</p>
                             <h2 className="text-2xl font-black italic uppercase text-black mb-4">Alex 👋</h2>
                             <p className="text-[#475569] text-base leading-relaxed">{data.body}</p>
                        </div>
                        <div className="bg-[#fffbf0] border border-[#f5d98a] rounded-2xl p-8 grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-[10px] font-black uppercase text-[#b8860b] mb-1">Order Number</p>
                                <p className="text-sm font-black font-mono">#AF1-2026</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-[#b8860b] mb-1">Status</p>
                                <p className="text-sm font-black text-[#FF7348]">⏳ PROCESSING</p>
                            </div>
                        </div>
                        <DossierSummary {...MOCK_ORDER} />
                        <div className="space-y-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">What Happens Next</p>
                            <div className="flex gap-4 items-center">
                                <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-black">1</div>
                                <div>
                                    <p className="text-xs font-black uppercase">Order Processing</p>
                                    <p className="text-[10px] text-slate-500">Preparing your gear for deployment.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        case 'order_shipped':
            return (
                <div style={{ backgroundColor: '#f0f4f8' }}>
                    <div style={{ background: 'linear-gradient(135deg,#000000,#1a1a1a,#2a2a2a)', padding: '54px 40px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '84px', height: '84px', lineHeight: '84px', fontSize: '38px', marginBottom: '22px' }}>🚚</div>
                        <h1 style={{ margin: '0 0 8px', color: '#ffffff', fontSize: '30px', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>{data.heading}</h1>
                        <p style={{ margin: 0, color: '#94A3B8', fontSize: '15px' }}>Sit tight — your package is heading to you right now.</p>
                    </div>
                    <div className="p-12 text-left space-y-10">
                        <div>
                            <p className="text-[#94A3B8] text-[10px] font-black uppercase tracking-widest mb-2">Hello,</p>
                            <h2 className="text-2xl font-black italic uppercase text-[#0F172A] mb-4">ALEX 👋</h2>
                            <p className="text-[#475569] text-base leading-relaxed">{data.body}</p>
                        </div>
                        <div className="bg-[#eaf4fb] border-[1.5px] border-[#c5dff0] rounded-2xl p-8">
                            <p className="text-[#7fa8bf] text-[10px] font-black uppercase tracking-widest mb-2">Tracking Number</p>
                            <p className="text-xl font-black tracking-[0.2em] text-[#0f2027] mb-6 font-mono">TRK-AF1-9284-XKPL</p>
                            <p className="text-[#7fa8bf] text-[10px] font-black uppercase tracking-widest mb-2">Carrier</p>
                            <p className="text-lg text-[#1a2d3d] font-black uppercase italic">FedEx Tactical</p>
                        </div>
                        <DossierSummary {...MOCK_ORDER} />
                        <button className="w-full bg-black text-white py-5 rounded-lg font-black uppercase italic tracking-tighter text-xl shadow-xl">
                            {data.buttonText || 'Track My Package'}
                        </button>
                    </div>
                </div>
            );
        case 'order_cancelled':
            return (
                <div className="bg-[#f7f2f2]">
                    <div className="bg-gradient-to-br from-[#4a0010] to-[#a93252] p-16 text-center text-white">
                        <div className="w-20 h-20 bg-white/10 border-2 border-white/20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">❌</div>
                        <h1 className="text-3xl font-black italic uppercase mb-2">{data.heading}</h1>
                        <p className="text-red-200 text-sm">We're sorry to see this happen. Here's the intel.</p>
                    </div>
                    <div className="bg-[#fde8ec] py-3 text-center border-b border-[#f5c2cc]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#7b1a2e]">🚫 &nbsp; Order #AF1-2026 Status: CANCELLED</p>
                    </div>
                    <div className="p-12 space-y-10 text-left">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Hi there,</p>
                            <h2 className="text-2xl font-black italic uppercase text-black mb-4">Alex 👋</h2>
                            <p className="text-[#6b3040] text-base leading-relaxed">{data.body}</p>
                        </div>
                        <DossierSummary {...MOCK_ORDER} isCancelled />
                        <div className="bg-gradient-to-br from-[#f0fdf4] to-[#f8fffb] border border-[#a8d5b5] rounded-2xl p-8">
                             <p className="text-[10px] font-black uppercase text-[#4a9966] mb-2 tracking-widest">💳 Refund Information</p>
                             <p className="text-sm font-black text-[#1a3d2b] mb-2">A full refund of <span className="text-green-700">${MOCK_ORDER.total.toFixed(2)}</span> is on its way!</p>
                             <p className="text-xs text-[#4a7a5a]">Credited back to your payment method within 5–7 business days.</p>
                        </div>
                        <button className="w-full bg-black text-white py-5 rounded-lg font-black uppercase italic tracking-tighter text-xl">
                            {data.buttonText || 'Shop Again'}
                        </button>
                    </div>
                </div>
            );
        case 'abandoned_cart':
            return (
                <div className="bg-[#f0eef8]">
                    <div className="bg-black p-16 text-center text-white">
                        <div className="w-20 h-20 bg-white/10 border-2 border-white/20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🛒</div>
                        <h1 className="text-3xl font-black italic uppercase mb-2">{data.heading}</h1>
                        <p className="text-slate-400 text-sm">Your cart is missing you. Come back and complete your order! 💜</p>
                    </div>
                    <div className="bg-[#fff0f0] py-3 text-center border-b border-[#ffb3b3]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#c0392b]">⏰ &nbsp; Items in your cart are moving fast — secure yours now!</p>
                    </div>
                    <div className="p-12 space-y-10 text-left">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Hey,</p>
                            <h2 className="text-2xl font-black italic uppercase text-black mb-4">Alex 👋</h2>
                            <p className="text-[#475569] text-base leading-relaxed">{data.body}</p>
                        </div>
                        <DossierSummary {...MOCK_ORDER} />
                        <div className="bg-black p-8 rounded-2xl text-center">
                            <p className="text-[10px] font-black uppercase text-[#FF7348] mb-2 tracking-widest">🎁 &nbsp; Special Tactical Offer</p>
                            <p className="text-xl font-black text-white italic uppercase mb-4">Get 10% OFF Your Order!</p>
                            <div className="inline-block bg-white/10 border border-white/20 border-dashed rounded-xl px-10 py-4 mb-4">
                                <p className="text-2xl font-black text-white tracking-[0.3em] font-mono">ELITE10</p>
                            </div>
                        </div>
                        <button className="w-full bg-black text-white py-5 rounded-lg font-black uppercase italic tracking-tighter text-xl">
                            {data.buttonText || 'Complete My Order'}
                        </button>
                    </div>
                </div>
            );
        default:
            return (
                <div className="p-12 text-center space-y-8">
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-[#0F172A] leading-none">{data.heading}</h1>
                    <p className="text-[#64748B] text-lg font-medium whitespace-pre-wrap leading-relaxed">{data.body}</p>
                    <button className="bg-black text-white px-10 py-5 rounded-lg font-black uppercase italic tracking-tighter text-xl">
                        {data.buttonText}
                    </button>
                </div>
            );
    }
};

// ─── PAGE ────────────────────────────────────────────────────────────────────

export const EmailPreviews: React.FC = () => {
  const [activeTab, setActiveTab] = useState<EmailType>('welcome');
  const [formData, setFormData] = useState<EmailTemplateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const tabs: { id: EmailType; label: string; icon: any }[] = [
    { id: 'welcome', label: 'Welcome', icon: UserPlus },
    { id: 'order_placed', label: 'New Order', icon: ShoppingBag },
    { id: 'order_shipped', label: 'Shipped', icon: Truck },
    { id: 'order_cancelled', label: 'Cancelled', icon: XCircle },
    { id: 'order_refunded', label: 'Refunded', icon: Banknote },
    { id: 'abandoned_cart', label: 'Cart Reminder', icon: ShoppingCart },
    { id: 'low_stock_alert', label: 'Stock Alert', icon: AlertCircle },
  ];

  const fetchTemplate = async (type: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/api/admin/emails/templates/${type}`);
      if (res.data.ok) {
        setFormData(res.data.template);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tactical template.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplate(activeTab);
  }, [activeTab]);

  const handleSave = async () => {
    if (!formData) return;
    setIsSaving(true);
    try {
      const res = await apiClient.put(`/api/admin/emails/templates/${activeTab}`, formData);
      if (res.data.ok) {
        toast.success("Template intelligence updated!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to persist mission data.");
    } finally {
      setIsSaving(false);
    }
  };

  const isShippedType = activeTab === 'order_shipped' || activeTab === 'order_cancelled' || activeTab === 'order_refunded';

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-6 lg:p-12">
      <div className="max-w-[1600px] mx-auto space-y-12">
        
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
            <div className="space-y-1">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Template Commander</h1>
                <p className="text-slate-400 font-medium italic text-sm text-[12px] uppercase tracking-widest leading-loose">Mission-level customization of elite brand communications.</p>
            </div>
            
            <div className="flex bg-slate-100 p-2 rounded-[25px] overflow-x-auto no-scrollbar border border-slate-200/50">
                {tabs.map((t) => (
                    <button 
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] whitespace-nowrap font-black uppercase tracking-widest italic transition-all ${
                            activeTab === t.id ? "bg-white text-black shadow-xl shadow-black/5 scale-[1.02]" : "text-slate-400 hover:text-black"
                        }`}
                    >
                        <t.icon className={`w-4 h-4 ${activeTab === t.id ? 'text-[#FF7348]' : 'text-slate-300'}`} />
                        {t.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* EDITOR FORM */}
            <div className="lg:col-span-4 space-y-8">
                <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                             <div className="p-3 bg-black text-white rounded-xl">
                                <FileText className="w-5 h-5" />
                             </div>
                             <h3 className="text-lg font-black italic uppercase tracking-tighter">Content Editor</h3>
                        </div>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`flex items-center gap-2 px-6 py-3 bg-[#FF7348] text-white rounded-2xl text-[10px] font-black uppercase italic tracking-widest shadow-xl shadow-orange-600/20 active:scale-95 transition-all ${isSaving ? 'opacity-50' : 'hover:bg-orange-600'}`}
                        >
                            {isSaving ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Persist
                        </button>
                    </div>

                    {!formData || isLoading ? (
                        <div className="space-y-6">
                            <div className="h-10 bg-slate-50 animate-pulse rounded-xl" />
                            <div className="h-10 bg-slate-50 animate-pulse rounded-xl" />
                            <div className="h-32 bg-slate-50 animate-pulse rounded-xl" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase italic text-slate-400 px-2 flex items-center gap-2">
                                    <Type className="w-3 h-3" /> Subject Line
                                </label>
                                <input 
                                    type="text" 
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:border-orange-500 focus:bg-white transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase italic text-slate-400 px-2 flex items-center gap-2">
                                    <Type className="w-3 h-3" /> Hero Heading
                                </label>
                                <input 
                                    type="text" 
                                    value={formData.heading}
                                    onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:border-orange-500 focus:bg-white transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase italic text-slate-400 px-2 flex items-center gap-2">
                                    <FileText className="w-3 h-3" /> Body Directive
                                </label>
                                <textarea 
                                    value={formData.body}
                                    rows={8}
                                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:border-orange-500 focus:bg-white transition-all no-scrollbar leading-relaxed"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase italic text-slate-400 px-2 flex items-center gap-2">
                                    <Zap className="w-3 h-3" /> Button Action Text
                                </label>
                                <input 
                                    type="text" 
                                    value={formData.buttonText}
                                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:border-orange-500 focus:bg-white transition-all"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* LIVE PREVIEW */}
            <div className="lg:col-span-8 bg-slate-100 rounded-[60px] p-8 lg:p-16 border border-slate-100 shadow-inner flex items-start justify-center relative sticky top-12 overflow-y-auto no-scrollbar h-[calc(100vh-100px)]">
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-2 bg-white rounded-full border border-slate-200 shadow-sm z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Tactical Preview</span>
                    </div>
                    <div className="w-px h-3 bg-slate-200" />
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                </div>
                
                <div className="w-full mt-10">
                    {!formData ? (
                         <div className="flex flex-col items-center justify-center pt-40 gap-4 opacity-20">
                            <RefreshCcw className="w-12 h-12 animate-spin" />
                            <p className="text-sm font-black uppercase italic">Extracting Intel...</p>
                         </div>
                    ) : (
                        <EmailWrapper hideHeader={isShippedType}>
                             <DynamicTemplate type={activeTab} data={formData} />
                        </EmailWrapper>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
