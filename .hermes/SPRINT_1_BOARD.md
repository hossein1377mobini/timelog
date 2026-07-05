# Sprint 1 — Foundation: Get Compass Running on PostgreSQL

**Goal:** App loads, builds without errors, core time-tracking loop works with PostgreSQL

**Timeline:** 2026-07-05 → 2026-07-11 (1 week estimate)
**Total Story Points:** 34

---

## KANBAN BOARD

### 🔵 BACKLOG (Not yet started)

| ID | Title | Pts | Priority | Owner | Dependencies |
|----|-------|:---:|:--------:|:-----:|:------------:|
| EPIC-1 | **Epic: PostgreSQL Infrastructure** | - | Critical | DevOps | None |
| | | | | | |
| T-1.1 | Install PostgreSQL via Chocolatey | 2 | Critical | DevOps | None |
| T-1.2 | Create `compass` database, user, apply schema | 2 | Critical | DevOps | T-1.1 |
| T-1.3 | Create DB init script that runs on `npm run dev` | 2 | High | Backend | T-1.2 |
| T-1.4 | Add .env.example with all required vars | 1 | Medium | DevOps | None |
| | | | | | |
| EPIC-2 | **Epic: Fix Build & Runtime Crashes** | - | Critical | - | - |
| | | | | | |
| T-2.1 | Fix TypeScript error in migration.ts:143 (undefined guard) | 1 | Critical | Backend | None |
| T-2.2 | Fix page.tsx — stop calling throwing `runMigrationsAction()` | 2 | Critical | Frontend | T-2.1 |
| T-2.3 | Fix onboarding — switch from server action to client-side DB check | 2 | Critical | Frontend | T-1.2 |
| T-2.4 | Add error boundaries for DB connection failures (graceful fallback) | 2 | High | Frontend | T-1.3 |
| | | | | | |
| EPIC-3 | **Epic: Data Layer — DB Hooks** | - | High | - | - |
| | | | | | |
| T-3.1 | Create custom hooks: `useSessionsDb`, `useGoalsDb`, `useTasksDb` | 5 | High | Backend | T-1.2 |
| T-3.2 | Create custom hooks: `useInterruptionsDb`, `useReflectionsDb` | 3 | High | Backend | T-1.2 |
| T-3.3 | Create custom hooks: `useWeeklyObjectivesDb`, `useRoadmapsDb` | 3 | High | Backend | T-1.2 |
| T-3.4 | Create unified `StorageContext` provider (event-driven refresh) | 3 | High | Frontend | T-3.1 |
| T-3.5 | Create data-fetching API routes (bridge between client & DB) | 3 | High | Backend | T-1.2 |
| | | | | | |
| EPIC-4 | **Epic: Migrate Timer & Sessions to DB** | - | High | - | - |
| | | | | | |
| T-4.1 | Convert `useTimer` hook to use DB-backed data layer | 3 | High | Frontend | T-3.1 |
| T-4.2 | Convert `TimerCard.tsx` to use DB-backed hooks | 1 | High | Frontend | T-4.1 |
| T-4.3 | Convert `SessionHistory.tsx` to use DB-backed hooks | 1 | Medium | Frontend | T-3.1 |
| T-4.4 | Convert `MetricsBar.tsx` to use DB-backed hooks | 1 | Medium | Frontend | T-3.1 |
| T-4.5 | Convert `CalendarHeatmap.tsx` to use DB-backed hooks | 1 | Medium | Frontend | T-3.1 |
| T-4.6 | Convert `WeeklyReport.tsx` to use DB-backed hooks | 1 | Medium | Frontend | T-3.1 |
| T-4.7 | Convert `FocusMode.tsx` + `useFocusTimer` to use DB | 2 | Medium | Frontend | T-3.2 |
| T-4.8 | Convert `HabitTracker.tsx` to use DB-backed hooks | 1 | Medium | Frontend | T-3.1 |
| | | | | | |
| EPIC-5 | **Epic: QA & Verification** | - | High | - | - |
| | | | | | |
| T-5.1 | Run full build — fix remaining TypeScript errors | 2 | High | Tech Lead | T-4.x |
| T-5.2 | Test timer create/stop/save round-trip to DB | 1 | High | QA | T-4.1 |
| T-5.3 | Test session history (CRUD) | 1 | Medium | QA | T-4.3 |
| T-5.4 | Test focus mode + interruptions | 1 | Medium | QA | T-4.7 |
| T-5.5 | Update README + architecture docs | 1 | Medium | Docs | T-5.1 |

---

### 🟢 READY (Approved, next to pick up)

| ID | Title | Pts | Priority | Owner |
|----|-------|:---:|:--------:|:-----:|
| *(none yet — all tasks in Backlog)* | | | | |

### 🟡 IN PROGRESS

| ID | Title | Pts | Owner | Started |
|----|-------|:---:|:------:|:-------:|
| *(none yet)* | | | | |

### 🔴 BLOCKED

| ID | Title | Blocked By |
|----|-------|:-----------|
| *(none yet)* | | |

### 👁 CODE REVIEW

| ID | Title | Reviewer |
|----|-------|:--------:|
| *(none yet)* | | |

### 🧪 TESTING

| ID | Title | Tester |
|----|-------|:------:|
| *(none yet)* | | |

### 📝 DOCUMENTATION

| ID | Title | Writer |
|----|-------|:------:|
| *(none yet)* | | |

### ✅ DONE

| ID | Title | Completed |
|----|-------|:---------:|
| *(none yet)* | | |

---

## STORY POINT KEY

| Points | Meaning |
|:------:|---------|
| 1 | Quick fix (< 30 min) |
| 2 | Moderate effort (1-2 hours) |
| 3 | Complex (half day) |
| 5 | Significant effort (full day) |

## DEFINITION OF DONE (Sprint 1)

- [ ] Code builds with zero TypeScript errors
- [ ] PostgreSQL running and connected
- [ ] Core timer → save → display round-trip works
- [ ] No localStorage reads (except migration)
- [ ] Server actions use DB, not localStorage
- [ ] App loads on mobile without errors
- [ ] All acceptance criteria for each task met
