import React from 'react';
import { DynamicCustomizer } from '@/components/3d/DynamicCustomizer';

export const metadata = {
  title: '3D Customizer Demo | Athletic Force 1',
};

export default function CustomizerDemoPage() {
  // We'll use a public example shoe model for the demo if you don't have a URL ready yet.
  // Replace this with the URL to your client's .glb or .gltf file.
  const modelUrl = '/3d mockups/Shirt_2.glb';

  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900">
            3D Gear Customizer
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl text-lg">
            This is a fully custom-built 3D configurator powered by React Three Fiber. 
            It automatically analyzes your 3D model and lets users change the colors of its materials in real-time.
            No monthly fees, 100% yours.
          </p>
        </div>

        <DynamicCustomizer modelUrl={modelUrl} />

        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-8">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-orange-900 mb-4">
            How it works
          </h2>
          <ul className="space-y-2 text-orange-800 font-medium">
            <li>1. Provide the URL to your <code className="bg-white px-2 py-1 rounded text-orange-600">.glb</code> or <code className="bg-white px-2 py-1 rounded text-orange-600">.gltf</code> model.</li>
            <li>2. The script traverses the 3D mesh to find all customizable materials dynamically.</li>
            <li>3. The user picks parts and applies colors directly to the WebGL rendering.</li>
            <li>4. When saving, it generates a JSON payload (e.g. <code>{`{"laces": "#ff0000", "sole": "#000000"}`}</code>) that can be sent to your backend and saved with the order!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
