
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  Mail, 
  ArrowRight, 
  ShoppingBag,
  Clock,
  ShieldCheck,
  Star
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

export default function ThankYouClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white pb-20">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} gravity={0.1} colors={['#000', '#FF7348', '#3b82f6', '#10b981']} />}
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[60%] bg-orange-100/30 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[60%] bg-blue-100/30 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-4xl mx-auto px-4 relative text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-200"
          >
            <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic text-slate-900 mb-4"
          >
            Order Confirmed
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-slate-500 font-bold uppercase tracking-widest mb-8"
          >
            Welcome to the Athletic Force 1 Family
          </motion.p>

          {orderId && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-block bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 mb-10"
            >
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Order Reference: <span className="text-slate-900 ml-1">#{orderId}</span>
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/account?tab=orders"
              className="w-full sm:w-auto px-10 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-orange-600 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-3"
            >
              View Order Status
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/shop"
              className="w-full sm:w-auto px-10 py-5 border-2 border-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-sm hover:border-black transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              Back to Shop
              <ShoppingBag className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Progress Section */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Mail,
              title: "Email Confirmed",
              desc: "Check your inbox for your order summary and receipt.",
              color: "text-blue-500",
              bgColor: "bg-blue-50"
            },
            {
              icon: Package,
              title: "Processing Gear",
              desc: "Our team is prepping your uniforms for deployment.",
              color: "text-orange-500",
              bgColor: "bg-orange-50"
            },
            {
              icon: Truck,
              title: "Fast Shipment",
              desc: "You'll get a tracking number as soon as it ships.",
              color: "text-green-500",
              bgColor: "bg-green-50"
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 + idx * 0.1 }}
              className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow text-center space-y-4"
            >
              <div className={`w-14 h-14 ${item.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-2`}>
                <item.icon className={`w-7 h-7 ${item.color}`} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 italic">{item.title}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features/Trust Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-slate-900 rounded-[48px] p-10 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500 text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" /> Guaranteed Satisfaction
              </span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-white leading-none">
                Don&apos;t just play, <br />
                <span className="text-orange-500">Command the field.</span>
              </h2>
              <p className="text-slate-400 text-lg font-medium leading-relaxed">
                Your performance gear is engineered for the highest level of competition. 
                We stand by our quality and our community.
              </p>
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-white">24/7 Support</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-orange-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-white">Top Rated Quality</span>
                </div>
              </div>
            </div>

            <div className="relative group">
               <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-blue-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
               <div className="relative bg-black rounded-3xl p-8 border border-white/10">
                  <div className="space-y-4">
                     <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Helpful Links</p>
                     <ul className="space-y-3">
                        {['Tracking Information', 'Returns & Exchanges', 'Care Instructions', 'AF1 Community'].map((link) => (
                           <li key={link}>
                              <Link href="#" className="flex items-center justify-between text-white hover:text-orange-500 transition-colors group/link">
                                 <span className="font-black italic uppercase tracking-tight">{link}</span>
                                 <ArrowRight className="w-4 h-4 -translate-x-2 opacity-0 group-hover/link:translate-x-0 group-hover/link:opacity-100 transition-all" />
                              </Link>
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Simple */}
      <div className="text-center pt-8">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
          Questions? Contact us at <span className="text-slate-900 underline">support@athleticforce1.com</span>
        </p>
      </div>
    </div>
  );
}
