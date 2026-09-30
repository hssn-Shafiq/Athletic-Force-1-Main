import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export interface PartOutlineProps {
  targetMesh: THREE.Mesh;
  color?: string;
}

/**
 * Attaches a clean silhouette perimeter border outline directly to the selected garment mesh.
 * Does NOT use EdgesGeometry, so no internal wrinkle lines or decal rectangles are ever drawn.
 */
export function PartOutline({
  targetMesh,
  color = "#00e5ff",
}: PartOutlineProps) {
  // Never outline decals, text, logos, or graphic detail planes
  const isPrintOrDecal = useMemo(() => {
    if (!targetMesh) return true;
    const name = (targetMesh.name || "").toLowerCase();
    return (
      targetMesh.userData?.isDecal === true ||
      name.includes("decal") ||
      name.includes("logo") ||
      name.includes("text") ||
      name.includes("number")
    );
  }, [targetMesh]);

  const { outlineMesh, outlineMat } = useMemo(() => {
    if (isPrintOrDecal || !targetMesh || !targetMesh.geometry) {
      return { outlineMesh: null, outlineMat: null };
    }

    // Pure inverted-hull silhouette outline: expands back-faces slightly along vertex normals
    // The front faces of the garment occlude the interior, so ONLY the outer silhouette contour is visible!
    const outlineMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.95,
      depthTest: true,
      depthWrite: false,
      wireframe: false,
    });

    outlineMat.onBeforeCompile = (shader) => {
      shader.uniforms.thickness = { value: 0.007 };
      outlineMat.userData.shader = shader;
      shader.vertexShader = `
        uniform float thickness;
        ${shader.vertexShader}
      `.replace(
        "#include <begin_vertex>",
        `
        #include <begin_vertex>
        transformed += normal * thickness;
        `
      );
    };

    const outlineMesh = new THREE.Mesh(targetMesh.geometry, outlineMat);
    outlineMesh.raycast = () => null; // Never intercept pointer clicks
    outlineMesh.renderOrder = 999;

    return { outlineMesh, outlineMat };
  }, [targetMesh, color, isPrintOrDecal]);

  // Attach outline directly to targetMesh in Three.js hierarchy
  useEffect(() => {
    if (!targetMesh || !outlineMesh) return;
    targetMesh.add(outlineMesh);

    return () => {
      targetMesh.remove(outlineMesh);
      if (outlineMat) outlineMat.dispose();
    };
  }, [targetMesh, outlineMesh, outlineMat]);

  // Smooth subtle pulse on perimeter border thickness
  useFrame(({ clock }) => {
    if (outlineMat?.userData?.shader?.uniforms?.thickness) {
      const pulse = 0.007 + 0.003 * Math.sin(clock.elapsedTime * 3.5);
      outlineMat.userData.shader.uniforms.thickness.value = pulse;
    }
  });

  return null;
}
