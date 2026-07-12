# Plan 004: Add zod input schema validation on all mutable endpoints

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat ba6dd1e..HEAD -- app/api/ lib/types.ts lib/schemas.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none (but recommended after plan 002)
- **Category**: security / correctness
- **Planned at**: commit `ba6dd1e`, 2026-07-11

## Why this matters

Every PATCH/POST route passes `request.json()` → DB with zero runtime validation. Enum fields (`status`, `priority`, `severity`, `type`) accept any string. While SQL is parameterized (no injection), corrupt data can be persisted — e.g., `status: "hacked"` on a Goal. Downstream components may crash or behave unexpectedly on unhandled enum values.

## Current state

- `lib/types.ts` defines the valid enum values:
  ```ts
  export type GoalPriority = "high" | "medium" | "low"
  export type GoalStatus = "active" | "paused" | "completed" | "archived"
  export type TaskPriority = "high" | "medium" | "low"
  export type TaskStatus = "pending" | "in-progress" | "completed"
  export type InterruptionType = "distraction" | "external" | "thought" | "break" | "admin"
  export type InterruptionSeverity = "low" | "medium" | "high"
  export type NodeType = "phase" | "objective" | "task"
  export type NodeStatus = "pending" | "in-progress" | "completed"
  ```
- API routes with PATCH/POST (all follow the same pattern — `request.json()` → db function):
  - `app/api/goals/route.ts` — POST and PATCH (Goal fields)
  - `app/api/tasks/route.ts` — POST and PATCH (Task fields)
  - `app/api/sessions/route.ts` — POST and PATCH (Session fields)
  - `app/api/reflections/route.ts` — POST and PATCH (Reflection fields)
  - `app/api/interruptions/route.ts` — POST and PATCH (Interruption fields)
  - `app/api/weekly-objectives/route.ts` — POST and PATCH (WeeklyObjective fields)
  - `app/api/roadmaps/route.ts` — POST and PATCH (RoadmapNode fields)
  - `app/api/settings/route.ts` — PATCH (Settings fields)
- `package.json` does not include `zod` — needs to be installed.

## Commands you will need

| Purpose   | Command                          | Expected on success |
|-----------|----------------------------------|---------------------|
| Install   | `npm install zod`                | exit 0              |
| Typecheck | `npx tsc --noEmit`               | exit 0, no errors   |
| Tests     | `npm test`                       | all pass            |

## Scope

**In scope**:
- `lib/schemas.ts` (new file — all zod schemas)
- `app/api/goals/route.ts` — validate POST and PATCH bodies
- `app/api/tasks/route.ts` — validate POST and PATCH bodies
- `app/api/sessions/route.ts` — validate POST and PATCH bodies
- `app/api/reflections/route.ts` — validate POST and PATCH bodies
- `app/api/interruptions/route.ts` — validate POST and PATCH bodies
- `app/api/weekly-objectives/route.ts` — validate POST and PATCH bodies
- `app/api/roadmaps/route.ts` — validate POST and PATCH bodies
- `app/api/settings/route.ts` — validate PATCH body
- `package.json` (install zod)

**Out of scope**:
- `app/api/auth/*` routes (auth has its own validation pattern)
- `lib/db-*.ts` functions (they receive already-validated data)
- `app/api/board/route.ts` (read-only GET endpoint)

## Steps

### Step 1: Install zod

```bash
npm install zod
```

**Verify**: `npm ls zod` → shows zod version

### Step 2: Create `lib/schemas.ts` with all validation schemas

