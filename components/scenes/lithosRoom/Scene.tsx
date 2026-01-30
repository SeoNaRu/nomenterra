// Lithos Room 씬 컴포넌트 (R3F 기반)
// 기본적인 방(천장/바닥/벽)만 Three.js로 렌더링하는 기초 버전

"use client";

import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { useSceneStore, type CharCell, type LetterSourceSpot } from "@/store/sceneStore";
import {
  CEILING_FLAT,
  FLOOR_FLAT,
  LEFT_WALL_FLAT,
  RIGHT_WALL_FLAT,
} from "@/components/scenes/lithosRoom/wallTexts";

/** 한 줄당 글자 수로 잘라서 행 리스트로 만듦 — (row, col)에 어떤 글자인지 정확히 알 수 있음 */
function splitIntoRows(flat: string, charsPerRow: number): string[] {
  const rows: string[] = [];
  for (let i = 0; i < flat.length; i += charsPerRow) {
    rows.push(flat.slice(i, i + charsPerRow));
  }
  return rows;
}

const CEILING_TEXT = splitIntoRows(CEILING_FLAT, 25);
const LEFT_WALL_TEXT = splitIntoRows(LEFT_WALL_FLAT, 25);
const RIGHT_WALL_TEXT = splitIntoRows(RIGHT_WALL_FLAT, 25);
const FLOOR_TEXT = splitIntoRows(FLOOR_FLAT, 25);

// 방 크기 (월드 좌표 단위)
const ROOM_WIDTH = 30;
const ROOM_HEIGHT = 10;
const ROOM_DEPTH = 30;

/** 벽면 비율에 맞춘 캔버스 해상도 (짧은 쪽 = BASE) */
const BASE_TEXTURE_SIZE = 1024;

/** 벽면별 캔버스 크기 (월드 비율과 동일: 천장/바닥 30x30, 좌우·뒷벽 30x10) */
const SURFACE_TEXTURE_SIZE = {
  ceiling: { w: BASE_TEXTURE_SIZE, h: BASE_TEXTURE_SIZE }, // 30x30 → 1:1
  floor: { w: BASE_TEXTURE_SIZE, h: BASE_TEXTURE_SIZE },
  left: { w: Math.round(BASE_TEXTURE_SIZE * (ROOM_DEPTH / ROOM_HEIGHT)), h: BASE_TEXTURE_SIZE }, // 30x10 → 3:1
  right: { w: Math.round(BASE_TEXTURE_SIZE * (ROOM_DEPTH / ROOM_HEIGHT)), h: BASE_TEXTURE_SIZE },
  back: { w: Math.round(BASE_TEXTURE_SIZE * (ROOM_WIDTH / ROOM_HEIGHT)), h: BASE_TEXTURE_SIZE }, // 뒷벽 30x10
} as const;

/** 벽면별 격자: 행 × 열 (각 구역에 글자 하나씩) */
const CEILING_GRID_ROWS = 20;
const CEILING_GRID_COLS = 20;
const FLOOR_GRID_ROWS = 20;
const FLOOR_GRID_COLS = 20;
const LEFT_WALL_GRID_ROWS = 10;
const LEFT_WALL_GRID_COLS = 30;
const RIGHT_WALL_GRID_ROWS = 10;
const RIGHT_WALL_GRID_COLS = 30;
/** 뒷벽 그리드 — 잘게 나누면 칸이 작아짐 (행×열 = 최대 글자 수) */
const BACK_WALL_GRID_ROWS = 10;
const BACK_WALL_GRID_COLS = 30;

/** 뒷벽 텍스트 (왼쪽 위부터 쭉 채움, 10×30 = 300자 이상) */

/** 그리드 칸 안 글자 크기 배율 — 가로·세로 따로 미세 조정 (1 = content에 꽉 참) */
const CEILING_FONT_SCALE_X = 1.02;
const CEILING_FONT_SCALE_Y = 1.02;
const FLOOR_FONT_SCALE_X = 1.026;
const FLOOR_FONT_SCALE_Y = 1.02;
const LEFT_WALL_FONT_SCALE_X = 1;
const LEFT_WALL_FONT_SCALE_Y = 1.01;
const RIGHT_WALL_FONT_SCALE_X = 1;
const RIGHT_WALL_FONT_SCALE_Y = 1.01;
/** 뒷벽 격자선 두께 (px). 두꺼워야 노란 선이 잘 보임 */
const BACK_WALL_GRID_LINE_WIDTH = 8;
/** 뒷벽 배경색 — 글자(어두운 회색)와 대비 */
const BACK_WALL_BG_COLOR = "#f1f5f9";
/** 뒷벽 격자 그리드선 색 — 노랑 (선이 안 보이면 BACK_WALL_GRID_LINE_WIDTH 키우기) */
const BACK_WALL_GRID_LINE_COLOR = "#eab308";

