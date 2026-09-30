import React, { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Loader } from "lucide-react";

function RotatingModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  const cloned = useMemo(() => {
    const s = scene.clone(true);
    s.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.material) {
        m.material = Array.isArray(m.material)
          ? m.material.map((mat) => (mat as THREE.Material).clone())
          : (m.material as THREE.Material).clone();
      }
    });
    return s;
  }, [scene]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.45;
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
  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Suspense fallback={<PreviewFallback />}>
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 4.5], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ width: "100%", height: "100%" }}
        >
          <ambientLight intensity={0.9} />
          <directionalLight position={[4, 8, 5]} intensity={1.5} />
          <directionalLight position={[-4, -2, -3]} intensity={0.4} />
          <Center>
            <RotatingModel url={url} />
          </Center>
        </Canvas>
      </Suspense>
    </div>
  );
}
