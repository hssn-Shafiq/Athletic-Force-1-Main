"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Box, ArrowRight, ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/api/client";

export default function CanvasEditorIndexPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    apiClient
      .get("/api/public/3d-models")
      .then(({ data }) => {
        if (data?.ok && Array.isArray(data.models) && data.models.length > 0) {
          // Redirect immediately to the first available 3D model
          router.replace(`/af1-canvas/editor/${data.models[0].id || data.models[0]._id}`);
        } else {
          setModels([]);
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
          <Box className="w-8 h-8 text-[#FF7348] animate-bounce" />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-[#FF7348]">
          Loading 3D Canvas Studio...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col p-6 items-center justify-center">
      <div className="max-w-md w-full text-center space-y-6 bg-[#0f111a] border border-white/10 p-8 rounded-3xl shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-[#FF7348] flex items-center justify-center mx-auto">
          <Box className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-black uppercase italic tracking-wide text-white">
            AF1 3D Canvas Studio
          </h1>
          <p className="text-xs text-white/50">
            No active 3D models were found to edit. Please choose a customizable product from the Armory.
          </p>
        </div>

        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl bg-[#FF7348] text-white font-black uppercase text-xs tracking-wider hover:bg-[#e86339] transition-all shadow-lg"
        >
          <span>Browse Customizable Products</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