/** 뒷벽 스티커 붙는 위치 보정 (월드 단위). 직접 조절해서 밑으로 내리거나 올릴 수 있음 */
const BACK_WALL_TARGET_OFFSET_X = 0;
/** 세로 보정: 음수면 스티커가 밑으로 내려감 (예: -0.05, -0.1), 양수면 위로 */
const BACK_WALL_TARGET_OFFSET_Y = -0.05;
/** z를 벽에서 더 떨어뜨려 깊이 충돌(z-fighting)으로 인한 글자 안의 선 제거 */
const BACK_WALL_TARGET_OFFSET_Z = 0.06;

/** 뒷벽 스티커(날아와서 붙는 글자) 크기 — 가로·세로 따로 키우거나 줄일 수 있음 */
const BACK_WALL_FLYING_FONT_SIZE = 1;
/** 스티커 가로 사이즈: 1 = 칸에 맞춤, 1.1 = 10% 넓게, 1.2 = 20% 넓게 (키우려면 1보다 크게) */
const BACK_WALL_FLYING_FONT_SCALE_X = 1.05;
/** 스티커 세로 사이즈: 1 = 칸에 맞춤, 1.1 = 10% 크게, 1.2 = 20% 크게 (키우려면 1보다 크게) */
const BACK_WALL_FLYING_FONT_SCALE_Y = 1.05;
/** 뒷벽 글자 자간 — 양수=넓힘, 음수=좁힘 */
const BACK_WALL_LETTER_SPACING = 0.12;
/** 뒷벽 스티커 글자 해상도 — sdfGlyphSize. 클수록 선명 (256·512, 너무 크면 비용 증가) */
const BACK_WALL_TEXT_SDF_GLYPH_SIZE = 128;

/** 빈 칸 (row,col) 키 — "row,col" */
function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

