"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { AlertTriangle, Home, ArrowLeft, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4 overflow-hidden relative">
      {/* Tactical Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FF5A2A]/10 blur-[150px] rounded-full" />
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="max-w-4xl w-full text-center relative z-10 pt-20 md:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center justify-center"
        >
          {/* Big Background Number */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 select-none">
             <span className="text-[180px] md:text-[320px] font-black text-white/[0.03] leading-none italic uppercase tracking-tighter">
               404
             </span>
          </div>

          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[28px] bg-[#FF5A2A]/10 border border-[#FF5A2A]/20 mb-8 relative">
             <ShieldAlert className="w-12 h-12 text-[#FF5A2A] animate-pulse" />
             <div className="absolute -top-3 -right-3 bg-[#FF5A2A] text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg italic shadow-lg shadow-[#FF5A2A]/20">
                STATUS: OFFLINE
             </div>
          </div>

          <h1 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter text-white mb-6 leading-[0.9]">
            Mission <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A2A] to-orange-400">Compromised</span>
          </h1>
          
          <p className="text-slate-400 text-lg md:text-xl font-bold italic mb-12 leading-relaxed max-w-2xl">
            Target sector not found. The coordinates you provided are invalid or the intelligence has been decommissioned from active service.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto">
            <Link 
              href="/" 
              className="w-full sm:w-auto bg-[#FF5A2A] text-white px-12 py-6 rounded-[24px] font-black uppercase italic tracking-widest text-lg hover:scale-105 transition-all shadow-2xl shadow-[#FF5A2A]/30 flex items-center justify-center gap-4 group"
            >
              <Home className="w-6 h-6" />
              Abort to HQ
            </Link>
            <button 
              onClick={() => window.history.back()}
              className="w-full sm:w-auto bg-white/5 border border-white/10 text-white px-12 py-6 rounded-[24px] font-black uppercase italic tracking-widest text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-4"
            >
              <ArrowLeft className="w-6 h-6" />
              Recalculate
            </button>
          </div>
        </motion.div>

        {/* Tactical Footer Note */}
        <div className="mt-20 pt-10 border-t border-white/5">
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">
              Athletic Force 1 // Operational Intelligence Bureau
           </p>
        </div>
      </div>
    </main>
  );
}
