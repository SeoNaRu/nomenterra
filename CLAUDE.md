# CURSOR.md

프로젝트의 기술 스택, 코딩 컨벤션, 빌드 명령어 등 잘 변하지 않는 원칙을 담는 설정 문서입니다.
package.json이나 pom.xml과 같은 역할을 하며, 프로젝트의 핵심 원칙을 정의합니다.

## 기술 스택

### 프레임워크 & 언어

- **Next.js 16.1.5** (App Router)
- **TypeScript 5**
- **React 19.2.3**

### 스타일링

- **Tailwind CSS 4**
- **PostCSS**

### 상태 관리

- **Zustand 5.0.10** (전역 상태)

### 애니메이션 & 효과

- **Framer Motion 12.29.2** (UI 모션)
- **GSAP 3.14.2** (씬 타임라인)

### 개발 도구

- **Prettier 3.8.1** (코드 포맷팅)
- **ESLint** (린팅)
- **prettier-plugin-tailwindcss** (Tailwind 클래스 정렬)

## 프로젝트 구조

```
components/
├─ engine/          # 공용 엔진 (render/physics 독립)
│  ├─ core/         # 공통 타입, 수학, RNG
│  ├─ render/       # 렌더러
│  ├─ entities/     # 구조물 (상태 보유)
│  ├─ fracture/     # 분할 로직
│  ├─ physics/      # 물리 시뮬레이션
│  └─ effects/      # 파티클 (수명 기반)
│     └─ particles/
│
├─ scenes/          # 씬 로직
│  └─ lithosRoom/   # Lithos Room 씬
│
├─ layout/          # 레이아웃 컴포넌트
└─ ui/              # UI 컴포넌트

store/              # Zustand 스토어
app/                # Next.js App Router
```

## 코딩 컨벤션

### 컴포넌트

- 함수형 컴포넌트만 사용
- `'use client'` 지시어는 클라이언트 컴포넌트에만 사용
- 컴포넌트는 PascalCase로 명명

### 파일 명명

- 컴포넌트: `PascalCase.tsx`
- 유틸리티/클래스: `PascalCase.ts`
- 상수/설정: `camelCase.ts`

### Import 경로

- 절대 경로 alias 사용: `@/components/...`
- 상대 경로는 최소화

### 타입 정의

- 인터페이스는 `I` 접두사 사용 (예: `IParticle`)
- 타입은 `PascalCase`로 명명

### 엔진 vs 씬 분리

- **Engine**: 공용 로직, render/physics 독립
- **Scenes**: 씬별 로직, 엔진 사용
- **Entities**: 상태 보유 구조물
- **Particles**: 수명 기반 효과

### 좌표 시스템

- 화면 비율 기반 좌표 사용 (0~1 범위)
- 절대 픽셀 좌표는 렌더링 시에만 변환

## 렌더링 패턴 & Voronoi 타일링 (Stone Surface)

### 원칙

- 돌 "무늬"는 재질(Surface)이며, 파쇄(Fracture)와 분리한다.
- Voronoi는 2가지 목적이 있다:
  1. **Surface Voronoi (타일링/패턴용)**: 씬 초기/리사이즈 시 1회 생성하고 캐시한다. (매 프레임 생성 금지)
  2. **Fracture Voronoi (파쇄용)**: 충격(Impact) 시에만 생성하여 조각(StoneShard)을 만든다.

### 성능 규칙

- Voronoi 셀 생성은 `resize` 또는 `config` 변경 시에만 수행한다.
- 프레임 루프(`tick`)에서는 캐시된 셀을 "그리기만" 한다.
- 랜덤은 `rng.ts`의 시드 기반 RNG를 사용해 결과가 재현 가능해야 한다.

### 좌표 규칙

- 엔진 내부 로직은 0~1 정규화 좌표를 기본으로 하고, 캔버스 렌더에서 픽셀로 변환한다.
- 단, MVP 단계에서는 픽셀 좌표 기반 구현을 허용하되 이후 정규화로 이관한다.

## 코드 스타일

### Prettier 설정

- `semi: true` (세미콜론 사용)
- `singleQuote: false` (더블 쿼트 사용)
- `tabWidth: 2` (2칸 들여쓰기)
- `printWidth: 100` (줄 길이 100)
- Tailwind 클래스 자동 정렬

### 포맷팅

- 저장 시 자동 포맷팅 (`Ctrl + S`)
- 수동 포맷팅: `Shift + Alt + F`
- 터미널: `npm run format`

## 빌드 명령어

### 개발

```bash
npm run dev        # 개발 서버 실행 (포트 3000)
```

### 빌드

```bash
npm run build      # 프로덕션 빌드
npm start          # 프로덕션 서버 실행
```

### 코드 품질

```bash
npm run lint       # ESLint 실행
npm run format     # Prettier 포맷팅 (전체)
npm run format:check  # 포맷팅 체크만
```

## 주요 원칙

### 1. 책임 분리

- Engine: 공용 로직, 재사용 가능
- Scenes: 씬별 로직, 엔진 의존
- Entities: 상태 보유 구조물
- Particles: 수명 기반 효과

### 2. 의존성 방향

- Scenes → Engine (씬이 엔진 사용)
- Engine 내부: fracture는 render/physics 독립
- Particles는 effects 전용

### 3. 좌표 시스템

- 모든 좌표는 화면 비율 기반 (0~1)
- 절대 픽셀은 렌더링 시에만 변환
- 반응형 자동 지원

### 4. 상태 관리

- 전역 상태: Zustand 사용
- 로컬 상태: React useState
- 씬 상태: scenes 내부 stateMachine

## 개발 환경

### 필수 확장 프로그램

- Prettier - Code formatter (esbenp.prettier-vscode)
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)

### Node.js 버전

- Node.js 20+

### 패키지 매니저

- npm (기본)

## 참고사항

- Canvas 렌더링은 `components/engine/render/CanvasRenderer` 사용
- 파티클은 `components/engine/effects/particles`에서 관리
- 씬별 설정은 `components/scenes/{sceneName}/config.ts`에 정의
- UI는 `components/ui` 또는 씬별 `ui/` 폴더에 위치
