import * as THREE from "three";
import { AllowedInputType, DrawRect, PrintZone, RaycastResult, ZoneRole } from "../types";

export const TEX = 2048;

/**
 * Detects baked-in logo placeholder materials (such as "Logo.005" or "Logo.001").
 * These are made transparent by default so they never display as an ugly opaque gray box on the shirt,
 * while still preserving the part in the variations list and allowing selection and decal placement.
 */
export function isLogoPlaneMaterial(matName?: string): boolean {
  if (!matName) return false;
  const clean = matName.trim().toLowerCase();
  return clean.startsWith("logo.") || clean.startsWith("logo_") || clean === "logo";
}

/**
 * Detects dummy debug bounding boxes or non-garment helper geometry that should be excluded.
 */
export function isPlaceholderMesh(mesh: THREE.Mesh): boolean {
  if (!mesh) return false;
  const name = (mesh.name || "").toLowerCase();
  return (
    name.includes("dummy_mesh") ||
    name.includes("bounding_box") ||
    name.includes("decal_helper")
  );
}

export function drawDecalToCanvas(
  ctx: CanvasRenderingContext2D,
  zone: PrintZone,
  logoImg?: HTMLImageElement | null,
  isSelected: boolean = false,
  isRepositioning: boolean = false
): void {
  ctx.clearRect(0, 0, TEX, TEX);

  // Track the actual bounding box occupied by content so selection rectangle hugs it tightly
  let contentBox = {
    x: Math.round(TEX * 0.25),
    y: Math.round(TEX * 0.35),
    w: Math.round(TEX * 0.5),
    h: Math.round(TEX * 0.3),
  };

  // 1 ─ Logo (Image)
  if (zone.type === "image" || zone.type === "both") {
    const pad = 36;
    const availW = TEX - 2 * pad;
    const availH = zone.type === "both" ? Math.round(TEX * 0.52 - pad) : (TEX - 2 * pad);

    // The user's drawn zone rectangle preset boundary
    const presetBox = { x: pad, y: pad, w: availW, h: availH };

    if (logoImg) {
      const imgW = logoImg.naturalWidth || logoImg.width || 1;
      const imgH = logoImg.naturalHeight || logoImg.height || 1;
      const imgAspect = imgW / imgH;

      // In 3D, the canvas is projected with scale [zone.width, zone.height].
      // To ensure the logo maintains its true natural aspect ratio inside the user's
      // custom width x height rectangle on the shirt:
      const zw = Math.max(0.01, zone.width || 0.12);
      const zh = Math.max(0.01, zone.height || 0.12);
      const canvasAspect = imgAspect * (zh / zw);

      let dw: number;
      let dh: number;

      if (canvasAspect > availW / availH) {
        dw = availW;
        dh = Math.max(10, Math.round(availW / canvasAspect));
      } else {
        dh = availH;
        dw = Math.max(10, Math.round(availH * canvasAspect));
      }

      const dx = Math.round((TEX - dw) / 2);
      const dy = zone.type === "both" ? Math.round(pad + (availH - dh) / 2) : Math.round((TEX - dh) / 2);

      ctx.drawImage(logoImg, dx, dy, dw, dh);

      contentBox = presetBox;
    } else if (zone.type === "image") {
      // Placeholder when logo is not uploaded yet — neatly outlines the exact preset rectangle
      ctx.save();
      ctx.strokeStyle = isSelected ? (isRepositioning ? "#22d3ee" : "#f97316") : "rgba(255,255,255,0.40)";
      ctx.lineWidth = 10;
      ctx.setLineDash([24, 14]);
      ctx.strokeRect(pad, pad, availW, availH);

      ctx.fillStyle = isSelected ? (isRepositioning ? "#22d3ee" : "#f97316") : "rgba(255,255,255,0.70)";
      ctx.font = "900 64px 'Bebas Neue', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+ LOGO AREA", TEX / 2, TEX / 2);
      ctx.restore();

      contentBox = presetBox;
    }
  }

  // 2 ─ Text
  if (zone.type === "text" || zone.type === "both") {
    const text = zone.defaultText?.trim() || "";
    const weight = zone.isBold ? "900" : "700";
    const fontFam = zone.fontFamily || "'Bebas Neue', 'Impact', sans-serif";

    // Clean outer padding inside the decal area
    const padX = 36;
    const padY = 32;
    const availW = TEX - 2 * padX;
    const availH = zone.type === "both" ? Math.round(TEX * 0.44 - padY) : (TEX - 2 * padY);
    const startY = zone.type === "both" ? Math.round(TEX * 0.52 + padY) : padY;

    // Normal clean padding inside the rectangle (4% horizontal, 6% vertical margin)
    const innerMarginX = Math.round(availW * 0.04);
    const innerMarginY = Math.round(availH * 0.06);
    const innerW = availW - 2 * innerMarginX;
    const innerH = availH - 2 * innerMarginY;

    const userScale = Math.max(0.4, Math.min(1.6, (zone.fontSize || 80) / 80));
    const targetW = innerW * userScale;
    const targetH = innerH * userScale;

    const textToMeasure = text || (zone.defaultText || "").trim() || "PLAYER NAME";
    const refFontSize = 100;
    ctx.font = `${weight} ${refFontSize}px ${fontFam}`;
    const metrics = ctx.measureText(textToMeasure);
    const glyphAscent = metrics.actualBoundingBoxAscent || 75;
    const glyphDescent = metrics.actualBoundingBoxDescent || 15;
    const glyphH = Math.max(10, glyphAscent + glyphDescent);
    const glyphW = Math.max(10, metrics.width || 100);

    // Target scale to fill the height of the rectangle
    const fitScaleY = targetH / glyphH;
    // Target scale to fill the width of the rectangle
    const fitScaleX = targetW / glyphW;

    let scaleX: number;
    let scaleY: number;

    const naturalWidthAtHeight = glyphW * fitScaleY;
    if (naturalWidthAtHeight <= targetW) {
      // Short text or number covers the full height, centered horizontally
      scaleY = fitScaleY;
      scaleX = fitScaleY;
    } else {
      // Text is wider: covers rectangle width, and scales height to fill the box
      scaleX = fitScaleX;
      scaleY = Math.min(fitScaleY, Math.max(fitScaleX, fitScaleY * 0.95));
    }

    const actualTextW = Math.round(glyphW * scaleX);
    const actualTextH = Math.round(glyphH * scaleY);

    const centerX = padX + availW / 2;
    const centerY = startY + availH / 2;
    const targetX =
      zone.align === "left"  ? padX + innerMarginX + actualTextW / 2 :
      zone.align === "right" ? padX + availW - innerMarginX - actualTextW / 2 :
      centerX;

    if (text) {
      ctx.save();
      ctx.translate(targetX, centerY);
      ctx.scale(scaleX, scaleY);

      ctx.font = `${weight} ${refFontSize}px ${fontFam}`;
      ctx.fillStyle = zone.textColor || "#ffffff";
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "center";

      // (glyphAscent - glyphDescent) / 2 aligns exact optical center of glyphs with Y = 0
      const opticalBaselineY = (glyphAscent - glyphDescent) / 2;
      ctx.fillText(text, 0, opticalBaselineY);
      ctx.restore();
    } else if (isSelected && zone.type !== "both") {
      ctx.save();
      ctx.fillStyle = isSelected ? (isRepositioning ? "#22d3ee" : "#f97316") : "rgba(255,255,255,0.70)";
      ctx.font = `700 ${Math.max(20, Math.min(52, Math.round(actualTextH * 0.42)))}px ${fontFam}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+ ENTER TEXT", targetX, centerY);
      ctx.restore();
    }

    // Selection frame stays fixed at the zone's true printable boundary so typing short text never collapses the box
    const textPresetBox = {
      x: padX,
      y: startY,
      w: availW,
      h: availH,
    };

    contentBox = zone.type === "both"
      ? {
          x: Math.min(contentBox.x, textPresetBox.x),
          y: Math.min(contentBox.y, textPresetBox.y),
          w: Math.max(contentBox.w, textPresetBox.w),
          h: Math.max(contentBox.h, textPresetBox.h),
        }
      : textPresetBox;
  }

  // Draw high-visibility glowing outline and corner brackets when selected — rock solid stable frame!
  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = isRepositioning ? "#06b6d4" : "#f97316";
    ctx.lineWidth = 14;
    ctx.setLineDash([28, 14]);

    const rx = contentBox.x;
    const ry = contentBox.y;
    const rw = contentBox.w;
    const rh = contentBox.h;

    ctx.strokeRect(rx, ry, rw, rh);

    const bLen = Math.min(70, Math.max(20, Math.round(Math.min(rw, rh) * 0.3)));
    ctx.setLineDash([]);
    ctx.lineWidth = 22;
    ctx.strokeStyle = isRepositioning ? "#22d3ee" : "#fb923c";

    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(rx, ry + bLen);
    ctx.lineTo(rx, ry);
    ctx.lineTo(rx + bLen, ry);
    ctx.stroke();

    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(rx + rw - bLen, ry);
    ctx.lineTo(rx + rw, ry);
    ctx.lineTo(rx + rw, ry + bLen);
    ctx.stroke();

    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(rx, ry + rh - bLen);
    ctx.lineTo(rx, ry + rh);
    ctx.lineTo(rx + bLen, ry + rh);
    ctx.stroke();

    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(rx + rw - bLen, ry + rh);
    ctx.lineTo(rx + rw, ry + rh);
    ctx.lineTo(rx + rw, ry + rh - bLen);
    ctx.stroke();

    ctx.restore();
  }
}

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
  drawDecalToCanvas(ctx, zone, logoImg, isSelected, isRepositioning);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false; // Required for Decals on GLTF meshes
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 16;
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

  // Infer athletic role if not already explicitly assigned
  const labelLower = (z.label || "").toLowerCase();
  const defText = (z.defaultText || "").trim();
  const isNumber =
    labelLower.includes("number") ||
    labelLower.includes("num") ||
    defText === "01" ||
    defText === "23" ||
    (!isNaN(Number(defText)) && defText.length <= 3 && defText !== "");

  let role: ZoneRole = z.zoneRole;
  if (!role) {
    if (z.type === "image") role = "team_logo";
    else if (isNumber) role = labelLower.includes("front") ? "front_number" : "back_number";
    else if (labelLower.includes("team")) role = "team_name";
    else if (labelLower.includes("name") || labelLower.includes("player")) role = "player_name";
    else role = "custom_text";
  }

  // Exact character limits requested: Player name: 12, Team name: 12, Numbers: 3, Custom: 15
  const maxCharacters =
    typeof z.maxCharacters === "number"
      ? z.maxCharacters
      : role === "player_name" || role === "team_name"
      ? 12
      : role === "back_number" || role === "front_number"
      ? 3
      : 15;

  const allowedInputType: AllowedInputType =
    z.allowedInputType ||
    (role === "back_number" || role === "front_number" ? "numeric" : "text");

  return {
    id: z.id || `zone_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    label: z.label || (role === "player_name" ? "Player Name" : role === "back_number" ? "Back Number" : role === "front_number" ? "Front Number" : role === "team_name" ? "Team Name" : "Print Zone"),
    materialName: z.materialName || "default",
    meshName: z.meshName,
    type: z.type || (role === "team_logo" ? "image" : "text"),
    zoneRole: role,
    maxCharacters,
    allowedInputType,
    position,
    rotation,
    width,
    height,
    depth,
    rotationZ,
    defaultText: z.defaultText ?? (z.type === "image" ? "" : isNumber ? "23" : "PLAYER NAME"),
    placeholder: z.placeholder ?? (isNumber ? "23" : "Enter text"),
    defaultImageUrl: z.defaultImageUrl,
    hit: z.hit,
    fontFamily: z.fontFamily || (isNumber ? "'Teko', sans-serif" : "'Bebas Neue', sans-serif"),
    fontSize: z.fontSize ?? (isNumber ? 100 : 80),
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

  // Collect only visible non-placeholder Mesh children from the model
  const meshes: THREE.Mesh[] = [];
  modelRoot.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && m.visible && !isPlaceholderMesh(m)) {
      meshes.push(m);
    }
  });
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
  const width = Math.max(0.01, worldW / avgScale);
  const height = Math.max(0.01, worldH / avgScale);
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

