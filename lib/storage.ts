/**
 * localStorage persistence layer for the Compass time-tracking app.
 *
 * All public functions in this module are thin wrappers around
 * `safeGet` / `safeSet` which handle JSON serialisation and
 * server-side rendering guards.
 *
 * **Storage keys** are namespaced under the `compass_` prefix to
 * avoid collisions with other libraries.
 */

import type {
  Goal, Session, Interruption, Reflection, WeeklyObjective, Task, Phase, RoadmapMap, RoadmapNode, RoadmapTree,
} from "@/lib/types"
import { generateId, weekStartKey } from "@/lib/utils"

/** localStorage key constants – centralised for easy migration / cleanup. */
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
} as const

/** Read and parse a JSON value from `localStorage`, returning `fallback` on any failure. */
function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** Serialize `value` as JSON and write it to `localStorage`. No-op during SSR. */
function safeSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error(`Failed to write ${key}:`, e)
  }
}

/** Broadcast a synthetic `"storage"` event so other hooks re-read their state. */
export function dispatchStorageEvent(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event("storage"))
}

/**
 * Subscribe to cross-tab / cross-component `"storage"` events.
 *
 * @param handler – callback invoked on every storage change
 * @returns an unsubscribe function (call in `useEffect` cleanup)
 */
export function useStorageSync(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  window.addEventListener("storage", handler)
  return () => window.removeEventListener("storage", handler)
}

// ── Goals ──────────────────────────────────────────────────────────────────────

/** Return all goals from storage. */
export function getGoals(): Goal[] {
  return safeGet<Goal[]>(KEYS.GOALS, [])
}

/** Overwrite the entire goals list. */
export function setGoals(goals: Goal[]): void {
  safeSet(KEYS.GOALS, goals)
}

/** Create a new goal, persist it, and return the full object. */
export function addGoal(input: Omit<Goal, "id" | "roadmap" | "createdAt" | "updatedAt">): Goal {
  const now = new Date().toISOString()
  const goal: Goal = { ...input, id: generateId(), roadmap: [], createdAt: now, updatedAt: now }
  const all = getGoals()
  all.push(goal)
  setGoals(all)
  return goal
}

/** Patch an existing goal by `id`. Returns the updated goal or `null` if not found. */
export function updateGoal(id: string, patch: Partial<Goal>): Goal | null {
  const all = getGoals()
  const idx = all.findIndex((g) => g.id === id)
  if (idx === -1) return null
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() }
  setGoals(all)
  return all[idx]
}

/** Remove a goal and its associated roadmap data. */
export function deleteGoal(id: string): void {
  const all = getGoals()
  setGoals(all.filter((g) => g.id !== id))
  deleteRoadmapForGoal(id)
}

// ── Sessions ───────────────────────────────────────────────────────────────────

/** Return all focus sessions from storage. */
export function getSessions(): Session[] {
  return safeGet<Session[]>(KEYS.SESSIONS, [])
}

export function setSessions(sessions: Session[]): void {
  safeSet(KEYS.SESSIONS, sessions)
}

/** Persist a new session and return it with its generated `id`. */
export function addSession(input: Omit<Session, "id">): Session {
  const session: Session = { ...input, id: generateId() }
  const all = getSessions()
  all.push(session)
  setSessions(all)
  return session
}

/** Remove a single session by `id`. */
export function deleteSession(id: string): void {
  const all = getSessions()
  setSessions(all.filter((s) => s.id !== id))
}

/** Remove all sessions (used by the data reset flow). */
export function clearSessions(): void {
  setSessions([])
}

// ── Interruptions ──────────────────────────────────────────────────────────────

/** Return all recorded interruptions. */
export function getInterruptions(): Interruption[] {
  return safeGet<Interruption[]>(KEYS.INTERRUPTIONS, [])
}

export function setInterruptions(interruptions: Interruption[]): void {
  safeSet(KEYS.INTERRUPTIONS, interruptions)
}

/** Persist a new interruption event. */
export function addInterruption(input: Omit<Interruption, "id">): Interruption {
  const item: Interruption = { ...input, id: generateId() }
  const all = getInterruptions()
  all.push(item)
  setInterruptions(all)
  return item
}

// ── Reflections ────────────────────────────────────────────────────────────────

/** Return all daily reflections. */
export function getReflections(): Reflection[] {
  return safeGet<Reflection[]>(KEYS.REFLECTIONS, [])
}

export function setReflections(reflections: Reflection[]): void {
  safeSet(KEYS.REFLECTIONS, reflections)
}

/** Find the reflection entry for a specific date, if any. */
export function getReflectionByDate(date: string): Reflection | undefined {
  return getReflections().find((r) => r.date === date)
}

