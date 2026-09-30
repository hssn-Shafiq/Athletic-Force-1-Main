import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { Decal } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import { PrintZone } from "../types";
import { buildDecalTexture } from "../utils/decalUtils";

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
  const meshRef = useRef<THREE.Mesh>(targetMesh);
  meshRef.current = targetMesh;

  const texture = useMemo(
    () => buildDecalTexture(zone, logoImg, isSelected, isRepositioning),
    // rebuild when these change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zone.defaultText, zone.textColor, zone.fontSize, zone.isBold, zone.align, zone.type, logoImg, isSelected, isRepositioning]
  );

  const depth = zone.depth || Math.max(zone.width, zone.height) * 1.5;

  return (
    <Decal
      mesh={meshRef}
      userData={{ isDecal: true }}
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
        emissive={
          isSelected
            ? isRepositioning
              ? new THREE.Color("#06b6d4")
              : new THREE.Color("#f97316")
            : new THREE.Color("#000000")
        }
        emissiveIntensity={isSelected ? 0.45 : 0}
      />
    </Decal>
  );
}
