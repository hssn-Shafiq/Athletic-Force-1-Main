"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, createPortal, useThree } from '@react-three/fiber';
import { Decal, Environment, Loader, OrbitControls, useCursor, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Image as ImageIcon,
  Lock,
  Maximize2,
  Palette,
  RotateCw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Undo2,
  Unlock,
  Upload,
} from 'lucide-react';
import { categorizeModelPart, FormattedPart } from '@/admin/3d-models/utils/partUtils';
import { PartOutline } from '@/admin/3d-models/components/PartOutline';
import { CameraFit, CameraHelperController } from '@/admin/3d-models/components/CameraControllers';
import { isPlaceholderMesh } from '@/admin/3d-models/utils/decalUtils';
import { FONT_FAMILY_PRESETS } from '@/admin/3d-models/types';

/* ════════════════════════════════════════════════════════════════════════════
   Types (public API is unchanged, plus ZoneEdits / customImageFile in onSave)
   ════════════════════════════════════════════════════════════════════════════ */

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
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
  isBold?: boolean;
  allowCustomColor?: boolean;
  defaultColor?: string;
  zoneRole?: string;
  maxCharacters?: number;
  allowedInputType?: 'text' | 'numeric' | 'alphanumeric';
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
  scale: number; // 0.3 – 1.6, default 1
  widthScale?: number; // 0.4 – 1.6, default 1
  heightScale?: number; // 0.4 – 1.6, default 1
  lockAspect?: boolean; // default true
  alignX: 'left' | 'center' | 'right';
  alignY: 'top' | 'center' | 'bottom';
  offsetX: number; // -50 – 50
  offsetY: number; // -50 – 50
  rotation: number; // -180 – 180 degrees
}

type TextAlign = 'left' | 'center' | 'right';
type CameraCommand = 'front' | 'back' | 'left' | 'right' | 'reset';

/** Everything the customer changed for ONE zone. `undefined` = "use the admin default". */
export interface ZoneEdits {
  logo?: HTMLImageElement;
  logoFile?: File;
  transform?: LogoTransform;
  text?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
  align?: TextAlign;
}
type EditsMap = Record<string, ZoneEdits>;

/* ════════════════════════════════════════════════════════════════════════════
   Constants
   ════════════════════════════════════════════════════════════════════════════ */

