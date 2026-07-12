# Data Architecture & Data Flow Audit Report

## Compass Time-Tracking Application

**Audit Date:** 2026-06-30  
**Scope:** Full codebase data architecture, flow, integrity, and consistency  
**Application Type:** Client-side Next.js SPA (no backend/API/database)

---

## 1. Architecture Overview

### 1.1 Technology Stack
- **Framework:** Next.js (App Router, `"use client"` components)
- **Language:** TypeScript
- **State Management:** React `useState` + manual `localStorage` persistence
- **Persistence:** `localStorage` (10 keys, `compass_`-prefixed)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Backend:** **None** — fully client-side, no API routes, no database

### 1.2 Data Layer Architecture

```
┌─────────────────────────────────────────────────────┐
│                    UI Components                      │
│  TimerCard · DailyPlanning · WeeklyPlan · Goals ·     │
│  SessionHistory · WeeklyReport · MetricsBar ·         │
│  CalendarHeatmap · HabitTracker · FocusMode ·         │
│  RoadmapTreeView · Onboarding · AnalyticsDashboard    │
└───────────┬──────────────────────────────┬────────────┘
            │ Direct calls                 │ window "storage" event
            ▼                              ▼
┌─────────────────────────────────────────────────────┐
│                 lib/storage.ts                        │
│  safeGet / safeSet wrappers around localStorage       │
│  CRUD helpers: add/get/set/update/delete              │
│  dispatchStorageEvent() for cross-component sync      │
└───────────┬──────────────────────────────┬────────────┘
            │                              │
            ▼                              ▼
┌──────────────────┐          ┌──────────────────────┐
│  localStorage     │          │  lib/hooks/           │
│  (compass_* keys) │          │  useTimer.ts          │
│                   │          │  useStorageSync.ts    │
│  10 storage keys  │          │  (UNUSED)             │
└──────────────────┘          └──────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────┐
│              Analytics & Utilities                    │
│  lib/analytics.ts  — pure session analytics           │
│  lib/utils.ts      — ID generation, date helpers      │
│  lib/constants.ts  — presets, color maps               │
│  lib/migration.ts  — data migration logic              │
└─────────────────────────────────────────────────────┘
```

### 1.3 Storage Keys

| Key | Type | Description |
|-----|------|-------------|
| `compass_goals` | `Goal[]` | High-level user goals |
| `compass_sessions` | `Session[]` | Completed focus sessions |
| `compass_interruptions` | `Interruption[]` | Interruption events |
| `compass_reflections` | `Reflection[]` | Daily journal entries |
| `compass_weekly_objectives` | `WeeklyObjective[]` | Week-scoped objectives |
| `compass_daily_tasks` | `Task[]` | Schedulable daily tasks |
| `compass_pending_carryover` | `string[]` | Legacy carryover tasks |
| `compass_onboarding_done` | `string` | Onboarding completion flag |
| `compass_roadmaps` | `RoadmapMap` | Legacy flat roadmap phases |
| `compass_roadmap_trees` | `Record<string, RoadmapTree>` | Hierarchical roadmap trees |

---

## 2. Data Flow Diagrams

### 2.1 Timer Session Flow (Primary Feature)

```
User selects task / enters name
        │
        ▼
useTimer.handleStart() → setInterval → elapsedSeconds state updates
        │
        ▼
User clicks Stop → handleStopRequest() → Rating dialog opens
        │
        ▼
handleRateConfirm()
    ├→ storage.addSession(session)      → localStorage.compass_sessions
    ├→ storage.updateTask(id, {status}) → localStorage.compass_daily_tasks
    ├→ storage.dispatchStorageEvent()   → window "storage" event
    └→ resetAll()                       → clears all timer state
        │
        ▼
"storage" event fires → all listeners re-read:
    ├→ SessionHistory → getSessions() → re-renders
    ├→ WeeklyReport → getSessions() → re-renders
    ├→ MetricsBar → getSessions() + getTasks() → re-renders
    ├→ CalendarHeatmap → getSessions() → re-renders
    ├→ HabitTracker → getSessions() → re-renders
    ├→ GoalsManager → getSessions() → re-renders
    └→ DailyPlanning → getTasks() → re-renders
```

### 2.2 Daily Planning Flow

```
User creates task
    → storage.saveTask(task) → localStorage.compass_daily_tasks
    → dispatchStorageEvent()
    → local state update: setTodayTasks(...)

User toggles task status
    → storage.updateTask(id, {status})
    → local state update: setTodayTasks(...)

User edits task
    → storage.updateTask(id, patch)
    → local state update: setTodayTasks(...)
```

