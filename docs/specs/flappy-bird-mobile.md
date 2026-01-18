**Feature:** Mobile Flappy-Style Canvas Game
**Goal:** 모바일 웹에서 즉시 플레이 가능한 플래피 스타일 게임을 제공하고 점수 공유를 가능하게 한다.
**Non-goals:** 서버 기반 랭킹, 멀티플레이, 사운드/설정 메뉴.

#### Functional Requirements
- FR1: 탭 한 번으로 점프, 중력 적용, 캐릭터 X 고정/Y 이동.
- FR2: 파이프 장애물 랜덤 갭/좌→우 이동, 충돌 시 즉시 게임오버.
- FR3: 장애물 통과 시 점수 +1, 실시간 표시 및 로컬 하이스코어 저장.
- FR4: 결과 화면에 최종 점수/하이스코어/재시작/공유 버튼 제공.
- FR5: 공유 버튼 클릭 시 점수 포함 텍스트와 `?score=` URL 생성, Web Share 또는 클립보드.
- FR6: `?score=XX` 진입 시 친구 점수 표시 및 "Beat this score" CTA 제공.

#### UX Requirements (Mobile-first)
- Target aspect ratio: 9:16 고정(데스크톱에서도 동일 비율 유지).
- Layout rules: 상단 중앙 점수, 하이스코어는 작은 텍스트.
- UI elements: 시작 안내, 점수/하이스코어, 결과 패널(재시작/공유).
- Touch targets: 버튼 최소 44px.

#### Game Loop Requirements
- Input model: tap anywhere to jump.
- Core loop: spawn → move → collide → score → gameover → restart/share.
- Difficulty scaling: 점수 증가에 따라 장애물 이동 속도 점진 증가.
- Pause/background: 탭 입력 외 자동 진행, 백그라운드 전환 시 루프 중지.

#### Data Requirements (Supabase)
- Tables: 없음 (로컬 저장소 사용).
- RLS policies: 해당 없음.
- What is stored: localStorage에 하이스코어 저장.

#### Routes / APIs (Next.js)
- Route handlers: 없음 (클라이언트 단일).
- Runtime constraints: 브라우저 Canvas 기반, 서버 액션 없음.

#### Performance & Reliability
- FPS target: 60 (requestAnimationFrame 단일 루프).
- Avoid heavy re-renders; 상태 최소화.
- Build-time 네트워크 호출 없음.

#### Acceptance Criteria (Definition of Done)
- AC1: 모바일 9:16 비율에서 즉시 플레이 가능.
- AC2: 점수/하이스코어 표시 및 저장 동작.
- AC3: 게임오버/재시작/공유 흐름 정상 동작.
- AC4: `?score=XX` 진입 시 친구 점수 안내 표시.
- AC5: `lint/typecheck/build` 스크립트 제공.
- AC6: Vercel Preview 배포 가능.

---

### Phase 0 — Scaffolding & Wiring
- Next.js 프로젝트 구조/스크립트 구성
- 기본 레이아웃/전역 스타일
- 문서(Testing/Decisions) 초기화

### Phase 1 — Minimal Vertical Slice
- Canvas 게임 루프, 점프/중력/장애물/점수/게임오버
- 시작/게임오버 화면 + 재시작

### Phase 2 — UX Polish & Edge Cases
- 9:16 비율 고정, 모바일 터치 UX, 하이스코어 표시
- 공유 기능 (Web Share/클립보드) + 공유 링크 진입 UI

### Phase 3 — Hardening
- 리사이즈/백그라운드 처리 개선
- 성능 최적화/정리

---

### Tasks
- [ ] T1. Next.js 스캐폴딩 + 기본 문서
  - Output: `package.json`, `tsconfig.json`, `app/layout.tsx`, `app/globals.css`, `docs/testing.md`, `docs/decisions.md`
  - Verify: `npm run dev`로 로컬 서버 기동
  - Done: 기본 페이지 렌더 및 문서 생성 완료
- [ ] T2. 캔버스 게임 루프 구현
  - Output: `app/page.tsx`
  - Verify: 모바일 브라우저에서 점프/중력/장애물/점수 동작
  - Done: 게임오버/재시작 가능
- [ ] T3. 공유/하이스코어/공유 링크 진입 UI
  - Output: `app/page.tsx`, `app/globals.css`
  - Verify: 공유 버튼 클릭 시 URL 생성, `?score=` 진입 메시지 표시
  - Done: 공유 플로우 정상 동작
