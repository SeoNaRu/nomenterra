// 손가락 엔티티
// 천장을 누르는 손가락 구조물

import { EntityState } from '../core/types';

export interface FingerConfig {
  position: { x: number; y: number };
  length: number;
  angle: number;
}

export class Finger {
  position: { x: number; y: number };
  length: number;
  angle: number;
  state: EntityState = 'idle';

  constructor(config: FingerConfig) {
    this.position = config.position;
    this.length = config.length;
    this.angle = config.angle;
  }

  setState(state: EntityState): void {
    this.state = state;
  }

  getState(): EntityState {
    return this.state;
  }
}