/**
 * Calculates the natural aspect ratio (width / height) of text.
 */
export function getTextAspect(
  text: string,
  fontFamily: string = "'Bebas Neue', sans-serif",
  isBold: boolean = true
): number {
  if (!text || !text.trim()) return 3.5;
  if (typeof document === "undefined") return 3.5;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return 3.5;

    ctx.font = `${isBold ? "900" : "700"} 100px ${fontFamily}`;
    const metrics = ctx.measureText(text.trim());
    const w = metrics.width || 100;
    const ascent = metrics.actualBoundingBoxAscent || 75;
    const descent = metrics.actualBoundingBoxDescent || 15;
    const h = Math.max(20, ascent + descent);

    return Math.max(0.15, Math.min(15, w / h));
  } catch {
    return 3.5;
  }
}

/**
 * Returns the natural aspect ratio (width / height) of a zone's content.
 */
export function getContentAspect(zone: PrintZone, logoImg?: HTMLImageElement | null): number {
  if (zone.type === "image") {
    if (logoImg) {
      const iw = logoImg.naturalWidth || logoImg.width || 1;
      const ih = logoImg.naturalHeight || logoImg.height || 1;
      return Math.max(0.15, Math.min(15, iw / ih));
    }
    return Math.max(0.15, (zone.width || 1) / (zone.height || 1));
  }
  if (zone.type === "text") {
    return getTextAspect(zone.defaultText || "PLAYER NAME", zone.fontFamily, zone.isBold);
  }
  return 1.4;
}

