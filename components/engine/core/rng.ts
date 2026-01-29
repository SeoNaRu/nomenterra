// 엔진 랜덤 숫자 생성기 (시드 기반)

export class RNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // 0~1 사이의 랜덤 값 생성
  random(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  // min~max 사이의 랜덤 값 생성
  range(min: number, max: number): number {
    return min + this.random() * (max - min);
  }

  // 정수 랜덤 값 생성
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  // 시드 설정
  setSeed(seed: number): void {
    this.seed = seed;
  }

  // 현재 시드 반환
  getSeed(): number {
    return this.seed;
  }
}