Create `lib/schemas.ts`:
```ts
import { z } from "zod"

// ── Enums ──────────────────────────────────────────────────────────────────

export const GoalPriority = z.enum(["high", "medium", "low"])
export const GoalStatus = z.enum(["active", "paused", "completed", "archived"])
export const TaskPriority = z.enum(["high", "medium", "low"])
export const TaskStatus = z.enum(["pending", "in-progress", "completed"])
export const InterruptionType = z.enum(["distraction", "external", "thought", "break", "admin"])
export const InterruptionSeverity = z.enum(["low", "medium", "high"])
export const NodeType = z.enum(["phase", "objective", "task"])
export const NodeStatus = z.enum(["pending", "in-progress", "completed"])

// ── Entity schemas (POST = full create, PATCH = partial update) ─────────────

export const CreateGoalSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().default(""),
  category: z.string().default(""),
  tag: z.string().default(""),
  targetHours: z.number().min(0).default(0),
  targetDate: z.string().default(""),
  weeklyTarget: z.number().min(0).default(0),
  priority: GoalPriority.default("medium"),
  status: GoalStatus.default("active"),
  color: z.string().default("#3b82f6"),
})

export const UpdateGoalSchema = CreateGoalSchema.partial()

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().default(""),
  estimatedTime: z.number().min(0).default(25),
  priority: TaskPriority.default("medium"),
  status: TaskStatus.default("pending"),
  scheduledDate: z.string().default(""),
  scheduledTime: z.string().default(""),
  tags: z.array(z.string()).default([]),
  objectiveId: z.string().nullable().default(null),
  sessionId: z.string().nullable().default(null),
  pomodoroCount: z.number().min(0).default(0),
})

export const UpdateTaskSchema = CreateTaskSchema.partial()

export const CreateSessionSchema = z.object({
  title: z.string().min(1).max(200),
  duration: z.number().min(0).default(0),
  startTime: z.string().default(""),
  endTime: z.string().default(""),
  goalId: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
})

export const UpdateSessionSchema = CreateSessionSchema.partial()

export const CreateReflectionSchema = z.object({
  content: z.string().default(""),
  type: z.enum(["morning", "evening"]).default("evening"),
  mood: z.number().min(1).max(5).default(3),
  energy: z.number().min(1).max(5).default(3),
  date: z.string().default(""),
})

export const UpdateReflectionSchema = CreateReflectionSchema.partial()

export const CreateInterruptionSchema = z.object({
  type: InterruptionType,
  description: z.string().default(""),
  severity: InterruptionSeverity.default("low"),
  sessionId: z.string().nullable().default(null),
  duration: z.number().min(0).default(0),
})

export const UpdateInterruptionSchema = CreateInterruptionSchema.partial()

export const CreateWeeklyObjectiveSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().default(""),
  goalId: z.string().nullable().default(null),
  status: TaskStatus.default("pending"),
  priority: TaskPriority.default("medium"),
  weekStart: z.string().default(""),
  order: z.number().min(0).default(0),
})

export const UpdateWeeklyObjectiveSchema = CreateWeeklyObjectiveSchema.partial()

export const CreateRoadmapNodeSchema = z.object({
  type: NodeType,
  name: z.string().min(1).max(200),
  description: z.string().default(""),
  goalId: z.string(),
  parentId: z.string().nullable().default(null),
  children: z.array(z.string()).default([]),
  status: NodeStatus.default("pending"),
  order: z.number().min(0).default(0),
})

export const UpdateRoadmapNodeSchema = CreateRoadmapNodeSchema.partial()
```

**Verify**: `npx tsc --noEmit 2>&1 | head -20` → exit 0

### Step 3: Add validation helper and apply to goals route

Add a validation helper at the top of each route file (or import from a shared utility):

```ts
import { z } from "zod"

function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { data: T; error?: never } | { data?: never; error: Response } {
  const result = schema.safeParse(body)
  if (!result.success) {
    return {
      error: Response.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      ),
    }
  }
  return { data: result.data }
}
```

Then in `app/api/goals/route.ts`, wrap POST and PATCH:

```ts
// In POST:
import { CreateGoalSchema, UpdateGoalSchema } from "@/lib/schemas"

// After body = await request.json():
const parsed = validateBody(CreateGoalSchema, body)
if (parsed.error) return parsed.error
const newGoal = await createGoal(session.sub, parsed.data)

// In PATCH:
const parsed = validateBody(UpdateGoalSchema, body)
if (parsed.error) return parsed.error
const updatedGoal = await updateGoal(session.sub, id, parsed.data)
```

Apply the same pattern to all route files:
- `app/api/tasks/route.ts` → `CreateTaskSchema`, `UpdateTaskSchema`
- `app/api/sessions/route.ts` → `CreateSessionSchema`, `UpdateSessionSchema`
- `app/api/reflections/route.ts` → `CreateReflectionSchema`, `UpdateReflectionSchema`
- `app/api/interruptions/route.ts` → `CreateInterruptionSchema`, `UpdateInterruptionSchema`
- `app/api/weekly-objectives/route.ts` → `CreateWeeklyObjectiveSchema`, `UpdateWeeklyObjectiveSchema`
- `app/api/roadmaps/route.ts` → `CreateRoadmapNodeSchema`, `UpdateRoadmapNodeSchema`
- `app/api/settings/route.ts` → a `UpdateSettingsSchema` (read the settings route first to determine the schema shape)

