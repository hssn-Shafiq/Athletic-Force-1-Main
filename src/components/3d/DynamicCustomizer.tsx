"use client";

import React, { Suspense, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, useGLTF, Environment, Bounds, Decal } from '@react-three/drei';
import * as THREE from 'three';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type ZoneId = 'front_chest' | 'back_name' | 'back_number' | 'left_sleeve' | 'right_sleeve';

interface ZoneConfig {
  id: ZoneId;
  label: string;
  description: string;
  icon: string;
  /** Which mesh name (lowercased, partial match) this zone maps to */
  meshKeyword: string;
  /** World-space offset relative to mesh bounding box center */
  positionFn: (center: THREE.Vector3, size: THREE.Vector3) => [number, number, number];
  rotationFn: () => [number, number, number];
  /** [width, height, depth] in model units */
  scaleFn: (size: THREE.Vector3) => [number, number, number];
  defaultContent: ZoneContent;
}

interface ZoneContent {
  type: 'none' | 'text' | 'image';
  text?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: string;
  imageUrl?: string;
  imageTexture?: THREE.Texture | null;
}

// ─────────────────────────────────────────────
// ZONE DEFINITIONS
// ─────────────────────────────────────────────

const ZONES: ZoneConfig[] = [
  {
    id: 'front_chest',
    label: 'Front Chest',
    description: 'Logo or text on upper chest',
    icon: '👕',
    meshKeyword: 'front',
    // Push slightly outward along +Z so decal sits ON the surface, not inside
    positionFn: (c, s) => [c.x, c.y + s.y * 0.18, c.z + s.z * 0.5 + 0.02],
    rotationFn: () => [0, 0, 0],
    scaleFn: (s) => [Math.min(s.x * 0.35, 0.12), Math.min(s.x * 0.35, 0.12), 1],
    defaultContent: { type: 'none' },
  },
  {
    id: 'back_name',
    label: 'Back – Name',
    description: 'Player name across upper back',
    icon: '🔠',
    meshKeyword: 'back',
    // Back mesh faces -Z. Center minus half-size pushes us to the back surface; subtract a tiny bit more to sit on top
    positionFn: (c, s) => [c.x, c.y + s.y * 0.28, c.z - s.z * 0.5 - 0.02],
    rotationFn: () => [0, Math.PI, 0],
    scaleFn: (s) => [Math.min(s.x * 0.65, 0.20), Math.min(s.y * 0.12, 0.07), 1],
    defaultContent: { type: 'text', text: 'PLAYER', textColor: '#ffffff', fontSize: 220, fontWeight: '900' },
  },
  {
    id: 'back_number',
    label: 'Back – Number',
    description: 'Player number on mid-back',
    icon: '#️⃣',
    meshKeyword: 'back',
    positionFn: (c, s) => [c.x, c.y - s.y * 0.05, c.z - s.z * 0.5 - 0.02],
    rotationFn: () => [0, Math.PI, 0],
    scaleFn: (s) => [Math.min(s.x * 0.5, 0.16), Math.min(s.x * 0.5, 0.16), 1],
    defaultContent: { type: 'text', text: '10', textColor: '#ffffff', fontSize: 400, fontWeight: '900' },
  },
  {
    id: 'left_sleeve',
    label: 'Left Sleeve',
    description: 'Badge or text on left sleeve',
    icon: '◀',
    meshKeyword: 'left',
    positionFn: (c, s) => [c.x, c.y + s.y * 0.1, c.z + s.z * 0.5 + 0.02],
    rotationFn: () => [0, 0, 0],
    scaleFn: (s) => [Math.min(s.x * 0.7, 0.08), Math.min(s.y * 0.4, 0.05), 1],
    defaultContent: { type: 'none' },
  },
  {
    id: 'right_sleeve',
    label: 'Right Sleeve',
    description: 'Badge or text on right sleeve',
    icon: '▶',
    meshKeyword: 'right',
    positionFn: (c, s) => [c.x, c.y + s.y * 0.1, c.z + s.z * 0.5 + 0.02],
    rotationFn: () => [0, 0, 0],
    scaleFn: (s) => [Math.min(s.x * 0.7, 0.08), Math.min(s.y * 0.4, 0.05), 1],
    defaultContent: { type: 'none' },
  },
];

// ─────────────────────────────────────────────
// TEXTURE HELPERS
// ─────────────────────────────────────────────

