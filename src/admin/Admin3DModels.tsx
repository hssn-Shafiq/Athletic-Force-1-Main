"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Center, Environment } from "@react-three/drei";
import {
  ChevronLeft, Save, Loader, Box, Upload, X,
  Type, Image as ImageIcon, Sparkles, Layers, Sliders,
} from "lucide-react";

import { PrintZone, RaycastResult } from "./3d-models/types";
import { useAdmin3DModel } from "./3d-models/hooks/useAdmin3DModel";
import { ModelListView } from "./3d-models/components/ModelListView";
import { ProductSelectorView } from "./3d-models/components/ProductSelectorView";
import { ModelTopToolbar } from "./3d-models/components/ModelTopToolbar";
import { InnerCanvas } from "./3d-models/components/InnerCanvas";
import { DrawZoneOverlay } from "./3d-models/components/DrawZoneOverlay";
import { ZoneCard } from "./3d-models/components/ZoneCard";
import { Canvas3DLoaderOverlay, Canvas3DInnerFallback } from "./3d-models/components/Canvas3DLoader";
import { categorizeModelPart } from "./3d-models/utils/partUtils";
import { AdminProduct } from "@/lib/api/types";

// Re-export types for backward compatibility
export type { PrintZone, RaycastResult };

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
        <div className="flex flex-col gap-3 h-[calc(100vh-140px)] min-h-[580px]">
          {/* Header */}
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
                  {materials.length} materials
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50 shadow-lg"
            >
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="flex gap-4 flex-1 min-h-0">
            {/* ── 3D CANVAS VIEWPORT ── */}
            <div
              ref={canvasWrapRef}
              className="flex-1 min-h-0 bg-[#06060e] rounded-3xl overflow-hidden relative shadow-2xl"
            >
              {previewUrl && (
                <ModelTopToolbar
                  zoneCreationType={zoneCreationType}
                  isPickingMaterial={isPickingMaterial}
                  isDrawingZone={isDrawingZone}
                  activeMaterial={activeMaterial}
                  onStartAddZone={startAddZone}
                  onCancelCreation={cancelZoneCreation}
                  onBackToPicking={backToPicking}
                  onSetCameraCommand={(cmd) => setCameraCommand(cmd)}
                />
              )}

              {/* Upload screen if no model loaded */}
              {!previewUrl ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8">
                  <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Box className="w-10 h-10 text-white/20" />
                  </div>
                  <p className="text-white/40 text-xs uppercase tracking-widest font-bold">
                    Load a GLB / GLTF model
                  </p>
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
                  <p className="text-white/20 text-[10px] uppercase tracking-widest">— or —</p>
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
                </div>
              ) : (
                <>
                  <Canvas
                    key={modelKey}
                    dpr={[1, 2]}
                    camera={{ position: [0, 0, 5], fov: 45 }}
                    gl={{ preserveDrawingBuffer: true, antialias: true }}
                    style={{ width: "100%", height: "90%" }}
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
                        enabled={!isDrawingZone && !isRepositioning && !isDragging}
                      />
                    </Suspense>
                  </Canvas>

                  {/* Drag to Reposition Active Banner */}
                  {isRepositioning && activeZone && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-orange-600/90 text-white backdrop-blur-md px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2.5 animate-pulse border border-orange-400/40 pointer-events-auto">
                      <span>Drag Mode Active: Click & hold anywhere on model to move</span>
                      <button
                        type="button"
                        onClick={() => setIsRepositioning(false)}
                        className="ml-3 px-2.5 py-1 bg-black/40 hover:bg-black/60 rounded-lg text-[9px] font-black uppercase transition-colors"
                      >
                        Done (Esc)
                      </button>
                    </div>
                  )}

                  {/* Canvas Top Toolbar: actions, part variation pills, camera presets */}
                  <ModelTopToolbar
                    zoneCreationType={zoneCreationType}
                    isPickingMaterial={isPickingMaterial}
                    isDrawingZone={isDrawingZone}
                    activeMaterial={activeMaterial}
                    activeMeshName={activeMeshName}
                    materials={materials}
                    onStartAddZone={startAddZone}
                    onCancelCreation={cancelZoneCreation}
                    onBackToPicking={backToPicking}
                    onSetCameraCommand={setCameraCommand}
                    onSelectPart={selectPart}
                  />

                  {/* Draw zone overlay */}
                  <DrawZoneOverlay
                    canvasRef={canvasWrapRef}
                    isDrawing={isDrawingZone}
                    onRectDrawn={handleRectDrawn}
                    onCancel={() => setIsDrawingZone(false)}
                  />
                </>
              )}

              {/* 3D Model Loading Progress Overlay */}
              {previewUrl && (
                <Canvas3DLoaderOverlay isModelLoading={isModelLoading} />
              )}

              {/* Status bar */}
              {previewUrl && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <div className="flex gap-2">
                    {activeMaterial && (
                      <div className="bg-orange-500/90 backdrop-blur rounded-xl px-3 py-1.5">
                        <p className="text-white text-[10px] font-black uppercase tracking-widest">
                          ● {activeMaterial}
                        </p>
                      </div>
                    )}
                    <div className="bg-black/60 backdrop-blur rounded-xl px-3 py-1.5">
                      <p className="text-white text-[10px] font-black uppercase tracking-widest">
                        {zones.length} zones
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(null);
                      resetEditor();
                    }}
                    className="pointer-events-auto p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div className="w-[360px] flex-shrink-0 bg-white border border-slate-200/90 rounded-3xl p-5 flex flex-col shadow-sm min-h-0">
              {/* Segmented Tabs */}
              <div className="flex bg-slate-100 border border-slate-200/80 rounded-2xl p-1 mb-4 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSidebarTab("zones")}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    sidebarTab === "zones"
                      ? "bg-orange-500 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Zones ({zones.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab("materials")}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    sidebarTab === "materials"
                      ? "bg-cyan-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Parts ({materials.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab("settings")}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    sidebarTab === "settings"
                      ? "bg-orange-500 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Model</span>
                </button>
              </div>

              {/* Tab 1: Zones */}
              {sidebarTab === "zones" && (
                <div className="flex-1 flex flex-col min-h-0 space-y-4">
                  {/* Quick Add Buttons */}
                  <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => startAddZone("text")}
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
                      onClick={() => startAddZone("image")}
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
                        <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
                          Click "+ Add Text" or "+ Add Logo", select the part of the shirt, then draw the area to place it.
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

              {/* Tab 2: Parts & Variations */}
              {sidebarTab === "materials" && (
                <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-3">
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200/70 rounded-2xl p-3.5 mb-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-cyan-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                      Variations & Parts ({materials.length})
                    </h4>
                    <p className="text-[11px] text-cyan-800/90 mt-1 leading-relaxed">
                      Click any variation to auto-align the camera and illuminate that part with a gentle studio glow.
                    </p>
                  </div>

                  {materials.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No shirt parts detected yet. Load a 3D model first.
                    </div>
                  ) : (
                    materials.map((mat) => {
                      const part = categorizeModelPart(mat.name, mat.originalColor, mat.meshName);
                      const isSelected =
                        activeMaterial === mat.name ||
                        (activeMeshName && activeMeshName === mat.meshName);
                      const partZones = zones.filter(
                        (z) => z.materialName === mat.name || (mat.meshName && z.meshName === mat.meshName)
                      );

                      return (
                        <div
                          key={mat.name}
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
                                    style={{ backgroundColor: mat.originalColor }}
                                    title={`Color: ${mat.originalColor}`}
                                  />
                                  <span className="text-[9px] font-mono text-slate-400 truncate max-w-[140px]">
                                    {mat.name}
                                  </span>
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
                                onClick={() =>
                                  startAddZoneOnPart("text", mat.name, mat.meshName, part.cameraCommand)
                                }
                                className="flex-1 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1"
                              >
                                <Type className="w-3 h-3" />
                                + Add Text Here
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  startAddZoneOnPart("image", mat.name, mat.meshName, part.cameraCommand)
                                }
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

              {/* Tab 3: Model Settings */}
              {sidebarTab === "settings" && (
                <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">
                      Status
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingModel((p) => ({ ...p, isActive: !p?.isActive }))
                      }
                      className={`w-full py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${
                        editingModel?.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {editingModel?.isActive ? "Active (Visible on Store)" : "Draft (Hidden)"}
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">
                      Description
                    </label>
                    <textarea
                      rows={3}
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}