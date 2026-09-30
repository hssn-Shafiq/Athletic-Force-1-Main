import React, { useState, useRef, useEffect } from "react";
import {
  Trash2, Type, Image as ImageIcon, Check, ChevronDown, ChevronRight,
  Move, Lock, Unlock, ZoomIn, ZoomOut, ArrowUp, ArrowDown,
  ArrowLeft, ArrowRight, RefreshCw, Palette, Upload,
} from "lucide-react";
import {
  PrintZone,
  PRESET_COLORS,
  FONT_SIZE_PRESETS,
  SIZE_PRESETS,
} from "../types";

export interface ZoneCardProps {
  zone: PrintZone;
  isActive: boolean;
  isRepositioning: boolean;
  onSelect: () => void;
  onToggleReposition: () => void;
  onDelete: () => void;
  onChange: (patch: Partial<PrintZone>) => void;
  onLogoUpload: (file: File) => void;
  isUploadingLogo?: boolean;
  onScale: (factor: number) => void;
  onSetDimensions: (width?: number, height?: number, lockAspect?: boolean) => void;
  onSetRotation: (angleDeg: number) => void;
  onNudge: (dir: "up" | "down" | "left" | "right", mult?: number) => void;
}

export function ZoneCard({
  zone,
  isActive,
  isRepositioning,
  isUploadingLogo,
  onSelect,
  onToggleReposition,
  onDelete,
  onChange,
  onLogoUpload,
  onScale,
  onSetDimensions,
  onSetRotation,
  onNudge,
}: ZoneCardProps) {
  const [isOpen, setIsOpen] = useState(isActive);
  const [editingLabel, setEditingLabel] = useState(false);
  const [lockAspect, setLockAspect] = useState(true);
  const logoRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-expand and scroll into view when this zone becomes active
  useEffect(() => {
    if (isActive) {
      setIsOpen(true);
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isActive]);

  const rotZ = Math.round(zone.rotationZ || 0);

  return (
    <div
      ref={cardRef}
      className={`rounded-2xl border transition-all ${
        isActive
          ? "border-orange-500 bg-orange-50/20 shadow-md ring-2 ring-orange-500/20"
          : "border-slate-200 bg-white hover:border-slate-300 shadow-xs"
      }`}
    >
      {/* ── CARD HEADER ── */}
      <div
        className="flex items-center justify-between p-3.5 cursor-pointer select-none"
        onClick={() => {
          if (!isActive) onSelect();
          setIsOpen((prev) => !prev);
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen((prev) => !prev);
            }}
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <div className="w-2 h-2 rounded-full flex-shrink-0 bg-orange-500" />

          <div className="min-w-0 flex-1">
            {editingLabel ? (
              <input
                type="text"
                autoFocus
                value={zone.label}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onChange({ label: e.target.value })}
                onBlur={() => setEditingLabel(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setEditingLabel(false);
                }}
                className="text-xs font-black uppercase text-slate-900 bg-white border border-orange-500 rounded px-1.5 py-0.5 outline-none w-full"
              />
            ) : (
              <div className="flex items-center gap-1.5">
                <span
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingLabel(true);
                  }}
                  title="Double click to rename"
                  className="text-xs font-black uppercase tracking-tight text-slate-900 truncate cursor-text"
                >
                  {zone.label}
                </span>
                <span className="text-[9px] font-mono text-slate-500 uppercase px-1.5 py-0.2 bg-slate-100 rounded-md flex-shrink-0">
                  {zone.type}
                </span>
              </div>
            )}
            <p className="text-[10px] text-slate-500 truncate font-mono">
              Mesh: {zone.meshName || zone.materialName}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onToggleReposition}
            title={isRepositioning ? "Click to lock position" : "Drag to reposition directly on 3D model"}
            className={`p-1.5 rounded-xl transition-all ${
              isRepositioning
                ? "bg-orange-500 text-white animate-pulse"
                : "text-slate-400 hover:text-orange-600 hover:bg-orange-50"
            }`}
          >
            <Move className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onDelete}
            title="Remove zone"
            className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── EXPANDED CONTROLS ── */}
      {isOpen && (
        <div className="p-3.5 pt-0 space-y-3.5 border-t border-slate-100 mt-1">
          {/* 1. Zone Type Switcher */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
              Zone Content
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
              {(["text", "image", "both"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange({ type: t })}
                  className={`py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                    zone.type === t
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {t === "text" ? "Text" : t === "image" ? "Logo" : "Both"}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Text Configuration */}
          {(zone.type === "text" || zone.type === "both") && (
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Custom Text</span>
                <span className="text-[9px] text-slate-500">Live 3D Preview</span>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="e.g. RONALDO or PLAYER NAME"
                  value={zone.defaultText || ""}
                  onChange={(e) => onChange({ defaultText: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:bg-white outline-none transition-colors"
                />
              </div>

              {/* Quick Font Size Buttons */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Size</span>
                  <span className="text-[9px] font-mono font-bold text-orange-600">{zone.fontSize || 80}px</span>
                </div>
                <div className="grid grid-cols-4 gap-1 mb-2">
                  {FONT_SIZE_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => onChange({ fontSize: p.size })}
                      className={`py-1 text-[9px] font-black rounded-lg border transition-all ${
                        (zone.fontSize || 80) === p.size
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="2"
                  value={zone.fontSize || 80}
                  onChange={(e) => onChange({ fontSize: parseInt(e.target.value, 10) || 80 })}
                  className="w-full accent-orange-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              {/* Alignment & Bold */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
                  {(["left", "center", "right"] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => onChange({ align: a })}
                      className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg transition-all ${
                        zone.align === a ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onChange({ isBold: !zone.isBold })}
                  className={`px-3 py-1 text-[9px] font-black uppercase rounded-xl border transition-all ${
                    zone.isBold
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Bold
                </button>
              </div>
            </div>
          )}

          {/* 3. Color Picker (Presets + Hex) */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Color</span>
              <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">{zone.textColor || "#ffffff"}</span>
            </div>

            {/* Quick Color Swatches */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => onChange({ textColor: c.hex })}
                  title={c.label}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 relative flex items-center justify-center ${
                    zone.textColor?.toLowerCase() === c.hex.toLowerCase()
                      ? "border-orange-500 scale-110 shadow-xs"
                      : "border-slate-300"
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {zone.textColor?.toLowerCase() === c.hex.toLowerCase() && (
                    <Check className={`w-3 h-3 ${c.hex === "#ffffff" ? "text-black" : "text-white"}`} />
                  )}
                </button>
              ))}

              {/* Custom Native Color Picker */}
              <label className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 hover:border-orange-500 flex items-center justify-center cursor-pointer transition-all hover:scale-110">
                <Palette className="w-3 h-3 text-slate-500" />
                <input
                  type="color"
                  value={zone.textColor || "#ffffff"}
                  onChange={(e) => onChange({ textColor: e.target.value })}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {/* 4. Logo / Image Upload */}
          {(zone.type === "image" || zone.type === "both") && (
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Logo Image</span>
                  {zone.defaultImageUrl?.startsWith("http") && (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Cloud ✓
                    </span>
                  )}
                  {isUploadingLogo && (
                    <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 animate-pulse">
                      Uploading...
                    </span>
                  )}
                </div>
                {zone.defaultImageUrl && !isUploadingLogo && (
                  <button
                    onClick={() => onChange({ defaultImageUrl: undefined, defaultImagePublicId: undefined })}
                    className="text-[9px] text-red-500 hover:underline font-bold uppercase"
                  >
                    Remove
                  </button>
                )}
              </div>

              <input
                ref={logoRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                disabled={isUploadingLogo}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onLogoUpload(file);
                }}
              />

              {!zone.defaultImageUrl && !isUploadingLogo ? (
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-purple-50/50 hover:bg-purple-50 border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-xl text-[10px] font-black uppercase tracking-wider text-purple-700 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Logo (PNG/JPG)</span>
                </button>
              ) : isUploadingLogo ? (
                <div className="w-full py-6 flex flex-col items-center justify-center bg-purple-50/40 border border-purple-100 rounded-xl">
                  <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-1.5" />
                  <span className="text-[10px] font-bold text-purple-700">Uploading to Cloudinary...</span>
                </div>
              ) : (
                <div className="relative group rounded-xl overflow-hidden bg-slate-50 border border-slate-200 p-2 flex items-center justify-center h-24">
                  <img src={zone.defaultImageUrl} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center text-xs font-bold text-white transition-opacity"
                  >
                    Change Image
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 5. Print Size on Model */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Size on Shirt</span>
              <button
                type="button"
                onClick={() => setLockAspect((v) => !v)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold transition-colors ${
                  lockAspect ? "text-orange-600 bg-orange-50" : "text-slate-400 hover:text-slate-600"
                }`}
                title={lockAspect ? "Aspect ratio locked" : "Aspect ratio unlocked"}
              >
                {lockAspect ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                <span>{lockAspect ? "Lock" : "Free"}</span>
              </button>
            </div>

            {/* Quick Size Presets */}
            <div>
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Presets</span>
              <div className="grid grid-cols-2 gap-1.5">
                {SIZE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => onSetDimensions(p.w, p.h, false)}
                    className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-bold text-center transition-all truncate"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick +/- 10% buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onScale(0.9)}
                className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-all"
              >
                <ZoomOut className="w-3 h-3 text-orange-500" /> -10% Size
              </button>
              <button
                type="button"
                onClick={() => onScale(1.1)}
                className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-all"
              >
                <ZoomIn className="w-3 h-3 text-orange-500" /> +10% Size
              </button>
            </div>

            {/* Sliders */}
            <div className="space-y-2 text-xs pt-1">
              <div>
                <div className="flex justify-between text-[8px] font-mono text-slate-500 mb-0.5">
                  <span>Width</span>
                  <span className="text-slate-900 font-bold">{zone.width.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="1.5"
                  step="0.01"
                  value={zone.width}
                  onChange={(e) => onSetDimensions(parseFloat(e.target.value), undefined, lockAspect)}
                  className="w-full accent-orange-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[8px] font-mono text-slate-500 mb-0.5">
                  <span>Height</span>
                  <span className="text-slate-900 font-bold">{zone.height.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="1.5"
                  step="0.01"
                  value={zone.height}
                  onChange={(e) => onSetDimensions(undefined, parseFloat(e.target.value), lockAspect)}
                  className="w-full accent-orange-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 6. Rotation & Micro Nudge */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Angle / Rotation</span>
              <span className="text-[10px] font-mono font-bold text-orange-600">{rotZ}°</span>
            </div>

            {/* Quick Rotate Buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => onSetRotation((rotZ - 90 + 360) % 360 > 180 ? ((rotZ - 90 + 360) % 360) - 360 : (rotZ - 90 + 360) % 360)}
                className="py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-bold transition-all"
              >
                -90°
              </button>
              <button
                type="button"
                onClick={() => onSetRotation(0)}
                className="py-1 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg text-[9px] font-bold transition-all flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-2.5 h-2.5" /> 0°
              </button>
              <button
                type="button"
                onClick={() => onSetRotation((rotZ + 90 + 360) % 360 > 180 ? ((rotZ + 90 + 360) % 360) - 360 : (rotZ + 90 + 360) % 360)}
                className="py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-bold transition-all"
              >
                +90°
              </button>
            </div>

            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={rotZ}
              onChange={(e) => onSetRotation(parseInt(e.target.value, 10) || 0)}
              className="w-full accent-orange-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />

            {/* Micro Nudge D-pad */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <div>
                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider block">Nudge Position</span>
                <span className="text-[8px] text-slate-400 font-mono">Arrow keys work too</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onNudge("left")}
                  title="Nudge Left"
                  className="p-1.5 bg-slate-100 hover:bg-orange-500 hover:text-white rounded-lg text-slate-600 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => onNudge("up")}
                    title="Nudge Up"
                    className="p-1.5 bg-slate-100 hover:bg-orange-500 hover:text-white rounded-lg text-slate-600 transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNudge("down")}
                    title="Nudge Down"
                    className="p-1.5 bg-slate-100 hover:bg-orange-500 hover:text-white rounded-lg text-slate-600 transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onNudge("right")}
                  title="Nudge Right"
                  className="p-1.5 bg-slate-100 hover:bg-orange-500 hover:text-white rounded-lg text-slate-600 transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
