// Lithos Room 씬 설정
// 씬별 설정값 정의

// CSS 변수 타입 정의 (vmin 단위 문자열)
export const ROOM_DIMENSIONS = {
  side: "12vmin", // 벽 두께 (안쪽 모서리의 x좌표)
  ceiling: "35vmin", // 천장 깊이 (사다리꼴 아래 모서리의 y좌표)
  floor: "6vmin", // 바닥 높이 (바닥이 위로 올라오는 높이)
} as const;

// JavaScript에서 사용할 숫자 값 (vmin 계산용)
export const ROOM_VALUES = {
  side: 12,
  ceiling: 35,
  floor: 6,
} as const;

export const lithosRoomConfig = {
  // 방 크기
  dimensions: ROOM_DIMENSIONS,
  values: ROOM_VALUES,
};
