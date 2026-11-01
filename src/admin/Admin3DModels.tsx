"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Center, Environment } from "@react-three/drei";
import {
  ChevronLeft, Save, Loader, Box, Upload,
  Type, Image as ImageIcon, Sparkles, Layers, Sliders,
  Check, Info, Move, Pencil,
} from "lucide-react";
import { ATHLETIC_COLOR_PRESETS } from "@/lib/3d/colors";

import { PrintZone, RaycastResult } from "./3d-models/types";
import { useAdmin3DModel } from "./3d-models/hooks/useAdmin3DModel";
import { ModelListView } from "./3d-models/components/ModelListView";
import { ProductSelectorView } from "./3d-models/components/ProductSelectorView";
import { ModelTopBar, ModelBottomBar } from "./3d-models/components/ModelTopToolbar";
import { InnerCanvas } from "./3d-models/components/InnerCanvas";
import { DrawZoneOverlay } from "./3d-models/components/DrawZoneOverlay";
import { ZoneCard } from "./3d-models/components/ZoneCard";
import { Canvas3DLoaderOverlay, Canvas3DInnerFallback } from "./3d-models/components/Canvas3DLoader";
import { categorizeModelPart } from "./3d-models/utils/partUtils";
import { AdminProduct } from "@/lib/api/types";

// Re-export types for backward compatibility
export type { PrintZone, RaycastResult };

/* ────────────────────────────────────────────────────────────────
   Small presentational helpers (local to this file)
   ──────────────────────────────────────────────────────────────── */

const WORKFLOW_STEPS = [
  { label: "Load model", hint: "Upload a .glb" },
  { label: "Set colors", hint: "Optional" },
  { label: "Add print zones", hint: "Text & logos" },
  { label: "Save", hint: "Publish when ready" },
];

function WorkflowStepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0 bg-white border border-slate-200/90 rounded-2xl px-3 py-2 shadow-sm overflow-x-auto">
      {WORKFLOW_STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={step.label}>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                    ? "bg-orange-500 text-white ring-4 ring-orange-100"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <div className="leading-tight">
                <div
                  className={`text-[11px] font-black uppercase tracking-wider ${
                    active ? "text-slate-900" : done ? "text-emerald-700" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </div>
                <div className="text-[9px] text-slate-400 font-semibold">{step.hint}</div>
              </div>
            </div>
            {i < WORKFLOW_STEPS.length - 1 && (
              <div
                className={`flex-1 min-w-[16px] h-0.5 rounded-full mx-1 ${
                  i < current ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

type GuideTone = "info" | "action" | "edit" | "success";

function GuideBanner({
  tone,
  icon,
  title,
  text,
  actionLabel,
  onAction,
}: {
  tone: GuideTone;
  icon: React.ReactNode;
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const toneClasses: Record<GuideTone, string> = {
    info: "bg-slate-800/80 border-slate-700 text-slate-100",
    action: "bg-orange-500/15 border-orange-500/40 text-orange-100",
    edit: "bg-cyan-500/15 border-cyan-500/40 text-cyan-100",
    success: "bg-emerald-500/15 border-emerald-500/40 text-emerald-100",
  };
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 border-b flex-shrink-0 ${toneClasses[tone]}`}
    >
      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-black uppercase tracking-widest opacity-70">{title}</div>
        <div className="text-xs font-semibold leading-snug">{text}</div>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex-shrink-0"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────────────────────────── */

export default function Admin3DModels({
  initialView = "list",
}: {
  initialView?: "list" | "select_product" | "editor";
}) {
  const {
    models,
    loadingModels,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    pagination,
    view,
    setView,
    editingModel,
    setEditingModel,
    zones,
    defaultColors,
    setDefaultColors,
    materials,
    activeMaterial,
    setActiveMaterial,
    activeMeshName,
    activeZoneId,
    setActiveZoneId,
    activeZone,
    isPickingMaterial,
    isDrawingZone,
    setIsDrawingZone,
    isRepositioning,
    setIsRepositioning,
    isDragging,
    setIsDragging,
    zoneCreationType,
    cameraCommand,
    setCameraCommand,
    sidebarTab,
    setSidebarTab,
    pendingRect,
    logoMap,
    uploadingLogoZoneId,
    previewUrl,
    setPreviewUrl,
    modelUrlInput,
    setModelUrlInput,
    modelKey,
    isModelLoading,
    saving,
    toast,
    glbInputRef,
    canvasWrapRef,
    modelSceneRef,
    openEditor,
    resetEditor,
    loadModel,
    handleGlbFile,
    handleMaterialsFound,
    handleMaterialPicked,
    selectPart,
    startAddZoneOnPart,
    handleRectDrawn,
    handleRaycastDone,
    startAddZone,
    cancelZoneCreation,
    backToPicking,
    selectZone,
    updateZone,
    deleteZone,
    handleLogoUpload,
    scaleZone,
    setZoneDimensions,
    setZoneRotationZ,
    nudgeZone,
    handleZoneReposition,
    handleSave,
    handleDelete,
  } = useAdmin3DModel(initialView);

  /* ── Derived UI state (no changes to the hook needed) ── */
  const hasModel = !!previewUrl;
  const currentStep = !hasModel ? 0 : zones.length === 0 ? 2 : 3;

  // Wrapper: always jump to the Zones tab when the admin starts adding a zone,
  // so they never have to hunt for the right tab.
  const handleStartAddZone = (type: Parameters<typeof startAddZone>[0]) => {
    setSidebarTab("zones");
    startAddZone(type);
  };

  const zoneTypeLabel = zoneCreationType === "image" ? "logo" : "text";

  // Decide which guidance message to show above the canvas.
  const renderGuide = () => {
    if (isModelLoading) {
      return (
        <GuideBanner
          tone="info"
          icon={<Loader className="w-4 h-4 animate-spin" />}
          title="Please wait"
          text="Loading your 3D model..."
        />
      );
    }
    if (isRepositioning && activeZone) {
      return (
        <GuideBanner
          tone="action"
          icon={<Move className="w-4 h-4" />}
          title="Move mode"
          text={`Click and hold on the model to drag "${activeZone.label}" to a new position.`}
          actionLabel="Done (Esc)"
          onAction={() => setIsRepositioning(false)}
        />
      );
    }
    if (zoneCreationType && isPickingMaterial) {
      return (
        <GuideBanner
          tone="action"
          icon={<Pencil className="w-4 h-4" />}
          title={`Adding ${zoneTypeLabel} · Step 1 of 2`}
          text={`Click the part of the model where the ${zoneTypeLabel} should go (e.g. chest, sleeve, back).`}
          actionLabel="Cancel"
          onAction={cancelZoneCreation}
        />
      );
    }
    if (zoneCreationType && isDrawingZone) {
      return (
        <GuideBanner
          tone="action"
          icon={<Pencil className="w-4 h-4" />}
          title={`Adding ${zoneTypeLabel} · Step 2 of 2`}
          text={`Click and drag on the highlighted part to draw the area for your ${zoneTypeLabel}.`}
          actionLabel="Cancel"
          onAction={cancelZoneCreation}
        />
      );
    }
    if (activeZone) {
      return (
        <GuideBanner
          tone="edit"
          icon={<Layers className="w-4 h-4" />}
          title="Editing zone"
          text={`"${activeZone.label}" is selected. Use its card in the Zones tab to resize, rotate, move or change its content.`}
          actionLabel="Deselect"
          onAction={() => setActiveZoneId(null)}
        />
      );
    }
    if (zones.length === 0) {
      return (
        <GuideBanner
          tone="info"
          icon={<Info className="w-4 h-4" />}
          title="What to do now"
          text="Optional: set default colors in the Parts tab. Then click + Add Text or + Add Logo to create your first print zone."
        />
      );
    }
    return (
      <GuideBanner
        tone="success"
        icon={<Check className="w-4 h-4" />}
        title="Looking good"
        text={`You have ${zones.length} print ${zones.length === 1 ? "zone" : "zones"}. Click a zone to edit it, add more, or press Save when you're done.`}
      />
    );
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[300] px-5 py-3 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-2xl ${
            toast.ok ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {view === "list" ? (
        <ModelListView
          models={models}
          loading={loadingModels}
          page={page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={limit}
          search={search}
          statusFilter={statusFilter}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onPageChange={setPage}
          onOpenEditor={(m) => {
            if (m) {
              openEditor(m);
            } else {
              setView("select_product");
            }
          }}
          onDelete={handleDelete}
        />
      ) : view === "select_product" ? (
        <ProductSelectorView
          onSelectProduct={(p: AdminProduct) => {
            openEditor(undefined, {
              id: p.id,
              name: p.name,
              slug: p.slug,
              mainImageUrl: p.mainImageUrl,
            });
          }}
          onCancel={() => setView("list")}
        />
      ) : (
        /* ── EDITOR VIEW ── */
        <div className="flex flex-col gap-3 h-[calc(100vh-140px)] min-h-[800px]">
          {/* Header: name, link, status, save — everything "global" lives here */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setView("list")}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
              title="Back to All Models"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <input
                value={editingModel?.name || ""}
                onChange={(e) => setEditingModel((p) => ({ ...p, name: e.target.value }))}
                className="text-xl font-black italic uppercase tracking-tighter text-slate-900 bg-transparent border-b-2 border-transparent focus:border-orange-500 outline-none w-full"
                placeholder="Model Name..."
              />
              {editingModel?.product && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Linked to: {editingModel.product.name}
                  </span>
                </div>
              )}
            </div>

            {isModelLoading && (
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl">
                <Loader className="w-3.5 h-3.5 animate-spin text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Loading...
                </span>
              </div>
            )}
            {!isModelLoading && materials.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">
                  {materials.length} parts
                </span>
              </div>
            )}

            {/* Status toggle (moved here from the Model tab) */}
            <button
              type="button"
              onClick={() => setEditingModel((p) => ({ ...p, isActive: !p?.isActive }))}
              title="Click to toggle between Active (visible on store) and Draft (hidden)"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider border transition-all ${
                editingModel?.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  editingModel?.isActive ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
              {editingModel?.isActive ? "Active · Visible" : "Draft · Hidden"}
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50 shadow-lg"
            >
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
            </button>
          </div>

          {/* Progress stepper */}
          <WorkflowStepper current={currentStep} />

          <div className="flex gap-4 flex-1 min-h-0">
            {/* ── 3D CANVAS VIEWPORT ── */}
            <div className="flex-1 min-h-0 bg-[#06060e] rounded-3xl overflow-hidden relative shadow-2xl flex flex-col border border-slate-800/80">
              {/* Upload screen if no model loaded */}
              {!previewUrl ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
                  <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Box className="w-10 h-10 text-white/20" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-white/70 text-sm uppercase tracking-widest font-black">
                      Step 1 · Load your 3D model
                    </p>
                    <p className="text-white/30 text-[11px]">
                      Supports .glb and .gltf files. Upload from your computer or paste a link.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => glbInputRef.current?.click()}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl text-white text-xs font-black uppercase tracking-wider hover:border-orange-500/50 hover:bg-white/10 transition-all"
                  >
                    <Upload className="w-4 h-4" /> Upload .glb File
                  </button>
                  <input
                    ref={glbInputRef}
                    type="file"
                    accept=".glb,.gltf"
                    className="hidden"
                    onChange={handleGlbFile}
                  />

                  <p className="text-white/20 text-[10px] uppercase tracking-widest">— or paste a link —</p>
                  <div className="flex gap-2 w-full max-w-sm">
                    <input
                      type="text"
                      placeholder="Paste .glb URL..."
                      value={modelUrlInput}
                      onChange={(e) => setModelUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && modelUrlInput.trim()) loadModel(modelUrlInput.trim());
                      }}
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-xs placeholder-white/30 focus:border-orange-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => loadModel(modelUrlInput.trim())}
                      disabled={!modelUrlInput.trim()}
                      className="px-4 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-orange-600 disabled:opacity-40 transition-all"
                    >
                      Load
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Top Bar - separate header above the 3D canvas */}
                  <ModelTopBar
                    zoneCreationType={zoneCreationType}
                    isPickingMaterial={isPickingMaterial}
                    isDrawingZone={isDrawingZone}
                    activeMaterial={activeMaterial}
                    onStartAddZone={handleStartAddZone}
                    onCancelCreation={cancelZoneCreation}
                    onBackToPicking={backToPicking}
                    onSetCameraCommand={setCameraCommand}
                  />

                  {/* Contextual "what to do now" guide */}
                  {renderGuide()}

                  {/* 3D Canvas Viewport - strictly bounded between top and bottom bars */}
                  <div
                    ref={canvasWrapRef}
                    className="flex-1 relative w-full h-full min-h-0 overflow-hidden"
                  >
                    <Canvas
                      key={modelKey}
                      dpr={[1, 2]}
                      frameloop="demand"
                      camera={{ position: [0, 0, 2.8], fov: 45 }}
                      gl={{ preserveDrawingBuffer: true, antialias: true }}
                      style={{ width: "100%", height: "100%" }}
                    >
                      <color attach="background" args={["#06060e"]} />
                      <Suspense fallback={<Canvas3DInnerFallback />}>
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
                            defaultColors={defaultColors}
                            activeMeshName={activeMeshName}
                            activeZoneId={activeZoneId}
                            isPickingMaterial={isPickingMaterial}
                            isDrawingZone={isDrawingZone}
                            isRepositioning={isRepositioning}
                            isDragging={isDragging}
                            setIsDragging={setIsDragging}
                            onMaterialPicked={handleMaterialPicked}
                            onMaterialsFound={handleMaterialsFound}
                            onZoneSelect={(id) => selectZone(id)}
                            onZoneReposition={handleZoneReposition}
                            pendingRect={pendingRect}
                            onRaycastDone={handleRaycastDone}
                            modelSceneRef={modelSceneRef}
                            cameraCommand={cameraCommand}
                            onCameraCommandHandled={() => setCameraCommand(null)}
                            onPartClick={(matName, meshName) => {
                              const part = categorizeModelPart(matName, undefined, meshName);
                              selectPart(matName, meshName, part.cameraCommand);
                            }}
                          />
                        </Center>
                        <OrbitControls
                          makeDefault
                          enablePan={false}
                          enableDamping
                          minDistance={1.2}
                          maxDistance={2.6}
                          enabled={!isDrawingZone && !isRepositioning && !isDragging}
                        />
                      </Suspense>
                    </Canvas>

                    {/* Draw zone overlay */}
                    <DrawZoneOverlay
                      canvasRef={canvasWrapRef}
                      isDrawing={isDrawingZone}
                      zoneCreationType={zoneCreationType}
                      onRectDrawn={handleRectDrawn}
                      onCancel={() => setIsDrawingZone(false)}
                    />

                    {/* 3D Model Loading Progress Overlay */}
                    <Canvas3DLoaderOverlay isModelLoading={isModelLoading} />
                  </div>

                  {/* Bottom Bar - separate footer below the 3D canvas */}
                  <ModelBottomBar
                    materials={materials}
                    activeMaterial={activeMaterial}
                    activeMeshName={activeMeshName}
                    zonesCount={zones.length}
                    onSelectPart={selectPart}
                    onClosePreview={() => {
                      setPreviewUrl(null);
                      resetEditor();
                    }}
                  />
                </>
              )}
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div className="w-[380px] flex-shrink-0 bg-white border border-slate-200/90 rounded-3xl p-5 flex flex-col shadow-sm min-h-0">
              {/* Numbered tabs in workflow order: Parts → Zones → Details */}
              <div className="flex bg-slate-100 border border-slate-200/80 rounded-2xl p-1 mb-4 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSidebarTab("materials")}
                  className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    sidebarTab === "materials"
                      ? "bg-cyan-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1 · Parts ({materials.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab("zones")}
                  className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    sidebarTab === "zones"
                      ? "bg-orange-500 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>2 · Zones ({zones.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab("settings")}
                  className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    sidebarTab === "settings"
                      ? "bg-slate-800 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>3 · Details</span>
                </button>
              </div>

              {/* No model yet: one clear message instead of empty tabs */}
              {!hasModel && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <Box className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-slate-900">
                      Load a model first
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-[260px]">
                      Once your 3D model is loaded, its parts, colors and print zones will appear here.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 1: Parts & default colors */}
              {hasModel && sidebarTab === "materials" && (
                <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-3">
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200/70 rounded-2xl p-3.5 mb-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-cyan-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                      Parts & Default Colors
                    </h4>
                    <p className="text-[11px] text-cyan-800/90 mt-1 leading-relaxed">
                      Click a part to highlight it on the model. Pick a swatch to set the color customers see by default. You can also add text or a logo directly on the selected part.
                    </p>
                  </div>

                  {materials.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No parts detected yet. Please wait for the model to finish loading.
                    </div>
                  ) : (
                    materials.map((mat, matIndex) => {
                      const part = categorizeModelPart(mat.name, mat.originalColor, mat.meshName);
                      const isSelected =
                        activeMaterial === mat.name ||
                        (activeMeshName && activeMeshName === mat.meshName);
                      const partZones = zones.filter(
                        (z) => z.materialName === mat.name || (mat.meshName && z.meshName === mat.meshName)
                      );

                      return (
                        <div
                          key={`${mat.name}-${mat.meshName ?? matIndex}`}
                          onClick={() => selectPart(mat.name, mat.meshName, part.cameraCommand)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                            isSelected
                              ? "border-cyan-500 bg-cyan-50/40 ring-2 ring-cyan-400/40 shadow-md shadow-cyan-500/10"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 transition-transform group-hover:scale-105 shadow-2xs ${
                                  isSelected
                                    ? "bg-cyan-500 text-white shadow-cyan-500/30"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                {part.icon}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-black uppercase text-slate-900 truncate">
                                    {part.label}
                                  </h4>
                                  {partZones.length > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-orange-100 text-orange-700">
                                      {partZones.length} {partZones.length === 1 ? "zone" : "zones"}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {part.description}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <div
                                    className="w-3 h-3 rounded-full border border-slate-300 shadow-2xs flex-shrink-0"
                                    style={{ backgroundColor: defaultColors[mat.name] || mat.originalColor }}
                                    title={`Default color: ${defaultColors[mat.name] || mat.originalColor}`}
                                  />
                                  <span className="text-[9px] font-mono text-slate-400 truncate max-w-[140px]">
                                    {mat.name}
                                  </span>
                                </div>
                                <div
                                  className="flex flex-wrap gap-1.5 mt-2 max-w-[220px]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {ATHLETIC_COLOR_PRESETS.map((color, index) => {
                                    const selectedColor = (
                                      defaultColors[mat.name] ||
                                      mat.originalColor ||
                                      ""
                                    ).toLowerCase();
                                    const isActiveColor = selectedColor === color.hex.toLowerCase();
                                    return (
                                      <button
                                        key={`${color.hex}-${index}`}
                                        type="button"
                                        title={`${color.name} (${color.hex})`}
                                        aria-label={`Set ${mat.name} default color to ${color.name}`}
                                        aria-pressed={isActiveColor}
                                        onClick={() =>
                                          setDefaultColors((current) => ({
                                            ...current,
                                            [mat.name]: color.hex,
                                          }))
                                        }
                                        className={`h-5 w-5 rounded-md border transition-transform hover:scale-110 ${
                                          isActiveColor
                                            ? "border-orange-500 ring-2 ring-orange-300 scale-110"
                                            : "border-slate-300"
                                        }`}
                                        style={{ backgroundColor: color.hex }}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Status Tag */}
                            <div className="flex-shrink-0">
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                  Active
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-cyan-600 transition-colors">
                                  Select →
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick Add Buttons on Selected Part */}
                          {isSelected && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="mt-3 pt-3 border-t border-cyan-200/60 flex items-center gap-2 animate-in fade-in"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSidebarTab("zones");
                                  startAddZoneOnPart("text", mat.name, mat.meshName, part.cameraCommand);
                                }}
                                className="flex-1 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1"
                              >
                                <Type className="w-3 h-3" />
                                + Add Text Here
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSidebarTab("zones");
                                  startAddZoneOnPart("image", mat.name, mat.meshName, part.cameraCommand);
                                }}
                                className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1"
                              >
                                <ImageIcon className="w-3 h-3" />
                                + Add Logo Here
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 2: Print Zones */}
              {hasModel && sidebarTab === "zones" && (
                <div className="flex-1 flex flex-col min-h-0 space-y-4">
                  {/* Add buttons */}
                  <div className="flex-shrink-0 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartAddZone("text")}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all shadow-xs ${
                          zoneCreationType === "text"
                            ? "bg-orange-500 text-white ring-2 ring-orange-400 animate-pulse shadow-md shadow-orange-500/25"
                            : "bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/90 hover:border-orange-300"
                        }`}
                      >
                        <Type className="w-3.5 h-3.5 text-orange-500" />
                        <span>
                          {zoneCreationType === "text"
                            ? isPickingMaterial
                              ? "1. Select Part"
                              : "2. Draw Area"
                            : "+ Add Text"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartAddZone("image")}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all shadow-xs ${
                          zoneCreationType === "image"
                            ? "bg-purple-600 text-white ring-2 ring-purple-400 animate-pulse shadow-md shadow-purple-500/25"
                            : "bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/90 hover:border-purple-300"
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                        <span>
                          {zoneCreationType === "image"
                            ? isPickingMaterial
                              ? "1. Select Part"
                              : "2. Draw Area"
                            : "+ Add Logo"}
                        </span>
                      </button>
                    </div>

                    {zoneCreationType && (
                      <button
                        type="button"
                        onClick={cancelZoneCreation}
                        className="w-full py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        Cancel adding {zoneTypeLabel}
                      </button>
                    )}
                  </div>

                  {/* Selected Zone Active Banner */}
                  {activeZone && (
                    <div className="bg-orange-50 border border-orange-200/80 rounded-2xl p-3 flex items-center justify-between flex-shrink-0 animate-in fade-in">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[9px] font-black uppercase tracking-widest text-orange-600 block">
                            Editing Selected Zone
                          </span>
                          <span className="text-xs font-black text-slate-900 truncate block">
                            {activeZone.label}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveZoneId(null)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors flex-shrink-0 shadow-2xs"
                      >
                        Deselect
                      </button>
                    </div>
                  )}

                  {/* Zones List or Empty State */}
                  {zones.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase text-slate-900">
                          No Print Zones Yet
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-[260px]">
                          A print zone is an area where customers can add text or a logo.
                          Click &quot;+ Add Text&quot; or &quot;+ Add Logo&quot;, select a part of the shirt, then draw the area.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 overflow-y-auto min-h-0 flex-1 pr-1">
                      {zones.map((zone) => (
                        <ZoneCard
                          key={zone.id}
                          zone={zone}
                          isActive={activeZoneId === zone.id}
                          isRepositioning={isRepositioning}
                          isUploadingLogo={uploadingLogoZoneId === zone.id}
                          onSelect={() => selectZone(zone.id)}
                          onToggleReposition={() => {
                            selectZone(zone.id);
                            setIsRepositioning((prev) => (activeZoneId === zone.id ? !prev : true));
                          }}
                          onDelete={() => deleteZone(zone.id)}
                          onChange={(patch) => updateZone(zone.id, patch)}
                          onLogoUpload={(file) => handleLogoUpload(zone.id, file)}
                          onScale={(factor) => scaleZone(zone.id, factor)}
                          onSetDimensions={(w, h, lock) => setZoneDimensions(zone.id, w, h, lock)}
                          onSetRotation={(deg) => setZoneRotationZ(zone.id, deg)}
                          onNudge={(dir, mult) => nudgeZone(zone.id, dir, mult)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Model Details */}
              {hasModel && sidebarTab === "settings" && (
                <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-5">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-slate-600" />
                      Model Details
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Name and visibility are at the top of the page. Here you can add a description or replace the 3D file.
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      value={editingModel?.description || ""}
                      onChange={(e) =>
                        setEditingModel((p) => ({ ...p, description: e.target.value }))
                      }
                      placeholder="Optional model description..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:bg-white outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">
                      Model Source URL
                    </label>
                    <input
                      type="text"
                      value={modelUrlInput}
                      onChange={(e) => setModelUrlInput(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:bg-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (modelUrlInput.trim()) loadModel(modelUrlInput.trim());
                      }}
                      className="mt-2 w-full py-2 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                    >
                      Reload Model
                    </button>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null);
                        resetEditor();
                      }}
                      className="w-full py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                    >
                      Remove model & start over
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}