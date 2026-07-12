/** Generic identifier type – always a UUID string. */
export type ID = string

/** Priority tier used by goals and tasks. */
export type GoalPriority = "high" | "medium" | "low"
/** Lifecycle status of a goal. */
export type GoalStatus = "active" | "paused" | "completed" | "archived"
/** Node type in a hierarchical roadmap tree. */
export type NodeType = "phase" | "objective" | "task"
/** Completion status of a roadmap node. */
export type NodeStatus = "pending" | "in-progress" | "completed"
/** Priority tier for tasks. */
export type TaskPriority = "high" | "medium" | "low"
/** Lifecycle status of a task. */
export type TaskStatus = "pending" | "in-progress" | "completed"
/** Category of an interruption that occurred during a focus session. */
export type InterruptionType = "distraction" | "external" | "thought" | "break" | "admin"
/** Severity level of an interruption. */
export type InterruptionSeverity = "low" | "medium" | "high"

/** Status of a habit — active (being tracked) or quit (stopped). */
export type HabitStatus = "active" | "quit"

/**
 * A high-level goal that the user wants to achieve.
 *
 * Goals own a `roadmap` (legacy flat list) and are also linked from
 * {@link WeeklyObjective}s and {@link Task}s via `goalId`.
 */
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

/**
 * A single node in a hierarchical roadmap tree.
 *
 * Nodes form a parent→children tree stored as a flat `Record<ID, RoadmapNode>`.
 * A node can be a phase, objective, or task.
 */
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

/** @deprecated Legacy flat roadmap phase – prefer the hierarchical {@link RoadmapTree}. */
export interface Phase {
  id: ID
  name: string
  done: boolean
}

export type RoadmapMap = Record<ID, Phase[]>

/**
 * A concrete objective pinned to a specific ISO week.
 *
 * Each objective belongs to a {@link Goal} and can spawn multiple
 * {@link Task}s via `dailyTaskIds`.
 */
export interface WeeklyObjective {
  id: ID
  goalId: ID
  milestoneId: ID | null // New: links to a RoadmapNode
  title: string
  description: string
  priority: number
  status: TaskStatus
  weekStart: string
  weekEnd: string
  dailyTaskIds: ID[]
  createdAt: string
}

/** A single checkbox item inside a task checklist. */
export interface ChecklistItem {
  id: ID
  text: string
  done: boolean
}

/**
 * A schedulable unit of work attached to a specific calendar date.
 *
 * Tasks optionally belong to a {@link WeeklyObjective} (via `objectiveId`)
 * and can accumulate pomodoro counts and checklist items.
 */
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

/**
 * A completed focus session – the primary unit of time tracking.
 *
 * Sessions reference a {@link Task} optionally, and store their own
 * `duration` in seconds plus `startedAt`/`endedAt` timestamps.
 */
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

/** An interruption recorded during a focus session. */
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

/**
 * A daily reflection / journal entry.
 *
 * One reflection per calendar date; creating a new one for the same
 * date overwrites the previous entry.
 */
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

/**
 * A habit the user wants to track daily.
 *
 * Each habit belongs to a user and can have many checkin records
 * (one per day). A habit can be active or quit.
 */
export interface Habit {
  id: ID
  userId: string
  name: string
  status: HabitStatus
  createdAt: string
}

/**
 * Allowed values for Goal priority levels.
 */
export const GOAL_PRIORITIES: GoalPriority[] = ["high", "medium", "low"]

/**
 * Allowed values for Goal lifecycle statuses.
 */
export const GOAL_STATUSES: GoalStatus[] = ["active", "paused", "completed", "archived"]

/**
 * Allowed values for interruption categories during focus sessions.
 */
export const INTERRUPTION_TYPES: InterruptionType[] = ["distraction", "external", "thought", "break", "admin"]

/**
 * Allowed values for interruption severity levels.
 */
export const INTERRUPTION_SEVERITIES: InterruptionSeverity[] = ["low", "medium", "high"]

/**
 * Allowed values for Task priority levels.
 */
export const TASK_PRIORITIES: TaskPriority[] = ["high", "medium", "low"]

/**
 * Allowed values for Task lifecycle statuses.
 */
export const TASK_STATUSES: TaskStatus[] = ["pending", "in-progress", "completed"]

/**
 * Allowed values for Habit statuses.
 */
export const HABIT_STATUSES: HabitStatus[] = ["active", "quit"]

// Utility functions (generateId, formatHM, todayKey, etc.) have been moved to @/lib/utils.ts
