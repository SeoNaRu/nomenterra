// Canvas 렌더러
// 엔진의 렌더링 로직을 담당

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2d context');
    }
    this.ctx = context;
  }

  // Canvas 크기 설정
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  // Canvas 초기화
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Context 반환
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  // Canvas 요소 반환
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}

