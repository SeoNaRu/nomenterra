// 좌표 변환 (픽셀 → 월드)

import { useSceneStore, type CharCell } from "@/store/sceneStore";
import { hashTo01 } from "./utils/hashUtils";
import { ROOM_WIDTH, ROOM_HEIGHT, ROOM_DEPTH, BASE_TEXTURE_SIZE } from "./config";
import { CEILING_FLAT, LEFT_WALL_FLAT, RIGHT_WALL_FLAT, FLOOR_FLAT } from "./wallTexts";
import { splitIntoRows } from "./utils/textUtils";

export type Surface = "ceiling" | "floor" | "left" | "right";

const CEILING_TEXT = splitIntoRows(CEILING_FLAT, 25);
const LEFT_WALL_TEXT = splitIntoRows(LEFT_WALL_FLAT, 25);
const RIGHT_WALL_TEXT = splitIntoRows(RIGHT_WALL_FLAT, 25);
const FLOOR_TEXT = splitIntoRows(FLOOR_FLAT, 25);

/**
 * 텍스처 픽셀(캔버스 좌표, y=0이 위) → 월드 좌표.
 * 캔버스 크기는 벽면별로 다름(letterTextureSize). u=px/w, v=1-py/h.
 */
export function pixelToWorld(
  surface: Surface,
  px: number,
  py: number,
  inset = 0.01
): [number, number, number] {
  const size = useSceneStore.getState().letterTextureSize[surface];
  const w = size.w > 0 ? size.w : BASE_TEXTURE_SIZE;
  const h = size.h > 0 ? size.h : BASE_TEXTURE_SIZE;
  const u = px / w;
  const v = 1 - py / h; // 캔버스 위 = v=1

  switch (surface) {
    case "ceiling": {
      // plane [W,D], R_x(90): local(x,y,0)→(x,0,y), pos (0,H/2,0). UV(0,1)=로컬 왼쪽 위 → world (-W/2, H/2, D/2). u→x, v→z. v=0→front(-D/2), v=1→back(D/2)
      return [
        -ROOM_WIDTH / 2 + u * ROOM_WIDTH,
        ROOM_HEIGHT / 2 - inset,
        -ROOM_DEPTH / 2 + v * ROOM_DEPTH,
      ];
    }
    case "floor": {
      // plane [W,D], R_x(-90): UV(0,1)→front(-D/2). v=1→front, v=0→back → z = D/2 - v*D (= -D/2 + (1-v)*D)
      return [
        -ROOM_WIDTH / 2 + u * ROOM_WIDTH,
        -ROOM_HEIGHT / 2 + inset,
        -ROOM_DEPTH / 2 + (1 - v) * ROOM_DEPTH,
      ];
    }
    case "left": {
      // plane [D,H], R_y(90): local(x,y,0)→(0,y,x), pos (-W/2,0,0). UV(0,1)=로컬 왼쪽 위 → world (-W/2, H/2, -D/2). u→z(-D/2~D/2), v→y
      return [
        -ROOM_WIDTH / 2 + inset,
        -ROOM_HEIGHT / 2 + v * ROOM_HEIGHT,
        -ROOM_DEPTH / 2 + u * ROOM_DEPTH,
      ];
    }
    case "right": {
      // plane [D,H], R_y(-90): local(x,y,0)→(0,y,-x), pos (W/2,0,0). UV(0,1)→(W/2,H/2,D/2). u=0→z=D/2, u=1→z=-D/2
      return [
        ROOM_WIDTH / 2 - inset,
        -ROOM_HEIGHT / 2 + v * ROOM_HEIGHT,
        ROOM_DEPTH / 2 - u * ROOM_DEPTH,
      ];
    }
  }
}

/**
 * 텍스처 픽셀 → 월드 좌표 (size를 직접 전달하는 버전, sceneStore에서 사용)
 */