export const ATHLETIC_COLOR_PRESETS = [
  { name: 'Cardinal Red', hex: '#97233f' },
  { name: 'Yellow', hex: '#ffb612' },
  { name: 'Red', hex: '#a71930' },
  { name: 'Silver', hex: '#a5acaf' },
  { name: 'Purple', hex: '#1e1656' },
  { name: 'Metalic Gold', hex: '#9e7c0c' },
  { name: 'Royal Blue', hex: '#00338d' },
  { name: 'Process Blue', hex: '#0085ca' },
  { name: 'Orange', hex: '#e64100' },
  { name: 'Navy Blue', hex: '#0b162a' },
  { name: 'Brown', hex: '#311D00' },
  { name: 'Honolulu Blue', hex: '#0076b6' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Silver', hex: '#b0b7bc' },
  { name: 'Black', hex: '#000000' },
  { name: 'Dark Green', hex: '#203731' },
  { name: 'Deep Blue', hex: '#03202f' },
  { name: 'Teal', hex: '#006778' },
  { name: 'Gold', hex: '#9f792c' },
  { name: 'Light Gold', hex: '#d7a22a' },
  { name: 'Red', hex: '#e31837' },
  { name: 'Powder Blue', hex: '#0073cf' },
  { name: 'Yellow', hex: '#ffd100' },
  { name: 'Orange', hex: '#ff8200' },
  { name: 'Lite Orange', hex: '#ffa300' },
  { name: 'Orng', hex: '#fc4c02' },
  { name: 'Aqua', hex: '#008e97' },
  { name: 'Marine Blue', hex: '#005778' },
  { name: 'Old Gold', hex: '#d3bc8d' },
  { name: 'Legacy Green', hex: '#115740' },
  { name: 'Midnight Green', hex: '#004c54' },
  { name: 'Gold', hex: '#b3995d' },
  { name: 'Red', hex: '#aa0000' },
  { name: 'Action Green', hex: '#69be28' },
  { name: 'Titans Red', hex: '#c8102E' },
  { name: 'Titans Blue', hex: '#4b92db' },
  { name: 'Burgundy', hex: '#5a1414' },
  { name: 'Forest Green', hex: '#154406' },
];

export const TEXT_SIZE_OPTIONS = [
  { label: 'Sm', value: 50 },
  { label: 'Md', value: 80 },
  { label: 'Lg', value: 120 },
  { label: 'XL', value: 160 },
];

const TEX = 1024; // decal texture resolution
const FONT_FAMILY = '"Barlow Condensed", "Arial Black", Arial, sans-serif';
const ACCENT = '#FF7348';
const MAX_LOGO_BYTES = 8 * 1024 * 1024;
const ACCEPTED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

/**
 * Render only when something changes (drag, slider, texture update) instead of 60 fps forever.
 * Big battery / GPU win for a product viewer. If your CameraHelperController animates the camera
 * inside useFrame without calling invalidate(), set this to false (or add invalidate() there).
 */
const RENDER_ON_DEMAND = true;

const DEFAULT_TRANSFORM: LogoTransform = {
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

const VIEW_BUTTONS: { id: CameraCommand; label: string; icon: string }[] = [
  { id: 'front', label: 'Front', icon: '👕' },
  { id: 'back', label: 'Back', icon: '🔄' },
  { id: 'left', label: 'Left arm', icon: '👈' },
  { id: 'right', label: 'Right arm', icon: '👉' },
  { id: 'reset', label: 'Center', icon: '🎯' },
];

/* Shared class strings keep the JSX readable */
const cardCls = 'space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5';
const labelCls = 'text-white/50 text-xs font-bold tracking-wide';
const focusCls =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400';

const toArray = <T,>(v: T | T[]): T[] => (Array.isArray(v) ? v : [v]);

/* ════════════════════════════════════════════════════════════════════════════
   Zone helpers
   ════════════════════════════════════════════════════════════════════════════ */

type Direction = 'FRONT' | 'BACK' | 'LEFT SLEEVE' | 'RIGHT SLEEVE';

const DIRECTION_META: Record<Direction, { camera: 'front' | 'back' | 'left' | 'right'; icon: string }> = {
  FRONT: { camera: 'front', icon: '👕' },
  BACK: { camera: 'back', icon: '🔄' },
  'LEFT SLEEVE': { camera: 'left', icon: '👈' },
  'RIGHT SLEEVE': { camera: 'right', icon: '👉' },
};

function detectDirection(zone: PrintZone): Direction {
  const combined = `${zone.label || ''} ${zone.meshName || ''} ${zone.materialName || ''}`.toLowerCase();

  if (combined.includes('back')) return 'BACK';
  if (/left|arm_l|sleeve_l/.test(combined)) return 'LEFT SLEEVE';
  if (/right|arm_r|sleeve_r/.test(combined)) return 'RIGHT SLEEVE';

  // Fall back to the zone's position on the model
  const [x = 0, , z = 0] = zone.position ?? [0, 0, 0];
  if (Math.abs(z) >= Math.abs(x)) return z < 0 ? 'BACK' : 'FRONT';
  return x < 0 ? 'LEFT SLEEVE' : 'RIGHT SLEEVE';
}

function friendlyTitleFor(zone: PrintZone, dir: Direction): string {
  const label = (zone.label || '').trim();
  const isGeneric =
    /^(front|back|right arm|left arm|text\d+).*—\s*zone\s*\d+/i.test(label) ||
    /^(zone_\d+)/i.test(label) ||
    label.includes('—');
  if (!isGeneric) return zone.label;

  switch (dir) {
    case 'BACK':
      if (zone.type === 'text') {
        const isNumber = zone.defaultText === '01' || (zone.width && zone.height && zone.height > zone.width);
        return isNumber ? 'Back Player Number' : 'Back Player Name';
      }
      return 'Back Graphic / Sponsor';
    case 'FRONT':
      if (zone.type === 'image') return 'Front Team Logo';
      if (zone.type === 'text') return 'Front Team Name';
      return 'Front Crest & Name';
    case 'LEFT SLEEVE':
      return 'Left Sleeve Patch';
    case 'RIGHT SLEEVE':
      return 'Right Sleeve Patch';
  }
}

export function getFriendlyZoneInfo(zone: PrintZone): {
  friendlyTitle: string;
  directionTag: Direction;
  icon: string;
  cameraCommand: 'front' | 'back' | 'left' | 'right';
  badgeType: string;
} {
  const directionTag = detectDirection(zone);
  const { camera, icon } = DIRECTION_META[directionTag];
  const badgeType = zone.type === 'image' ? 'Logo Graphic' : zone.type === 'text' ? 'Player Text' : 'Logo & Text';
  return { friendlyTitle: friendlyTitleFor(zone, directionTag), directionTag, icon, cameraCommand: camera, badgeType };
}

/** One place that decides which text style wins (customer edit → zone default → fallback). */
function resolveTextStyle(zone: PrintZone, e?: ZoneEdits) {
  return {
    text: e?.text !== undefined ? e.text : zone.defaultText ?? '',
    color: e?.textColor || zone.textColor || zone.defaultColor || '#FFFFFF',
    fontSize: e?.fontSize || zone.fontSize || 80,
    bold: e?.bold ?? (zone.isBold !== false),
    align: (e?.align || zone.align || 'center') as TextAlign,
    fontFamily: e?.fontFamily || zone.fontFamily || "'Bebas Neue', 'Impact', sans-serif",
  };
}

function isZoneEdited(e?: ZoneEdits) {
  return !!e && Object.values(e).some((v) => v !== undefined);
}

function revokeLogoUrl(e?: ZoneEdits) {
  const src = e?.logo?.src;
  if (src?.startsWith('blob:')) URL.revokeObjectURL(src);
}

/* ════════════════════════════════════════════════════════════════════════════
   Canvas drawing (pure function — draws into an existing canvas, no allocations)
   ════════════════════════════════════════════════════════════════════════════ */

interface DrawArgs {
  zone: PrintZone;
  logoImg: HTMLImageElement | null;
  transform: LogoTransform;
  style: ReturnType<typeof resolveTextStyle>;
  isSelected: boolean;
}

function drawDecal(ctx: CanvasRenderingContext2D, { zone, logoImg, transform: t, style, isSelected }: DrawArgs) {
  ctx.save();
  ctx.clearRect(0, 0, TEX, TEX);

  const hasImageZone = zone.type === 'image' || zone.type === 'both';
  const hasTextZone = zone.type === 'text' || zone.type === 'both';
  const isBoth = zone.type === 'both';

  const wScale = (t.scale ?? 1) * (t.widthScale ?? 1);
  const hScale = (t.scale ?? 1) * (t.heightScale ?? 1);
  const nudgeX = ((t.offsetX || 0) / 100) * (TEX * 0.35);
  const nudgeY = ((t.offsetY || 0) / 100) * (TEX * 0.35);

  let contentBox = {
    x: Math.round(TEX * 0.25),
    y: Math.round(TEX * 0.35),
    w: Math.round(TEX * 0.5),
    h: Math.round(TEX * 0.3),
  };

  // 1 ─ Logo
  if (hasImageZone) {
    if (logoImg) {
      const pad = 24;
      const availW = TEX - 2 * pad;
      const availH = isBoth ? Math.round(TEX * 0.52 - pad) : (TEX - 2 * pad);

      const imgW = logoImg.naturalWidth || logoImg.width || 1;
      const imgH = logoImg.naturalHeight || logoImg.height || 1;
      const imgAspect = imgW / imgH;

      let dh = Math.round(availH * hScale);
      let dw = Math.min(Math.round(availW * wScale), Math.round(dh * imgAspect));

      const minX = pad;
      const maxX = TEX - pad - dw;
      const minY = pad;
      const maxY = isBoth ? Math.round(TEX * 0.54 - dh) : TEX - pad - dh;

      let anchorX = (TEX - dw) / 2;
      if (t.alignX === 'left') anchorX = minX;
      else if (t.alignX === 'right') anchorX = Math.max(minX, maxX);

      let anchorY = isBoth ? (Math.round(TEX * 0.52 - dh) / 2 + pad) : (TEX - dh) / 2;
      if (t.alignY === 'top') anchorY = minY;
      else if (t.alignY === 'bottom') anchorY = Math.max(minY, maxY);

      ctx.save();
      ctx.translate(anchorX + nudgeX + dw / 2, anchorY + nudgeY + dh / 2);
      if (t.rotation) ctx.rotate((t.rotation * Math.PI) / 180);
      ctx.drawImage(logoImg, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();

      contentBox = {
        x: Math.max(14, Math.round(anchorX + nudgeX - 10)),
        y: Math.max(14, Math.round(anchorY + nudgeY - 10)),
        w: Math.min(TEX - 28, Math.round(dw + 20)),
        h: Math.min(TEX - 28, Math.round(dh + 20)),
      };
    } else if (zone.type === 'image' && !style.text) {
      // Empty-state placeholder
      const pad = 24;
      const pw = Math.max(120, (TEX - 2 * pad) * wScale);
      const ph = Math.max(100, (TEX - 2 * pad) * hScale);
      ctx.save();
      ctx.translate(TEX / 2 + nudgeX, TEX / 2 + nudgeY);
      if (t.rotation) ctx.rotate((t.rotation * Math.PI) / 180);
      ctx.strokeStyle = isSelected ? ACCENT : 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 10;
      ctx.setLineDash([20, 14]);
      ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
      ctx.fillStyle = isSelected ? ACCENT : 'rgba(255,255,255,0.75)';
      ctx.font = `900 64px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+ YOUR LOGO HERE', 0, 0);
      ctx.restore();

      contentBox = {
        x: Math.max(14, Math.round(TEX / 2 + nudgeX - pw / 2 - 8)),
        y: Math.max(14, Math.round(TEX / 2 + nudgeY - ph / 2 - 8)),
        w: Math.min(TEX - 28, Math.round(pw + 16)),
        h: Math.min(TEX - 28, Math.round(ph + 16)),
      };
    }
  }

  // 2 ─ Text
  if (hasTextZone) {
    const text = style.text.trim();
    const weight = style.bold ? '900' : '700';
    const fontFam = style.fontFamily || FONT_FAMILY;

    const padX = 28;
    const padY = 24;
    const availW = TEX - 2 * padX;
    const availH = isBoth ? Math.round(TEX * 0.44 - padY) : (TEX - 2 * padY);
    const startY = isBoth ? Math.round(TEX * 0.52 + padY) : padY;

    // Normal clean padding inside the rectangle (4% horizontal, 6% vertical margin)
    const innerMarginX = Math.round(availW * 0.04);
    const innerMarginY = Math.round(availH * 0.06);
    const innerW = availW - 2 * innerMarginX;
    const innerH = availH - 2 * innerMarginY;

    const userScale = Math.max(0.4, Math.min(1.6, (style.fontSize || 80) / 80));
    const targetW = innerW * userScale * (wScale || 1);
    const targetH = innerH * userScale * (hScale || 1);

    const textToMeasure = text || zone.defaultText?.trim() || 'PLAYER NAME';
    const refFontSize = 100;
    ctx.font = `${weight} ${refFontSize}px ${fontFam}`;
    const metrics = ctx.measureText(textToMeasure);
    const glyphAscent = metrics.actualBoundingBoxAscent || 75;
    const glyphDescent = metrics.actualBoundingBoxDescent || 15;
    const glyphH = Math.max(10, glyphAscent + glyphDescent);
    const glyphW = Math.max(10, metrics.width || 100);

    // Target scale to fill the height of the rectangle
    const fitScaleY = targetH / glyphH;
    // Target scale to fill the width of the rectangle
    const fitScaleX = targetW / glyphW;

    let scaleX: number;
    let scaleY: number;

    const naturalWidthAtHeight = glyphW * fitScaleY;
    if (naturalWidthAtHeight <= targetW) {
      scaleY = fitScaleY;
      scaleX = fitScaleY * (wScale / hScale > 1.05 || wScale / hScale < 0.95 ? (wScale / hScale) : 1);
    } else {
      scaleX = fitScaleX;
      scaleY = Math.min(fitScaleY, Math.max(fitScaleX, fitScaleY * 0.95));
    }

    const actualTextW = Math.round(glyphW * scaleX);
    const actualTextH = Math.round(glyphH * scaleY);

    const centerX = padX + availW / 2;
    const centerY = startY + availH / 2;
    const targetX =
      style.align === 'left'  ? padX + innerMarginX + actualTextW / 2 :
      style.align === 'right' ? padX + availW - innerMarginX - actualTextW / 2 :
      centerX;

    if (text) {
      ctx.save();
      ctx.translate(targetX, centerY);
      ctx.scale(scaleX, scaleY);

      ctx.font = `${weight} ${refFontSize}px ${fontFam}`;
      ctx.fillStyle = style.color;
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'center';

      const opticalBaselineY = (glyphAscent - glyphDescent) / 2;
      ctx.fillText(text, 0, opticalBaselineY);
      ctx.restore();
    } else if (isSelected && !hasImageZone) {
      ctx.save();
      ctx.fillStyle = ACCENT;
      ctx.font = `700 ${Math.max(20, Math.min(52, Math.round(actualTextH * 0.42)))}px ${fontFam}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+ ENTER TEXT', targetX, centerY);
      ctx.restore();
    }

    // Stable print zone boundary: selection box NEVER collapses or jumps when typing short letters like "H"
    const textPresetBox = {
      x: padX,
      y: startY,
      w: availW,
      h: availH,
    };

    contentBox = isBoth
      ? {
          x: Math.min(contentBox.x, textPresetBox.x),
          y: Math.min(contentBox.y, textPresetBox.y),
          w: Math.max(contentBox.w, textPresetBox.w),
          h: Math.max(contentBox.h, textPresetBox.h),
        }
      : textPresetBox;
  }

  // 3 ─ Selection frame + corner brackets — tightly hugs content
  if (isSelected) {
    const rx = contentBox.x;
    const ry = contentBox.y;
    const rw = contentBox.w;
    const rh = contentBox.h;

    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 14;
    ctx.setLineDash([28, 14]);
    ctx.strokeRect(rx, ry, rw, rh);

    ctx.setLineDash([]);
    ctx.lineWidth = 22;
    ctx.strokeStyle = '#fb923c';
    const L = Math.min(70, Math.max(20, Math.round(Math.min(rw, rh) * 0.3)));
    const corners: [number, number, number, number][] = [
      [rx, ry, 1, 1],
      [rx + rw, ry, -1, 1],
      [rx, ry + rh, 1, -1],
      [rx + rw, ry + rh, -1, -1],
    ];
    for (const [cx, cy, dx, dy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * L);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * L, cy);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/* ════════════════════════════════════════════════════════════════════════════
   Hooks
   ════════════════════════════════════════════════════════════════════════════ */

/** Loads admin-configured default logos once per zone list. */
function useAdminLogos(zones: PrintZone[]) {
  const [logos, setLogos] = useState<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    let alive = true;
    zones.forEach((z) => {
      const url = z.defaultImageUrl;
      if (!url || url.startsWith('blob:')) return;
      const img = new Image();
      // NOTE: no non-CORS fallback on purpose — a cross-origin image taints the canvas and
      // WebGL refuses to upload it. Make sure your image host sends CORS headers.
      img.crossOrigin = 'anonymous';
      img.onload = () => alive && setLogos((p) => ({ ...p, [z.id]: img }));
      img.onerror = () => console.warn(`[SmartCustomizer] Could not load default image for zone "${z.id}"`);
      img.src = url;
    });
    return () => {
      alive = false;
    };
  }, [zones]);

  return logos;
}

/** Returns true once web fonts are ready so decals can be redrawn with the right typeface. */
function useFontReady(font?: string) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    if (typeof document === 'undefined' || !document.fonts) {
      setReady(true);
      return;
    }

    const promises: Promise<any>[] = [document.fonts.ready];
    if (font) {
      promises.push(document.fonts.load(font));
    }

    Promise.all(promises)
      .then(() => {
        if (alive) setReady(true);
      })
      .catch(() => {
        if (alive) setReady(true);
      });

    return () => {
      alive = false;
    };
  }, [font]);
  return ready;
}

