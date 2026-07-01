"use client";
/**
 * Admin 3D Model Manager — v6
 * ============================
 *
 * KEY ARCHITECTURAL FIXES:
 *
 * 1. MATERIAL PRESERVATION — CanvasTexture was overwriting the base material map.
 *    Fix: We apply text/logo as a DECAL using a separate transparent plane mesh
 *    positioned slightly in front of the surface (0.001 units), so the original
 *    material colors/textures remain completely untouched underneath.
 *
 * 2. DRAW-ON-MODEL RECTANGLE TOOL — Admin clicks "Draw Zone" → enters draw mode →
 *    drags a rectangle ON the Canvas element (screen space) → on mouse-up the
 *    rect is converted to normalized screen coords → stored as the zone's screen rect.
 *    The decal plane is then sized/positioned using raycasting from the rect corners.
 *
 * 3. WORKFLOW:
 *    Pick Material (click mesh) → Draw Rectangle on the model → Choose type (text/logo/both)
 *    → Configure text/logo → See it live on model → Save
 *
 * 4. DECAL APPROACH for text/logo rendering:
 *    Each zone gets a THREE.Mesh with PlaneGeometry + CanvasTexture (transparent PNG).
 *    The plane is placed at the hit point on the mesh surface, oriented to face outward
 *    along the surface normal, sized to match the drawn rectangle in world space.
 *    This means the original material is 100% preserved — colors, textures, everything.
 */

