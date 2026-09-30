import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import * as THREE from "three";
import { apiClient } from "@/lib/api/client";
import {
  Model3D,
  PrintZone,
  MaterialInfo,
  DrawRect,
  RaycastResult,
} from "../types";
import {
  computeDecalRotationFromNormal,
  normalizeZone,
  getCameraDirectionForZone,
} from "../utils/decalUtils";

export function useAdmin3DModel(initialView: "list" | "select_product" | "editor" = "list") {
  const [models, setModels] = useState<Model3D[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">("all");
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [view, setView] = useState<"list" | "select_product" | "editor">(initialView);
  const [editingModel, setEditingModel] = useState<Partial<Model3D> | null>(null);
  const [zones, setZones] = useState<PrintZone[]>([]);
  const [materials, setMaterials] = useState<MaterialInfo[]>([]);
  const [activeMaterial, setActiveMaterial] = useState<string | null>(null);
  const [activeMeshName, setActiveMeshName] = useState<string | null>(null);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [isPickingMaterial, setIsPickingMaterial] = useState(false);
  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [zoneCreationType, setZoneCreationType] = useState<"text" | "image" | null>(null);
  const [cameraCommand, setCameraCommand] = useState<"front" | "back" | "left" | "right" | "reset" | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"zones" | "materials" | "settings">("zones");
  const [pendingRect, setPendingRect] = useState<DrawRect | null>(null);
  const [logoMap, setLogoMap] = useState<Record<string, HTMLImageElement>>({});
  const [uploadingLogoZoneId, setUploadingLogoZoneId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [modelUrlInput, setModelUrlInput] = useState("");
  const [modelKey, setModelKey] = useState(0);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const glbInputRef = useRef<HTMLInputElement>(null);
  const glbFileRef = useRef<File | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  /** Holds the cloned model scene so raycast targets ONLY model meshes */
  const modelSceneRef = useRef<THREE.Object3D | null>(null);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchModels = useCallback(
    async (overrides?: { page?: number; limit?: number; search?: string; status?: string }) => {
      setLoadingModels(true);
      try {
        const curPage = overrides?.page ?? page;
        const curLimit = overrides?.limit ?? limit;
        const curSearch = overrides?.search !== undefined ? overrides.search : search;
        const curStatus = overrides?.status ?? statusFilter;

        const params: any = { page: curPage, limit: curLimit };
        if (curSearch.trim()) params.search = curSearch.trim();
        if (curStatus !== "all") params.status = curStatus;

        const { data } = await apiClient.get("/api/admin/3d-models", { params });
        if (data.ok) {
          setModels(data.models || []);
          if (data.pagination) setPagination(data.pagination);
        }
      } catch {
        /* silent */
      } finally {
        setLoadingModels(false);
      }
    },
    [page, limit, search, statusFilter]
  );

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const resetEditor = useCallback(() => {
    setMaterials([]);
    setActiveMaterial(null);
    setActiveMeshName(null);
    setActiveZoneId(null);
    setIsPickingMaterial(false);
    setIsDrawingZone(false);
    setIsRepositioning(false);
    setIsDragging(false);
    setZoneCreationType(null);
    setCameraCommand(null);
    setSidebarTab("zones");
    setPendingRect(null);
    setLogoMap({});
  }, []);

  const selectZone = useCallback((id: string) => {
    setActiveZoneId(id);
    const z = zones.find((item) => item.id === id);
    if (z?.materialName) setActiveMaterial(z.materialName);
    if (z?.meshName) setActiveMeshName(z.meshName);
    setSidebarTab("zones");

    if (z) {
      const dir = getCameraDirectionForZone(z);
      if (dir) setCameraCommand(dir);
    }
  }, [zones]);

  const startAddZone = useCallback((type: "text" | "image") => {
    if (zoneCreationType === type && isPickingMaterial) {
      setZoneCreationType(null);
      setIsPickingMaterial(false);
      setIsDrawingZone(false);
      return;
    }
    setZoneCreationType(type);
    setIsPickingMaterial(true);
    setIsDrawingZone(false);
    setIsRepositioning(false);
    setActiveZoneId(null);
    showToast(`Step 1: Rotate model if needed, then click the part to place ${type === "text" ? "text" : "a logo"}`);
  }, [zoneCreationType, isPickingMaterial, showToast]);

  const cancelZoneCreation = useCallback(() => {
    setZoneCreationType(null);
    setIsPickingMaterial(false);
    setIsDrawingZone(false);
    setActiveMeshName(null);
  }, []);

  const backToPicking = useCallback(() => {
    setIsPickingMaterial(true);
    setIsDrawingZone(false);
  }, []);

  const scaleZone = useCallback((zoneId: string, factor: number) => {
    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== zoneId) return z;
        const newW = Math.max(0.01, z.width * factor);
        const newH = Math.max(0.01, z.height * factor);
        const newD = Math.max(newW, newH) * 1.5;
        return {
          ...z,
          width: newW,
          height: newH,
          depth: newD,
        };
      })
    );
  }, []);

  const setZoneDimensions = useCallback(
    (zoneId: string, newW?: number, newH?: number, lockAspect = true) => {
      setZones((prev) =>
        prev.map((z) => {
          if (z.id !== zoneId) return z;
          const currentAspect = z.width > 0 && z.height > 0 ? z.width / z.height : 1;
          let finalW = z.width;
          let finalH = z.height;
          if (newW !== undefined && newW > 0) {
            finalW = newW;
            if (lockAspect) finalH = newW / currentAspect;
          } else if (newH !== undefined && newH > 0) {
            finalH = newH;
            if (lockAspect) finalW = newH * currentAspect;
          }
          const finalD = Math.max(finalW, finalH) * 1.5;
          return {
            ...z,
            width: finalW,
            height: finalH,
            depth: finalD,
          };
        })
      );
    },
    []
  );

  const setZoneRotationZ = useCallback((zoneId: string, angleDeg: number) => {
    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== zoneId) return z;
        const norm = z.hit?.normal
          ? new THREE.Vector3(...z.hit.normal).normalize()
          : new THREE.Vector3(0, 0, 1);
        const rot = computeDecalRotationFromNormal([norm.x, norm.y, norm.z], angleDeg);
        return {
          ...z,
          rotationZ: angleDeg,
          rotation: rot,
        };
      })
    );
  }, []);

  const nudgeZone = useCallback((zoneId: string, dir: "up" | "down" | "left" | "right", mult = 1) => {
    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== zoneId) return z;
        const euler = new THREE.Euler(z.rotation[0], z.rotation[1], z.rotation[2]);
        const vRight = new THREE.Vector3(1, 0, 0).applyEuler(euler);
        const vUp = new THREE.Vector3(0, 1, 0).applyEuler(euler);
        const step = Math.max(z.width, z.height) * 0.03 * mult;
        const currentPos = new THREE.Vector3(...z.position);
        let delta = new THREE.Vector3();
        if (dir === "right") delta = vRight.multiplyScalar(step);
        else if (dir === "left") delta = vRight.multiplyScalar(-step);
        else if (dir === "up") delta = vUp.multiplyScalar(step);
        else if (dir === "down") delta = vUp.multiplyScalar(-step);
        const newPos = currentPos.add(delta);
        return {
          ...z,
          position: [newPos.x, newPos.y, newPos.z],
        };
      })
    );
  }, []);

  const handleZoneReposition = useCallback(
    (
      id: string,
      newPos: [number, number, number],
      newRot: [number, number, number],
      newNorm: [number, number, number],
      meshName?: string,
      materialName?: string
    ) => {
      setZones((prev) =>
        prev.map((z) => {
          if (z.id !== id) return z;
          return {
            ...z,
            position: newPos,
            rotation: newRot,
            meshName: meshName || z.meshName,
            materialName: materialName || z.materialName,
            hit: {
              center: newPos,
              normal: newNorm,
              worldW: z.width,
              worldH: z.height,
            },
          };
        })
      );
    },
    []
  );

  // Keyboard shortcuts (Esc to cancel, M to toggle move, Arrows to nudge, +/- to scale)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.key === "Escape") {
        setIsDrawingZone(false);
        setIsPickingMaterial(false);
        setIsRepositioning(false);
        setZoneCreationType(null);
        setPendingRect(null);
        setActiveMeshName(null);
      } else if ((e.key === "m" || e.key === "M") && activeZoneId) {
        setIsRepositioning((prev) => !prev);
      } else if (activeZoneId) {
        if (e.key === "ArrowUp") { e.preventDefault(); nudgeZone(activeZoneId, "up"); }
        else if (e.key === "ArrowDown") { e.preventDefault(); nudgeZone(activeZoneId, "down"); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); nudgeZone(activeZoneId, "left"); }
        else if (e.key === "ArrowRight") { e.preventDefault(); nudgeZone(activeZoneId, "right"); }
        else if (e.key === "+" || e.key === "=") { e.preventDefault(); scaleZone(activeZoneId, 1.1); }
        else if (e.key === "-" || e.key === "_") { e.preventDefault(); scaleZone(activeZoneId, 0.9); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeZoneId, nudgeZone, scaleZone]);

  // Global pointerup to ensure drag finishes even if pointer exits canvas
  useEffect(() => {
    const handleWinPointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };
    window.addEventListener("pointerup", handleWinPointerUp);
    return () => window.removeEventListener("pointerup", handleWinPointerUp);
  }, [isDragging]);

  const openEditor = useCallback(
    (
      model?: Model3D,
      selectedProduct?: { id: string; name: string; slug: string; mainImageUrl?: string }
    ) => {
      resetEditor();
      if (model) {
        setEditingModel(model);
        const normalized = (model.printZones || []).map((z) => normalizeZone(z));
        setZones(normalized);
        setPreviewUrl(model.modelUrl);
        setModelUrlInput(model.modelUrl);

        // Preload logos for existing zones
        normalized.forEach((z) => {
          if (z.defaultImageUrl) {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => setLogoMap((prev) => ({ ...prev, [z.id]: img }));
            img.src = z.defaultImageUrl;
          }
        });
      } else {
        setEditingModel({
          name: selectedProduct ? `${selectedProduct.name} - 3D Model` : "New 3D Model",
          isActive: true,
          product_id: selectedProduct?.id,
          product: selectedProduct as any,
        });
        setZones([]);
        setPreviewUrl(null);
        setModelUrlInput("");
      }
      setModelKey((k) => k + 1);
      setView("editor");
    },
    [resetEditor]
  );

  const loadModel = useCallback((url: string) => {
    resetEditor();
    setZones([]);
    setPreviewUrl(url);
    setIsModelLoading(true);
    setModelKey((k) => k + 1);
  }, [resetEditor]);

  const handleGlbFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    glbFileRef.current = file;
    loadModel(URL.createObjectURL(file));
    setModelUrlInput("");
  }, [loadModel]);

  const handleMaterialsFound = useCallback((list: MaterialInfo[]) => {
    setMaterials(list);
    setIsModelLoading(false);
  }, []);

  // Step 1: Admin selects part on 3D model → part identified → enter Step 2: Draw the area
  const handleMaterialPicked = useCallback((name: string, meshName?: string) => {
    setIsPickingMaterial(false);
    setActiveMaterial(name);
    if (meshName) setActiveMeshName(meshName);
    // Immediately enter draw mode for this selected part
    setIsDrawingZone(true);
    showToast(`${name} selected — now drag to draw the area on this part`);
  }, [showToast]);

  // Select a variation/part from sidebar or toolbar pill (highlights part & aligns camera)
  const selectPart = useCallback(
    (partName: string, meshName?: string, camera?: "front" | "back" | "left" | "right" | null) => {
      if (activeMaterial === partName) {
        setActiveMaterial(null);
        setActiveMeshName(null);
        return;
      }
      setActiveMaterial(partName);
      setActiveMeshName(meshName || partName);
      setActiveZoneId(null);
      if (camera) {
        setCameraCommand(camera);
      }
    },
    [activeMaterial]
  );

  // Directly start adding text or logo to a chosen variation part
  const startAddZoneOnPart = useCallback(
    (type: "text" | "image", partName: string, meshName?: string, camera?: "front" | "back" | "left" | "right" | null) => {
      setActiveMaterial(partName);
      setActiveMeshName(meshName || partName);
      setActiveZoneId(null);
      setIsRepositioning(false);
      setZoneCreationType(type);
      setIsPickingMaterial(false);
      setIsDrawingZone(true);
      if (camera) {
        setCameraCommand(camera);
      }
      showToast(`Draw the placement area on ${partName}`);
    },
    [showToast]
  );

  // Step 2: Admin finishes drawing rect → trigger raycast inside Canvas
  const handleRectDrawn = useCallback((rect: DrawRect) => {
    setIsDrawingZone(false);
    setPendingRect(rect);
  }, []);

  // Step 3: Raycast result comes back from InnerCanvas
  const handleRaycastDone = useCallback((res: RaycastResult | null) => {
    setPendingRect(null);
    setIsDrawingZone(false);
    setActiveMeshName(null);
    if (!res) {
      showToast("Couldn't detect surface — please drag directly on the shirt", false);
      setZoneCreationType(null);
      return;
    }

    const currentMat = res.materialName || activeMaterial || "default";
    setActiveMaterial(currentMat);

    if (zoneCreationType) {
      const isText = zoneCreationType === "text";
      const newZone: PrintZone = {
        id: `zone_${Date.now()}`,
        label: `${currentMat} — ${isText ? "Text Zone" : "Logo Zone"} ${zones.length + 1}`,
        materialName: currentMat,
        meshName: res.targetMeshName,
        type: zoneCreationType,
        position: res.position,
        rotation: res.rotation,
        width: res.width,
        height: res.height,
        depth: res.depth,
        rotationZ: 0,
        hit: res.hit,
        defaultText: isText ? "PLAYER NAME" : "",
        placeholder: isText ? "Enter custom text" : "",
        defaultImageUrl: undefined,
        fontSize: 80,
        textColor: "#ffffff",
        align: "center",
        isBold: true,
        allowCustomColor: false,
        defaultColor: "#ffffff",
      };

      setZones((prev) => [...prev, newZone]);
      setActiveZoneId(newZone.id);
      setSidebarTab("zones");
      setZoneCreationType(null);
      showToast(`${isText ? "Text" : "Logo"} zone added on ${currentMat}! Settings opened in sidebar.`);
    }
  }, [activeMaterial, zoneCreationType, zones.length, showToast]);

  const updateZone = useCallback((id: string, patch: Partial<PrintZone>) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...patch } : z)));
  }, []);

  const deleteZone = useCallback((id: string) => {
    setZones((prev) => prev.filter((z) => z.id !== id));
    setActiveZoneId((prev) => (prev === id ? null : prev));
  }, []);

  const handleLogoUpload = useCallback(
    async (zoneId: string, file: File) => {
      // 1. Immediate local preview for responsive 3D feedback
      const localUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => setLogoMap((prev) => ({ ...prev, [zoneId]: img }));
      img.src = localUrl;

      updateZone(zoneId, { defaultImageUrl: localUrl });
      setUploadingLogoZoneId(zoneId);

      // 2. Upload to Cloudinary via backend
      try {
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await apiClient.post<{ ok: boolean; url: string; publicId: string }>(
          "/api/admin/3d-models/upload-image",
          fd,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        if (data.ok && data.url) {
          updateZone(zoneId, {
            defaultImageUrl: data.url,
            defaultImagePublicId: data.publicId,
          });
          const cloudImg = new window.Image();
          cloudImg.crossOrigin = "anonymous";
          cloudImg.onload = () => setLogoMap((prev) => ({ ...prev, [zoneId]: cloudImg }));
          cloudImg.src = data.url;
          showToast("Logo uploaded to Cloudinary!");
        } else {
          throw new Error("Failed to get uploaded image URL");
        }
      } catch (err: any) {
        console.error("Logo upload failed:", err);
        showToast(err?.response?.data?.message || "Failed to upload logo to cloud", false);
      } finally {
        setUploadingLogoZoneId((prev) => (prev === zoneId ? null : prev));
      }
    },
    [updateZone, showToast]
  );

  const handleSave = async () => {
    if (!editingModel?.name?.trim()) return showToast("Model name required", false);
    if (uploadingLogoZoneId) {
      return showToast("Please wait for logo image to finish uploading", false);
    }
    const hasBlobUrl = zones.some(
      (z) => z.defaultImageUrl && z.defaultImageUrl.startsWith("blob:")
    );
    if (hasBlobUrl) {
      return showToast("A logo is still uploading or failed. Please re-upload or remove it before saving.", false);
    }
    const hasFile = !!glbFileRef.current;
    const hasUrl = modelUrlInput.trim() && !modelUrlInput.startsWith("blob:");
    const isUpdate = !!editingModel.id;
    if (!isUpdate && !hasFile && !hasUrl) return showToast("Provide a .glb file or URL", false);
    setSaving(true);
    try {
      let snapshotUrl: string | undefined = editingModel.thumbnailUrl;
      try {
        const canvas = canvasWrapRef.current?.querySelector("canvas");
        if (canvas) {
          snapshotUrl = canvas.toDataURL("image/jpeg", 0.85);
        }
      } catch (err) {
        // silent fallback if canvas tainted
      }

      const payload = {
        name: editingModel.name,
        description: editingModel.description,
        isActive: editingModel.isActive ?? true,
        printZones: zones,
        ...(editingModel.product_id ? { product_id: editingModel.product_id } : {}),
        ...(snapshotUrl ? { thumbnailUrl: snapshotUrl } : {}),
      };
      if (isUpdate) {
        await apiClient.patch(`/api/admin/3d-models/${editingModel.id}`, {
          ...payload,
          ...(hasUrl ? { modelUrl: modelUrlInput.trim() } : {}),
        });
        showToast("Model updated!");
      } else if (hasFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) =>
          fd.append(k, typeof v === "string" ? v : JSON.stringify(v))
        );
        fd.append("glbFile", glbFileRef.current!, glbFileRef.current!.name);
        await apiClient.post("/api/admin/3d-models", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast("Model created!");
      } else {
        await apiClient.post("/api/admin/3d-models", {
          ...payload,
          modelUrl: modelUrlInput.trim(),
        });
        showToast("Model created!");
      }
      glbFileRef.current = null;
      await fetchModels();
      setView("list");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Save failed", false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this model?")) return;
    try {
      await apiClient.delete(`/api/admin/3d-models/${id}`);
      showToast("Deleted");
      fetchModels();
    } catch {
      showToast("Delete failed", false);
    }
  };

  const zonesByMaterial = useMemo(() => {
    const map = new Map<string, PrintZone[]>();
    zones.forEach((z) => {
      if (!map.has(z.materialName)) map.set(z.materialName, []);
      map.get(z.materialName)!.push(z);
    });
    return map;
  }, [zones]);

  const activeZone = useMemo(
    () => zones.find((z) => z.id === activeZoneId) || null,
    [zones, activeZoneId]
  );

  return {
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
    fetchModels,
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
    zonesByMaterial,
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
    showToast,
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
  };
}
