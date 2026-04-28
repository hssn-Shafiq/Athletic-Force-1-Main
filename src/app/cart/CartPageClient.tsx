"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { EmptyCart } from "./_components/EmptyCart";

import { useCart } from "@/contexts/CartContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function CartPageClient() {
  const router = useRouter();
  const { items, isLoading, updateQuantity, removeItem, totalPrice } = useCart();

  const shipping = 0;
  const total = totalPrice + shipping;

  const onUpdateQuantity = (id: string, delta: number) => {
    const item = items.find((i) => i.variantSku === id);
    if (!item) return;
    updateQuantity(id, item.quantity + delta);
  };

  const onRemoveItem = (id: string) => {
    removeItem(id);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="flex flex-col gap-12 lg:flex-row">
          <div className="flex-1 space-y-8">
            <Skeleton className="h-10 w-1/2" />
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-3xl" />
              ))}
            </div>
          </div>
          <aside className="lg:w-96">
            <Skeleton className="h-[500px] w-full rounded-[40px]" />
          </aside>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <EmptyCart onContinueShopping={() => router.push("/")} />
      </div>
    );
  }


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <div className="flex flex-col gap-12 lg:flex-row">
        <div className="flex-1 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-6 gap-2">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter italic text-slate-900">Shopping Bag</h1>
            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">
              {items.length} Items in bag
            </span>
          </div>

          <div className="space-y-6">
            {items.map((item) => {
              const productSlug = item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');
              return (
              <motion.div
                layout
                key={item.variantSku}
                className="flex flex-col sm:flex-row gap-6 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group transition-all hover:bg-white hover:shadow-xl hover:border-slate-200"
              >
                <Link
                  href={`/products/${productSlug}`}
                  className="relative w-full sm:w-40 aspect-square bg-slate-100 rounded-2xl overflow-hidden shrink-0 border border-slate-200 block"
                >
                  <Image
                    src={item.imageUrl || '/placeholder.png'}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 160px"
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    unoptimized
                  />
                </Link>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        {item.color && (
                          <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1 block">
                            {item.color}
                          </span>
                        )}
                        <Link href={`/products/${productSlug}`}>
                          <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight hover:text-orange-600 transition-colors cursor-pointer">{item.name}</h3>
                        </Link>
                        {item.bundleId && (
                          <div className="flex items-center gap-2 mt-2">
                             <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic border border-orange-200">
                                Tactical Bundle
                             </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.variantSku)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-6 mt-4">
                      {item.size && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Size</span>
                          <span className="text-sm font-black text-slate-900 border border-slate-200 px-3 py-1 rounded-lg bg-white uppercase">
                            {item.size}
                          </span>
                        </div>
                      )}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Price</span>
                        <div className="flex items-center gap-2">
                          {item.originalPrice && item.originalPrice !== item.price && (
                            <span className="text-xs text-slate-400 line-through font-bold">
                              ${item.originalPrice.toFixed(2)}
                            </span>
                          )}
                          <span className="text-sm font-black text-slate-900">${item.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-4">
                      <button
                        onClick={() => onUpdateQuantity(item.variantSku, -1)}
                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-lg text-slate-400 hover:text-black transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.variantSku, 1)}
                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-lg text-slate-400 hover:text-black transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total</span>
                      <span className="text-xl font-black text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
              );
            })}
          </div>
        </div>

        <aside className="lg:w-96 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-xl space-y-8 sticky top-32">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900">Order Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Subtotal</span>
                <span className="text-slate-900 font-black">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Estimated Shipping</span>
                <span className="text-green-600 font-black uppercase">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Estimated Tax</span>
                <span className="text-slate-900 font-black">$0.00</span>
              </div>
              <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                <span className="text-lg font-black uppercase tracking-tighter italic text-slate-900">Total</span>
                <span className="text-3xl font-black text-slate-900">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push("/checkout")}
                className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all hover:bg-slate-800 shadow-xl active:scale-[0.98]"
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full text-center py-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-black transition-colors"
              >
                Continue Shopping
              </button>
            </div>

            <div className="pt-8 border-t border-slate-100 space-y-4">
              <div className="flex items-center gap-3 text-slate-500">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Secure SSL Encryption</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <Truck className="w-5 h-5 text-blue-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Free Global Delivery</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <RotateCcw className="w-5 h-5 text-orange-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider">30-Day Easy Returns</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
