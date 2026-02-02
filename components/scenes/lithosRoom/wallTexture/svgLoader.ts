// SVG 이미지 로딩 및 캐싱

import * as THREE from "three";

/**
 * SVG 이미지 캐시 (A-Z)
 */
export const svgImageCache: Record<string, HTMLImageElement> = {};

/**
 * 색상 변환된 SVG Canvas 캐시 (벽 텍스처용 - char-color 조합)
 */
export const svgCanvasCache: Record<string, HTMLCanvasElement> = {};

/**
 * 색상 변환된 SVG Texture 캐시 (날아가는 글자용 - char-color 조합)
 */
export const svgTextureCache: Record<string, THREE.CanvasTexture> = {};

/**
 * SVG 파일을 Image로 로드 (캐시 사용)
 */
export async function loadSVGImage(char: string): Promise<HTMLImageElement> {
  if (svgImageCache[char]) {
    return svgImageCache[char];
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      svgImageCache[char] = img;
      resolve(img);
    };
    img.onerror = reject;
    img.src = `/letters/${char}.svg`;
  });
}