### 2.3 Weekly Plan Flow

```
User creates objective
    → storage.saveWeeklyObjective({...})
    → dispatchStorageEvent()
    → loadData() (re-reads objectives + tasks)

User adds task to objective
    → storage.saveTask({objectiveId, ...})
    → storage.updateWeeklyObjective(id, {dailyTaskIds: [...]})
    → dispatchStorageEvent()
    → loadData()
```

### 2.4 Goals Manager Flow

```
User creates goal
    → storage.addGoal(form) → localStorage.compass_goals
    → loadGoals() (local state update)
    (⚠️ No dispatchStorageEvent() in addGoal helper)

User deletes goal
    → storage.deleteGoal(id) → localStorage.compass_goals + compass_roadmaps
    → dispatchStorageEvent()
    → loadGoals()

User edits goal inline
    → storage.updateGoal(id, patch)
    → loadGoals()
    (⚠️ No dispatchStorageEvent() after updateGoal)
```

### 2.5 FocusMode Flow (Standalone Pomodoro)

```
User starts work phase
    → setInterval → secondsLeft state updates

User records interruption
    → Creates local Interruption {id: Date.now(), timestamp: Date.now()}
    → persistInterruptions(updated as any) → localStorage.compass_interruptions
    ⚠️ INCOMPATIBLE DATA TYPE: numeric id/timestamp vs string id/timestamp

FocusMode DOES NOT create sessions → completed pomodoros are NOT persisted
```

---

## 3. Connection Verification

### 3.1 Working Connections ✅

| Connection | Status | Notes |
|-----------|--------|-------|
| TimerCard → useTimer → storage | ✅ | Session creation works |
| SessionHistory → storage | ✅ | Reads/deletes sessions |
| MetricsBar → storage | ✅ | Reads sessions + tasks |
| DailyPlanning → storage | ✅ | CRUD for tasks |
| WeeklyPlan → storage | ✅ | CRUD for objectives + tasks |
| CalendarHeatmap → storage | ✅ | Reads sessions |
| HabitTracker → storage | ✅ | Reads sessions |
| Onboarding → storage | ✅ | Creates goals + roadmaps |
| RoadmapTreeView → storage | ✅ | CRUD for roadmap nodes |

### 3.2 Broken/Missing Connections ❌

| Issue | Severity | Details |
|-------|----------|---------|
| `useStorageSync` hook is **never used** | **Medium** | Defined in `lib/hooks/useStorageSync.ts` but zero components import it. All components manually wire up `addEventListener("storage", ...)` |
| `notifyStorageChange()` is **never called** | **Medium** | Defined but unused. This means the `"compass-storage-update"` event never fires, making that code path dead |
| FocusMode → Session: **no session creation** | **High** | FocusMode tracks pomodoro completions but never persists a `Session` record. Data is lost when page refreshes |
| FocusMode → Interruptions: **type mismatch** | **Critical** | Saves `{id: number, timestamp: number}` but canonical type expects `{id: string, timestamp: string}`. Uses `as any` to bypass |
| GoalsManager `addGoal` → no event dispatch | **Medium** | After creating a goal via inline form, doesn't call `dispatchStorageEvent()` in all code paths |
| GoalsManager `updateGoal` → no event dispatch | **Medium** | Inline edits call `updateGoal` but don't dispatch event |
| Task `sessionId` → never cleared on session delete | **Low** | `deleteSession` doesn't clean up the linked task's `sessionId` |
| Onboarding bypasses storage API | **Low** | `app/page.tsx` reads/writes `compass_onboarding_done` directly via `localStorage` instead of `isOnboardingDone()`/`setOnboardingDone()` |

---

## 4. Data Dependency Graph

### 4.1 Entity Relationships

```
Goal (1) ──────── (N) WeeklyObjective
  │                      │
  │                      │ (via objectiveId)
  │                      ▼
  │                    Task (N)
  │                      │
  │                      │ (via sessionId)
  │                      ▼
  │                    Session (N)
  │
  ├── RoadmapMap[goalId] → Phase[] (legacy, DEPRECATED)
  └── RoadmapTree[goalId] → Record<ID, RoadmapNode> (new)

Session (1) ──────── (N) Interruption (via sessionId)
Reflection (1 per date)
```

### 4.2 Component → Data Dependencies

