// 강체 물리
// 물리 시뮬레이션을 위한 강체

import { Vec2 } from '../core/types';

export interface RigidBodyConfig {
  position: Vec2;
  velocity: Vec2;
  mass: number;
}

export class RigidBody {
  position: Vec2;
  velocity: Vec2;
  mass: number;

  constructor(config: RigidBodyConfig) {
    this.position = config.position;
    this.velocity = config.velocity;
    this.mass = config.mass;
  }

  applyForce(force: Vec2, deltaTime: number): void {
    const acceleration = { x: force.x / this.mass, y: force.y / this.mass };
    this.velocity.x += acceleration.x * deltaTime;
    this.velocity.y += acceleration.y * deltaTime;
  }

  update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
  }
}