**Verify**: `npx tsc --noEmit` → exit 0

### Step 4: Add schema tests

Create `lib/__tests__/schemas.test.ts`:
```ts
import { describe, it, expect } from "vitest"
import {
  CreateGoalSchema, UpdateGoalSchema,
  CreateTaskSchema, UpdateTaskSchema,
  GoalPriority, GoalStatus, TaskPriority, TaskStatus,
} from "@/lib/schemas"

describe("Goal schemas", () => {
  it("CreateGoalSchema accepts valid input", () => {
    const result = CreateGoalSchema.safeParse({ name: "Learn TypeScript" })
    expect(result.success).toBe(true)
  })

  it("CreateGoalSchema rejects empty name", () => {
    const result = CreateGoalSchema.safeParse({ name: "" })
    expect(result.success).toBe(false)
  })

  it("CreateGoalSchema rejects invalid priority", () => {
    const result = CreateGoalSchema.safeParse({ name: "Test", priority: "urgent" })
    expect(result.success).toBe(false)
  })

  it("UpdateGoalSchema accepts partial input", () => {
    const result = UpdateGoalSchema.safeParse({ status: "completed" })
    expect(result.success).toBe(true)
  })

  it("UpdateGoalSchema rejects invalid status", () => {
    const result = UpdateGoalSchema.safeParse({ status: "hacked" })
    expect(result.success).toBe(false)
  })
})

describe("Task schemas", () => {
  it("CreateTaskSchema accepts valid input", () => {
    const result = CreateTaskSchema.safeParse({ title: "Write tests" })
    expect(result.success).toBe(true)
  })

  it("CreateTaskSchema rejects invalid status", () => {
    const result = CreateTaskSchema.safeParse({ title: "Test", status: "done" })
    expect(result.success).toBe(false)
  })

  it("UpdateTaskSchema accepts partial input", () => {
    const result = UpdateTaskSchema.safeParse({ priority: "high" })
    expect(result.success).toBe(true)
  })
})

describe("Enum schemas", () => {
  it("GoalPriority accepts all valid values", () => {
    for (const v of ["high", "medium", "low"]) {
      expect(GoalPriority.safeParse(v).success).toBe(true)
    }
  })

  it("GoalStatus accepts all valid values", () => {
    for (const v of ["active", "paused", "completed", "archived"]) {
      expect(GoalStatus.safeParse(v).success).toBe(true)
    }
  })

  it("TaskPriority rejects invalid values", () => {
    expect(TaskPriority.safeParse("urgent").success).toBe(false)
    expect(TaskPriority.safeParse("").success).toBe(false)
  })
})
```

**Verify**: `npm test -- lib/__tests__/schemas.test.ts` → all pass

### Step 5: Run full suite

```bash
npx tsc --noEmit && npm run build && npm test
```

**Verify**: all exit 0

## Test plan

- Schema tests (step 4): valid input accepted, empty name rejected, invalid enum rejected, partial update accepted
- Existing tests from plans 002 — must still pass
- Manual verification: POST/PATCH with invalid enum should return 400 with `details` field

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` exits 0
- [ ] `npm test` exits 0 with all new schema tests passing
- [ ] `lib/schemas.ts` exists with all entity schemas
- [ ] All PATCH/POST routes in `app/api/*/route.ts` validate input before calling db functions
- [ ] `grep -rn "request.json()" app/api/` → every result is followed by a `validateBody` call (or equivalent)
- [ ] `plans/README.md` status row for 004 updated to DONE

## STOP conditions

- If a route's body shape doesn't match the types in `lib/types.ts` (drift between the type and the actual usage). Report which route and what the actual shape is.
- If installing zod causes a dependency conflict with the existing lockfile.
- If a route handler has complex body parsing logic (nested objects, file uploads) that doesn't fit a simple zod schema.

## Maintenance notes

- When adding new fields to entities, update both `lib/types.ts` and `lib/schemas.ts`.
- The schemas use `.default()` for optional fields, so partial updates work without requiring the client to send every field.
- Consider adding a shared `validateBody` helper in `lib/utils.ts` or `lib/api-utils.ts` to avoid duplicating it in every route file.
- Future: consider using the schemas for DB INSERT parameter ordering (currently manual in `db-*.ts` files).
