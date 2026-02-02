// 방 컴포넌트 (천장, 바닥, 벽 메쉬)

"use client";

import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useSceneStore } from "@/store/sceneStore";
import { cellKey } from "../utils/gridUtils";
import { useGridWallTexture } from "../wallTexture";
import {
  CEILING_FLAT,
  FLOOR_FLAT,
  LEFT_WALL_FLAT,
  RIGHT_WALL_FLAT,
} from "../wallTexts";
import {
  ROOM_WIDTH,
  ROOM_HEIGHT,
  ROOM_DEPTH,
  SURFACE_TEXTURE_SIZE,
  CEILING_GRID_ROWS,
  CEILING_GRID_COLS,
  FLOOR_GRID_ROWS,
  FLOOR_GRID_COLS,
  LEFT_WALL_GRID_ROWS,
  LEFT_WALL_GRID_COLS,
  RIGHT_WALL_GRID_ROWS,
  RIGHT_WALL_GRID_COLS,
  BACK_WALL_GRID_ROWS,
  BACK_WALL_GRID_COLS,
  CEILING_FONT_SCALE_X,
  CEILING_FONT_SCALE_Y,
  FLOOR_FONT_SCALE_X,
  FLOOR_FONT_SCALE_Y,
  LEFT_WALL_FONT_SCALE_X,
  LEFT_WALL_FONT_SCALE_Y,
  RIGHT_WALL_FONT_SCALE_X,
  RIGHT_WALL_FONT_SCALE_Y,
  BACK_WALL_GRID_LINE_WIDTH,
  BACK_WALL_MAX_CHARS,
  WALL_EMPTY_COLOR,
} from "../config";

