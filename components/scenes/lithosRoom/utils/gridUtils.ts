// 그리드 레이아웃 유틸리티

/** 빈 칸 (row,col) 키 — "row,col" */
export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

/** Canvas용 그리드 레이아웃: 칸 크기·선 제외 content 크기 한 번에 계산 (CSS Grid는 DOM용, 캔버스는 이 함수 사용) */
export function getGridLayout(
  width: number,
  height: number,
  gridRows: number,
  gridCols: number,
  lineWidth: number = 5
) {
  const cellWidth = width / gridCols;
  const cellHeight = height / gridRows;
  const contentInset = lineWidth / 2;
  const contentWidth = cellWidth - lineWidth;
  const contentHeight = cellHeight - lineWidth;
  return {
    cellWidth,
    cellHeight,
    contentInset,
    contentWidth,
    contentHeight,
    lineWidth,
  };
}