/** One reusable canvas + texture per decal. Redrawn in place, disposed on unmount. */
function useDecalTexture() {
  const gl = useThree((s) => s.gl);
  const { canvas, texture } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = TEX;
    canvas.height = TEX;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());
    return { canvas, texture };
  }, [gl]);

  useEffect(() => () => texture.dispose(), [texture]);
  return { canvas, texture };
}

/* ════════════════════════════════════════════════════════════════════════════
   3D scene
   ════════════════════════════════════════════════════════════════════════════ */

const ZoneDecal = React.memo(function ZoneDecal({
  targetMesh,
  zone,
  edits,
  adminLogo,
  isSelected,
  fontReady,
  onSelect,
}: {
  targetMesh: THREE.Mesh;
  zone: PrintZone;
  edits?: ZoneEdits;
  adminLogo?: HTMLImageElement;
  isSelected: boolean;
  fontReady: boolean;
  onSelect: (zoneId: string) => void;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const { canvas, texture } = useDecalTexture();
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const meshRef = useRef<THREE.Mesh>(targetMesh);
  meshRef.current = targetMesh;

  const logoImg = edits?.logo ?? adminLogo ?? null;
  const transform = edits?.transform;
  const text = edits?.text;
  const textColor = edits?.textColor;
  const fontFamily = edits?.fontFamily;
  const fontSize = edits?.fontSize;
  const bold = edits?.bold;
  const align = edits?.align;

  // Redraw the SAME canvas — no new textures, no GPU leaks while dragging sliders.
  useEffect(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawDecal(ctx, {
      zone,
      logoImg,
      transform: transform ?? DEFAULT_TRANSFORM,
      style: resolveTextStyle(zone, { text, textColor, fontFamily, fontSize, bold, align }),
      isSelected,
    });
    texture.needsUpdate = true;
    invalidate();
  }, [canvas, texture, invalidate, zone, logoImg, transform, text, textColor, fontFamily, fontSize, bold, align, isSelected, fontReady]);

  // Ensure active zone font redraws immediately once the specific web font file downloads
  useEffect(() => {
    const fam = fontFamily || zone.fontFamily;
    if (fam && typeof document !== 'undefined' && document.fonts) {
      document.fonts
        .load(`${bold !== false ? '900' : '700'} 80px ${fam}`)
        .then(() => {
          texture.needsUpdate = true;
          invalidate();
        })
        .catch(() => {});
    }
  }, [fontFamily, zone.fontFamily, bold, texture, invalidate]);

  const depth = zone.depth || Math.max(zone.width, zone.height) * 1.6;

  return (
    <Decal
      mesh={meshRef}
      userData={{ isDecal: true }}
      position={zone.position}
      rotation={zone.rotation}
      scale={[zone.width, zone.height, depth]}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta > 6) return; // it was an orbit drag, not a click
        onSelect(zone.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
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
        metalness={0}
        envMapIntensity={0.2}
        emissive={isSelected ? '#f97316' : '#000000'}
        emissiveIntensity={isSelected ? 0.35 : 0}
      />
    </Decal>
  );
});

