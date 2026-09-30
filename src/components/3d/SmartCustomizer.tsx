"use client";

import React, { Suspense, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Canvas, createPortal } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Decal } from '@react-three/drei';
import * as THREE from 'three';
import {
  Upload,
  Type,
  Palette,
  RotateCw,
  RotateCcw,
  Check,
  Sparkles,
  Image as ImageIcon,
  Trash2,
  Undo2,
  ZoomIn,
  Eye,
  Layers,
  HelpCircle,
  Maximize2,
  Sliders,
  SlidersHorizontal,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Move,
} from 'lucide-react';
import { categorizeModelPart, FormattedPart } from '@/admin/3d-models/utils/partUtils';
import { PartOutline } from '@/admin/3d-models/components/PartOutline';
import { CameraFit, CameraHelperController } from '@/admin/3d-models/components/CameraControllers';

export interface PrintZone {
  id: string;
  label: string;
  materialName?: string;
  meshName?: string;
  type: 'image' | 'text' | 'both';
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  height: number;
  depth?: number;
  rotationZ?: number;
  defaultImageUrl?: string;
  defaultImagePublicId?: string;
  defaultText?: string;
  placeholder?: string;
  fontSize?: number;
  textColor?: string;
  align?: 'left' | 'center' | 'right';
  isBold?: boolean;
  allowCustomColor?: boolean;
  defaultColor?: string;
  hit?: any;
}

export interface Model3DConfig {
  id: string;
  name: string;
  modelUrl: string;
  thumbnailUrl?: string;
  printZones: PrintZone[];
}

export interface LogoTransform {
  scale: number; // 0.3 to 1.6, default 1.0
  widthScale?: number; // 0.4 to 1.6, default 1.0
  heightScale?: number; // 0.4 to 1.6, default 1.0
  lockAspect?: boolean; // default true
  alignX: 'left' | 'center' | 'right'; // default 'center'
  alignY: 'top' | 'center' | 'bottom'; // default 'center'
  offsetX: number; // -50 to 50, default 0
  offsetY: number; // -50 to 50, default 0
  rotation: number; // -180 to 180 in degrees, default 0
}

