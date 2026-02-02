// Lithos Room 씬 설정 (방 크기, 그리드, 텍스처, 폰트 배율 등)

// 방 크기 (월드 좌표 단위)
export const ROOM_WIDTH = 30;
export const ROOM_HEIGHT = 10;
export const ROOM_DEPTH = 30;

// 벽면 비율에 맞춘 캔버스 해상도 (짧은 쪽 = BASE)
export const BASE_TEXTURE_SIZE = 1024;

// 벽면별 캔버스 크기 (월드 비율과 동일: 천장/바닥 30x30, 좌우·뒷벽 30x10)
export const SURFACE_TEXTURE_SIZE = {
  ceiling: { w: BASE_TEXTURE_SIZE, h: BASE_TEXTURE_SIZE }, // 30x30 → 1:1
  floor: { w: BASE_TEXTURE_SIZE, h: BASE_TEXTURE_SIZE },
  left: { w: Math.round(BASE_TEXTURE_SIZE * (ROOM_DEPTH / ROOM_HEIGHT)), h: BASE_TEXTURE_SIZE }, // 30x10 → 3:1
  right: { w: Math.round(BASE_TEXTURE_SIZE * (ROOM_DEPTH / ROOM_HEIGHT)), h: BASE_TEXTURE_SIZE },
  back: { w: Math.round(BASE_TEXTURE_SIZE * (ROOM_WIDTH / ROOM_HEIGHT)), h: BASE_TEXTURE_SIZE }, // 뒷벽 30x10
} as const;

// 벽면별 격자: 행 × 열 (각 구역에 글자 하나씩)
export const CEILING_GRID_ROWS = 20;
export const CEILING_GRID_COLS = 20;
export const FLOOR_GRID_ROWS = 20;
export const FLOOR_GRID_COLS = 20;
export const LEFT_WALL_GRID_ROWS = 10;
export const LEFT_WALL_GRID_COLS = 30;
export const RIGHT_WALL_GRID_ROWS = 10;
export const RIGHT_WALL_GRID_COLS = 30;
export const BACK_WALL_GRID_ROWS = 10;
export const BACK_WALL_GRID_COLS = 30;

// 그리드 칸 안 글자 크기 배율 — 가로·세로 따로 미세 조정 (1 = content에 꽉 참)
export const CEILING_FONT_SCALE_X = 1.02;
export const CEILING_FONT_SCALE_Y = 1.02;
export const FLOOR_FONT_SCALE_X = 1.026;
export const FLOOR_FONT_SCALE_Y = 1.02;
export const LEFT_WALL_FONT_SCALE_X = 1;
export const LEFT_WALL_FONT_SCALE_Y = 1.01;
export const RIGHT_WALL_FONT_SCALE_X = 1;
export const RIGHT_WALL_FONT_SCALE_Y = 1.01;

// 뒷벽 설정
export const BACK_WALL_GRID_LINE_WIDTH = 8; // 격자선 두께 (px)
export const BACK_WALL_BG_COLOR = "#f1f5f9"; // 배경색
export const BACK_WALL_GRID_LINE_COLOR = "#eab308"; // 격자 그리드선 색 (노랑)
export const BACK_WALL_TARGET_OFFSET_X = 0; // 스티커 붙는 위치 보정 (가로)
export const BACK_WALL_TARGET_OFFSET_Y = -0.05; // 스티커 붙는 위치 보정 (세로, 음수면 밑으로)
export const BACK_WALL_TARGET_OFFSET_Z = 0.06; // z 오프셋 (z-fighting 방지)
export const BACK_WALL_FLYING_FONT_SIZE = 1; // 스티커 기본 크기
export const BACK_WALL_FLYING_FONT_SCALE_X = 1.05; // 스티커 가로 배율
export const BACK_WALL_FLYING_FONT_SCALE_Y = 1.05; // 스티커 세로 배율
export const BACK_WALL_LETTER_SPACING = 0.12; // 글자 자간
export const BACK_WALL_TEXT_SDF_GLYPH_SIZE = 128; // 글자 해상도
export const BACK_WALL_MAX_CHARS = BACK_WALL_GRID_ROWS * BACK_WALL_GRID_COLS;

// 벽면 빈 칸 배경색
export const WALL_EMPTY_COLOR = "#e5e7eb";