interface ModelIndex {
  byName: Record<string, THREE.Mesh>;
  byMat: Record<string, THREE.Mesh>;
  first: THREE.Mesh | null;
  meshes: { mesh: THREE.Mesh; matNames: string[] }[];
  parts: FormattedPart[];
  originalColors: Record<string, string>;
}

function ConfiguredModel({
  url,
  zones,
  adminLogos,
  edits,
  colors,
  activeMaterial,
  activeZoneId,
  fontReady,
  onZoneClick,
  onPartClick,
  onMaterialsFound,
}: {
  url: string;
  zones: PrintZone[];
  adminLogos: Record<string, HTMLImageElement>;
  edits: EditsMap;
  colors: Record<string, string>;
  activeMaterial: string | null;
  activeZoneId: string | null;
  fontReady: boolean;
  onZoneClick: (zoneId: string) => void;
  onPartClick: (matName: string) => void;
  onMaterialsFound: (parts: FormattedPart[]) => void;
}) {
  const { scene: rawScene } = useGLTF(url);
  const invalidate = useThree((s) => s.invalidate);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  // Clone once; give fabric a matte finish once (not on every colour change).
  const scene = useMemo(() => {
    const s = rawScene.clone(true);
    s.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      if (isPlaceholderMesh(m)) {
        m.visible = false;
        m.geometry = new THREE.BufferGeometry();
        m.material = new THREE.MeshBasicMaterial({
          visible: false,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        });
        m.raycast = () => {};
        return;
      }
      m.material = Array.isArray(m.material)
        ? m.material.map(matteClone)
        : matteClone(m.material as THREE.Material);
    });
    return s;
  }, [rawScene]);

  // Free the cloned materials when the model unmounts.
  useEffect(
    () => () => {
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) toArray(m.material).forEach((mat) => mat.dispose());
      });
    },
    [scene]
  );

  // ONE traversal builds every lookup we need.
  const index = useMemo<ModelIndex>(() => {
    const idx: ModelIndex = { byName: {}, byMat: {}, first: null, meshes: [], parts: [], originalColors: {} };
    const seen = new Set<string>();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.userData?.isDecal || !m.visible || isPlaceholderMesh(m)) return;
      idx.first ??= m;
      if (m.name) idx.byName[m.name] = m;

      const matNames: string[] = [];
      for (const mat of toArray(m.material)) {
        const name = (mat?.name || '').trim();
        if (!name) continue;
        matNames.push(name);
        if (!idx.byMat[name]) idx.byMat[name] = m;
        if (!seen.has(name)) {
          seen.add(name);
          const hex = mat instanceof THREE.MeshStandardMaterial ? `#${mat.color.getHexString()}` : '#ffffff';
          idx.originalColors[name] = hex;
          idx.parts.push(categorizeModelPart(name, hex, m.name));
        }
      }
      idx.meshes.push({ mesh: m, matNames });
    });
    return idx;
  }, [scene]);

  useEffect(() => {
    onMaterialsFound(index.parts);
  }, [index, onMaterialsFound]);

  // Apply customer colours. Falls back to the ORIGINAL colour so "Reset" really resets.
  useEffect(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.userData?.isDecal || !m.visible || isPlaceholderMesh(m)) return;
      for (const mat of toArray(m.material)) {
        if (!(mat instanceof THREE.MeshStandardMaterial)) continue;
        const name = (mat.name || '').trim();
        const hex = colors[name] ?? index.originalColors[name];
        if (hex) mat.color.set(hex);
      }
    });
    invalidate();
  }, [scene, index, colors, invalidate]);

  const activeMeshes = useMemo(() => {
    if (!activeMaterial) return [];
    return index.meshes
      .filter(({ mesh, matNames }) => matNames.includes(activeMaterial) || mesh.name === activeMaterial)
      .map(({ mesh }) => mesh);
  }, [index, activeMaterial]);

  const handleClick = useCallback(
    (e: any) => {
      if (e.delta > 6) return; // orbit drag, ignore
      const hit = e.intersections?.find(
        (i: any) => i.object?.isMesh && i.object?.visible && !i.object?.userData?.isDecal && !isPlaceholderMesh(i.object)
      );
      if (!hit) return;
      e.stopPropagation();
      const mesh = hit.object as THREE.Mesh;
      const mats = toArray(mesh.material);
      const mat = mats[hit.face?.materialIndex ?? 0] ?? mats[0];
      onPartClick((mat?.name || mesh.name || '').trim());
    },
    [onPartClick]
  );

  return (
    <>
      <primitive
        object={scene}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />

      {activeMeshes.map((mesh) => (
        <PartOutline key={mesh.uuid} targetMesh={mesh} color="#00e5ff" />
      ))}

      {zones.map((zone, i) => {
        const target =
          (zone.meshName ? index.byName[zone.meshName] : null) ||
          (zone.materialName ? index.byMat[zone.materialName] : null) ||
          index.first;
        if (!target) return null;

        return (
          <React.Fragment key={zone.id || `zone-${i}`}>
            {createPortal(
              <ZoneDecal
                targetMesh={target}
                zone={zone}
                edits={edits[zone.id]}
                adminLogo={adminLogos[zone.id]}
                isSelected={activeZoneId === zone.id}
                fontReady={fontReady}
                onSelect={onZoneClick}
              />,
              target
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

function matteClone(mat: THREE.Material) {
  const c = mat.clone();
  if (c instanceof THREE.MeshStandardMaterial) {
    c.roughness = 0.85; // fabric look, no plastic glare
    c.metalness = 0;
    c.envMapIntensity = 0.35;
  }
  return c;
}

/** Shows a friendly message instead of a blank/crashed viewer if the GLB fails. */
class ViewerErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error('[SmartCustomizer] 3D viewer crashed', error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   Small reusable UI pieces
   ════════════════════════════════════════════════════════════════════════════ */

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <label htmlFor={id} className="text-white/60 font-bold">
          {label}
        </label>
        <span className="text-orange-400 font-mono font-black">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full accent-[#FF7348] cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none ${focusCls}`}
      />
    </div>
  );
}

function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; content: React.ReactNode; title?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className={`${labelCls} block`}>{label}</span>
      <div className="flex rounded-xl bg-black/40 p-1 border border-white/10" role="group" aria-label={label}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              title={o.title}
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center text-xs font-black transition-all ${focusCls} ${
                active ? 'bg-[#FF7348] text-black shadow-sm' : 'text-white/50 hover:text-white'
              }`}
            >
              {o.content}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ColorSwatches({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const activePreset = ATHLETIC_COLOR_PRESETS.find((c) => c.hex.toLowerCase() === value?.toLowerCase());
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs px-1">
        <span className="text-white/50">Athletic Colors ({ATHLETIC_COLOR_PRESETS.length})</span>
        {activePreset && (
          <span className="text-orange-400 font-medium">
            {activePreset.name}
          </span>
        )}
      </div>
      <div
        className="grid grid-cols-7 sm:grid-cols-8 gap-2 p-2.5 max-h-56 overflow-y-auto rounded-2xl bg-white/[0.03] border border-white/10"
        role="group"
        aria-label="Color presets"
      >
        {ATHLETIC_COLOR_PRESETS.map((c, idx) => {
          const selected = value?.toLowerCase() === c.hex.toLowerCase();
          return (
            <button
              key={`${c.hex}-${idx}`}
              type="button"
              title={`${c.name} (${c.hex})`}
              aria-label={c.name}
              aria-pressed={selected}
              onClick={() => onChange(c.hex)}
              className={`aspect-square rounded-xl transition-all border-2 ring-1 ring-white/10 relative ${focusCls} ${
                selected ? 'border-white scale-110 shadow-lg ring-2 ring-orange-500/60 z-10' : 'border-transparent hover:scale-105 hover:border-white/30'
              }`}
              style={{ backgroundColor: c.hex }}
            >
              {selected && (
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className={`w-2 h-2 rounded-full ${c.hex.toLowerCase() === '#ffffff' ? 'bg-black' : 'bg-white'}`} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Sidebar editors
   ════════════════════════════════════════════════════════════════════════════ */

function LogoEditor({
  zone,
  adminLogo,
  edits,
  error,
  onFile,
  onClear,
  onTransform,
  onResetTransform,
}: {
  zone: PrintZone;
  adminLogo?: HTMLImageElement;
  edits?: ZoneEdits;
  error: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
  onTransform: (patch: Partial<LogoTransform>) => void;
  onResetTransform: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [advanced, setAdvanced] = useState(false);
  const [dragging, setDragging] = useState(false);

  const t = { ...DEFAULT_TRANSFORM, ...edits?.transform };
  const locked = t.lockAspect ?? true;
  const current = edits?.logo ?? adminLogo;
  const isCustom = !!edits?.logo;

  return (
    <section className={cardCls} aria-label="Logo settings">
      <div className="flex items-center justify-between">
        <h3 className="text-white/80 text-sm font-black">Team logo / sponsor graphic</h3>
        <span className="text-orange-400 text-xs font-bold">PNG, JPG, WebP, SVG</span>
      </div>

      {current && (
        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-white/5 border border-white/10 p-1 flex items-center justify-center overflow-hidden">
              <img src={current.src} alt="Current logo preview" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-black truncate">
                {isCustom ? 'Your logo' : 'Official team graphic'}
              </p>
              <p className="text-white/40 text-xs">{isCustom ? 'Uploaded by you' : 'Set by the team admin'}</p>
            </div>
          </div>
          {isCustom && (
            <button
              type="button"
              onClick={onClear}
              className={`p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all ${focusCls}`}
              title="Remove my logo and go back to the default"
              aria-label="Remove my logo and go back to the default"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_LOGO_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ''; // allow re-selecting the same file
          if (file) onFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
        className={`w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed rounded-2xl text-sm font-black text-white transition-all ${focusCls} ${
          dragging ? 'bg-orange-500/15 border-orange-500' : 'bg-white/5 hover:bg-white/10 border-white/20 hover:border-orange-500/50'
        }`}
      >
        <Upload className="w-4 h-4 text-[#FF7348]" />
        <span>{isCustom ? 'Replace logo' : 'Upload your logo'}</span>
        <span className="text-white/40 font-medium text-xs hidden sm:inline">or drop a file here</span>
      </button>
      {error && (
        <p role="alert" className="text-red-400 text-xs font-medium">
          {error}
        </p>
      )}

      {/* Size presets are always visible; fine-tuning is tucked away to keep things simple */}
      <Segmented
        label="Logo size"
        value={([0.75, 1, 1.25, 1.5] as number[]).find((s) => Math.abs(s - t.scale) < 0.05) ?? -1}
        onChange={(scale) => onTransform({ scale })}
        options={[
          { value: 0.75, content: 'Compact' },
          { value: 1, content: 'Normal' },
          { value: 1.25, content: 'Large' },
          { value: 1.5, content: 'Hero' },
        ]}
      />

      <button
        type="button"
        onClick={() => setAdvanced((v) => !v)}
        aria-expanded={advanced}
        className={`w-full flex items-center justify-between text-xs font-bold text-white/70 hover:text-white py-1 ${focusCls}`}
      >
        <span className="flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF7348]" />
          Fine-tune size, position &amp; rotation
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${advanced ? 'rotate-180' : ''}`} />
      </button>

      {advanced && (
        <div className="space-y-4 pt-3 border-t border-white/10">
          <div className="space-y-3 p-3 bg-black/40 rounded-2xl border border-white/5">
            <Slider
              label="Overall size"
              value={t.scale}
              min={0.3}
              max={1.6}
              step={0.02}
              display={`${Math.round(t.scale * 100)}%`}
              onChange={(scale) => onTransform({ scale })}
            />

            <div className="flex items-center justify-between">
              <span className={labelCls}>Stretch width &amp; height separately</span>
              <button
                type="button"
                aria-pressed={!locked}
                onClick={() =>
                  onTransform(
                    locked
                      ? { lockAspect: false }
                      : { lockAspect: true, widthScale: t.widthScale, heightScale: t.widthScale }
                  )
                }
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black transition-all border ${focusCls} ${
                  locked
                    ? 'bg-white/10 text-white/70 border-white/10'
                    : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                }`}
              >
                {locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                {locked ? 'Ratio locked' : 'Free stretch'}
              </button>
            </div>

            {!locked && (
              <>
                <Slider
                  label="Width"
                  value={t.widthScale ?? 1}
                  min={0.4}
                  max={1.6}
                  step={0.02}
                  display={`${Math.round((t.widthScale ?? 1) * 100)}%`}
                  onChange={(widthScale) => onTransform({ widthScale })}
                />
                <Slider
                  label="Height"
                  value={t.heightScale ?? 1}
                  min={0.4}
                  max={1.6}
                  step={0.02}
                  display={`${Math.round((t.heightScale ?? 1) * 100)}%`}
                  onChange={(heightScale) => onTransform({ heightScale })}
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Segmented
              label="Horizontal"
              value={t.alignX}
              onChange={(alignX) => onTransform({ alignX, offsetX: 0 })}
              options={[
                { value: 'left', title: 'Align left', content: <AlignLeft className="w-4 h-4" /> },
                { value: 'center', title: 'Align center', content: <AlignCenter className="w-4 h-4" /> },
                { value: 'right', title: 'Align right', content: <AlignRight className="w-4 h-4" /> },
              ]}
            />
            <Segmented
              label="Vertical"
              value={t.alignY}
              onChange={(alignY) => onTransform({ alignY, offsetY: 0 })}
              options={[
                { value: 'top', title: 'Align top', content: <ArrowUp className="w-4 h-4" /> },
                { value: 'center', title: 'Align middle', content: <AlignCenter className="w-4 h-4" /> },
                { value: 'bottom', title: 'Align bottom', content: <ArrowDown className="w-4 h-4" /> },
              ]}
            />
          </div>

          <div className="space-y-3 p-3 bg-black/40 rounded-2xl border border-white/5">
            <Slider
              label="Nudge left / right"
              value={t.offsetX}
              min={-50}
              max={50}
              step={1}
              display={`${t.offsetX}%`}
              onChange={(offsetX) => onTransform({ offsetX })}
            />
            <Slider
              label="Nudge up / down"
              value={t.offsetY}
              min={-50}
              max={50}
              step={1}
              display={`${t.offsetY}%`}
              onChange={(offsetY) => onTransform({ offsetY })}
            />
          </div>

          <div className="space-y-3 p-3 bg-black/40 rounded-2xl border border-white/5">
            <Slider
              label="Rotation"
              value={t.rotation}
              min={-180}
              max={180}
              step={1}
              display={`${t.rotation}°`}
              onChange={(rotation) => onTransform({ rotation })}
            />
            <div className="flex gap-1">
              {[-45, 0, 45, 90].map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => onTransform({ rotation: deg })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${focusCls} ${
                    t.rotation === deg ? 'bg-[#FF7348] text-black' : 'bg-white/5 text-white/50 hover:text-white'
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>

          {edits?.transform && (
            <button
              type="button"
              onClick={onResetTransform}
              className={`text-xs text-orange-400 font-bold hover:underline ${focusCls}`}
            >
              Reset size &amp; position
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function getZoneTextLimits(zone: PrintZone): {
  maxChars: number;
  isNumeric: boolean;
  roleLabel: string;
  badgeLabel: string;
} {
  const labelLower = (zone.label || "").toLowerCase();
  const defText = (zone.defaultText || "").trim();
  const isNumber =
    zone.zoneRole === "back_number" ||
    zone.zoneRole === "front_number" ||
    labelLower.includes("number") ||
    labelLower.includes("num") ||
    defText === "01" ||
    defText === "23" ||
    (!isNaN(Number(defText)) && defText.length <= 3 && defText !== "");

  const isTeam = zone.zoneRole === "team_name" || labelLower.includes("team");
  const isPlayer = zone.zoneRole === "player_name" || labelLower.includes("player") || labelLower.includes("name");

  if (isNumber) {
    const maxChars = zone.maxCharacters ?? 3;
    return {
      maxChars,
      isNumeric: true,
      roleLabel: labelLower.includes("front") ? "Front Number" : "Back Number",
      badgeLabel: `Max ${maxChars} Digits (0–999)`,
    };
  }

  if (isTeam) {
    const maxChars = zone.maxCharacters ?? 12;
    return {
      maxChars,
      isNumeric: false,
      roleLabel: "Team Name",
      badgeLabel: `Max ${maxChars} Letters`,
    };
  }

  if (isPlayer) {
    const maxChars = zone.maxCharacters ?? 12;
    return {
      maxChars,
      isNumeric: false,
      roleLabel: "Player Name",
      badgeLabel: `Max ${maxChars} Letters`,
    };
  }

  const maxChars = zone.maxCharacters ?? 15;
  return {
    maxChars,
    isNumeric: zone.allowedInputType === "numeric",
    roleLabel: zone.label || "Custom Text",
    badgeLabel: `Max ${maxChars} Characters`,
  };
}

function TextEditor({
  zone,
  edits,
  onChange,
}: {
  zone: PrintZone;
  edits?: ZoneEdits;
  onChange: (patch: Partial<ZoneEdits>) => void;
}) {
  const style = resolveTextStyle(zone, edits);
  const inputId = useId();
  const { maxChars, isNumeric, roleLabel, badgeLabel } = getZoneTextLimits(zone);
  const currentVal = edits?.text ?? '';

  return (
    <section className={cardCls} aria-label="Text settings">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-white/80 text-sm font-black flex items-center gap-2">
          <span>{roleLabel}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
            {badgeLabel}
          </span>
        </label>
        {edits?.text !== undefined && (
          <button
            type="button"
            onClick={() => onChange({ text: undefined })}
            className={`text-xs text-orange-400 font-bold hover:underline ${focusCls}`}
          >
            Reset text
          </button>
        )}
      </div>

      <div className="relative">
        <input
          id={inputId}
          type="text"
          inputMode={isNumeric ? "numeric" : "text"}
          pattern={isNumeric ? "[0-9]*" : undefined}
          maxLength={maxChars}
          placeholder={zone.placeholder || zone.defaultText || (isNumeric ? "23" : "Type your text…")}
          value={currentVal}
          onChange={(e) => {
            let val = e.target.value.toUpperCase();
            if (isNumeric) {
              val = val.replace(/[^0-9]/g, "");
            }
            onChange({ text: val.slice(0, maxChars) });
          }}
          className="w-full bg-black/40 border border-white/10 rounded-2xl pl-4 pr-16 py-3 text-base font-black uppercase text-white placeholder-white/25 focus:outline-none focus:border-orange-500 shadow-inner"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40 font-mono font-bold">
          {currentVal.length}/{maxChars}
        </span>
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>Font Family</label>
        <select
          value={style.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF7348] transition-colors"
        >
          {FONT_FAMILY_PRESETS.map((f) => (
            <option key={f.id} value={f.family} className="bg-[#18181b] text-white">
              {f.label} ({f.category})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={labelCls}>Text color</span>
          <span className="text-white/60 text-xs font-mono uppercase">{style.color}</span>
        </div>
        <ColorSwatches value={style.color} onChange={(textColor) => onChange({ textColor })} />
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════════════════════════════════════ */

export interface SmartCustomizerProps {
  modelConfig: Model3DConfig;
  onSave?: (data: {
    colors: Record<string, string>;
    zones: Record<
      string,
      {
        type: string;
        /** Admin default image URL. The customer's upload is in `customImageFile` (blob URLs don't survive a reload). */
        customImageUrl?: string;
        customImageFile?: File;
        customLogoTransform?: LogoTransform;
        customText?: string;
        customTextColor?: string;
        customFontFamily?: string;
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
  const zones = modelConfig.printZones;

  const [modelParts, setModelParts] = useState<FormattedPart[]>([]);
  const [colors, setColors] = useState<Record<string, string>>({});
  const [edits, setEdits] = useState<EditsMap>({});
  const [tab, setTab] = useState<'zones' | 'colors'>('zones');
  const [activeZoneId, setActiveZoneId] = useState<string | null>(zones[0]?.id ?? null);
  const [activeMaterial, setActiveMaterial] = useState<string | null>(null);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand | null>('front');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const adminLogos = useAdminLogos(zones);
  const fontReady = useFontReady(`900 64px ${FONT_FAMILY}`);
  const [sceneRoot, setSceneRoot] = useState<THREE.Group | null>(null);

  // Revoke any leftover blob URLs when the customizer closes.
  const editsRef = useRef(edits);
  editsRef.current = edits;
  useEffect(
    () => () => {
      Object.values(editsRef.current).forEach(revokeLogoUrl);
    },
    []
  );

  // Auto-dismiss the "saved" and "confirm reset" states.
  useEffect(() => {
    if (!saved) return;
    const id = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(id);
  }, [saved]);
  useEffect(() => {
    if (!confirmReset) return;
    const id = setTimeout(() => setConfirmReset(false), 3000);
    return () => clearTimeout(id);
  }, [confirmReset]);

  /* ── State updaters ─────────────────────────────────────────────────────── */

  const patchZone = useCallback((zoneId: string, patch: Partial<ZoneEdits>) => {
    setEdits((prev) => ({ ...prev, [zoneId]: { ...prev[zoneId], ...patch } }));
  }, []);

  const updateTransform = useCallback((zoneId: string, patch: Partial<LogoTransform>) => {
    setEdits((prev) => {
      const current = prev[zoneId]?.transform ?? DEFAULT_TRANSFORM;
      return { ...prev, [zoneId]: { ...prev[zoneId], transform: { ...current, ...patch } } };
    });
  }, []);

  const handleLogoFile = useCallback((file: File, zoneId: string) => {
    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setUploadError('Please choose a PNG, JPG, WebP or SVG image.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setUploadError('That file is over 8 MB. Please choose a smaller image.');
      return;
    }
    setUploadError(null);

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setEdits((prev) => {
        revokeLogoUrl(prev[zoneId]); // free the previous upload
        return { ...prev, [zoneId]: { ...prev[zoneId], logo: img, logoFile: file } };
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setUploadError("We couldn't read that image. Please try a different file.");
    };
    img.src = url;
  }, []);

  const clearLogo = useCallback((zoneId: string) => {
    setEdits((prev) => {
      revokeLogoUrl(prev[zoneId]);
      return { ...prev, [zoneId]: { ...prev[zoneId], logo: undefined, logoFile: undefined } };
    });
  }, []);

  /* ── Selection / navigation ─────────────────────────────────────────────── */

  const handleZoneSelect = useCallback(
    (zoneId: string) => {
      setActiveZoneId(zoneId);
      setTab('zones');
      setUploadError(null);
      const z = zones.find((x) => x.id === zoneId);
      if (z) setCameraCommand(getFriendlyZoneInfo(z).cameraCommand);
    },
    [zones]
  );

  const handlePartSelect = useCallback(
    (matName: string) => {
      setActiveMaterial(matName);
      setTab('colors');
      const part = modelParts.find((p) => p.rawName === matName);
      if (part) setCameraCommand(part.cameraCommand as CameraCommand);
    },
    [modelParts]
  );

  const openTab = (next: 'zones' | 'colors') => {
    setTab(next);
    if (next === 'colors' && !activeMaterial && modelParts[0]) setActiveMaterial(modelParts[0].rawName);
    if (next === 'zones' && !activeZoneId && zones[0]) setActiveZoneId(zones[0].id);
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    Object.values(edits).forEach(revokeLogoUrl);
    setEdits({});
    setColors({});
    setUploadError(null);
    setCameraCommand('front');
    setConfirmReset(false);
  };

  const handleSave = () => {
    setSaved(true);
    onSave?.({
      colors,
      zones: Object.fromEntries(
        zones.map((z) => {
          const e = edits[z.id];
          const style = resolveTextStyle(z, e);
          return [
            z.id,
            {
              type: z.type,
              customImageUrl: z.defaultImageUrl,
              customImageFile: e?.logoFile,
              customLogoTransform: e?.transform ?? DEFAULT_TRANSFORM,
              customText: style.text,
              customTextColor: style.color,
              customFontFamily: style.fontFamily,
              fontSize: style.fontSize,
              isBold: style.bold,
              align: style.align,
            },
          ];
        })
      ),
    });
  };

  /* ── Derived ────────────────────────────────────────────────────────────── */

  const activeZone = zones.find((z) => z.id === activeZoneId);
  const activePart = modelParts.find((p) => p.rawName === activeMaterial);
  const customizedCount = useMemo(
    () => Object.keys(colors).length + Object.values(edits).filter(isZoneEdited).length,
    [colors, edits]
  );
  const activeColor = activeMaterial ? colors[activeMaterial] ?? activePart?.originalColor ?? '#FFFFFF' : '#FFFFFF';

  /* ── Render ─────────────────────────────────────────────────────────────── */

  return (
    <div
      style={{ fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif" }}
      className={`flex flex-col lg:flex-row bg-[#0a0a0f] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative ${
        className || 'w-full lg:h-[780px]'
      }`}
    >
      {/* ── 3D viewport ─────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden select-none min-h-[340px] h-[52vh] lg:h-auto touch-none">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 35%, #1f2333 0%, #0d0f14 70%, #07080b 100%)' }}
        />

        <ViewerErrorBoundary
          fallback={
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white/70">
              <div>
                <p className="text-lg font-black">The 3D preview couldn’t load</p>
                <p className="text-sm text-white/40 mt-1">Check your connection and refresh the page.</p>
              </div>
            </div>
          }
        >
          <Canvas
            dpr={[1, 2]}
            frameloop={RENDER_ON_DEMAND ? 'demand' : 'always'}
            camera={{ position: [0, 0, 4.2], fov: 45 }}
            style={{ background: 'transparent' }}
          >
            <Suspense fallback={null}>
              <Environment preset="studio" blur={0.8} environmentIntensity={0.35} />
              <ambientLight intensity={0.9} />
              <directionalLight position={[5, 10, 5]} intensity={1.1} />
              <directionalLight position={[-5, 5, -5]} intensity={0.25} />

              <group ref={setSceneRoot}>
                <ConfiguredModel
                  url={modelConfig.modelUrl}
                  zones={zones}
                  adminLogos={adminLogos}
                  edits={edits}
                  colors={colors}
                  activeMaterial={tab === 'colors' ? activeMaterial : null}
                  activeZoneId={tab === 'zones' ? activeZoneId : null}
                  fontReady={fontReady}
                  onZoneClick={handleZoneSelect}
                  onPartClick={handlePartSelect}
                  onMaterialsFound={setModelParts}
                />
              </group>

              <OrbitControls makeDefault enablePan={false} minDistance={1} maxDistance={8} />
              <CameraFit scene={sceneRoot} />
              <CameraHelperController scene={sceneRoot} command={cameraCommand} onHandled={() => setCameraCommand(null)} />
            </Suspense>
          </Canvas>
          <Loader />
        </ViewerErrorBoundary>

        <div className="absolute top-5 left-5 pointer-events-none space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <p className="text-white text-2xl font-black uppercase tracking-[.18em] italic">3D Customizer</p>
          </div>
          <p className="text-white/55 text-xs font-medium tracking-wide">
            Drag to rotate &bull; Click the shirt to customize that part
          </p>
        </div>

        <div className="absolute top-5 right-5 flex items-center gap-2 z-10">
          {customizedCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-black transition-all ${focusCls} ${
                confirmReset
                  ? 'bg-red-500/20 border-red-500/50 text-red-300'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5 text-orange-400" />
              {confirmReset ? 'Click again to clear everything' : 'Reset to defaults'}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors ${focusCls}`}
              title="Exit customizer"
              aria-label="Exit customizer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[calc(100%-1rem)] overflow-x-auto flex items-center gap-1 p-1.5 bg-[#0F1116]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl z-10"
          role="group"
          aria-label="Camera view"
        >
          {VIEW_BUTTONS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setCameraCommand(v.id)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black text-white/70 hover:text-white hover:bg-white/10 active:bg-orange-500/20 transition-all whitespace-nowrap ${focusCls}`}
            >
              <span aria-hidden>{v.icon}</span>
              <span>{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[420px] flex flex-col bg-[#111319] border-t lg:border-t-0 lg:border-l border-white/10 z-10 min-h-0">
        <div className="flex border-b border-white/10 p-2 gap-2 bg-[#0e1015]" role="tablist">
          {(
            [
              { id: 'zones', label: `Logos & text (${zones.length})`, icon: <ImageIcon className="w-4 h-4" /> },
              { id: 'colors', label: 'Garment colors', icon: <Palette className="w-4 h-4" /> },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => openTab(t.id)}
              className={`flex-1 py-3 px-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all ${focusCls} ${
                tab === t.id ? 'bg-[#FF7348] text-black shadow-lg shadow-orange-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-6" role="tabpanel">
          {/* ═══ Logos & text ═══ */}
          {tab === 'zones' && (
            <>
              <div className="space-y-2">
                <p className={labelCls}>1. Pick the area you want to personalize</p>

                {zones.length === 0 ? (
                  <div className="text-center py-10 text-white/40 text-sm border border-dashed border-white/10 rounded-2xl p-4">
                    This model doesn’t have any customizable areas yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {zones.map((zone) => {
                      const selected = activeZoneId === zone.id;
                      const info = getFriendlyZoneInfo(zone);
                      const e = edits[zone.id];
                      const hasLogo = !!e?.logo || !!adminLogos[zone.id];
                      const hasText = (e?.text !== undefined ? e.text : zone.defaultText ?? '').trim().length > 0;

                      return (
                        <button
                          key={zone.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => handleZoneSelect(zone.id)}
                          className={`w-full px-4 py-3 rounded-2xl text-left flex items-center justify-between gap-2 transition-all border ${focusCls} ${
                            selected
                              ? 'bg-orange-500/15 border-orange-500 text-white shadow-lg shadow-orange-500/10'
                              : 'bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xl" aria-hidden>
                              {info.icon}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-white truncate">{info.friendlyTitle}</p>
                              <p className="text-xs text-white/45 mt-0.5">
                                {info.directionTag.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())} &bull; {info.badgeType}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isZoneEdited(e) && <span className="w-2 h-2 rounded-full bg-orange-400" title="You edited this" />}
                            {hasLogo && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Logo
                              </span>
                            )}
                            {hasText && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
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

              {activeZone && (
                <div className="border-t border-white/10 pt-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-base font-black">
                        2. Edit: {getFriendlyZoneInfo(activeZone).friendlyTitle}
                      </p>
                      <p className="text-white/45 text-xs mt-0.5">Changes show instantly on the 3D shirt</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCameraCommand(getFriendlyZoneInfo(activeZone).cameraCommand)}
                      className={`p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/5 ${focusCls}`}
                      title="Turn the shirt to face this area"
                      aria-label="Turn the shirt to face this area"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>

                  {(activeZone.type === 'image' || activeZone.type === 'both') && (
                    <LogoEditor
                      zone={activeZone}
                      adminLogo={adminLogos[activeZone.id]}
                      edits={edits[activeZone.id]}
                      error={uploadError}
                      onFile={(file) => handleLogoFile(file, activeZone.id)}
                      onClear={() => clearLogo(activeZone.id)}
                      onTransform={(patch) => updateTransform(activeZone.id, patch)}
                      onResetTransform={() => patchZone(activeZone.id, { transform: undefined })}
                    />
                  )}

                  {(activeZone.type === 'text' || activeZone.type === 'both') && (
                    <TextEditor
                      zone={activeZone}
                      edits={edits[activeZone.id]}
                      onChange={(patch) => patchZone(activeZone.id, patch)}
                    />
                  )}
                </div>
              )}
            </>
          )}

          {/* ═══ Garment colors ═══ */}
          {tab === 'colors' && (
            <>
              <div className="space-y-3">
                <p className={labelCls}>1. Pick the part of the garment to recolor</p>

                {modelParts.length === 0 ? (
                  <p className="text-white/40 text-sm">Loading garment parts…</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {modelParts.map((part) => {
                      const selected = activeMaterial === part.rawName;
                      return (
                        <button
                          key={part.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => handlePartSelect(part.rawName)}
                          className={`px-3.5 py-3 rounded-2xl text-sm font-black text-left flex items-center justify-between gap-2 transition-all border ${focusCls} ${
                            selected
                              ? 'bg-orange-500/15 border-orange-500 text-white shadow-lg shadow-orange-500/10'
                              : 'bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span className="text-base" aria-hidden>
                              {part.icon}
                            </span>
                            <span className="truncate">{part.label}</span>
                          </span>
                          <span
                            className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: colors[part.rawName] ?? part.originalColor }}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {activeMaterial && (
                <div className="border-t border-white/10 pt-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-white text-base font-black">
                        2. Color for {activePart?.label || activeMaterial.replace(/_/g, ' ')}
                      </p>
                      <p className="text-white/45 text-xs mt-0.5">Select from athletic preset shades</p>
                    </div>
                    <div className="text-right">
                      <span className="text-white/90 text-xs font-semibold block">
                        {ATHLETIC_COLOR_PRESETS.find((c) => c.hex.toLowerCase() === activeColor.toLowerCase())?.name || ''}
                      </span>
                      <span className="text-white/50 text-[11px] font-mono uppercase">{activeColor}</span>
                    </div>
                  </div>

                  <ColorSwatches value={activeColor} onChange={(hex) => setColors((p) => ({ ...p, [activeMaterial]: hex }))} />

                  {colors[activeMaterial] && (
                    <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 inline-block shadow-sm"
                          style={{ backgroundColor: colors[activeMaterial] }}
                        />
                        <span className="text-xs text-white/70">
                          Customized: <strong className="text-white">{ATHLETIC_COLOR_PRESETS.find((c) => c.hex.toLowerCase() === colors[activeMaterial].toLowerCase())?.name || colors[activeMaterial]}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setColors((p) => {
                            const next = { ...p };
                            delete next[activeMaterial];
                            return next;
                          })
                        }
                        className={`text-xs text-orange-400 font-bold hover:underline ${focusCls}`}
                      >
                        Reset to default
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="p-5 border-t border-white/10 bg-[#0e1015] space-y-3 shrink-0">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50 font-bold">Your changes</span>
            <span className="text-orange-400 font-black">
              {customizedCount === 0 ? 'None yet' : `${customizedCount} ${customizedCount === 1 ? 'change' : 'changes'}`}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className={`w-full py-4 rounded-2xl text-sm font-black tracking-wide bg-gradient-to-r from-[#FF7348] to-[#ff8c69] hover:from-[#ff8660] hover:to-[#ffa082] text-black shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${focusCls}`}
          >
            {saved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            <span aria-live="polite">{saved ? 'Customization saved!' : 'Save my design'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}