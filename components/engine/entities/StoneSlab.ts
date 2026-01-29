// 돌판 엔티티
// 상태를 가질 수 있는 구조물

import { EntityState } from '../core/types';

export interface StoneSlabConfig {
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export class StoneSlab {
  position: { x: number; y: number };
  size: { width: number; height: number };
  state: EntityState = 'idle';

  constructor(config: StoneSlabConfig) {
    this.position = config.position;
    this.size = config.size;
  }

  setState(state: EntityState): void {
    this.state = state;
  }

  getState(): EntityState {
    return this.state;
  }
}