export function pixelToWorldWithSize(
  surface: Surface,
  px: number,
  py: number,
  size: { w: number; h: number },
  inset = 0.01
): [number, number, number] {
  const w = size.w > 0 ? size.w : BASE_TEXTURE_SIZE;
  const h = size.h > 0 ? size.h : BASE_TEXTURE_SIZE;
  const u = px / w;
  const v = 1 - py / h;

  switch (surface) {
    case "ceiling":
      return [
        -ROOM_WIDTH / 2 + u * ROOM_WIDTH,
        ROOM_HEIGHT / 2 - inset,
        -ROOM_DEPTH / 2 + v * ROOM_DEPTH,
      ];
    case "floor":
      return [
        -ROOM_WIDTH / 2 + u * ROOM_WIDTH,
        -ROOM_HEIGHT / 2 + inset,
        -ROOM_DEPTH / 2 + (1 - v) * ROOM_DEPTH,
      ];
    case "left":
      return [
        -ROOM_WIDTH / 2 + inset,
        -ROOM_HEIGHT / 2 + v * ROOM_HEIGHT,
        -ROOM_DEPTH / 2 + u * ROOM_DEPTH,
      ];
    case "right":
      return [
        ROOM_WIDTH / 2 - inset,
        -ROOM_HEIGHT / 2 + v * ROOM_HEIGHT,
        ROOM_DEPTH / 2 - u * ROOM_DEPTH,
      ];
  }
}

// ROOM 상수 export (sceneStore에서 사용)
export { ROOM_WIDTH, ROOM_HEIGHT, ROOM_DEPTH } from "./config";

/** 벽면 순서대로 쭉 이은 배열에서, 해당 글자의 "몇 번째 인스턴스"인지 좌표로 뽑기 */
export function sourcePosition(
  id: string,
  char: string
): { position: [number, number, number]; surface: Surface; row?: number; col?: number } {
  const letterCells = useSceneStore.getState().letterCells;
  const removedSpots = useSceneStore.getState().removedSpots;
  const c = char.toUpperCase();

  const surfaces: Surface[] = ["ceiling", "floor", "left", "right"];
  const allCellsWithSurface: { surface: Surface; cell: CharCell }[] = [];
  for (const s of surfaces) {
    const cells = letterCells[s];
    for (const cell of cells) {
      allCellsWithSurface.push({ surface: s, cell });
    }
  }

  const usedKeys = new Set(
    removedSpots
      .filter((spot) => spot.surface && spot.row != null && spot.col != null)
      .map((spot) => `${spot.surface}:${spot.row},${spot.col}`)
  );

  const sameCharInOrder = allCellsWithSurface.filter(
    ({ surface, cell }) => cell.char === c && !usedKeys.has(`${surface}:${cell.row},${cell.col}`)
  );

  if (sameCharInOrder.length > 0) {
    const { surface: s, cell } = sameCharInOrder[0];
    const world = pixelToWorld(s, cell.px, cell.py);
    return { position: world, surface: s, row: cell.row, col: cell.col };
  }

  // 해당 글자 남은 인스턴스 없음(다 씀) 또는 폰트 로드 전: 해시로 대략 위치만 반환
  const r1 = hashTo01(id + "-x");
  const r2 = hashTo01(id + "-z");
  const flat = (rows: string[]) => rows.join("");
  const options: Surface[] = [];
  if (flat(CEILING_TEXT).includes(c)) options.push("ceiling");
  if (flat(LEFT_WALL_TEXT).includes(c)) options.push("left");
  if (flat(RIGHT_WALL_TEXT).includes(c)) options.push("right");
  if (flat(FLOOR_TEXT).includes(c)) options.push("floor");
  const s: Surface =
    options.length > 0
      ? options[Math.floor(hashTo01(id) * options.length) % options.length]
      : "ceiling";
  if (s === "ceiling") {
    return {
      position: [(r1 - 0.5) * ROOM_WIDTH, ROOM_HEIGHT / 2 - 0.01, (r2 - 0.5) * ROOM_DEPTH],
      surface: s,
    };
  }
  if (s === "floor") {
    return {
      position: [(r1 - 0.5) * ROOM_WIDTH, -ROOM_HEIGHT / 2 + 0.01, (r2 - 0.5) * ROOM_DEPTH],
      surface: s,
    };
  }
  if (s === "left") {
    return {
      position: [-ROOM_WIDTH / 2 + 0.01, (r1 - 0.5) * ROOM_HEIGHT, (r2 - 0.5) * ROOM_DEPTH],
      surface: s,
    };
  }
  return {
    position: [ROOM_WIDTH / 2 - 0.01, (r1 - 0.5) * ROOM_HEIGHT, (r2 - 0.5) * ROOM_DEPTH],
    surface: "right",
  };
}
