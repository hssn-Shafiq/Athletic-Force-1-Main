import { ShoppingBag, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

type EmptyCartProps = {
  onContinueShopping: () => void;
};

export function EmptyCart({ onContinueShopping }: EmptyCartProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8"
      >
        <ShoppingBag className="w-12 h-12 text-slate-300" />
      </motion.div>
      <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-4">Your Cart is Empty</h2>
      <p className="text-slate-500 max-w-md mx-auto mb-10 text-sm md:text-base">
        Looks like you havent added any gear to your cart yet. Explore our latest collections and find the perfect kit for your next game.
      </p>
      <button
        onClick={onContinueShopping}
        className="group bg-black text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 transition-all hover:bg-slate-800 shadow-xl active:scale-[0.98]"
      >
        Explore Collection
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