/** Create or update a reflection for the given date (upsert). */
export function saveReflection(input: Omit<Reflection, "id" | "createdAt">): Reflection {
  const existing = getReflectionByDate(input.date)
  const now = new Date().toISOString()
  if (existing) {
    const updated = { ...existing, ...input, createdAt: existing.createdAt }
    setReflections(getReflections().map((r) => (r.date === input.date ? updated : r)))
    return updated
  }
  const ref: Reflection = { ...input, id: generateId(), createdAt: now }
  const all = getReflections()
  all.push(ref)
  setReflections(all)
  return ref
}

// ── Weekly Objectives ──────────────────────────────────────────────────────────

/** Return all weekly objectives. */
export function getWeeklyObjectives(): WeeklyObjective[] {
  return safeGet<WeeklyObjective[]>(KEYS.WEEKLY_OBJECTIVES, [])
}

export function setWeeklyObjectives(objs: WeeklyObjective[]): void {
  safeSet(KEYS.WEEKLY_OBJECTIVES, objs)
}

/** Return objectives scoped to the given ISO week (defaults to current week). */
export function getObjectivesForWeek(weekStart?: string): WeeklyObjective[] {
  const ws = weekStart ?? weekStartKey()
  return getWeeklyObjectives().filter((o) => o.weekStart === ws)
}

/** Create a new weekly objective. */
export function saveWeeklyObjective(input: Omit<WeeklyObjective, "id" | "createdAt">): WeeklyObjective {
  const obj: WeeklyObjective = { ...input, id: generateId(), createdAt: new Date().toISOString() }
  const all = getWeeklyObjectives()
  all.push(obj)
  setWeeklyObjectives(all)
  return obj
}

export function updateWeeklyObjective(id: string, patch: Partial<WeeklyObjective>): void {
  const all = getWeeklyObjectives()
  setWeeklyObjectives(all.map((o) => (o.id === id ? { ...o, ...patch } : o)))
}

/** Delete an objective and any tasks linked to it. */
export function deleteWeeklyObjective(id: string): void {
  const all = getWeeklyObjectives()
  const obj = all.find(o => o.id === id)
  setWeeklyObjectives(all.filter((o) => o.id !== id))
  if (obj) {
    const tasks = getDailyTasks()
    setDailyTasks(tasks.filter(t => t.objectiveId !== id))
  }
}

/** Return objectives for a specific goal within a given week. */
export function getObjectivesForGoal(goalId: string, weekStart?: string): WeeklyObjective[] {
  return getObjectivesForWeek(weekStart).filter(o => o.goalId === goalId)
}

// ── Daily Tasks ────────────────────────────────────────────────────────────────

/** Return all daily tasks. */
export function getDailyTasks(): Task[] {
  return safeGet<Task[]>(KEYS.DAILY_TASKS, [])
}

export function setDailyTasks(tasks: Task[]): void {
  safeSet(KEYS.DAILY_TASKS, tasks)
}

/** Return tasks scheduled for a specific calendar date. */
export function getTasksForDate(date: string): Task[] {
  return getDailyTasks().filter((t) => t.scheduledDate === date)
}

/** Create a new daily task. */
export function saveTask(input: Omit<Task, "id" | "createdAt">): Task {
  const task: Task = { ...input, id: generateId(), createdAt: new Date().toISOString() }
  const all = getDailyTasks()
  all.push(task)
  setDailyTasks(all)
  return task
}

export function updateTask(id: string, patch: Partial<Task>): void {
  const all = getDailyTasks()
  setDailyTasks(all.map((t) => (t.id === id ? { ...t, ...patch } : t)))
}

export function deleteTask(id: string): void {
  const all = getDailyTasks()
  setDailyTasks(all.filter((t) => t.id !== id))
}

/** Return all tasks belonging to a specific weekly objective. */
export function getTasksForObjective(objectiveId: string): Task[] {
  return getDailyTasks().filter((t) => t.objectiveId === objectiveId)
}

/** Return all tasks linked to objectives in the given week. */
export function getTasksForWeek(weekStart?: string): Task[] {
  const ws = weekStart ?? weekStartKey()
  const objectives = getObjectivesForWeek(ws)
  const objIds = new Set(objectives.map(o => o.id))
  return getDailyTasks().filter(t => t.objectiveId && objIds.has(t.objectiveId))
}

// ── Carryover (kept for backward compat) ───────────────────────────────────────

/** Return pending carryover task names (legacy). */
export function getCarryover(): string[] {
  return safeGet<string[]>(KEYS.PENDING_CARRYOVER, [])
}

export function setCarryover(tasks: string[]): void {
  safeSet(KEYS.PENDING_CARRYOVER, tasks)
}

// ── Roadmaps (legacy flat) ─────────────────────────────────────────────────────

/** Return the legacy flat roadmap map. */
export function getRoadmaps(): RoadmapMap {
  return safeGet<RoadmapMap>(KEYS.ROADMAPS, {})
}

export function setRoadmaps(roadmaps: RoadmapMap): void {
  safeSet(KEYS.ROADMAPS, roadmaps)
}

