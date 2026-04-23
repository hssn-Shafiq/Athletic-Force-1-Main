
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  ShoppingBag, 
  UserPlus, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  RefreshCcw, 
  ShoppingCart,
  Send,
  Eye,
  Instagram,
  Facebook,
  Twitter,
  Globe,
  PackageCheck,
  Star,
  Zap,
  Tag,
  Save,
  Plus,
  Trash2,
  FileText,
  Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-toastify';

// ─── TYPES ───────────────────────────────────────────────────────────────────
type EmailType = 
  | 'order_confirmation' 
  | 'welcome' 
  | 'checkout_reminder'
  | 'status_update' 
  | 'order_delivered'
  | 'stock_alert'
  | 'marketing_new'
  | 'follow_up';

interface SocialLink {
  platform: string;
  url: string;
}

interface EmailTemplateData {
  type: string;
  subject: string;
  heading: string;
  body: string;
  buttonText: string;
  footerText: string;
  socials: SocialLink[];
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_ORDER = {
  id: 'AF1-9842X',
  date: 'April 23, 2026',
  total: 129.99,
  items: [
    { name: 'Drift Performance Shirt', quantity: 1, price: 49.99, color: 'Shadow Black', size: 'XL', image: '/products/shirt.png' },
    { name: 'Core Training Shorts', quantity: 1, price: 79.50, color: 'Safety Orange', size: 'L', image: '/products/shorts.png' }
  ],
  shipping: {
    name: 'Hassan Shafiq',
    address: ' Sunny Pull, IUB Road, Rahim Yar Khan, Punjab, Pakistan'
  }
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

const EmailWrapper = ({ children, socials }: { children: React.ReactNode; socials: SocialLink[] }) => (
  <div className="w-full max-w-2xl mx-auto bg-white shadow-2xl rounded-[40px] overflow-hidden border border-slate-100 my-10 animate-in fade-in zoom-in duration-500">
    {/* Header */}
    <div className="bg-[#141414] p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-orange-600" />
        <img src="/main-logo.png" alt="Athletic Force 1" className="h-12 mx-auto mb-4 invert" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 italic">Unleash Your Potential</p>
    </div>
    
    <div className="p-10 min-h-[400px]">
      {children}
    </div>

    {/* Footer */}
    <div className="bg-slate-50 p-10 text-center border-t border-slate-100">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-6 italic">Stay in the Game</h4>
        <div className="flex justify-center gap-6 mb-8">
            {socials.map((s, i) => (
                <a key={i} href={s.url} target="_blank" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                    {s.platform === 'instagram' && <Instagram className="w-4 h-4 text-slate-400" />}
                    {s.platform === 'facebook' && <Facebook className="w-4 h-4 text-slate-400" />}
                    {s.platform === 'twitter' && <Twitter className="w-4 h-4 text-slate-400" />}
                    {!['instagram', 'facebook', 'twitter'].includes(s.platform) && <Globe className="w-4 h-4 text-slate-400" />}
                </a>
            ))}
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
            © 2026 Athletic Force 1. All Rights Reserved. <br />
            Rahim Yar Khan, Punjab, Pakistan <br />
            <a href="https://athleticforce1.com" className="text-orange-600 mt-2 block hover:underline">athleticforce1.com</a>
        </p>
    </div>
  </div>
);

// ─── TEMPLATES ───────────────────────────────────────────────────────────────

const DynamicTemplate = ({ type, data }: { type: EmailType; data: EmailTemplateData }) => {
    switch (type) {
        case 'order_confirmation':
            return (
                <div className="space-y-8">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">{data.heading}</h2>
                        <p className="text-slate-500 font-medium whitespace-pre-wrap">{data.body}</p>
                    </div>

                    <div className="space-y-4 pt-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Dossier Details</h3>
                        <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
                            {MOCK_ORDER.items.map((item, i) => (
                                <div key={i} className="py-4 flex justify-between items-center">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-12 h-14 bg-slate-50 rounded-lg" />
                                        <div>
                                            <p className="text-sm font-black italic uppercase text-slate-900">{item.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{item.size} × {item.quantity}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-black italic text-slate-900">${item.price}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button className="w-full bg-[#141414] text-white py-4 rounded-2xl font-black uppercase italic tracking-tighter text-xl shadow-xl">
                        {data.buttonText}
                    </button>
                </div>
            );
        case 'welcome':
            return (
                <div className="space-y-8 text-center">
                    <div className="relative inline-block">
                         <div className="w-24 h-24 bg-orange-600 rounded-[35px] rotate-[-5deg] absolute inset-0 opacity-20 animate-pulse" />
                         <div className="w-24 h-24 bg-black text-orange-500 rounded-[35px] flex items-center justify-center relative z-10">
                            <UserPlus className="w-10 h-10" />
                         </div>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none whitespace-pre-wrap">{data.heading}</h2>
                        <p className="text-slate-500 font-medium whitespace-pre-wrap">{data.body}</p>
                    </div>
                    <button className="w-full bg-orange-600 text-white py-5 rounded-3xl font-black uppercase italic tracking-tighter text-2xl shadow-xl shadow-orange-600/20">
                        {data.buttonText}
                    </button>
                </div>
            );
        case 'checkout_reminder':
            return (
                <div className="space-y-8 text-center">
                    <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                        <Zap className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">{data.heading}</h2>
                    <p className="text-slate-500 font-medium italic text-lg">{data.subject}</p>
                    <p className="text-slate-500 font-medium whitespace-pre-wrap">{data.body}</p>
                    <button className="w-full bg-[#141414] text-white py-5 rounded-2xl font-black uppercase italic tracking-tighter text-xl shadow-xl">
                        {data.buttonText}
                    </button>
                </div>
            );
        default:
            return (
                <div className="space-y-8 text-center">
                    <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                        <Mail className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">{data.heading}</h2>
                    <p className="text-slate-500 font-medium whitespace-pre-wrap">{data.body}</p>
                    <button className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase italic tracking-tighter text-lg shadow-xl">
                        {data.buttonText}
                    </button>
                </div>
            );
    }
};

// ─── PAGE ────────────────────────────────────────────────────────────────────

export const EmailPreviews: React.FC = () => {
  const [activeTab, setActiveTab] = useState<EmailType>('order_confirmation');
  const [formData, setFormData] = useState<EmailTemplateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const tabs: { id: EmailType; label: string; icon: any }[] = [
    { id: 'order_confirmation', label: 'Confirmation', icon: CheckCircle },
    { id: 'welcome', label: 'Welcome', icon: UserPlus },
    { id: 'checkout_reminder', label: 'Unpaid Remit', icon: Zap },
    { id: 'status_update', label: 'Gear Shipped', icon: Truck },
    { id: 'order_delivered', label: 'Mission Finish', icon: PackageCheck },
    { id: 'marketing_new', label: 'Tactical Drops', icon: Tag },
    { id: 'follow_up', label: 'Satisfaction', icon: Star },
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
      toast.error("Failed to load template intel.");
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
        toast.success("Intelligence updated successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to persist modifications.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSocial = (index: number, field: string, value: string) => {
    if (!formData) return;
    const newSocials = [...formData.socials];
    newSocials[index] = { ...newSocials[index], [field]: value };
    setFormData({ ...formData, socials: newSocials });
  };

  const addSocial = () => {
    if (!formData) return;
    setFormData({ 
        ...formData, 
        socials: [...formData.socials, { platform: 'instagram', url: 'https://' }] 
    });
  };

  const removeSocial = (index: number) => {
    if (!formData) return;
    setFormData({ 
        ...formData, 
        socials: formData.socials.filter((_, i) => i !== index) 
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Template Commander</h1>
                <p className="text-slate-400 font-medium italic text-sm text-[12px] uppercase tracking-widest leading-loose">Mission-level customization of all outgoing brand communications.</p>
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
                        <t.icon className={`w-4 h-4 ${activeTab === t.id ? 'text-orange-600' : 'text-slate-300'}`} />
                        {t.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* EDITOR FORM */}
            <div className="lg:col-span-5 space-y-8">
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
                            className={`flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase italic tracking-widest shadow-xl shadow-orange-600/20 active:scale-95 transition-all ${isSaving ? 'opacity-50' : 'hover:bg-orange-700'}`}
                        >
                            {isSaving ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Persist Changes
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
                                    rows={5}
                                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:border-orange-500 focus:bg-white transition-all no-scrollbar"
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

                            <div className="pt-6 border-t border-slate-50 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-black uppercase italic text-slate-900 tracking-widest">Social Vectors</h4>
                                    <button onClick={addSocial} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all">
                                        <Plus className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {formData.socials.map((s, i) => (
                                        <div key={i} className="flex gap-2 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                            <select 
                                                value={s.platform}
                                                onChange={(e) => updateSocial(i, 'platform', e.target.value)}
                                                className="bg-white border border-slate-200 text-[10px] font-bold uppercase rounded-lg p-1 outline-none"
                                            >
                                                <option value="instagram">Instagram</option>
                                                <option value="facebook">Facebook</option>
                                                <option value="twitter">Twitter</option>
                                                <option value="website">Website</option>
                                            </select>
                                            <input 
                                                type="text" 
                                                value={s.url}
                                                onChange={(e) => updateSocial(i, 'url', e.target.value)}
                                                className="flex-1 bg-white border border-slate-200 p-2 rounded-xl text-[10px] font-medium outline-none"
                                                placeholder="https://..."
                                            />
                                            <button onClick={() => removeSocial(i)} className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* LIVE PREVIEW */}
            <div className="lg:col-span-7 bg-slate-50 rounded-[80px] p-8 lg:p-20 border border-slate-100 shadow-inner min-h-[900px] flex items-start justify-center relative sticky top-12 overflow-y-auto no-scrollbar max-h-[90vh]">
                <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-2 bg-white rounded-full border border-slate-200 shadow-sm z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Live Strategy Preview</span>
                    </div>
                    <div className="w-px h-3 bg-slate-200" />
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                </div>
                
                <div className="w-full mt-10">
                    {!formData ? (
                         <div className="flex flex-col items-center justify-center pt-40 gap-4 opacity-20">
                            <RefreshCcw className="w-12 h-12 animate-spin-slow" />
                            <p className="text-sm font-black uppercase italic">Fetching intelligence...</p>
                         </div>
                    ) : (
                        <EmailWrapper socials={formData.socials}>
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
