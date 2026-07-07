/**
 * Database client — thin fetch wrapper around the API routes.
 *
 * Every function reads/writes PostgreSQL via the server-side `db-*.ts`
 * modules proxied through Next.js route handlers.
 *
 * Components should import from this module instead of `@/lib/storage`
 * to use the permanent database.
 */

import type { Goal, Session, Task, Reflection, WeeklyObjective, Interruption, Phase, RoadmapNode, RoadmapTree } from "@/lib/types"
import { toast } from "sonner"

const BASE = "/api"

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string>,
): Promise<T> {
  let url = `${BASE}${path}`
  if (params) {
    const qs = new URLSearchParams(params).toString()
    if (qs) url += `?${qs}`
  }
  const opts: RequestInit = { method }
  if (body) {
    opts.headers = { "Content-Type": "application/json" }
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(url, opts)
  if (!res.ok) {
    let errorMsg: string
    try {
      const json = await res.json()
      errorMsg = json.error || json.message || res.statusText
    } catch {
      errorMsg = `Request failed (${res.status})`
    }
    toast.error(errorMsg)
    throw new Error(`API ${method} ${path} ${res.status}: ${errorMsg}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ── Sessions ──────────────────────────────────────────────────────────

export async function fetchSessions(): Promise<Session[]> {
  const data = await request<{ sessions: Session[]; total: number }>("GET", "/sessions")
  return data.sessions
}

export async function createSession(input: Omit<Session, "id">): Promise<Session> {
  return request<Session>("POST", "/sessions", input)
}

export async function deleteSession(id: string): Promise<void> {
  await request<void>("DELETE", "/sessions", undefined, { id })
}

export async function fetchSessionsByDate(date: string): Promise<Session[]> {
  const data = await request<{ sessions: Session[] }>("GET", "/sessions", undefined, { date })
  return data.sessions
}

// ── Goals ─────────────────────────────────────────────────────────────

export async function fetchGoals(): Promise<Goal[]> {
  const data = await request<{ goals: Goal[]; total: number }>("GET", "/goals")
  return data.goals
}

export async function createGoal(
  input: Omit<Goal, "id" | "createdAt" | "updatedAt" | "roadmap">,
): Promise<Goal> {
  return request<Goal>("POST", "/goals", input)
}

export async function updateGoal(id: string, patch: Partial<Goal>): Promise<Goal> {
  return request<Goal>("PATCH", `/goals?id=${id}`, patch)
}

export async function deleteGoal(id: string): Promise<void> {
  await request<void>("DELETE", "/goals", undefined, { id })
}

// ── Tasks ─────────────────────────────────────────────────────────────

export async function fetchTasks(date?: string): Promise<Task[]> {
  const data = await request<{ tasks: Task[] }>("GET", "/tasks", undefined, date ? { date } : undefined)
  return data.tasks
}

export async function fetchTasksByObjective(objectiveId: string): Promise<Task[]> {
  const data = await request<{ tasks: Task[] }>("GET", "/tasks", undefined, { objectiveId })
  return data.tasks
}

export async function createTask(input: Omit<Task, "id" | "createdAt">): Promise<Task> {
  return request<Task>("POST", "/tasks", input)
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<void> {
  await request<void>("PATCH", `/tasks?id=${id}`, patch)
}

export async function deleteTask(id: string): Promise<void> {
  await request<void>("DELETE", "/tasks", undefined, { id })
}

// ── Reflections ───────────────────────────────────────────────────────

export async function fetchReflections(date?: string): Promise<Reflection[]> {
  const data = await request<{ reflections: Reflection[] }>("GET", "/reflections", undefined, date ? { date } : undefined)
  return data.reflections
}

export async function saveReflection(
  input: Omit<Reflection, "id" | "createdAt">,
): Promise<Reflection> {
  return request<Reflection>("POST", "/reflections", input)
}

export async function deleteReflection(date: string): Promise<void> {
  await request<void>("DELETE", "/reflections", undefined, { date })
}

// ── Weekly Objectives ─────────────────────────────────────────────────

export async function fetchWeeklyObjectives(weekStart?: string): Promise<WeeklyObjective[]> {
  const data = await request<{ objectives: WeeklyObjective[] }>(
    "GET",
    "/weekly-objectives",
    undefined,
    weekStart ? { weekStart } : undefined,
  )
  return data.objectives
}

export async function createWeeklyObjective(
  input: Omit<WeeklyObjective, "id" | "createdAt">,
): Promise<WeeklyObjective> {
  return request<WeeklyObjective>("POST", "/weekly-objectives", input)
}

export async function updateWeeklyObjective(id: string, patch: Partial<WeeklyObjective>): Promise<void> {
  await request<void>("PATCH", `/weekly-objectives?id=${id}`, patch)
}

export async function deleteWeeklyObjective(id: string): Promise<void> {
  await request<void>("DELETE", "/weekly-objectives", undefined, { id })
}

// ── Settings ──────────────────────────────────────────────────────────

export async function fetchSetting(key: string): Promise<string | null> {
  return request<string | null>("GET", "/settings", undefined, { key })
}

export async function setSetting(key: string, value: string): Promise<void> {
  await request<void>("POST", "/settings", { key, value })
}

// ── Interruptions ─────────────────────────────────────────────────────

export async function createInterruption(input: Omit<Interruption, "id">): Promise<Interruption> {
  return request<Interruption>("POST", "/interruptions", input)
}

export async function fetchInterruptions(dateFrom?: string, dateTo?: string): Promise<Interruption[]> {
  const params: Record<string, string> = {}
  if (dateFrom) params.dateFrom = dateFrom
  if (dateTo) params.dateTo = dateTo
  const data = await request<{ interruptions: Interruption[] }>("GET", "/interruptions", undefined, Object.keys(params).length > 0 ? params : undefined)
  return data.interruptions
}

// ── Roadmaps ──────────────────────────────────────────────────────────

export async function fetchRoadmapPhases(goalId: string): Promise<Phase[]> {
  const data = await request<{ phases: Phase[] }>("GET", "/roadmaps", undefined, { goalId })
  return data.phases
}

export async function saveRoadmapPhases(goalId: string, phases: Phase[]): Promise<void> {
  await request<void>("POST", "/roadmaps", { goalId, phases })
}

export async function fetchRoadmapTree(goalId: string): Promise<RoadmapTree> {
  const data = await request<{ tree: RoadmapTree }>("GET", "/roadmaps", undefined, { goalId, tree: "true" })
  return data.tree
}

export async function addRoadmapNode(goalId: string, node: Omit<RoadmapNode, "id" | "createdAt">): Promise<RoadmapNode> {
  return request<RoadmapNode>("POST", "/roadmaps", { goalId, node })
}

export async function updateRoadmapNodeDb(nodeId: string, updates: Partial<RoadmapNode>): Promise<RoadmapNode> {
  return request<RoadmapNode>("PATCH", `/roadmaps?nodeId=${nodeId}`, updates)
}

export async function deleteRoadmapNodeDb(nodeId: string): Promise<void> {
  await request<void>("DELETE", "/roadmaps", undefined, { nodeId })
}
