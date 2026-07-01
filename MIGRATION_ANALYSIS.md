# localStorage to Database Migration Analysis

## Executive Summary

This document provides a comprehensive analysis of all localStorage usage in the Compass time-tracking application and outlines a phased migration plan to replace localStorage with PostgreSQL database storage.

---

## 1. Current localStorage Architecture

### Storage Keys (from `lib/storage.ts`)
```typescript
const KEYS = {
  GOALS: "compass_goals",
  SESSIONS: "compass_sessions",
  INTERRUPTIONS: "compass_interruptions",
  REFLECTIONS: "compass_reflections",
  WEEKLY_OBJECTIVES: "compass_weekly_objectives",
  DAILY_TASKS: "compass_daily_tasks",
  PENDING_CARRYOVER: "compass_pending_carryover",
  ONBOARDING_DONE: "compass_onboarding_done",
  ROADMAPS: "compass_roadmaps",               // Legacy flat roadmaps
  ROADMAP_TREES: "compass_roadmap_trees",     // Hierarchical roadmap trees
}
```

### Database Schema Status
✅ **Already created** - PostgreSQL schema exists in `lib/schema.sql` with:
- `goals` table
- `sessions` table
- `interruptions` table
- `reflections` table
- `weekly_objectives` table
- `tasks` table (daily tasks)
- `checklist_items` table
- `roadmap_nodes` table (hierarchical)
- `roadmap_phases` table (legacy)
- `settings` table (for onboarding, etc.)

---

## 2. Complete localStorage Usage Inventory

### A. Core Storage Module (`lib/storage.ts`)
**Purpose**: Central localStorage abstraction layer  
**Lines**: 490 total  
**Functions**: 60+ storage operations

**Data Models**:
1. **Goals** (CRUD complete)
   - `getGoals()`, `setGoals()`, `addGoal()`, `updateGoal()`, `deleteGoal()`
   - Cascade deletes: roadmaps, trees, objectives, tasks

2. **Sessions** (CRUD complete)
   - `getSessions()`, `setSessions()`, `addSession()`, `deleteSession()`, `clearSessions()`

3. **Interruptions** (CRUD complete)
   - `getInterruptions()`, `setInterruptions()`, `addInterruption()`

4. **Reflections** (CRUD complete)
   - `getReflections()`, `setReflections()`, `getReflectionByDate()`, `saveReflection()`
   - Upsert logic by date

5. **Weekly Objectives** (CRUD complete)
   - `getWeeklyObjectives()`, `setWeeklyObjectives()`, `saveWeeklyObjective()`, `updateWeeklyObjective()`, `deleteWeeklyObjective()`
   - Filtering by week and goal

6. **Daily Tasks** (CRUD complete)
   - `getDailyTasks()`, `setDailyTasks()`, `saveTask()`, `updateTask()`, `deleteTask()`
   - Filtering by date, objective, and week

7. **Carryover Tasks** (Legacy)
   - `getCarryover()`, `setCarryover()`

8. **Roadmaps - Legacy Flat** (CRUD complete)
   - `getRoadmaps()`, `setRoadmaps()`, `getRoadmapForGoal()`, `saveRoadmapForGoal()`, `deleteRoadmapForGoal()`, `cleanOrphanedRoadmaps()`

9. **Roadmap Trees - Hierarchical** (CRUD complete)
   - `getRoadmapTrees()`, `setRoadmapTrees()`, `getRoadmapTree()`, `saveRoadmapTree()`, `deleteRoadmapTree()`
   - `addRoadmapNode()`, `updateRoadmapNode()`, `deleteRoadmapNode()`, `migratePhasesToTree()`

10. **Onboarding** (Simple flag)
    - `isOnboardingDone()`, `setOnboardingDone()`

**Event System**:
- `dispatchStorageEvent()` - Custom event for same-tab updates
- `useStorageSync()` - Cross-tab listener subscription

---

