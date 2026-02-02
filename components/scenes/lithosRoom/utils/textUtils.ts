// 텍스트 처리 유틸리티

/** 한 줄당 글자 수로 잘라서 행 리스트로 만듦 — (row, col)에 어떤 글자인지 정확히 알 수 있음 */
export function splitIntoRows(flat: string, charsPerRow: number): string[] {
  const rows: string[] = [];
  for (let i = 0; i < flat.length; i += charsPerRow) {
    rows.push(flat.slice(i, i + charsPerRow));
  }
  return rows;
}