| Component | Reads | Writes | Listens to events |
|-----------|-------|--------|-------------------|
| TimerCard | Tasks | Sessions, Tasks, Interruptions | `storage` |
| SessionHistory | Sessions | Sessions | `storage` |
| MetricsBar | Sessions, Tasks | — | `storage` |
| DailyPlanning | Tasks, Reflections, Objectives | Tasks | `storage` |
| WeeklyPlan | Objectives, Tasks, Goals, Sessions | Objectives, Tasks | `storage` |
| WeeklyReport | Sessions, Tasks, Objectives | — | `storage` |
| GoalsManager | Goals, Sessions, Roadmaps | Goals, Roadmaps | `storage` |
| RoadmapTreeView | RoadmapTrees | RoadmapTrees | `storage` |
| CalendarHeatmap | Sessions | — | `storage` |
| HabitTracker | Sessions | — | `storage` |
| FocusMode | Interruptions (local) | Interruptions | **None** ⚠️ |
| AnalyticsDashboard | Sessions | — | `storage` |
| Onboarding | Goals, Roadmaps | Goals, Roadmaps | **None** |

### 4.3 No Circular Dependencies Detected

All components import from `lib/storage`, `lib/utils`, `lib/constants`, and `lib/types` — no circular import chains exist.

### 4.4 Hidden Dependencies

- **GoalsManager** relies on session tags matching goal tag strings for progress calculation (`getLoggedHours`)
- **WeeklyPlan** derives task completion counts from `getTasksForObjective` which reads all daily tasks
- **DailyPlanning** reads weekly objectives to offer task selection from objectives

---

## 5. Source of Truth

### 5.1 Single Source of Truth ✅

| Entity | Source of Truth | Storage |
|--------|----------------|---------|
| Goals | `localStorage.compass_goals` | `storage.ts` CRUD |
| Sessions | `localStorage.compass_sessions` | `storage.ts` CRUD |
| Interruptions | `localStorage.compass_interruptions` | `storage.ts` CRUD |
| Reflections | `localStorage.compass_reflections` | `storage.ts` CRUD |
| Weekly Objectives | `localStorage.compass_weekly_objectives` | `storage.ts` CRUD |
| Daily Tasks | `localStorage.compass_daily_tasks` | `storage.ts` CRUD |
| Roadmap Trees | `localStorage.compass_roadmap_trees` | `storage.ts` CRUD |
| Onboarding | `localStorage.compass_onboarding_done` | `storage.ts` + raw `localStorage` ⚠️ |

### 5.2 Duplicate Sources of Truth ⚠️

| Issue | Details |
|-------|---------|
| **Legacy vs. New Roadmaps** | Both `compass_roadmaps` (flat `Phase[]`) and `compass_roadmap_trees` (hierarchical `RoadmapNode`) exist. GoalsManager uses legacy; RoadmapTreeView uses new. Migration is one-way but not always triggered. |
| **`Goal.roadmap` field** | The `Goal` interface includes `roadmap: RoadmapNode[]` but it is always set to `[]` and never populated. Real roadmap data is in separate storage keys. This is a ghost field. |
| **Onboarding flag** | `app/page.tsx` reads/writes `compass_onboarding_done` directly via `localStorage.getItem/setItem`, while `storage.ts` exports `isOnboardingDone()`/`setOnboardingDone()` — two code paths for the same data. |
| **Interruption types** | FocusMode defines its own `Interruption` interface locally (with `id: number`, `timestamp: number`), separate from the canonical `Interruption` type in `lib/types.ts` (with `id: string`, `timestamp: string`). |

---

## 6. State Synchronization

### 6.1 Synchronization Mechanism

The app uses a custom event bus pattern:
1. After any write to `localStorage`, components call `dispatchStorageEvent()` which fires `window.dispatchEvent(new Event("storage"))`.
2. All other components have `window.addEventListener("storage", callback)` that re-reads from `localStorage`.

### 6.2 Synchronization Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| **Two competing event systems** | **Medium** | `dispatchStorageEvent()` fires `"storage"` event; `notifyStorageChange()` fires `"compass-storage-update"` event. Only the former is used. The `useStorageSync` hook listens for both but is never instantiated. |
| **Event doesn't carry key info** | **Low** | The `"storage"` event has no payload. Every listener re-reads ALL data regardless of what changed, causing unnecessary work. |
| **No optimistic updates** | **Low** | Components re-read from localStorage on event, but some also maintain local state that may diverge if a write fails silently. |
| **FocusMode doesn't listen** | **High** | FocusMode never listens for `"storage"` events. If interruptions are modified elsewhere, FocusMode's local state becomes stale. |
| **Onboarding doesn't listen** | **Low** | Onboarding component doesn't listen for storage events, but this is acceptable since it's a one-time flow. |
| **Timer task list staleness** | **Medium** | `useTimer.loadTasks()` only runs on mount and on `"storage"` events. If a task is created in DailyPlanning but the event is missed (unlikely but possible in rapid operations), the timer's task list won't update until next mount. |

