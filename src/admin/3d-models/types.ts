export interface ScreenRect {
  x: number; // left (0–1 fraction)
  y: number; // top (0–1 fraction)
  w: number; // width (0–1 fraction)
  h: number; // height (0–1 fraction)
}

export interface DrawRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ZoneHit {
  center: [number, number, number];
  normal: [number, number, number];
  worldW: number;
  worldH: number;
}

export interface RaycastResult {
  targetMeshName: string;
  materialName: string;
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  height: number;
  depth: number;
  hit: ZoneHit;
}

export interface PrintZone {
  id: string;
  label: string;
  materialName: string;
  meshName?: string;
  type: "text" | "image" | "both";
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  height: number;
  depth?: number;
  /** Decal twist angle around surface normal in degrees (-180 to 180) */
  rotationZ?: number;
  defaultText: string;
  placeholder: string;
  defaultImageUrl?: string;
  defaultImagePublicId?: string;
  /** Hit point & orientation */
  hit?: ZoneHit;
  /** Font / style */
  fontSize: number;
  textColor: string;
  align: "left" | "center" | "right";
  isBold: boolean;
  allowCustomColor: boolean;
  defaultColor: string;
}

export interface MaterialInfo {
  name: string;
  originalColor: string;
  meshName?: string;
}

export interface Model3D {
  id: string;
  name: string;
  description?: string;
  modelUrl: string;
  thumbnailUrl?: string;
  isActive: boolean;
  printZones: PrintZone[];
  createdAt: string;
  product_id?: string;
  productId?: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    mainImageUrl?: string;
    basePrice?: number;
    status?: string;
    sku?: string;
  };
}

export const PRESET_COLORS = [
  { label: "White", hex: "#ffffff" },
  { label: "Black", hex: "#111827" },
  { label: "Gold", hex: "#f59e0b" },
  { label: "Red", hex: "#ef4444" },
  { label: "Royal", hex: "#2563eb" },
  { label: "Emerald", hex: "#10b981" },
  { label: "Purple", hex: "#8b5cf6" },
  { label: "Pink", hex: "#ec4899" },
];

export const FONT_SIZE_PRESETS = [
  { label: "Sm", size: 50 },
  { label: "Md", size: 80 },
  { label: "Lg", size: 120 },
  { label: "XL", size: 160 },
];

export const SIZE_PRESETS = [
  { label: "Chest Print", w: 0.26, h: 0.10 },
  { label: "Back Name", w: 0.32, h: 0.12 },
  { label: "Back Number", w: 0.22, h: 0.28 },
  { label: "Badge / Logo", w: 0.14, h: 0.14 },
];