function createTextTexture(
  text: string,
  textColor = '#ffffff',
  fontSize = 280,
  fontWeight = '900',
): THREE.Texture | null {
  if (!text.trim()) return null;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Subtle drop shadow for depth
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = textColor;
  ctx.font = `${fontWeight} ${fontSize}px "Arial Black", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Auto-shrink to fit
  let currentSize = fontSize;
  while (ctx.measureText(text).width > canvas.width - 40 && currentSize > 60) {
    currentSize -= 10;
    ctx.font = `${fontWeight} ${currentSize}px "Arial Black", Arial, sans-serif`;
  }
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false; // GLTF meshes require flipY=false — without this text renders upside-down or not at all
  texture.needsUpdate = true;
  return texture;
}

function loadImageTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve) => {
    new THREE.TextureLoader().load(url, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = false;
      resolve(texture);
    });
  });
}

// ─────────────────────────────────────────────
// DECAL COMPONENT
// ─────────────────────────────────────────────

function ZoneDecal({
  mesh,
  position,
  rotation,
  scale,
  texture,
}: {
  mesh: THREE.Mesh | null;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  texture: THREE.Texture | null;
}) {
  if (!mesh || !texture) return null;
  const meshRef = { current: mesh } as React.MutableRefObject<THREE.Mesh>;
  return (
    <Decal mesh={meshRef} position={position} rotation={rotation} scale={scale} debug={false}>
      <meshStandardMaterial
        map={texture}
        transparent={true}
        depthTest={true}
        polygonOffset={true}
        polygonOffsetFactor={-10}
        toneMapped={false}
      />
    </Decal>
  );
}

// ─────────────────────────────────────────────
// MODEL COMPONENT
// ─────────────────────────────────────────────

interface ModelProps {
  url: string;
  colors: Record<string, string>;
  onMeshesLoaded?: (materials: string[]) => void;
  // Textures are built in the PARENT so they always recompute on state change
  zoneTextures: Record<ZoneId, THREE.Texture | null>;
  activeMaterial: string | null;
  setActiveMaterial: (mat: string) => void;
}

function Model({ url, colors, onMeshesLoaded, zoneTextures, activeMaterial, setActiveMaterial }: ModelProps) {
  const { scene } = useGLTF(url);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Collect material names once
  useEffect(() => {
    const materials = new Set<string>();
    clonedScene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => { if (m.name) materials.add(m.name); });
      }
    });
    onMeshesLoaded?.(Array.from(materials));
  }, [clonedScene, onMeshesLoaded]);

  // Build a map: keyword → mesh
  const meshMap = useMemo(() => {
    const map: Record<string, THREE.Mesh> = {};
    clonedScene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const name = (Array.isArray(mesh.material) ? mesh.material[0].name : mesh.material.name).toLowerCase();
      // Store by keyword matches used in ZONES
      ['front', 'back', 'left', 'right', 'collar', 'neck'].forEach((kw) => {
        if (name.includes(kw) && !map[kw]) map[kw] = mesh;
      });
    });
    return map;
  }, [clonedScene]);

  // Compute bounding data per zone
  const zoneBounds = useMemo(() => {
    const out: Record<string, { center: THREE.Vector3; size: THREE.Vector3 }> = {};
    Object.entries(meshMap).forEach(([kw, mesh]) => {
      const box = new THREE.Box3().setFromObject(mesh);
      out[kw] = {
        center: box.getCenter(new THREE.Vector3()),
        size: box.getSize(new THREE.Vector3()),
      };
    });
    return out;
  }, [meshMap]);

  // Apply colors
  useEffect(() => {
    clonedScene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        if (mat instanceof THREE.MeshStandardMaterial) {
          if (colors[mat.name]) mat.color.set(colors[mat.name]);
          mat.emissive.setHex(0x000000);
        }
      });
    });
  }, [clonedScene, colors]);

  const handlePointerUp = (e: any, mesh: THREE.Mesh) => {
    e.stopPropagation();
    const matName = Array.isArray(mesh.material) ? mesh.material[0].name : mesh.material.name;
    setActiveMaterial(matName);
  };

  const renderNode = (node: THREE.Object3D): React.ReactNode => {
    const mesh = node as THREE.Mesh;
    if (mesh.isMesh) {
      const matName = mesh.material
        ? Array.isArray(mesh.material) ? mesh.material[0].name : mesh.material.name
        : null;
      const isSelected = activeMaterial === matName;
      return (
        <mesh
          key={mesh.uuid}
          geometry={mesh.geometry}
          material={mesh.material}
          position={mesh.position}
          rotation={mesh.rotation}
          scale={mesh.scale}
          onPointerUp={(e) => handlePointerUp(e, mesh)}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        >
          {isSelected && (
            <mesh geometry={mesh.geometry} scale={1.015}>
              <meshBasicMaterial color="#f97316" side={THREE.BackSide} />
            </mesh>
          )}
        </mesh>
      );
    }
    if (node.type === 'Group' || node.type === 'Object3D' || (node as THREE.Group).isGroup) {
      return (
        <group key={node.uuid} position={node.position} rotation={node.rotation} scale={node.scale}>
          {node.children.map(renderNode)}
        </group>
      );
    }
    return null;
  };

  return (
    <group>
      {clonedScene.children.map(renderNode)}

      {/* Render a decal per zone */}
      {ZONES.map((zone) => {
        const bounds = zoneBounds[zone.meshKeyword];
        const mesh = meshMap[zone.meshKeyword] ?? null;
        const texture = zoneTextures[zone.id];
        if (!bounds || !mesh || !texture) return null;
        return (
          <ZoneDecal
            key={zone.id}
            mesh={mesh}
            texture={texture}
            position={zone.positionFn(bounds.center, bounds.size)}
            rotation={zone.rotationFn()}
            scale={zone.scaleFn(bounds.size)}
          />
        );
      })}
    </group>
  );
}

// ─────────────────────────────────────────────
// PRESET COLORS
// ─────────────────────────────────────────────

const PRESET_COLORS = [
  { hex: '#ffffff', label: 'White' },
  { hex: '#111111', label: 'Black' },
  { hex: '#dc2626', label: 'Red' },
  { hex: '#16a34a', label: 'Green' },
  { hex: '#1d4ed8', label: 'Blue' },
  { hex: '#ca8a04', label: 'Gold' },
  { hex: '#7c3aed', label: 'Purple' },
  { hex: '#0e7490', label: 'Teal' },
  { hex: '#ea580c', label: 'Orange' },
  { hex: '#be185d', label: 'Pink' },
  { hex: '#374151', label: 'Charcoal' },
  { hex: '#92400e', label: 'Brown' },
];

const TEXT_COLORS = ['#ffffff', '#000000', '#fbbf24', '#f87171', '#34d399', '#60a5fa', '#e879f9'];

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

interface DynamicCustomizerProps {
  modelUrl: string;
}

export function DynamicCustomizer({ modelUrl }: DynamicCustomizerProps) {
  const [materials, setMaterials] = useState<string[]>([]);
  const [colors, setColors] = useState<Record<string, string>>({});
  const [activeMaterial, setActiveMaterial] = useState<string | null>(null);

  // Which zone is being edited in the side panel
  const [activeZoneId, setActiveZoneId] = useState<ZoneId>('front_chest');

  // Per-zone content state
  const [zoneContents, setZoneContents] = useState<Record<ZoneId, ZoneContent>>(() => {
    const init = {} as Record<ZoneId, ZoneContent>;
    ZONES.forEach((z) => { init[z.id] = { ...z.defaultContent }; });
    return init;
  });

  // Tab within customizer panel: 'colors' | 'zones'
  const [tab, setTab] = useState<'colors' | 'zones'>('colors');

  const activeZone = ZONES.find((z) => z.id === activeZoneId)!;
  const activeContent = zoneContents[activeZoneId];

  // ── Zone textures — built HERE in parent so any state change triggers recompute ──
  // We use a version counter as an extra escape hatch to force texture rebuilds
  const [textureVersion, setTextureVersion] = useState(0);

  // Bump version whenever zone content text/color/weight changes
  useEffect(() => {
    setTextureVersion((v) => v + 1);
  }, [zoneContents]);

  const zoneTextures = useMemo<Record<ZoneId, THREE.Texture | null>>(() => {
    const out = {} as Record<ZoneId, THREE.Texture | null>;
    ZONES.forEach((zone) => {
      const content = zoneContents[zone.id];
      if (!content || content.type === 'none') { out[zone.id] = null; return; }
      if (content.type === 'text' && content.text?.trim()) {
        out[zone.id] = createTextTexture(
          content.text,
          content.textColor ?? '#ffffff',
          content.fontSize ?? 280,
          content.fontWeight ?? '900',
        );
      } else if (content.type === 'image' && content.imageTexture) {
        out[zone.id] = content.imageTexture;
      } else {
        out[zone.id] = null;
      }
    });
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneContents, textureVersion]);

  // ── Color helpers ──────────────────────────
  const handleColorChange = (color: string) => {
    if (activeMaterial) setColors((prev) => ({ ...prev, [activeMaterial]: color }));
  };

  // ── Zone content helpers ───────────────────
  const updateZoneContent = useCallback((zoneId: ZoneId, patch: Partial<ZoneContent>) => {
    setZoneContents((prev) => ({ ...prev, [zoneId]: { ...prev[zoneId], ...patch } }));
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, zoneId: ZoneId) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const texture = await loadImageTexture(url);
    updateZoneContent(zoneId, { type: 'image', imageUrl: url, imageTexture: texture });
  };

  const clearZone = (zoneId: ZoneId) => {
    updateZoneContent(zoneId, { type: 'none', text: '', imageUrl: undefined, imageTexture: null });
  };

  // ── Save ───────────────────────────────────
  const handleSave = () => {
    const exportData = {
      colors,
      zones: Object.fromEntries(
        ZONES.map((z) => [z.id, { type: zoneContents[z.id].type, text: zoneContents[z.id].text, imageUrl: zoneContents[z.id].imageUrl }])
      ),
    };
    console.log('✅ Design saved:', exportData);
    alert('Design saved! Check console for data.');
  };

  return (
    <div
      style={{ fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif" }}
      className="flex flex-col lg:flex-row w-full h-[750px] bg-[#0a0a0f] rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
    >
      {/* ── 3D Canvas ────────────────────────────────────── */}
      <div className="flex-1 relative">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 30%, #1a1a2e 0%, #0a0a0f 70%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 4], fov: 45 }} style={{ background: 'transparent' }}>
          <Suspense fallback={null}>
            <Environment preset="studio" />
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
            <directionalLight position={[-5, 5, -5]} intensity={0.4} />
            <Bounds fit margin={1.2}>
              <Center>
                <Model
                  url={modelUrl}
                  colors={colors}
                  onMeshesLoaded={(mats) => {
                    setMaterials(mats);
                    if (mats.length > 0 && !activeMaterial) setActiveMaterial(mats[0]);
                  }}
                  zoneTextures={zoneTextures}
                  activeMaterial={activeMaterial}
                  setActiveMaterial={(mat) => {
                    setActiveMaterial(mat);
                    setTab('colors');
                  }}
                />
              </Center>
            </Bounds>
            <OrbitControls makeDefault enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI / 1.8} />
          </Suspense>
        </Canvas>

        {/* Overlay labels */}
        <div className="absolute top-5 left-5 pointer-events-none">
          <p
            className="text-white text-2xl font-black uppercase tracking-[0.2em]"
            style={{ textShadow: '0 0 30px rgba(249,115,22,0.5)' }}
          >
            3D STUDIO
          </p>
          <p className="text-white/40 text-xs uppercase tracking-widest mt-0.5">Drag · Rotate · Customize</p>
        </div>

        {/* Zone indicator dots on canvas edges */}
        <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2 pointer-events-none">
          {ZONES.map((z) => {
            const hasContent = zoneContents[z.id].type !== 'none';
            return (
              <div
                key={z.id}
                title={z.label}
                className={`w-2 h-2 rounded-full transition-all ${
                  hasContent ? 'bg-orange-400 shadow-[0_0_6px_rgba(249,115,22,0.8)]' : 'bg-white/20'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* ── Side Panel ───────────────────────────────────── */}
      <div className="w-full lg:w-[380px] flex flex-col bg-[#111118] border-l border-white/8">

        {/* Tab Bar */}
        <div className="flex border-b border-white/8">
          {(['colors', 'zones'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${
                tab === t
                  ? 'text-orange-400 border-b-2 border-orange-400 bg-white/4'
                  : 'text-white/30 hover:text-white/60'
              }`}
            >
              {t === 'colors' ? '🎨 Colors' : '🖨 Print Zones'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* ── COLORS TAB ──────────────────────────── */}
          {tab === 'colors' && (
            <>
              {/* Active material label */}
              {activeMaterial && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full border-2 border-white/20 shadow-inner"
                    style={{ backgroundColor: colors[activeMaterial] ?? '#cccccc' }}
                  />
                  <span className="text-white/70 text-xs uppercase tracking-widest font-bold">
                    Editing: <span className="text-white">{activeMaterial.replace(/_/g, ' ')}</span>
                  </span>
                </div>
              )}

              {/* Material buttons */}
              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3">Select Part</p>
                {materials.length === 0 ? (
                  <p className="text-white/20 text-xs italic">Loading model materials…</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {materials.map((mat) => (
                      <button
                        key={mat}
                        onClick={() => setActiveMaterial(mat)}
                        className={`px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all text-left flex items-center gap-2 ${
                          activeMaterial === mat
                            ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300'
                            : 'bg-white/4 border border-white/8 text-white/50 hover:bg-white/8 hover:text-white/80'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0 border border-white/20"
                          style={{ backgroundColor: colors[mat] ?? '#555' }}
                        />
                        {mat.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Color swatches */}
              {activeMaterial && (
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3">Color</p>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_COLORS.map(({ hex, label }) => (
                      <button
                        key={hex}
                        onClick={() => handleColorChange(hex)}
                        title={label}
                        className={`aspect-square rounded-lg transition-all hover:scale-110 active:scale-95 border-2 ${
                          colors[activeMaterial] === hex
                            ? 'border-white scale-110 shadow-lg'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>

                  {/* Custom hex input */}
                  <div className="mt-3 flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-md border border-white/20 flex-shrink-0"
                      style={{ backgroundColor: colors[activeMaterial] ?? '#cccccc' }}
                    />
                    <input
                      type="color"
                      value={colors[activeMaterial] ?? '#cccccc'}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="flex-1 h-8 rounded-md cursor-pointer bg-transparent border border-white/10 px-1"
                      title="Custom color"
                    />
                    <span className="text-white/30 text-xs font-mono">{colors[activeMaterial] ?? '—'}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── ZONES TAB ───────────────────────────── */}
          {tab === 'zones' && (
            <>
              {/* Zone selector */}
              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3">Print Zone</p>
                <div className="space-y-1.5">
                  {ZONES.map((zone) => {
                    const hasContent = zoneContents[zone.id].type !== 'none';
                    return (
                      <button
                        key={zone.id}
                        onClick={() => setActiveZoneId(zone.id)}
                        className={`w-full px-4 py-3 rounded-xl text-left flex items-center justify-between transition-all ${
                          activeZoneId === zone.id
                            ? 'bg-orange-500/15 border border-orange-500/40 text-white'
                            : 'bg-white/4 border border-white/8 text-white/50 hover:bg-white/8 hover:text-white/70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base">{zone.icon}</span>
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-wider">{zone.label}</p>
                            <p className="text-[10px] text-white/30 mt-0.5">{zone.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasContent && (
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_4px_rgba(249,115,22,0.8)]" />
                          )}
                          <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            hasContent ? 'bg-orange-500/20 text-orange-400' : 'bg-white/8 text-white/30'
                          }`}>
                            {hasContent ? zoneContents[zone.id].type : 'empty'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Zone editor */}
              <div className="border-t border-white/8 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-white text-sm font-black uppercase tracking-wider">
                    {activeZone.icon} {activeZone.label}
                  </p>
                  {activeContent.type !== 'none' && (
                    <button
                      onClick={() => clearZone(activeZoneId)}
                      className="text-[10px] text-red-400/70 hover:text-red-400 uppercase tracking-wider transition-colors"
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>

                {/* Type toggle */}
                <div className="flex gap-2">
                  {(['none', 'text', 'image'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => updateZoneContent(activeZoneId, { type: t })}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        activeContent.type === t
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                          : 'bg-white/6 text-white/40 hover:bg-white/10 hover:text-white/70'
                      }`}
                    >
                      {t === 'none' ? '✕ None' : t === 'text' ? '🔡 Text' : '🖼 Image'}
                    </button>
                  ))}
                </div>

                {/* ── TEXT OPTIONS ── */}
                {activeContent.type === 'text' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-white/30 text-[10px] uppercase tracking-widest block mb-1.5">Text Content</label>
                      <input
                        type="text"
                        value={activeContent.text ?? ''}
                        onChange={(e) => updateZoneContent(activeZoneId, { text: e.target.value.toUpperCase() })}
                        placeholder="Enter text..."
                        maxLength={20}
                        className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-sm font-black uppercase text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 focus:bg-white/8 transition-all"
                      />
                      <p className="text-white/20 text-[9px] mt-1 text-right">{(activeContent.text ?? '').length}/20</p>
                    </div>

                    <div>
                      <label className="text-white/30 text-[10px] uppercase tracking-widest block mb-2">Text Color</label>
                      <div className="flex gap-2">
                        {TEXT_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => updateZoneContent(activeZoneId, { textColor: color })}
                            className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                              activeContent.textColor === color ? 'border-white scale-110' : 'border-white/20'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <input
                          type="color"
                          value={activeContent.textColor ?? '#ffffff'}
                          onChange={(e) => updateZoneContent(activeZoneId, { textColor: e.target.value })}
                          className="w-7 h-7 rounded-full cursor-pointer bg-transparent border border-white/20"
                          title="Custom color"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-white/30 text-[10px] uppercase tracking-widest block mb-2">Font Weight</label>
                      <div className="flex gap-2">
                        {(['400', '700', '900'] as const).map((w) => (
                          <button
                            key={w}
                            onClick={() => updateZoneContent(activeZoneId, { fontWeight: w })}
                            className={`flex-1 py-2 rounded-lg text-[10px] uppercase tracking-wider transition-all ${
                              (activeContent.fontWeight ?? '900') === w
                                ? 'bg-white/20 text-white'
                                : 'bg-white/6 text-white/40 hover:bg-white/10'
                            }`}
                            style={{ fontWeight: w }}
                          >
                            {w === '400' ? 'Regular' : w === '700' ? 'Bold' : 'Black'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live preview */}
                    {activeContent.text && (
                      <div className="bg-white/4 rounded-xl p-4 text-center border border-white/8">
                        <p className="text-[9px] text-white/30 uppercase tracking-widest mb-2">Preview</p>
                        <p
                          style={{
                            color: activeContent.textColor ?? '#ffffff',
                            fontWeight: activeContent.fontWeight ?? '900',
                            fontFamily: "'Arial Black', Arial, sans-serif",
                            fontSize: '1.5rem',
                            letterSpacing: '0.05em',
                            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                          }}
                        >
                          {activeContent.text}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── IMAGE OPTIONS ── */}
                {activeContent.type === 'image' && (
                  <div className="space-y-4">
                    <label className="block w-full bg-white/4 hover:bg-white/8 border-2 border-dashed border-white/15 hover:border-orange-500/50 transition-all rounded-2xl p-6 text-center cursor-pointer group">
                      <div className="text-2xl mb-2">🖼</div>
                      <p className="text-white/50 text-xs uppercase tracking-widest group-hover:text-white/80 transition-colors">
                        Upload Image
                      </p>
                      <p className="text-white/20 text-[10px] mt-1">PNG, JPG — transparent PNG recommended</p>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, activeZoneId)}
                      />
                    </label>

                    {activeContent.imageUrl && (
                      <div className="bg-white/4 rounded-xl p-4 border border-white/8">
                        <p className="text-[9px] text-white/30 uppercase tracking-widest mb-2">Preview</p>
                        <div className="h-28 flex items-center justify-center">
                          <img
                            src={activeContent.imageUrl}
                            alt="Zone artwork"
                            className="max-h-full max-w-full object-contain drop-shadow-lg rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeContent.type === 'none' && (
                  <div className="text-center py-6 text-white/20 text-xs uppercase tracking-widest">
                    Select Text or Image above to add content to this zone
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Footer ─────────────────────────────── */}
        <div className="p-4 border-t border-white/8 space-y-2">
          {/* Quick zone status bar */}
          <div className="flex gap-1.5 mb-3">
            {ZONES.map((z) => {
              const content = zoneContents[z.id];
              const active = content.type !== 'none';
              return (
                <button
                  key={z.id}
                  onClick={() => { setTab('zones'); setActiveZoneId(z.id); }}
                  title={z.label}
                  className={`flex-1 h-1 rounded-full transition-all ${active ? 'bg-orange-400' : 'bg-white/10'}`}
                />
              );
            })}
          </div>

          <button
            onClick={handleSave}
            className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-400 hover:to-orange-500 active:scale-95 shadow-xl shadow-orange-500/25"
          >
            Save Design →
          </button>
          <p className="text-center text-white/20 text-[10px] uppercase tracking-widest">
            {Object.values(zoneContents).filter((c) => c.type !== 'none').length} zone
            {Object.values(zoneContents).filter((c) => c.type !== 'none').length !== 1 ? 's' : ''} configured
          </p>
        </div>
      </div>
    </div>
  );
}