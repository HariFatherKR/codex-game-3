**Feature:** Canvas 2D Infinite Runner
**Goal:** 모바일 터치/스페이스 입력으로 점프하며 장애물을 피하고 코인을 수집하는 인피니트 러너를 제공한다.
**Non-goals:** 서버 저장, 리더보드, 소셜 공유, 멀티플레이.

#### Functional Requirements
- FR1: READY/RUNNING/GAME_OVER 상태를 제공하고 상태별 UI를 표시한다.
- FR2: 점수는 거리 기반으로 증가하며 속도 가속을 반영한다.
- FR3: 코인/장애물 스폰 및 충돌 처리로 점수/게임오버를 갱신한다.
- FR4: 재시작 버튼으로 게임을 초기화할 수 있다.
- FR5: highScore는 localStorage에 저장하고 UI에 표시한다.
- FR6: 모바일 터치와 스페이스 키로 점프 입력을 지원한다.

#### UX Requirements (Mobile-first)
- Target aspect ratio: 9:16 기준 (가로폭에 맞춰 캔버스 자동 스케일)
- Safe area 고려한 상단 HUD 배치
- 터치 타겟 최소 44px
- UI 요소: 현재 점수, highScore, 속도, 상태 메시지, 재시작 버튼

#### Game Loop Requirements
- Input model: tap/click/space로 점프 (연속 점프는 지면 착지 후 가능)
- Core loop: spawn → move → collide → score → gameover → restart
- Difficulty scaling: 시간 경과에 따라 속도 상승 및 스폰 주기 감소
- Background: 앱이 비활성화되면 애니메이션 일시 정지

#### Data Requirements (Supabase)
- 해당 없음 (클라이언트 localStorage만 사용)

#### Routes / APIs (Next.js)
- 단일 페이지 렌더링 (App Router)
- 서버 라우트 없음

#### Performance & Reliability
- FPS 목표: 60 (requestAnimationFrame)
- Canvas 렌더링 중심으로 React 리렌더 최소화
- 빌드 시 외부 네트워크 호출 없음

#### Acceptance Criteria (Definition of Done)
- AC1: READY/RUNNING/GAME_OVER 상태 전환과 UI 표시가 동작한다.
- AC2: 점수/속도/코인/장애물/충돌/재시작이 정상 동작한다.
- AC3: localStorage highScore 저장 및 표시가 동작한다.
- AC4: 모바일 터치 및 스페이스 키 점프가 동작한다.
- AC5: 모바일 뷰포트에서 플레이 가능하고 Vercel 빌드에 통과한다.

---

## Phases
**Phase 0 — Scaffolding & Wiring**
- Next.js App Router + TypeScript 기본 구조 구성
- 문서(테스트/결정) 작성

**Phase 1 — Minimal Vertical Slice**
- 캔버스 렌더링 + 기본 점프/장애물/충돌/게임오버/재시작

**Phase 2 — UX Polish & Edge Cases**
- 모바일 안전 영역, HUD, 상태 메시지 개선
- 점수/속도/코인 표시 및 highScore 저장

**Phase 3 — Hardening**
- 성능 튜닝, 스폰/충돌 로직 안정화
- 문서 업데이트

---

## Tasks
- [ ] T1. 프로젝트 스캐폴딩 및 기본 문서 작성
  - Output: `package.json`, `tsconfig.json`, `next.config.js`, `docs/testing.md`
  - Verify: `npm run dev` 실행 후 기본 페이지 표시
  - Done: Next.js 기본 구조 빌드 가능
- [ ] T2. 캔버스 게임 루프/입력/충돌 구현
  - Output: `app/page.tsx`, `components/GameCanvas.tsx`
  - Verify: 수동 플레이로 점프/충돌/게임오버 확인
  - Done: 최소 플레이 루프 완성
- [ ] T3. HUD 및 highScore 로컬 저장 구현
  - Output: `components/GameCanvas.tsx`
  - Verify: 재시작 후 highScore 유지 확인
  - Done: HUD/상태 표시 및 로컬 저장 동작