export function getRoadmapForGoal(goalId: string): Phase[] {
  return getRoadmaps()[goalId] ?? []
}

export function saveRoadmapForGoal(goalId: string, phases: Phase[]): void {
  const all = getRoadmaps()
  all[goalId] = phases
  setRoadmaps(all)
}

export function deleteRoadmapForGoal(goalId: string): void {
  const all = getRoadmaps()
  delete all[goalId]
  setRoadmaps(all)
}

export function cleanOrphanedRoadmaps(goalIds: string[]): void {
  const all = getRoadmaps()
  const validIds = new Set(goalIds)
  let changed = false
  for (const key of Object.keys(all)) {
    if (!validIds.has(key)) {
      delete all[key]
      changed = true
    }
  }
  if (changed) setRoadmaps(all)
}

// ── Roadmap Trees (hierarchical) ───────────────────────────────────────────────

/** Return all hierarchical roadmap trees. */
export function getRoadmapTrees(): Record<string, RoadmapTree> {
  return safeGet<Record<string, RoadmapTree>>(KEYS.ROADMAP_TREES, {})
}

export function setRoadmapTrees(trees: Record<string, RoadmapTree>): void {
  safeSet(KEYS.ROADMAP_TREES, trees)
}

export function getRoadmapTree(goalId: string): RoadmapTree {
  return getRoadmapTrees()[goalId] ?? {}
}

export function saveRoadmapTree(goalId: string, tree: RoadmapTree): void {
  const all = getRoadmapTrees()
  all[goalId] = tree
  setRoadmapTrees(all)
}

export function deleteRoadmapTree(goalId: string): void {
  const all = getRoadmapTrees()
  delete all[goalId]
  setRoadmapTrees(all)
}

/** Add a node to a goal's roadmap tree, linking it to its parent. */
export function addRoadmapNode(goalId: string, node: Omit<RoadmapNode, "id" | "createdAt">): RoadmapNode {
  const tree = getRoadmapTree(goalId)
  const full: RoadmapNode = { ...node, id: generateId(), createdAt: new Date().toISOString() }
  tree[full.id] = full
  if (full.parentId && tree[full.parentId]) {
    tree[full.parentId] = {
      ...tree[full.parentId],
      children: [...tree[full.parentId].children, full.id],
    }
  }
  saveRoadmapTree(goalId, tree)
  return full
}

export function updateRoadmapNode(goalId: string, nodeId: string, patch: Partial<RoadmapNode>): void {
  const tree = getRoadmapTree(goalId)
  if (!tree[nodeId]) return
  tree[nodeId] = { ...tree[nodeId], ...patch }
  saveRoadmapTree(goalId, tree)
}

/** Recursively delete a node and all its descendants from the tree. */
export function deleteRoadmapNode(goalId: string, nodeId: string): void {
  const tree = getRoadmapTree(goalId)
  const node = tree[nodeId]
  if (!node) return

  if (node.parentId && tree[node.parentId]) {
    tree[node.parentId] = {
      ...tree[node.parentId],
      children: tree[node.parentId].children.filter(id => id !== nodeId),
    }
  }

  function removeRecursive(id: string) {
    const n = tree[id]
    if (!n) return
    for (const childId of n.children) removeRecursive(childId)
    delete tree[id]
  }
  removeRecursive(nodeId)

  saveRoadmapTree(goalId, tree)
}

/** Migrate legacy flat phases into the hierarchical tree format (idempotent). */
export function migratePhasesToTree(goalId: string): void {
  const phases = getRoadmapForGoal(goalId)
  if (phases.length === 0) return
  const existingTree = getRoadmapTree(goalId)
  if (Object.keys(existingTree).length > 0) return

  const tree: RoadmapTree = {}
  const rootNode: RoadmapNode = {
    id: generateId(),
    type: "phase",
    name: "Root",
    description: "",
    goalId,
    parentId: null,
    children: [],
    status: "completed",
    order: 0,
    createdAt: new Date().toISOString(),
  }
  tree[rootNode.id] = rootNode

  for (let i = 0; i < phases.length; i++) {
    const p = phases[i]
    const node: RoadmapNode = {
      id: p.id,
      type: "phase",
      name: p.name,
      description: "",
      goalId,
      parentId: rootNode.id,
      children: [],
      status: p.done ? "completed" : "pending",
      order: i,
      createdAt: new Date().toISOString(),
    }
    tree[node.id] = node
    rootNode.children.push(node.id)
  }

  tree[rootNode.id] = rootNode
  saveRoadmapTree(goalId, tree)
}

// ── Onboarding ─────────────────────────────────────────────────────────────────

/** Check whether the user has completed the onboarding flow. */
export function isOnboardingDone(): boolean {
  return safeGet<string>(KEYS.ONBOARDING_DONE, "false") === "true"
}

/** Mark the onboarding flow as completed. */
export function setOnboardingDone(): void {
  safeSet(KEYS.ONBOARDING_DONE, "true")
}
