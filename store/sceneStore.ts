// 씬 전역 상태 관리 (Zustand)
// 현재는 빈 뼈대만 제공, 추후 씬 단계(phase) 및 애니메이션 상태 관리에 사용 예정

import { create } from "zustand";
import {
  pixelToWorldWithSize,
  ROOM_WIDTH,
  ROOM_HEIGHT,
  ROOM_DEPTH,
} from "@/components/scenes/lithosRoom/coordinates";
import type {
  ScenePhase,
  LetterSourceSpot,
  SceneLetter,
  CameraPosition,
  RemovedSpot,
  CharCell,
  SurfaceName,
  TextureSize,
  WallLetter,
} from "./sceneTypes";

// 타입 재export (하위 호환성)
export type {
  ScenePhase,
  LetterSourceSpot,
  SceneLetter,
  CameraPosition,
  RemovedSpot,
  CharCell,
  SurfaceName,
  TextureSize,
  WallLetter,
};

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
            position = pixelToWorldWithSize(s, cell.px, cell.py, size);
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
