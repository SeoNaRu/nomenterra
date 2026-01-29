# 화면 배치 방법 가이드

Tailwind CSS를 사용한 다양한 레이아웃 방법들입니다.

## 1. Flexbox (가장 많이 사용)

### Row (가로 배치)
```tsx
<div className="flex flex-row gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### Column (세로 배치)
```tsx
<div className="flex flex-col gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### 중앙 정렬
```tsx
<div className="flex items-center justify-center h-screen">
  <div>중앙 정렬</div>
</div>
```

### 공간 분배
```tsx
<div className="flex justify-between">     {/* 양쪽 끝 */}
<div className="flex justify-around">     {/* 균등 간격 */}
<div className="flex justify-evenly">     {/* 완전 균등 */}
<div className="flex justify-start">      {/* 왼쪽 정렬 */}
<div className="flex justify-end">       {/* 오른쪽 정렬 */}
```

### Flex 속성
```tsx
<div className="flex-1">     {/* 남은 공간 차지 */}
<div className="flex-auto">  {/* 자동 크기 */}
<div className="flex-none"> {/* 고정 크기 */}
```

## 2. CSS Grid

### 기본 그리드
```tsx
<div className="grid grid-cols-3 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### 반응형 그리드
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 모바일: 1열, 태블릿: 2열, 데스크톱: 3열 */}
</div>
```

### 그리드 영역 지정
```tsx
<div className="grid grid-cols-4 gap-4">
  <div className="col-span-2">2칸 차지</div>
  <div className="col-span-1">1칸</div>
  <div className="col-span-1">1칸</div>
</div>
```

## 3. Position

### Absolute (절대 위치)
```tsx
<div className="relative">  {/* 부모: 기준점 */}
  <div className="absolute top-4 left-4">절대 위치</div>
  <div className="absolute bottom-0 right-0">우하단</div>
</div>
```

### Fixed (고정 위치)
```tsx
<div className="fixed top-0 left-0 w-full">고정 헤더</div>
<div className="fixed bottom-0 right-0">고정 버튼</div>
```

### Sticky (끈끈이)
```tsx
<div className="sticky top-0">스크롤 시 고정</div>
```

## 4. 비율 기반 레이아웃

### 퍼센트
```tsx
<div className="flex">
  <div className="w-[70%]">70%</div>
  <div className="w-[30%]">30%</div>
</div>
```

### 화면 비율 (vw, vh)
```tsx
<div className="w-screen h-screen">전체 화면</div>
<div className="w-[50vw] h-[50vh]">화면의 50%</div>
```

## 5. Container Queries (Tailwind v4)

```tsx
<div className="@container">
  <div className="@lg:flex @lg:flex-row">
    {/* 컨테이너 크기에 따라 반응 */}
  </div>
</div>
```

## 6. 실전 예시

### 좌우 분할 레이아웃 (현재 프로젝트)
```tsx
<div className="flex h-screen">
  <div className="w-[70%]">왼쪽 70%</div>
  <div className="w-[30%]">오른쪽 30%</div>
</div>
```

### 중앙 정렬 카드
```tsx
<div className="flex items-center justify-center min-h-screen">
  <div className="w-full max-w-md">카드</div>
</div>
```

### 반응형 그리드
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* 반응형 그리드 아이템들 */}
</div>
```

## 언제 무엇을 사용할까?

- **Flexbox**: 1차원 레이아웃 (가로 또는 세로), 정렬, 공간 분배
- **Grid**: 2차원 레이아웃 (가로+세로), 복잡한 그리드 구조
- **Position**: 특정 위치 고정, 오버레이, 플로팅 요소
- **비율 기반**: 화면 크기에 비례하는 레이아웃

## 현재 프로젝트에서 사용 중

```tsx
// SplitLayout.tsx
<div className="flex h-screen">
  <div className="w-[70%]">{left}</div>
  <div className="w-[30%]">{right}</div>
</div>
```

이 방식은 **Flexbox + 비율 기반** 조합입니다.

