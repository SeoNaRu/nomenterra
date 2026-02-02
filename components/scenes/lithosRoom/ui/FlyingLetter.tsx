// 날아가는 글자 컴포넌트 (벽면 → 뒷벽으로 비행)

"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneStore, type LetterSourceSpot } from "@/store/sceneStore";
import { sourcePosition } from "../coordinates";
import { getSurfaceTextColor, getStartRotation } from "../surfaceUtils";
import { svgImageCache, svgTextureCache, loadSVGImage } from "../wallTexture";
import { parseColor } from "../utils/colorUtils";
import { getGridLayout } from "../utils/gridUtils";
import { hashTo01 } from "../utils/hashUtils";
import {
  ROOM_WIDTH,
  ROOM_HEIGHT,
  ROOM_DEPTH,
  SURFACE_TEXTURE_SIZE,
  BACK_WALL_GRID_ROWS,
  BACK_WALL_GRID_COLS,
  BACK_WALL_TARGET_OFFSET_X,
  BACK_WALL_TARGET_OFFSET_Y,
  BACK_WALL_TARGET_OFFSET_Z,
  BACK_WALL_FLYING_FONT_SIZE,
  BACK_WALL_FLYING_FONT_SCALE_X,
  BACK_WALL_FLYING_FONT_SCALE_Y,
  BACK_WALL_GRID_LINE_WIDTH,
} from "../config";

interface LetterProps {
  index: number;
  total: number;
  id: string;
  char: string;
  createdAt: number;
  /** addLetters로 배치 추가 시 이미 배정된 출발 위치 */
  sourceSpot?: LetterSourceSpot;
}

