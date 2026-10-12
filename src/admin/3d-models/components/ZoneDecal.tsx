import React, { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { Decal } from "@react-three/drei";
import { ThreeEvent, useThree } from "@react-three/fiber";
import { PrintZone } from "../types";
import { drawDecalToCanvas, TEX } from "../utils/decalUtils";

interface ZoneDecalProps {
  targetMesh: THREE.Mesh;
  zone: PrintZone;
  logoImg?: HTMLImageElement | null;
  isSelected: boolean;
  isRepositioning: boolean;
  onStartDrag: () => void;
}

export function ZoneDecal({
  targetMesh,
  zone,
  logoImg,
  isSelected,
  isRepositioning,
  onStartDrag,
}: ZoneDecalProps) {
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const meshRef = useRef<THREE.Mesh>(targetMesh);
  meshRef.current = targetMesh;

  // Single reusable canvas & texture per ZoneDecal instance to prevent GC thrashing
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = TEX;
    c.height = TEX;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.flipY = false;
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = Math.min(16, gl.capabilities?.getMaxAnisotropy?.() ?? 16);
    return { canvas: c, texture: t };
  }, [gl]);

  // Clean disposal on unmount
  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  // Redraw into existing canvas in place without allocating new textures
  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawDecalToCanvas(ctx, zone, logoImg, isSelected, isRepositioning);
    texture.needsUpdate = true;
    invalidate();
  }, [
    canvas,
    texture,
    invalidate,
    zone.defaultText,
    zone.textColor,
    zone.fontSize,
    zone.isBold,
    zone.align,
    zone.fontFamily,
    zone.type,
    zone.width,
    zone.height,
    logoImg,
    isSelected,
    isRepositioning,
  ]);

  const depth = Math.max(zone.depth || 0, Math.max(zone.width, zone.height) * 1.5);

  return (
    <Decal
      key={zone.id}
      mesh={meshRef}
      userData={{ isDecal: true, zoneId: zone.id }}
      position={zone.position}
      rotation={zone.rotation}
      scale={[zone.width, zone.height, depth]}
      debug={false}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        if (isRepositioning) {
          e.stopPropagation();
          onStartDrag();
        }
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        if (isRepositioning) {
          e.stopPropagation();
          document.body.style.cursor = "grab";
        }
      }}
      onPointerOut={() => {
        document.body.style.cursor = isRepositioning ? "grab" : "auto";
      }}
    >
      <meshStandardMaterial
        map={texture}
        transparent
        depthTest
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-10}
        toneMapped={false}
        side={THREE.FrontSide}
        roughness={0.9}
        metalness={0.0}
        envMapIntensity={0.2}
      />
    </Decal>
  );
}
