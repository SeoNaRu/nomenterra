// 돌 조각 엔티티
// 파편으로 사용되는 작은 구조물

import { EntityState } from '../core/types';

export interface StoneShardConfig {
  position: { x: number; y: number };
  vertices: { x: number; y: number }[];
}

export class StoneShard {
  position: { x: number; y: number };
  vertices: { x: number; y: number }[];
  state: EntityState = 'active';

  constructor(config: StoneShardConfig) {
    this.position = config.position;
    this.vertices = config.vertices;
  }

  setState(state: EntityState): void {
    this.state = state;
  }

  getState(): EntityState {
    return this.state;
  }
}

