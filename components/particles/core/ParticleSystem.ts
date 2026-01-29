// 파티클 시스템 관리자
// 여러 파티클을 관리하고 업데이트/렌더링하는 시스템

import { IParticle } from './Particle';

export class ParticleSystem {
  private particles: IParticle[] = [];
  private lastTime: number = 0;
  private animationFrameId: number | null = null;

  // 파티클 추가
  addParticle(particle: IParticle): void {
    this.particles.push(particle);
  }

  // 파티클 제거
  removeParticle(particle: IParticle): void {
    const index = this.particles.indexOf(particle);
    if (index > -1) {
      this.particles.splice(index, 1);
    }
  }

  // 모든 파티클 제거
  clear(): void {
    this.particles = [];
  }

  // 비활성 파티클 제거
  removeInactive(): void {
    this.particles = this.particles.filter((p) => p.isActive());
  }

  // 모든 파티클 업데이트
  update(canvasWidth: number, canvasHeight: number): void {
    const currentTime = performance.now();
    const deltaTime = this.lastTime ? (currentTime - this.lastTime) / 1000 : 0;
    this.lastTime = currentTime;

    this.particles.forEach((particle) => {
      if (particle.isActive()) {
        particle.update(deltaTime, canvasWidth, canvasHeight);
      }
    });

    // 비활성 파티클 제거
    this.removeInactive();
  }

  // 모든 파티클 렌더링
  render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    this.particles.forEach((particle) => {
      if (particle.isActive()) {
        particle.draw(ctx, canvasWidth, canvasHeight);
      }
    });
  }

  // 파티클 개수 반환
  getParticleCount(): number {
    return this.particles.length;
  }

  // 모든 파티클 반환
  getParticles(): IParticle[] {
    return this.particles;
  }
}

