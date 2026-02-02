// 해시 유틸리티

/** 해시 기반 간단 랜덤 (0~1) */
export function hashTo01(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  h ^= h >>> 13;
  h ^= h << 7;
  return (h >>> 0) / 0xffffffff;
}
