# Storage Architecture Documentation

**Project:** Timelog (Compass Time Tracking App)  
**Date:** July 1, 2026  
**Status:** Dual-Layer System in Migration

---

## Overview

The Compass application currently uses a **dual storage layer architecture** consisting of:

1. **Client-side localStorage** (`lib/storage.ts`) - Legacy system
2. **Server-side PostgreSQL** (`lib/db-*.ts`) - Target system

This document explains the rationale, current state, and migration strategy.

---

## Architecture Components

### 1. Client-Side Storage Layer (`lib/storage.ts`)

**Purpose:** Browser-based persistence using the Web Storage API

**Characteristics:**
- ✅ Synchronous operations (instant reads/writes)
- ✅ Zero latency - no network calls
- ✅ Works offline by default
- ✅ Simple key-value JSON serialization
- ❌ Limited to ~5-10MB storage
- ❌ Single-device only (no sync across devices)
- ❌ Data lives in browser (cleared on cache clear)
- ❌ No server-side rendering support

**Storage Keys:**
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
  ROADMAPS: "compass_roadmaps",
  ROADMAP_TREES: "compass_roadmap_trees",
}
```

**Core Functions:**
- `safeGet<T>(key, fallback)` - Read with SSR guard
- `safeSet<T>(key, value)` - Write with error handling
- `dispatchStorageEvent()` - Cross-component sync
- `subscribeToStorage(handler)` - Event subscription

**Usage Pattern:**
```typescript
// Client components only
'use client'

import { getGoals, addGoal } from '@/lib/storage'

function MyComponent() {
  const goals = getGoals() // Instant, synchronous
  // ...
}
```

---

### 2. Server-Side Database Layer (`lib/db-*.ts`)

**Purpose:** PostgreSQL-backed persistent storage with multi-device sync

**Characteristics:**
- ✅ Unlimited storage capacity
- ✅ Multi-device synchronization
- ✅ Data survives browser cache clears
- ✅ Server-side rendering support
- ✅ Advanced querying (SQL joins, aggregations)
- ✅ Transaction support
- ✅ Backup and recovery capabilities
- ❌ Network latency on every operation
- ❌ Requires database infrastructure
- ❌ Asynchronous operations only

**Database Modules:**
```
lib/db.ts                  - Connection pool configuration
lib/db-sessions.ts         - Focus session tracking
lib/db-interruptions.ts    - Interruption events
lib/db-goals.ts            - Long-term goal management
lib/db-reflections.ts      - Daily reflection entries
lib/db-weekly-objectives.ts - Weekly planning objectives
lib/db-tasks.ts            - Daily task scheduling
lib/db-roadmaps.ts         - Hierarchical roadmap trees
lib/db-events.ts           - Event notifications
lib/db-settings.ts         - User preferences
```

**Connection Configuration:**
```typescript
// lib/db.ts
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'compass',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});
```

**Usage Pattern:**
```typescript
// Server components or Server Actions
'use server'

import { getAllSessions } from '@/lib/db-sessions'

async function MyServerComponent() {
  const { sessions, total } = await getAllSessions({ limit: 50 })
  // ...
}
```

---

## Current State

### Migration Status

The application is **actively migrating** from localStorage to PostgreSQL:

| Module | localStorage | PostgreSQL | Status |
|--------|-------------|-----------|--------|
| Sessions | ✅ | ✅ | Both active |
| Interruptions | ✅ | ✅ | Both active |
| Goals | ✅ | ✅ | Both active |
| Reflections | ✅ | ✅ | Both active |
| Weekly Objectives | ✅ | ✅ | Both active |
| Daily Tasks | ✅ | ✅ | Both active |
| Roadmaps | ✅ | ✅ | Both active |
| Settings | ❌ | ✅ | PostgreSQL only |
| Events | ❌ | ✅ | PostgreSQL only |

**Migration Tools:**
- `lib/migration.ts` - Automated data migration from localStorage to PostgreSQL
- `runMigrations()` - Client-side function to copy existing data
- `MIGRATION_ANALYSIS.md` - Technical migration documentation
- `MIGRATION_PROGRESS.md` - Status tracking

---

## Storage Strategy

### When to Use localStorage

✅ **Use localStorage for:**

1. **Client-side caching** - Quick reads without server roundtrip
2. **Optimistic UI updates** - Instant feedback while syncing to server
3. **Offline capability** - Continue working when network unavailable
4. **UI preferences** - Theme, sidebar state, temporary form data
5. **Onboarding state** - First-run tutorials and setup flags

**Example:**
```typescript
// Instant read for UI rendering
const goals = getGoals() // No await needed

