// Lithos Room 상태 머신
// 씬의 상태 전환 로직

export type SceneState = 'idle' | 'loading' | 'playing' | 'paused';

export class SceneStateMachine {
  private currentState: SceneState = 'idle';

  getState(): SceneState {
    return this.currentState;
  }

  setState(state: SceneState): void {
    this.currentState = state;
  }

  canTransitionTo(state: SceneState): boolean {
    // 상태 전환 규칙 정의
    return true; // 추후 구현
  }
}

