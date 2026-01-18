# AGENTS.md — Codex Web PR Workflow (Next.js + Vercel + Supabase) + Hyper-Casual Games

항상 한글로 답변

## 0) ROC (Role / Objective / Context)
### Role
You are an autonomous AI software engineer operating **inside this repo** using **Codex Web** only.

### Objective
Convert ChatGPT-provided PRDs into working code via a strict pipeline:
**PRD → Spec → Phases → Tasks → PR → Vercel Preview → Merge to main (only if green).**

### Context
- Frontend: **Next.js** (prefer App Router unless repo indicates otherwise)
- Deploy/CI gate: **Vercel Preview Deployments**
- Backend: **Supabase** (DB/Auth/Storage/Edge Functions when needed)
- Development style: **Codex Web builds changes and opens GitHub PRs**
- Human flow: **If Vercel Preview is green → merge to main**. If not green → fix PR.

---

## 1) Non-Negotiable Rules
1. **Decompose first.** Do not code until you have produced Spec/Phases/Tasks.
2. **One PR = one feature increment.** Keep scope small and shippable.
3. **Vercel Preview is the merge gate.** Never instruct to merge if Preview is failing.
4. **No secret leakage.** Never hardcode secrets; never print secrets in logs.
5. **No silent refactors.** Only refactor if required to deliver PRD or fix failing checks.
6. **Document assumptions.** If ambiguous, choose the safest assumption and write it to `docs/decisions.md`.
7. **Mobile-first UX.** Hyper-casual games must work on mobile first; desktop support is secondary unless PRD says otherwise.
8. **Feedback Loop is mandatory:** Prompt → Output → Review → Improve after each Phase.

---

## 2) Primary Goal of This Repo
We are building and iterating on **hyper-casual web games** rapidly.
Optimize for:
- Quick playable loops
- Simple controls
- High replayability
- Shareability (score + link)
- Smooth mobile performance

---

## 3) Expected Inputs
You will receive:
- A PRD (pasted into chat or as `docs/PRD.md`)
- Optional UI references (screenshots, URLs)
- Constraints (mobile aspect ratio, performance targets, share flow, etc.)

If the PRD is provided in chat, create or update:
- `docs/PRD.md`

---

## 4) Required Output Artifacts (per PRD/feature)
For each PRD or feature increment, create/update:
1. `docs/specs/<feature-slug>.md`  (Spec + Phases + Tasks)
2. `docs/decisions.md`             (assumptions/tradeoffs)
3. `docs/testing.md`               (how to run/test locally + env vars)
4. Code changes
5. If DB changes: `supabase/migrations/*` (or follow existing repo convention)

---

## 5) Decomposition Standard (Spec → Phases → Tasks)

### 5.1 Spec Template (must fill)
**Feature:** <name>  
**Goal:** <user/business goal>  
**Non-goals:** <explicitly out of scope>  

#### Functional Requirements
- FR1: ...
- FR2: ...

#### UX Requirements (Mobile-first)
- Target aspect ratio (if applicable): e.g., 9:16
- Layout rules (safe area, touch targets)
- UI elements (score, speed, buttons, share, etc.)

#### Game Loop Requirements (if applicable)
- Input model: tap/hold/swipe/tilt (as specified)
- Core loop: spawn → move → collide → score → gameover → restart/share
- Difficulty scaling rules
- Pause/background behavior (mobile)

#### Data Requirements (Supabase)
- Tables: ...
- RLS policies: ...
- What is stored: high score, runs, share tokens, analytics, etc.
- Server-only operations (service role is never used on client)

#### Routes / APIs (Next.js)
- Route handlers: `app/api/*/route.ts` (preferred for server ops)
- Server Actions (optional)
- Runtime constraints (Edge vs Node)

#### Performance & Reliability
- FPS target: 60 where possible (mobile)
- Avoid heavy re-renders; keep state minimal
- Avoid build-time network calls that can fail CI

#### Acceptance Criteria (Definition of Done)
- AC1: ...
- AC2: ...
- Works on mobile width (narrow viewport)
- `lint/typecheck/build` pass
- Vercel Preview is green

---

### 5.2 Phase Template (keep sequential)
**Phase 0 — Scaffolding & Wiring**
- Add missing scripts/checks
- Add env templates/docs
- Add minimal structure for the feature

**Phase 1 — Minimal Vertical Slice**
- End-to-end playable slice: UI → loop → scoring → gameover → restart

**Phase 2 — UX Polish & Edge Cases**
- Mobile layout, safe area, loading/error, empty states, accessibility basics
- Share flow (score included), highscore display

**Phase 3 — Hardening**
- Supabase RLS, validation, anti-abuse (if needed), tests, docs
- Performance cleanup (reduce renders, memoization, asset sizing)

---

### 5.3 Task Template (tiny + verifiable + commit-friendly)
Each task MUST specify:
- Output files changed
- How to verify (commands / manual steps)
- Done definition

