// Lithos Room 씬 컴포넌트
// - 시멘트 천장 (Voronoi 파쇄 시스템)
// - 원근감, 질감, 물리 시뮬레이션

"use client";

import React, { useEffect, useRef } from "react";
import { Delaunay } from "d3-delaunay";
import { lithosRoomConfig } from "./config";

type CellState = "intact" | "fractured";
type Debris = {
  polygon: [number, number][];
  x: number;
  y: number;
  z: number; // 깊이 (원근)
  vx: number;
  vy: number;
  vz: number;
  rotation: number;
  rotationSpeed: number;
  scale: number; // 원근에 따른 크기
  brightness: number; // 시멘트 색상
};

// 노이즈 함수
function noise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return (n - Math.floor(n));
}

export default function LithosRoomScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cellStatesRef = useRef<CellState[]>([]);
  const debrisRef = useRef<Debris[]>([]);
  const animationRef = useRef<number>(0);
  const seedsRef = useRef<[number, number][]>([]);
  const voronoiRef = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    const parent = canvas.parentElement!;

    // Canvas 크기 설정
    const resize = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w;
      canvas.height = h;

      const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
      const side = lithosRoomConfig.values.side * vmin;
      const ceiling = lithosRoomConfig.values.ceiling * vmin;

      // ========== 원근 기반 Voronoi 시드 배치 ==========
      const seeds: [number, number][] = [];

      // 10개 행으로 나눠서 배치 (위에서 아래로)
      for (let row = 0; row < 10; row++) {
        const y = (row / 9) * ceiling; // 0 ~ ceiling
        const t = y / ceiling; // 0(위) ~ 1(아래)

        // 원근: 위쪽(먼 곳)은 좁고, 아래쪽(가까운 곳)은 넓음
        const xMin = side * t;
        const xMax = w - side * t;
        const rowWidth = xMax - xMin;

        // 원근에 따른 셀 개수: 위쪽은 적게, 아래쪽은 많게
        const cellCount = Math.floor(3 + (row / 9) * 5); // 3~8개

        for (let col = 0; col < cellCount; col++) {
          const x = xMin + (col / (cellCount - 1)) * rowWidth;
          const jitter = (Math.random() - 0.5) * (rowWidth / cellCount) * 0.5; // 약간의 불규칙성
          seeds.push([x + jitter, y + (Math.random() - 0.5) * 10]);
        }
      }

      seedsRef.current = seeds;

      // Voronoi 생성
      const delaunay = Delaunay.from(seeds);
      const voronoi = delaunay.voronoi([0, 0, w, h]);
      voronoiRef.current = voronoi;

      // 모든 셀을 intact 상태로 초기화
      cellStatesRef.current = new Array(seeds.length).fill("intact");
    };

    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  // 렌더링 루프
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
      const side = lithosRoomConfig.values.side * vmin;
      const ceiling = lithosRoomConfig.values.ceiling * vmin;
      const floor = lithosRoomConfig.values.floor * vmin;

      // 배경 지우기
      ctx.clearRect(0, 0, w, h);

      // 천장 영역 클리핑
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(w - side, ceiling);
      ctx.lineTo(side, ceiling);
      ctx.closePath();
      ctx.clip();

      // ========== 시멘트 천장 조각 렌더링 ==========
      if (voronoiRef.current && seedsRef.current.length > 0) {
        for (let i = 0; i < seedsRef.current.length; i++) {
          if (cellStatesRef.current[i] !== "intact") continue;

          const cell = voronoiRef.current.cellPolygon(i);
          if (!cell) continue;

          const [centerX, centerY] = seedsRef.current[i];
          const depthRatio = centerY / ceiling; // 0(위) ~ 1(아래)

          // ========== 시멘트 베이스 색상 ==========
          const baseGray = 110 + Math.floor(noise(centerX * 0.1, centerY * 0.1) * 30);
          const brightness = baseGray - depthRatio * 20; // 아래쪽은 어둡게

          // 2.5D 베벨 효과를 위한 경사면
          const bevelOffset = 3;
          const insetCell: [number, number][] = [];

          for (let j = 0; j < cell.length; j++) {
            const [px, py] = cell[j];
            const dirX = centerX - px;
            const dirY = centerY - py;
            const dist = Math.sqrt(dirX * dirX + dirY * dirY);
            const normX = dirX / dist;
            const normY = dirY / dist;
            insetCell.push([px + normX * bevelOffset, py + normY * bevelOffset]);
          }

          // ========== 베벨 (측면) 렌더링 ==========
          for (let j = 0; j < cell.length; j++) {
            const next = (j + 1) % cell.length;

            // 베벨 방향에 따른 밝기
            const edgeMidY = (cell[j][1] + cell[next][1]) / 2;
            const edgeDir = (edgeMidY - centerY) / 50;
            const bevelBrightness = brightness + edgeDir * 30; // 위쪽=밝게, 아래=어둡게

            const grad = ctx.createLinearGradient(
              cell[j][0], cell[j][1],
              insetCell[j][0], insetCell[j][1]
            );
            grad.addColorStop(0, `rgb(${brightness - 40}, ${brightness - 40}, ${brightness - 35})`);
            grad.addColorStop(1, `rgb(${bevelBrightness}, ${bevelBrightness}, ${bevelBrightness - 5})`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(cell[j][0], cell[j][1]);
            ctx.lineTo(cell[next][0], cell[next][1]);
            ctx.lineTo(insetCell[next][0], insetCell[next][1]);
            ctx.lineTo(insetCell[j][0], insetCell[j][1]);
            ctx.closePath();
            ctx.fill();
          }

          // ========== 상단 평면 (시멘트 질감) ==========
          ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness - 5})`;
          ctx.beginPath();
          ctx.moveTo(insetCell[0][0], insetCell[0][1]);
          for (let j = 1; j < insetCell.length; j++) {
            ctx.lineTo(insetCell[j][0], insetCell[j][1]);
          }
          ctx.closePath();
          ctx.fill();

          // ========== 시멘트 질감: 노이즈 ==========
          ctx.save();
          ctx.clip();

          for (let n = 0; n < 30; n++) {
            const nx = centerX + (Math.random() - 0.5) * 50;
            const ny = centerY + (Math.random() - 0.5) * 50;
            const nSize = Math.random() * 2;
            const nAlpha = 0.1 + Math.random() * 0.2;

            ctx.fillStyle = `rgba(${Math.random() > 0.5 ? 80 : 140}, ${Math.random() > 0.5 ? 80 : 140}, ${Math.random() > 0.5 ? 75 : 135}, ${nAlpha})`;
            ctx.fillRect(nx, ny, nSize, nSize);
          }

          // ========== 시멘트 질감: 미세 균열 ==========
          if (Math.random() > 0.7) {
            const crackCount = 1 + Math.floor(Math.random() * 2);
            for (let c = 0; c < crackCount; c++) {
              const cx1 = centerX + (Math.random() - 0.5) * 40;
              const cy1 = centerY + (Math.random() - 0.5) * 40;
              const cx2 = cx1 + (Math.random() - 0.5) * 20;
              const cy2 = cy1 + (Math.random() - 0.5) * 20;

              ctx.strokeStyle = `rgba(60, 60, 55, 0.4)`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(cx1, cy1);
              ctx.lineTo(cx2, cy2);
              ctx.stroke();
            }
          }

          ctx.restore();

          // ========== 경계선 (깊은 틈) ==========
          ctx.strokeStyle = `rgba(40, 40, 35, 0.9)`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cell[0][0], cell[0][1]);
          for (let j = 1; j < cell.length; j++) {
            ctx.lineTo(cell[j][0], cell[j][1]);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }

      ctx.restore();

      // ========== 떨어지는 파편 (원근 + 바닥 충돌) ==========
      const updatedDebris: Debris[] = [];
      const barrierY = h - floor; // 바닥 위치

      for (const d of debrisRef.current) {
        // 중력 및 물리
        const newVy = d.vy + 0.6;
        let newY = d.y + newVy;
        let newVx = d.vx * 0.98; // 공기 저항
        let newX = d.x + newVx;

        // 원근에 따른 크기 증가 (아래로 떨어질수록 커짐)
        const depthProgress = Math.min(1, newY / barrierY);
        const newScale = d.scale * (1 + depthProgress * 0.3);

        // ========== 바닥 충돌 처리 ==========
        if (newY >= barrierY - 10) {
          newY = barrierY - 10;
          newVx *= 0.5; // 마찰
          if (Math.abs(newVy) < 1) {
            // 정지
            continue;
          }
        }

        // 화면 밖으로 나가면 제거
        if (newY > h + 100 || newX < -100 || newX > w + 100) continue;

        const newRotation = d.rotation + d.rotationSpeed;

        // ========== 파편 렌더링 (그림자 포함) ==========
        ctx.save();

        // 그림자 먼저 그리기
        const shadowY = barrierY;
        const shadowScale = Math.max(0.2, 1 - (shadowY - newY) / 300);
        ctx.globalAlpha = shadowScale * 0.4;
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.translate(newX, shadowY);
        ctx.scale(newScale * shadowScale, newScale * 0.3);

        const centerX = d.polygon.reduce((sum, p) => sum + p[0], 0) / d.polygon.length;
        const centerY = d.polygon.reduce((sum, p) => sum + p[1], 0) / d.polygon.length;

        ctx.beginPath();
        ctx.moveTo(d.polygon[0][0] - centerX, d.polygon[0][1] - centerY);
        for (let j = 1; j < d.polygon.length; j++) {
          ctx.lineTo(d.polygon[j][0] - centerX, d.polygon[j][1] - centerY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 실제 파편
        ctx.save();
        ctx.translate(newX, newY);
        ctx.rotate(newRotation);
        ctx.scale(newScale, newScale);

        ctx.fillStyle = `rgb(${d.brightness}, ${d.brightness}, ${d.brightness - 5})`;
        ctx.strokeStyle = `rgba(40, 40, 35, 0.8)`;
        ctx.lineWidth = 2 / newScale;

        ctx.beginPath();
        ctx.moveTo(d.polygon[0][0] - centerX, d.polygon[0][1] - centerY);
        for (let j = 1; j < d.polygon.length; j++) {
          ctx.lineTo(d.polygon[j][0] - centerX, d.polygon[j][1] - centerY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        updatedDebris.push({
          ...d,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          rotation: newRotation,
          scale: newScale,
        });
      }

      debrisRef.current = updatedDebris;
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // 마우스 클릭 이벤트
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !voronoiRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
    const side = lithosRoomConfig.values.side * vmin;
    const ceiling = lithosRoomConfig.values.ceiling * vmin;
    const w = canvas.width;

    // 천장 영역 확인
    if (clickY > ceiling) return;
    const t = clickY / ceiling;
    const leftBound = side * t;
    const rightBound = w - side * t;
    if (clickX < leftBound || clickX > rightBound) return;

    const impactRadius = 100;
    const newDebris: Debris[] = [];

    for (let i = 0; i < seedsRef.current.length; i++) {
      if (cellStatesRef.current[i] === "fractured") continue;

      const [sx, sy] = seedsRef.current[i];
      const distance = Math.sqrt((sx - clickX) ** 2 + (sy - clickY) ** 2);

      const shouldRemove =
        distance < impactRadius ||
        (distance < impactRadius * 1.3 && Math.random() > 0.5);

      if (shouldRemove) {
        cellStatesRef.current[i] = "fractured";

        const cell = voronoiRef.current.cellPolygon(i);
        if (cell) {
          const centerX = cell.reduce((sum: number, p: [number, number]) => sum + p[0], 0) / cell.length;
          const centerY = cell.reduce((sum: number, p: [number, number]) => sum + p[1], 0) / cell.length;
          const depthRatio = centerY / ceiling;

          const angle = Math.atan2(centerY - clickY, centerX - clickX);
          const force = Math.max(0, 1 - distance / impactRadius) * 6;

          const baseGray = 110 + Math.floor(noise(centerX * 0.1, centerY * 0.1) * 30);
          const brightness = baseGray - depthRatio * 20;

          newDebris.push({
            polygon: cell,
            x: centerX,
            y: centerY,
            z: depthRatio,
            vx: Math.cos(angle) * force + (Math.random() - 0.5) * 3,
            vy: Math.sin(angle) * force - 3,
            vz: 0,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.15,
            scale: 1 + depthRatio * 0.2,
            brightness: brightness,
          });
        }
      }
    }

    debrisRef.current = [...debrisRef.current, ...newDebris];
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-900">
      <div
        className="absolute inset-0"
        style={
          {
            "--side": lithosRoomConfig.dimensions.side,
            "--ceiling": lithosRoomConfig.dimensions.ceiling,
            "--floor": lithosRoomConfig.dimensions.floor,
          } as React.CSSProperties
        }
      >
        {/* LEFT WALL - 시멘트 벽 */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, rgb(100, 100, 105), rgb(120, 120, 125))",
            clipPath:
              "polygon(0% 0%, var(--side) var(--ceiling), var(--side) calc(100% - var(--floor)), 0% 100%)",
          }}
        />

        {/* RIGHT WALL - 시멘트 벽 */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to left, rgb(100, 100, 105), rgb(120, 120, 125))",
            clipPath:
              "polygon(100% 0%, calc(100% - var(--side)) var(--ceiling), calc(100% - var(--side)) calc(100% - var(--floor)), 100% 100%)",
          }}
        />

        {/* BOTTOM - 시멘트 바닥 */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgb(80, 80, 85), rgb(100, 100, 105))",
            clipPath:
              "polygon(0% 100%, var(--side) calc(100% - var(--floor)), calc(100% - var(--side)) calc(100% - var(--floor)), 100% 100%)",
          }}
        />

        {/* TOP - Canvas로 시멘트 천장 렌더링 */}
        <div className="absolute inset-0 pointer-events-none">
          <canvas
            ref={canvasRef}
            className="pointer-events-auto block h-full w-full cursor-crosshair"
            onClick={handleClick}
          />
        </div>
      </div>
    </div>
  );
}
