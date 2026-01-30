// 손가락 UI 컴포넌트
// Canvas 기반 단순 손가락 렌더링

"use client";

import React, { useEffect, useRef } from "react";

interface FingerProps {
  position?: { x: number; y: number }; // 화면 비율 (0~1)
  length?: number; // vmin 단위
  angle?: number; // 각도 (degree)
  visible?: boolean;
}

export default function Finger({
  position = { x: 0.5, y: 0.3 },
  length = 40,
  angle = 0,
  visible = true,
}: FingerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;

    const size = 80;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);

    // 손가락 중심
    const centerX = size / 2;
    const centerY = size / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    // 손가락 색상
    const skinColor = "rgb(156, 70, 26)";

    // 마디 하나
    ctx.fillStyle = skinColor;

    ctx.beginPath();
    ctx.roundRect(centerX - 20, centerY - 30, 40, 60, 0);
    ctx.fill();

    ctx.restore();
  }, [angle]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        transform: `translate(-50%, -50%)`,
        width: `${length}vmin`,
        height: `${length}vmin`,
      }}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full"
      />
    </div>
  );
}
