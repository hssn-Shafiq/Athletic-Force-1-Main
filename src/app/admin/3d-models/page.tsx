"use client";
import dynamic from 'next/dynamic';

const Admin3DModels = dynamic(() => import('@/admin/Admin3DModels'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-black rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-black italic uppercase tracking-tighter text-slate-500">Loading 3D Studio...</p>
      </div>
    </div>
  ),
});

export default function Page() {
  return <Admin3DModels />;
}