// Optimistic update
addGoal({ name: "New Goal", ... }) // Instant
syncToServer(goal) // Background sync
```

### When to Use PostgreSQL

✅ **Use PostgreSQL for:**

1. **Server-side rendering (SSR)** - Pre-render data on server
2. **Multi-device sync** - Share data across browsers/devices
3. **Large datasets** - Historical data, analytics, reports
4. **Complex queries** - Joins, aggregations, filtering
5. **Data integrity** - Transactions, constraints, referential integrity
6. **Persistent storage** - Data that must survive cache clears

**Example:**
```typescript
// Server component with SSR
export default async function DashboardPage() {
  const { sessions } = await getAllSessions({ limit: 100 })
  return <SessionList sessions={sessions} />
}
```

---

## Hybrid Strategy: Best of Both Worlds

### Recommended Pattern

**Read Path:**
1. Server renders page with PostgreSQL data (SSR)
2. Client hydrates and reads from localStorage (cache)
3. Background sync updates localStorage from PostgreSQL

**Write Path:**
1. Update localStorage immediately (optimistic UI)
2. Call Server Action to update PostgreSQL
3. On success: localStorage stays
4. On error: Revert localStorage, show error

**Implementation:**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { getGoals, addGoal } from '@/lib/storage'
import { createGoalAction } from '@/app/actions'

export function GoalsManager({ serverGoals }: { serverGoals: Goal[] }) {
  // Initialize from server data
  const [goals, setGoals] = useState(serverGoals)

  // Sync from localStorage after mount (for latest changes)
  useEffect(() => {
    const localGoals = getGoals()
    if (localGoals.length > 0) {
      setGoals(localGoals)
    }
  }, [])

  async function handleAddGoal(data: GoalInput) {
    // 1. Optimistic update to localStorage
    const newGoal = addGoal(data)
    setGoals(prev => [...prev, newGoal])

    // 2. Sync to server in background
    try {
      await createGoalAction(data)
      // Success - localStorage already updated
    } catch (error) {
      // 3. Revert on error
      deleteGoal(newGoal.id)
      setGoals(prev => prev.filter(g => g.id !== newGoal.id))
      alert('Failed to save goal')
    }
  }

  return <GoalsList goals={goals} onAdd={handleAddGoal} />
}
```

---

## Migration Path

### Phase 1: Dual Write ✅ (Current)

**Status:** COMPLETE

Both systems are operational:
- All CRUD operations write to both localStorage AND PostgreSQL
- Reads come from localStorage for speed
- PostgreSQL is kept in sync for backup

### Phase 2: PostgreSQL Primary 🟡 (In Progress)

**Goal:** Make PostgreSQL the source of truth

**Steps:**
1. ✅ Add pagination to all `getAll*()` functions
2. ✅ Add database indexes for query performance
3. ✅ Fix N+1 query patterns
4. ⏳ Migrate all components to Server Actions
5. ⏳ Add error handling and retry logic
6. ⏳ Test multi-device synchronization

### Phase 3: localStorage as Cache ⏳ (Future)

**Goal:** localStorage becomes read-only cache

**Changes:**
- localStorage only updated from PostgreSQL (one-way sync)
- All writes go directly to PostgreSQL
- Background sync keeps cache fresh
- Cache invalidation on updates