export default function Room() {
  const setLetterCells = useSceneStore((s) => s.setLetterCells);
  const removedSpots = useSceneStore((s) => s.removedSpots);

  /** emerged !== false인 spot만 텍스처에서 빈 칸으로 칠함. false면 아직 3D 글자가 벽면까지 안 나온 상태 */
  const emergedSpots = useMemo(
    () => removedSpots.filter((s) => s.emerged !== false),
    [removedSpots]
  );

  const ceilingRemoved = useMemo(
    () =>
      new Set(
        emergedSpots
          .filter((s) => s.surface === "ceiling" && s.row != null && s.col != null)
          .map((s) => cellKey(s.row!, s.col!))
      ),
    [emergedSpots]
  );

  const leftRemoved = useMemo(
    () =>
      new Set(
        emergedSpots
          .filter((s) => s.surface === "left" && s.row != null && s.col != null)
          .map((s) => cellKey(s.row!, s.col!))
      ),
    [emergedSpots]
  );

  const rightRemoved = useMemo(
    () =>
      new Set(
        emergedSpots
          .filter((s) => s.surface === "right" && s.row != null && s.col != null)
          .map((s) => cellKey(s.row!, s.col!))
      ),
    [emergedSpots]
  );

  const floorRemoved = useMemo(
    () =>
      new Set(
        emergedSpots
          .filter((s) => s.surface === "floor" && s.row != null && s.col != null)
          .map((s) => cellKey(s.row!, s.col!))
      ),
    [emergedSpots]
  );

  // 뒷벽: 그리드만 표시. 글자는 텍스처에 안 그리고, 날아온 스티커(3D 글자)가 그리드 칸(content) 안에 붙음
  const backWallDisplay = useMemo(() => " ".repeat(BACK_WALL_MAX_CHARS), []);

  const backRemoved = useMemo(() => {
    const s = new Set<string>();
    for (let i = 0; i < BACK_WALL_MAX_CHARS; i += 1) {
      s.add(cellKey(Math.floor(i / BACK_WALL_GRID_COLS), i % BACK_WALL_GRID_COLS));
    }
    return s;
  }, []);

  const ceiling = useGridWallTexture(
    CEILING_FLAT,
    "rgb(140, 140, 145)",
    SURFACE_TEXTURE_SIZE.ceiling.w,
    SURFACE_TEXTURE_SIZE.ceiling.h,
    CEILING_GRID_ROWS,
    CEILING_GRID_COLS,
    ceilingRemoved,
    WALL_EMPTY_COLOR,
    CEILING_FONT_SCALE_X,
    CEILING_FONT_SCALE_Y
  );

  const leftWall = useGridWallTexture(
    LEFT_WALL_FLAT,
    "#6b7280",
    SURFACE_TEXTURE_SIZE.left.w,
    SURFACE_TEXTURE_SIZE.left.h,
    LEFT_WALL_GRID_ROWS,
    LEFT_WALL_GRID_COLS,
    leftRemoved,
    WALL_EMPTY_COLOR,
    LEFT_WALL_FONT_SCALE_X,
    LEFT_WALL_FONT_SCALE_Y
  );

  const rightWall = useGridWallTexture(
    RIGHT_WALL_FLAT,
    "#6b7280",
    SURFACE_TEXTURE_SIZE.right.w,
    SURFACE_TEXTURE_SIZE.right.h,
    RIGHT_WALL_GRID_ROWS,
    RIGHT_WALL_GRID_COLS,
    rightRemoved,
    WALL_EMPTY_COLOR,
    RIGHT_WALL_FONT_SCALE_X,
    RIGHT_WALL_FONT_SCALE_Y
  );

  const floor = useGridWallTexture(
    FLOOR_FLAT,
    "#4b5563",
    SURFACE_TEXTURE_SIZE.floor.w,
    SURFACE_TEXTURE_SIZE.floor.h,
    FLOOR_GRID_ROWS,
    FLOOR_GRID_COLS,
    floorRemoved,
    WALL_EMPTY_COLOR,
    FLOOR_FONT_SCALE_X,
    FLOOR_FONT_SCALE_Y
  );

  const backWall = useGridWallTexture(
    backWallDisplay,
    "#6b7280",
    SURFACE_TEXTURE_SIZE.back.w,
    SURFACE_TEXTURE_SIZE.back.h,
    BACK_WALL_GRID_ROWS,
    BACK_WALL_GRID_COLS,
    backRemoved,
    WALL_EMPTY_COLOR,
    1,
    1,
    BACK_WALL_GRID_LINE_WIDTH
    // gridLineColor 미전달 → 격자선 투명
  );

  useEffect(() => {
    if (ceiling.cells.length > 0)
      setLetterCells(
        "ceiling",
        ceiling.cells,
        SURFACE_TEXTURE_SIZE.ceiling.w,
        SURFACE_TEXTURE_SIZE.ceiling.h
      );
  }, [ceiling.cells, setLetterCells]);

  useEffect(() => {
    if (leftWall.cells.length > 0)
      setLetterCells(
        "left",
        leftWall.cells,
        SURFACE_TEXTURE_SIZE.left.w,
        SURFACE_TEXTURE_SIZE.left.h
      );
  }, [leftWall.cells, setLetterCells]);

  useEffect(() => {
    if (rightWall.cells.length > 0)
      setLetterCells(
        "right",
        rightWall.cells,
        SURFACE_TEXTURE_SIZE.right.w,
        SURFACE_TEXTURE_SIZE.right.h
      );
  }, [rightWall.cells, setLetterCells]);

  useEffect(() => {
    if (floor.cells.length > 0)
      setLetterCells(
        "floor",
        floor.cells,
        SURFACE_TEXTURE_SIZE.floor.w,
        SURFACE_TEXTURE_SIZE.floor.h
      );
  }, [floor.cells, setLetterCells]);

  return (
    <group>
      {/* 바닥 */}
      {floor.texture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -ROOM_HEIGHT / 2, 0]}>
          <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
          <meshBasicMaterial
            map={floor.texture}
            transparent={true}
            opacity={1}
            alphaTest={0.01}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 천장: 투명 배경 + 회색 텍스트 패턴 */}
      {ceiling.texture && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT / 2, 0]}>
          <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
          <meshBasicMaterial
            map={ceiling.texture}
            transparent={true}
            opacity={1}
            alphaTest={0.01}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 뒷벽 — 배경·격자선 투명, 스티커(글자)만 보임 */}
      {backWall.texture && (
        <mesh position={[0, 0, -ROOM_DEPTH / 2]}>
          <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
          <meshBasicMaterial
            map={backWall.texture}
            transparent={true}
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 왼쪽 벽 */}
      {leftWall.texture && (
        <mesh rotation={[0, Math.PI / 2, 0]} position={[-ROOM_WIDTH / 2, 0, 0]}>
          <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
          <meshBasicMaterial
            map={leftWall.texture}
            transparent={true}
            opacity={1}
            alphaTest={0.01}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 오른쪽 벽 */}
      {rightWall.texture && (
        <mesh rotation={[0, -Math.PI / 2, 0]} position={[ROOM_WIDTH / 2, 0, 0]}>
          <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
          <meshBasicMaterial
            map={rightWall.texture}
            transparent={true}
            opacity={1}
            alphaTest={0.01}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
