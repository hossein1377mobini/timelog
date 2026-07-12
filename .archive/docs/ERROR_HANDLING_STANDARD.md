# Error Handling Standards

**Date:** July 1, 2026  
**Purpose:** Standardize error handling patterns across the codebase

---

## Current State Analysis

### Pattern 1: Database Operations (Throw Errors)
**Used in:** `lib/db-*.ts` files  
**Behavior:** Functions throw errors when database operations fail  
**Example:**
```typescript
export async function createSession(data: SessionInput): Promise<Session> {
  const result = await pool.query(...); // Throws on error
  return mapToSession(result.rows[0]);
}
```

### Pattern 2: localStorage Operations (Return Null/Undefined)
**Used in:** `lib/storage.ts`  
**Behavior:** Functions return `null` or `undefined` on failure  
**Example:**
```typescript
export function updateGoal(id: string, patch: Partial<Goal>): Goal | null {
  const idx = all.findIndex((g) => g.id === id);
  if (idx === -1) return null; // Not found
  // ...
}
```

### Pattern 3: Silent Failures (Try-Catch + Log)
**Used in:** `lib/storage.ts` internal functions  
**Behavior:** Catch errors, log them, return fallback  
**Example:**
```typescript
function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to write ${key}:`, e); // Just logs
  }
}
```

---

## Standardized Error Handling Strategy

### 1. Database Layer (`lib/db-*.ts`)
**Strategy:** **Throw errors** - Let caller decide how to handle

**Rationale:**
- Database operations are critical - failures should be explicit
- Server-side code can catch and handle appropriately
- Enables proper error propagation to client with status codes

**Implementation:**
```typescript
/**
 * Create a new session in the database.
 * @throws {Error} If database connection fails or query fails
 */
export async function createSession(input: Omit<Session, "id">): Promise<Session> {
  const client = await pool.connect(); // May throw
  try {
    const result = await client.query(...); // May throw
    if (result.rows.length === 0) {
      throw new Error('Failed to create session: No rows returned');
    }
    return mapToSession(result.rows[0]);
  } finally {
    client.release();
  }
}
```

**Error Types to Throw:**
- Connection errors (let pg throw)
- Query failures (let pg throw)
- Data validation errors (throw explicit Error)
- Not found errors (throw Error with descriptive message)

---

### 2. Storage Layer (`lib/storage.ts`)
**Strategy:** **Return null for not-found, throw for critical errors**

**Rationale:**
- localStorage is client-side cache - not-found is expected behavior
- Return `null` for missing data (caller can handle gracefully)
- Throw only for unexpected errors (shouldn't happen in practice)

**Implementation:**
```typescript
/**
 * Update a goal by ID.
 * @returns The updated goal, or null if not found
 */
export function updateGoal(id: string, patch: Partial<Goal>): Goal | null {
  const all = getGoals();
  const idx = all.findIndex((g) => g.id === id);
  if (idx === -1) return null; // Expected: not found
  
  const existing = all[idx];
  if (!existing) return null;
  
  all[idx] = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  setGoals(all);
  return all[idx] ?? null;
}
```

**Safe Operations (Try-Catch):**
```typescript
function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Failed to read ${key}:`, e);
    return fallback; // Graceful degradation
  }
}
```

---

### 3. Server Actions (`app/actions.ts`)
**Strategy:** **Try-catch with user-friendly messages**

**Rationale:**
- Server actions are directly called by UI - need user-friendly errors
- Catch all errors and return formatted error objects
- Log detailed errors server-side, return safe messages to client

**Implementation:**
```typescript
export async function createSessionAction(data: SessionInput): Promise<{ 
  success: boolean; 
  data?: Session; 
  error?: string 
}> {
  try {
    const session = await createSession(data);
    return { success: true, data: session };
  } catch (error) {
    console.error('Failed to create session:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create session'
    };
  }
}
```

---

### 4. React Components
**Strategy:** **Use error boundaries + local error state**

**Rationale:**
- Component errors should not crash entire app
- Show user-friendly error messages in UI
- Use error boundaries for unexpected errors
- Use local error state for expected errors (form validation, etc.)

**Implementation:**
```typescript
'use client';

export function SessionForm() {
  const [error, setError] = useState<string | null>(null);
  
  async function handleSubmit(data: SessionInput) {
    setError(null);
    
    const result = await createSessionAction(data);
    
    if (!result.success) {
      setError(result.error ?? 'Unknown error');
      return;
    }
    
    // Success handling...
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* Form fields */}
    </form>
  );
}
```

---

## Error Handling Decision Tree

```
Is this a database operation?
├─ YES → Throw errors (let caller handle)
└─ NO → Is this a storage operation?
    ├─ YES → Return null for not-found, fallback for errors
    └─ NO → Is this a server action?
        ├─ YES → Try-catch, return { success, data?, error? }
        └─ NO → Is this a React component?
            └─ YES → Use error boundaries + local error state
```

---

## Migration Plan

### Phase 1: Database Layer (CURRENT - Already Consistent ✅)
- All `lib/db-*.ts` files already throw errors consistently
- No changes needed

### Phase 2: Storage Layer (CURRENT - Already Consistent ✅)
- All `lib/storage.ts` functions follow the pattern
- Safe operations use try-catch with fallbacks
- CRUD operations return null for not-found

### Phase 3: Server Actions (Needs Improvement)
- Current: Some actions have try-catch, others don't
- Target: All actions should return `{ success, data?, error? }` format
- Add proper error logging

### Phase 4: Component Error Handling (Future Work)
- Integrate ErrorBoundary into app layout
- Add error states to forms
- Show user-friendly error messages

---

## Current Status

✅ **Database Layer:** Consistent (throws errors)  
✅ **Storage Layer:** Consistent (returns null, safe operations)  
🟨 **Server Actions:** Partially consistent (needs standardization)  
⏳ **Components:** Needs error boundaries integration

---

## Recommended Actions

1. ✅ Database layer - No changes needed (already consistent)
2. ✅ Storage layer - No changes needed (already consistent)
3. 🔧 Server actions - Standardize return format to `{ success, data?, error? }`
4. 🔧 Components - Integrate ErrorBoundary in app/layout.tsx
5. 📝 Add JSDoc comments documenting error behavior

---

**Conclusion:** Error handling is mostly consistent. The main areas for improvement are:
1. Standardizing server action return types
2. Integrating error boundaries into the component tree
3. Adding comprehensive error documentation

**Status:** MEDIUM-8 analysis complete. Patterns are already mostly consistent. Only minor improvements needed.