---

## 7. CRUD Validation

### 7.1 Goals

| Operation | Storage | UI Update | Event Dispatch | Issues |
|-----------|---------|-----------|----------------|--------|
| Create (addGoal) | ✅ | ✅ (local) | ⚠️ Missing in some paths | GoalsManager inline create doesn't always dispatch |
| Read (getGoals) | ✅ | ✅ | N/A | — |
| Update (updateGoal) | ✅ | ✅ (local) | ❌ Never dispatched | Other components won't see changes |
| Delete (deleteGoal) | ✅ | ✅ | ✅ | Cleans up roadmaps too |

### 7.2 Sessions

| Operation | Storage | UI Update | Event Dispatch | Issues |
|-----------|---------|-----------|----------------|--------|
| Create (addSession) | ✅ | ✅ | ✅ | — |
| Read (getSessions) | ✅ | ✅ | N/A | — |
| Delete (deleteSession) | ✅ | ✅ | ✅ | ⚠️ Doesn't clean up task.sessionId |
| Clear (clearSessions) | ✅ | ✅ | ✅ | — |

### 7.3 Daily Tasks

| Operation | Storage | UI Update | Event Dispatch | Issues |
|-----------|---------|-----------|----------------|--------|
| Create (saveTask) | ✅ | ✅ | ✅ | — |
| Read (getTasksForDate) | ✅ | ✅ | N/A | — |
| Update (updateTask) | ✅ | ✅ | ✅ | — |
| Delete (deleteTask) | ✅ | ✅ | ✅ | — |

### 7.4 Weekly Objectives

| Operation | Storage | UI Update | Event Dispatch | Issues |
|-----------|---------|-----------|----------------|--------|
| Create | ✅ | ✅ | ✅ | — |
| Read | ✅ | ✅ | N/A | — |
| Update | ✅ | ✅ | ✅ | — |
| Delete | ✅ | ✅ | ✅ | Cascades to linked tasks ✅ |

### 7.5 Interruptions

| Operation | Storage | UI Update | Event Dispatch | Issues |
|-----------|---------|-----------|----------------|--------|
| Create (via useTimer) | ✅ | ✅ | ❌ | Timer doesn't dispatch after interruption |
| Create (via FocusMode) | ⚠️ Type mismatch | ✅ (local) | ❌ | Uses incompatible data shape |
| Read | ✅ | ✅ | N/A | — |
| Delete | ❌ Not implemented | N/A | N/A | No way to delete interruptions |

### 7.6 Roadmaps (Legacy)

| Operation | Storage | UI Update | Event Dispatch | Issues |
|-----------|---------|-----------|----------------|--------|
| Create/Update | ✅ | ✅ | ⚠️ Inconsistent | GoalsManager sometimes dispatches, sometimes not |
| Delete | ✅ | ✅ | ✅ | Only when goal is deleted |

### 7.7 Roadmap Trees (New)

| Operation | Storage | UI Update | Event Dispatch | Issues |
|-----------|---------|-----------|----------------|--------|
| CRUD | ✅ | ✅ | ✅ | — |

---

## 8. Cross-Feature Data Integrity

### 8.1 Missing Update Chains

| When this happens... | ...these features should update but may not |
|----------------------|---------------------------------------------|
| Goal tag edited | GoalsManager logged hours won't recalculate until sessions are re-read. **No cascade** to update sessions that reference the old tag. Sessions store tag strings, not goal IDs. |
| Session deleted | Task's `sessionId` reference becomes dangling. No cleanup. |
| Task completed via timer | DailyPlanning should reflect status change — it does via `"storage"` event ✅ |
| Objective deleted | Linked tasks are cleaned up by `deleteWeeklyObjective` ✅ |
| Goal deleted | Roadmaps are cleaned up ✅. But WeeklyObjectives referencing the deleted goal become orphaned ❌ |
| Session tags changed | No mechanism — sessions are immutable after creation |
| FocusMode interruption saved | TimerCard's `todayInterruptions` won't update (different event path) |

### 8.2 Orphaned Data Scenarios

1. **Orphaned WeeklyObjectives:** Deleting a goal does NOT delete associated `WeeklyObjective` records. Their `goalId` points to a non-existent goal.
2. **Orphaned Tasks:** Deleting a `WeeklyObjective` cleans up linked tasks ✅, but deleting a goal does NOT cascade to objectives → tasks.
3. **Orphaned Interruptions:** Interruptions reference `sessionId: null` in `useTimer` — they are never linked to the session that was just created. The `sessionId` is always `null` at creation time.
4. **Orphaned Legacy Roadmaps:** If a goal is deleted, `deleteGoal` calls `deleteRoadmapForGoal` for legacy roadmaps ✅, but `deleteRoadmapTree` is NOT called for the new hierarchical trees ❌.

