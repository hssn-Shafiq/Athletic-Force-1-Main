import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";

export function CameraFit({ scene }: { scene: THREE.Object3D | null }) {
  const { camera } = useThree();
  const fitted = useRef(false);

  useEffect(() => {
    if (!scene || fitted.current) return;
    fitted.current = true;
    const box = new THREE.Box3().setFromObject(scene);
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const cam = camera as THREE.PerspectiveCamera;
    const dist = (Math.max(size.x, size.y, size.z) / (2 * Math.tan((cam.fov * Math.PI) / 360))) * 1.7;
    cam.position.set(center.x, center.y, center.z + dist);
    cam.near = dist / 100;
    cam.far = dist * 100;
    cam.lookAt(center);
    cam.updateProjectionMatrix();
  }, [scene, camera]);

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
  const { camera, controls } = useThree();
  const targetPos = useRef<THREE.Vector3 | null>(null);
  const targetLook = useRef<THREE.Vector3 | null>(null);
  const isAnimating = useRef(false);

  useEffect(() => {
    if (!command || !scene) return;
    const box = new THREE.Box3().setFromObject(scene);
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const cam = camera as THREE.PerspectiveCamera;
    const maxDim = Math.max(size.x, size.y, size.z);
    const dist = (maxDim / (2 * Math.tan((cam.fov * Math.PI) / 360))) * 1.7;

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
  }, [command, scene, camera, onHandled]);

  // Smooth cinematic glide to target camera position & angle
  useFrame((_, delta) => {
    if (!isAnimating.current || !targetPos.current || !targetLook.current) return;
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
    }
  });

  return null;
}
