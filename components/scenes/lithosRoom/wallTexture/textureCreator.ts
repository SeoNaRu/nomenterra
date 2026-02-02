// 벽 텍스처 생성 함수

import * as THREE from "three";
import type { CharCell } from "@/store/sceneStore";
import { getGridLayout, cellKey } from "../utils/gridUtils";
import { parseColor } from "../utils/colorUtils";
import { svgImageCache, svgCanvasCache, loadSVGImage } from "./svgLoader";

/**
 * 격자 벽지: SVG 이미지를 Canvas에 그리기.
 * removedCells에 있는 (row,col)은 투명(빈곳).
 */
export async function createGridWallTextureSVG(
  text: string,
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
  gridLineColor: string = "rgba(100, 100, 105, 0)"
): Promise<{ texture: THREE.CanvasTexture; cells: CharCell[] }> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const cells: CharCell[] = [];

  if (!ctx) {
    return {
      texture: new THREE.CanvasTexture(canvas),
      cells,
    };
  }

  const grid = getGridLayout(width, height, gridRows, gridCols, lineWidth);
  const { cellWidth, cellHeight, contentInset, contentWidth, contentHeight } = grid;

  // 모든 고유 글자의 SVG 미리 로드 (공백 제외)
  const uniqueChars = Array.from(new Set(text.split(""))).filter((ch) => ch.trim() !== "");
  await Promise.all(uniqueChars.map((ch) => loadSVGImage(ch)));

  const textLen = text.length;
  let index = 0;

  for (let row = 0; row < gridRows; row += 1) {
    for (let col = 0; col < gridCols; col += 1) {
      const key = cellKey(row, col);
      const boxLeft = col * cellWidth;
      const boxTop = row * cellHeight;
      const centerX = boxLeft + cellWidth / 2;
      const centerY = boxTop + cellHeight / 2;
      const contentLeft = boxLeft + contentInset;
      const contentTop = boxTop + contentInset;

      const ch = text[index % textLen];
      index += 1;

      cells.push({ row, col, char: ch, px: centerX, py: centerY });

      if (removedCells.has(key)) {
        // 빈 칸: 투명하게 (clearRect) - 스티커 떼낸 자리처럼
        ctx.clearRect(boxLeft, boxTop, cellWidth, cellHeight);
      } else {
        // 공백 문자는 빈 칸으로 (SVG 없음)
        if (ch.trim() === "") {
          ctx.clearRect(boxLeft, boxTop, cellWidth, cellHeight);
          continue;
        }

        // 색상 변환된 SVG 캐시 사용 (매번 픽셀 변환하지 않음)
        const cacheKey = `${ch}-${color}`;
        let coloredCanvas = svgCanvasCache[cacheKey];

        if (!coloredCanvas) {
          const img = svgImageCache[ch];
          if (!img) continue;

          // 임시 캔버스에 색상 변환 (한 번만, 작은 크기로)
          const tempSize = 64;
          coloredCanvas = document.createElement("canvas");
          coloredCanvas.width = tempSize;
          coloredCanvas.height = tempSize;
          const tempCtx = coloredCanvas.getContext("2d");

          if (tempCtx) {
            tempCtx.drawImage(img, 0, 0, tempSize, tempSize);
            const imageData = tempCtx.getImageData(0, 0, tempSize, tempSize);
            const data = imageData.data;
            const targetColor = parseColor(color);

            for (let i = 0; i < data.length; i += 4) {
              const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
              if (brightness < 128) {
                data[i] = targetColor.r;
                data[i + 1] = targetColor.g;
                data[i + 2] = targetColor.b;
                data[i + 3] = 255;
              } else {
                data[i + 3] = 0;
              }
            }

            tempCtx.putImageData(imageData, 0, 0);
            svgCanvasCache[cacheKey] = coloredCanvas;
          }
        }

        if (coloredCanvas) {
          const svgW = contentWidth * fontScaleX * 0.9;
          const svgH = contentHeight * fontScaleY * 0.9;
          const x = contentLeft + (contentWidth - svgW) / 2;
          const y = contentTop + (contentHeight - svgH) / 2;
          ctx.drawImage(coloredCanvas, x, y, svgW, svgH);
        }
      }
    }
  }

  // 그리드선
  if (gridLineColor !== "rgba(100, 100, 105, 0)") {
    ctx.strokeStyle = gridLineColor;
    ctx.lineWidth = grid.lineWidth;
    ctx.beginPath();
    for (let i = 0; i <= gridCols; i += 1) {
      const x = i * cellWidth;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let i = 0; i <= gridRows; i += 1) {
      const y = i * cellHeight;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return { texture, cells };
}

/**
 * 격자 벽지: 폰트로 텍스트 그리기 (기존 방식, 백업용)
 */
export function createGridWallTexture(
  text: string,
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
  gridLineColor: string = "rgba(100, 100, 105, 0)"
): { texture: THREE.CanvasTexture; cells: CharCell[] } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const cells: CharCell[] = [];

  if (!ctx) {
    return {
      texture: new THREE.CanvasTexture(canvas),
      cells,
    };
  }

  const grid = getGridLayout(width, height, gridRows, gridCols, lineWidth);
  const {
    cellWidth,
    cellHeight,
    contentInset,
    contentWidth,
    contentHeight,
    lineWidth: GRID_LINE_WIDTH,
  } = grid;
  const fontSize = contentHeight * fontScaleY; // 세로 배율

  ctx.textBaseline = "middle"; // middle = em 박스의 수학적 중간. 대문자만 쓰면 보이는 글자는 그 위쪽에 있어서 위로 올라가 보임
  ctx.textAlign = "center";
  ctx.font = `${fontSize}px "LithosRoom", sans-serif`; // fontSize = contentHeight → 그리드(content) 높이에 맞춤

  // LithosRoom 폰트: "middle" 기준이 시각적 중앙보다 위에 있어 글자가 위로 올라가 보임 → 아래로 보정
  const letterOffsetY = contentHeight * 0.089;

  const textLen = text.length;
  let index = 0;

  for (let row = 0; row < gridRows; row += 1) {
    for (let col = 0; col < gridCols; col += 1) {
      const key = cellKey(row, col);
      const boxLeft = col * cellWidth;
      const boxTop = row * cellHeight;
      const centerX = boxLeft + cellWidth / 2;
      const centerY = boxTop + cellHeight / 2;
      const contentLeft = boxLeft + contentInset;
      const contentTop = boxTop + contentInset;

      const ch = text[index % textLen];
      index += 1;

      cells.push({ row, col, char: ch, px: centerX, py: centerY });

      if (removedCells.has(key)) {
        // 빈 칸: 투명하게 (clearRect) - 스티커 떼낸 자리처럼
        ctx.clearRect(boxLeft, boxTop, cellWidth, cellHeight);
      } else {
        ctx.fillStyle = color;
        const advance = ctx.measureText(ch).width;
        // 가로·세로 배율 따로 적용 (fontScaleX = 가로, fontScaleY = fontSize로 세로)
        const scaleX = advance > 0 ? (contentWidth * fontScaleX) / advance : 1;
        const scaleY = 1; // 세로는 fontSize = contentHeight * fontScaleY 로 이미 반영
        ctx.save();
        ctx.translate(contentLeft, contentTop);
        ctx.translate(contentWidth / 2, contentHeight / 2 + letterOffsetY);
        ctx.scale(scaleX, scaleY);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      }
    }
  }

  // 그리드선은 칸 채운 뒤에 그려야 선이 가려지지 않음 (gridLineColor 투명이면 안 그리기)
  if (gridLineColor !== "rgba(100, 100, 105, 0)") {
    ctx.strokeStyle = gridLineColor;
    ctx.lineWidth = GRID_LINE_WIDTH;
    ctx.beginPath();
    for (let i = 0; i <= gridCols; i += 1) {
      const x = i * cellWidth;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let i = 0; i <= gridRows; i += 1) {
      const y = i * cellHeight;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return { texture, cells };
}

/**
 * 벽면 크기(비율)에 맞춘 캔버스로 텍스트 텍스처 생성.
 * textRows = 행 리스트 → (row, col)에 어떤 글자인지 정확히 정해짐.
 */
export function createTiledTextTexture(
  textRows: string[],
  color: string,
  width: number,
  height: number
): { texture: THREE.CanvasTexture; cells: CharCell[] } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const cells: CharCell[] = [];

  if (!ctx) {
    return {
      texture: new THREE.CanvasTexture(canvas),
      cells,
    };
  }

  const baseFontSize = Math.max(32, Math.floor(height / 25));
  const fontSize = baseFontSize;
  const lineGap = 10;
  const lineHeight = fontSize + lineGap;
  const charSpacing = 10;

  ctx.fillStyle = color;
  ctx.textBaseline = "bottom";
  ctx.font = `${fontSize}px "LithosRoom", sans-serif`;

  let y = 0;
  for (let row = 0; row < textRows.length; row += 1) {
    const line = textRows[row];
    let x = 0;
    for (let col = 0; col < line.length; col += 1) {
      const ch = line[col];
      const advance = ctx.measureText(ch).width + charSpacing;

      cells.push({
        row,
        col,
        char: ch,
        px: x + advance / 2,
        py: y + fontSize / 2,
      });
      ctx.fillText(ch, x, y);
      x += advance;
    }
    y += lineHeight;
    if (y >= height + lineHeight) break;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return { texture, cells };
}
