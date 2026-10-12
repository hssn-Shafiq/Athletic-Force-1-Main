import React, { useRef, useEffect, useMemo, useCallback } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { createPortal, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { PrintZone, MaterialInfo } from "../types";
import { computeDecalRotationFromNormal, isPlaceholderMesh } from "../utils/decalUtils";
import { CameraFit, CameraHelperController } from "./CameraControllers";
import { ZoneDecal } from "./ZoneDecal";
import { PartOutline } from "./PartOutline";

export interface SceneProps {
  url: string;
  zones: PrintZone[];
  logoMap: Record<string, HTMLImageElement>;
  activeMaterial: string | null;
  activeMeshName?: string | null;
  activeZoneId: string | null;
  isPickingMaterial: boolean;
  isDrawingZone: boolean;
  isRepositioning: boolean;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  onMaterialPicked: (name: string, meshName: string) => void;
  onMaterialsFound: (list: MaterialInfo[]) => void;
  onZoneSelect: (id: string) => void;
  onZoneReposition: (
    id: string,
    newPos: [number, number, number],
    newRot: [number, number, number],
    newNorm: [number, number, number],
    meshName?: string,
    materialName?: string
  ) => void;
  /** Ref written by ModelScene — InnerCanvas uses it to raycast ONLY model meshes */
  modelSceneRef: React.MutableRefObject<THREE.Object3D | null>;
  cameraCommand?: "front" | "back" | "left" | "right" | "reset" | null;
  onCameraCommandHandled?: () => void;
  onPartClick?: (matName: string, meshName: string) => void;
}

export function ModelScene({
  url,
  zones,
  logoMap,
  activeMaterial,
  activeMeshName,
  activeZoneId,
  isPickingMaterial,
  isDrawingZone,
  isRepositioning,
  isDragging,
  setIsDragging,
  onMaterialPicked,
  onMaterialsFound,
  onZoneSelect,
  onZoneReposition,
  modelSceneRef,
  cameraCommand,
  onCameraCommandHandled,
  onPartClick,
}: SceneProps) {
  const { scene: rawScene } = useGLTF(url);
  const isDraggingRef = useRef(false);
  const highlightedMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  // Sync ref with isDragging prop
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

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

          const matName = (cloned.name || m.name || "").trim().toLowerCase();
        }
        return cloned;
      };
      m.material = Array.isArray(m.material)
        ? m.material.map(processMat)
        : processMat(m.material as THREE.Material);
    });
    return s;
  }, [rawScene]);

  // Free the cloned materials when the model unmounts.
  useEffect(() => {
    return () => {
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh && m.material) {
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => mat.dispose());
        }
      });
    };
  }, [scene]);

  // Expose cloned scene so InnerCanvas raycasts ONLY the model, not lights/cameras
  useEffect(() => {
    modelSceneRef.current = scene;
  }, [scene, modelSceneRef]);

  const invalidate = useThree((s) => s.invalidate);

  // Single unified index built once when scene loads: gathers materials, meshes, and lookups
  const modelIndex = useMemo(() => {
    const byName: Record<string, THREE.Mesh> = {};
    const byMat: Record<string, THREE.Mesh> = {};
    let first: THREE.Mesh | null = null;
    const meshEntries: {
      mesh: THREE.Mesh;
      meshNameLower: string;
      standardMats: THREE.MeshStandardMaterial[];
      matNamesLower: string[];
    }[] = [];
    const found = new Map<string, MaterialInfo>();

    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !m.visible) return;
      if (m.userData?.isDecal) return;
      if (isPlaceholderMesh(m)) return;

      if (!first) first = m;
      if (m.name) byName[m.name] = m;

      const rawMats = Array.isArray(m.material) ? m.material : [m.material];
      const standardMats: THREE.MeshStandardMaterial[] = [];
      const matNamesLower: string[] = [];

      rawMats.forEach((mat) => {
        const sm = mat as THREE.MeshStandardMaterial;
        if (sm) {
          standardMats.push(sm);
          const matName = (sm.name || "").trim();
          if (matName) {
            matNamesLower.push(matName.toLowerCase());
            if (!byMat[matName]) byMat[matName] = m;
          }
          const meshName = (m.name || "").trim();
          const displayName = matName || meshName || "unnamed";
          const uniqueKey = matName && meshName ? `${matName}:::${meshName}` : displayName;
          if (!found.has(uniqueKey)) {
            found.set(uniqueKey, {
              name: displayName,
              originalColor: "#" + (sm.color?.getHexString?.() ?? "ffffff"),
              meshName: meshName || undefined,
            });
          }
        }
      });

      meshEntries.push({
        mesh: m,
        meshNameLower: (m.name || "").trim().toLowerCase(),
        standardMats,
        matNamesLower,
      });
    });

    return {
      byName,
      byMat,
      first,
      materialsList: Array.from(found.values()),
      meshEntries,
    };
  }, [scene]);

  // Report all model materials with mesh names for complete parts & variations list
  useEffect(() => {
    if (modelIndex.materialsList.length > 0) {
      onMaterialsFound(modelIndex.materialsList);
    }
  }, [modelIndex, onMaterialsFound]);

  // Identify all 3D meshes belonging to the active variation/part
  const activeMeshes = useMemo(() => {
    if (!activeMaterial && !activeMeshName) return [];
    const list: THREE.Mesh[] = [];
    const activeMatLower = activeMaterial ? activeMaterial.trim().toLowerCase() : null;
    const activeMeshLower = activeMeshName ? activeMeshName.trim().toLowerCase() : null;

    for (const entry of modelIndex.meshEntries) {
      const isMeshMatch = !!activeMeshLower && (
        entry.meshNameLower === activeMeshLower ||
        entry.meshNameLower.includes(activeMeshLower) ||
        activeMeshLower.includes(entry.meshNameLower)
      );

      let isMatMatch = false;
      if (activeMatLower) {
        if (
          entry.meshNameLower === activeMatLower ||
          entry.matNamesLower.some(
            (nm) => nm === activeMatLower || nm.includes(activeMatLower) || activeMatLower.includes(nm)
          )
        ) {
          isMatMatch = true;
        }
      }

      if (isMeshMatch || isMatMatch) {
        list.push(entry.mesh);
      }
    }

    return list;
  }, [activeMaterial, activeMeshName, modelIndex]);

  // Dual highlight: harmonize surface glow with border outline on selected meshes
  useEffect(() => {
    const list: THREE.MeshStandardMaterial[] = [];
    for (const entry of modelIndex.meshEntries) {
      const isSelected = activeMeshes.includes(entry.mesh);
      for (const sm of entry.standardMats) {
        if (!sm.emissive) continue;
        if (isSelected) {
          sm.emissive.setHex(0x00e5ff); // Radiant neon cyan matching the perimeter border
          sm.emissiveIntensity = 0.20;
          sm.needsUpdate = true;
          list.push(sm);
        } else {
          if (sm.emissiveIntensity !== 0 || sm.emissive.getHex() !== 0x000000) {
            sm.emissive.setHex(0x000000);
            sm.emissiveIntensity = 0;
            sm.needsUpdate = true;
          }
        }
      }
    }
    highlightedMaterialsRef.current = list;
  }, [activeMeshes, modelIndex]);

  // Clean up any orphaned decals whose zone was removed from state
  useEffect(() => {
    if (!scene) return;
    const currentZoneIds = new Set(zones.map((z) => z.id));
    const toRemove: THREE.Object3D[] = [];

    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.userData?.isDecal && m.userData?.zoneId && !currentZoneIds.has(m.userData.zoneId)) {
        m.visible = false;
        toRemove.push(m);
      }
    });

    toRemove.forEach((m) => {
      if (m.parent) m.parent.remove(m);
    });
  }, [scene, zones]);

  // Frame animation loop: pulse emissive glow on active selected variation part
  useFrame(({ clock }) => {
    if (highlightedMaterialsRef.current.length === 0) return;
    const pulse = 0.16 + 0.08 * Math.sin(clock.elapsedTime * 3.5);
    for (const sm of highlightedMaterialsRef.current) {
      sm.emissiveIntensity = pulse;
    }
    invalidate();
  });

  const updatePositionFromHit = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!activeZoneId) return;
    const hit = e.intersections.find((i) => {
      const m = i.object as THREE.Mesh;
      return m.isMesh && m.visible && !isPlaceholderMesh(m);
    });
    if (!hit || !hit.point || !hit.face) return;

    const targetMesh = hit.object as THREE.Mesh;
    targetMesh.updateMatrixWorld(true);

    const localPos = targetMesh.worldToLocal(hit.point.clone());
    const localNorm = hit.face.normal.clone().normalize();

    const activeZone = zones.find((z) => z.id === activeZoneId);
    const rotZ = activeZone?.rotationZ || 0;

    const rot = computeDecalRotationFromNormal([localNorm.x, localNorm.y, localNorm.z], rotZ);
    const pos: [number, number, number] = [localPos.x, localPos.y, localPos.z];
    const norm: [number, number, number] = [localNorm.x, localNorm.y, localNorm.z];

    const mat = Array.isArray(targetMesh.material) ? targetMesh.material[0] : targetMesh.material;
    const detectedMat = ((mat as THREE.MeshStandardMaterial)?.name || targetMesh.name || "unnamed").trim();

    onZoneReposition(activeZoneId, pos, rot, norm, targetMesh.name, detectedMat);
  }, [activeZoneId, zones, onZoneReposition]);

  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (pointerDownPos.current) {
      const dist = Math.hypot(e.clientX - pointerDownPos.current.x, e.clientY - pointerDownPos.current.y);
      if (dist > 6) {
        // User was orbiting camera, ignore
        return;
      }
    }

    const hit = e.intersections.find((i) => {
      const m = i.object as THREE.Mesh;
      return m.isMesh && m.visible && !isPlaceholderMesh(m);
    });
    if (!hit || !hit.point) return;

    const mesh = hit.object as THREE.Mesh;
    const mat  = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const sm   = mat as THREE.MeshStandardMaterial;
    const detectedMat = (sm?.name || mesh.name || "unnamed").trim();

    if (isPickingMaterial) {
      e.stopPropagation();
      onMaterialPicked(detectedMat, mesh.name);
    } else if (!isDrawingZone && !isRepositioning) {
      // Normal mode: Clicking anywhere on the 3D model selects that part & animates camera to it!
      e.stopPropagation();
      onPartClick?.(detectedMat, mesh.name);
    }
  }, [isPickingMaterial, isDrawingZone, isRepositioning, onMaterialPicked, onPartClick]);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    if (isPickingMaterial || isDrawingZone) return;
    if (activeZoneId && isRepositioning) {
      e.stopPropagation();
      isDraggingRef.current = true;
      setIsDragging(true);
      updatePositionFromHit(e);
    }
  }, [isPickingMaterial, isDrawingZone, activeZoneId, isRepositioning, setIsDragging, updatePositionFromHit]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (isPickingMaterial || isDrawingZone) return;
    if (isDraggingRef.current && activeZoneId) {
      e.stopPropagation();
      updatePositionFromHit(e);
    }
  }, [isPickingMaterial, isDrawingZone, activeZoneId, updatePositionFromHit]);

  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (isDraggingRef.current) {
      e.stopPropagation();
      isDraggingRef.current = false;
      setIsDragging(false);
    }
  }, [setIsDragging]);

  return (
    <>
      <CameraFit scene={scene} />
      <CameraHelperController
        scene={scene}
        command={cameraCommand || null}
        onHandled={onCameraCommandHandled || (() => {})}
      />
      {/* Original model */}
      <primitive
        object={scene}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          if (isPickingMaterial) {
            e.stopPropagation();
            document.body.style.cursor = "crosshair";
          } else if (isRepositioning) {
            e.stopPropagation();
            document.body.style.cursor = "grab";
          }
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      />
      {/* High-visibility uniform border outline for selected variation parts */}
      {activeMeshes.map((mesh) => (
        <PartOutline key={mesh.uuid} targetMesh={mesh} color="#00e5ff" />
      ))}
      {/* Decals projected directly onto the model mesh inside targetMesh hierarchy */}
      {zones.map((zone) => {
        const targetMesh =
          (zone.meshName ? modelIndex.byName[zone.meshName] : null) ||
          modelIndex.byMat[zone.materialName] ||
          modelIndex.first;

        if (!targetMesh) return null;

        return createPortal(
          <ZoneDecal
            key={zone.id}
            targetMesh={targetMesh}
            zone={zone}
            logoImg={logoMap[zone.id] ?? null}
            isSelected={activeZoneId === zone.id}
            isRepositioning={isRepositioning && activeZoneId === zone.id}
            onStartDrag={() => {
              isDraggingRef.current = true;
              setIsDragging(true);
            }}
          />,
          targetMesh
        );
      })}
    </>
  );
}