---

## 9. API Contract Verification

**Not applicable** — This application has no API layer. All data operations are synchronous localStorage reads/writes.

---

## 10. Database Integrity

**Not applicable** — No database. `localStorage` is the sole persistence layer.

**localStorage integrity issues:**

| Issue | Details |
|-------|---------|
| No data validation on read | `safeGet` returns parsed JSON with `as T` cast — no runtime validation |
| No schema versioning | Migration exists but there's no version field in storage to track schema state |
| Storage limit risk | `localStorage` has ~5MB limit; no warning or fallback if exceeded (only a `console.error` in `safeSet`) |
| No backup/export | No mechanism to export or backup data |

---

## 11. Event Flow Analysis

### 11.1 Complete Event Chain — Session Creation ✅

```
User clicks "Stop" in TimerCard
    → useTimer.handleStopRequest()
    → setRateOpen(true) — rating dialog appears
    → User rates, clicks "Save"
    → useTimer.handleRateConfirm()
        → storage.addSession({...})        → localStorage write
        → storage.updateTask(id, {status}) → localStorage write
        → storage.dispatchStorageEvent()   → window "storage" event fires
        → resetAll()                        → clears timer state
    → Each component's listener fires:
        → SessionHistory: setSessions(getSessions())       → re-render ✅
        → WeeklyReport: loadData() → re-render ✅
        → MetricsBar: setSessions(getSessions()) → re-render ✅
        → CalendarHeatmap: re-render ✅
        → HabitTracker: re-render ✅
        → GoalsManager: loadSessions() → re-render ✅
        → DailyPlanning: re-render ✅
```

### 11.2 Broken Event Chain — FocusMode Interruption ❌

```
User records interruption in FocusMode
    → saveInterruption()
        → Creates Interruption with {id: Date.now(), timestamp: Date.now()}
        → persistInterruptions(updated as any) → localStorage write (WRONG TYPES)
        → ⚠️ No dispatchStorageEvent() called
    → FocusMode local state updates
    → Other components are NOT notified ❌
    → TimerCard's todayInterruptions become stale ❌
    → Interruption data has numeric IDs/timestamps (incompatible with analytics) ❌
```

### 11.3 Broken Event Chain — Goal Update ❌

```
User edits goal inline in GoalsManager
    → storage.updateGoal(id, patch) → localStorage write
    → loadGoals() → local state update
    → ⚠️ No dispatchStorageEvent() called
    → WeeklyPlan won't see updated goal name/color/priority ❌
    → RoadmapTreeView won't see updated goal ❌
```

---

## 12. Dead Data

| Item | Location | Status |
|------|----------|--------|
| `useStorageSync` hook | `lib/hooks/useStorageSync.ts` | **UNUSED** — no component imports it |
| `notifyStorageChange()` | `lib/hooks/useStorageSync.ts` | **UNUSED** — never called anywhere |
| `Goal.roadmap` field | `lib/types.ts` Goal interface | **ALWAYS EMPTY** — set to `[]` on creation, never populated |
| `AnalyticsDashboard` component | `components/AnalyticsDashboard.tsx` | **UNUSED** — not rendered in `app/page.tsx` |
| `Phase` type | `lib/types.ts` | **DEPRECATED** but actively used by GoalsManager's RoadmapStepper |
| `compass_pending_carryover` | `lib/storage.ts` | **LEGACY** — get/set exist but no component reads/writes this key |
| `Task.sessionId` field | `lib/types.ts` | **NEVER READ** — set when session is created but never used for lookups |
| `lib/uuid` directory | Project files | Unknown contents, potentially unused |

---

## 13. Data Consistency

### 13.1 Identifier Consistency

| Issue | Severity | Details |
|-------|----------|---------|
| FocusMode uses `Date.now()` for IDs | **Critical** | Creates numeric IDs instead of UUID strings. Other components expect `string` UUIDs. |
| Interruption IDs in FocusMode | **Critical** | `id: Date.now()` (number) vs canonical `ID` (string UUID) |
| All other entities use `generateId()` | ✅ | Proper UUID generation via `crypto.randomUUID()` |

### 13.2 Naming Consistency