import React, {
  useState, useEffect, useCallback, useRef, Suspense, useMemo,
} from "react";
import { Canvas, ThreeEvent, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Center, useGLTF, Environment, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  Plus, Trash2, Save, Upload, Box, ChevronLeft, Edit3, X,
  Type, Layers, MousePointer, AlertCircle, Loader,
  Image as ImageIcon, Square, Check, ChevronDown, ChevronRight,
  Move,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** Screen-space rect as fraction of canvas (0–1) */
interface ScreenRect {
  x: number; // left
  y: number; // top
  w: number; // width
  h: number; // height
}

/** World-space hit data captured when admin draws the rectangle */
interface ZoneHit {
  center: [number, number, number];
  normal: [number, number, number];
  /** Width in world units */
  worldW: number;
  /** Height in world units */
  worldH: number;
}

export interface PrintZone {
  id: string;
  label: string;
  materialName: string;
  type: "text" | "image" | "both";
  defaultText: string;
  placeholder: string;
  defaultImageUrl?: string;
  /** Hit point & orientation in world space (from raycasting) */
  hit: ZoneHit;
  /** Font / style */
  fontSize: number;
  textColor: string;
  align: "left" | "center" | "right";
  isBold: boolean;
  allowCustomColor: boolean;
  defaultColor: string;
}

interface MaterialInfo {
  name: string;
  originalColor: string;
}

interface Model3D {
  id: string;
  name: string;
  description?: string;
  modelUrl: string;
  thumbnailUrl?: string;
  isActive: boolean;
  printZones: PrintZone[];
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS TEXTURE FACTORY
// Renders text/logo onto a transparent canvas → used as decal texture
// ─────────────────────────────────────────────────────────────────────────────

const TEX = 512;

function buildDecalTexture(
  zone: PrintZone,
  logoImg?: HTMLImageElement | null
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TEX;
  canvas.height = TEX;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, TEX, TEX);

  // Draw logo
  if ((zone.type === "image" || zone.type === "both") && logoImg) {
    const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
    let dw = TEX, dh = TEX;
    if (aspect > 1) dh = TEX / aspect;
    else dw = TEX * aspect;
    ctx.drawImage(logoImg, (TEX - dw) / 2, (TEX - dh) / 2, dw, dh);
  }

  // Draw text
  if ((zone.type === "text" || zone.type === "both") && zone.defaultText?.trim()) {
    const weight = zone.isBold ? "900" : "600";
    ctx.font = `${weight} ${zone.fontSize}px Arial, sans-serif`;
    ctx.fillStyle = zone.textColor || "#ffffff";
    ctx.textBaseline = "middle";
    ctx.textAlign = zone.align as CanvasTextAlign;
    ctx.shadowColor = "rgba(0,0,0,0.85)";
    ctx.shadowBlur = 8;
    const tx =
      zone.align === "left"  ? 12 :
      zone.align === "right" ? TEX - 12 :
      TEX / 2;
    ctx.fillText(zone.defaultText, tx, TEX / 2, TEX - 24);
    ctx.shadowBlur = 0;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// ─────────────────────────────────────────────────────────────────────────────
// DECAL PLANE — a transparent plane mesh placed on the model surface
// This preserves the original material completely
// ─────────────────────────────────────────────────────────────────────────────

function DecalPlane({
  zone,
  logoImg,
  isSelected,
}: {
  zone: PrintZone;
  logoImg?: HTMLImageElement | null;
  isSelected: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(
    () => buildDecalTexture(zone, logoImg),
    // rebuild when these change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zone.defaultText, zone.textColor, zone.fontSize, zone.isBold, zone.align, zone.type, logoImg]
  );

  // Position the plane at the hit point, oriented along the surface normal
  const position = new THREE.Vector3(...zone.hit.center);
  const normal   = new THREE.Vector3(...zone.hit.normal);

  // Quaternion to rotate plane (default faces +Z) to face along the hit normal
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    normal.clone().normalize()
  );

  // Offset slightly above the surface to avoid z-fighting
  const offset = normal.clone().normalize().multiplyScalar(0.003);
  position.add(offset);

  return (
    <mesh
      ref={meshRef}
      position={position}
      quaternion={quaternion}
      renderOrder={1}
    >
      <planeGeometry args={[zone.hit.worldW, zone.hit.worldH]} />
      <meshBasicMaterial
        map={texture}
        transparent
        alphaTest={0.01}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
      {/* Selection outline */}
      {isSelected && (
        <lineSegments renderOrder={2}>
          <edgesGeometry args={[new THREE.PlaneGeometry(zone.hit.worldW, zone.hit.worldH)]} />
          <lineBasicMaterial color="#f97316" linewidth={2} />
        </lineSegments>
      )}
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMERA AUTO-FIT
// ─────────────────────────────────────────────────────────────────────────────

function CameraFit({ scene }: { scene: THREE.Object3D | null }) {
  const { camera } = useThree();
  const fitted = useRef(false);
  useEffect(() => {
    if (!scene || fitted.current) return;
    fitted.current = true;
    const box = new THREE.Box3().setFromObject(scene);
    if (box.isEmpty()) return;
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const cam    = camera as THREE.PerspectiveCamera;
    const dist   = (Math.max(size.x, size.y, size.z) / (2 * Math.tan((cam.fov * Math.PI) / 360))) * 1.7;
    cam.position.set(center.x, center.y, center.z + dist);
    cam.near = dist / 100; cam.far = dist * 100;
    cam.lookAt(center);
    cam.updateProjectionMatrix();
  }, [scene, camera]);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODEL SCENE (inside Canvas)
// ─────────────────────────────────────────────────────────────────────────────

interface SceneProps {
  url: string;
  zones: PrintZone[];
  logoMap: Record<string, HTMLImageElement>;
  activeMaterial: string | null;
  activeZoneId: string | null;
  isPickingMaterial: boolean;
  onMaterialPicked: (name: string, meshName: string) => void;
  onMaterialsFound: (list: MaterialInfo[]) => void;
  /** Ref written by ModelScene — InnerCanvas uses it to raycast ONLY model meshes */
  modelSceneRef: React.MutableRefObject<THREE.Object3D | null>;
}

function ModelScene({
  url, zones, logoMap, activeMaterial, activeZoneId,
  isPickingMaterial, onMaterialPicked, onMaterialsFound, modelSceneRef,
}: SceneProps) {
  const { scene: rawScene } = useGLTF(url);
  const didReport = useRef(false);

  const scene = useMemo(() => {
    didReport.current = false;
    const s = rawScene.clone(true);
    s.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.material = Array.isArray(m.material)
        ? m.material.map((mat) => (mat as THREE.Material).clone())
        : (m.material as THREE.Material).clone();
    });
    return s;
  }, [rawScene]);

  // Expose cloned scene so InnerCanvas raycasts ONLY the model, not lights/cameras
  useEffect(() => { modelSceneRef.current = scene; }, [scene, modelSceneRef]);

  // Report materials
  useEffect(() => {
    if (didReport.current) return;
    didReport.current = true;
    const found = new Map<string, string>();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => {
        const sm   = mat as THREE.MeshStandardMaterial;
        const name = (sm.name || m.name || "unnamed").trim();
        if (name && !found.has(name))
          found.set(name, "#" + (sm.color?.getHexString?.() ?? "ffffff"));
      });
    });
    onMaterialsFound(Array.from(found.entries()).map(([name, originalColor]) => ({ name, originalColor })));
  }, [scene, onMaterialsFound]);

  // Emissive highlight on active material
  useEffect(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        const sm      = mat as THREE.MeshStandardMaterial;
        const matName = (sm.name || mesh.name || "unnamed").trim();
        if (!sm.emissive) return;
        sm.emissive.setHex(matName === activeMaterial ? 0xff4400 : 0x000000);
        sm.emissiveIntensity = matName === activeMaterial ? 0.25 : 0;
        sm.needsUpdate = true;
      });
    });
  }, [activeMaterial, scene]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (!isPickingMaterial) return;
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    const mat  = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const sm   = mat as THREE.MeshStandardMaterial;
    onMaterialPicked((sm.name || mesh.name || "unnamed").trim(), mesh.name);
  }, [isPickingMaterial, onMaterialPicked]);

  return (
    <>
      <CameraFit scene={scene} />
      {/* Original model — untouched */}
      <primitive
        object={scene}
        onClick={handleClick}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          if (!isPickingMaterial) return;
          e.stopPropagation();
          document.body.style.cursor = "crosshair";
        }}
        onPointerOut={() => { document.body.style.cursor = "auto"; }}
      >
        {/* Decal overlays — one per zone, floated above the surface */}
        {zones.map((zone) => (
          <DecalPlane
            key={zone.id}
            zone={zone}
            logoImg={logoMap[zone.id] ?? null}
            isSelected={activeZoneId === zone.id}
          />
        ))}
      </primitive>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DRAW ZONE OVERLAY
// Rendered as an absolutely-positioned div over the Canvas.
// Admin drags a rectangle here → we capture start/end screen coords →
// raycast to find world-space hit → create zone hit data.
// ─────────────────────────────────────────────────────────────────────────────

interface DrawRect { x: number; y: number; w: number; h: number; }

interface DrawZoneOverlayProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  isDrawing: boolean;
  onRectDrawn: (rect: DrawRect) => void;
  onCancel: () => void;
}

