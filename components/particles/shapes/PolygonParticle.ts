// 다각형 파티클 (스켈레톤)
// 추후 다각형 파티클 구현 시 사용할 기본 구조

import { IParticle, Position } from '../core/Particle';

export interface PolygonParticleConfig {
  pos: Position;
  size: number;
  sides: number; // 변의 개수
  color: string;
  rotation?: number;
}

export class PolygonParticle implements IParticle {
  pos: Position;
  size: number;
  sides: number;
  color: string;
  rotation: number;
  active: boolean = true;

  constructor(config: PolygonParticleConfig) {
    this.pos = config.pos;
    this.size = config.size;
    this.sides = config.sides;
    this.color = config.color;
    this.rotation = config.rotation || 0;
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    // 추후 구현
  }

  draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    // 추후 구현
    const x = this.pos.x * canvasWidth;
    const y = this.pos.y * canvasHeight;
    const size = Math.min(canvasWidth, canvasHeight) * this.size;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.beginPath();

    for (let i = 0; i < this.sides; i++) {
      const angle = (i * 2 * Math.PI) / this.sides - Math.PI / 2;
      const px = Math.cos(angle) * size;
      const py = Math.sin(angle) * size;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }

    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  isActive(): boolean {
    return this.active;
  }
}