/** Canvas용 그리드 레이아웃: 칸 크기·선 제외 content 크기 한 번에 계산 (CSS Grid는 DOM용, 캔버스는 이 함수 사용) */
function getGridLayout(
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

/**
 * SVG 이미지 캐시 (A-Z)
 */
const svgImageCache: Record<string, HTMLImageElement> = {};

/**
 * 색상 변환된 SVG Canvas 캐시 (벽 텍스처용 - char-color 조합)
 */
const svgCanvasCache: Record<string, HTMLCanvasElement> = {};

/**
 * 색상 변환된 SVG Texture 캐시 (날아가는 글자용 - char-color 조합)
 */
const svgTextureCache: Record<string, THREE.CanvasTexture> = {};

/**
 * CSS 색상 문자열을 RGB 객체로 파싱
 */
function parseColor(colorStr: string): { r: number; g: number; b: number } {
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

/**
 * SVG 파일을 Image로 로드 (캐시 사용)
 */
async function loadSVGImage(char: string): Promise<HTMLImageElement> {
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

/**
 * 격자 벽지: SVG 이미지를 Canvas에 그리기.
 * removedCells에 있는 (row,col)은 투명(빈곳).
 */
async function createGridWallTextureSVG(
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
function createGridWallTexture(
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
function createTiledTextTexture(
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

/** 격자 벽지용 훅: removedCells에 있는 (row,col)은 0(빈곳)으로 배경색 처리. gridLineColor 미주입 시 투명 */
function useGridWallTexture(
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
  }, [flatText, color, width, height, gridRows, gridCols, removedCells, emptyColor, fontScaleX, fontScaleY, lineWidth, gridLineColor]);

  return { texture, cells };
}

function useTextTexture(
  textRows: string[],
  color: string,
  width: number,
  height: number
) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const [cells, setCells] = useState<CharCell[]>([]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const loadFontAndTexture = async () => {
      try {
        const font = new FontFace(
          "LithosRoom",
          'url("/fonts/lithos_font.ttf") format("truetype")'
        );
        const loaded = await font.load();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).fonts.add(loaded);
      } catch {
        // 폰트 로드 실패 시에도 기본 폰트로 진행
      }

      const { texture: tex, cells: c } = createTiledTextTexture(
        textRows,
        color,
        width,
        height
      );
      setTexture(tex);
      setCells(c);
    };

    loadFontAndTexture();
  }, [textRows, color, width, height]);

  return { texture, cells };
}

/** 벽면 빈 칸 배경색 (0 처리 시 텍스처에서 이 색으로 칠함) */
const WALL_EMPTY_COLOR = "#e5e7eb";

const BACK_WALL_MAX_CHARS = BACK_WALL_GRID_ROWS * BACK_WALL_GRID_COLS;

function Room() {
  const setLetterCells = useSceneStore((s) => s.setLetterCells);
  const removedSpots = useSceneStore((s) => s.removedSpots);

  /** emerged !== false인 spot만 텍스처에서 빈 칸으로 칠함. false면 아직 3D 글자가 벽면까지 안 나온 상태 */
  const emergedSpots = React.useMemo(
    () => removedSpots.filter((s) => s.emerged !== false),
    [removedSpots]
  );
  const ceilingRemoved = React.useMemo(
    () =>
      new Set(
        emergedSpots
          .filter((s) => s.surface === "ceiling" && s.row != null && s.col != null)
          .map((s) => cellKey(s.row!, s.col!))
      ),
    [emergedSpots]
  );
  const leftRemoved = React.useMemo(
    () =>
      new Set(
        emergedSpots
          .filter((s) => s.surface === "left" && s.row != null && s.col != null)
          .map((s) => cellKey(s.row!, s.col!))
      ),
    [emergedSpots]
  );
  const rightRemoved = React.useMemo(
    () =>
      new Set(
        emergedSpots
          .filter((s) => s.surface === "right" && s.row != null && s.col != null)
          .map((s) => cellKey(s.row!, s.col!))
      ),
    [emergedSpots]
  );
  const floorRemoved = React.useMemo(
    () =>
      new Set(
        emergedSpots
          .filter((s) => s.surface === "floor" && s.row != null && s.col != null)
          .map((s) => cellKey(s.row!, s.col!))
      ),
    [emergedSpots]
  );
  // 뒷벽: 그리드만 표시. 글자는 텍스처에 안 그리고, 날아온 스티커(3D 글자)가 그리드 칸(content) 안에 붙음
  const backWallDisplay = React.useMemo(
    () => " ".repeat(BACK_WALL_MAX_CHARS),
    []
  );
  const backRemoved = React.useMemo(() => {
    const s = new Set<string>();
    for (let i = 0; i < BACK_WALL_MAX_CHARS; i += 1) {
      s.add(cellKey(Math.floor(i / BACK_WALL_GRID_COLS), i % BACK_WALL_GRID_COLS));
    }
    return s;
  }, []);

  const ceiling = useGridWallTexture(
    CEILING_FLAT,
    "rgb(140, 140, 145)",
    SURFACE_TEXTURE_SIZE.ceiling.w,
    SURFACE_TEXTURE_SIZE.ceiling.h,
    CEILING_GRID_ROWS,
    CEILING_GRID_COLS,
    ceilingRemoved,
    WALL_EMPTY_COLOR,
    CEILING_FONT_SCALE_X,
    CEILING_FONT_SCALE_Y
  );
  const leftWall = useGridWallTexture(
    LEFT_WALL_FLAT,
    "#6b7280",
    SURFACE_TEXTURE_SIZE.left.w,
    SURFACE_TEXTURE_SIZE.left.h,
    LEFT_WALL_GRID_ROWS,
    LEFT_WALL_GRID_COLS,
    leftRemoved,
    WALL_EMPTY_COLOR,
    LEFT_WALL_FONT_SCALE_X,
    LEFT_WALL_FONT_SCALE_Y
  );
  const rightWall = useGridWallTexture(
    RIGHT_WALL_FLAT,
    "#6b7280",
    SURFACE_TEXTURE_SIZE.right.w,
    SURFACE_TEXTURE_SIZE.right.h,
    RIGHT_WALL_GRID_ROWS,
    RIGHT_WALL_GRID_COLS,
    rightRemoved,
    WALL_EMPTY_COLOR,
    RIGHT_WALL_FONT_SCALE_X,
    RIGHT_WALL_FONT_SCALE_Y
  );
  const floor = useGridWallTexture(
    FLOOR_FLAT,
    "#4b5563",
    SURFACE_TEXTURE_SIZE.floor.w,
    SURFACE_TEXTURE_SIZE.floor.h,
    FLOOR_GRID_ROWS,
    FLOOR_GRID_COLS,
    floorRemoved,
    WALL_EMPTY_COLOR,
    FLOOR_FONT_SCALE_X,
    FLOOR_FONT_SCALE_Y
  );
  const backWall = useGridWallTexture(
    backWallDisplay,
    "#6b7280",
    SURFACE_TEXTURE_SIZE.back.w,
    SURFACE_TEXTURE_SIZE.back.h,
    BACK_WALL_GRID_ROWS,
    BACK_WALL_GRID_COLS,
    backRemoved,
    WALL_EMPTY_COLOR,
    1,
    1,
    BACK_WALL_GRID_LINE_WIDTH
    // gridLineColor 미전달 → 격자선 투명
  );

  useEffect(() => {
    if (ceiling.cells.length > 0)
      setLetterCells(
        "ceiling",
        ceiling.cells,
        SURFACE_TEXTURE_SIZE.ceiling.w,
        SURFACE_TEXTURE_SIZE.ceiling.h
      );
  }, [ceiling.cells, setLetterCells]);
  useEffect(() => {
    if (leftWall.cells.length > 0)
      setLetterCells("left", leftWall.cells, SURFACE_TEXTURE_SIZE.left.w, SURFACE_TEXTURE_SIZE.left.h);
  }, [leftWall.cells, setLetterCells]);
  useEffect(() => {
    if (rightWall.cells.length > 0)
      setLetterCells(
        "right",
        rightWall.cells,
        SURFACE_TEXTURE_SIZE.right.w,
        SURFACE_TEXTURE_SIZE.right.h
      );
  }, [rightWall.cells, setLetterCells]);
  useEffect(() => {
    if (floor.cells.length > 0)
      setLetterCells("floor", floor.cells, SURFACE_TEXTURE_SIZE.floor.w, SURFACE_TEXTURE_SIZE.floor.h);
  }, [floor.cells, setLetterCells]);

  return (
    <group>
      {/* 바닥 */}
      {floor.texture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -ROOM_HEIGHT / 2, 0]}>
          <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
          <meshBasicMaterial
            map={floor.texture}
            transparent={true}
            opacity={1}
            alphaTest={0.01}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 천장: 투명 배경 + 회색 텍스트 패턴 */}
      {ceiling.texture && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT / 2, 0]}>
          <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
          <meshBasicMaterial
            map={ceiling.texture}
            transparent={true}
            opacity={1}
            alphaTest={0.01}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 뒷벽 — 배경·격자선 투명, 스티커(글자)만 보임 */}
      {backWall.texture && (
        <mesh position={[0, 0, -ROOM_DEPTH / 2]}>
          <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
          <meshBasicMaterial
            map={backWall.texture}
            transparent={true}
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 왼쪽 벽 */}
      {leftWall.texture && (
        <mesh rotation={[0, Math.PI / 2, 0]} position={[-ROOM_WIDTH / 2, 0, 0]}>
          <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
          <meshBasicMaterial
            map={leftWall.texture}
            transparent={true}
            opacity={1}
            alphaTest={0.01}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 오른쪽 벽 */}
      {rightWall.texture && (
        <mesh rotation={[0, -Math.PI / 2, 0]} position={[ROOM_WIDTH / 2, 0, 0]}>
          <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
          <meshBasicMaterial
            map={rightWall.texture}
            transparent={true}
            opacity={1}
            alphaTest={0.01}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

// 해시 기반 간단 랜덤
function hashTo01(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  h ^= h >>> 13;
  h ^= h << 7;
  return (h >>> 0) / 0xffffffff;
}

type Surface = "ceiling" | "floor" | "left" | "right";

/**
 * 텍스처 픽셀(캔버스 좌표, y=0이 위) → 월드 좌표.
 * 캔버스 크기는 벽면별로 다름(letterTextureSize). u=px/w, v=1-py/h.
 */
function pixelToWorld(
  surface: Surface,
  px: number,
  py: number,
  inset = 0.01
): [number, number, number] {
  const size = useSceneStore.getState().letterTextureSize[surface];
  const w = size.w > 0 ? size.w : BASE_TEXTURE_SIZE;
  const h = size.h > 0 ? size.h : BASE_TEXTURE_SIZE;
  const u = px / w;
  const v = 1 - py / h; // 캔버스 위 = v=1

  switch (surface) {
    case "ceiling": {
      // plane [W,D], R_x(90): local(x,y,0)→(x,0,y), pos (0,H/2,0). UV(0,1)=로컬 왼쪽 위 → world (-W/2, H/2, D/2). u→x, v→z. v=0→front(-D/2), v=1→back(D/2)
      return [
        -ROOM_WIDTH / 2 + u * ROOM_WIDTH,
        ROOM_HEIGHT / 2 - inset,
        -ROOM_DEPTH / 2 + v * ROOM_DEPTH,
      ];
    }
    case "floor": {
      // plane [W,D], R_x(-90): UV(0,1)→front(-D/2). v=1→front, v=0→back → z = D/2 - v*D (= -D/2 + (1-v)*D)
      return [
        -ROOM_WIDTH / 2 + u * ROOM_WIDTH,
        -ROOM_HEIGHT / 2 + inset,
        -ROOM_DEPTH / 2 + (1 - v) * ROOM_DEPTH,
      ];
    }
    case "left": {
      // plane [D,H], R_y(90): local(x,y,0)→(0,y,x), pos (-W/2,0,0). UV(0,1)=로컬 왼쪽 위 → world (-W/2, H/2, -D/2). u→z(-D/2~D/2), v→y
      return [
        -ROOM_WIDTH / 2 + inset,
        -ROOM_HEIGHT / 2 + v * ROOM_HEIGHT,
        -ROOM_DEPTH / 2 + u * ROOM_DEPTH,
      ];
    }
    case "right": {
      // plane [D,H], R_y(-90): local(x,y,0)→(0,y,-x), pos (W/2,0,0). UV(0,1)→(W/2,H/2,D/2). u=0→z=D/2, u=1→z=-D/2
      return [
        ROOM_WIDTH / 2 - inset,
        -ROOM_HEIGHT / 2 + v * ROOM_HEIGHT,
        ROOM_DEPTH / 2 - u * ROOM_DEPTH,
      ];
    }
  }
}

/** 벽면 순서대로 쭉 이은 배열에서, 해당 글자의 "몇 번째 인스턴스"인지 좌표로 뽑기 */
function sourcePosition(
  id: string,
  char: string
): { position: [number, number, number]; surface: Surface; row?: number; col?: number } {
  const letterCells = useSceneStore.getState().letterCells;
  const removedSpots = useSceneStore.getState().removedSpots;
  const c = char.toUpperCase();

  const surfaces: Surface[] = ["ceiling", "floor", "left", "right"];
  const allCellsWithSurface: { surface: Surface; cell: CharCell }[] = [];
  for (const s of surfaces) {
    const cells = letterCells[s];
    for (const cell of cells) {
      allCellsWithSurface.push({ surface: s, cell });
    }
  }

  const usedKeys = new Set(
    removedSpots
      .filter((spot) => spot.surface && spot.row != null && spot.col != null)
      .map((spot) => `${spot.surface}:${spot.row},${spot.col}`)
  );

  const sameCharInOrder = allCellsWithSurface.filter(
    ({ surface, cell }) => cell.char === c && !usedKeys.has(`${surface}:${cell.row},${cell.col}`)
  );

  if (sameCharInOrder.length > 0) {
    const { surface: s, cell } = sameCharInOrder[0];
    const world = pixelToWorld(s, cell.px, cell.py);
    return { position: world, surface: s, row: cell.row, col: cell.col };
  }

  // 해당 글자 남은 인스턴스 없음(다 씀) 또는 폰트 로드 전: 해시로 대략 위치만 반환
  const r1 = hashTo01(id + "-x");
  const r2 = hashTo01(id + "-z");
  const flat = (rows: string[]) => rows.join("");
  const options: Surface[] = [];
  if (flat(CEILING_TEXT).includes(c)) options.push("ceiling");
  if (flat(LEFT_WALL_TEXT).includes(c)) options.push("left");
  if (flat(RIGHT_WALL_TEXT).includes(c)) options.push("right");
  if (flat(FLOOR_TEXT).includes(c)) options.push("floor");
  const s: Surface = options.length > 0 ? options[Math.floor(hashTo01(id) * options.length) % options.length] : "ceiling";
  if (s === "ceiling") {
    return {
      position: [
        (r1 - 0.5) * ROOM_WIDTH,
        ROOM_HEIGHT / 2 - 0.01,
        (r2 - 0.5) * ROOM_DEPTH,
      ],
      surface: s,
    };
  }
  if (s === "floor") {
    return {
      position: [
        (r1 - 0.5) * ROOM_WIDTH,
        -ROOM_HEIGHT / 2 + 0.01,
        (r2 - 0.5) * ROOM_DEPTH,
      ],
      surface: s,
    };
  }
  if (s === "left") {
    return {
      position: [
        -ROOM_WIDTH / 2 + 0.01,
        (r1 - 0.5) * ROOM_HEIGHT,
        (r2 - 0.5) * ROOM_DEPTH,
      ],
      surface: s,
    };
  }
  return {
    position: [
      ROOM_WIDTH / 2 - 0.01,
      (r1 - 0.5) * ROOM_HEIGHT,
      (r2 - 0.5) * ROOM_DEPTH,
    ],
    surface: "right",
  };
}

/** 벽면별 빈 칸 패치 색(글자 뗀 자리) */
function getSurfaceColor(surface: Surface): string {
  if (surface === "ceiling") return "#9ca3af";
  if (surface === "floor") return "#4b5563";
  return "#6b7280"; // left, right
}

/** 벽면별 글자 색 (useGridWallTexture와 동일 — 뒷벽에 붙는 글자에 사용) */
function getSurfaceTextColor(surface: Surface): string {
  if (surface === "ceiling") return "rgb(140, 140, 145)";
  if (surface === "floor") return "#4b5563";
  return "#6b7280"; // left, right
}

/** 벽면별 글자 시작 회전(누워 있음) → 뒷벽에서 (0,0,0) 세워짐 */
function getStartRotation(surface: Surface): THREE.Euler {
  if (surface === "ceiling") return new THREE.Euler(Math.PI / 2, 0, 0);
  if (surface === "floor") return new THREE.Euler(-Math.PI / 2, 0, 0);
  if (surface === "left") return new THREE.Euler(0, -Math.PI / 2, 0);
  return new THREE.Euler(0, Math.PI / 2, 0); // right
}

/** 벽면 안쪽(글자가 빠져 나오는 시작점) 오프셋 */
function emergeOffset(surface: Surface): THREE.Vector3 {
  const d = 0.4;
  if (surface === "ceiling") return new THREE.Vector3(0, d, 0); // 위쪽 벽 안쪽
  if (surface === "floor") return new THREE.Vector3(0, -d, 0);
  if (surface === "left") return new THREE.Vector3(d, 0, 0);
  return new THREE.Vector3(-d, 0, 0); // right
}

interface LetterProps {
  index: number;
  total: number;
  id: string;
  char: string;
  createdAt: number;
  /** addLetters로 배치 추가 시 이미 배정된 출발 위치 */
  sourceSpot?: LetterSourceSpot;
}

function FlyingLetter({ index, total, id, char, createdAt, sourceSpot }: LetterProps) {
  const ref = useRef<THREE.Group>(null);
  const addedSpotRef = useRef(false);
  const addRemovedSpot = useSceneStore((s) => s.addRemovedSpot);
  const setSpotEmerged = useSceneStore((s) => s.setSpotEmerged);

  const { start, emergeStart, surface, row, col } = React.useMemo(() => {
    if (sourceSpot) {
      const startVec = new THREE.Vector3(...sourceSpot.position);
      const emergeVec = startVec.clone().sub(emergeOffset(sourceSpot.surface));
      return {
        start: startVec,
        emergeStart: emergeVec,
        surface: sourceSpot.surface,
        row: sourceSpot.row,
        col: sourceSpot.col,
      };
    }
    const out = sourcePosition(id, char);
    const startVec = new THREE.Vector3(...out.position);
    const emergeVec = startVec.clone().sub(emergeOffset(out.surface));
    return {
      start: startVec,
      emergeStart: emergeVec,
      surface: out.surface,
      row: out.row,
      col: out.col,
    };
  }, [id, char, sourceSpot]);

  const readyRef = useRef(false); // 떨어질 준비 완료 플래그

  useEffect(() => {
    if (sourceSpot) return; // sourceSpot이 있으면 나중에 처리
    if (addedSpotRef.current) return;
    addedSpotRef.current = true;
    addRemovedSpot({
      id,
      position: [start.x, start.y, start.z],
      surface,
      row,
      col,
    });
  }, [sourceSpot, id, addRemovedSpot, start.x, start.y, start.z, surface, row, col]);

  // 스티커가 붙는 위치: 뒷벽 그리드의 해당 칸 중심 (그리드 안, 격자선 제외한 content 영역에 맞춤)
  const target = React.useMemo(() => {
    const backCol = index % BACK_WALL_GRID_COLS;
    const backRow = Math.floor(index / BACK_WALL_GRID_COLS);
    const cellW = ROOM_WIDTH / BACK_WALL_GRID_COLS;
    const cellH = ROOM_HEIGHT / BACK_WALL_GRID_ROWS;
    const x = -ROOM_WIDTH / 2 + (backCol + 0.5) * cellW + BACK_WALL_TARGET_OFFSET_X;
    const y = ROOM_HEIGHT / 2 - (backRow + 0.5) * cellH + BACK_WALL_TARGET_OFFSET_Y;
    const z = -ROOM_DEPTH / 2 + 0.02 + BACK_WALL_TARGET_OFFSET_Z;
    return new THREE.Vector3(x, y, z);
  }, [index]);

  const startRot = React.useMemo(() => getStartRotation(surface), [surface]);
  const endQuat = React.useMemo(
    () => new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
    []
  );
  const startQuat = React.useMemo(
    () => new THREE.Quaternion().setFromEuler(startRot),
    [startRot]
  );

  // 화면 중앙을 지나는 랜덤 중간점 (각 글자마다 고유)
  const midPoint = React.useMemo(() => {
    const randomOffsetX = (Math.random() - 0.5) * 1.5; // 중앙 ±0.75 범위
    const randomOffsetY = (Math.random() - 0.5) * 1.0; // 중앙 ±0.5 범위
    const randomOffsetZ = (Math.random() - 0.5) * 1.0; // 중앙 ±0.5 범위
    return new THREE.Vector3(
      randomOffsetX,
      randomOffsetY,
      randomOffsetZ
    );
  }, []);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;

    // ——— 날아오는 속도/시간 관리 (여기서 조절) ———
    const PREPARE_DURATION = 1; // 떨어질 준비 시간(초) - 벽 글자가 서서히 투명해짐
    const FLY_DURATION = 3; // 날아가는 시간(초)
    const PARABOLA_HEIGHT = 0.6; // 뒷벽으로 날아갈 때 포물선 높이
    // 스티커 크기: 그리드 칸 안쪽(content, 격자선 제외)과 동일하게 getGridLayout 기준으로 계산
    const backTexW = SURFACE_TEXTURE_SIZE.back.w;
    const backTexH = SURFACE_TEXTURE_SIZE.back.h;
    const backGrid = getGridLayout(
      backTexW,
      backTexH,
      BACK_WALL_GRID_ROWS,
      BACK_WALL_GRID_COLS,
      BACK_WALL_GRID_LINE_WIDTH
    );
    const contentCellW = backGrid.contentWidth * (ROOM_WIDTH / backTexW);
    const contentCellH = backGrid.contentHeight * (ROOM_HEIGHT / backTexH);
    const scaleXAtBackWall =
      (contentCellW / BACK_WALL_FLYING_FONT_SIZE) * BACK_WALL_FLYING_FONT_SCALE_X;
    const scaleYAtBackWall =
      (contentCellH / BACK_WALL_FLYING_FONT_SIZE) * BACK_WALL_FLYING_FONT_SCALE_Y;
    // —————————————————————————————————————————————

    const age = (performance.now() - createdAt) / 1000;

    if (age < PREPARE_DURATION) {
      // 준비 단계: 벽 위치에서 대기, 투명 상태 (벽 글자가 서서히 투명해지는 시간)
      g.position.copy(start);
      g.quaternion.copy(startQuat);
      g.scale.set(1, 1, 1);
      g.visible = false; // 날아가는 객체는 아직 보이지 않음
      return;
    }

    // 준비 완료: 벽 글자를 완전히 투명 처리
    if (!readyRef.current && sourceSpot) {
      readyRef.current = true;
      setSpotEmerged(id);
    }

    // 날아가는 단계
    g.visible = true;
    const flyAge = age - PREPARE_DURATION;
    const t = Math.min(flyAge / FLY_DURATION, 1);

    // 부드러운 easing
    const ease = 1 - Math.pow(1 - t, 3);

    // Quadratic Bezier Curve (벽 위치 → 화면 중앙 → 뒷벽)
    // P(t) = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2
    const oneMinusT = 1 - ease;
    const pos = new THREE.Vector3(
      oneMinusT * oneMinusT * start.x + 2 * oneMinusT * ease * midPoint.x + ease * ease * target.x,
      oneMinusT * oneMinusT * start.y + 2 * oneMinusT * ease * midPoint.y + ease * ease * target.y,
      oneMinusT * oneMinusT * start.z + 2 * oneMinusT * ease * midPoint.z + ease * ease * target.z
    );

    // 크기 변화 (벽 크기 → 뒷벽 칸 크기)
    const scaleX = THREE.MathUtils.lerp(1, scaleXAtBackWall, ease);
    const scaleY = THREE.MathUtils.lerp(1, scaleYAtBackWall, ease);

    // 벽 방향 → 정면으로 부드럽게 회전
    g.quaternion.slerpQuaternions(startQuat, endQuat, ease);

    g.position.copy(pos);
    g.scale.set(scaleX, scaleY, 1);
  });

  const textColor = React.useMemo(() => getSurfaceTextColor(surface), [surface]);

  const svgTexture = React.useMemo(() => {
    const cacheKey = `${char}-${textColor}`;

    // 캐시된 텍스처가 있으면 바로 반환
    if (svgTextureCache[cacheKey]) {
      return svgTextureCache[cacheKey];
    }

    // 캐시된 이미지 사용
    const img = svgImageCache[char];
    if (!img) {
      // 이미지가 아직 로드 안 됨
      loadSVGImage(char).then(() => {
        // 로드 완료 후 재렌더링 유도는 letters 배열 변경으로 자동 발생
      });
      return null;
    }

    // 색상 변환된 텍스처 생성 (크기 축소로 성능 개선)
    const canvas = document.createElement("canvas");
    const size = 128; // 512 → 256 → 128 (16배 빠름)
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    // SVG 그리기
    ctx.drawImage(img, 0, 0, size, size);

    // 색상 변환: 검은색 → textColor, 흰색 → 투명
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    const targetColor = parseColor(textColor);

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;

      if (brightness < 128) {
        // 어두운 부분(검은 글자) → 벽 색상
        data[i] = targetColor.r;
        data[i + 1] = targetColor.g;
        data[i + 2] = targetColor.b;
        data[i + 3] = 255;
      } else {
        // 밝은 부분(흰 배경) → 투명
        data[i + 3] = 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    // 캐시에 저장
    svgTextureCache[cacheKey] = texture;

    return texture;
  }, [char, textColor]);

  if (!svgTexture) return null;

  return (
    <group ref={ref}>
      {svgTexture && (
        <mesh>
          <planeGeometry args={[BACK_WALL_FLYING_FONT_SIZE, BACK_WALL_FLYING_FONT_SIZE]} />
          <meshBasicMaterial map={svgTexture} transparent />
        </mesh>
      )}
    </group>
  );
}

function FlyingLettersField() {
  const letters = useSceneStore((s) => s.letters);

  if (letters.length === 0) return null;

  return (
    <group>
      {letters.map((l, idx) => (
        <FlyingLetter
          key={l.id}
          id={l.id}
          char={l.char}
          createdAt={l.createdAt}
          index={idx}
          total={letters.length}
          sourceSpot={l.sourceSpot}
        />
      ))}
    </group>
  );
}

/** 개별 SVG 글자 컴포넌트 (날아가는 글자용) */
function LetterSVG({
  char,
  position,
  rotation,
  size,
  color = "#6b7280",
}: {
  char: string;
  position: [number, number, number];
  rotation: [number, number, number];
  size: number;
  color?: string;
}) {
  const texture = React.useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(`/letters/${char}.svg`);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [char]);

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={texture} transparent color={color} />
    </mesh>
  );
}

// 키보드(WASD, Space, Shift) + 마우스로 카메라 이동/회전
function CameraController() {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const setCameraPosition = useSceneStore((s) => s.setCameraPosition);

  useFrame((_, delta) => {
    const direction = new THREE.Vector3();
    const speed = 4;

    if (keys.current["KeyW"]) direction.z -= 1;
    if (keys.current["KeyS"]) direction.z += 1;
    if (keys.current["KeyA"]) direction.x -= 1;
    if (keys.current["KeyD"]) direction.x += 1;
    if (keys.current["Space"]) direction.y += 1;
    if (keys.current["ShiftLeft"] || keys.current["ShiftRight"]) direction.y -= 1;

    if (direction.lengthSq() > 0) {
      direction.normalize().multiplyScalar(speed * delta);
      // 카메라가 바라보는 방향 기준으로 이동
      const move = direction.applyQuaternion(camera.quaternion);
      camera.position.add(move);
    }

    setCameraPosition(camera.position.x, camera.position.y, camera.position.z);
  });

  // PointerLockControls: 캔버스를 클릭하면 마우스가 카메라 회전에 잠김
  return <PointerLockControls />;
}

export default function LithosRoomScene() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-900">
      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }} camera={{ position: [0, 0, 25], fov: 50 }}>
        {/* 배경색 */}
        <color attach="background" args={["#020617"]} />

        {/* 기본 조명 */}
        <ambientLight intensity={0.16} />
        <directionalLight position={[5, 9, 4]} intensity={1.2} castShadow />
        <directionalLight position={[-6, 2, 2]} intensity={0.35} />

        {/* 방 메쉬 */}
        <Room />

        {/* 벽면에서 글자 뗀 자리(빈 칸) */}
        {/* 날아오는 글자들 */}
        <FlyingLettersField />

        {/* 카메라 컨트롤 (키보드 + 마우스) */}
        {/* <CameraController /> */}
      </Canvas>
      <CameraCoordOverlay />
    </div>
  );
}

function CameraCoordOverlay() {
  const pos = useSceneStore((s) => s.cameraPosition);
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 font-mono text-xs text-green-400">
      <div>cam x: {pos.x.toFixed(2)}</div>
      <div>cam y: {pos.y.toFixed(2)}</div>
      <div>cam z: {pos.z.toFixed(2)}</div>
    </div>
  );
}
