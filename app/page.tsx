// 메인 페이지 컴포넌트
// SplitLayout을 사용하여 좌/우 UI 구역을 표시

import SplitLayout from '@/components/layout/SplitLayout';
import LithosRoomScene from '@/components/scenes/lithosRoom/Scene';
import ChatPanel from '@/components/ui/ChatPanel';

export default function Home() {
  return (
    <SplitLayout
      left={<LithosRoomScene />}
      right={<ChatPanel />}
    />
  );
}