**Benefits:**
- No data inconsistency issues
- Offline mode still works (read-only)
- Fast reads with cache
- PostgreSQL is single source of truth

### Phase 4: Optional - Remove localStorage ⏳ (Far Future)

**Considerations:**
- Only if offline support not needed
- Only if instant UI updates not critical
- Requires network to be always available

**Trade-offs:**
- ❌ Lose instant reads (every read is async)
- ❌ Lose offline capability
- ✅ Simpler architecture (single storage layer)
- ✅ No sync logic needed

---

## Sync Strategy

### Cross-Tab Synchronization

**Problem:** Multiple browser tabs showing stale data

**Solution:** Storage event broadcasting

```typescript
// lib/storage.ts
export function dispatchStorageEvent(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event("compass-storage-update"))
}

export function subscribeToStorage(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  
  // Listen to both native storage events (cross-tab) and custom events (same-tab)
  window.addEventListener("storage", handler)
  window.addEventListener("compass-storage-update", handler)
  
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener("compass-storage-update", handler)
  }
}
```

**Usage in Components:**
```typescript
import { useStorageSubscription } from '@/lib/hooks/useStorageSubscription'

export function MyComponent() {
  const [data, setData] = useState(getData())

  // Auto-refresh when storage changes
  useStorageSubscription(() => {
    setData(getData())
  })

  return <div>{data}</div>
}
```

### Cross-Device Synchronization

**Problem:** Changes on one device not visible on another

**Solution:** PostgreSQL as sync hub

1. Device A makes change → writes to PostgreSQL
2. Device B polls or uses WebSockets to detect changes
3. Device B fetches latest data from PostgreSQL
4. Device B updates its localStorage cache

**Future Enhancement:**
- WebSocket connection for real-time sync
- Push notifications for updates
- Conflict resolution strategy (last-write-wins vs merge)

---

## Data Consistency

### Potential Issues

1. **Write Conflicts**
   - User edits in two tabs simultaneously
   - Last write wins (no merge strategy yet)

2. **Sync Failures**
   - Network error during PostgreSQL write
   - localStorage updated but server not synced
   - Resolution: Retry with exponential backoff

3. **Cache Staleness**
   - localStorage shows old data after server update
   - Resolution: Storage event broadcasting

4. **Migration Partial Completion**
   - Some data in localStorage, some in PostgreSQL
   - Resolution: Migration idempotency checks

### Handling Inconsistencies

```typescript
// Server Action with retry logic
export async function createGoalAction(data: GoalInput) {
  const maxRetries = 3
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      const goal = await createGoal(data)
      return { success: true, goal }
    } catch (error) {
      attempt++
      if (attempt >= maxRetries) {
        return { 
          success: false, 
          error: 'Failed to save after multiple attempts' 
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
}
```

---

## Performance Considerations

### localStorage Performance

| Operation | Avg Time | Notes |
|-----------|----------|-------|
| Read | <1ms | Synchronous, instant |
| Write | <1ms | Synchronous, instant |
| Parse JSON (1000 items) | ~5ms | Can block UI thread |
| Storage limit | 5-10MB | Browser dependent |

**Optimization Tips:**
- Use lazy loading for large datasets
- Implement pagination in localStorage reads
- Debounce writes to avoid excessive serialization

### PostgreSQL Performance

| Operation | Avg Time | Notes |
|-----------|----------|-------|
| Simple SELECT | 5-20ms | Network + query time |
| SELECT with JOIN | 10-50ms | Depends on indexes |
| INSERT | 10-30ms | Includes transaction commit |
| Complex aggregation | 50-200ms | Needs query optimization |

**Optimization Applied:**
- ✅ Database indexes on foreign keys and dates
- ✅ Connection pooling (reuse connections)
- ✅ N+1 query elimination (use JOINs)
- ✅ Pagination (LIMIT/OFFSET)
- ✅ Prepared statements (parameterized queries)

