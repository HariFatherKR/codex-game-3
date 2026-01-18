# Spec: Infinite Runner Canvas Game

**Feature:** Infinite Runner Canvas Game  
**Goal:** 모바일/데스크톱에서 즉시 플레이 가능한 2D 러너 게임을 제공한다.  
**Non-goals:** 온라인 랭킹/서버 저장, 멀티플레이, 복잡한 그래픽 리소스

## Functional Requirements
- FR1: READY/RUNNING/GAME_OVER 상태를 제공한다.
- FR2: 스페이스 키 또는 터치/클릭으로 점프한다.
- FR3: 장애물 충돌 시 GAME_OVER로 전환된다.
- FR4: 코인 수집 시 코인/점수가 증가한다.
- FR5: 재시작 버튼으로 게임을 즉시 재시작한다.
- FR6: highScore는 localStorage에 저장/로드된다.

## UX Requirements (Mobile-first)
- Target aspect ratio: 9:16 기준, 가변 뷰포트 대응
- 최소 44px 터치 영역 유지
- HUD: 점수, 코인, 속도, 최고점수 표시
- 오버레이: READY/게임오버 안내 및 버튼

## Game Loop Requirements
- Input model: tap/click/space
- Core loop: spawn → move → collide → score → gameover → restart
- Difficulty scaling: 시간/점수에 따라 속도 증가
- Pause/background: 탭 비활성 시 애니메이션 프레임 중단

## Data Requirements (Supabase)
- 사용하지 않음 (localStorage만 사용)

## Routes / APIs (Next.js)
- 서버 라우트 없음
- 클라이언트 컴포넌트에서 Canvas 렌더링

## Performance & Reliability
- 목표 FPS: 60
- Canvas 1개 + rAF 루프
- 빌드 타임 네트워크 호출 없음

## Acceptance Criteria
- AC1: 모바일 터치와 스페이스 키 점프가 동작한다.
- AC2: 충돌 시 GAME_OVER와 재시작이 동작한다.
- AC3: highScore가 localStorage에 저장된다.
- AC4: Vercel 빌드가 성공한다.

## Phases
**Phase 0 — Scaffolding & Wiring**
- Next.js App Router + TypeScript 기본 설정
- docs/testing.md 작성

**Phase 1 — Minimal Vertical Slice**
- Canvas 러너 기본 루프
- 점수/장애물/충돌/게임오버/재시작

**Phase 2 — UX Polish & Edge Cases**
- HUD/오버레이 정리
- 모바일 터치 UX 개선

**Phase 3 — Hardening**
- 성능 최적화 및 리팩터 최소화

## Tasks
- [ ] T1. 프로젝트 스캐폴딩 및 기본 문서 작성
  - Output: package.json, tsconfig.json, docs/testing.md
  - Verify: npm run build
  - Done: 빌드 성공 및 문서 존재
- [ ] T2. 캔버스 러너 최소 플레이 루프 구현
  - Output: app/page.tsx, components/RunnerGame.tsx, styles/globals.css
  - Verify: npm run dev로 수동 플레이
  - Done: 점프/충돌/재시작 동작
- [ ] T3. 점수/코인/속도/하이스코어 HUD 연결
  - Output: components/RunnerGame.tsx
  - Verify: 브라우저에서 점수/코인/하이스코어 갱신 확인
  - Done: 게임 오버 후 하이스코어 저장됨
