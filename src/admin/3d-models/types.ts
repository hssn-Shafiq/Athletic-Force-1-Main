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

export type ZoneRole = 'player_name' | 'team_name' | 'back_number' | 'front_number' | 'custom_text' | 'team_logo';
export type AllowedInputType = 'text' | 'numeric' | 'alphanumeric';

export interface PrintZone {
  id: string;
  label: string;
  materialName: string;
  meshName?: string;
  type: "text" | "image" | "both";
  /** Pre-configured athletic zone role (e.g. player_name, back_number, etc.) */
  zoneRole?: ZoneRole;
  /** Maximum character limit (e.g. 12 for names, 3 for numbers, 15 for custom) */
  maxCharacters?: number;
  /** Restricted input type (numeric only or text) */
  allowedInputType?: AllowedInputType;
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
  fontFamily?: string;
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
  { label: "Sm", size: 60 },
  { label: "Fit", size: 80 },
  { label: "Lg", size: 100 },
  { label: "XL", size: 120 },
];

export const SIZE_PRESETS = [
  { label: "Chest Print", w: 0.26, h: 0.10 },
  { label: "Back Name", w: 0.32, h: 0.12 },
  { label: "Back Number", w: 0.22, h: 0.28 },
  { label: "Badge / Logo", w: 0.14, h: 0.14 },
];

export interface ZoneRolePreset {
  id: ZoneRole;
  label: string;
  type: "text" | "image" | "both";
  maxCharacters: number;
  allowedInputType: AllowedInputType;
  defaultText: string;
  w: number;
  h: number;
  fontFamily: string;
  fontSize: number;
  icon: string;
  description: string;
}

export const ATHLETIC_ZONE_PRESETS: ZoneRolePreset[] = [
  {
    id: "player_name",
    label: "Player Name",
    type: "text",
    maxCharacters: 12,
    allowedInputType: "text",
    defaultText: "PLAYER NAME",
    w: 0.32,
    h: 0.10,
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 80,
    icon: "🔤",
    description: "Back jersey nameplate (Max 12 chars)",
  },
  {
    id: "team_name",
    label: "Team Name",
    type: "text",
    maxCharacters: 12,
    allowedInputType: "text",
    defaultText: "WARRIORS",
    w: 0.28,
    h: 0.10,
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 80,
    icon: "🏆",
    description: "Front chest team title (Max 12 chars)",
  },
  {
    id: "back_number",
    label: "Back Number",
    type: "text",
    maxCharacters: 3,
    allowedInputType: "numeric",
    defaultText: "23",
    w: 0.22,
    h: 0.28,
    fontFamily: "'Teko', sans-serif",
    fontSize: 100,
    icon: "🔢",
    description: "Large back jersey numerals (Max 3 digits)",
  },
  {
    id: "front_number",
    label: "Front Number",
    type: "text",
    maxCharacters: 3,
    allowedInputType: "numeric",
    defaultText: "23",
    w: 0.12,
    h: 0.14,
    fontFamily: "'Teko', sans-serif",
    fontSize: 90,
    icon: "🔢",
    description: "Small chest numerals (Max 3 digits)",
  },
  {
    id: "team_logo",
    label: "Team Logo",
    type: "image",
    maxCharacters: 0,
    allowedInputType: "text",
    defaultText: "",
    w: 0.14,
    h: 0.14,
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 80,
    icon: "🖼️",
    description: "Chest badge / crest / sleeve patch",
  },
  {
    id: "custom_text",
    label: "Custom Text",
    type: "text",
    maxCharacters: 15,
    allowedInputType: "text",
    defaultText: "CUSTOM TEXT",
    w: 0.26,
    h: 0.10,
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 80,
    icon: "⚙️",
    description: "General custom lettering (Max 15 chars)",
  },
];

export interface FontFamilyPreset {
  id: string;
  label: string;
  family: string;
  category: "Athletic" | "Collegiate" | "Display" | "Modern";
  description: string;
}

export const FONT_FAMILY_PRESETS: FontFamilyPreset[] = [
  {
    id: "bebas-neue",
    label: "Bebas Neue",
    family: "'Bebas Neue', sans-serif",
    category: "Athletic",
    description: "Pro Jersey Bold Condensed",
  },
  {
    id: "oswald",
    label: "Oswald",
    family: "'Oswald', sans-serif",
    category: "Athletic",
    description: "Varsity Athletic Impact",
  },
  {
    id: "anton",
    label: "Anton",
    family: "'Anton', sans-serif",
    category: "Display",
    description: "Heavy Headline Bold",
  },
  {
    id: "teko",
    label: "Teko",
    family: "'Teko', sans-serif",
    category: "Athletic",
    description: "Ultra-Tall Jersey Numbers",
  },
  {
    id: "russo-one",
    label: "Russo One",
    family: "'Russo One', sans-serif",
    category: "Modern",
    description: "Cyber Sports Block",
  },
  {
    id: "graduate",
    label: "Graduate",
    family: "'Graduate', serif",
    category: "Collegiate",
    description: "NCAA Varsity College Slab",
  },
  {
    id: "barlow-condensed",
    label: "Barlow Condensed",
    family: "'Barlow Condensed', sans-serif",
    category: "Athletic",
    description: "Technical Sports Condensed",
  },
  {
    id: "montserrat",
    label: "Montserrat Black",
    family: "'Montserrat', sans-serif",
    category: "Modern",
    description: "Bold Geometric Team Name",
  },
  {
    id: "impact",
    label: "Impact",
    family: "'Impact', 'Arial Black', sans-serif",
    category: "Display",
    description: "Classic Heavy Stadium Block",
  },
  {
    id: "arial-black",
    label: "Arial Black",
    family: "'Arial Black', Arial, sans-serif",
    category: "Display",
    description: "Standard Bold Clean",
  },
];
