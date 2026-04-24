
import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-center">
      <div className="relative">
        {/* Animated Rings */}
        <div className="w-20 h-20 border-4 border-slate-100 rounded-full" />
        <div className="absolute top-0 left-0 w-20 h-20 border-4 border-orange-500 rounded-full border-t-transparent animate-spin" />
        
        {/* Logo Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-black uppercase tracking-tighter italic text-slate-900">AF1</span>
        </div>
      </div>
      
      <div className="mt-6 flex flex-col items-center">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] italic text-slate-900 animate-pulse">
          Commanding Excellence
        </h2>
        <div className="mt-2 flex gap-1">
          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}
