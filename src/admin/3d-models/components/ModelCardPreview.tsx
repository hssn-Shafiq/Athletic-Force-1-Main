import React, { Suspense, useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Loader } from "lucide-react";

import { isPlaceholderMesh } from "../utils/decalUtils";

function RotatingModel({ url, isHovered }: { url: string; isHovered: boolean }) {
  const { scene } = useGLTF(url);
  const { invalidate } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  const cloned = useMemo(() => {
    const s = scene.clone(true);
    s.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        if (isPlaceholderMesh(m)) {
          m.visible = false;
          m.raycast = () => {};
          return;
        }
        if (m.material) {
          m.material = Array.isArray(m.material)
            ? m.material.map((mat) => (mat as THREE.Material).clone())
            : (m.material as THREE.Material).clone();
        }
      }
    });
    return s;
  }, [scene]);

  useEffect(() => {
    invalidate();
    return () => {
      cloned.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh && m.material) {
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => mat.dispose());
        }
      });
    };
  }, [cloned, invalidate]);

  useFrame((_, delta) => {
    if (groupRef.current && isHovered) {
      groupRef.current.rotation.y += delta * 0.65;
      invalidate();
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={cloned} />
    </group>
  );
}

function PreviewFallback() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/50">
      <Loader className="w-5 h-5 text-orange-400 animate-spin" />
      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
        Loading 3D...
      </span>
    </div>
  );
}

interface ModelCardPreviewProps {
  url: string;
}

export function ModelCardPreview({ url }: ModelCardPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: "120px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full h-full relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 cursor-grab"
    >
      {isVisible ? (
        <Suspense fallback={<PreviewFallback />}>
          <Canvas
            dpr={[1, 1.25]}
            frameloop={isHovered ? "always" : "demand"}
            camera={{ position: [0, 0, 4.5], fov: 45 }}
            gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
            style={{ width: "100%", height: "100%" }}
          >
            <ambientLight intensity={0.9} />
            <directionalLight position={[4, 8, 5]} intensity={1.5} />
            <directionalLight position={[-4, -2, -3]} intensity={0.4} />
            <Center>
              <RotatingModel url={url} isHovered={isHovered} />
            </Center>
          </Canvas>
        </Suspense>
      ) : (
        <PreviewFallback />
      )}
    </div>
  );
}
