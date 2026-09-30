import * as THREE from "three";
import { DrawRect, PrintZone, RaycastResult } from "../types";

export const TEX = 1024;

export function buildDecalTexture(
  zone: PrintZone,
  logoImg?: HTMLImageElement | null,
  isSelected: boolean = false,
  isRepositioning: boolean = false
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TEX;
  canvas.height = TEX;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, TEX, TEX);

  // Draw logo
  if ((zone.type === "image" || zone.type === "both") && logoImg) {
    const aspect = (logoImg.naturalWidth || logoImg.width || 1) / (logoImg.naturalHeight || logoImg.height || 1);
    let dw = TEX * 0.9;
    let dh = TEX * 0.9;
    if (aspect > 1) dh = dw / aspect;
    else dw = dh * aspect;
    const dy = zone.type === "both" ? (TEX - dh) * 0.28 : (TEX - dh) / 2;
    ctx.drawImage(logoImg, (TEX - dw) / 2, dy, dw, dh);
  }

  // Draw text
  if ((zone.type === "text" || zone.type === "both") && zone.defaultText?.trim()) {
    const weight = zone.isBold ? "900" : "600";
    const baseFontSize = Math.max(30, Math.min((zone.fontSize || 80) * 1.8, 260));
    ctx.font = `${weight} ${baseFontSize}px "Arial Black", Arial, sans-serif`;
    ctx.fillStyle = zone.textColor || "#ffffff";
    ctx.textBaseline = "middle";
    ctx.textAlign = (zone.align as CanvasTextAlign) || "center";
    ctx.shadowColor = "rgba(0,0,0,0.65)";
    ctx.shadowBlur = 14;
    const tx =
      zone.align === "left"  ? 36 :
      zone.align === "right" ? TEX - 36 :
      TEX / 2;
    const ty = zone.type === "both" ? (TEX * 0.78) : (TEX / 2);
    ctx.fillText(zone.defaultText, tx, ty, TEX - 72);
    ctx.shadowBlur = 0;
  }

  // Draw high-visibility glowing outline and corner brackets when selected
  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = isRepositioning ? "#06b6d4" : "#f97316";
    ctx.lineWidth = 14;
    ctx.setLineDash([28, 14]);
    ctx.strokeRect(16, 16, TEX - 32, TEX - 32);

    const bLen = 70;
    ctx.setLineDash([]);
    ctx.lineWidth = 22;
    ctx.strokeStyle = isRepositioning ? "#22d3ee" : "#fb923c";

    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(16, 16 + bLen);
    ctx.lineTo(16, 16);
    ctx.lineTo(16 + bLen, 16);
    ctx.stroke();

    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(TEX - 16 - bLen, 16);
    ctx.lineTo(TEX - 16, 16);
    ctx.lineTo(TEX - 16, 16 + bLen);
    ctx.stroke();

    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(16, TEX - 16 - bLen);
    ctx.lineTo(16, TEX - 16);
    ctx.lineTo(16 + bLen, TEX - 16);
    ctx.stroke();

    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(TEX - 16 - bLen, TEX - 16);
    ctx.lineTo(TEX - 16, TEX - 16);
    ctx.lineTo(TEX - 16, TEX - 16 - bLen);
    ctx.stroke();

    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false; // Required for Decals on GLTF meshes
  tex.needsUpdate = true;
  return tex;
}

export function getCameraDirectionForZone(zone: PrintZone): "front" | "back" | "left" | "right" | null {
  if (zone.hit?.normal) {
    const [nx, , nz] = zone.hit.normal;
    if (Math.abs(nz) >= Math.abs(nx)) {
      return nz < 0 ? "back" : "front";
    } else {
      return nx < 0 ? "left" : "right";
    }
  }

  if (zone.position) {
    const [px, , pz] = zone.position;
    if (Math.abs(pz) >= Math.abs(px)) {
      return pz < 0 ? "back" : "front";
    } else {
      return px < 0 ? "left" : "right";
    }
  }

  return null;
}

export function computeDecalRotationFromNormal(
  normal: [number, number, number],
  angleDeg: number = 0
): [number, number, number] {
  const norm = new THREE.Vector3(...normal).normalize();
  const dummy = new THREE.Object3D();
  dummy.position.set(0, 0, 0);
  dummy.lookAt(norm);
  dummy.rotateZ(Math.PI + ((angleDeg || 0) * Math.PI) / 180);
  dummy.rotateY(Math.PI);
  return [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z];
}

export function screenFractionToNDC(fx: number, fy: number): THREE.Vector2 {
  return new THREE.Vector2(fx * 2 - 1, -(fy * 2 - 1));
}

