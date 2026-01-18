# PRD: Canvas 2D Infinite Runner

## 요약
Next.js App Router + TypeScript 기반의 모바일 우선 Canvas 2D 인피니트 러너를 구현한다. READY/RUNNING/GAME_OVER 상태 관리, 점수/가속, 코인/장애물 스폰, 충돌 처리, Game Over 및 재시작, localStorage 기반 highScore 저장을 포함한다. 모바일 터치와 스페이스 키 점프를 지원한다.

## 목표
- Vercel에서 바로 빌드/배포 가능한 Next.js 프로젝트 제공
- 간단한 조작(터치/스페이스)으로 반복 플레이 가능한 하이퍼 캐주얼 경험 제공

## 범위
- Canvas 기반 2D 러너 게임
- 단일 페이지(App Router)
- 클라이언트에서만 highScore 저장(localStorage)

## 비범위
- 서버/DB 연동
- 로그인/프로필/멀티플레이
- 광고/결제/리더보드
