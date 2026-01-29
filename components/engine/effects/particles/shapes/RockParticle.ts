// 돌덩이 모양 파티클
// 불규칙한 돌덩이 형태를 그리는 파티클

import { IParticle, Position } from '../core/Particle';

export interface RockParticleConfig {
  pos: Position;
  size: number; // 화면 비율 기반 크기 (0~1)
  color: string;
  seed: number; // 돌덩이 모양을 결정하는 랜덤 시드
}

export class RockParticle implements IParticle {
  pos: Position;
  size: number;
  color: string;
  seed: number;
  active: boolean = true;

  constructor(config: RockParticleConfig) {
    this.pos = config.pos;
    this.size = config.size;
    this.color = config.color;
    this.seed = config.seed;
  }

  // 간단한 랜덤 함수 (시드 기반)
  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // 돌덩이 모양 생성 함수
  private generateRockShape(
    centerX: number,
    centerY: number,
    baseRadius: number
  ): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const numPoints = 12 + Math.floor(this.seededRandom(this.seed * 2) * 8); // 12~20개의 점

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      // 반지름에 랜덤 변동을 주어 불규칙한 형태 생성
      const radiusVariation = 0.6 + this.seededRandom(this.seed + i) * 0.4; // 0.6~1.0
      const radius = baseRadius * radiusVariation;

      // 추가적인 노이즈로 더 자연스러운 돌덩이 느낌
      const noise = (this.seededRandom(this.seed + i * 10) - 0.5) * 0.2;
      const finalRadius = radius * (1 + noise);

      const x = centerX + Math.cos(angle) * finalRadius;
      const y = centerY + Math.sin(angle) * finalRadius;

      points.push({ x, y });
    }

    return points;
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    // 현재는 정적 파티클이므로 업데이트 로직 없음
    // 추후 움직임이 필요하면 여기에 추가
  }

  draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    // 화면 비율을 실제 픽셀 좌표로 변환
    const x = this.pos.x * canvasWidth;
    const y = this.pos.y * canvasHeight;
    const size = Math.min(canvasWidth, canvasHeight) * this.size;
    const baseRadius = size / 2;

    const points = this.generateRockShape(x, y, baseRadius);

    ctx.save();
    ctx.beginPath();

    // 돌덩이 외곽선 그리기
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        // 부드러운 곡선으로 연결
        const prevPoint = points[index - 1];
        const cp1x = prevPoint.x + (point.x - prevPoint.x) * 0.3;
        const cp1y = prevPoint.y + (point.y - prevPoint.y) * 0.3;
        const cp2x = prevPoint.x + (point.x - prevPoint.x) * 0.7;
        const cp2y = prevPoint.y + (point.y - prevPoint.y) * 0.7;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, point.x, point.y);
      }
    });

    // 첫 점과 마지막 점을 부드럽게 연결
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const cp1x = lastPoint.x + (firstPoint.x - lastPoint.x) * 0.3;
    const cp1y = lastPoint.y + (firstPoint.y - lastPoint.y) * 0.3;
    const cp2x = lastPoint.x + (firstPoint.x - lastPoint.x) * 0.7;
    const cp2y = lastPoint.y + (firstPoint.y - lastPoint.y) * 0.7;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, firstPoint.x, firstPoint.y);

    ctx.closePath();

    // 돌덩이 채우기
    ctx.fillStyle = this.color;
    ctx.fill();

    // 돌덩이 외곽선
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 돌덩이 내부 텍스처 (선으로 표현)
    for (let i = 0; i < 3; i++) {
      const angle = this.seededRandom(this.seed + i * 100) * Math.PI * 2;
      const startRadius = baseRadius * 0.3;
      const endRadius = baseRadius * 0.7;
      const startX = x + Math.cos(angle) * startRadius;
      const startY = y + Math.sin(angle) * startRadius;
      const endX = x + Math.cos(angle) * endRadius;
      const endY = y + Math.sin(angle) * endRadius;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = this.color + '66';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  isActive(): boolean {
    return this.active;
  }

  // 파티클 비활성화
  deactivate(): void {
    this.active = false;
  }
}