### B. Migration Module (`lib/migration.ts`)
**Purpose**: One-time data migrations from v0 to v1  
**localStorage Usage**:
- Reads: `compass_goals`, `compass_sessions`, `compass_interruptions`, `compass_daily_records`
- Writes: Migration flag `compass_migration_v1_done`
- Functions: `migrateGoals()`, `migrateSessions()`, `migrateInterruptions()`, `migrateReflections()`, `runMigrations()`

**Status**: Can be deprecated after database migration

---

### C. Storage Sync Hook (`lib/hooks/useStorageSync.ts`)
**Purpose**: React hook for reactive localStorage updates  
**Lines**: 53  
**Usage**: Listens to `storage` and `compass-storage-update` events

**Key behavior**:
- Calls `readFn()` on mount
- Re-reads on storage events
- Optional key filtering

---

### D. Components Using localStorage

#### Direct localStorage Access:

1. **`app/page.tsx`**
   - Lines 36, 44: Onboarding status check/set
   - `localStorage.getItem("compass_onboarding_done")`
   - `localStorage.setItem("compass_onboarding_done", "true")`

2. **`components/AnalyticsDashboard.tsx`**
   - Lines 356-367: Direct reads for analytics
   - Reads: `compass_sessions`, `compass_goals`, `compass_daily_records`, `compass_interruptions`
   - Used in `readAll()` function for initial state

#### Indirect Usage (via `lib/storage.ts`):

3. **`components/TimerCard.tsx`** (via `useTimer` hook)
   - Sessions, tasks, interruptions

4. **`components/GoalsManager.tsx`**
   - Goals, sessions, roadmaps
   - Direct calls: `getGoals()`, `setGoals()`, `getSessions()`, `getRoadmapForGoal()`, `saveRoadmapForGoal()`

5. **`components/SessionHistory.tsx`**
   - Sessions, tasks

6. **`components/WeeklyPlan.tsx`**
   - Weekly objectives, tasks

7. **`components/DailyPlanning.tsx`**
   - Daily tasks, objectives

8. **`components/WeeklyReport.tsx`**
   - Sessions, reflections

9. **`components/FocusMode.tsx`**
   - Reflections

10. **`components/HabitTracker.tsx`**
    - Sessions

11. **`components/CalendarHeatmap.tsx`**
    - Sessions

12. **`components/MetricsBar.tsx`**
    - Sessions, goals

13. **`components/RoadmapTreeView.tsx`**
    - Roadmap trees

---

## 3. Migration Strategy

### Phase-Based Approach

Each module will be migrated incrementally with approval checkpoints between phases.

---

### **Module 1: Settings & Onboarding**
**Complexity**: ⭐ Low  
**Files to modify**: 
- `lib/storage.ts` (onboarding functions)
- `app/page.tsx` (direct access)

**Changes**:
1. Create database functions: `getSettings()`, `setSetting()`
2. Replace `isOnboardingDone()` / `setOnboardingDone()` with DB calls
3. Update `app/page.tsx` to use new functions
4. Keep backward compatibility temporarily

---

### **Module 2: Sessions**
**Complexity**: ⭐⭐ Medium  
**Dependencies**: None (foundational)  
**Files to modify**:
- `lib/storage.ts` (sessions functions)
- All components using sessions

**Changes**:
1. Create `lib/db-sessions.ts` with async functions
2. Implement: `createSession()`, `getSessionById()`, `getAllSessions()`, `getSessionsByDate()`, `getSessionsByTags()`, `deleteSession()`
3. Update `useTimer` hook to use async operations
4. Update all components reading sessions
5. Remove localStorage session functions

**Components affected**: TimerCard, SessionHistory, AnalyticsDashboard, MetricsBar, WeeklyReport, HabitTracker, CalendarHeatmap, GoalsManager

---

### **Module 3: Goals**
**Complexity**: ⭐⭐⭐ High (has cascading deletes)  
**Dependencies**: Sessions (for analytics)  
**Files to modify**:
- `lib/storage.ts` (goals functions)
- `components/GoalsManager.tsx`
- `components/MetricsBar.tsx`

