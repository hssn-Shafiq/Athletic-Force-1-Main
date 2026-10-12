import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";

export function CameraFit({ scene }: { scene: THREE.Object3D | null }) {
  const { camera, controls, invalidate } = useThree();
  const fitted = useRef(false);

  useEffect(() => {
    if (!scene || fitted.current) return;
    fitted.current = true;
    scene.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(scene);
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const cam = camera as THREE.PerspectiveCamera;
    const maxDim = Math.max(size.x, size.y, size.z);
    const vFOV = (cam.fov * Math.PI) / 180;
    // Frame model height with generous 25% safety margin so collar/shorts never touch the top or bottom bar
    const fitDist = (maxDim / (2 * Math.tan(vFOV / 2))) * 1.25;
    const dist = fitDist;

    cam.position.set(center.x, center.y, center.z + dist);
    cam.near = Math.max(0.01, dist / 100);
    cam.far = dist * 100;
    cam.lookAt(center);
    cam.updateProjectionMatrix();

    if (controls) {
      const ctrl = controls as any;
      ctrl.target?.copy(center);
      // Allow closer zoom-in for inspecting graphics and logos
      ctrl.minDistance = fitDist * 0.85;
      // Strictly lock zoom-out: cannot zoom out into a tiny speck
      ctrl.maxDistance = fitDist * 1.22;
      ctrl.update?.();
    }
    invalidate();
  }, [scene, camera, controls, invalidate]);

  return null;
}

interface CameraHelperControllerProps {
  scene: THREE.Object3D | null;
  command: "front" | "back" | "left" | "right" | "reset" | null;
  onHandled: () => void;
}

export function CameraHelperController({
  scene,
  command,
  onHandled,
}: CameraHelperControllerProps) {
  const { camera, controls, invalidate } = useThree();
  const targetPos = useRef<THREE.Vector3 | null>(null);
  const targetLook = useRef<THREE.Vector3 | null>(null);
  const isAnimating = useRef(false);

  useEffect(() => {
    if (!command || !scene) return;
    scene.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(scene);
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const cam = camera as THREE.PerspectiveCamera;
    const maxDim = Math.max(size.x, size.y, size.z);
    const vFOV = (cam.fov * Math.PI) / 180;
    const fitDist = (maxDim / (2 * Math.tan(vFOV / 2))) * 1.25;
    const dist = fitDist;

    if (controls) {
      const ctrl = controls as any;
      ctrl.target?.copy(center);
      ctrl.minDistance = fitDist * 0.70;
      ctrl.maxDistance = fitDist * 1.22;
    }

    const pos = new THREE.Vector3();
    switch (command) {
      case "front":
      case "reset":
        pos.set(center.x, center.y, center.z + dist);
        break;
      case "back":
        pos.set(center.x, center.y, center.z - dist);
        break;
      case "left":
        pos.set(center.x - dist, center.y, center.z);
        break;
      case "right":
        pos.set(center.x + dist, center.y, center.z);
        break;
    }

    targetPos.current = pos;
    targetLook.current = center;
    isAnimating.current = true;
    onHandled();
    invalidate();
  }, [command, scene, camera, controls, onHandled, invalidate]);

  // Smooth cinematic glide to target camera position & angle
  useFrame((_, delta) => {
    if (!isAnimating.current || !targetPos.current || !targetLook.current) return;
    invalidate();
    const step = Math.min(1, delta * 9); // Responsive 60fps swoop
    camera.position.lerp(targetPos.current, step);

    if (controls) {
      (controls as any).target.lerp(targetLook.current, step);
      (controls as any).update();
    } else {
      camera.lookAt(targetLook.current);
    }

    if (camera.position.distanceTo(targetPos.current) < 0.015) {
      camera.position.copy(targetPos.current);
      if (controls) {
        (controls as any).target.copy(targetLook.current);
        (controls as any).update();
      }
      isAnimating.current = false;
      invalidate();
    }
  });

  return null;
}