| Issue | Details |
|-------|---------|
| `taskName` vs `title` | `Session.taskName` stores the task name, `Task.title` stores it. Different field names for the same data. |
| `scheduledDate` vs `date` | `Task.scheduledDate` and `Session.date` both store `YYYY-MM-DD` strings. Consistent format. |
| Tag casing inconsistency | `useTimer` lowercases tags with `#` prefix. `GoalsManager.getLoggedHours` compares with `.toLowerCase()`. But existing stored tags may have mixed casing. |

### 13.3 Type Consistency Issues

| Issue | Severity | Details |
|-------|----------|---------|
| FocusMode `Interruption.id: number` | **Critical** | Should be `string` (ID type) |
| FocusMode `Interruption.timestamp: number` | **Critical** | Should be `string` (ISO) |
| `persistInterruptions(updated as any)` | **High** | Type cast bypasses safety — writes wrong shape to storage |
| `WeeklyObjective.priority: number` | **Medium** | Should likely be `GoalPriority` (`"high" | "medium" | "low"`) but is typed as `number` |

---

## 14. Error Propagation

### 14.1 Current Error Handling

| Layer | Error Handling | Issues |
|-------|---------------|--------|
| `safeGet` | Returns fallback on any error | ✅ Silent fallback is appropriate |
| `safeSet` | `console.error` on failure | ⚠️ No user notification; no retry |
| Storage CRUD | No error handling | ⚠️ `addSession`, `updateGoal`, etc. don't handle failures |
| Components | `try/catch` in onboarding only | ⚠️ Most components don't handle storage failures |
| `useTimer` | No error handling for `addSession` | ⚠️ If localStorage write fails, state resets anyway |

### 14.2 Silent Failure Scenarios

1. If `localStorage` is full, `safeSet` logs to console but all CRUD operations silently fail. The UI will show stale data.
2. If `JSON.parse` fails on corrupted data, `safeGet` returns the fallback (empty array). This effectively **wipes user data** without notification.
3. No data validation after reading — corrupted data flows through the app unchecked.

---

## 15. High-Risk Issues Summary

### 🔴 CRITICAL

| # | Issue | Files | Impact |
|---|-------|-------|--------|
| 1 | **FocusMode writes incompatible interruption data** | `components/FocusMode.tsx:105-118` | Corrupts `compass_interruptions` with wrong types. Any code reading interruptions with the canonical type will get runtime errors or wrong data. The `as any` cast hides the problem. |
| 2 | **FocusMode never creates Session records** | `components/FocusMode.tsx` | All pomodoro work done in FocusMode is lost. No sessions are recorded, no time is tracked, no analytics reflect FocusMode usage. |
| 3 | **Goal deletion doesn't clean up hierarchical roadmap trees** | `lib/storage.ts:104-108` (`deleteGoal`) | `deleteGoal` calls `deleteRoadmapForGoal` (legacy) but NOT `deleteRoadmapTree` (new). Orphaned roadmap trees accumulate in storage. |

### 🟠 HIGH

| # | Issue | Files | Impact |
|---|-------|-------|--------|
| 4 | **Goal deletion doesn't cascade to WeeklyObjectives** | `lib/storage.ts:104-108` | Deleting a goal leaves orphaned `WeeklyObjective` records pointing to a non-existent `goalId`. WeeklyPlan will display objectives for deleted goals. |
| 5 | **Goal update doesn't dispatch storage event** | `components/GoalsManager.tsx` (inline edit paths) | Other components (WeeklyPlan, etc.) won't see goal changes until page refresh. |
| 6 | **Session deletion doesn't clean up Task.sessionId** | `lib/storage.ts:131-134` | Dangling reference — task thinks it has a session that no longer exists. |
| 7 | **Duplicate timer systems (TimerCard vs FocusMode)** | `components/TimerCard.tsx`, `components/FocusMode.tsx` | Two independent Pomodoro implementations with divergent behavior. FocusMode doesn't integrate with the task/session system. |

### 🟡 MEDIUM

| # | Issue | Files | Impact |
|---|-------|-------|--------|
| 8 | **`useStorageSync` hook is unused** | `lib/hooks/useStorageSync.ts` | Dead code. All components implement their own sync pattern, leading to inconsistency risk. |
| 9 | **Two competing event systems** | `lib/storage.ts` (dispatchStorageEvent), `lib/hooks/useStorageSync.ts` (notifyStorageChange) | Confusing architecture. If someone uses `notifyStorageChange`, components listening for `"storage"` won't be notified. |
| 10 | **Legacy roadmap system still active** | `components/GoalsManager.tsx` (RoadmapStepper) | Creates legacy `Phase[]` data while the new `RoadmapTree` system exists. Migration is one-way but not always triggered. |
| 11 | **Onboarding bypasses storage API** | `app/page.tsx:36-45` | Direct `localStorage.getItem/setItem` instead of `isOnboardingDone()`/`setOnboardingDone()`. |
| 12 | **Tag-based goal tracking is fragile** | `components/GoalsManager.tsx:22-27` | Goals are tracked via string tag matching (`session.tags.includes(goal.tag)`). If a user changes a goal's tag, all historical progress is lost. No referential integrity. |
| 13 | **Interruption sessionId always null** | `lib/hooks/useTimer.ts:343` | Interruptions recorded during a timer session are never linked to that session (`sessionId: null`). Analytics cannot attribute interruptions to sessions. |

