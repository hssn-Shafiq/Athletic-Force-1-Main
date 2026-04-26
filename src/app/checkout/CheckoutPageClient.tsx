'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck, Truck, CreditCard, Lock, ChevronLeft, ArrowRight,
  Tag, X, CheckCircle2, AlertCircle, Package, MapPin, Plus, Loader2
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-toastify';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StoreSettings {
  shippingRate: number;
  freeShippingThreshold: number;
  taxRate: number;
  taxLabel: string;
  taxEnabled: boolean;
}

interface SavedAddress {
  _id: string;
  label?: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

interface AppliedDiscount {
  id: string;
  code: string;
  type: string;
  discountAmount: number;
  freeShipping: boolean;
  description: string;
}

interface ShippingForm {
  firstName: string;
  lastName: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  saveAddress: boolean;
}

// Global Skeleton component used from @/components/ui/skeleton

// ─── Step Indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ step }: { step: number }) => {
  const steps = ['Shipping', 'Payment', 'Confirm'];
  return (
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
      {steps.map((label, i) => {
        const num = i + 1;
        const isActive = step >= num;
        const isCurrent = step === num;
        return (
          <React.Fragment key={label}>
            <div className={`flex items-center gap-1.5 ${isActive ? 'text-black' : 'text-slate-300'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border-2 transition-all ${
                isCurrent ? 'bg-black text-white border-black' :
                isActive ? 'bg-green-500 text-white border-green-500' : 'border-slate-200 text-slate-300'
              }`}>
                {isActive && !isCurrent ? '✓' : num}
              </div>
              {label}
            </div>
            {i < steps.length - 1 && <div className={`h-px w-6 ${step > num ? 'bg-green-500' : 'bg-slate-200'}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Coupon Input ─────────────────────────────────────────────────────────────
const CouponInput = ({
  cartTotal,
  onApply,
  applied,
  onRemove,
}: {
  cartTotal: number;
  onApply: (d: AppliedDiscount) => void;
  applied: AppliedDiscount | null;
  onRemove: () => void;
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async () => {
    if (!code.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const { data } = await apiClient.post('/api/discounts/validate', {
        code: code.trim().toUpperCase(),
        cartTotal,
      });
      if (data.ok) {
        onApply(data.discount);
        setCode('');
        toast.success(`Coupon "${data.discount.code}" applied — ${data.discount.description}`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid coupon code.');
    } finally {
      setIsLoading(false);
    }
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-2xl">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-black text-green-800 uppercase tracking-wider">{applied.code}</p>
            <p className="text-xs text-green-600 font-medium">{applied.description}</p>
          </div>
        </div>
        <button onClick={onRemove} className="p-1.5 hover:bg-green-100 rounded-lg transition-colors">
          <X className="w-4 h-4 text-green-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            placeholder="Coupon code"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm font-bold uppercase tracking-widest outline-none focus:border-orange-500 focus:bg-white transition-all"
          />
        </div>
        <button
          onClick={handleApply}
          disabled={isLoading || !code.trim()}
          className="px-5 py-3 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <p className="text-xs font-bold">{error}</p>
        </div>
      )}
    </div>
  );
};

// ─── Order Summary Sidebar ────────────────────────────────────────────────────
const OrderSummary = ({
  isSettingsLoading,
  settings,
  appliedDiscount,
  onApplyDiscount,
  onRemoveDiscount,
  step,
}: {
  isSettingsLoading: boolean;
  settings: StoreSettings | null;
  appliedDiscount: AppliedDiscount | null;
  onApplyDiscount: (d: AppliedDiscount) => void;
  onRemoveDiscount: () => void;
  step: number;
}) => {
  const { items, totalPrice, isLoading: cartLoading } = useCart();

  const shippingFee = !settings
    ? 0
    : appliedDiscount?.freeShipping
    ? 0
    : settings.freeShippingThreshold > 0 && totalPrice >= settings.freeShippingThreshold
    ? 0
    : settings.shippingRate;

  const discountAmount = appliedDiscount?.discountAmount ?? 0;
  const taxAmount =
    settings?.taxEnabled
      ? +((totalPrice - discountAmount) * (settings.taxRate / 100)).toFixed(2)
      : 0;
  const orderTotal = +(totalPrice - discountAmount + shippingFee + taxAmount).toFixed(2);

  return (
    <aside className="lg:w-[420px] shrink-0">
      <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-6 sticky top-32 transition-all hover:bg-white hover:shadow-xl hover:border-slate-200">
        <h3 className="text-xl font-black uppercase tracking-tighter italic pb-4 border-b border-slate-200 flex items-center gap-2 text-slate-900">
          <Package className="w-5 h-5 text-orange-600" /> Your Bag
        </h3>

        {/* Cart Items */}
        {cartLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-16 h-16 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-h-56 overflow-y-auto space-y-4 pr-1">
            {items.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium text-center py-4">Your cart is empty</p>
            ) : (
              items.map((item) => (
                <div key={item.variantSku} className="flex gap-3">
                  <div className="relative w-14 h-14 bg-white rounded-xl shrink-0 border border-slate-200 overflow-hidden">
                    <Image
                      src={item.imageUrl || '/placeholder.png'}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                      unoptimized
                    />
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">{item.name}</p>
                    {(item.size || item.color) && (
                      <p className="text-[10px] text-slate-400 font-medium">
                        {[item.color, item.size].filter(Boolean).join(' / ')}
                      </p>
                    )}
                    <p className="text-xs font-black text-slate-700">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Coupon — only show on shipping/payment steps */}
        {step < 3 && (
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coupon Code</p>
            {isSettingsLoading ? (
              <Skeleton className="h-11 w-full" />
            ) : (
              <CouponInput
                cartTotal={totalPrice}
                onApply={onApplyDiscount}
                applied={appliedDiscount}
                onRemove={onRemoveDiscount}
              />
            )}
          </div>
        )}

        {/* Totals */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          {isSettingsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
            </div>
          ) : (
            <>
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="text-slate-900 font-black">${totalPrice.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs font-bold text-green-600 uppercase tracking-widest">
                  <span>Discount ({appliedDiscount?.code})</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span>Shipping</span>
                <span className={shippingFee === 0 ? 'text-green-600 font-black' : 'text-slate-900 font-black'}>
                  {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}
                </span>
              </div>
              {settings?.taxEnabled && (
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span>{settings.taxLabel} ({settings.taxRate}%)</span>
                  <span className="text-slate-900 font-black">${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <span className="text-lg font-black uppercase tracking-tighter italic text-slate-900">Total</span>
                <span className="text-2xl font-black text-slate-900">${orderTotal.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest justify-center">
          <ShieldCheck className="w-4 h-4" />
          Athletic Force 1 Security
        </div>
      </div>
    </aside>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CheckoutPageClient() {
  const router = useRouter();
  const { items, totalPrice, clearCart, isLoading: cartLoading } = useCart();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isOrderSuccessful, setIsOrderSuccessful] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [shippingForm, setShippingForm] = useState<ShippingForm>({
    firstName: '',
    lastName: '',
    email: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    phone: '',
    saveAddress: false,
  });

  const [trackingSessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('af1_checkout_session_id');
      if (!id) {
        id = `cs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('af1_checkout_session_id', id);
      }
      return id;
    }
    return '';
  });

  const trackStep = useCallback(
    async (stepName: string) => {
      if (!trackingSessionId) return;
      try {
        await apiClient.post('/api/tracking/checkout', {
          sessionId: trackingSessionId,
          step: stepName,
          guestEmail: shippingForm?.email || undefined,
          cartSnapshot: items,
          totalValue: totalPrice,
        });
        if (stepName === 'completed') {
          localStorage.removeItem('af1_checkout_session_id');
        }
      } catch (e) {
        // silent fail
      }
    },
    [trackingSessionId, shippingForm?.email, items, totalPrice]
  );

  const hasTrackedStart = React.useRef(false);
  useEffect(() => {
    if (!cartLoading && items.length > 0 && !hasTrackedStart.current) {
      hasTrackedStart.current = true;
      trackStep('checkout_started');
    }
  }, [cartLoading, items.length, trackStep]);

  // Load store settings and saved addresses
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await apiClient.get('/api/store/settings');
        if (data.ok) setSettings(data.settings);
      } catch (e) {
        console.error('Failed to load store settings', e);
      } finally {
        setIsSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    const fetchAddresses = async () => {
      try {
        const { data } = await apiClient.get('/api/auth/addresses');
        if (data.ok) setSavedAddresses(data.addresses);
      } catch (e) {
        console.error('Failed to load addresses', e);
      }
    };
    fetchAddresses();
  }, [isAuthenticated, authLoading]);

  // Pre-fill from user + default address
  useEffect(() => {
    if (!user) return;
    const nameParts = user.name.split(' ');
    const defaultAddr = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];

    setShippingForm((prev) => ({
      ...prev,
      firstName: prev.firstName || nameParts[0] || '',
      lastName: prev.lastName || nameParts.slice(1).join(' ') || '',
      email: prev.email || user.email || '',
      ...(defaultAddr && {
        address1: prev.address1 || defaultAddr.address1,
        address2: prev.address2 || defaultAddr.address2 || '',
        city: prev.city || defaultAddr.city,
        state: prev.state || defaultAddr.state || '',
        postalCode: prev.postalCode || defaultAddr.postalCode,
        country: prev.country || defaultAddr.country,
        phone: prev.phone || defaultAddr.phone || '',
      }),
    }));
  }, [user, savedAddresses]);

