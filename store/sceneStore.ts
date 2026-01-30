// 씬 전역 상태 관리 (Zustand)
// 현재는 빈 뼈대만 제공, 추후 씬 단계(phase) 및 애니메이션 상태 관리에 사용 예정

import { create } from "zustand";

/** 방 크기 (Scene.tsx와 동일, 픽셀→월드 변환용) */
const ROOM_WIDTH = 30;
const ROOM_HEIGHT = 10;
const ROOM_DEPTH = 30;

function pixelToWorld(
  surface: SurfaceName,
  px: number,
  py: number,
  size: { w: number; h: number },
  inset = 0.01
): [number, number, number] {
  const w = size.w > 0 ? size.w : 1024;
  const h = size.h > 0 ? size.h : 1024;
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

// 씬 단계 타입 정의
export type ScenePhase = "IDLE" | "LOADING" | "PLAYING" | "PAUSED";

/** 글자 하나의 출발 위치(배치 배정 시 저장) */
export interface LetterSourceSpot {
  position: [number, number, number];
  surface: SurfaceName;
  row?: number;
  col?: number;
}

export interface SceneLetter {
  id: string;
  char: string; // A-Z
  createdAt: number;
  /** 배치 추가 시 한 번에 배정된 출발 위치(있으면 FlyingLetter가 사용) */
  sourceSpot?: LetterSourceSpot;
}

export interface CameraPosition {
  x: number;
  y: number;
  z: number;
}

/** 글자가 떨어져 나온 벽면 자리(비어 보이게 할 위치) */
export interface RemovedSpot {
  id: string;
  position: [number, number, number];
  surface: "ceiling" | "floor" | "left" | "right";
  /** 그리드 위치 — 어느 (row, col)에서 떨어졌는지 */
  row?: number;
  col?: number;
  /** false: 아직 3D 글자가 벽면까지 안 나옴 → 텍스처에서 칸 지우지 않음. true/undefined: 칸 지움 */
  emerged?: boolean;
}

/** 벽면 그리드 한 칸: 행/열 + 글자 + 픽셀 중심(월드 변환용) */
export interface CharCell {
  row: number;
  col: number;
  char: string;
  px: number;
  py: number;
}

export type SurfaceName = "ceiling" | "floor" | "left" | "right";

/** 벽면별 텍스처(캔버스) 크기 — 픽셀→월드 변환 시 사용 */
export type TextureSize = { w: number; h: number };

/** 벽에 붙어 있는 개별 글자 (3D Text로 렌더링, 호출 시 실제로 떨어져 나감) */
export interface WallLetter {
  id: string;
  surface: SurfaceName;
  row: number;
  col: number;
  char: string;
  position: [number, number, number];
}

interface SceneState {
  phase: ScenePhase;
  letters: SceneLetter[];
  removedSpots: RemovedSpot[];
  wallLetters: WallLetter[];
  cameraPosition: CameraPosition;
  letterCells: Record<SurfaceName, CharCell[]>;
  /** 벽면별 캔버스 크기 (벽면 비율에 맞춤) */
  letterTextureSize: Record<SurfaceName, TextureSize>;
  setCameraPosition: (x: number, y: number, z: number) => void;
  setLetterCells: (
    surface: SurfaceName,
    cells: CharCell[],
    textureW: number,
    textureH: number
  ) => void;
  addLetter: (char: string) => void;
  /** 여러 글자 한 번에 추가 — 각 글자마다 서로 다른 벽면 셀에서 출발하도록 배정 */
  addLetters: (chars: string[]) => void;
  addRemovedSpot: (spot: RemovedSpot) => void;
  /** 커맨드로 추가된 글자가 벽면까지 나온 뒤 호출 — 해당 spot을 텍스처에서 빈 칸으로 칠함 */
  setSpotEmerged: (id: string) => void;
  /** 벽 글자 초기화 (특정 surface의 모든 글자 추가) */
  initWallLetters: (surface: SurfaceName, letters: WallLetter[]) => void;
  /** 벽에서 특정 글자 제거 (커맨드로 호출되어 날아갈 때) */
  removeWallLetter: (id: string) => void;
  resetLetters: () => void;
}

export const useSceneStore = create<SceneState>()((set) => ({
  phase: "IDLE",
  letters: [],
  removedSpots: [],
  wallLetters: [],
  cameraPosition: { x: 0, y: 0, z: 25 },
  letterCells: { ceiling: [], floor: [], left: [], right: [] },
  letterTextureSize: {
    ceiling: { w: 0, h: 0 },
    floor: { w: 0, h: 0 },
    left: { w: 0, h: 0 },
    right: { w: 0, h: 0 },
  },
  setCameraPosition: (x, y, z) =>
    set((state) => ({
      ...state,
      cameraPosition: { x, y, z },
    })),
  setLetterCells: (surface, cells, textureW, textureH) =>
    set((state) => ({
      ...state,
      letterCells: { ...state.letterCells, [surface]: cells },
      letterTextureSize: {
        ...state.letterTextureSize,
        [surface]: { w: textureW, h: textureH },
      },
    })),
  addRemovedSpot: (spot) =>
    set((state) => ({
      ...state,
      removedSpots: [...state.removedSpots, { ...spot, emerged: spot.emerged ?? true }],
    })),
  setSpotEmerged: (id) =>
    set((state) => ({
      ...state,
      removedSpots: state.removedSpots.map((s) => (s.id === id ? { ...s, emerged: true } : s)),
    })),
  addLetter: (rawChar: string) =>
    set((state) => {
      const char = rawChar.toUpperCase();
      if (!/^[A-Z]$/.test(char)) {
        return state;
      }
      const MAX_BACK_WALL_CHARS = 1200; // 뒷벽 20×60 그리드
      if (state.letters.length >= MAX_BACK_WALL_CHARS) {
        return state;
      }
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      const id = `${now}-${state.letters.length}-${char}`;
      return {
        ...state,
        letters: [...state.letters, { id, char, createdAt: now }],
      };
    }),
  addLetters: (rawChars: string[]) =>
    set((state) => {
      const MAX_BACK_WALL_CHARS = 1200; // 뒷벽 20×60 그리드
      const chars = rawChars
        .map((c) => c.toUpperCase())
        .filter((c) => /^[A-Z]$/.test(c)) as string[];
      const remaining = MAX_BACK_WALL_CHARS - state.letters.length;
      const toAdd = chars.slice(0, Math.max(0, remaining));
      if (toAdd.length === 0) return state;

      const now = typeof performance !== "undefined" ? performance.now() : Date.now();

      // 우선: wallLetters에서 같은 글자 찾기 (3D Text로 렌더링된 벽)
      const availableWallLetters = [...state.wallLetters];
      const usedWallLetterIds = new Set<string>();

      // 후순위: letterCells에서 같은 글자 찾기 (기존 텍스처 방식)
      const surfaces: SurfaceName[] = ["ceiling", "floor", "left", "right"];
      const allCells: { surface: SurfaceName; cell: CharCell }[] = [];
      for (const s of surfaces) {
        for (const cell of state.letterCells[s]) {
          allCells.push({ surface: s, cell });
        }
      }
      const usedKeys = new Set(
        state.removedSpots
          .filter((spot) => spot.row != null && spot.col != null)
          .map((spot) => `${spot.surface}:${spot.row},${spot.col}`)
      );

      const newLetters: SceneLetter[] = [];
      const newSpots: RemovedSpot[] = [];
      const toRemoveWallLetterIds: string[] = [];

      for (let i = 0; i < toAdd.length; i += 1) {
        const char = toAdd[i];
        const id = `${now}-${state.letters.length + i}-${char}`;

        // 1순위: wallLetters에서 같은 글자 찾기
        const wallLetter = availableWallLetters.find(
          (l) => l.char === char && !usedWallLetterIds.has(l.id)
        );

        let position: [number, number, number];
        let surface: SurfaceName;
        let row: number | undefined;
        let col: number | undefined;

        if (wallLetter) {
          // wallLetter 사용: 원본 글자가 떨어져 나감
          position = wallLetter.position;
          surface = wallLetter.surface;
          row = wallLetter.row;
          col = wallLetter.col;
          usedWallLetterIds.add(wallLetter.id);
          toRemoveWallLetterIds.push(wallLetter.id);
        } else {
          // 2순위: letterCells (텍스처)에서 찾기
          const sameCharAvailable = allCells.filter(
            ({ surface: s, cell }) =>
              cell.char === char && !usedKeys.has(`${s}:${cell.row},${cell.col}`)
          );

          if (sameCharAvailable.length > 0) {
            const { surface: s, cell } = sameCharAvailable[0];
            surface = s;
            row = cell.row;
            col = cell.col;
            usedKeys.add(`${s}:${cell.row},${cell.col}`);
            const size = state.letterTextureSize[s];
            position = pixelToWorld(s, cell.px, cell.py, size);
          } else {
            // 3순위: 랜덤 위치
            const hash = (x: string) => {
              let h = 0;
              for (let j = 0; j < x.length; j += 1) h = (h * 31 + x.charCodeAt(j)) | 0;
              return (h >>> 0) / 0xffffffff;
            };
            const r1 = hash(id + "-x");
            const r2 = hash(id + "-z");
            surface = "ceiling";
            position = [(r1 - 0.5) * ROOM_WIDTH, ROOM_HEIGHT / 2 - 0.01, (r2 - 0.5) * ROOM_DEPTH];
          }
        }

        const spot: RemovedSpot = { id, position, surface, row, col, emerged: false };
        newSpots.push(spot);
        newLetters.push({
          id,
          char,
          createdAt: now,
          sourceSpot: { position, surface, row, col },
        });
      }

      return {
        ...state,
        letters: [...state.letters, ...newLetters],
        removedSpots: [...state.removedSpots, ...newSpots],
        wallLetters: state.wallLetters.filter((l) => !toRemoveWallLetterIds.includes(l.id)),
      };
    }),
  initWallLetters: (surface, letters) =>
    set((state) => ({
      ...state,
      wallLetters: [...state.wallLetters.filter((l) => l.surface !== surface), ...letters],
    })),
  removeWallLetter: (id) =>
    set((state) => ({
      ...state,
      wallLetters: state.wallLetters.filter((l) => l.id !== id),
    })),
  resetLetters: () =>
    set((state) => ({
      ...state,
      letters: [],
      removedSpots: [],
      wallLetters: [],
    })),
}));
