# Spec: Infinite Runner

**Feature:** Canvas 2D Infinite Runner
**Goal:** 모바일/데스크톱에서 간단히 즐길 수 있는 무한 러너를 제공하고 Vercel에 즉시 배포 가능하도록 한다.
**Non-goals:** 서버 저장(랭킹, 공유 링크), 멀티플레이, 리플레이 기능.

## Functional Requirements
- FR1: READY/RUNNING/GAME_OVER 상태를 관리한다.
- FR2: 점수(거리), 코인, 가속(속도 증가)을 반영한다.
- FR3: 장애물/코인 스폰과 충돌 판정을 수행한다.
- FR4: Game Over와 재시작을 제공한다.
- FR5: highScore를 localStorage에 저장하고 로드한다.
- FR6: 모바일 터치와 스페이스 키로 점프 입력을 지원한다.

## UX Requirements (Mobile-first)
- Target aspect ratio: 9:16 기준 캔버스, 가로 화면에도 자동 맞춤.
- Layout rules: 안전 영역 고려한 상/하 패딩, 최소 44px 터치 타겟.
- UI elements: 점수/속도/코인/최고점수 표시, 상태 안내, 재시작 버튼.

## Game Loop Requirements
- Input model: 탭/클릭/스페이스로 점프.
- Core loop: READY → RUNNING → 충돌 → GAME_OVER → 재시작.
- Difficulty scaling: 시간 경과에 따라 속도 증가.
- Pause/background: 탭 전까지 READY 상태 유지.

## Data Requirements (Supabase)
- Tables: 없음.
- RLS policies: 해당 없음.
- What is stored: localStorage에 highScore만 저장.

## Routes / APIs (Next.js)
- Route handlers: 없음.
- Runtime constraints: 기본 Node/Edge 구분 없음(클라이언트 캔버스만 사용).

## Performance & Reliability
- FPS target: 60 가능하도록 requestAnimationFrame 사용.
- Avoid heavy re-renders; 상태는 최소화하고 게임 루프는 ref로 관리.
- Avoid build-time network calls.

## Acceptance Criteria (Definition of Done)
- AC1: 모바일 터치 및 스페이스 점프로 플레이 가능.
- AC2: READY/RUNNING/GAME_OVER 전환과 재시작이 정상 동작.
- AC3: 점수/가속/코인/장애물/충돌/하이스코어 표시.
- AC4: 모바일 화면에서 UI가 깨지지 않음.
- AC5: `typecheck/build` 통과.
- AC6: Vercel Preview가 green.

---

# Phases

## Phase 0 — Scaffolding & Wiring
- Next.js App Router + TypeScript 기본 구조 구성
- 기본 문서/테스트 가이드 추가

## Phase 1 — Minimal Vertical Slice
- 캔버스 렌더링, 점프, 장애물/코인, 점수/게임오버/재시작 구현

## Phase 2 — UX Polish & Edge Cases
- 모바일 안전 영역 대응, HUD 정리, 입력 안정화

## Phase 3 — Hardening
- 성능/리렌더 최적화, 문서 보강

---

# Tasks
- [ ] T1. 기본 프로젝트/문서 구조 생성
  - Output: `package.json`, `tsconfig.json`, `app/*`, `docs/PRD.md`, `docs/specs/infinite-runner.md`, `docs/testing.md`
  - Verify: `npm run dev`로 페이지 로드
  - Done: Next.js 앱이 실행되고 기본 페이지가 렌더됨
- [ ] T2. 캔버스 러너 MVP 구현
  - Output: `app/page.tsx`, `app/components/RunnerGame.tsx`, `app/globals.css`
  - Verify: 브라우저에서 점프/충돌/재시작 동작
  - Done: READY/RUNNING/GAME_OVER와 점수/코인/하이스코어 표시
- [ ] T3. 모바일 UX/입력 개선
  - Output: `app/globals.css`, `app/components/RunnerGame.tsx`
  - Verify: 모바일 뷰포트에서 터치 입력 동작
  - Done: 최소 터치 영역 및 안전 영역 적용
