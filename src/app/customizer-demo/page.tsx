"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Box, ChevronDown, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

const SmartCustomizer = dynamic(
  () => import('@/components/3d/SmartCustomizer').then((m) => ({ default: m.SmartCustomizer })),
  { ssr: false, loading: () => <CanvasLoader /> }
);

function CanvasLoader() {
  return (
    <div className="w-full h-[750px] bg-[#0a0a0f] rounded-2xl flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-white/10 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Initialising 3D Engine...</p>
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

  useEffect(() => { fetchModels(); }, []);

  return (
    <div className="min-h-screen bg-[#f8f8fb] py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end gap-6 justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.3em] text-orange-500 mb-2">Live Preview</p>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
              3D Gear Customizer
            </h1>
            <p className="text-slate-400 font-medium max-w-xl text-base mt-3">
              Select a model configured in the admin panel to preview its print zones and colour customization.
            </p>
          </div>

          {/* Model Selector */}
          {!loading && models.length > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative">
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm font-black uppercase tracking-wider text-slate-800 focus:border-orange-500 outline-none cursor-pointer shadow-sm min-w-[220px]"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <button
                onClick={fetchModels}
                title="Refresh models"
                className="p-3 bg-white border-2 border-slate-200 rounded-2xl hover:border-orange-500 text-slate-400 hover:text-orange-500 transition-all shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* State: Loading */}
        {loading && (
          <div className="w-full h-[750px] bg-[#0a0a0f] rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-white/10 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Fetching Models...</p>
            </div>
          </div>
        )}

        {/* State: Error / Empty */}
        {!loading && error && (
          <div className="w-full h-[400px] bg-[#0a0a0f] rounded-2xl flex items-center justify-center border-2 border-dashed border-white/10">
            <div className="text-center space-y-4 p-8">
              <Box className="w-12 h-12 text-white/20 mx-auto" />
              <p className="text-white/50 text-sm font-bold uppercase tracking-widest">{error}</p>
              <a
                href="/admin/3d-models"
                className="inline-flex items-center gap-2 px-5 py-3 bg-orange-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all"
              >
                Go to Admin → 3D Models
              </a>
            </div>
          </div>
        )}

        {/* State: Model loaded */}
        {!loading && selectedModel && (
          <>
            {/* Zone count badge */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Model: <span className="text-slate-700">{selectedModel.name}</span>
              </span>
              <span className="h-4 w-px bg-slate-200" />
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${selectedModel.printZones.length > 0 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                {selectedModel.printZones.length} print zone{selectedModel.printZones.length !== 1 ? 's' : ''}
              </span>
            </div>

            <SmartCustomizer
              modelConfig={selectedModel}
              onSave={(data) => {
                console.log('✅ Design payload:', data);
                alert('Design saved! Open the console to see the JSON payload that would be sent to an order.');
              }}
            />
          </>
        )}

        {/* How it works */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white">
          <h2 className="text-xl font-black italic uppercase tracking-tighter mb-5 text-orange-400">How to Test This</h2>
          <ol className="space-y-3">
            {[
              { step: '1', text: 'Go to Admin → 3D Models and click "Add Model".' },
              { step: '2', text: 'Paste a .glb URL (e.g. /3d mockups/Shirt_7.glb) and click Load.' },
              { step: '3', text: 'Click "Add Zone", then click on the shirt surface to place a print area.' },
              { step: '4', text: 'Set the zone label, type (image/text/both), width & height. Click Save.' },
              { step: '5', text: 'Come back here — select your model from the dropdown above and test it live!' },
            ].map(({ step, text }) => (
              <li key={step} className="flex items-start gap-4">
                <span className="w-7 h-7 rounded-xl bg-orange-500 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{step}</span>
                <p className="text-white/70 text-sm font-medium leading-relaxed">{text}</p>
              </li>
            ))}
          </ol>
        </div>

      </div>
    </div>
  );
}
