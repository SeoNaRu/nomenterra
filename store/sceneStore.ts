// 씬 전역 상태 관리 (Zustand)
// 현재는 빈 뼈대만 제공, 추후 씬 단계(phase) 및 애니메이션 상태 관리에 사용 예정

import { create } from 'zustand';

// 씬 단계 타입 정의
type ScenePhase = 'IDLE' | 'LOADING' | 'PLAYING' | 'PAUSED';

interface SceneState {
  phase: ScenePhase;
}

// 씬 스토어 생성 (현재는 기본값만 설정)
export const useSceneStore = create<SceneState>(() => ({
  phase: 'IDLE',
}));

