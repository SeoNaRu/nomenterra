// 채팅/명령 전역 상태 관리 (Zustand)
// 현재는 빈 뼈대만 제공, 추후 메시지 및 명령 상태 관리에 사용 예정

import { create } from 'zustand';

interface Message {
  id: string;
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: Message[];
}

// 채팅 스토어 생성 (현재는 빈 배열만 설정)
export const useChatStore = create<ChatState>(() => ({
  messages: [],
}));

