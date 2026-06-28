export type ID = string

export type GoalPriority = "high" | "medium" | "low"
export type GoalStatus = "active" | "paused" | "completed" | "archived"
export type NodeType = "phase" | "objective" | "task"
export type NodeStatus = "pending" | "in-progress" | "completed"
export type TaskPriority = "high" | "medium" | "low"
export type TaskStatus = "pending" | "in-progress" | "completed"
export type InterruptionType = "distraction" | "external" | "thought" | "break" | "admin"
export type InterruptionSeverity = "low" | "medium" | "high"

export interface Goal {
  id: ID
  name: string
  description: string
  category: string
  tag: string
  targetHours: number
  targetDate: string
  weeklyTarget: number
  priority: GoalPriority
  status: GoalStatus
  color: string
  roadmap: RoadmapNode[]
  createdAt: string
  updatedAt: string
}

export interface RoadmapNode {
  id: ID
  type: NodeType
  name: string
  description: string
  goalId: ID
  parentId: ID | null
  children: ID[]
  status: NodeStatus
  order: number
  createdAt: string
}

export type RoadmapTree = Record<ID, RoadmapNode>

export interface Phase {
  id: ID
  name: string
  done: boolean
}

export type RoadmapMap = Record<ID, Phase[]>

export interface WeeklyObjective {
  id: ID
  goalId: ID
  title: string
  description: string
  priority: number
  status: TaskStatus
  weekStart: string
  weekEnd: string
  dailyTaskIds: ID[]
  createdAt: string
}

export interface ChecklistItem {
  id: ID
  text: string
  done: boolean
}

export interface Task {
  id: ID
  objectiveId: ID | null
  title: string
  description: string
  estimatedTime: number
  priority: TaskPriority
  status: TaskStatus
  scheduledDate: string
  scheduledTime: string
  tags: string[]
  checklist: ChecklistItem[]
  sessionId: ID | null
  pomodoroCount: number
  createdAt: string
}

export interface Session {
  id: ID
  taskId: ID | null
  taskName: string
  tags: string[]
  duration: number
  durationFormatted: string
  startedAt: string
  endedAt: string
  date: string
  pomodoroCount: number
  productivityRating: number | null
}

export interface Interruption {
  id: ID
  sessionId: ID | null
  type: InterruptionType
  cause: string
  duration: number
  note: string
  timestamp: string
  recoveryTime: number
  severity: InterruptionSeverity
}

export interface Reflection {
  id: ID
  date: string
  mood: number
  accomplishments: string[]
  challenges: string[]
  improvements: string[]
  rating: number
  wins: string[]
  tomorrowPlan: string
  notes: string
  createdAt: string
}

export const GOAL_PRIORITIES: GoalPriority[] = ["high", "medium", "low"]
export const GOAL_STATUSES: GoalStatus[] = ["active", "paused", "completed", "archived"]
export const INTERRUPTION_TYPES: InterruptionType[] = ["distraction", "external", "thought", "break", "admin"]
export const INTERRUPTION_SEVERITIES: InterruptionSeverity[] = ["low", "medium", "high"]
export const TASK_PRIORITIES: TaskPriority[] = ["high", "medium", "low"]
export const TASK_STATUSES: TaskStatus[] = ["pending", "in-progress", "completed"]

export function generateId(): ID {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

export function weekStartKey(date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().slice(0, 10)
}

export function weekEndKey(date = new Date()): string {
  const start = new Date(weekStartKey(date))
  start.setDate(start.getDate() + 6)
  return start.toISOString().slice(0, 10)
}

export function weekLabel(date = new Date()): string {
  const start = new Date(weekStartKey(date))
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export function formatHM(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.round((totalSeconds % 3600) / 60)
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export function secondsToHours(secs: number): number {
  return Math.round((secs / 3600) * 10) / 10
}
