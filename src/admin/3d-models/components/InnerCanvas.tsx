import React, { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { DrawRect, RaycastResult } from "../types";
import { raycastRect } from "../utils/decalUtils";
import { ModelScene, SceneProps } from "./ModelScene";

export interface InnerCanvasProps extends SceneProps {
  pendingRect: DrawRect | null;
  onRaycastDone: (res: RaycastResult | null) => void;
  activeMeshName?: string | null;
}

export function InnerCanvas({
  pendingRect,
  onRaycastDone,
  modelSceneRef,
  activeMaterial,
  activeMeshName,
  ...sceneProps
}: InnerCanvasProps) {
  const { camera } = useThree();

  useEffect(() => {
    if (!pendingRect) return;
    const id = setTimeout(() => {
      const modelRoot = modelSceneRef.current;
      if (!modelRoot) {
        onRaycastDone(null);
        return;
      }
      const res = raycastRect(pendingRect, camera, modelRoot, activeMaterial, activeMeshName);
      onRaycastDone(res);
    }, 50);
    return () => clearTimeout(id);
  }, [pendingRect, activeMaterial, activeMeshName]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ModelScene
      modelSceneRef={modelSceneRef}
      activeMaterial={activeMaterial}
      activeMeshName={activeMeshName}
      {...sceneProps}
    />
  );
}