### 🟢 LOW

| # | Issue | Files | Impact |
|---|-------|-------|--------|
| 14 | **`Goal.roadmap` field is never populated** | `lib/types.ts:39`, `lib/storage.ts:86` | Wasted storage space. Confusing for developers. |
| 15 | **No runtime type validation** | `lib/storage.ts:32-41` | Corrupted localStorage data silently returns fallbacks. |
| 16 | **`WeeklyObjective.priority` typed as `number`** | `lib/types.ts:86` | Should likely be `GoalPriority` enum for consistency. |
| 17 | **No data export/import** | Entire app | Users cannot backup or migrate their data. |
| 18 | **No storage quota management** | `lib/storage.ts:44-51` | `localStorage` 5MB limit not monitored. Large session histories could hit the limit. |
| 19 | **`AnalyticsDashboard` is orphaned** | `components/AnalyticsDashboard.tsx` | Component exists but is never rendered. |
| 20 | **`compass_pending_carryover` is dead** | `lib/storage.ts:290-297` | Legacy key with get/set but no consumer. |

---

## 16. Suggested Fixes

### Fix 1: FocusMode Interruption Type Mismatch (CRITICAL)

**Root Cause:** FocusMode defines its own `Interruption` interface with `id: number` and `timestamp: number`, diverging from the canonical `Interruption` type.

**Why it happens:** The component was likely developed independently and its local types were never reconciled with the shared type system.

**Affected files:**
- `components/FocusMode.tsx:24-32`
- `components/FocusMode.tsx:105-118`

**Recommended solution:**
1. Remove the local `Interruption` interface in FocusMode
2. Import `Interruption` and `InterruptionType` from `@/lib/types`
3. Import `addInterruption` from `@/lib/storage` instead of using `persistInterruptions`
4. Use `generateId()` for IDs and `new Date().toISOString()` for timestamps
5. Add missing interruption type `"admin"` to FocusMode's type list
6. Call `dispatchStorageEvent()` after saving

**Priority:** 🔴 Critical

---

### Fix 2: FocusMode Session Creation (CRITICAL)

**Root Cause:** FocusMode tracks pomodoro completions in local state only; no `Session` is ever persisted.

**Why it happens:** FocusMode was built as a standalone timer without integration into the session system.

**Affected files:**
- `components/FocusMode.tsx`