export const ATHLETIC_COLOR_PRESETS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Jet Black', hex: '#111827' },
  { name: 'Athletic Gold', hex: '#F59E0B' },
  { name: 'Crimson Red', hex: '#EF4444' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Emerald Green', hex: '#10B981' },
  { name: 'Electric Orange', hex: '#FF7348' },
  { name: 'Navy Blue', hex: '#1E3A8A' },
  { name: 'Heather Silver', hex: '#94A3B8' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Hot Pink', hex: '#EC4899' },
  { name: 'Neon Volt', hex: '#84CC16' },
];

export const TEXT_SIZE_OPTIONS = [
  { label: 'Sm', value: 50 },
  { label: 'Md', value: 80 },
  { label: 'Lg', value: 120 },
  { label: 'XL', value: 160 },
];

export function getFriendlyZoneInfo(zone: PrintZone): {
  friendlyTitle: string;
  directionTag: 'FRONT' | 'BACK' | 'LEFT SLEEVE' | 'RIGHT SLEEVE';
  icon: string;
  cameraCommand: 'front' | 'back' | 'left' | 'right';
  badgeType: string;
} {
  const lbl = (zone.label || '').toLowerCase();
  const mesh = (zone.meshName || '').toLowerCase();
  const mat = (zone.materialName || '').toLowerCase();
  const combined = `${lbl} ${mesh} ${mat}`;

  let directionTag: 'FRONT' | 'BACK' | 'LEFT SLEEVE' | 'RIGHT SLEEVE' = 'FRONT';
  let cameraCommand: 'front' | 'back' | 'left' | 'right' = 'front';
  let icon = '👕';

  if (combined.includes('back')) {
    directionTag = 'BACK';
    cameraCommand = 'back';
    icon = '🔄';
  } else if (combined.includes('left') || combined.includes('arm_l') || combined.includes('sleeve_l')) {
    directionTag = 'LEFT SLEEVE';
    cameraCommand = 'left';
    icon = '👈';
  } else if (combined.includes('right') || combined.includes('arm_r') || combined.includes('sleeve_r')) {
    directionTag = 'RIGHT SLEEVE';
    cameraCommand = 'right';
    icon = '👉';
  } else {
    const [x, , z] = zone.position || [0, 0, 0];
    if (Math.abs(z) >= Math.abs(x)) {
      if (z < 0) {
        directionTag = 'BACK';
        cameraCommand = 'back';
        icon = '🔄';
      } else {
        directionTag = 'FRONT';
        cameraCommand = 'front';
        icon = '👕';
      }
    } else {
      if (x < 0) {
        directionTag = 'LEFT SLEEVE';
        cameraCommand = 'left';
        icon = '👈';
      } else {
        directionTag = 'RIGHT SLEEVE';
        cameraCommand = 'right';
        icon = '👉';
      }
    }
  }

  let friendlyTitle = zone.label;
  const isGeneric =
    /^(front|back|right arm|left arm|text\d+).*—\s*zone\s*\d+/i.test(zone.label.trim()) ||
    /^(zone_\d+)/i.test(zone.label.trim()) ||
    zone.label.includes('—');

  if (isGeneric) {
    if (directionTag === 'BACK') {
      if (zone.type === 'text' && (zone.defaultText === '01' || (zone.width && zone.height && zone.height > zone.width))) {
        friendlyTitle = 'Back Player Number';
      } else if (zone.type === 'text') {
        friendlyTitle = 'Back Player Name';
      } else {
        friendlyTitle = 'Back Graphic / Sponsor';
      }
    } else if (directionTag === 'FRONT') {
      if (zone.type === 'image') {
        friendlyTitle = 'Front Team Logo';
      } else if (zone.type === 'text') {
        friendlyTitle = 'Front Team Name';
      } else {
        friendlyTitle = 'Front Crest & Name';
      }
    } else if (directionTag === 'LEFT SLEEVE') {
      friendlyTitle = 'Left Sleeve Patch';
    } else if (directionTag === 'RIGHT SLEEVE') {
      friendlyTitle = 'Right Sleeve Patch';
    }
  }

  const badgeType = zone.type === 'image' ? 'Logo Graphic' : zone.type === 'text' ? 'Player Text' : 'Logo & Text';

  return { friendlyTitle, directionTag, icon, cameraCommand, badgeType };
}

function buildCustomerDecalTexture({
  zone,
  logoImg,
  logoTransform,
  customText,
  customTextColor,
  customFontSize,
  customIsBold,
  customAlign,
  isSelected,
}: {
  zone: PrintZone;
  logoImg: HTMLImageElement | null;
  logoTransform?: LogoTransform;
  customText?: string;
  customTextColor?: string;
  customFontSize?: number;
  customIsBold?: boolean;
  customAlign?: 'left' | 'center' | 'right';
  isSelected: boolean;
}): THREE.CanvasTexture {
  const TEX = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = TEX;
  canvas.height = TEX;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, TEX, TEX);

  const textToDraw = customText !== undefined ? customText : (zone.defaultText || '');
  const textColor = customTextColor || zone.textColor || zone.defaultColor || '#ffffff';
  const fontSize = customFontSize || zone.fontSize || 80;
  const isBold = customIsBold !== undefined ? customIsBold : (zone.isBold !== false);
  const align = customAlign || zone.align || 'center';

  const hasImageZone = zone.type === 'image' || zone.type === 'both';
  const hasTextZone = zone.type === 'text' || zone.type === 'both';

  const transform: LogoTransform = logoTransform || {
    scale: 1,
    widthScale: 1,
    heightScale: 1,
    lockAspect: true,
    alignX: 'center',
    alignY: 'center',
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
  };

  // 1. Draw Logo Graphic with Width, Height, Scale, Alignment & Rotation
  if (hasImageZone) {
    if (logoImg) {
      const aspect = (logoImg.naturalWidth || logoImg.width || 1) / (logoImg.naturalHeight || logoImg.height || 1);
      const baseAreaW = TEX * 0.88;
      const baseAreaH = zone.type === 'both' ? TEX * 0.50 : TEX * 0.88;

      let baseW = baseAreaW;
      let baseH = baseAreaH;
      if (aspect > 1) {
        baseH = baseW / aspect;
      } else {
        baseW = baseH * aspect;
      }

      const wScale = (transform.scale ?? 1) * (transform.widthScale ?? 1);
      const hScale = (transform.scale ?? 1) * (transform.heightScale ?? 1);

      const dw = baseW * wScale;
      const dh = baseH * hScale;

      // Usable bounds inside the decal canvas
      const minX = 40;
      const maxX = TEX - 40 - dw;
      const minY = 40;
      const maxY = zone.type === 'both' ? TEX * 0.54 - dh : TEX - 40 - dh;

      // Base alignment calculation
      let anchorX = (TEX - dw) / 2;
      if (transform.alignX === 'left') {
        anchorX = minX;
      } else if (transform.alignX === 'right') {
        anchorX = Math.max(minX, maxX);
      }

      let anchorY = zone.type === 'both' ? (TEX * 0.52 - dh) / 2 + 20 : (TEX - dh) / 2;
      if (transform.alignY === 'top') {
        anchorY = minY;
      } else if (transform.alignY === 'bottom') {
        anchorY = Math.max(minY, maxY);
      }

      // Add fine offset nudge
      const finalX = anchorX + ((transform.offsetX || 0) / 100) * (TEX * 0.35);
      const finalY = anchorY + ((transform.offsetY || 0) / 100) * (TEX * 0.35);

      ctx.save();
      const centerX = finalX + dw / 2;
      const centerY = finalY + dh / 2;
      ctx.translate(centerX, centerY);
      if (transform.rotation) {
        ctx.rotate((transform.rotation * Math.PI) / 180);
      }
      ctx.drawImage(logoImg, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    } else if (zone.type === 'image' && !textToDraw) {
      // Placeholder with transform awareness
      const wScale = (transform.scale ?? 1) * (transform.widthScale ?? 1);
      const hScale = (transform.scale ?? 1) * (transform.heightScale ?? 1);
      const pw = Math.max(120, (TEX - 120) * wScale);
      const ph = Math.max(100, (TEX - 120) * hScale);

      const px = (TEX - pw) / 2 + ((transform.offsetX || 0) / 100) * (TEX * 0.35);
      const py = (TEX - ph) / 2 + ((transform.offsetY || 0) / 100) * (TEX * 0.35);

      ctx.save();
      ctx.translate(px + pw / 2, py + ph / 2);
      if (transform.rotation) {
        ctx.rotate((transform.rotation * Math.PI) / 180);
      }
      ctx.strokeStyle = isSelected ? '#ff7348' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 10;
      ctx.setLineDash([20, 14]);
      ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);

      ctx.fillStyle = isSelected ? '#ff7348' : 'rgba(255, 255, 255, 0.75)';
      ctx.font = '900 64px "Barlow Condensed", "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+ YOUR LOGO HERE', 0, 0);
      ctx.restore();
    }
  }

  // 2. Draw Text (Player Name, Number, Motto)
  if (hasTextZone && textToDraw.trim()) {
    const weight = isBold ? '900' : '700';
    const computedFontSize = Math.max(36, Math.min(fontSize * 1.8, 280));
    ctx.font = `${weight} ${computedFontSize}px "Barlow Condensed", "Arial Black", Arial, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'middle';
    ctx.textAlign = align as CanvasTextAlign;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 16;

    const tx = align === 'left' ? 44 : align === 'right' ? TEX - 44 : TEX / 2;
    const ty = zone.type === 'both' ? TEX * 0.78 : TEX / 2;
    ctx.fillText(textToDraw, tx, ty, TEX - 88);
    ctx.shadowBlur = 0;
  }

  // 3. Selection Indicator (Glow line + corner targeting brackets)
  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 14;
    ctx.setLineDash([28, 14]);
    ctx.strokeRect(20, 20, TEX - 40, TEX - 40);

    const bLen = 80;
    ctx.setLineDash([]);
    ctx.lineWidth = 22;
    ctx.strokeStyle = '#fb923c';

    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(20, 20 + bLen);
    ctx.lineTo(20, 20);
    ctx.lineTo(20 + bLen, 20);
    ctx.stroke();

    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(TEX - 20 - bLen, 20);
    ctx.lineTo(TEX - 20, 20);
    ctx.lineTo(TEX - 20, 20 + bLen);
    ctx.stroke();

    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(20, TEX - 20 - bLen);
    ctx.lineTo(20, TEX - 20);
    ctx.lineTo(20 + bLen, TEX - 20);
    ctx.stroke();

    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(TEX - 20 - bLen, TEX - 20);
    ctx.lineTo(TEX - 20, TEX - 20);
    ctx.lineTo(TEX - 20, TEX - 20 - bLen);
    ctx.stroke();

    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  tex.needsUpdate = true;
  return tex;
}

function CustomerZoneDecal({
  targetMesh,
  zone,
  logoImg,
  logoTransform,
  customText,
  customTextColor,
  customFontSize,
  customIsBold,
  customAlign,
  isSelected,
  onClick,
}: {
  targetMesh: THREE.Mesh;
  zone: PrintZone;
  logoImg: HTMLImageElement | null;
  logoTransform?: LogoTransform;
  customText?: string;
  customTextColor?: string;
  customFontSize?: number;
  customIsBold?: boolean;
  customAlign?: 'left' | 'center' | 'right';
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(targetMesh);
  meshRef.current = targetMesh;

  const texture = useMemo(
    () =>
      buildCustomerDecalTexture({
        zone,
        logoImg,
        logoTransform,
        customText,
        customTextColor,
        customFontSize,
        customIsBold,
        customAlign,
        isSelected,
      }),
    [zone, logoImg, logoTransform, customText, customTextColor, customFontSize, customIsBold, customAlign, isSelected]
  );

  const depth = zone.depth || Math.max(zone.width, zone.height) * 1.6;

  return (
    <Decal
      mesh={meshRef}
      userData={{ isDecal: true }}
      position={zone.position}
      rotation={zone.rotation}
      scale={[zone.width, zone.height, depth]}
      debug={false}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <meshStandardMaterial
        map={texture}
        transparent
        depthTest
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-12}
        toneMapped={false}
        side={THREE.FrontSide}
        roughness={0.9}
        metalness={0.0}
        envMapIntensity={0.2}
        emissive={isSelected ? new THREE.Color('#f97316') : new THREE.Color('#000000')}
        emissiveIntensity={isSelected ? 0.35 : 0}
      />
    </Decal>
  );
}

function ConfiguredModel({
  url,
  zones,
  adminLogoMap,
  customLogoMap,
  customLogoTransformMap,
  customTextMap,
  customTextColorMap,
  customTextSizeMap,
  customTextBoldMap,
  customTextAlignMap,
  colors,
  activeMaterial,
  activeZoneId,
  onZoneClick,
  onPartClick,
  onMaterialsFound,
}: {
  url: string;
  zones: PrintZone[];
  adminLogoMap: Record<string, HTMLImageElement>;
  customLogoMap: Record<string, HTMLImageElement>;
  customLogoTransformMap: Record<string, LogoTransform>;
  customTextMap: Record<string, string>;
  customTextColorMap: Record<string, string>;
  customTextSizeMap: Record<string, number>;
  customTextBoldMap: Record<string, boolean>;
  customTextAlignMap: Record<string, 'left' | 'center' | 'right'>;
  colors: Record<string, string>;
  activeMaterial: string | null;
  activeZoneId: string | null;
  onZoneClick: (zoneId: string) => void;
  onPartClick: (matName: string, meshName?: string) => void;
  onMaterialsFound: (mats: FormattedPart[]) => void;
}) {
  const { scene: rawScene } = useGLTF(url);

  // Clone GLTF hierarchy cleanly so original isn't mutated
  const scene = useMemo(() => {
    const s = rawScene.clone(true);
    s.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const processMat = (mat: THREE.Material) => {
        const cloned = mat.clone();
        if (cloned instanceof THREE.MeshStandardMaterial) {
          // Authentic athletic fabric finish: matte with soft diffusion, no harsh plastic specular glare
          cloned.roughness = 0.85;
          cloned.metalness = 0.0;
          cloned.envMapIntensity = 0.35;
        }
        return cloned;
      };
      m.material = Array.isArray(m.material)
        ? m.material.map(processMat)
        : processMat(m.material as THREE.Material);
    });
    return s;
  }, [rawScene]);

  // Report unique materials with friendly categorization
  useEffect(() => {
    const seen = new Set<string>();
    const formatted: FormattedPart[] = [];
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.userData?.isDecal) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => {
        const name = (mat?.name || '').trim();
        if (name && !seen.has(name)) {
          seen.add(name);
          let origHex = '#ffffff';
          if (mat instanceof THREE.MeshStandardMaterial && mat.color) {
            origHex = `#${mat.color.getHexString()}`;
          }
          formatted.push(categorizeModelPart(name, origHex, m.name));
        }
      });
    });
    onMaterialsFound(formatted);
  }, [scene, onMaterialsFound]);

  // Apply real-time custom part colors
  useEffect(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.userData?.isDecal) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => {
        if (mat instanceof THREE.MeshStandardMaterial && colors[mat.name]) {
          mat.color.set(colors[mat.name]);
          mat.roughness = 0.85;
          mat.metalness = 0.0;
          mat.envMapIntensity = 0.35;
          mat.needsUpdate = true;
        }
      });
    });
  }, [scene, colors]);

  // Identify active meshes for high-visibility silhouette outline
  const activeMeshes = useMemo(() => {
    if (!activeMaterial) return [];
    const list: THREE.Mesh[] = [];
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.userData?.isDecal) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      if (mats.some((mat) => mat?.name === activeMaterial) || m.name === activeMaterial) {
        list.push(m);
      }
    });
    return list;
  }, [scene, activeMaterial]);

  // Index meshes for decal portals
  const meshLookup = useMemo(() => {
    const byName: Record<string, THREE.Mesh> = {};
    const byMat: Record<string, THREE.Mesh> = {};
    let first: THREE.Mesh | null = null;
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && !o.userData?.isDecal) {
        const m = o as THREE.Mesh;
        if (!first) first = m;
        if (m.name) byName[m.name] = m;
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach((mat) => {
          const name = (mat?.name || '').trim();
          if (name && !byMat[name]) byMat[name] = m;
        });
      }
    });
    return { byName, byMat, first };
  }, [scene]);

  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: any) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleClick = (e: any) => {
    if (pointerDownPos.current) {
      const dist = Math.hypot(e.clientX - pointerDownPos.current.x, e.clientY - pointerDownPos.current.y);
      if (dist > 6) return; // Orbit drag ignored
    }
    const hit = e.intersections?.find((i: any) => i.object?.isMesh && !i.object?.userData?.isDecal);
    if (!hit || !hit.point) return;
    const mesh = hit.object as THREE.Mesh;
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const matName = (mat?.name || mesh.name || '').trim();
    e.stopPropagation();
    onPartClick(matName, mesh.name);
  };

  return (
    <>
      {/* Primary 3D Model with click-to-select support */}
      <primitive
        object={scene}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      />

      {/* Selected part outline */}
      {activeMeshes.map((mesh, idx) => (
        <PartOutline key={mesh.uuid || `mesh-outline-${idx}`} targetMesh={mesh} color="#00e5ff" />
      ))}

      {/* Decals projected into each target mesh */}
      {zones.map((zone, idx) => {
        const targetMesh =
          (zone.meshName ? meshLookup.byName[zone.meshName] : null) ||
          (zone.materialName ? meshLookup.byMat[zone.materialName] : null) ||
          meshLookup.first;

        if (!targetMesh) return null;

        const key = zone.id || `zone-${idx}`;
        const logoImg = customLogoMap[zone.id] ?? adminLogoMap[zone.id] ?? null;
        const logoTransform = customLogoTransformMap[zone.id];
        const customText = customTextMap[zone.id];
        const customTextColor = customTextColorMap[zone.id];
        const customFontSize = customTextSizeMap[zone.id];
        const customIsBold = customTextBoldMap[zone.id];
        const customAlign = customTextAlignMap[zone.id];

        return (
          <React.Fragment key={key}>
            {createPortal(
              <CustomerZoneDecal
                targetMesh={targetMesh}
                zone={zone}
                logoImg={logoImg}
                logoTransform={logoTransform}
                customText={customText}
                customTextColor={customTextColor}
                customFontSize={customFontSize}
                customIsBold={customIsBold}
                customAlign={customAlign}
                isSelected={activeZoneId === zone.id}
                onClick={() => onZoneClick(zone.id)}
              />,
              targetMesh
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

export interface SmartCustomizerProps {
  modelConfig: Model3DConfig;
  onSave?: (data: {
    colors: Record<string, string>;
    zones: Record<
      string,
      {
        type: string;
        customImageUrl?: string;
        customLogoTransform?: LogoTransform;
        customText?: string;
        customTextColor?: string;
        fontSize?: number;
        isBold?: boolean;
        align?: string;
      }
    >;
  }) => void;
  onClose?: () => void;
  className?: string;
}

export function SmartCustomizer({ modelConfig, onSave, onClose, className }: SmartCustomizerProps) {
  const [modelParts, setModelParts] = useState<FormattedPart[]>([]);
  const [colors, setColors] = useState<Record<string, string>>({});
  const [activeMaterial, setActiveMaterial] = useState<string | null>(null);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(
    modelConfig.printZones[0]?.id ?? null
  );
  const [tab, setTab] = useState<'zones' | 'colors'>('zones');
  const [cameraCommand, setCameraCommand] = useState<'front' | 'back' | 'left' | 'right' | 'reset' | null>('front');

  // Preloaded admin default logos
  const [adminLogoMap, setAdminLogoMap] = useState<Record<string, HTMLImageElement>>({});

  // Customer custom uploads & transformations
  const [customLogoMap, setCustomLogoMap] = useState<Record<string, HTMLImageElement>>({});
  const [customLogoTransformMap, setCustomLogoTransformMap] = useState<Record<string, LogoTransform>>({});

  // Customer custom text styling
  const [customTextMap, setCustomTextMap] = useState<Record<string, string>>({});
  const [customTextColorMap, setCustomTextColorMap] = useState<Record<string, string>>({});
  const [customTextSizeMap, setCustomTextSizeMap] = useState<Record<string, number>>({});
  const [customTextBoldMap, setCustomTextBoldMap] = useState<Record<string, boolean>>({});
  const [customTextAlignMap, setCustomTextAlignMap] = useState<Record<string, 'left' | 'center' | 'right'>>({});

  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sceneRootRef = useRef<THREE.Group>(null);

  // Preload admin default images (supports Cloudinary, external URLs, and relative paths)
  useEffect(() => {
    let isMounted = true;
    modelConfig.printZones.forEach((z) => {
      if (z.defaultImageUrl && !z.defaultImageUrl.startsWith('blob:')) {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (isMounted) setAdminLogoMap((prev) => ({ ...prev, [z.id]: img }));
        };
        img.onerror = () => {
          // Fallback without crossOrigin in case host rejects CORS
          const fallback = new window.Image();
          fallback.onload = () => {
            if (isMounted) setAdminLogoMap((prev) => ({ ...prev, [z.id]: fallback }));
          };
          fallback.src = z.defaultImageUrl!;
        };
        img.src = z.defaultImageUrl;
      }
    });
    return () => {
      isMounted = false;
    };
  }, [modelConfig.printZones]);

  // Handle mesh discovery
  const handleMaterialsFound = useCallback((mats: FormattedPart[]) => {
    setModelParts(mats);
    if (!activeMaterial && mats.length > 0) {
      setActiveMaterial(mats[0].rawName);
    }
  }, [activeMaterial]);

  // Zone selection & camera view sync
  const handleZoneSelect = (zoneId: string) => {
    setActiveZoneId(zoneId);
    setActiveMaterial(null);
    setTab('zones');
    const z = modelConfig.printZones.find((x) => x.id === zoneId);
    if (z) {
      const info = getFriendlyZoneInfo(z);
      setCameraCommand(info.cameraCommand);
    }
  };

  // Garment part selection & camera view sync
  const handlePartSelect = (matName: string) => {
    setActiveMaterial(matName);
    setActiveZoneId(null);
    setTab('colors');
    const part = modelParts.find((p) => p.rawName === matName);
    if (part) {
      setCameraCommand(part.cameraCommand);
    }
  };

  // Customer custom logo upload
  const handleCustomerImageUpload = (e: React.ChangeEvent<HTMLInputElement>, zoneId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setCustomLogoMap((prev) => ({ ...prev, [zoneId]: img }));
    };
    img.src = url;
  };

  const handleClearCustomLogo = (zoneId: string) => {
    setCustomLogoMap((prev) => {
      const next = { ...prev };
      delete next[zoneId];
      return next;
    });
  };

  // Logo transform updater
  const updateLogoTransform = (zoneId: string, patch: Partial<LogoTransform>) => {
    setCustomLogoTransformMap((prev) => {
      const current = prev[zoneId] || {
        scale: 1,
        widthScale: 1,
        heightScale: 1,
        lockAspect: true,
        alignX: 'center',
        alignY: 'center',
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
      };
      return {
        ...prev,
        [zoneId]: { ...current, ...patch },
      };
    });
  };

  // Reset logo sizing & positioning
  const resetLogoTransform = (zoneId: string) => {
    setCustomLogoTransformMap((prev) => {
      const next = { ...prev };
      delete next[zoneId];
      return next;
    });
  };

  // Reset all customer customizations back to original default
  const handleResetAll = () => {
    setColors({});
    setCustomLogoMap({});
    setCustomLogoTransformMap({});
    setCustomTextMap({});
    setCustomTextColorMap({});
    setCustomTextSizeMap({});
    setCustomTextBoldMap({});
    setCustomTextAlignMap({});
    setCameraCommand('front');
  };

  const activeZone = modelConfig.printZones.find((z) => z.id === activeZoneId);
  const activePart = modelParts.find((p) => p.rawName === activeMaterial);

  // Count active customizations
  const customizedCount = useMemo(() => {
    let count = 0;
    count += Object.keys(colors).length;
    count += Object.keys(customLogoMap).length;
    count += Object.keys(customLogoTransformMap).length;
    count += Object.values(customTextMap).filter((t) => t.trim().length > 0).length;
    return count;
  }, [colors, customLogoMap, customLogoTransformMap, customTextMap]);

  return (
    <div
      style={{ fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif" }}
      className={`flex flex-col lg:flex-row bg-[#0a0a0f] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative select-none ${
        className || "w-full h-[780px]"
      }`}
    >
      {/* ── 3D Viewport ────────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {/* Sleek Radial Background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 35%, #1f2333 0%, #0d0f14 70%, #07080b 100%)',
          }}
        />

        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 0, 4.2], fov: 45 }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <Environment preset="studio" blur={0.8} environmentIntensity={0.35} />
            <ambientLight intensity={0.9} />
            <directionalLight position={[5, 10, 5]} intensity={1.1} />
            <directionalLight position={[-5, 5, -5]} intensity={0.25} />

            <group ref={sceneRootRef}>
              <ConfiguredModel
                url={modelConfig.modelUrl}
                zones={modelConfig.printZones}
                adminLogoMap={adminLogoMap}
                customLogoMap={customLogoMap}
                customLogoTransformMap={customLogoTransformMap}
                customTextMap={customTextMap}
                customTextColorMap={customTextColorMap}
                customTextSizeMap={customTextSizeMap}
                customTextBoldMap={customTextBoldMap}
                customTextAlignMap={customTextAlignMap}
                colors={colors}
                activeMaterial={activeMaterial}
                activeZoneId={activeZoneId}
                onZoneClick={handleZoneSelect}
                onPartClick={handlePartSelect}
                onMaterialsFound={handleMaterialsFound}
              />
            </group>

            <OrbitControls
              makeDefault
              enablePan={false}
              minDistance={1.0}
              maxDistance={8.0}
            />
            <CameraFit scene={sceneRootRef.current} />
            <CameraHelperController
              scene={sceneRootRef.current}
              command={cameraCommand}
              onHandled={() => setCameraCommand(null)}
            />
          </Suspense>
        </Canvas>

        {/* Top Left Studio Title & Hint */}
        <div className="absolute top-6 left-6 pointer-events-none space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <p className="text-white text-2xl font-black uppercase tracking-[.2em] italic">
              3D Customizer
            </p>
          </div>
          <p className="text-white/50 text-[11px] font-medium tracking-wider">
            Drag to rotate 360° &bull; Click anywhere on shirt to customize
          </p>
        </div>

        {/* Top Right Reset & Close Toolbar */}
        <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
          {customizedCount > 0 && (
            <button
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-black uppercase tracking-wider transition-all"
              title="Reset all customizations"
            >
              <Undo2 className="w-3.5 h-3.5 text-orange-400" />
              <span>Reset Defaults</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors"
              title="Exit Customizer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Floating Quick Camera Angle Switcher (Non-technical friendly) */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-[#0F1116]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">
            View:
          </span>
          {[
            { id: 'front', label: 'Front', icon: '👕' },
            { id: 'back', label: 'Back', icon: '🔄' },
            { id: 'left', label: 'Left Arm', icon: '👈' },
            { id: 'right', label: 'Right Arm', icon: '👉' },
            { id: 'reset', label: 'Center', icon: '🎯' },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setCameraCommand(v.id as any)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/10 active:bg-orange-500/20 active:text-orange-400 transition-all border border-transparent hover:border-white/5"
            >
              <span>{v.icon}</span>
              <span>{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Customizer Control Sidebar ───────────────────────────────────── */}
      <div className="w-full lg:w-[420px] flex flex-col bg-[#111319] border-l border-white/10 z-10 min-h-0">
        {/* Navigation Tabs (Big, clear buttons for non-technical users) */}
        <div className="flex border-b border-white/10 p-2 gap-2 bg-[#0e1015]">
          <button
            onClick={() => setTab('zones')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${tab === 'zones'
                ? 'bg-[#FF7348] text-black shadow-lg shadow-orange-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Graphics & Text ({modelConfig.printZones.length})</span>
          </button>
          <button
            onClick={() => setTab('colors')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${tab === 'colors'
                ? 'bg-[#FF7348] text-black shadow-lg shadow-orange-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
          >
            <Palette className="w-4 h-4" />
            <span>Garment Colors</span>
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-6">
          {/* ══════════ TAB 1: GRAPHICS & TEXT ══════════ */}
          {tab === 'zones' && (
            <>
              {/* Area Selection List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                    Step 1: Choose Area to Personalize
                  </p>
                  <span className="text-[10px] text-orange-400 font-bold uppercase">
                    Auto-focuses 3D view
                  </span>
                </div>

                {modelConfig.printZones.length === 0 ? (
                  <div className="text-center py-10 text-white/30 text-xs uppercase tracking-widest border border-dashed border-white/10 rounded-2xl p-4">
                    No customizable areas configured for this model
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {modelConfig.printZones.map((zone) => {
                      const isSel = activeZoneId === zone.id;
                      const info = getFriendlyZoneInfo(zone);
                      const hasCustomLogo = !!customLogoMap[zone.id];
                      const hasAdminLogo = !!adminLogoMap[zone.id];
                      const hasCustomTxt = !!customTextMap[zone.id]?.trim();
                      const hasAdminTxt = !!zone.defaultText?.trim();

                      return (
                        <button
                          key={zone.id}
                          onClick={() => handleZoneSelect(zone.id)}
                          className={`w-full px-4 py-3 rounded-2xl text-left flex items-center justify-between transition-all border ${isSel
                              ? 'bg-orange-500/15 border-orange-500 text-white shadow-lg shadow-orange-500/10'
                              : 'bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{info.icon}</span>
                            <div>
                              <p className="text-xs font-black uppercase tracking-wider text-white">
                                {info.friendlyTitle}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                                  {info.directionTag}
                                </span>
                                <span className="text-[9px] text-white/40">
                                  &bull; {info.badgeType}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {(hasCustomLogo || hasAdminLogo) && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Logo
                              </span>
                            )}
                            {(hasCustomTxt || hasAdminTxt) && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Text
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Zone Editor */}
              {activeZone && (
                <div className="border-t border-white/10 pt-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#FF7348]" />
                        <p className="text-white text-sm font-black uppercase tracking-wider">
                          Editing {getFriendlyZoneInfo(activeZone).friendlyTitle}
                        </p>
                      </div>
                      <p className="text-white/40 text-[10px] uppercase mt-0.5">
                        Updates in real-time on the 3D model
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const info = getFriendlyZoneInfo(activeZone);
                        setCameraCommand(info.cameraCommand);
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/5"
                      title="Face camera directly to this area"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* ── Logo Customization ── */}
                  {(activeZone.type === 'image' || activeZone.type === 'both') && (
                    <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                      <label className="text-white/60 text-[10px] font-black uppercase tracking-widest flex items-center justify-between">
                        <span>Team Logo / Sponsor Graphic</span>
                        <span className="text-orange-400 font-bold">PNG, JPG, SVG</span>
                      </label>

                      {/* Current Applied Logo Box */}
                      {(customLogoMap[activeZone.id] || adminLogoMap[activeZone.id]) && (
                        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 p-1 flex items-center justify-center overflow-hidden">
                              <img
                                src={
                                  customLogoMap[activeZone.id]?.src ||
                                  adminLogoMap[activeZone.id]?.src
                                }
                                alt="Decal Preview"
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                            <div>
                              <p className="text-white text-xs font-black uppercase">
                                {customLogoMap[activeZone.id]
                                  ? 'Custom Logo Uploaded'
                                  : 'Official Team Graphic'}
                              </p>
                              <p className="text-white/40 text-[9px] uppercase">
                                {customLogoMap[activeZone.id]
                                  ? 'Customized by you'
                                  : 'Configured by Admin'}
                              </p>
                            </div>
                          </div>

                          {customLogoMap[activeZone.id] && (
                            <button
                              onClick={() => handleClearCustomLogo(activeZone.id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
                              title="Revert back to default logo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* File Upload Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => handleCustomerImageUpload(e, activeZone.id)}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/20 hover:border-orange-500/50 rounded-2xl text-xs font-black uppercase tracking-wider text-white transition-all shadow-sm"
                      >
                        <Upload className="w-4 h-4 text-[#FF7348]" />
                        <span>
                          {customLogoMap[activeZone.id]
                            ? 'Change Uploaded Logo'
                            : 'Upload Your Custom Logo'}
                        </span>
                      </button>

                      {/* ── Logo Size, Scale, Height, Width & Alignment ── */}
                      <div className="space-y-4 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF7348]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                              Logo Dimensions & Alignment
                            </span>
                          </div>
                          {customLogoTransformMap[activeZone.id] && (
                            <button
                              type="button"
                              onClick={() => resetLogoTransform(activeZone.id)}
                              className="text-[9px] text-orange-400 font-bold uppercase hover:underline"
                            >
                              Reset Sizing
                            </button>
                          )}
                        </div>

                        {/* Quick Scale Presets */}
                        <div className="space-y-1.5">
                          <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest block">
                            Size Presets
                          </span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[
                              { label: 'Compact', scale: 0.75 },
                              { label: 'Normal', scale: 1.0 },
                              { label: 'Large', scale: 1.25 },
                              { label: 'Hero', scale: 1.5 },
                            ].map((preset) => {
                              const curScale = customLogoTransformMap[activeZone.id]?.scale ?? 1.0;
                              const isMatch = Math.abs(curScale - preset.scale) < 0.05;
                              return (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => updateLogoTransform(activeZone.id, { scale: preset.scale })}
                                  className={`py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${isMatch
                                      ? 'bg-[#FF7348] text-black border-[#FF7348] shadow-sm'
                                      : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                  {preset.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Width and Height Sliders */}
                        <div className="space-y-3 p-3 bg-black/40 rounded-2xl border border-white/5">
                          {/* Overall Scale Slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-white/60 font-bold uppercase tracking-wider">Overall Size:</span>
                              <span className="text-orange-400 font-mono font-black">
                                {Math.round((customLogoTransformMap[activeZone.id]?.scale ?? 1.0) * 100)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.3"
                              max="1.6"
                              step="0.02"
                              value={customLogoTransformMap[activeZone.id]?.scale ?? 1.0}
                              onChange={(e) => updateLogoTransform(activeZone.id, { scale: parseFloat(e.target.value) })}
                              className="w-full accent-[#FF7348] cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                            />
                          </div>

                          {/* Proportional Lock / Unlock Toggle */}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">
                              Independent Width & Height
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const curLock = customLogoTransformMap[activeZone.id]?.lockAspect ?? true;
                                updateLogoTransform(activeZone.id, { lockAspect: !curLock });
                              }}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${(customLogoTransformMap[activeZone.id]?.lockAspect ?? true)
                                  ? 'bg-white/10 text-white/70 border-white/10'
                                  : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                                }`}
                            >
                              {(customLogoTransformMap[activeZone.id]?.lockAspect ?? true) ? (
                                <>
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>Locked Ratio</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-2.5 h-2.5" />
                                  <span>Free Stretch</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Width Slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-white/50 font-bold uppercase">Width:</span>
                              <span className="text-white/70 font-mono">
                                {Math.round((customLogoTransformMap[activeZone.id]?.widthScale ?? 1.0) * 100)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.4"
                              max="1.6"
                              step="0.02"
                              value={customLogoTransformMap[activeZone.id]?.widthScale ?? 1.0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                const isLocked = customLogoTransformMap[activeZone.id]?.lockAspect ?? true;
                                if (isLocked) {
                                  updateLogoTransform(activeZone.id, { widthScale: val, heightScale: val });
                                } else {
                                  updateLogoTransform(activeZone.id, { widthScale: val });
                                }
                              }}
                              className="w-full accent-[#FF7348] cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                            />
                          </div>

                          {/* Height Slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-white/50 font-bold uppercase">Height:</span>
                              <span className="text-white/70 font-mono">
                                {Math.round((customLogoTransformMap[activeZone.id]?.heightScale ?? 1.0) * 100)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.4"
                              max="1.6"
                              step="0.02"
                              value={customLogoTransformMap[activeZone.id]?.heightScale ?? 1.0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                const isLocked = customLogoTransformMap[activeZone.id]?.lockAspect ?? true;
                                if (isLocked) {
                                  updateLogoTransform(activeZone.id, { widthScale: val, heightScale: val });
                                } else {
                                  updateLogoTransform(activeZone.id, { heightScale: val });
                                }
                              }}
                              className="w-full accent-[#FF7348] cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                            />
                          </div>
                        </div>

                        {/* Horizontal & Vertical Alignment Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* Horizontal Alignment */}
                          <div className="space-y-1.5">
                            <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest block">
                              Horizontal Align
                            </span>
                            <div className="flex rounded-xl bg-black/40 p-1 border border-white/10">
                              {(['left', 'center', 'right'] as const).map((a) => (
                                <button
                                  key={a}
                                  type="button"
                                  onClick={() => updateLogoTransform(activeZone.id, { alignX: a, offsetX: 0 })}
                                  className={`flex-1 py-1 rounded-lg flex items-center justify-center transition-all ${(customLogoTransformMap[activeZone.id]?.alignX ?? 'center') === a
                                      ? 'bg-[#FF7348] text-black shadow-sm'
                                      : 'text-white/40 hover:text-white'
                                    }`}
                                  title={`Align ${a}`}
                                >
                                  {a === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                                  {a === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                                  {a === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Vertical Alignment */}
                          <div className="space-y-1.5">
                            <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest block">
                              Vertical Align
                            </span>
                            <div className="flex rounded-xl bg-black/40 p-1 border border-white/10">
                              {[
                                { id: 'top', label: 'Top', icon: ArrowUp },
                                { id: 'center', label: 'Mid', icon: AlignCenter },
                                { id: 'bottom', label: 'Bot', icon: ArrowDown },
                              ].map((v) => {
                                const Icon = v.icon;
                                return (
                                  <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => updateLogoTransform(activeZone.id, { alignY: v.id as any, offsetY: 0 })}
                                    className={`flex-1 py-1 rounded-lg flex items-center justify-center text-[10px] font-black uppercase transition-all ${(customLogoTransformMap[activeZone.id]?.alignY ?? 'center') === v.id
                                        ? 'bg-[#FF7348] text-black shadow-sm'
                                        : 'text-white/40 hover:text-white'
                                      }`}
                                    title={`Align ${v.label}`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Position Nudge Sliders (Fine adjustment) */}
                        <div className="space-y-2 p-3 bg-black/40 rounded-2xl border border-white/5">
                          <div className="flex justify-between items-center text-[9px] font-bold uppercase text-white/40">
                            <span>Fine Position Nudge</span>
                            <span>
                              X: {customLogoTransformMap[activeZone.id]?.offsetX ?? 0}%, Y:{' '}
                              {customLogoTransformMap[activeZone.id]?.offsetY ?? 0}%
                            </span>
                          </div>

                          {/* X Nudge */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] text-white/50">
                              <span>&larr; Left</span>
                              <span>Center</span>
                              <span>Right &rarr;</span>
                            </div>
                            <input
                              type="range"
                              min="-50"
                              max="50"
                              step="1"
                              value={customLogoTransformMap[activeZone.id]?.offsetX ?? 0}
                              onChange={(e) => updateLogoTransform(activeZone.id, { offsetX: parseInt(e.target.value) })}
                              className="w-full accent-[#FF7348] cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                            />
                          </div>

                          {/* Y Nudge */}
                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between text-[9px] text-white/50">
                              <span>&uarr; Up</span>
                              <span>Center</span>
                              <span>Down &darr;</span>
                            </div>
                            <input
                              type="range"
                              min="-50"
                              max="50"
                              step="1"
                              value={customLogoTransformMap[activeZone.id]?.offsetY ?? 0}
                              onChange={(e) => updateLogoTransform(activeZone.id, { offsetY: parseInt(e.target.value) })}
                              className="w-full accent-[#FF7348] cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                            />
                          </div>
                        </div>

                        {/* Rotation / Angle Controls */}
                        <div className="space-y-2 p-3 bg-black/40 rounded-2xl border border-white/5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-white/50 font-bold uppercase flex items-center gap-1">
                              <RotateCw className="w-3 h-3 text-[#FF7348]" /> Logo Rotation:
                            </span>
                            <span className="text-white/70 font-mono font-black">
                              {customLogoTransformMap[activeZone.id]?.rotation ?? 0}&deg;
                            </span>
                          </div>

                          <input
                            type="range"
                            min="-180"
                            max="180"
                            step="1"
                            value={customLogoTransformMap[activeZone.id]?.rotation ?? 0}
                            onChange={(e) => updateLogoTransform(activeZone.id, { rotation: parseInt(e.target.value) })}
                            className="w-full accent-[#FF7348] cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                          />

                          <div className="flex items-center justify-between gap-1 pt-1">
                            {[-45, 0, 45, 90].map((deg) => (
                              <button
                                key={deg}
                                type="button"
                                onClick={() => updateLogoTransform(activeZone.id, { rotation: deg })}
                                className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${(customLogoTransformMap[activeZone.id]?.rotation ?? 0) === deg
                                    ? 'bg-[#FF7348] text-black shadow-sm'
                                    : 'bg-white/5 text-white/40 hover:text-white'
                                  }`}
                              >
                                {deg}&deg;
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Text Customization ── */}
                  {(activeZone.type === 'text' || activeZone.type === 'both') && (
                    <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center justify-between">
                        <label className="text-white/60 text-[10px] font-black uppercase tracking-widest">
                          Custom Name / Number / Text
                        </label>
                        {customTextMap[activeZone.id] && (
                          <button
                            onClick={() =>
                              setCustomTextMap((p) => {
                                const n = { ...p };
                                delete n[activeZone.id];
                                return n;
                              })
                            }
                            className="text-[9px] text-orange-400 font-bold uppercase hover:underline"
                          >
                            Reset Text
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        maxLength={25}
                        placeholder={activeZone.defaultText || 'Type your text...'}
                        value={customTextMap[activeZone.id] ?? ''}
                        onChange={(e) =>
                          setCustomTextMap((prev) => ({
                            ...prev,
                            [activeZone.id]: e.target.value.toUpperCase(),
                          }))
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm font-black uppercase text-white placeholder-white/25 focus:outline-none focus:border-orange-500 shadow-inner"
                      />

                      {/* Text Style Controls (Size, Bold, Alignment) */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {/* Alignment */}
                        <div className="space-y-1.5">
                          <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest block">
                            Alignment
                          </span>
                          <div className="flex rounded-xl bg-black/40 p-1 border border-white/10">
                            {(['left', 'center', 'right'] as const).map((a) => (
                              <button
                                key={a}
                                type="button"
                                onClick={() =>
                                  setCustomTextAlignMap((p) => ({ ...p, [activeZone.id]: a }))
                                }
                                className={`flex-1 py-1 rounded-lg flex items-center justify-center transition-all ${(customTextAlignMap[activeZone.id] || activeZone.align || 'center') === a
                                    ? 'bg-[#FF7348] text-black shadow-sm'
                                    : 'text-white/40 hover:text-white'
                                  }`}
                              >
                                {a === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                                {a === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                                {a === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Font Size Preset */}
                        <div className="space-y-1.5">
                          <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest block">
                            Font Scale
                          </span>
                          <div className="flex rounded-xl bg-black/40 p-1 border border-white/10">
                            {TEXT_SIZE_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() =>
                                  setCustomTextSizeMap((p) => ({
                                    ...p,
                                    [activeZone.id]: opt.value,
                                  }))
                                }
                                className={`flex-1 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${(customTextSizeMap[activeZone.id] || activeZone.fontSize || 80) ===
                                    opt.value
                                    ? 'bg-[#FF7348] text-black shadow-sm'
                                    : 'text-white/40 hover:text-white'
                                  }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Text Color Picker */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                            Text Color
                          </span>
                          <span className="text-white/60 text-[10px] font-mono uppercase">
                            {customTextColorMap[activeZone.id] ||
                              activeZone.textColor ||
                              '#FFFFFF'}
                          </span>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {ATHLETIC_COLOR_PRESETS.map((c) => {
                            const curColor =
                              customTextColorMap[activeZone.id] ||
                              activeZone.textColor ||
                              '#FFFFFF';
                            const isSelected = curColor.toLowerCase() === c.hex.toLowerCase();
                            return (
                              <button
                                key={c.hex}
                                type="button"
                                onClick={() =>
                                  setCustomTextColorMap((prev) => ({
                                    ...prev,
                                    [activeZone.id]: c.hex,
                                  }))
                                }
                                className={`aspect-square rounded-xl transition-all border-2 ${isSelected
                                    ? 'border-white scale-110 shadow-lg'
                                    : 'border-transparent hover:scale-105'
                                  }`}
                                style={{ backgroundColor: c.hex }}
                                title={c.name}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ══════════ TAB 2: GARMENT COLORS ══════════ */}
          {tab === 'colors' && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                    Step 1: Select Garment Part
                  </p>
                  <span className="text-[10px] text-orange-400 font-bold uppercase">
                    Auto-highlights section
                  </span>
                </div>

                {modelParts.length === 0 ? (
                  <p className="text-white/20 text-xs italic">Loading model materials...</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {modelParts.map((part) => {
                      const isSel = activeMaterial === part.rawName;
                      const currentColor = colors[part.rawName] ?? part.originalColor;

                      return (
                        <button
                          key={part.id}
                          onClick={() => handlePartSelect(part.rawName)}
                          className={`px-3.5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-left flex items-center justify-between transition-all border ${isSel
                              ? 'bg-orange-500/15 border-orange-500 text-white shadow-lg shadow-orange-500/10'
                              : 'bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-base">{part.icon}</span>
                            <span className="truncate">{part.label}</span>
                          </div>
                          <span
                            className="w-4 h-4 rounded-full border border-white/20 shrink-0 shadow-sm"
                            style={{ backgroundColor: currentColor }}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Part Color Palette */}
              {activeMaterial && (
                <div className="border-t border-white/10 pt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-black uppercase tracking-wider">
                        Color for {activePart?.label || activeMaterial.replace(/_/g, ' ')}
                      </p>
                      <p className="text-white/40 text-[10px] uppercase">
                        Select an official team shade or pick custom
                      </p>
                    </div>
                    <span className="text-white/60 text-xs font-mono uppercase">
                      {colors[activeMaterial] ?? activePart?.originalColor ?? '#FFFFFF'}
                    </span>
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {ATHLETIC_COLOR_PRESETS.map((c) => {
                      const activeCol =
                        colors[activeMaterial] ?? activePart?.originalColor ?? '#FFFFFF';
                      const isSelected = activeCol.toLowerCase() === c.hex.toLowerCase();
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setColors((p) => ({ ...p, [activeMaterial]: c.hex }))}
                          className={`aspect-square rounded-xl transition-all border-2 ${isSelected
                              ? 'border-white scale-110 shadow-lg'
                              : 'border-transparent hover:scale-105'
                            }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      );
                    })}
                  </div>

                  {/* Custom Hex Color Input */}
                  <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <input
                      type="color"
                      value={colors[activeMaterial] ?? activePart?.originalColor ?? '#CCCCCC'}
                      onChange={(e) =>
                        setColors((p) => ({ ...p, [activeMaterial]: e.target.value }))
                      }
                      className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border border-white/10 p-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black uppercase text-white">Custom Color Picker</p>
                      <p className="text-[10px] text-white/40">Select exact pantone or team hex</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Customizer Footer / Save Action ──────────────────────────────── */}
        <div className="p-5 border-t border-white/10 bg-[#0e1015] space-y-3 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50 font-bold uppercase tracking-wider">
              Modifications:
            </span>
            <span className="text-orange-400 font-black uppercase tracking-wider">
              {customizedCount} changes applied
            </span>
          </div>

          <button
            onClick={() => {
              setSavedSuccess(true);
              setTimeout(() => setSavedSuccess(false), 3000);
              onSave?.({
                colors,
                zones: Object.fromEntries(
                  modelConfig.printZones.map((z) => [
                    z.id,
                    {
                      type: z.type,
                      customImageUrl: customLogoMap[z.id]?.src || z.defaultImageUrl,
                      customLogoTransform: customLogoTransformMap[z.id] || {
                        scale: 1,
                        widthScale: 1,
                        heightScale: 1,
                        lockAspect: true,
                        alignX: 'center',
                        alignY: 'center',
                        offsetX: 0,
                        offsetY: 0,
                        rotation: 0,
                      },
                      customText: customTextMap[z.id] || z.defaultText,
                      customTextColor: customTextColorMap[z.id] || z.textColor,
                      fontSize: customTextSizeMap[z.id] || z.fontSize,
                      isBold: customTextBoldMap[z.id] ?? z.isBold,
                      align: customTextAlignMap[z.id] || z.align,
                    },
                  ])
                ),
              });
            }}
            className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-[#FF7348] to-[#ff8c69] hover:from-[#ff8660] hover:to-[#ffa082] text-black shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-black" />
                <span>Customization Saved!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-black" />
                <span>Apply & Save Customization</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