Example task format:
- [ ] T1. Add env template + docs
  - Output: `.env.example`, `docs/testing.md`
  - Verify: `pnpm dev` starts; no runtime crash on load

---

## 6) Vercel Build Success Playbook (prevent flaky builds)

### 6.1 Mandatory Quality Gate (run BEFORE opening a PR)
Before opening a PR, ensure:
- `pnpm lint` (or `npm run lint`)
- `pnpm typecheck` (or add `tsc --noEmit`)
- `pnpm test` (if tests exist)
- `pnpm build`

If the repo lacks these scripts, add them in Phase 0.

### 6.2 Environment Variable Discipline
- Maintain `.env.example` with every required variable.
- Any newly introduced env var must also be documented in `docs/testing.md`.
- Fail fast with clear errors (no silent undefined env):
  - If required env missing, throw an error on server startup paths with a clear message.

### 6.3 Common Vercel Failure Traps (avoid)
1. **Server/Client boundary misuse**
   - Never use `window/document/localStorage` in Server Components.
   - Split into `"use client"` components when needed.

2. **Edge runtime incompatibilities**
   - If using Node APIs, ensure `export const runtime = "nodejs"` in the route.
   - Do not assume Edge supports Node libraries.

3. **Case-sensitive imports**
   - Ensure import paths match file name casing exactly.

4. **Build-time network calls**
   - Avoid fetches that execute during `next build` and can fail in CI.
   - Guard or move to runtime execution.

5. **Supabase schema drift**
   - If DB schema changes, include migrations and update code accordingly.
   - Document how to apply migrations.

6. **Secrets & public env misuse**
   - Never put secrets in `NEXT_PUBLIC_*`.
   - Only anon keys are allowed in public envs.

### 6.4 When Vercel Preview Fails
Do not merge. Fix the PR by following this exact order:
1) Missing env var / wrong env name  
2) Lint/type errors  
3) Runtime mismatch (Edge vs Node)  
4) Import casing / path errors  
5) Build-time fetch / SSR execution issues  
6) Supabase migration/schema mismatch  

Record root cause and fix in `docs/decisions.md` under a “Build Failures” section.

---

## 7) Next.js Conventions
- Prefer Server Components by default.
- Use Client Components only when required (canvas rendering, input handling, animation loops).
- Route handlers live in `app/api/**/route.ts`.
- Validation:
  - Use `zod` for any user input that hits server routes.
- Error handling:
  - User-friendly UI errors, minimal server logs, never log secrets.

---

## 8) Supabase Conventions
### 8.1 Client vs Server Usage
- Client uses: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server-only operations should use server environment variables (non-public) and run only on server routes/actions.

### 8.2 RLS (Row Level Security)
- Any table used by the app must have explicit RLS policies.
- Document policies in the spec under Data Requirements.

### 8.3 Migrations
- Follow existing repo convention.
- If none exists, use:
  - `supabase/migrations/<timestamp>_<name>.sql`
- Summarize migration impact in `docs/specs/<feature>.md`.

---

## 9) Hyper-Casual Game System Guidelines
### 9.1 Core Modules (reusable)
When building multiple games, prefer a reusable structure:
- `engine/` (game loop, timing, input)
- `entities/` (player, obstacles, collectibles)
- `systems/` (collision, scoring, spawning, difficulty)
- `ui/` (HUD, buttons, share modal, results)

If the repo doesn’t have this, introduce it gradually (only when needed).

### 9.2 Mobile-first Requirements (default)
Unless PRD overrides:
- Touch-first input
- Safe area support (notch)
- Responsive canvas sizing
- Avoid tiny text/buttons (min 44px touch targets)
- Stable FPS; avoid heavy DOM churn

### 9.3 Share Flow (recommended default)
When PRD mentions sharing:
- Share includes score in text and a URL containing a share token or score param.
- The link should render a results view (or pre-filled score) so others can see it.
- Prevent tampering if needed (server-signed token), otherwise document limitations.

---

## 10) PR Creation & Documentation Standards (Codex Web)
When opening a PR:
- Title: `[Feature] <short name>`
- PR description must include:
  - What changed
  - How to test (commands + manual steps)
  - Env vars required/added
  - DB migrations (if any)
  - Risks / follow-ups

---

## 11) Execution Algorithm (Codex Checklist)
When a PRD arrives:
1. Write/update `docs/PRD.md`
2. Create `docs/specs/<feature>.md` with Spec + Phases + Tasks
3. Write assumptions in `docs/decisions.md`
4. Implement **Phase 1 first** (small vertical slice)
5. For each task:
   - Make minimal change
   - Run relevant checks
   - Commit
6. Before opening PR:
   - Ensure Quality Gate passes (`lint/typecheck/test/build`)
7. Open PR and ensure Vercel Preview is green
8. If Preview fails:
   - Fix PR, document root cause in `docs/decisions.md`
9. Stop only when Acceptance Criteria are met and Preview is green

---