function DrawZoneOverlay({ canvasRef, isDrawing, onRectDrawn, onCancel }: DrawZoneOverlayProps) {
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [current, setCurrent] = useState<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);

  const getRelative = (e: React.MouseEvent) => {
    const el = canvasRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    isDragging.current = true;
    const pos = getRelative(e);
    setStart(pos);
    setCurrent(pos);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !isDrawing) return;
    setCurrent(getRelative(e));
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current || !isDrawing || !start) return;
    isDragging.current = false;
    const end = getRelative(e);
    const el  = canvasRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;

    const rx = Math.min(start.x, end.x);
    const ry = Math.min(start.y, end.y);
    const rw = Math.abs(end.x - start.x);
    const rh = Math.abs(end.y - start.y);

    if (rw < 10 || rh < 10) {
      // Too small — cancel
      setStart(null); setCurrent(null);
      return;
    }

    onRectDrawn({ x: rx / cw, y: ry / ch, w: rw / cw, h: rh / ch });
    setStart(null); setCurrent(null);
  };

  if (!isDrawing) return null;

  const rect = start && current ? {
    left:   Math.min(start.x, current.x),
    top:    Math.min(start.y, current.y),
    width:  Math.abs(current.x - start.x),
    height: Math.abs(current.y - start.y),
  } : null;

  return (
    <div
      className="absolute inset-0 z-20 select-none"
      style={{ cursor: "crosshair" }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      {/* Instruction */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl pointer-events-none whitespace-nowrap">
        🖱 Drag to draw a print zone rectangle
      </div>

      {/* Cancel */}
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all pointer-events-auto"
      >
        Cancel (Esc)
      </button>

      {/* Live rectangle */}
      {rect && rect.width > 5 && rect.height > 5 && (
        <div
          className="absolute border-2 border-orange-400 bg-orange-400/10 pointer-events-none"
          style={{
            left:   rect.left,
            top:    rect.top,
            width:  rect.width,
            height: rect.height,
          }}
        >
          <div className="absolute -top-5 left-0 text-[9px] text-orange-300 font-black whitespace-nowrap">
            {Math.round(rect.width)}×{Math.round(rect.height)}px
          </div>
          {/* Corner handles */}
          {[
            "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
            "top-0 right-0 translate-x-1/2 -translate-y-1/2",
            "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
            "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
          ].map((cls, i) => (
            <div key={i} className={`absolute w-3 h-3 bg-orange-400 border-2 border-white rounded-sm ${cls}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURE ZONE MODAL — opens after rect is drawn
// ─────────────────────────────────────────────────────────────────────────────

interface ConfigureZoneModalProps {
  materialName: string;
  hit: ZoneHit;
  existingCount: number;
  onConfirm: (zone: PrintZone) => void;
  onCancel: () => void;
}

function ConfigureZoneModal({ materialName, hit, existingCount, onConfirm, onCancel }: ConfigureZoneModalProps) {
  const [step, setStep] = useState<"type" | "configure">("type");
  const [zone, setZone] = useState<PrintZone>({
    id:              `zone_${Date.now()}`,
    label:           `${materialName} — Zone ${existingCount + 1}`,
    materialName,
    type:            "text",
    defaultText:     "PLAYER NAME",
    placeholder:     "Enter your name",
    defaultImageUrl: undefined,
    hit,
    fontSize:        80,
    textColor:       "#ffffff",
    align:           "center",
    isBold:          true,
    allowCustomColor:false,
    defaultColor:    "#ffffff",
  });
  const logoRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const patch = (p: Partial<PrintZone>) => setZone((z) => ({ ...z, ...p }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-orange-400 mb-0.5">
              New Zone — {materialName}
            </p>
            <h2 className="text-lg font-black uppercase tracking-tight text-white">
              {step === "type" ? "What goes in this area?" : "Configure the zone"}
            </h2>
          </div>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[72vh] overflow-y-auto">

          {step === "type" ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-4">
                You've drawn a print area on <strong className="text-white">{materialName}</strong>.
                What should customers be able to customize here?
              </p>
              {([
                { t: "text"  as const, icon: <Type className="w-6 h-6" />,       title: "Text Field",   desc: "Name, number, custom text — customer types it in" },
                { t: "image" as const, icon: <ImageIcon className="w-6 h-6" />,  title: "Logo / Image", desc: "Club badge, sponsor logo — customer uploads their image" },
                { t: "both"  as const, icon: <Layers className="w-6 h-6" />,     title: "Text + Logo",  desc: "Both text and an image stacked together" },
              ]).map(({ t, icon, title, desc }) => (
                <button
                  key={t}
                  onClick={() => { patch({ type: t }); setStep("configure"); }}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-slate-700 bg-slate-800/50 text-left hover:border-orange-500 hover:bg-orange-500/5 group transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-700 group-hover:bg-orange-500/20 flex items-center justify-center flex-shrink-0 text-slate-400 group-hover:text-orange-400 transition-all">
                    {icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-black uppercase tracking-wide text-white text-sm">{title}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Back + type badge */}
              <div className="flex items-center gap-3">
                <button onClick={() => setStep("type")} className="text-[10px] text-slate-500 hover:text-orange-400 transition-colors underline">
                  ← Change type
                </button>
                <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                  zone.type === "text"  ? "bg-blue-500/20 text-blue-400" :
                  zone.type === "image" ? "bg-purple-500/20 text-purple-400" :
                  "bg-orange-500/20 text-orange-400"
                }`}>
                  {zone.type === "text"  && <Type className="w-3 h-3" />}
                  {zone.type === "image" && <ImageIcon className="w-3 h-3" />}
                  {zone.type === "both"  && <Layers className="w-3 h-3" />}
                  {zone.type}
                </div>
              </div>

              {/* Zone label */}
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Zone Label</label>
                <input type="text" value={zone.label} onChange={(e) => patch({ label: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:border-orange-500 outline-none" />
              </div>

              {/* Text config */}
              {(zone.type === "text" || zone.type === "both") && (
                <div className="space-y-3 bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                  <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">Text Settings</p>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                      Default Text <span className="text-orange-400 normal-case font-normal">(shown on 3D model — customer replaces this)</span>
                    </label>
                    <input type="text" value={zone.defaultText} onChange={(e) => patch({ defaultText: e.target.value })}
                      placeholder="e.g. PLAYER NAME or 00"
                      className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-base text-white font-bold placeholder-slate-600 focus:border-orange-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Customer Input Hint</label>
                    <input type="text" value={zone.placeholder} onChange={(e) => patch({ placeholder: e.target.value })}
                      placeholder="Enter your name"
                      className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-orange-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Color</label>
                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-600 rounded-xl px-3 py-2">
                        <input type="color" value={zone.textColor} onChange={(e) => patch({ textColor: e.target.value })}
                          className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 outline-none" />
                        <span className="text-[9px] text-slate-400 font-mono truncate">{zone.textColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Size px</label>
                      <input type="number" min={20} max={400} value={zone.fontSize}
                        onChange={(e) => patch({ fontSize: parseInt(e.target.value) || 80 })}
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white text-center focus:border-orange-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Align</label>
                      <div className="grid grid-cols-3 gap-0.5">
                        {(["left","center","right"] as const).map((a) => (
                          <button key={a} onClick={() => patch({ align: a })}
                            className={`py-2 rounded-lg text-[8px] font-black uppercase transition-all ${zone.align === a ? "bg-orange-500 text-white" : "bg-slate-900 border border-slate-700 text-slate-500"}`}>
                            {a[0].toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div onClick={() => patch({ isBold: !zone.isBold })}
                      className={`w-9 h-5 rounded-full transition-all cursor-pointer ${zone.isBold ? "bg-orange-500" : "bg-slate-600"}`}>
                      <div className={`w-3.5 h-3.5 bg-white rounded-full shadow mx-0.5 mt-0.5 transition-transform ${zone.isBold ? "translate-x-4" : "translate-x-0"}`} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Bold</span>
                  </label>
                </div>
              )}

              {/* Logo config */}
              {(zone.type === "image" || zone.type === "both") && (
                <div className="space-y-3 bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                  <p className="text-[9px] font-black uppercase tracking-widest text-purple-400">Logo Settings</p>
                  <input ref={logoRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = URL.createObjectURL(f);
                      setLogoPreview(url);
                      patch({ defaultImageUrl: url });
                    }} />
                  <button onClick={() => logoRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 border-2 border-dashed border-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-400 hover:border-purple-500/60 hover:text-purple-400 transition-all">
                    <Upload className="w-4 h-4" />
                    {logoPreview ? "Replace Logo" : "Upload Default Logo"}
                  </button>
                  {logoPreview && (
                    <img src={logoPreview} alt="" className="w-full h-20 object-contain rounded-xl bg-slate-900 border border-slate-700 p-2" />
                  )}
                </div>
              )}

              {/* Color change toggle */}
              <div className="flex items-center justify-between bg-slate-800 rounded-2xl px-4 py-3 border border-slate-700">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-white">Allow Customer to Change Color</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Show color picker for {materialName} on storefront</p>
                </div>
                <button onClick={() => patch({ allowCustomColor: !zone.allowCustomColor })}
                  className={`w-10 h-6 rounded-full transition-all flex-shrink-0 ml-4 ${zone.allowCustomColor ? "bg-orange-500" : "bg-slate-600"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow mx-1 transition-transform ${zone.allowCustomColor ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Zone size info */}
              <div className="bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Drawn Area (World Space)</p>
                <p className="text-[10px] font-mono text-slate-400">
                  Center: ({hit.center.map((v) => v.toFixed(3)).join(", ")})<br />
                  Size: {hit.worldW.toFixed(3)} × {hit.worldH.toFixed(3)} units
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-800">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-slate-800 text-slate-400 text-xs font-black uppercase tracking-wider hover:bg-slate-700 transition-all">
            Cancel
          </button>
          {step === "configure" && (
            <button onClick={() => onConfirm(zone)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-orange-500 text-white text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg">
              <Check className="w-4 h-4" /> Add to Model
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ZONE CARD — compact zone editor in the sidebar
// ─────────────────────────────────────────────────────────────────────────────

function ZoneCard({
  zone, isActive, onSelect, onDelete, onChange, onLogoUpload,
}: {
  zone: PrintZone; isActive: boolean;
  onSelect: () => void; onDelete: () => void;
  onChange: (p: Partial<PrintZone>) => void;
  onLogoUpload: (file: File) => void;
}) {
  const [open, setOpen] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${isActive ? "border-orange-500" : "border-slate-700"}`}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer bg-slate-800/50 hover:bg-slate-800 transition-colors"
        onClick={() => { onSelect(); setOpen((v) => !v); }}>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${zone.type === "text" ? "bg-blue-400" : zone.type === "image" ? "bg-purple-400" : "bg-orange-400"}`} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black uppercase tracking-wide text-white truncate">{zone.label}</p>
          <p className="text-[9px] text-slate-500 truncate">
            {zone.type}
            {zone.defaultText ? ` · "${zone.defaultText}"` : ""}
          </p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
      </div>

      {open && (
        <div className="px-4 pb-4 pt-3 border-t border-slate-700 space-y-3 bg-slate-900">
          {/* Label */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Zone Label</label>
            <input type="text" value={zone.label} onChange={(e) => onChange({ label: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-xs text-white focus:border-orange-500 outline-none" />
          </div>

          {/* Text */}
          {(zone.type === "text" || zone.type === "both") && (
            <>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Default Text (on model)</label>
                <input type="text" value={zone.defaultText} onChange={(e) => onChange({ defaultText: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white font-bold focus:border-orange-500 outline-none" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Customer Hint</label>
                <input type="text" value={zone.placeholder} onChange={(e) => onChange({ placeholder: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-xs text-white focus:border-orange-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Color</label>
                  <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2">
                    <input type="color" value={zone.textColor} onChange={(e) => onChange({ textColor: e.target.value })}
                      className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 outline-none" />
                    <span className="text-[9px] text-slate-400 font-mono">{zone.textColor}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Size</label>
                  <input type="number" min={20} max={400} value={zone.fontSize}
                    onChange={(e) => onChange({ fontSize: parseInt(e.target.value) || 80 })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-xs text-white text-center focus:border-orange-500 outline-none" />
                </div>
              </div>
            </>
          )}

          {/* Logo */}
          {(zone.type === "image" || zone.type === "both") && (
            <>
              <input ref={logoRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onLogoUpload(f); }} />
              <button onClick={() => logoRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 border-2 border-dashed border-slate-600 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:border-orange-500/60 hover:text-orange-400 transition-all">
                <Upload className="w-3.5 h-3.5" />
                {zone.defaultImageUrl ? "Replace Logo" : "Upload Logo"}
              </button>
              {zone.defaultImageUrl && (
                <img src={zone.defaultImageUrl} alt="" className="w-full h-12 object-contain rounded-xl bg-slate-800 border border-slate-700 p-1" />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RAYCAST UTILITY
// Converts a screen-space rect (fractions) to world-space ZoneHit
// by raycasting all 5 points (corners + center) against the scene
// ─────────────────────────────────────────────────────────────────────────────

function screenFractionToNDC(fx: number, fy: number): THREE.Vector2 {
  return new THREE.Vector2(fx * 2 - 1, -(fy * 2 - 1));
}

function raycastRect(
  rect: DrawRect,
  camera: THREE.Camera,
  modelRoot: THREE.Object3D
): ZoneHit | null {
  const raycaster = new THREE.Raycaster();

  // Collect only Mesh children from the model
  const meshes: THREE.Mesh[] = [];
  modelRoot.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh); });
  if (!meshes.length) return null;

  // Raycast the center of the drawn rectangle
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const centerNDC = new THREE.Vector2(cx * 2 - 1, -(cy * 2 - 1));
  raycaster.setFromCamera(centerNDC, camera);
  const centerHits = raycaster.intersectObjects(meshes, false);
  if (!centerHits.length) return null;
  const hit = centerHits[0];

  // Estimate world-space size from the rect screen fraction × camera depth
  // Project the rect width/height into world space at the hit distance
  const hitDist  = hit.distance;
  const cam      = camera as THREE.PerspectiveCamera;
  const fovRad   = (cam.fov * Math.PI) / 180;
  const aspect   = cam.aspect || 1;
  // Height of view frustum at hit distance
  const viewH    = 2 * hitDist * Math.tan(fovRad / 2);
  const viewW    = viewH * aspect;
  const worldW   = Math.max(rect.w * viewW, 0.04);
  const worldH   = Math.max(rect.h * viewH, 0.03);

  const normal = hit.face
    ? hit.face.normal.clone()
        .transformDirection((hit.object as THREE.Mesh).matrixWorld)
        .normalize()
    : new THREE.Vector3(0, 0, 1);

  // Convert to local space of the modelRoot so decals follow the model correctly
  const localCenter = modelRoot.worldToLocal(hit.point.clone());
  const invWorld = new THREE.Matrix4().copy(modelRoot.matrixWorld).invert();
  const localNormal = normal.clone().transformDirection(invWorld).normalize();

  const scale = new THREE.Vector3().setFromMatrixScale(modelRoot.matrixWorld);
  const avgScale = (scale.x + scale.y + scale.z) / 3 || 1;

  return {
    center: [localCenter.x, localCenter.y, localCenter.z],
    normal: [localNormal.x, localNormal.y, localNormal.z],
    worldW: worldW / avgScale,
    worldH: worldH / avgScale,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// INNER CANVAS COMPONENT — needs access to useThree camera for raycasting
// ─────────────────────────────────────────────────────────────────────────────

interface InnerCanvasProps extends SceneProps {
  pendingRect: DrawRect | null;
  onRaycastDone: (hit: ZoneHit | null) => void;
}

function InnerCanvas({ pendingRect, onRaycastDone, modelSceneRef, ...sceneProps }: InnerCanvasProps) {
  const { camera } = useThree();

  useEffect(() => {
    if (!pendingRect) return;
    // Wait a tick to ensure modelSceneRef is populated
    const id = setTimeout(() => {
      const modelRoot = modelSceneRef.current;
      if (!modelRoot) {
        onRaycastDone(null);
        return;
      }
      const hit = raycastRect(pendingRect, camera, modelRoot);
      onRaycastDone(hit);
    }, 50);
    return () => clearTimeout(id);
  }, [pendingRect]); // eslint-disable-line react-hooks/exhaustive-deps

  return <ModelScene modelSceneRef={modelSceneRef} {...sceneProps} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ADMIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function Admin3DModels() {
  const [models,         setModels]         = useState<Model3D[]>([]);
  const [loadingModels,  setLoadingModels]  = useState(true);
  const [view,           setView]           = useState<"list"|"editor">("list");
  const [editingModel,   setEditingModel]   = useState<Partial<Model3D>|null>(null);
  const [zones,          setZones]          = useState<PrintZone[]>([]);
  const [materials,      setMaterials]      = useState<MaterialInfo[]>([]);
  const [activeMaterial, setActiveMaterial] = useState<string|null>(null);
  const [activeZoneId,   setActiveZoneId]   = useState<string|null>(null);
  const [isPickingMaterial, setIsPickingMaterial] = useState(false);
  const [isDrawingZone,  setIsDrawingZone]  = useState(false);
  const [pendingRect,    setPendingRect]    = useState<DrawRect|null>(null);
  const [pendingHit,     setPendingHit]     = useState<ZoneHit|null>(null);
  const [showConfigModal,setShowConfigModal]= useState(false);
  const [logoMap,        setLogoMap]        = useState<Record<string,HTMLImageElement>>({});
  const [previewUrl,     setPreviewUrl]     = useState<string|null>(null);
  const [modelUrlInput,  setModelUrlInput]  = useState("");
  const [modelKey,       setModelKey]       = useState(0);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [toast,          setToast]          = useState<{msg:string;ok:boolean}|null>(null);

  const glbInputRef    = useRef<HTMLInputElement>(null);
  const glbFileRef     = useRef<File|null>(null);
  const canvasWrapRef  = useRef<HTMLDivElement>(null);
  /** Holds the cloned model scene so raycast targets ONLY model meshes */
  const modelSceneRef  = useRef<THREE.Object3D | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchModels = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/api/admin/3d-models");
      if (data.ok) setModels(data.models);
    } catch { /* silent */ }
    finally { setLoadingModels(false); }
  }, []);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  // Esc to cancel drawing
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDrawingZone(false); setIsPickingMaterial(false);
        setPendingRect(null); setPendingHit(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const resetEditor = () => {
    setMaterials([]); setActiveMaterial(null); setActiveZoneId(null);
    setIsPickingMaterial(false); setIsDrawingZone(false);
    setPendingRect(null); setPendingHit(null);
    setShowConfigModal(false); setLogoMap({});
  };

  const openEditor = (model?: Model3D) => {
    resetEditor();
    if (model) {
      setEditingModel(model);
      setZones(model.printZones.map((z) => ({ ...z })));
      setPreviewUrl(model.modelUrl);
      setModelUrlInput(model.modelUrl);
    } else {
      setEditingModel({ name: "New 3D Model", isActive: true });
      setZones([]); setPreviewUrl(null); setModelUrlInput("");
    }
    setModelKey((k) => k + 1);
    setView("editor");
  };

  const loadModel = (url: string) => {
    resetEditor(); setZones([]);
    setPreviewUrl(url); setIsModelLoading(true);
    setModelKey((k) => k + 1);
  };

  const handleGlbFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    glbFileRef.current = file;
    loadModel(URL.createObjectURL(file));
    setModelUrlInput("");
  };

  const handleMaterialsFound = useCallback((list: MaterialInfo[]) => {
    setMaterials(list); setIsModelLoading(false);
  }, []);

  // Step 1: Admin clicks "Pick Material" → clicks mesh → material identified
  const handleMaterialPicked = useCallback((name: string) => {
    setIsPickingMaterial(false);
    setActiveMaterial(name);
    // Immediately enter draw mode
    setIsDrawingZone(true);
    showToast(`${name} selected — now draw your zone`);
  }, []);

  // Step 2: Admin finishes drawing rect → trigger raycast inside Canvas
  const handleRectDrawn = useCallback((rect: DrawRect) => {
    setIsDrawingZone(false);
    setPendingRect(rect);
  }, []);

  // Step 3: Raycast result comes back from InnerCanvas
  const handleRaycastDone = useCallback((hit: ZoneHit | null) => {
    setPendingRect(null);
    if (!hit) {
      showToast("Couldn't detect surface — try drawing on the model directly", false);
      return;
    }
    setPendingHit(hit);
    setShowConfigModal(true);
  }, []);

  // Step 4: Admin configures zone in modal → confirm
  const handleZoneConfirmed = useCallback((zone: PrintZone) => {
    setZones((prev) => [...prev, zone]);
    setActiveZoneId(zone.id);
    setShowConfigModal(false);
    setPendingHit(null);
    showToast("Zone added!");
  }, []);

  const updateZone = useCallback((id: string, patch: Partial<PrintZone>) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...patch } : z)));
  }, []);

  const deleteZone = useCallback((id: string) => {
    setZones((prev) => prev.filter((z) => z.id !== id));
    setActiveZoneId((prev) => (prev === id ? null : prev));
  }, []);

  const handleLogoUpload = useCallback((zoneId: string, file: File) => {
    const url = URL.createObjectURL(file);
    updateZone(zoneId, { defaultImageUrl: url });
    const img = new window.Image();
    img.onload = () => setLogoMap((prev) => ({ ...prev, [zoneId]: img }));
    img.src = url;
  }, [updateZone]);

  const handleSave = async () => {
    if (!editingModel?.name?.trim()) return showToast("Model name required", false);
    const hasFile  = !!glbFileRef.current;
    const hasUrl   = modelUrlInput.trim() && !modelUrlInput.startsWith("blob:");
    const isUpdate = !!editingModel.id;
    if (!isUpdate && !hasFile && !hasUrl) return showToast("Provide a .glb file or URL", false);
    setSaving(true);
    try {
      const payload = { name: editingModel.name, description: editingModel.description, isActive: editingModel.isActive ?? true, printZones: zones };
      if (isUpdate) {
        await apiClient.patch(`/api/admin/3d-models/${editingModel.id}`, { ...payload, ...(hasUrl ? { modelUrl: modelUrlInput.trim() } : {}) });
        showToast("Model updated!");
      } else if (hasFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => fd.append(k, typeof v === "string" ? v : JSON.stringify(v)));
        fd.append("glbFile", glbFileRef.current!, glbFileRef.current!.name);
        await apiClient.post("/api/admin/3d-models", fd, { headers: { "Content-Type": "multipart/form-data" } });
        showToast("Model created!");
      } else {
        await apiClient.post("/api/admin/3d-models", { ...payload, modelUrl: modelUrlInput.trim() });
        showToast("Model created!");
      }
      glbFileRef.current = null;
      await fetchModels();
      setView("list");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Save failed", false);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this model?")) return;
    try { await apiClient.delete(`/api/admin/3d-models/${id}`); showToast("Deleted"); fetchModels(); }
    catch { showToast("Delete failed", false); }
  };

  const zonesByMaterial = useMemo(() => {
    const map = new Map<string, PrintZone[]>();
    zones.forEach((z) => {
      if (!map.has(z.materialName)) map.set(z.materialName, []);
      map.get(z.materialName)!.push(z);
    });
    return map;
  }, [zones]);

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
      {toast && (
        <div className={`fixed top-6 right-6 z-[300] px-5 py-3 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-2xl ${toast.ok ? "bg-emerald-500" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      {showConfigModal && pendingHit && activeMaterial && (
        <ConfigureZoneModal
          materialName={activeMaterial}
          hit={pendingHit}
          existingCount={zonesByMaterial.get(activeMaterial)?.length ?? 0}
          onConfirm={handleZoneConfirmed}
          onCancel={() => { setShowConfigModal(false); setPendingHit(null); }}
        />
      )}

      {view === "list" ? (
        /* LIST VIEW */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">3D Model Library</h1>
              <p className="text-slate-400 text-sm mt-1">Upload GLB models and draw print zones directly on the 3D model.</p>
            </div>
            <button onClick={() => openEditor()}
              className="flex items-center gap-2 px-5 py-3 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg">
              <Plus className="w-4 h-4" /> Add Model
            </button>
          </div>
          {loadingModels ? (
            <div className="grid grid-cols-3 gap-6">{[0,1,2].map((i) => <div key={i} className="bg-slate-100 rounded-3xl h-64 animate-pulse" />)}</div>
          ) : models.length === 0 ? (
            <div className="text-center py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <Box className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No models yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map((m) => (
                <div key={m.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-44 bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center relative">
                    {m.thumbnailUrl ? <img src={m.thumbnailUrl} alt={m.name} className="h-full w-full object-cover" /> : <Box className="w-16 h-16 text-white/20" />}
                    <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-[9px] font-black uppercase ${m.isActive ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"}`}>
                      {m.isActive ? "Active" : "Draft"}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-black italic uppercase tracking-tight text-slate-900">{m.name}</h3>
                    <p className="text-slate-400 text-xs mt-1">{m.printZones.length} zone{m.printZones.length !== 1 ? "s" : ""}</p>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => openEditor(m)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-orange-600 transition-all">
                        <Edit3 className="w-3 h-3" /> Configure
                      </button>
                      <button onClick={() => handleDelete(m.id)}
                        className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* EDITOR VIEW */
        <div className="flex flex-col gap-3" style={{ height: "calc(100vh - 80px)" }}>
          {/* Header */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={() => setView("list")} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <input value={editingModel?.name || ""} onChange={(e) => setEditingModel((p) => ({ ...p, name: e.target.value }))}
              className="text-xl font-black italic uppercase tracking-tighter text-slate-900 bg-transparent border-b-2 border-transparent focus:border-orange-500 outline-none flex-1"
              placeholder="Model Name..." />
            {isModelLoading && (
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl">
                <Loader className="w-3.5 h-3.5 animate-spin text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Loading...</span>
              </div>
            )}
            {!isModelLoading && materials.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">{materials.length} materials</span>
              </div>
            )}
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50 shadow-lg">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="flex gap-4 flex-1 min-h-0">
            {/* 3D Canvas */}
            <div ref={canvasWrapRef} className="flex-1 min-h-0 bg-[#06060e] rounded-3xl overflow-hidden relative">

              {/* Toolbar */}
              {previewUrl && !isDrawingZone && (
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  <button
                    onClick={() => { setIsPickingMaterial((v) => !v); setIsDrawingZone(false); }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                      isPickingMaterial ? "bg-orange-500 text-white animate-pulse" : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    <MousePointer className="w-3.5 h-3.5" />
                    {isPickingMaterial ? "Click a part of the shirt..." : "1. Pick Material"}
                  </button>
                  {activeMaterial && !isPickingMaterial && (
                    <button
                      onClick={() => setIsDrawingZone(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg"
                    >
                      <Square className="w-3.5 h-3.5" />
                      2. Draw Zone on "{activeMaterial}"
                    </button>
                  )}
                </div>
              )}

              {/* Upload screen */}
              {!previewUrl ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8">
                  <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Box className="w-10 h-10 text-white/20" />
                  </div>
                  <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Load a GLB / GLTF model</p>
                  <div className="flex gap-2 w-full max-w-sm">
                    <input type="text" placeholder="Paste .glb URL..." value={modelUrlInput}
                      onChange={(e) => setModelUrlInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && modelUrlInput.trim()) loadModel(modelUrlInput.trim()); }}
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-xs placeholder-white/30 focus:border-orange-500 outline-none" />
                    <button onClick={() => loadModel(modelUrlInput.trim())} disabled={!modelUrlInput.trim()}
                      className="px-4 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-orange-600 disabled:opacity-40 transition-all">
                      Load
                    </button>
                  </div>
                  <p className="text-white/20 text-[10px] uppercase tracking-widest">— or —</p>
                  <button onClick={() => glbInputRef.current?.click()}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl text-white text-xs font-black uppercase tracking-wider hover:border-orange-500/50 hover:bg-white/10 transition-all">
                    <Upload className="w-4 h-4" /> Upload .glb File
                  </button>
                  <input ref={glbInputRef} type="file" accept=".glb,.gltf" className="hidden" onChange={handleGlbFile} />
                </div>
              ) : (
                <>
                  <Canvas
                    key={modelKey}
                    dpr={[1, 2]}
                    camera={{ position: [0, 0, 5], fov: 45 }}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <color attach="background" args={["#06060e"]} />
                    <Suspense fallback={null}>
                      <Environment preset="studio" />
                      <ambientLight intensity={0.8} />
                      <directionalLight position={[5, 10, 5]} intensity={1.4} />
                      <directionalLight position={[-5, 5, -5]} intensity={0.3} />
                      <Center>
                        <InnerCanvas
                          url={previewUrl}
                          zones={zones}
                          logoMap={logoMap}
                          activeMaterial={activeMaterial}
                          activeZoneId={activeZoneId}
                          isPickingMaterial={isPickingMaterial}
                          onMaterialPicked={handleMaterialPicked}
                          onMaterialsFound={handleMaterialsFound}
                          pendingRect={pendingRect}
                          onRaycastDone={handleRaycastDone}
                          modelSceneRef={modelSceneRef}
                        />
                      </Center>
                      <OrbitControls makeDefault enablePan={false} enabled={!isPickingMaterial && !isDrawingZone} />
                    </Suspense>
                  </Canvas>

                  {/* Draw zone overlay — sits over the Canvas */}
                  <DrawZoneOverlay
                    canvasRef={canvasWrapRef}
                    isDrawing={isDrawingZone}
                    onRectDrawn={handleRectDrawn}
                    onCancel={() => { setIsDrawingZone(false); }}
                  />
                </>
              )}

              {/* Loading overlay */}
              {previewUrl && isModelLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#06060e]/80 pointer-events-none">
                  <Loader className="w-8 h-8 animate-spin text-orange-500" />
                  <p className="text-white/60 text-xs uppercase tracking-widest font-bold">Parsing model...</p>
                </div>
              )}

              {/* Status bar */}
              {previewUrl && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <div className="flex gap-2">
                    {activeMaterial && (
                      <div className="bg-orange-500/90 backdrop-blur rounded-xl px-3 py-1.5">
                        <p className="text-white text-[10px] font-black uppercase tracking-widest">● {activeMaterial}</p>
                      </div>
                    )}
                    <div className="bg-black/60 backdrop-blur rounded-xl px-3 py-1.5">
                      <p className="text-white text-[10px] font-black uppercase tracking-widest">{zones.length} zones</p>
                    </div>
                  </div>
                  <button onClick={() => { setPreviewUrl(null); resetEditor(); setZones([]); }}
                    className="pointer-events-auto p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT PANEL */}
            <div className="w-[380px] flex-shrink-0 flex flex-col gap-3 min-h-0 overflow-y-auto">

              {/* Workflow guide */}
              {previewUrl && !isModelLoading && (
                <div className="bg-slate-950 rounded-2xl border border-slate-800 px-5 py-4 flex-shrink-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">How to Add a Print Zone</p>
                  {[
                    { n:"1", label:"Pick Material",    desc:'Click "1. Pick Material", then click the shirt' },
                    { n:"2", label:"Draw Rectangle",   desc:'Click "2. Draw Zone", drag a box on the shirt surface' },
                    { n:"3", label:"Choose Type",      desc:"Text field, Logo, or Both" },
                    { n:"4", label:"Set Default Text", desc:"e.g. PLAYER NAME — customer will replace this" },
                    { n:"5", label:"Save",             desc:"Zones are saved with the model" },
                  ].map(({ n, label, desc }) => (
                    <div key={n} className="flex gap-3 mb-2.5 last:mb-0">
                      <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[9px] font-black text-orange-400">{n}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-wide">{label}</p>
                        <p className="text-[9px] text-slate-500">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Materials list */}
              <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden flex-shrink-0">
                <div className="px-5 py-4 border-b border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Materials {materials.length > 0 && `(${materials.length})`}
                  </p>
                </div>
                {previewUrl && materials.length === 0 && (
                  <div className="px-5 py-3 flex items-center gap-2 text-slate-600">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <p className="text-[10px]">{isModelLoading ? "Detecting..." : "No named materials found."}</p>
                  </div>
                )}
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-800">
                  {materials.map((mat) => {
                    const count = zonesByMaterial.get(mat.name)?.length ?? 0;
                    const isActive = activeMaterial === mat.name;
                    return (
                      <div key={mat.name} className={`flex items-center gap-3 px-5 py-3 hover:bg-slate-800/50 transition-colors cursor-pointer ${isActive ? "bg-orange-500/5" : ""}`}
                        onClick={() => setActiveMaterial(mat.name)}>
                        <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" style={{ backgroundColor: mat.originalColor }} />
                        <span className={`flex-1 text-[11px] font-mono ${isActive ? "text-orange-400" : "text-slate-300"}`}>{mat.name}</span>
                        {count > 0 && <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-black">{count}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Zones by material */}
              {Array.from(zonesByMaterial.entries()).map(([matName, matZones]) => (
                <div key={matName} className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden flex-shrink-0">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: materials.find((m) => m.name === matName)?.originalColor ?? "#fff" }} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{matName}</p>
                      <span className="text-[9px] text-slate-600">({matZones.length})</span>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    {matZones.map((zone) => (
                      <ZoneCard
                        key={zone.id}
                        zone={zone}
                        isActive={activeZoneId === zone.id}
                        onSelect={() => { setActiveZoneId(zone.id); setActiveMaterial(zone.materialName); }}
                        onDelete={() => deleteZone(zone.id)}
                        onChange={(patch) => updateZone(zone.id, patch)}
                        onLogoUpload={(file) => handleLogoUpload(zone.id, file)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Model settings */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 px-5 py-4 flex-shrink-0 space-y-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Model Settings</p>
                <input value={editingModel?.description || ""} onChange={(e) => setEditingModel((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Description (optional)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 placeholder-slate-700 outline-none focus:border-orange-500" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active</span>
                  <button onClick={() => setEditingModel((p) => ({ ...p, isActive: !p?.isActive }))}
                    className={`w-10 h-6 rounded-full transition-all ${editingModel?.isActive ? "bg-emerald-500" : "bg-slate-700"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow mx-1 transition-transform ${editingModel?.isActive ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}