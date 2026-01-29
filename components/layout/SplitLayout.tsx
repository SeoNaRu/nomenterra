// 좌/우 분할 레이아웃 컴포넌트
// 왼쪽 70%와 오른쪽 30%로 화면을 분할하여 표시

import React from 'react';

interface SplitLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

export default function SplitLayout({ left, right }: SplitLayoutProps) {
  return (
    <div className="flex h-screen w-full">
      {/* 왼쪽 영역 (70%) */}
      <div className="w-[70%]">
        {left}
      </div>
      {/* 오른쪽 영역 (30%) */}
      <div className="w-[30%]">
        {right}
      </div>
    </div>
  );
}

