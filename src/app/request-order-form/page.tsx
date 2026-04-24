
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  Trophy, 
  Map, 
  Palette, 
  Calendar, 
  Package, 
  Layers, 
  Upload, 
  FileText, 
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  ArrowLeft,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", 
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", 
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", 
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", 
  "West Virginia", "Wisconsin", "Wyoming"
];

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface HierarchyItem {
  id: string;
  name: string;
  slug: string;
  subcategories: { id: string; name: string; slug: string }[];
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
}

interface FormState {
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  phone: string;
  teamName: string;
  state: string;
  requiredColor: string;
  expectedDeliveryDate: string;
  category: string;
  subcategory: string;
  product: string;
  productId: string;
  quantity: string;
  designDetails: string;
  additionalRequests: string;
  logo: File | null;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function RequestOrderFormPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
            </div>
        }>
            <RequestOrderFormContent />
        </Suspense>
    );
}

function RequestOrderFormContent() {
  const { user, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Data State
  const [hierarchy, setHierarchy] = useState<HierarchyItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    address: '',
    email: '',
    phone: '',
    teamName: '',
    state: '',
    requiredColor: '',
    expectedDeliveryDate: '',
    category: '',
    subcategory: '',
    product: '',
    productId: '',
    quantity: '',
    designDetails: '',
    additionalRequests: '',
    logo: null
  });

  // ─── EFFECTS ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isAuthenticated && user) {
        const address = (user as any).savedAddresses?.find((a: any) => a.isDefault) || (user as any).savedAddresses?.[0];
        setForm(prev => ({
            ...prev,
            firstName: address?.firstName || user.name.split(' ')[0] || '',
            lastName: address?.lastName || user.name.split(' ').slice(1).join(' ') || '',
            email: user.email,
            phone: address?.phone || '',
            address: address ? `${address.address1}, ${address.city}` : '',
            state: address?.state || ''
        }));
    }
  }, [isAuthenticated, user]);

  // Tactical Pre-fill: Ingest search params from mission parameters
  useEffect(() => {
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const product = searchParams.get('product');
    const productId = searchParams.get('productId');

    if (category || subcategory || product || productId) {
        setForm(prev => ({
            ...prev,
            category: category || prev.category,
            subcategory: subcategory || prev.subcategory,
            product: product || prev.product,
            productId: productId || prev.productId
        }));
        
        // Auto-advance to Phase 02 if we have valid product intelligence
        if (product && category && subcategory) {
            setStep(2);
        }
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchHierarchy = async () => {
        try {
            const res = await apiClient.get('/api/collections/customization-hierarchy');
            if (res.data.ok) {
                setHierarchy(res.data.hierarchy);
            }
        } catch (err) {
            toast.error("Failed to fetch customization intelligence hierarchy.");
        } finally {
            setIsLoadingHierarchy(false);
        }
    };
    fetchHierarchy();
  }, []);

  useEffect(() => {
    if (form.subcategory) {
        const selectedSub = hierarchy
            .flatMap(p => p.subcategories)
            .find(s => s.name === form.subcategory);
        
        if (selectedSub) {
            const fetchProducts = async () => {
                setIsLoadingProducts(true);
                try {
                    const res = await apiClient.get(`/api/products/explore?collection=${selectedSub.slug}`);
                    if (res.data.ok) {
                        setProducts(res.data.items);
                    }
                } catch (err) {
                    toast.error("Failed to load tactical product list.");
                } finally {
                    setIsLoadingProducts(false);
                }
            };
            fetchProducts();
        }
    } else {
        setProducts([]);
        setForm(prev => ({ ...prev, product: '', productId: '' }));
    }
  }, [form.subcategory, hierarchy]);

  // ─── HANDLERS ──────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'category') {
        setForm(prev => ({ ...prev, category: value, subcategory: '', product: '', productId: '' }));
    } else if (name === 'subcategory') {
        setForm(prev => ({ ...prev, subcategory: value, product: '', productId: '' }));
    } else if (name === 'product') {
        const selectedProd = products.find(p => p.name === value);
        setForm(prev => ({ ...prev, product: value, productId: selectedProd?.id || '' }));
    } else {
        setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setForm(prev => ({ ...prev, logo: e.target.files![0] }));
    }
  };

  const validateStep = (s: number) => {
    if (s === 1) {
        return form.firstName && form.lastName && form.email && form.phone && form.address && form.teamName && form.state;
    }
    if (s === 2) {
        return form.requiredColor && form.expectedDeliveryDate && form.category && form.subcategory && form.product;
    }
    if (s === 3) {
        return form.quantity && form.logo && form.designDetails;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (key === 'logo' && value) {
                formData.append('logo', value);
            } else {
                formData.append(key, String(value || ''));
            }
        });

        const res = await apiClient.post('/api/orders/request-quote', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.data.ok) {
            setIsSubmitted(true);
            toast.success("Intelligence report received. A tactical advisor will contact you shortly.");
        }
    } catch (err: any) {
        const errorData = err.response?.data;
        const errorMessage = errorData?.message || "Transmission failed. Check for restricted content.";
        const offendingField = errorData?.field;

        toast.error(errorMessage);

        if (offendingField) {
            // Tactical Maneuver: Determine the correct phase for the offending field
            const fieldStepMap: Record<string, number> = {
                firstName: 1, lastName: 1, email: 1, phone: 1, address: 1, state: 1, teamName: 1,
                category: 2, subcategory: 2, product: 2, requiredColor: 2, expectedDeliveryDate: 2,
                quantity: 3, logo: 3, designDetails: 3, additionalRequests: 3
            };

            const targetStep = fieldStepMap[offendingField];
            if (targetStep) {
                setStep(targetStep);
                // Wait for DOM update, then focus
                setTimeout(() => {
                    const el = document.getElementsByName(offendingField)[0] as HTMLElement;
                    if (el) {
                        el.focus();
                        el.classList.add('ring-2', 'ring-red-500', 'border-red-500');
                        setTimeout(() => el.classList.remove('ring-2', 'ring-red-500', 'border-red-500'), 3000);
                    }
                }, 100);
            }
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────

  if (isSubmitted) {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full text-center space-y-10"
            >
                <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[40px] flex items-center justify-center mx-auto shadow-2xl shadow-green-600/10">
                    <CheckCircle2 className="w-12 h-12" />
                </div>
                <div className="space-y-4">
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Transmission <br /> Successful</h1>
                    <p className="text-slate-500 font-medium italic">Your custom order request has been logged into the AF1 command center. Our team of elite designers is already analyzing your dossier.</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4 text-left">
                    <ShieldCheck className="w-8 h-8 text-orange-600" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Response Protocol</p>
                        <p className="text-sm font-bold text-slate-900 italic">Expected reply within 24-48 Business Hours</p>
                    </div>
                </div>
                <Link href="/" className="block w-full bg-[#141414] text-white py-5 rounded-2xl font-black uppercase italic tracking-tighter text-xl hover:bg-black transition-all shadow-xl">
                    Back to HQ
                </Link>
            </motion.div>
        </div>
    );
  }

  const selectedCategory = hierarchy.find(c => c.name === form.category);

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
        {/* Header Section */}
        <div className="bg-[#141414] text-white py-20 px-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 flex items-center justify-center font-black italic text-[20vw] tracking-tighter leading-none pointer-events-none select-none">
                CUSTOM
            </div>
            <div className="max-w-4xl mx-auto relative z-10 space-y-4 text-center">
                <Link href="/" className="inline-flex items-center gap-2 text-orange-500 font-black uppercase italic text-xs mb-8 hover:text-orange-400 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Exit to Storefront
                </Link>
                <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85] animate-in slide-in-from-bottom duration-700">
                    Tactical <br /> <span className="text-orange-500">Customization</span>
                </h1>
                <p className="text-slate-400 font-medium italic max-w-lg mx-auto">
                    Fill in your deployment details below — our elite team will analyze your requirements and issue a tailored tactical quote.
                </p>
            </div>
        </div>

        <div className="max-w-4xl mx-auto px-8 -mt-10 pb-20 relative z-20">
            <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 p-8 md:p-12 space-y-12 overflow-hidden">
                
                {/* Stepper */}
                <div className="flex items-center gap-4">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex-1 flex flex-col gap-2">
                            <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'bg-orange-600' : 'bg-slate-100'}`} />
                            <span className={`text-[9px] font-black uppercase tracking-widest italic ${step >= s ? 'text-slate-900' : 'text-slate-400'}`}>
                                Phase 0{s}
                            </span>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div 
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                                        <User className="w-6 h-6 text-orange-600" /> Personnel Information
                                    </h2>
                                    <p className="text-slate-400 text-xs font-medium italic uppercase tracking-widest">Identifying the leadership contact for this deployment.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormInput label="First Name" name="firstName" value={form.firstName} onChange={handleChange} required icon={User} placeholder="John" />
                                    <FormInput label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} required icon={User} placeholder="Doe" />
                                    <FormInput label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} required icon={Mail} placeholder="john@example.com" />
                                    <FormInput label="Phone Number" name="phone" value={form.phone} onChange={handleChange} required icon={Phone} placeholder="+1 (555) 000-0000" />
                                    <FormInput label="Full Address" name="address" value={form.address} onChange={handleChange} required icon={MapPin} placeholder="123 Alpha Street, Sector 1" />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Map className="w-3 h-3 text-orange-600" /> Your State *
                                        </label>
                                        <select 
                                            name="state"
                                            value={form.state}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:border-orange-500 focus:bg-white transition-all appearance-none"
                                        >
                                            <option value="">Please Select</option>
                                            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <FormInput label="Team / Organization Name" name="teamName" value={form.teamName} onChange={handleChange} required icon={Trophy} placeholder="Eagles FC / Tactical Division" />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div 
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                                        <Package className="w-6 h-6 text-orange-600" /> Logistics & Selection
                                    </h2>
                                    <p className="text-slate-400 text-xs font-medium italic uppercase tracking-widest">Defining the scope and timeline of the order.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Layers className="w-3 h-3 text-orange-600" /> Category *
                                        </label>
                                        <div className="relative">
                                            <select 
                                                name="category"
                                                value={form.category}
                                                onChange={handleChange}
                                                required
                                                disabled={isLoadingHierarchy}
                                                className={`w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:border-orange-500 focus:bg-white transition-all appearance-none ${isLoadingHierarchy ? 'opacity-50' : ''}`}
                                            >
                                                <option value="">— Select Category —</option>
                                                {hierarchy.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                            </select>
                                            {isLoadingHierarchy && <div className="absolute inset-0 bg-slate-100/50 animate-pulse rounded-2xl" />}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Layers className="w-3 h-3 text-orange-600" /> Subcategory *
                                        </label>
                                        <div className="relative">
                                            <select 
                                                name="subcategory"
                                                value={form.subcategory}
                                                onChange={handleChange}
                                                required
                                                disabled={!form.category || isLoadingHierarchy}
                                                className={`w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:border-orange-500 focus:bg-white transition-all appearance-none ${(!form.category || isLoadingHierarchy) ? 'opacity-50' : ''}`}
                                            >
                                                <option value="">— Select Subcategory —</option>
                                                {selectedCategory?.subcategories.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Package className="w-3 h-3 text-orange-600" /> Product Name *
                                        </label>
                                        <div className="relative">
                                            <select 
                                                name="product"
                                                value={form.product}
                                                onChange={handleChange}
                                                required
                                                disabled={!form.subcategory || isLoadingProducts}
                                                className={`w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:border-orange-500 focus:bg-white transition-all appearance-none ${(!form.subcategory || isLoadingProducts) ? 'opacity-50' : ''}`}
                                            >
                                                <option value="">— Select Product —</option>
                                                {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                            </select>
                                            {isLoadingProducts && <div className="absolute inset-y-0 right-4 flex items-center"><Loader2 className="w-4 h-4 animate-spin text-orange-600" /></div>}
                                            {(!form.subcategory && !isLoadingProducts) && <div className="absolute inset-0 bg-slate-50/80 cursor-not-allowed rounded-2xl flex items-center justify-center"><p className="text-[10px] font-black uppercase italic text-slate-300">Select Subcategory First</p></div>}
                                        </div>
                                    </div>
                                    <FormInput label="Required Color Scheme" name="requiredColor" value={form.requiredColor} onChange={handleChange} required icon={Palette} placeholder="e.g. Red, White & Charcoal" />
                                    <FormInput label="Expected Delivery Date" name="expectedDeliveryDate" type="date" value={form.expectedDeliveryDate} onChange={handleChange} required icon={Calendar} />
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div 
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                                        <Palette className="w-6 h-6 text-orange-600" /> Customization Dossier
                                    </h2>
                                    <p className="text-slate-400 text-xs font-medium italic uppercase tracking-widest">Advanced detailing for specific operational requirements.</p>
                                </div>

                                <div className="space-y-6">
                                    <FormInput label="Order Quantity" name="quantity" type="number" value={form.quantity} onChange={handleChange} required icon={Layers} placeholder="e.g. 25" />
                                    
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Upload className="w-3 h-3 text-orange-600" /> Upload High Quality Logo *
                                        </label>
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full bg-slate-50 border-2 border-dashed border-slate-200 p-10 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-orange-500 hover:bg-orange-50/10 transition-all"
                                        >
                                            {form.logo ? (
                                                <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                                    <FileText className="w-6 h-6 text-orange-600" />
                                                    <div className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{form.logo.name}</div>
                                                    <button onClick={(e) => { e.stopPropagation(); setForm(prev => ({...prev, logo: null})); }} className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                        <Upload className="w-8 h-8 text-slate-300" />
                                                    </div>
                                                    <p className="text-xs font-black uppercase italic text-slate-400 tracking-widest">Click to select Vector or High-Res Image</p>
                                                </>
                                            )}
                                        </div>
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Palette className="w-3 h-3 text-orange-600" /> Product Mockup / Design Details *
                                        </label>
                                        <textarea 
                                            name="designDetails"
                                            value={form.designDetails}
                                            onChange={handleChange}
                                            required
                                            rows={5}
                                            placeholder="Describe your design: colors, placement, font style, numbers, names, logos, etc."
                                            className="w-full bg-slate-50 border border-slate-100 p-6 rounded-[30px] text-xs font-bold outline-none focus:border-orange-500 focus:bg-white transition-all no-scrollbar"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <FileText className="w-3 h-3 text-orange-600" /> Additional Special Requests
                                        </label>
                                        <textarea 
                                            name="additionalRequests"
                                            value={form.additionalRequests}
                                            onChange={handleChange}
                                            rows={3}
                                            placeholder="Any special notes or requests for our team..."
                                            className="w-full bg-slate-50 border border-slate-100 p-6 rounded-[30px] text-xs font-bold outline-none focus:border-orange-500 focus:bg-white transition-all no-scrollbar"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-10 border-t border-slate-50">
                        {step > 1 ? (
                            <button 
                                type="button"
                                onClick={() => setStep(step - 1)}
                                className="flex items-center gap-2 px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase italic tracking-widest hover:bg-slate-200 transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" /> Go Back
                            </button>
                        ) : <div />}

                        {step < 3 ? (
                            <button 
                                type="button"
                                onClick={() => setStep(step + 1)}
                                disabled={!validateStep(step)}
                                className={`flex items-center gap-2 px-10 py-5 bg-orange-600 text-white rounded-2xl text-[12px] font-black uppercase italic tracking-[0.2em] shadow-xl shadow-orange-600/20 active:scale-95 transition-all ${!validateStep(step) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-700'}`}
                            >
                                Proceed to Phase 0{step + 1} <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button 
                                type="submit"
                                disabled={isSubmitting || !validateStep(3)}
                                className={`flex items-center gap-2 px-10 py-5 bg-[#141414] text-white rounded-2xl text-[12px] font-black uppercase italic tracking-[0.2em] shadow-xl shadow-black/20 active:scale-95 transition-all ${isSubmitting ? 'opacity-50' : 'hover:bg-black'}`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Transmitting...
                                    </>
                                ) : (
                                    <>
                                        Deploy Request <Send className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>

                {/* Security Footer */}
                <div className="pt-12 flex flex-col md:flex-row items-center justify-between gap-6 opacity-30 group grayscale hover:grayscale-0 transition-all">
                     <div className="flex items-center gap-3">
                        <ShieldCheck className="w-10 h-10 text-orange-600" />
                        <div>
                            <p className="text-[10px] font-black uppercase italic tracking-widest">Secure Intelligence Protocol</p>
                            <p className="text-[8px] font-bold uppercase">AF1 Encryption Active • Phishing Protection Enabled</p>
                        </div>
                     </div>
                     <p className="text-[8px] font-bold uppercase italic max-w-xs text-center md:text-right">
                        All submissions are scanned for malicious content. External links in text fields will result in automatic mission abort.
                     </p>
                </div>

            </div>
        </div>
    </div>
  );
}

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────

function FormInput({ label, name, type = 'text', value, onChange, required, icon: Icon, placeholder }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                {Icon && <Icon className="w-3 h-3 text-orange-600" />} {label} {required && '*'}
            </label>
            <input 
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
        </div>
    );
}
