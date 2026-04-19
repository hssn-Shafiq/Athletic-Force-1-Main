"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShieldCheck, Truck, CreditCard, Lock, ChevronLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
};

const items: CartItem[] = [
  {
    id: "1",
    title: "Elite Performance Hoodie",
    price: 89.99,
    quantity: 1,
    image: "https://af1.groomyorlife.com/wp-content/uploads/2026/01/Background.png",
  },
  {
    id: "2",
    title: "Pro-Focus Visor",
    price: 34.99,
    quantity: 1,
    image: "https://af1.groomyorlife.com/wp-content/uploads/2026/01/Background.png",
  },
];

export default function CheckoutPageClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-1 space-y-12">
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em]">
            <span className={`${step >= 1 ? "text-black" : "text-slate-300"}`}>01 Shipping</span>
            <span className="text-slate-200">/</span>
            <span className={`${step >= 2 ? "text-black" : "text-slate-300"}`}>02 Payment</span>
            <span className="text-slate-200">/</span>
            <span className="text-slate-300">03 Confirm</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/cart")} className="lg:hidden p-2 bg-slate-100 rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">Checkout</h1>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-10"
              >
                <div className="space-y-6">
                  <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                    <Truck className="w-6 h-6 text-orange-600" />
                    Shipping Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">First Name</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-black transition-all" placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Last Name</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-black transition-all" placeholder="Doe" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Address Line 1</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-black transition-all" placeholder="123 Elite St" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">City</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-black transition-all" placeholder="Performance City" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Postal Code</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-black transition-all" placeholder="12345" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                  <button
                    onClick={() => router.push("/cart")}
                    className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-black flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Return to Bag
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="bg-black text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98]"
                  >
                    Continue to Payment
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="space-y-6">
                  <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    Payment Method
                  </h2>
                  <p className="text-sm text-slate-500 font-sans">
                    At Athletic Force 1, we use PayPal for all secure transactions. Click below to complete your order.
                  </p>

                  <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-8 space-y-6 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-1 group">
                      <span className="text-blue-900 font-black italic text-2xl">Pay</span>
                      <span className="text-blue-500 font-black italic text-2xl">Pal</span>
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Safe. Simple. Secure.</p>

                    <button
                      onClick={() => router.push("/")}
                      className="w-full max-w-sm bg-[#FFD140] hover:bg-[#F2C530] text-[#003087] font-black italic py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                    >
                      <span className="normal-case not-italic">Pay with</span>
                      <span className="italic">PayPal</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 text-slate-400">
                  <Lock className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Encrypted checkout session</span>
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-black flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Shipping
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="lg:w-96">
          <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-8 sticky top-32 transition-all hover:bg-white hover:shadow-xl hover:border-slate-200">
            <h3 className="text-xl font-black uppercase tracking-tighter italic pb-4 border-b border-slate-200">Your Bag</h3>

            <div className="max-h-80 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-20 h-20 bg-white rounded-xl shrink-0 border border-slate-200 overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="text-xs font-black text-slate-900 leading-tight">{item.title}</h4>
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Qty: {item.quantity}</span>
                      <span className="text-sm font-black text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-200">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                <span>Subtotal</span>
                <span className="text-slate-900 font-black">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                <span>Shipping</span>
                <span className="text-green-600 font-black uppercase tracking-widest">Free</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <span className="text-lg font-black uppercase tracking-tighter italic">Total</span>
                <span className="text-2xl font-black text-slate-900">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest justify-center">
              <ShieldCheck className="w-4 h-4" />
              Athletic Force 1 Security
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
