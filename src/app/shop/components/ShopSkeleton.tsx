
"use client";

import React from 'react';

export const ShopSkeleton = () => {
  return (
    <div className="animate-pulse space-y-8">
      {/* Sidebar Skeleton (Hidden on Mobile) */}
      <div className="hidden md:block w-full space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-6 bg-slate-200 rounded-md w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
              <div className="h-4 bg-slate-100 rounded-md w-2/3"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-[40px] p-4 space-y-4 shadow-sm border border-slate-50">
            <div className="aspect-square bg-slate-100 rounded-3xl"></div>
            <div className="space-y-2 px-2">
              <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
              <div className="h-6 bg-slate-200 rounded-md w-full"></div>
              <div className="h-8 bg-slate-100 rounded-md w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