export function normalizeZone(z: any): PrintZone {
  const position: [number, number, number] =
    Array.isArray(z.position) && z.position.length === 3
      ? [z.position[0], z.position[1], z.position[2]]
      : z.hit?.center
      ? [z.hit.center[0], z.hit.center[1], z.hit.center[2]]
      : [0, 0, 0];

  const rotationZ = typeof z.rotationZ === "number" ? z.rotationZ : 0;

  let rotation: [number, number, number] = [0, 0, 0];
  if (Array.isArray(z.rotation) && z.rotation.length === 3) {
    rotation = [z.rotation[0], z.rotation[1], z.rotation[2]];
  } else if (z.hit?.normal) {
    rotation = computeDecalRotationFromNormal(z.hit.normal, rotationZ);
  }

  const width = typeof z.width === "number" && z.width > 0 ? z.width : (z.hit?.worldW || 0.12);
  const height = typeof z.height === "number" && z.height > 0 ? z.height : (z.hit?.worldH || 0.12);
  const depth = typeof z.depth === "number" && z.depth > 0 ? z.depth : Math.max(width, height) * 1.5;

  return {
    id: z.id || `zone_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    label: z.label || "Print Zone",
    materialName: z.materialName || "default",
    meshName: z.meshName,
    type: z.type || "text",
    position,
    rotation,
    width,
    height,
    depth,
    rotationZ,
    defaultText: z.defaultText ?? (z.type === "image" ? "" : "PLAYER NAME"),
    placeholder: z.placeholder ?? "Enter text",
    defaultImageUrl: z.defaultImageUrl,
    hit: z.hit,
    fontSize: z.fontSize ?? 80,
    textColor: z.textColor ?? "#ffffff",
    align: z.align ?? "center",
    isBold: z.isBold ?? true,
    allowCustomColor: z.allowCustomColor ?? false,
    defaultColor: z.defaultColor ?? "#ffffff",
  };
}

export function raycastRect(
  rect: DrawRect,
  camera: THREE.Camera,
  modelRoot: THREE.Object3D,
  activeMaterial?: string | null,
  activeMeshName?: string | null
): RaycastResult | null {
  const raycaster = new THREE.Raycaster();

  // Collect only Mesh children from the model
  const meshes: THREE.Mesh[] = [];
  modelRoot.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh); });
  if (!meshes.length) return null;

  // Raycast the center of the drawn rectangle
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const centerNDC = new THREE.Vector2(cx * 2 - 1, -(cy * 2 - 1));
  raycaster.setFromCamera(centerNDC, camera);
  const centerHits = raycaster.intersectObjects(meshes, false);
  if (!centerHits.length) return null;

  // The closest visible surface facing the camera at the drawn rectangle
  let hit = centerHits[0];
  if (activeMeshName) {
    const matchedMesh = centerHits.find((h) => (h.object as THREE.Mesh).name === activeMeshName);
    if (matchedMesh) {
      hit = matchedMesh;
    } else if (activeMaterial) {
      const matchedMat = centerHits.find((h) => {
        const m = h.object as THREE.Mesh;
        const mat = Array.isArray(m.material) ? m.material[0] : m.material;
        const name = ((mat as THREE.MeshStandardMaterial)?.name || m.name || "").trim();
        return name.toLowerCase() === activeMaterial.toLowerCase();
      });
      if (matchedMat) hit = matchedMat;
    }
  } else if (activeMaterial) {
    const matched = centerHits.find((h) => {
      const m = h.object as THREE.Mesh;
      const mat = Array.isArray(m.material) ? m.material[0] : m.material;
      const name = ((mat as THREE.MeshStandardMaterial)?.name || m.name || "").trim();
      return name.toLowerCase() === activeMaterial.toLowerCase();
    });
    if (matched) hit = matched;
  }

  const targetMesh = hit.object as THREE.Mesh;
  const mat = Array.isArray(targetMesh.material) ? targetMesh.material[0] : targetMesh.material;
  const detectedMaterial = ((mat as THREE.MeshStandardMaterial)?.name || targetMesh.name || "unnamed").trim();

  // Estimate world-space size from the rect screen fraction × camera depth
  const hitDist  = hit.distance;
  const cam      = camera as THREE.PerspectiveCamera;
  const fovRad   = (cam.fov * Math.PI) / 180;
  const aspect   = cam.aspect || 1;
  const viewH    = 2 * hitDist * Math.tan(fovRad / 2);
  const viewW    = viewH * aspect;
  const worldW   = Math.max(rect.w * viewW, 0.04);
  const worldH   = Math.max(rect.h * viewH, 0.03);

  // Position and normal in target mesh local coordinates
  targetMesh.updateMatrixWorld(true);
  const localPos = targetMesh.worldToLocal(hit.point.clone());
  const localNormal = hit.face
    ? hit.face.normal.clone().normalize()
    : new THREE.Vector3(0, 0, 1);

  const scale = new THREE.Vector3().setFromMatrixScale(targetMesh.matrixWorld);
  const avgScale = (scale.x + scale.y + scale.z) / 3 || 1;
  const width = worldW / avgScale;
  const height = worldH / avgScale;
  const depth = Math.max(width, height) * 1.5;

  // Orientation facing outward along normal
  const dummy = new THREE.Object3D();
  dummy.position.copy(localPos);
  dummy.lookAt(localPos.clone().add(localNormal));
  dummy.rotateZ(Math.PI);
  dummy.rotateY(Math.PI);
  const rot = dummy.rotation;

  return {
    targetMeshName: targetMesh.name || "",
    materialName: detectedMaterial,
    position: [localPos.x, localPos.y, localPos.z],
    rotation: [rot.x, rot.y, rot.z],
    width,
    height,
    depth,
    hit: {
      center: [localPos.x, localPos.y, localPos.z],
      normal: [localNormal.x, localNormal.y, localNormal.z],
      worldW: width,
      worldH: height,
    },
  };
}