---

## Developer Guidelines

### Adding New Data Types

**Step 1:** Define TypeScript type in `lib/types.ts`
```typescript
export interface MyNewType {
  id: string
  name: string
  createdAt: string
}
```

**Step 2:** Create database module `lib/db-mynewtype.ts`
```typescript
import pool from './db'

export async function getAllMyNewTypes(options?: {
  limit?: number
  offset?: number
}): Promise<{ items: MyNewType[]; total: number }> {
  const limit = options?.limit || 50
  const offset = options?.offset || 0

  // Count query
  const countResult = await pool.query('SELECT COUNT(*) FROM my_new_types')
  const total = parseInt(countResult.rows[0].count)

  // Data query
  const result = await pool.query(
    'SELECT * FROM my_new_types ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  )

  return { items: result.rows, total }
}
```

**Step 3:** (Optional) Add localStorage functions in `lib/storage.ts`
```typescript
const KEYS = {
  // ... existing keys
  MY_NEW_TYPE: "compass_mynewtype",
}

export function getMyNewTypes(): MyNewType[] {
  return safeGet<MyNewType[]>(KEYS.MY_NEW_TYPE, [])
}
```

**Step 4:** Create Server Actions in `app/actions.ts`
```typescript
'use server'

export async function createMyNewTypeAction(data: MyNewTypeInput) {
  try {
    const item = await createMyNewType(data)
    return { success: true, item }
  } catch (error) {
    return { success: false, error: 'Failed to create' }
  }
}
```

---

## Testing Strategy

### localStorage Testing

```typescript
// Mock localStorage in tests
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
```

### PostgreSQL Testing

```typescript
// Use test database
process.env.DB_NAME = 'compass_test'

// Reset database before each test
beforeEach(async () => {
  await pool.query('TRUNCATE TABLE sessions CASCADE')
})
```

---

## Security Considerations

### localStorage Security

- ⚠️ Accessible to any JavaScript on same domain
- ⚠️ XSS attacks can read/modify data
- ✅ No secrets stored in localStorage
- ✅ User data only (no passwords, tokens)

### PostgreSQL Security

- ✅ Credentials in environment variables
- ✅ Parameterized queries (no SQL injection)
- ✅ Connection pooling with limits
- ⏳ Row-level security (future)
- ⏳ User authentication (future)

---

## Future Enhancements

### Short Term (3-6 months)
- [ ] Complete migration to PostgreSQL primary
- [ ] Add retry logic to all Server Actions
- [ ] Implement WebSocket for real-time sync
- [ ] Add conflict resolution strategy

### Long Term (6-12 months)
- [ ] Row-level security for multi-user support
- [ ] Offline mode with sync queue
- [ ] Data export/import functionality
- [ ] Backup and restore tools
- [ ] Database connection health monitoring

---

## Troubleshooting

### Common Issues

**Problem:** "localStorage is not defined" error
- **Cause:** Server-side rendering accessing localStorage
- **Solution:** Use `typeof window !== 'undefined'` guard

**Problem:** Data not syncing between tabs
- **Cause:** Storage event not dispatched
- **Solution:** Call `dispatchStorageEvent()` after writes

**Problem:** PostgreSQL connection timeout
- **Cause:** Database server not running or wrong credentials
- **Solution:** Check `.env` file and `docker-compose` status

**Problem:** Stale data shown after update
- **Cause:** Component not re-rendering on storage change
- **Solution:** Use `useStorageSubscription()` hook

---

## References

- [Web Storage API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [PostgreSQL Connection Pooling](https://node-postgres.com/features/pooling)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [CODE_REVIEW_REPORT.md](./CODE_REVIEW_REPORT.md) - Issue HIGH-8
- [MIGRATION_ANALYSIS.md](./MIGRATION_ANALYSIS.md) - Technical migration details

---

**Document Version:** 1.0  
**Last Updated:** July 1, 2026  
**Maintained By:** Development Team
