// 벽 텍스처 생성 React 훅

import { useEffect, useState } from "react";
import * as THREE from "three";
import type { CharCell } from "@/store/sceneStore";
import { createGridWallTextureSVG, createTiledTextTexture } from "./textureCreator";

/** 격자 벽지용 훅: removedCells에 있는 (row,col)은 0(빈곳)으로 배경색 처리. gridLineColor 미주입 시 투명 */
export function useGridWallTexture(
  flatText: string,
  color: string,
  width: number,
  height: number,
  gridRows: number,
  gridCols: number,
  removedCells: Set<string>,
  emptyColor: string,
  fontScaleX: number = 1,
  fontScaleY: number = 1,
  lineWidth: number = 5,
  gridLineColor?: string
) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const [cells, setCells] = useState<CharCell[]>([]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const load = async () => {
      // SVG 이미지 기반 텍스처 생성
      const { texture: tex, cells: c } = await createGridWallTextureSVG(
        flatText,
        color,
        width,
        height,
        gridRows,
        gridCols,
        removedCells,
        emptyColor,
        fontScaleX,
        fontScaleY,
        lineWidth,
        gridLineColor ?? "rgba(100, 100, 105, )"
      );
      setTexture(tex);
      setCells(c);
    };
    load();
  }, [
    flatText,
    color,
    width,
    height,
    gridRows,
    gridCols,
    removedCells,
    emptyColor,
    fontScaleX,
    fontScaleY,
    lineWidth,
    gridLineColor,
  ]);

  return { texture, cells };
}

export function useTextTexture(textRows: string[], color: string, width: number, height: number) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const [cells, setCells] = useState<CharCell[]>([]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const loadFontAndTexture = async () => {
      try {
        const font = new FontFace("LithosRoom", 'url("/fonts/lithos_font.ttf") format("truetype")');
        const loaded = await font.load();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).fonts.add(loaded);
      } catch {
        // 폰트 로드 실패 시에도 기본 폰트로 진행
      }

      const { texture: tex, cells: c } = createTiledTextTexture(textRows, color, width, height);
      setTexture(tex);
      setCells(c);
    };

    loadFontAndTexture();
  }, [textRows, color, width, height]);

  return { texture, cells };
}
