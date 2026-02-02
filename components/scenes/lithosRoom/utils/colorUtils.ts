// 색상 처리 유틸리티

/**
 * CSS 색상 문자열을 RGB 객체로 파싱
 */
export function parseColor(colorStr: string): { r: number; g: number; b: number } {
  // rgb(r, g, b) 형식
  if (colorStr.startsWith("rgb")) {
    const match = colorStr.match(/\d+/g);
    if (match) {
      return { r: parseInt(match[0]), g: parseInt(match[1]), b: parseInt(match[2]) };
    }
  }
  // #RRGGBB 형식
  if (colorStr.startsWith("#")) {
    const hex = colorStr.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  // 기본값 회색
  return { r: 107, g: 114, b: 128 };
}
