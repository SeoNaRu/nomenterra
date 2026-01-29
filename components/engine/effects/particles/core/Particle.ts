// 파티클 기본 인터페이스
// 모든 파티클이 구현해야 하는 공통 인터페이스

export interface Position {
  x: number; // 화면 비율 기반 x 좌표 (0~1)
  y: number; // 화면 비율 기반 y 좌표 (0~1)
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface IParticle {
  // 위치 (화면 비율 기반)
  pos: Position;
  
  // 속도 (선택적)
  vel?: Velocity;
  
  // 업데이트 메서드
  update(deltaTime: number, canvasWidth: number, canvasHeight: number): void;
  
  // 그리기 메서드
  draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void;
  
  // 파티클이 활성 상태인지 확인
  isActive(): boolean;
}

