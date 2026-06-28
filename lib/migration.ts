import type {
  Goal, Session, Interruption, Reflection,
} from "@/lib/types"
import { generateId } from "@/lib/types"
import { getGoals, setGoals, getSessions, setSessions, getInterruptions, setInterruptions } from "@/lib/storage"

const MIGRATION_KEY = "compass_migration_v1_done"

// ── Old type definitions (from prior codebase) ──

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

interface OldInterruption {
  id: number
  type: string
  note: string
  timestamp: number
  duration?: number
}

interface OldDailyTask {
  id: number
  text: string
  done: boolean
  fromWeekly?: boolean
  weeklyGoalId?: number
  weeklyTaskId?: number
}

interface OldMorningPlan {
  oneThing: string
  tasks: OldDailyTask[]
  interruptions: string
  mood: number
  energy: number
}

interface OldEveningReflection {
  accomplishments: string
  distractions: string
  rating: number
  differently: string
  gratitude: [string, string, string]
  tomorrowFocus: string
  mood: number
}

interface OldDailyRecord {
  date: string
  morning?: OldMorningPlan
  evening?: OldEveningReflection
}

// ── Helpers ──

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

// ── Migrations ──

function migrateGoals(): boolean {
  const raw = localStorage.getItem("compass_goals")
  if (!raw) return false
  const existing = getGoals()
  if (existing.length > 0 && "description" in existing[0]) return false

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

// ── Main entry ──

export function runMigrations(): void {
  if (localStorage.getItem(MIGRATION_KEY) === "true") return

  let changed = false
  try {
    changed = migrateGoals() || changed
    changed = migrateSessions() || changed
    changed = migrateInterruptions() || changed
    changed = migrateReflections() || changed

    if (changed) {
      localStorage.setItem(MIGRATION_KEY, "true")
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"))
      }
    }
  } catch (e) {
    console.error("Migration failed:", e)
  }
}
