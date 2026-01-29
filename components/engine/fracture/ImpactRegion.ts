// 충격 영역 정의
// 충격이 가해진 영역을 정의

import { Vec2 } from '../core/types';

export interface ImpactRegion {
  center: Vec2;
  radius: number;
  intensity: number;
}

export class ImpactRegionManager {
  // 추후 구현
  // 충격 영역 관리 로직
  // render/physics를 직접 참조하지 않음
}