  const updateForm = (field: keyof ShippingForm, value: string | boolean) => {
    setShippingForm((prev) => ({ ...prev, [field]: value }));
  };

  const fillFromSaved = (addr: SavedAddress) => {
    setShippingForm((prev) => ({
      ...prev,
      firstName: addr.firstName,
      lastName: addr.lastName,
      address1: addr.address1,
      address2: addr.address2 || '',
      city: addr.city,
      state: addr.state || '',
      postalCode: addr.postalCode,
      country: addr.country,
      phone: addr.phone || '',
    }));
  };

  const isShippingValid =
    shippingForm.firstName.trim() &&
    shippingForm.lastName.trim() &&
    shippingForm.email.trim() &&
    shippingForm.address1.trim() &&
    shippingForm.city.trim() &&
    shippingForm.postalCode.trim();

  // Computed totals
  const shippingFee = !settings
    ? 0
    : appliedDiscount?.freeShipping
    ? 0
    : settings.freeShippingThreshold > 0 && totalPrice >= settings.freeShippingThreshold
    ? 0
    : settings.shippingRate;

  const discountAmount = appliedDiscount?.discountAmount ?? 0;
  const taxAmount =
    settings?.taxEnabled
      ? +((totalPrice - discountAmount) * (settings.taxRate / 100)).toFixed(2)
      : 0;
  const orderTotal = +(totalPrice - discountAmount + shippingFee + taxAmount).toFixed(2);