**Changes**:
1. Create `lib/db-goals.ts`
2. Implement: `createGoal()`, `getGoalById()`, `getAllGoals()`, `updateGoal()`, `deleteGoal()` (with cascades)
3. Update all goal-related components
4. Handle referential integrity with objectives

**Cascade Requirements**:
- Deleting goal → delete roadmaps, trees, objectives, tasks

---

### **Module 4: Interruptions**
**Complexity**: ⭐ Low  
**Dependencies**: Sessions (foreign key)  
**Files to modify**:
- `lib/storage.ts` (interruptions functions)
- `components/TimerCard.tsx`
- `components/AnalyticsDashboard.tsx`

**Changes**:
1. Create `lib/db-interruptions.ts`
2. Implement: `createInterruption()`, `getInterruptionsBySession()`, `getAllInterruptions()`
3. Update TimerCard to use async operations

---

### **Module 5: Weekly Objectives & Daily Tasks**
**Complexity**: ⭐⭐⭐ High (complex relationships)  
**Dependencies**: Goals (foreign key)  
**Files to modify**:
- `lib/storage.ts` (objectives & tasks functions)
- `components/WeeklyPlan.tsx`
- `components/DailyPlanning.tsx`

**Changes**:
1. Create `lib/db-objectives.ts` and `lib/db-tasks.ts`
2. Implement full CRUD for objectives and tasks
3. Handle checklist items as separate table operations
4. Update filtering by week, date, objective

**Relationships**:
- Objective → Goal (foreign key)
- Task → Objective (optional foreign key)
- Task → Checklist Items (one-to-many)

---

### **Module 6: Reflections**
**Complexity**: ⭐⭐ Medium  
**Dependencies**: None  
**Files to modify**:
- `lib/storage.ts` (reflections functions)
- `components/FocusMode.tsx`
- `components/WeeklyReport.tsx`

**Changes**:
1. Create `lib/db-reflections.ts`
2. Implement upsert logic (unique by date)
3. Array fields: accomplishments, challenges, improvements, wins

---

### **Module 7: Roadmaps (Legacy & Trees)**
**Complexity**: ⭐⭐⭐ High (two systems)  
**Dependencies**: Goals  
**Files to modify**:
- `lib/storage.ts` (roadmap functions)
- `components/GoalsManager.tsx`
- `components/RoadmapTreeView.tsx`

**Changes**:
1. Create `lib/db-roadmaps.ts`
2. Implement legacy phases (backward compat)
3. Implement hierarchical tree operations
4. Recursive delete for tree nodes
5. Tree reconstruction from flat parent-child structure

---

### **Module 8: Event System Refactor**
**Complexity**: ⭐⭐ Medium  
**Files to modify**:
- `lib/hooks/useStorageSync.ts`
- All components using the hook

**Changes**:
1. Replace with polling or WebSocket/Server-Sent Events
2. OR: Keep custom events but trigger them after DB operations
3. Update all `useStorageSync` calls to new pattern

---

### **Module 9: Legacy Migration & Cleanup**
**Complexity**: ⭐ Low  
**Files to modify**:
- `lib/migration.ts`

**Changes**:
1. Create one-time migration script: localStorage → PostgreSQL
2. Run on first database connection
3. Deprecate `lib/migration.ts`

---

## 4. Technical Considerations

### A. Async/Await Refactor
- All storage operations become async
- Components need `useState` + `useEffect` patterns
- Loading states required for UI

### B. Error Handling
- Network failures
- Connection timeouts
- Transaction rollbacks
- User-friendly error messages

### C. Performance
- Batch operations where possible
- Use indexes (already in schema)
- Pagination for large lists
- Client-side caching strategy

### D. Data Validation
- Schema validation before DB writes
- Type safety with TypeScript
- Foreign key constraint handling

