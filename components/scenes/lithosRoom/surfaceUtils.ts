// 벽면별 속성 (색상, 회전, 오프셋 등)

import * as THREE from "three";
import type { Surface } from "./coordinates";

/** 벽면별 빈 칸 패치 색(글자 뗀 자리) */
export function getSurfaceColor(surface: Surface): string {
  if (surface === "ceiling") return "#9ca3af";
  if (surface === "floor") return "#4b5563";
  return "#6b7280"; // left, right
}

/** 벽면별 글자 색 (useGridWallTexture와 동일 — 뒷벽에 붙는 글자에 사용) */
export function getSurfaceTextColor(surface: Surface): string {
  if (surface === "ceiling") return "rgb(140, 140, 145)";
  if (surface === "floor") return "#4b5563";
  return "#6b7280"; // left, right
}

/** 벽면별 글자 시작 회전(누워 있음) → 뒷벽에서 (0,0,0) 세워짐 */
export function getStartRotation(surface: Surface): THREE.Euler {
  if (surface === "ceiling") return new THREE.Euler(Math.PI / 2, 0, 0);
  if (surface === "floor") return new THREE.Euler(-Math.PI / 2, 0, 0);
  if (surface === "left") return new THREE.Euler(0, -Math.PI / 2, 0);
  return new THREE.Euler(0, Math.PI / 2, 0); // right
}

/** 벽면 안쪽(글자가 빠져 나오는 시작점) 오프셋 */
export function emergeOffset(surface: Surface): THREE.Vector3 {
  const d = 0.4;
  if (surface === "ceiling") return new THREE.Vector3(0, d, 0); // 위쪽 벽 안쪽
  if (surface === "floor") return new THREE.Vector3(0, -d, 0);
  if (surface === "left") return new THREE.Vector3(d, 0, 0);
  return new THREE.Vector3(-d, 0, 0); // right
}
