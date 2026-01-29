# 자동 포맷팅 설정 가이드

## 문제 해결

저장 시 자동 포맷팅이 작동하지 않을 때:

### 1. Prettier 확장 프로그램 확인

1. `Ctrl + Shift + X` (확장 프로그램 열기)
2. "Prettier - Code formatter" 검색
3. 설치되어 있는지 확인
4. 설치되어 있지 않으면 설치

### 2. Cursor 재시작

설정 변경 후 Cursor를 완전히 종료하고 다시 시작

### 3. 수동 포맷팅 테스트

1. 파일 열기
2. `Shift + Alt + F` (또는 `Shift + Option + F` on Mac)
3. 포맷팅이 되면 Prettier는 정상 작동 중

### 4. 터미널에서 포맷팅

```bash
# 단일 파일
npx prettier --write components/scenes/lithosRoom/Scene.tsx

# 전체 프로젝트
npm run format
```

### 5. 설정 확인

`.vscode/settings.json` 파일이 올바른지 확인:
- `editor.formatOnSave`: `true`
- `editor.defaultFormatter`: `"esbenp.prettier-vscode"`

## 현재 설정

- **Prettier 설정 파일**: `.prettierrc.json`
- **자동 포맷팅**: 저장 시 (`Ctrl + S`)
- **Tailwind 클래스 정렬**: 자동

