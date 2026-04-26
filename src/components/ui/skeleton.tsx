import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`relative overflow-hidden bg-slate-200/60 rounded-xl ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </div>
  );
}