**Recommended solution:**
1. Import `addSession` and `dispatchStorageEvent` from `@/lib/storage`
2. On pomodoro completion (or session stop), call `addSession({...})` with the accumulated work time
3. Add task selection capability to FocusMode (or merge with TimerCard's pomodoro mode)

**Priority:** 🔴 Critical

---

### Fix 3: Goal Deletion Cascade (CRITICAL)

**Root Cause:** `deleteGoal` only cleans up legacy roadmaps, not hierarchical trees or weekly objectives.

**Affected files:**
- `lib/storage.ts:104-108`

**Recommended solution:**
```typescript
export function deleteGoal(id: string): void {
  const all = getGoals()
  setGoals(all.filter((g) => g.id !== id))
  deleteRoadmapForGoal(id)     // legacy
  deleteRoadmapTree(id)        // ← ADD THIS
  // Clean up orphaned objectives
  const objs = getWeeklyObjectives()
  setWeeklyObjectives(objs.filter(o => o.goalId !== id))
}
```

**Priority:** 🔴 Critical

---

### Fix 4: Goal Update Event Dispatch (HIGH)

**Root Cause:** GoalsManager's inline edit calls `updateGoal()` without dispatching a storage event.

**Affected files:**
- `components/GoalsManager.tsx` (inline save handler)

**Recommended solution:** Add `dispatchStorageEvent()` after every `updateGoal()` call.

**Priority:** 🟠 High

---

### Fix 5: Session Deletion Cleanup (HIGH)

**Root Cause:** `deleteSession` doesn't clear the linked task's `sessionId`.

**Affected files:**
- `lib/storage.ts:131-134`

**Recommended solution:**
```typescript
export function deleteSession(id: string): void {
  const all = getSessions()
  const session = all.find(s => s.id === id)
  setSessions(all.filter((s) => s.id !== id))
  // Clean up task reference
  if (session?.taskId) {
    const tasks = getDailyTasks()
    const task = tasks.find(t => t.id === session.taskId)
    if (task?.sessionId === id) {
      updateTask(session.taskId, { sessionId: null })
    }
  }
}
```

**Priority:** 🟠 High

---

### Fix 6: Unify Timer Systems (HIGH)

**Root Cause:** Two independent Pomodoro implementations exist — one in `useTimer` (used by TimerCard) and one in `FocusMode`.

**Affected files:**
- `components/FocusMode.tsx`
- `lib/hooks/useTimer.ts`
- `components/TimerCard.tsx`

**Recommended solution:**
1. Extend `useTimer` to support the FocusMode's circular progress UI
2. Remove FocusMode's independent timer implementation
3. Have FocusMode consume `useTimer` with the pomodoro mode preset

**Priority:** 🟠 High

---

### Fix 7: Remove Dead Code (MEDIUM)

**Root Cause:** `useStorageSync` and `notifyStorageChange` were created but never integrated.

**Affected files:**
- `lib/hooks/useStorageSync.ts`

**Recommended solution:** Either:
- **Option A:** Refactor all components to use `useStorageSync` hook, replacing manual `addEventListener("storage", ...)` patterns
- **Option B:** Delete the unused hook and `notifyStorageChange` to reduce confusion

**Priority:** 🟡 Medium

---

### Fix 8: Unify Event System (MEDIUM)

**Root Cause:** Two event names (`"storage"` and `"compass-storage-update"`) exist for the same purpose.

**Affected files:**
- `lib/storage.ts:54-57`
- `lib/hooks/useStorageSync.ts:51-53`

**Recommended solution:** Standardize on a single custom event (e.g., `"compass-storage-update"`) and update all listeners. The native `"storage"` event only fires cross-tab, not same-tab, which is a subtle bug.

**Priority:** 🟡 Medium

---

### Fix 9: Orphaned Objective Cleanup (MEDIUM)

**Root Cause:** Deleting a goal doesn't cascade to its weekly objectives.

**Affected files:**
- `lib/storage.ts:104-108`

**Recommended solution:** Already addressed in Fix 3.

**Priority:** 🟡 Medium

---

### Fix 10: Tag-Based Goal Tracking Fragility (MEDIUM)

**Root Cause:** Goals are linked to sessions via string tag matching rather than a foreign key.

**Affected files:**
- `components/GoalsManager.tsx:22-27`
- `lib/hooks/useTimer.ts` (session creation)

**Recommended solution:** Add a `goalId` field to `Session` type. When creating a session linked to a task that belongs to a goal's objective chain, store the `goalId` directly. This provides referential integrity.

**Priority:** 🟡 Medium

---

### Fix 11: Interruption-Session Linking (MEDIUM)

**Root Cause:** `handleInterruptConfirm()` in `useTimer` always sets `sessionId: null`.

**Affected files:**
- `lib/hooks/useTimer.ts:342-358`

**Recommended solution:** Track the current session's ID (or a temporary ID) and link interruptions to it.

**Priority:** 🟡 Medium

---

## 17. Summary Statistics

| Category | Count |
|----------|-------|
| Critical Issues | 3 |
| High Issues | 4 |
| Medium Issues | 7 |
| Low Issues | 7 |
| **Total Issues** | **21** |
| Dead code items | 5 |
| Orphaned data scenarios | 4 |
| Broken event chains | 2 |
| Missing cascade operations | 3 |

---

## 18. Architecture Recommendations

1. **Adopt a global state manager** — The current `localStorage` + manual event listener pattern is fragile and error-prone. Consider Zustand with localStorage persistence middleware for automatic sync.

2. **Eliminate duplicate timer systems** — Merge FocusMode and TimerCard into a single timer system with UI variants.

3. **Add referential integrity** — Use `goalId` on Sessions, ensure cascade deletes, validate foreign key references.

4. **Implement the `useStorageSync` hook universally** — Or remove it. The current manual event listener pattern in every component is inconsistent.

5. **Add runtime data validation** — Use Zod or similar to validate localStorage reads, preventing corrupted data from propagating.

6. **Deprecate and remove the legacy roadmap system** — Complete the migration to `RoadmapTree` and remove all `Phase`/`RoadmapMap` code.

7. **Standardize on a single storage event mechanism** — Either native `"storage"` (cross-tab only) or custom `"compass-storage-update"` (same-tab), but not both.