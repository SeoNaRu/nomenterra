// 씬 전역 타입 정의

// 씬 단계 타입 정의
export type ScenePhase = "IDLE" | "LOADING" | "PLAYING" | "PAUSED";

export type SurfaceName = "ceiling" | "floor" | "left" | "right";

/** 벽면별 텍스처(캔버스) 크기 — 픽셀→월드 변환 시 사용 */
export type TextureSize = { w: number; h: number };

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

/** 벽에 붙어 있는 개별 글자 (3D Text로 렌더링, 호출 시 실제로 떨어져 나감) */
export interface WallLetter {
  id: string;
  surface: SurfaceName;
  row: number;
  col: number;
  char: string;
  position: [number, number, number];
}
