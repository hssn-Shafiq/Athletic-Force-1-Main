import React, { useMemo } from "react";
import { Type, Image as ImageIcon, Compass, Layers } from "lucide-react";
import { MaterialInfo } from "../types";
import { categorizeModelPart, FormattedPart } from "../utils/partUtils";

interface ModelTopToolbarProps {
  zoneCreationType: "text" | "image" | null;
  isPickingMaterial: boolean;
  isDrawingZone: boolean;
  activeMaterial: string | null;
  activeMeshName?: string | null;
  materials?: MaterialInfo[];
  onStartAddZone: (type: "text" | "image") => void;
  onCancelCreation: () => void;
  onBackToPicking: () => void;
  onSetCameraCommand: (command: "front" | "back" | "left" | "right" | "reset") => void;
  onSelectPart?: (partName: string, meshName?: string, camera?: "front" | "back" | "left" | "right" | null) => void;
}

export function ModelTopToolbar({
  zoneCreationType,
  isPickingMaterial,
  isDrawingZone,
  activeMaterial,
  activeMeshName,
  materials = [],
  onStartAddZone,
  onCancelCreation,
  onBackToPicking,
  onSetCameraCommand,
  onSelectPart,
}: ModelTopToolbarProps) {
  // Format model materials into clear variation parts
  const formattedParts = useMemo<FormattedPart[]>(() => {
    return materials.map((m) => categorizeModelPart(m.name, m.originalColor, m.meshName));
  }, [materials]);

  return (
    <>
      {/* ── CANVAS TOP-LEFT ACTIONS ── */}
      {!isDrawingZone && !isPickingMaterial && (
        <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
          {/* Quick Add Text */}
          <button
            type="button"
            onClick={() => onStartAddZone("text")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-lg ${
              zoneCreationType === "text"
                ? "bg-orange-500 text-white animate-pulse ring-2 ring-orange-400/50 shadow-orange-500/30"
                : "bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 backdrop-blur-md"
            }`}
          >
            <Type className="w-3.5 h-3.5 text-orange-400" />
            <span>+ Add Text</span>
          </button>

          {/* Quick Add Logo */}
          <button
            type="button"
            onClick={() => onStartAddZone("image")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-lg ${
              zoneCreationType === "image"
                ? "bg-purple-600 text-white animate-pulse ring-2 ring-purple-400/50 shadow-purple-500/30"
                : "bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 backdrop-blur-md"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
            <span>+ Add Logo</span>
          </button>

          {/* Active Material / Part Pill */}
          {activeMaterial && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 border border-cyan-500/40 backdrop-blur-md rounded-xl shadow-md shadow-cyan-500/10">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[10px] font-mono text-cyan-200 truncate max-w-[140px]">
                {activeMaterial}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── QUICK VARIATION PART SELECTOR (BELOW TOP ACTIONS) ── */}
      {formattedParts.length > 0 && !isDrawingZone && !isPickingMaterial && (
        <div className="absolute top-16 left-4 z-10 flex items-center gap-1.5 p-1 bg-slate-950/80 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-xl overflow-x-auto max-w-[calc(100%-2rem)]">
          <div className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>Parts</span>
          </div>
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
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold tracking-wide transition-all flex-shrink-0 ${
                  isSelected
                    ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/30 ring-1 ring-cyan-300"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <span>{part.icon}</span>
                <span>{part.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── CAMERA ANGLE PRESETS (TOP-RIGHT) ── */}
      <div className="absolute top-4 right-4 z-10 flex items-center bg-slate-950/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1 shadow-xl">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSetCameraCommand("front")}
            className="px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => onSetCameraCommand("back")}
            className="px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => onSetCameraCommand("left")}
            className="px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            Left
          </button>
          <button
            type="button"
            onClick={() => onSetCameraCommand("right")}
            className="px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            Right
          </button>
          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
          <button
            type="button"
            onClick={() => onSetCameraCommand("reset")}
            title="Reset Camera View"
            className="p-1.5 rounded-xl text-slate-400 hover:text-orange-400 hover:bg-slate-800 transition-all"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── 2-STEP ZONE CREATION GUIDANCE BANNER ── */}
      {zoneCreationType && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900/95 border border-orange-500/60 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping" />
          <span>
            {isPickingMaterial
              ? `Step 1 of 2: Rotate model if needed, then click the part of the shirt to place ${
                  zoneCreationType === "text" ? "text" : "logo"
                }`
              : `Step 2 of 2: Drag a box on ${
                  activeMaterial || "the shirt"
                } to define your ${zoneCreationType === "text" ? "text" : "logo"} area`}
          </span>
          {!isPickingMaterial && isDrawingZone && (
            <button
              type="button"
              onClick={onBackToPicking}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-orange-300 rounded-lg text-[10px] font-black uppercase transition-colors"
            >
              Change Part
            </button>
          )}
          <button
            type="button"
            onClick={onCancelCreation}
            className="ml-2 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-black uppercase transition-colors"
          >
            Cancel (Esc)
          </button>
        </div>
      )}
    </>
  );
}