### E. Testing Strategy
- Unit tests for each DB module
- Integration tests for CRUD operations
- Migration testing (localStorage → DB)
- Rollback procedures

---

## 5. Migration Order (Recommended)

1. **Settings & Onboarding** (simplest, tests infrastructure)
2. **Sessions** (foundational, no dependencies)
3. **Interruptions** (depends on Sessions)
4. **Goals** (complex but widely used)
5. **Reflections** (independent)
6. **Weekly Objectives** (depends on Goals)
7. **Daily Tasks** (depends on Objectives)
8. **Roadmaps** (depends on Goals, complex)
9. **Event System Refactor** (architectural)
10. **Legacy Cleanup** (final)

---

## 6. Rollback Strategy

For each module:
1. Keep localStorage functions alongside DB functions initially
2. Use feature flag to toggle between implementations
3. Monitor for errors in production
4. Easy rollback if issues detected
5. Remove localStorage code only after stability confirmed

---

## 7. Files Summary

### Files with localStorage usage:
1. ✅ `lib/storage.ts` (central abstraction - 490 lines)
2. ✅ `lib/migration.ts` (legacy migrations - 259 lines)
3. ✅ `lib/hooks/useStorageSync.ts` (reactive hook - 53 lines)
4. ✅ `app/page.tsx` (onboarding - 2 direct accesses)
5. ✅ `components/AnalyticsDashboard.tsx` (direct reads - 4 keys)
6. ⚠️ `components/TimerCard.tsx` (indirect via useTimer)
7. ⚠️ `components/GoalsManager.tsx` (indirect via storage.ts)
8. ⚠️ `components/SessionHistory.tsx` (indirect)
9. ⚠️ `components/WeeklyPlan.tsx` (indirect)
10. ⚠️ `components/DailyPlanning.tsx` (indirect)
11. ⚠️ `components/WeeklyReport.tsx` (indirect)
12. ⚠️ `components/FocusMode.tsx` (indirect)
13. ⚠️ `components/HabitTracker.tsx` (indirect)
14. ⚠️ `components/CalendarHeatmap.tsx` (indirect)
15. ⚠️ `components/MetricsBar.tsx` (indirect)
16. ⚠️ `components/RoadmapTreeView.tsx` (indirect)

**Total files**: 16  
**Direct usage**: 3 files  
**Indirect usage**: 13 files (via `lib/storage.ts`)

---

## 8. Next Steps

### Immediate Action Items:
1. ✅ Review this analysis
2. ⏸️ Get approval for migration approach
3. ⏸️ Begin Module 1: Settings & Onboarding
4. ⏸️ After completion, pause for approval before Module 2

### Per-Module Workflow:
1. Create new `lib/db-*.ts` module
2. Implement async CRUD operations
3. Update components to use new functions
4. Test thoroughly
5. **STOP and request approval**
6. Continue to next module

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | HIGH | Backup localStorage before migration, test thoroughly |
| Performance degradation | MEDIUM | Use indexes, implement caching, batch operations |
| Breaking existing features | HIGH | Incremental migration, thorough testing per module |
| Complex async refactoring | MEDIUM | Use TypeScript strictly, add loading states |
| Cascade delete bugs | HIGH | Test delete operations extensively, use transactions |
| Cross-tab sync issues | MEDIUM | Implement proper event system or polling |

---

## 10. Success Criteria

✅ All localStorage operations replaced with database operations  
✅ Zero data loss during migration  
✅ All existing features work identically  
✅ TypeScript has zero errors  
✅ No console errors in browser  
✅ Performance is equal or better  
✅ All tests passing  
✅ Code is cleaner and more maintainable  

---

## END OF ANALYSIS

**Status**: Analysis Complete - Awaiting Approval to Begin Migration  
**Recommendation**: Start with Module 1 (Settings & Onboarding)  
**Estimated Total Effort**: 10 modules × (1-3 hours each) = 10-30 hours
