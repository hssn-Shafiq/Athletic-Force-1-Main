
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { UnlockedRewards } from '@/components/cart/UnlockedRewards';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { items: cartItems, removeItem, updateQuantity, totalPrice } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[110] backdrop-blur-sm"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[120] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-slate-900" />
                <h2 className="text-xl font-black uppercase tracking-tighter italic">Your Gear</h2>
                <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {cartItems.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Close cart"
              >
                <X className="w-6 h-6 text-slate-400 hover:text-black" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cartItems.length > 0 ? (
                cartItems.map((item) => (
                  <div key={item.variantSku} className="flex gap-4 group">
                    <div className="w-24 h-24 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-200">
                      <img
                        src={item.imageUrl || '/placeholder.png'}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-sm text-slate-900 leading-tight pr-4">{item.name}</h3>
                          <button
                            onClick={() => removeItem(item.variantSku)}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                          {item.color && <span>{item.color} </span>}
                          {item.size && <span>| Size: {item.size}</span>}
                        </div>
                        {item.bundleId && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className="w-1 h-3 bg-[var(--color-accent)] rounded-full"></div>
                            <span className="text-[10px] font-black uppercase text-[#FF7348] italic tracking-tight">Tactical Bundle</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden scale-90 origin-left">
                          <button
                            onClick={() => updateQuantity(item.variantSku, item.quantity - 1)}
                            className="p-1 px-2 hover:bg-slate-100 text-slate-400 hover:text-black"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 text-xs font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.variantSku, item.quantity + 1)}
                            className="p-1 px-2 hover:bg-slate-100 text-slate-400 hover:text-black"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex flex-col items-end">
                          {item.originalPrice && item.originalPrice !== item.price && (
                            <span className="text-[10px] text-slate-400 line-through font-bold leading-none mb-0.5">
                              ${item.originalPrice.toFixed(2)}
                            </span>
                          )}
                          <span className="font-black text-sm text-slate-900 leading-none">${item.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <ShoppingBag className="w-16 h-16" />
                  <p className="font-bold uppercase tracking-widest text-sm">Your cart is empty</p>
                </div>
              )}

              {/* Dynamic BOGO Unlocked Rewards Section */}
              <UnlockedRewards onOpenQuickView={(product) => {
                // In a real flow, this could open the quick view modal to select size/color.
                // For now, it's just a prop requirement.
                console.log("Quick view:", product);
              }} />
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Subtotal</span>
                <span className="text-2xl font-black text-slate-900">${totalPrice.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest font-medium">
                Shipping and taxes calculated at checkout
              </p>
              <Link
                href="/checkout"
                onClick={onClose}
                className="block w-full bg-black text-white py-4 rounded-2xl text-center font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98]"
              >
                Secure Checkout
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white py-3 text-[11px] font-black uppercase tracking-widest text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900"
                >
                  View Cart Page
                </Link>
                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-200 hover:text-slate-900"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