export function FlyingLetter({ index, id, char, createdAt, sourceSpot }: LetterProps) {
  const ref = useRef<THREE.Group>(null);
  const addedSpotRef = useRef(false);
  const addRemovedSpot = useSceneStore((s) => s.addRemovedSpot);
  const setSpotEmerged = useSceneStore((s) => s.setSpotEmerged);

  const { start, surface, row, col } = useMemo(() => {
    if (sourceSpot) {
      const startVec = new THREE.Vector3(...sourceSpot.position);
      return {
        start: startVec,
        surface: sourceSpot.surface,
        row: sourceSpot.row,
        col: sourceSpot.col,
      };
    }
    const out = sourcePosition(id, char);
    const startVec = new THREE.Vector3(...out.position);
    return {
      start: startVec,
      surface: out.surface,
      row: out.row,
      col: out.col,
    };
  }, [id, char, sourceSpot]);

  const readyRef = useRef(false); // 떨어질 준비 완료 플래그

  useEffect(() => {
    if (sourceSpot) return; // sourceSpot이 있으면 나중에 처리
    if (addedSpotRef.current) return;
    addedSpotRef.current = true;
    addRemovedSpot({
      id,
      position: [start.x, start.y, start.z],
      surface,
      row,
      col,
    });
  }, [sourceSpot, id, addRemovedSpot, start.x, start.y, start.z, surface, row, col]);

  // 스티커가 붙는 위치: 뒷벽 그리드의 해당 칸 중심 (그리드 안, 격자선 제외한 content 영역에 맞춤)
  const target = useMemo(() => {
    const backCol = index % BACK_WALL_GRID_COLS;
    const backRow = Math.floor(index / BACK_WALL_GRID_COLS);
    const cellW = ROOM_WIDTH / BACK_WALL_GRID_COLS;
    const cellH = ROOM_HEIGHT / BACK_WALL_GRID_ROWS;
    const x = -ROOM_WIDTH / 2 + (backCol + 0.5) * cellW + BACK_WALL_TARGET_OFFSET_X;
    const y = ROOM_HEIGHT / 2 - (backRow + 0.5) * cellH + BACK_WALL_TARGET_OFFSET_Y;
    const z = -ROOM_DEPTH / 2 + 0.02 + BACK_WALL_TARGET_OFFSET_Z;
    return new THREE.Vector3(x, y, z);
  }, [index]);

  const startRot = useMemo(() => getStartRotation(surface), [surface]);
  const endQuat = useMemo(() => new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)), []);
  const startQuat = useMemo(() => new THREE.Quaternion().setFromEuler(startRot), [startRot]);

  // 화면 중앙을 지나는 랜덤 중간점 (각 글자마다 고유, id 기반 해시로 결정적)
  const midPoint = useMemo(() => {
    const randomOffsetX = (hashTo01(id + "-midX") - 0.5) * 1.5; // 중앙 ±0.75 범위
    const randomOffsetY = (hashTo01(id + "-midY") - 0.5) * 1.0; // 중앙 ±0.5 범위
    const randomOffsetZ = (hashTo01(id + "-midZ") - 0.5) * 1.0; // 중앙 ±0.5 범위
    return new THREE.Vector3(randomOffsetX, randomOffsetY, randomOffsetZ);
  }, [id]);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;

    // ——— 날아오는 속도/시간 관리 (여기서 조절) ———
    const PREPARE_DURATION = 1; // 떨어질 준비 시간(초) - 벽 글자가 서서히 투명해짐
    const FLY_DURATION = 3; // 날아가는 시간(초)
    // 스티커 크기: 그리드 칸 안쪽(content, 격자선 제외)과 동일하게 getGridLayout 기준으로 계산
    const backTexW = SURFACE_TEXTURE_SIZE.back.w;
    const backTexH = SURFACE_TEXTURE_SIZE.back.h;
    const backGrid = getGridLayout(
      backTexW,
      backTexH,
      BACK_WALL_GRID_ROWS,
      BACK_WALL_GRID_COLS,
      BACK_WALL_GRID_LINE_WIDTH
    );
    const contentCellW = backGrid.contentWidth * (ROOM_WIDTH / backTexW);
    const contentCellH = backGrid.contentHeight * (ROOM_HEIGHT / backTexH);
    const scaleXAtBackWall =
      (contentCellW / BACK_WALL_FLYING_FONT_SIZE) * BACK_WALL_FLYING_FONT_SCALE_X;
    const scaleYAtBackWall =
      (contentCellH / BACK_WALL_FLYING_FONT_SIZE) * BACK_WALL_FLYING_FONT_SCALE_Y;
    // —————————————————————————————————————————————

    const age = (performance.now() - createdAt) / 1000;

    if (age < PREPARE_DURATION) {
      // 준비 단계: 벽 위치에서 대기, 투명 상태 (벽 글자가 서서히 투명해지는 시간)
      g.position.copy(start);
      g.quaternion.copy(startQuat);
      g.scale.set(1, 1, 1);
      g.visible = false; // 날아가는 객체는 아직 보이지 않음
      return;
    }

    // 준비 완료: 벽 글자를 완전히 투명 처리
    if (!readyRef.current && sourceSpot) {
      readyRef.current = true;
      setSpotEmerged(id);
    }

    // 날아가는 단계
    g.visible = true;
    const flyAge = age - PREPARE_DURATION;
    const t = Math.min(flyAge / FLY_DURATION, 1);

    // 부드러운 easing
    const ease = 1 - Math.pow(1 - t, 3);

    // Quadratic Bezier Curve (벽 위치 → 화면 중앙 → 뒷벽)
    // P(t) = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2
    const oneMinusT = 1 - ease;
    const pos = new THREE.Vector3(
      oneMinusT * oneMinusT * start.x + 2 * oneMinusT * ease * midPoint.x + ease * ease * target.x,
      oneMinusT * oneMinusT * start.y + 2 * oneMinusT * ease * midPoint.y + ease * ease * target.y,
      oneMinusT * oneMinusT * start.z + 2 * oneMinusT * ease * midPoint.z + ease * ease * target.z
    );

    // 크기 변화 (벽 크기 → 뒷벽 칸 크기)
    const scaleX = THREE.MathUtils.lerp(1, scaleXAtBackWall, ease);
    const scaleY = THREE.MathUtils.lerp(1, scaleYAtBackWall, ease);

    // 벽 방향 → 정면으로 부드럽게 회전
    g.quaternion.slerpQuaternions(startQuat, endQuat, ease);

    g.position.copy(pos);
    g.scale.set(scaleX, scaleY, 1);
  });

  const textColor = useMemo(() => getSurfaceTextColor(surface), [surface]);

  const svgTexture = useMemo(() => {
    const cacheKey = `${char}-${textColor}`;

    // 캐시된 텍스처가 있으면 바로 반환
    if (svgTextureCache[cacheKey]) {
      return svgTextureCache[cacheKey];
    }

    // 캐시된 이미지 사용
    const img = svgImageCache[char];
    if (!img) {
      // 이미지가 아직 로드 안 됨
      loadSVGImage(char).then(() => {
        // 로드 완료 후 재렌더링 유도는 letters 배열 변경으로 자동 발생
      });
      return null;
    }

    // 색상 변환된 텍스처 생성 (크기 축소로 성능 개선)
    const canvas = document.createElement("canvas");
    const size = 128; // 512 → 256 → 128 (16배 빠름)
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    // SVG 그리기
    ctx.drawImage(img, 0, 0, size, size);

    // 색상 변환: 검은색 → textColor, 흰색 → 투명
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    const targetColor = parseColor(textColor);

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;

      if (brightness < 128) {
        // 어두운 부분(검은 글자) → 벽 색상
        data[i] = targetColor.r;
        data[i + 1] = targetColor.g;
        data[i + 2] = targetColor.b;
        data[i + 3] = 255;
      } else {
        // 밝은 부분(흰 배경) → 투명
        data[i + 3] = 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    // 캐시에 저장 (성능 최적화를 위한 전역 캐시)
    // eslint-disable-next-line react-hooks/immutability
    svgTextureCache[cacheKey] = texture;

    return texture;
  }, [char, textColor]);

  if (!svgTexture) return null;

  return (
    <group ref={ref}>
      {svgTexture && (
        <mesh>
          <planeGeometry args={[BACK_WALL_FLYING_FONT_SIZE, BACK_WALL_FLYING_FONT_SIZE]} />
          <meshBasicMaterial map={svgTexture} transparent />
        </mesh>
      )}
    </group>
  );
}

export function FlyingLettersField() {
  const letters = useSceneStore((s) => s.letters);

  if (letters.length === 0) return null;

  return (
    <group>
      {letters.map((l, idx) => (
        <FlyingLetter
          key={l.id}
          id={l.id}
          char={l.char}
          createdAt={l.createdAt}
          index={idx}
          total={letters.length}
          sourceSpot={l.sourceSpot}
        />
      ))}
    </group>
  );
}

/** 개별 SVG 글자 컴포넌트 (날아가는 글자용, 현재 미사용) */
export function LetterSVG({
  char,
  position,
  rotation,
  size,
  color = "#6b7280",
}: {
  char: string;
  position: [number, number, number];
  rotation: [number, number, number];
  size: number;
  color?: string;
}) {
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(`/letters/${char}.svg`);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [char]);

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={texture} transparent color={color} />
    </mesh>
  );
}
