**Feature:** Canvas 2D Infinite Runner
**Goal:** 모바일 터치 및 키보드 입력으로 즉시 플레이 가능한 인피니트 러너를 제공한다.
**Non-goals:** 서버 저장/랭킹/소셜 공유/결제 등 백엔드 기능

#### Functional Requirements
- FR1: READY/RUNNING/GAME_OVER 상태 전환과 재시작을 제공한다.
- FR2: 점수/가속/코인/장애물/충돌을 포함한 게임 루프를 구현한다.
- FR3: highScore를 localStorage에 저장하고 표시한다.
- FR4: 터치와 스페이스 키로 점프 입력을 지원한다.

#### UX Requirements (Mobile-first)
- Target aspect ratio: 9:16 (세로 화면 기준)
- 터치 타겟 최소 44px
- HUD에 현재 점수, 하이스코어, 속도 표시
- Game Over 시 재시작 버튼 제공

#### Game Loop Requirements
- Input model: 터치 탭 및 스페이스 키
- Core loop: spawn → move → collide → score → gameover → restart
- Difficulty scaling: 시간 경과/거리 기반 속도 증가
- Pause/background: 탭 복귀 시 RUNNING 유지 (일시정지 미구현)

#### Data Requirements (Supabase)
- 사용하지 않음 (localStorage만 사용)

#### Routes / APIs (Next.js)
- 없음 (클라이언트 전용 캔버스 렌더링)

#### Performance & Reliability
- FPS 목표: 60
- Canvas 기반 단일 렌더 루프
- build-time 네트워크 호출 없음

#### Acceptance Criteria (Definition of Done)
- AC1: 모바일 터치와 스페이스 입력으로 점프 가능
- AC2: 장애물 충돌 시 GAME_OVER, 재시작 가능
- AC3: 점수/코인/속도/하이스코어 HUD 표시
- AC4: Vercel 빌드 가능 (Next.js App Router)

---

**Phase 0 — Scaffolding & Wiring**
- Next.js App Router + TypeScript 기본 구조
- 기본 스타일/레이아웃

**Phase 1 — Minimal Vertical Slice**
- 캔버스 렌더링 및 게임 루프 구현
- 입력 처리 및 충돌/점수/재시작

**Phase 2 — UX Polish & Edge Cases**
- 모바일 레이아웃 및 터치 타겟 강화
- 하이스코어 표시 및 안내 문구

**Phase 3 — Hardening**
- 성능 최적화(리렌더 최소화)
- 문서 정리

---

### Tasks
- [ ] T1. 프로젝트 스캐폴딩 및 문서 생성
  - Output: `package.json`, `tsconfig.json`, `docs/PRD.md`, `docs/specs/infinite-runner.md`, `docs/decisions.md`, `docs/testing.md`
  - Verify: `npm run dev` 로 로컬 실행 가능
  - Done: Next.js 앱이 실행되고 기본 화면 렌더링
- [ ] T2. 캔버스 게임 루프 및 입력/충돌 구현
  - Output: `app/page.tsx`, `components/RunnerGame.tsx`, `app/globals.css`
  - Verify: 브라우저에서 점프/충돌/점수/재시작 확인
  - Done: READY/RUNNING/GAME_OVER 전환 및 하이스코어 저장
