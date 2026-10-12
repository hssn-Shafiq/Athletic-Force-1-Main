import React, { useMemo } from "react";
import { Type, Image as ImageIcon, Compass, Layers, X } from "lucide-react";
import { MaterialInfo } from "../types";
import { categorizeModelPart, FormattedPart } from "../utils/partUtils";

export interface ModelTopBarProps {
  zoneCreationType: "text" | "image" | null;
  isPickingMaterial: boolean;
  isDrawingZone: boolean;
  activeMaterial: string | null;
  onStartAddZone: (type: "text" | "image") => void;
  onCancelCreation: () => void;
  onBackToPicking: () => void;
  onSetCameraCommand: (command: "front" | "back" | "left" | "right" | "reset") => void;
}

export function ModelTopBar({
  zoneCreationType,
  isPickingMaterial,
  isDrawingZone,
  activeMaterial,
  onStartAddZone,
  onCancelCreation,
  onBackToPicking,
  onSetCameraCommand,
}: ModelTopBarProps) {
  return (
    <div className="w-full h-14 flex-shrink-0 px-4 bg-[#06060e] border-b border-slate-800/80 flex items-center justify-between z-10 relative">
      {/* ── TOP-LEFT ACTIONS ── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onStartAddZone("text")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-lg ${
            zoneCreationType === "text"
              ? "bg-orange-500 text-white animate-pulse ring-2 ring-orange-400/50 shadow-orange-500/30"
              : "bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80"
          }`}
        >
          <Type className="w-3.5 h-3.5 text-orange-400" />
          <span>+ Add Text</span>
        </button>

        <button
          type="button"
          onClick={() => onStartAddZone("image")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-lg ${
            zoneCreationType === "image"
              ? "bg-purple-600 text-white animate-pulse ring-2 ring-purple-400/50 shadow-purple-500/30"
              : "bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
          <span>+ Add Logo</span>
        </button>

        {activeMaterial && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 border border-cyan-500/40 rounded-xl shadow-md">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-mono text-cyan-200 truncate max-w-[140px]">
              {activeMaterial}
            </span>
          </div>
        )}
      </div>

      {/* ── 2-STEP GUIDANCE BANNER (CENTERED) ── */}
      {zoneCreationType && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-slate-900 border border-orange-500/70 text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2.5 whitespace-nowrap animate-in fade-in">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
          <span>
            {isPickingMaterial
              ? `Step 1: Click garment part to place ${zoneCreationType}`
              : `Step 2: Drag box on ${activeMaterial || "shirt"}`}
          </span>
          {!isPickingMaterial && isDrawingZone && (
            <button
              type="button"
              onClick={onBackToPicking}
              className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-orange-300 rounded text-[10px] font-black uppercase"
            >
              Change
            </button>
          )}
          <button
            type="button"
            onClick={onCancelCreation}
            className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[10px] font-black uppercase"
          >
            Cancel
          </button>
        </div>
      )}

      {/* ── CAMERA ANGLE PRESETS (TOP-RIGHT) ── */}
      <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-1 shadow-lg">
        {(["front", "back", "left", "right"] as const).map((dir) => (
          <button
            key={dir}
            type="button"
            onClick={() => onSetCameraCommand(dir)}
            className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-800 transition-all capitalize"
          >
            {dir}
          </button>
        ))}
        <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
        <button
          type="button"
          onClick={() => onSetCameraCommand("reset")}
          title="Reset Camera View"
          className="p-1 rounded-xl text-slate-400 hover:text-orange-400 hover:bg-slate-800 transition-all"
        >
          <Compass className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export interface ModelBottomBarProps {
  materials?: MaterialInfo[];
  activeMaterial: string | null;
  activeMeshName?: string | null;
  zonesCount?: number;
  onSelectPart?: (partName: string, meshName?: string, camera?: "front" | "back" | "left" | "right" | null) => void;
  onClosePreview?: () => void;
}

export function ModelBottomBar({
  materials = [],
  activeMaterial,
  activeMeshName,
  zonesCount,
  onSelectPart,
  onClosePreview,
}: ModelBottomBarProps) {
  const formattedParts = useMemo<FormattedPart[]>(() => {
    return materials.map((m) => categorizeModelPart(m.name, m.originalColor, m.meshName));
  }, [materials]);

  return (
    <div className="w-full h-14 flex-shrink-0 px-4 bg-[#06060e] border-t border-slate-800/80 flex items-center gap-3 z-10 relative">
      {/* Parts Header Badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400 border-r border-slate-800 pr-3 flex-shrink-0">
        <Layers className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden sm:inline">Parts</span>
        <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/50 px-1.5 py-0.5 rounded-full font-bold">
          {formattedParts.length}
        </span>
      </div>

      {/* Horizontally scrollable list of parts */}
      <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0 pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(100,116,139,0.4)_transparent]">
        {formattedParts.map((part) => {
          const isSelected =
            activeMaterial === part.rawName ||
            (activeMeshName && activeMeshName === part.meshName);
          return (
            <button
              key={part.id}
              type="button"
              onClick={() =>
                onSelectPart?.(part.rawName, part.meshName, part.cameraCommand)
              }
              title={`Select ${part.label}`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all flex-shrink-0 whitespace-nowrap shadow-sm ${
                isSelected
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 ring-1 ring-cyan-300 font-black scale-[1.02]"
                  : "bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60"
              }`}
            >
              <span className="text-sm">{part.icon}</span>
              <span>{part.label}</span>
              {isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right end: Zones count badge and close preview */}
      <div className="flex items-center gap-2 flex-shrink-0 border-l border-slate-800 pl-3">
        {typeof zonesCount === "number" && (
          <div className="bg-black/60 rounded-xl px-2.5 py-1 border border-slate-800 hidden sm:block">
            <p className="text-white text-[10px] font-black uppercase tracking-wider">
              {zonesCount} {zonesCount === 1 ? "zone" : "zones"}
            </p>
          </div>
        )}
        {onClosePreview && (
          <button
            type="button"
            onClick={onClosePreview}
            title="Close 3D View"
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Legacy wrapper if needed */
export function ModelTopToolbar(props: ModelTopBarProps & ModelBottomBarProps) {
  return (
    <>
      <ModelTopBar {...props} />
      <ModelBottomBar {...props} />
    </>
  );
}
