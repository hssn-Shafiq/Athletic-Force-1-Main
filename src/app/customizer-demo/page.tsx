"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Box, ChevronDown, RefreshCw, CheckCircle2, Sparkles, Layers, Palette, Type, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

const SmartCustomizer = dynamic(
  () => import('@/components/3d/SmartCustomizer').then((m) => ({ default: m.SmartCustomizer })),
  { ssr: false, loading: () => <CanvasLoader /> }
);

function CanvasLoader() {
  return (
    <div className="w-full h-[780px] bg-[#0a0a0f] rounded-3xl flex items-center justify-center border border-white/10">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-white/10 border-t-[#FF7348] rounded-full animate-spin mx-auto" />
        <div>
          <p className="text-white text-sm font-black uppercase tracking-widest">
            Loading 3D Garment Studio...
          </p>
          <p className="text-white/40 text-xs mt-1">Preparing high-resolution meshes & graphics</p>
        </div>
      </div>
    </div>
  );
}

interface Model3D {
  id: string;
  name: string;
  modelUrl: string;
  thumbnailUrl?: string;
  printZones: any[];
}

export default function CustomizerDemoPage() {
  const [models, setModels] = useState<Model3D[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedDesign, setSavedDesign] = useState<any>(null);

  const selectedModel = models.find((m) => m.id === selectedId) ?? null;

  const fetchModels = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/api/public/3d-models');
      if (data.ok && data.models.length > 0) {
        setModels(data.models);
        setSelectedId(data.models[0].id);
      } else {
        setModels([]);
        setError('No active 3D models found. Add one via Admin → 3D Models.');
      }
    } catch {
      setError('Could not reach the API. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return (
    <div className="min-h-screen bg-[#07080b] py-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end gap-6 justify-between border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF7348] italic">
                Interactive 3D Studio
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter text-white mt-1">
              3D Gear Customizer
            </h1>
            <p className="text-slate-400 font-medium max-w-2xl text-sm mt-2">
              Live customer preview terminal. Test real-time team logos, player names, numbers, and fabric color customization on active 3D models.
            </p>
          </div>

          {/* Model Selector */}
          {!loading && models.length > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative">
                <select
                  value={selectedId}
                  onChange={(e) => {
                    setSelectedId(e.target.value);
                    setSavedDesign(null);
                  }}
                  className="appearance-none pl-4 pr-10 py-3 bg-[#111319] border border-white/10 rounded-2xl text-xs font-black uppercase tracking-wider text-white focus:border-[#FF7348] outline-none cursor-pointer shadow-lg min-w-[240px]"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <button
                onClick={fetchModels}
                title="Refresh models"
                className="p-3 bg-[#111319] border border-white/10 rounded-2xl hover:border-[#FF7348] text-slate-400 hover:text-white transition-all shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* State: Loading */}
        {loading && <CanvasLoader />}

        {/* State: Error / Empty */}
        {!loading && error && (
          <div className="w-full h-[400px] bg-[#111319] rounded-3xl flex items-center justify-center border-2 border-dashed border-white/10">
            <div className="text-center space-y-4 p-8">
              <Box className="w-12 h-12 text-white/20 mx-auto" />
              <p className="text-white/50 text-sm font-bold uppercase tracking-widest">{error}</p>
              <a
                href="/admin/3d-models"
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#FF7348] text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#ff8660] transition-all"
              >
                Go to Admin &rarr; 3D Models
              </a>
            </div>
          </div>
        )}

        {/* State: Model loaded */}
        {!loading && selectedModel && (
          <>
            {/* Zone count badge */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                Active Garment: <strong className="text-white">{selectedModel.name}</strong>
              </span>
              <span className="h-3 w-px bg-white/10" />
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#FF7348]/10 text-[#FF7348] border border-[#FF7348]/20">
                {selectedModel.printZones.length} Print Area{selectedModel.printZones.length !== 1 ? 's' : ''} Configured
              </span>
            </div>

            {/* Smart Customizer Component */}
            <SmartCustomizer
              modelConfig={selectedModel}
              onSave={(data) => {
                setSavedDesign(data);
              }}
            />

            {/* Live Design Summary Box (When saved) */}
            {savedDesign && (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#121a16] to-[#0e131b] border border-emerald-500/30 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-base font-black italic uppercase tracking-wider text-white">
                        Design Payload Generated
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        This customization data will be attached to the customer order cart item.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Ready for Checkout
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Colors applied */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-orange-400" /> Fabric Colors:
                    </span>
                    {Object.keys(savedDesign.colors || {}).length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Default garment fabric colors retained</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(savedDesign.colors).map(([mat, hex]: any) => (
                          <div
                            key={mat}
                            className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs"
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-white/20"
                              style={{ backgroundColor: hex }}
                            />
                            <span className="font-bold text-white uppercase">{mat}</span>
                            <span className="text-slate-400 font-mono text-[10px]">{hex}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Zones applied */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-400" /> Customized Print Areas:
                    </span>
                    {Object.entries(savedDesign.zones || {}).map(([zId, zData]: any) => (
                      <div
                        key={zId}
                        className="text-xs flex items-center justify-between py-1 border-b border-white/5 last:border-none"
                      >
                        <span className="font-bold text-white uppercase truncate max-w-[200px]">
                          {zData.customText || zData.customImageUrl ? 'Customized' : 'Original Default'}
                        </span>
                        <div className="flex items-center gap-2">
                          {zData.customText && (
                            <span className="text-emerald-400 font-black">
                              &ldquo;{zData.customText}&rdquo;
                            </span>
                          )}
                          {zData.customImageUrl && (
                            <span className="text-purple-400 font-bold">[Logo attached]</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* How it works Banner */}
        <div className="bg-[#111319] border border-white/10 rounded-3xl p-6 sm:p-8 text-white space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF7348]" />
            <h2 className="text-lg font-black italic uppercase tracking-wider text-white">
              Non-Technical Experience Guide
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="w-6 h-6 rounded-lg bg-[#FF7348] text-black font-black text-xs flex items-center justify-center">
                1
              </span>
              <p className="text-xs font-black uppercase tracking-wider text-white pt-1">
                Visual View Buttons
              </p>
              <p className="text-[11px] text-slate-400">
                Click Front, Back, Left Arm, or Right Arm to automatically glide the camera directly to that section.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="w-6 h-6 rounded-lg bg-[#FF7348] text-black font-black text-xs flex items-center justify-center">
                2
              </span>
              <p className="text-xs font-black uppercase tracking-wider text-white pt-1">
                Click in 3D to Edit
              </p>
              <p className="text-[11px] text-slate-400">
                Click anywhere on the shirt fabric or print area to auto-select and highlight that exact item.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="w-6 h-6 rounded-lg bg-[#FF7348] text-black font-black text-xs flex items-center justify-center">
                3
              </span>
              <p className="text-xs font-black uppercase tracking-wider text-white pt-1">
                Real-Time Visual Customization
              </p>
              <p className="text-[11px] text-slate-400">
                Type names or upload logos with instant 3D feedback, and revert back to team defaults with a single click.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
