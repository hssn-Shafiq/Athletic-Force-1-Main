import React from "react";
import { useProgress, Html } from "@react-three/drei";
import { Loader } from "lucide-react";

/**
 * Overlay rendered on top of the 3D Canvas wrapper during asset loading.
 */
export function Canvas3DLoaderOverlay({ isModelLoading }: { isModelLoading?: boolean }) {
  const { active, progress } = useProgress();

  const isLoading = active || isModelLoading;
  if (!isLoading) return null;

  const displayPercent = progress > 0 ? Math.round(progress) : 60;

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#06060e]/85 backdrop-blur-md transition-all animate-in fade-in duration-300 pointer-events-auto">
      <div className="relative flex items-center justify-center mb-5">
        <div className="w-16 h-16 rounded-3xl border-2 border-orange-500/20 border-t-orange-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-orange-400 font-mono text-xs font-black">
          {displayPercent}%
        </div>
      </div>
      <p className="text-white text-xs font-black uppercase tracking-widest">
        Loading 3D Model...
      </p>
      <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden border border-slate-700/50">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300 rounded-full"
          style={{ width: `${displayPercent}%` }}
        />
      </div>
      <p className="text-slate-400 text-[10px] font-mono mt-2">
        Preparing geometries & textures
      </p>
    </div>
  );
}

/**
 * In-canvas Suspense fallback
 */
export function Canvas3DInnerFallback() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="flex flex-col items-center justify-center gap-2 select-none pointer-events-none whitespace-nowrap">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
          <Loader className="w-6 h-6 text-orange-400 animate-spin" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
          Loading 3D Mesh {progress > 0 ? `(${Math.round(progress)}%)` : ""}
        </p>
      </div>
    </Html>
  );
}
