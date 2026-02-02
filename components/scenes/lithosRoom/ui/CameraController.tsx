// 카메라 컨트롤 (키보드 WASD + 마우스)

"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { useSceneStore } from "@/store/sceneStore";

export function CameraController() {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const setCameraPosition = useSceneStore((s) => s.setCameraPosition);

  useFrame((_, delta) => {
    const direction = new THREE.Vector3();
    const speed = 4;

    if (keys.current["KeyW"]) direction.z -= 1;
    if (keys.current["KeyS"]) direction.z += 1;
    if (keys.current["KeyA"]) direction.x -= 1;
    if (keys.current["KeyD"]) direction.x += 1;
    if (keys.current["Space"]) direction.y += 1;
    if (keys.current["ShiftLeft"] || keys.current["ShiftRight"]) direction.y -= 1;

    if (direction.lengthSq() > 0) {
      direction.normalize().multiplyScalar(speed * delta);
      // 카메라가 바라보는 방향 기준으로 이동
      const move = direction.applyQuaternion(camera.quaternion);
      camera.position.add(move);
    }

    setCameraPosition(camera.position.x, camera.position.y, camera.position.z);
  });

  // PointerLockControls: 캔버스를 클릭하면 마우스가 카메라 회전에 잠김
  return <PointerLockControls />;
}

export function CameraCoordOverlay() {
  const pos = useSceneStore((s) => s.cameraPosition);
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 font-mono text-xs text-green-400">
      <div>cam x: {pos.x.toFixed(2)}</div>
      <div>cam y: {pos.y.toFixed(2)}</div>
      <div>cam z: {pos.z.toFixed(2)}</div>
    </div>
  );
}