  const handleContinueToPayment = async () => {
    if (!isShippingValid) return;

    // Save address if user is logged in and requested
    if (isAuthenticated && shippingForm.saveAddress) {
      try {
        await apiClient.post('/api/auth/addresses', {
          firstName: shippingForm.firstName,
          lastName: shippingForm.lastName,
          address1: shippingForm.address1,
          address2: shippingForm.address2 || undefined,
          city: shippingForm.city,
          state: shippingForm.state || undefined,
          postalCode: shippingForm.postalCode,
          country: shippingForm.country,
          phone: shippingForm.phone || undefined,
          isDefault: savedAddresses.length === 0,
        });
        toast.success('Address saved for future use!');
      } catch {
        // Non-blocking — just skip
      }
    }

    trackStep('shipping_entered');
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setIsPlacingOrder(true);

    const paypalEnabled = process.env.NEXT_PUBLIC_PAYPAL_ENABLED === 'true';

    const orderPayload = {
      shippingAddress: {
        firstName: shippingForm.firstName,
        lastName: shippingForm.lastName,
        email: shippingForm.email,
        address1: shippingForm.address1,
        address2: shippingForm.address2 || undefined,
        city: shippingForm.city,
        state: shippingForm.state || undefined,
        postalCode: shippingForm.postalCode,
        country: shippingForm.country,
        phone: shippingForm.phone || undefined,
      },
      discountCode: appliedDiscount?.code,
      items: items.map(item => ({
        productId: item.productId,
        variantSku: item.variantSku,
        name: item.name,
        imageUrl: item.imageUrl,
        price: item.price,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
      })),
    };

    try {
      if (!paypalEnabled) {
        // --- DEV BYPASS: place order without payment ---
        const { data } = await apiClient.post('/api/orders/dev-bypass', orderPayload);
        if (data.ok) {
          trackStep('completed');
          setIsOrderSuccessful(true); // Tactical Guard Active
          await clearCart(); // Reset the tactical staging area
          router.push(`/thank-you?orderId=${data.order.id}`);
        }
      } else {
        // --- LIVE PAYPAL: create order server-side ---
        const { data: createData } = await apiClient.post('/api/orders/create', {
          ...orderPayload,
          clientTotal: orderTotal,
        });

        if (!createData.ok) {
          toast.error('Failed to initiate payment.');
          return;
        }

        // Note: For live PayPal, we would clear the cart AFTER capture success, 
        // but for now, we reset state to keep the UI clean.
        setIsOrderSuccessful(true);
        await clearCart(); 
        toast.info(`PayPal Order created: ${createData.paypalOrderId}. Integrate PayPal JS SDK for browser approval flow.`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Redirect if cart is empty and not loading (and not currently placing/finishing order)
  useEffect(() => {
    if (!cartLoading && !authLoading && items.length === 0 && step < 3 && !isPlacingOrder && !isOrderSuccessful) {
      router.push('/cart');
    }
  }, [cartLoading, authLoading, items.length, step, router, isPlacingOrder, isOrderSuccessful]);

  if (cartLoading || authLoading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="flex-1 space-y-10">
              <Skeleton className="h-20 w-1/2" />
              <div className="space-y-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
            <aside className="lg:w-[420px]">
              <Skeleton className="h-[600px] w-full rounded-[40px]" />
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* LEFT COLUMN */}
          <div className="flex-1 min-w-0 space-y-10">
            {/* Nav row */}
            <div className="flex items-center gap-4">
              {step > 1 && step < 3 ? (
                <button onClick={() => setStep(step - 1)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              ) : (
                <Link href="/cart" className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </Link>
              )}
              <div>
                <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter italic text-slate-900">Checkout</h1>
                <div className="mt-2">
                  <StepIndicator step={step} />
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* ─── STEP 1: SHIPPING ─── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <div className="space-y-5">
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-slate-900">
                      <Truck className="w-5 h-5 text-orange-600" /> Shipping Information
                    </h2>

                    {/* Saved address selector */}
                    {isAuthenticated && savedAddresses.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saved Addresses</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {savedAddresses.map((addr) => (
                            <button
                              key={addr._id}
                              onClick={() => fillFromSaved(addr)}
                              className="text-left p-4 rounded-2xl border-2 border-slate-100 hover:border-orange-400 hover:bg-orange-50 transition-all group"
                            >
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-slate-400 group-hover:text-orange-500 mt-0.5 shrink-0" />
                                <div>
                                  {addr.label && <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{addr.label}</p>}
                                  <p className="text-xs font-black text-slate-900">{addr.firstName} {addr.lastName}</p>
                                  <p className="text-xs text-slate-500 font-medium">{addr.address1}, {addr.city}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Guest CTA */}
                    {!isAuthenticated && !authLoading && (
                      <div className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-black text-slate-900">Already a member? Sign in for a faster checkout!</p>
                          <p className="text-xs text-slate-500 font-medium">Access saved addresses, track orders & earn rewards.</p>
                        </div>
                        <Link
                          href={`/login?next=/checkout`}
                          className="shrink-0 px-5 py-2.5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all"
                        >
                          Sign In
                        </Link>
                      </div>
                    )}

                    {/* Shipping form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { field: 'firstName', label: 'First Name', placeholder: 'John', span: 1 },
                        { field: 'lastName', label: 'Last Name', placeholder: 'Doe', span: 1 },
                        { field: 'email', label: 'Email', placeholder: 'john@example.com', type: 'email', span: 2 },
                        { field: 'address1', label: 'Address Line 1', placeholder: '123 Elite Street', span: 2 },
                        { field: 'address2', label: 'Address Line 2 (Optional)', placeholder: 'Apt 4B', span: 2 },
                        { field: 'city', label: 'City', placeholder: 'New York', span: 1 },
                        { field: 'postalCode', label: 'Postal Code', placeholder: '10001', span: 1 },
                        { field: 'state', label: 'State / Province', placeholder: 'NY', span: 1 },
                        { field: 'country', label: 'Country', placeholder: 'US', span: 1 },
                        { field: 'phone', label: 'Phone (Optional)', placeholder: '+1 555 000 0000', type: 'tel', span: 2 },
                      ].map(({ field, label, placeholder, type = 'text', span }) => (
                        <div key={field} className={`space-y-2 ${span === 2 ? 'md:col-span-2' : ''}`}>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</label>
                          <input
                            type={type}
                            value={shippingForm[field as keyof ShippingForm] as string}
                            onChange={(e) => updateForm(field as keyof ShippingForm, e.target.value)}
                            placeholder={placeholder}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-orange-500 focus:bg-white transition-all"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Save address toggle */}
                    {isAuthenticated && (
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div
                          onClick={() => updateForm('saveAddress', !shippingForm.saveAddress)}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            shippingForm.saveAddress ? 'bg-black border-black' : 'border-slate-300 group-hover:border-slate-500'
                          }`}
                        >
                          {shippingForm.saveAddress && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm font-bold text-slate-600">Save this address to my account</span>
                      </label>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <Link
                      href="/cart"
                      className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-black flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" /> Return to Bag
                    </Link>
                    <button
                      onClick={handleContinueToPayment}
                      disabled={!isShippingValid}
                      className="bg-black text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-xl hover:bg-orange-600 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Continue to Payment <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ─── STEP 2: PAYMENT ─── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-slate-900">
                    <CreditCard className="w-5 h-5 text-blue-600" /> Payment Method
                  </h2>

                  {/* Order review */}
                  <div className="bg-slate-50 rounded-2xl p-5 space-y-2 border border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> Shipping To
                    </p>
                    <p className="text-sm font-bold text-slate-900">{shippingForm.firstName} {shippingForm.lastName}</p>
                    <p className="text-xs text-slate-500 font-medium">
                      {shippingForm.address1}{shippingForm.address2 ? `, ${shippingForm.address2}` : ''}, {shippingForm.city}, {shippingForm.postalCode}
                    </p>
                    <button onClick={() => setStep(1)} className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline">
                      Edit
                    </button>
                  </div>

                  {/* PayPal Block */}
                  <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 space-y-6 text-center shadow-sm">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-blue-900 font-black italic text-3xl">Pay</span>
                      <span className="text-blue-500 font-black italic text-3xl">Pal</span>
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Safe. Simple. Secure.</p>
                    <p className="text-sm text-slate-500">
                      You will be redirected to PayPal to complete your payment of{' '}
                      <strong className="text-slate-900">${orderTotal.toFixed(2)}</strong>.
                    </p>

                    {/* PayPal — dev bypass when NEXT_PUBLIC_PAYPAL_ENABLED=false */}
                    <button
                      onClick={handlePlaceOrder}
                      disabled={isPlacingOrder}
                      className="w-full max-w-sm mx-auto bg-[#FFD140] hover:bg-[#F2C530] text-[#003087] font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                    >
                      {isPlacingOrder ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>Pay with <span className="italic">PayPal</span></>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <Lock className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">256-bit SSL Encrypted</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(1)}
                    className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-black flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back to Shipping
                  </button>
                </motion.div>
              )}


            </AnimatePresence>
          </div>

          {/* RIGHT COLUMN — Order Summary */}
          <OrderSummary
            isSettingsLoading={isSettingsLoading}
            settings={settings}
            appliedDiscount={appliedDiscount}
            onApplyDiscount={setAppliedDiscount}
            onRemoveDiscount={() => setAppliedDiscount(null)}
            step={step}
          />
        </div>
      </div>
    </div>
  );
}
