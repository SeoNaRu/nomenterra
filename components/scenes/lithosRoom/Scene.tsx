// Lithos Room 씬 컴포넌트 (R3F 기반)
// 기본적인 방(천장/바닥/벽)만 Three.js로 렌더링하는 기초 버전

"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import Room from "./ui/Room";
import { FlyingLettersField } from "./ui/FlyingLetter";
import { CameraCoordOverlay } from "./ui/CameraController";

export default function LithosRoomScene() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-900">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
        camera={{ position: [0, 0, 25], fov: 50 }}
      >
        {/* 배경색 */}
        <color attach="background" args={["#020617"]} />

        {/* 기본 조명 */}
        <ambientLight intensity={0.16} />
        <directionalLight position={[5, 9, 4]} intensity={1.2} castShadow />
        <directionalLight position={[-6, 2, 2]} intensity={0.35} />

        {/* 방 메쉬 */}
        <Room />

        {/* 날아오는 글자들 */}
        <FlyingLettersField />

        {/* 카메라 컨트롤 (키보드 + 마우스) */}
        {/* <CameraController /> */}
      </Canvas>
      <CameraCoordOverlay />
    </div>
  );
}
