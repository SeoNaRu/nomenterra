// 엔진 공통 타입 정의

export interface Vec2 {
  x: number;
  y: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Bounds {
  min: Vec2;
  max: Vec2;
}

export type EntityState = 'idle' | 'active' | 'destroyed';

