/**
 * Data migration layer for the Compass application.
 *
 * Handles upgrading data shapes from older versions of the app stored
 * in localStorage. Each `migrate*` function is idempotent – it checks
 * whether migration has already been performed before writing.
 *
 * Call {@link runMigrations} once at app boot (in `providers.tsx`).
 */

import type {
  Goal, Session, Interruption, Reflection,
} from "@/lib/types"
import { generateId } from "@/lib/utils"
import { getGoals, setGoals, getSessions, setSessions, getInterruptions, setInterruptions } from "@/lib/storage"

/** localStorage key used to gate the migration so it only runs once. */
const MIGRATION_KEY = "compass_migration_v1_done"

// ── Old type definitions (from prior codebase) ──────────────────────────────

/** Shape of a goal in the v0 data model. */
interface OldGoal {
  id: number
  name: string
  tag: string
  targetHours: number
  deadline: string
  weeklyTarget: number
  color: string
  createdAt: number
}

/** Shape of a session in the v0 data model. */
interface OldSession {
  id: number
  taskName: string
  tags: string[]
  duration: number
  durationFormatted: string
  startedAt: number
  endedAt: number
  date: string
}

/** Shape of an interruption in the v0 data model. */
interface OldInterruption {
  id: number
  type: string
  note: string
  timestamp: number
  duration?: number
}

/** Shape of a daily task in the v0 data model. */
interface OldDailyTask {
  id: number
  text: string
  done: boolean
  fromWeekly?: boolean
  weeklyGoalId?: number
  weeklyTaskId?: number
}

/** Shape of a morning plan entry in the v0 data model. */
interface OldMorningPlan {
  oneThing: string
  tasks: OldDailyTask[]
  interruptions: string
  mood: number
  energy: number
}

/** Shape of an evening reflection entry in the v0 data model. */
interface OldEveningReflection {
  accomplishments: string
  distractions: string
  rating: number
  differently: string
  gratitude: [string, string, string]
  tomorrowFocus: string
  mood: number
}

/** Shape of a combined daily record (morning + evening) in the v0 data model. */
interface OldDailyRecord {
  date: string
  morning?: OldMorningPlan
  evening?: OldEveningReflection
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Safely parse JSON, returning `fallback` on null input or parse errors. */
function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

// ── Migrations ──────────────────────────────────────────────────────────────

/** Migrate goals from v0 (numeric ids, no description) to v1 schema. */
function migrateGoals(): boolean {
  const raw = localStorage.getItem("compass_goals")
  if (!raw) return false
  const existing = getGoals()
  // Fix: Check if array is not empty AND first element exists before accessing properties
  if (existing.length > 0 && existing[0] && "description" in existing[0]) return false

  const old: OldGoal[] = safeParse<OldGoal[]>(raw, [])
  if (old.length === 0) return false

  const migrated: Goal[] = old.map((o) => ({
    id: String(o.id),
    name: o.name,
    description: "",
    category: "",
    tag: o.tag,
    targetHours: o.targetHours,
    targetDate: o.deadline,
    weeklyTarget: o.weeklyTarget,
    priority: "medium" as const,
    status: "active" as const,
    color: o.color,
    roadmap: [],
    createdAt: new Date(o.createdAt).toISOString(),
    updatedAt: new Date(o.createdAt).toISOString(),
  }))

  setGoals(migrated)
  return true
}

/** Migrate sessions from v0 (numeric timestamps, no taskId) to v1 schema. */
function migrateSessions(): boolean {
  const raw = localStorage.getItem("compass_sessions")
  if (!raw) return false
  const existing = getSessions()
  if (existing.length > 0 && "taskId" in existing[0]) return false

  const old: OldSession[] = safeParse<OldSession[]>(raw, [])
  if (old.length === 0) return false

  const migrated: Session[] = old.map((o) => {
    const started = new Date(o.startedAt)
    const ended = new Date(o.endedAt)
    return {
      id: String(o.id),
      taskId: null,
      taskName: o.taskName,
      tags: o.tags,
      duration: o.duration,
      durationFormatted: o.durationFormatted,
      startedAt: started.toISOString(),
      endedAt: ended.toISOString(),
      date: o.date,
      pomodoroCount: 0,
      productivityRating: null,
    }
  })

  setSessions(migrated)
  return true
}

/** Migrate interruptions from v0 (no severity/cause) to v1 schema. */
function migrateInterruptions(): boolean {
  const raw = localStorage.getItem("compass_interruptions")
  if (!raw) return false
  const existing = getInterruptions()
  if (existing.length > 0 && "severity" in existing[0]) return false

  const old: OldInterruption[] = safeParse<OldInterruption[]>(raw, [])
  if (old.length === 0) return false

  const migrated: Interruption[] = old.map((o) => ({
    id: String(o.id),
    sessionId: null,
    type: o.type as Interruption["type"],
    cause: "",
    duration: o.duration ?? 0,
    note: o.note,
    timestamp: new Date(o.timestamp).toISOString(),
    recoveryTime: 0,
    severity: "medium" as const,
  }))

  setInterruptions(migrated)
  return true
}

/** Migrate old daily records (morning/evening) into the v1 reflections format. */
function migrateReflections(): boolean {
  const raw = localStorage.getItem("compass_daily_records")
  if (!raw) return false
  const migratedKey = "compass_reflections"
  if (localStorage.getItem(migratedKey)) return false

  const old: OldDailyRecord[] = safeParse<OldDailyRecord[]>(raw, [])
  if (old.length === 0) return false

  const reflections: Reflection[] = []
  for (const r of old) {
    if (!r.evening && !r.morning) continue
    const ref: Reflection = {
      id: generateId(),
      date: r.date,
      mood: r.evening?.mood ?? r.morning?.mood ?? 3,
      accomplishments: r.evening?.accomplishments ? [r.evening.accomplishments] : [],
      challenges: r.evening?.distractions ? [r.evening.distractions] : [],
      improvements: r.evening?.differently ? [r.evening.differently] : [],
      rating: r.evening?.rating ?? 3,
      wins: [],
      tomorrowPlan: r.evening?.tomorrowFocus ?? "",
      notes: "",
      createdAt: new Date().toISOString(),
    }
    reflections.push(ref)
  }

  if (reflections.length > 0) {
    localStorage.setItem(migratedKey, JSON.stringify(reflections))
  }
  return reflections.length > 0
}

// ── Main entry ──────────────────────────────────────────────────────────────

/**
 * Run all pending data migrations.
 *
 * This function is safe to call on every app boot – it short-circuits
 * immediately if the migration flag is already set in localStorage.
 * On success it sets the flag and dispatches a `"storage"` event so
 * all hooks re-read their data.
 * 
 * ⚠️ IMPORTANT: This function ONLY runs on the client side (browser).
 * It will silently return if called during server-side rendering.
 */
export function runMigrations(): void {
  // Guard: Only run on client side where localStorage exists
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    console.warn("Migrations can only run in the browser (localStorage required)");
    return;
  }

  if (localStorage.getItem(MIGRATION_KEY) === "true") return

  let changed = false
  try {
    changed = migrateGoals() || changed
    changed = migrateSessions() || changed
    changed = migrateInterruptions() || changed
    changed = migrateReflections() || changed

    if (changed) {
      localStorage.setItem(MIGRATION_KEY, "true")
      window.dispatchEvent(new Event("storage"))
      console.log("✓ Data migrations completed successfully");
    }
  } catch (e) {
    console.error("Migration failed:", e)
    throw new Error(e instanceof Error ? e.message : "Migration failed with unknown error");
  }
}
