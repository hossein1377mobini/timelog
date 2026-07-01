/**
 * Server-side storage layer for the Compass time-tracking app.
 * 
 * This module provides async wrapper functions that call database modules.
 * These functions should only be used in server components, API routes, or server actions.
 * 
 * For client components, use the synchronous functions from lib/storage.ts which
 * still use localStorage for backward compatibility.
 */

import type {
  Goal, Session, Interruption, Reflection, WeeklyObjective, Task, Phase, RoadmapMap, RoadmapNode, RoadmapTree, ChecklistItem
} from "@/lib/types"
import { weekStartKey } from "@/lib/utils"

// ── Settings (Database Async) ──────────────────────────────────────────────

import { getSetting, setSetting } from "@/lib/db-settings"

const KEYS = {
  ONBOARDING_DONE: "compass_onboarding_done",
} as const

/** Check whether the user has completed the onboarding flow (async, database-backed). */
export async function isOnboardingDoneAsync(): Promise<boolean> {
  const value = await getSetting(KEYS.ONBOARDING_DONE)
  return value === "true"
}

/** Mark the onboarding flow as completed (async, database-backed). */
export async function setOnboardingDoneAsync(): Promise<void> {
  await setSetting(KEYS.ONBOARDING_DONE, "true")
}

// ── Sessions (Database) ────────────────────────────────────────────────────

import {
  createSession as dbCreateSession,
  getAllSessions as dbGetAllSessions,
  getSessionById as dbGetSessionById,
  getSessionsByDate as dbGetSessionsByDate,
  getSessionsByDateRange as dbGetSessionsByDateRange,
  deleteSession as dbDeleteSession,
  deleteAllSessions as dbDeleteAllSessions,
} from "@/lib/db-sessions"

/** Return all focus sessions from database (async). */
export async function getSessionsAsync(): Promise<Session[]> {
  return await dbGetAllSessions()
}

/** Persist a new session to database and return it with its generated ID (async). */
export async function addSessionAsync(input: Omit<Session, "id">): Promise<Session> {
  return await dbCreateSession(input)
}

/** Remove a single session by ID from database (async). */
export async function deleteSessionAsync(id: string): Promise<void> {
  await dbDeleteSession(id)
}

/** Remove all sessions from database (async). */
export async function clearSessionsAsync(): Promise<void> {
  await dbDeleteAllSessions()
}

/** Get sessions for a specific date from database (async). */
export async function getSessionsByDateAsync(date: string): Promise<Session[]> {
  return await dbGetSessionsByDate(date)
}

/** Get sessions within a date range from database (async). */
export async function getSessionsByDateRangeAsync(startDate: string, endDate: string): Promise<Session[]> {
  return await dbGetSessionsByDateRange(startDate, endDate)
}

// ── Interruptions (Database) ───────────────────────────────────────────────

import {
  createInterruption as dbCreateInterruption,
  getAllInterruptions as dbGetAllInterruptions,
  getInterruptionsBySession as dbGetInterruptionsBySession,
  deleteInterruption as dbDeleteInterruption,
  deleteAllInterruptions as dbDeleteAllInterruptions,
} from "@/lib/db-interruptions"

/** Return all interruptions from database (async). */
export async function getInterruptionsAsync(): Promise<Interruption[]> {
  return await dbGetAllInterruptions()
}

/** Persist a new interruption to database and return it with its generated ID (async). */
export async function addInterruptionAsync(input: Omit<Interruption, "id">): Promise<Interruption> {
  return await dbCreateInterruption(input)
}

/** Get interruptions for a specific session from database (async). */
export async function getInterruptionsBySessionAsync(sessionId: string): Promise<Interruption[]> {
  return await dbGetInterruptionsBySession(sessionId)
}

// ── Goals (Database Async) ─────────────────────────────────────────────────

import {
  createGoal as dbCreateGoal,
  getGoalById as dbGetGoalById,
  getAllGoals as dbGetAllGoals,
  updateGoal as dbUpdateGoal,
  deleteGoal as dbDeleteGoal,
  getGoalCount as dbGetGoalCount,
} from "./db-goals"

/** Return all goals from database (async). */
export async function getGoalsAsync(): Promise<Goal[]> {
  return await dbGetAllGoals()
}

/** Create a new goal in database and return it with its generated ID (async). */
export async function addGoalAsync(input: Omit<Goal, "id" | "roadmap" | "createdAt" | "updatedAt">): Promise<Goal> {
  return await dbCreateGoal(input)
}

/** Get a goal by ID from database (async). */
export async function getGoalByIdAsync(id: string): Promise<Goal | null> {
  return await dbGetGoalById(id)
}

/** Update a goal by ID in database (async). */
export async function updateGoalAsync(id: string, updates: Partial<Omit<Goal, "id" | "createdAt" | "updatedAt" | "roadmap">>): Promise<Goal> {
  return await dbUpdateGoal(id, updates)
}

/** Delete a goal by ID from database (async). CASCADE DELETE handles related records. */
export async function deleteGoalAsync(id: string): Promise<void> {
  await dbDeleteGoal(id)
}

/** Get goal count from database (async). */
export async function getGoalCountAsync(): Promise<number> {
  return await dbGetGoalCount()
}

// ── Reflections (Database Async) ──────────────────────────────────────────

import {
  createReflection as dbCreateReflection,
  getReflectionByDate as dbGetReflectionByDate,
  getAllReflections as dbGetAllReflections,
  upsertReflection as dbUpsertReflection,
  deleteReflectionByDate as dbDeleteReflectionByDate,
  deleteAllReflections as dbDeleteAllReflections,
  getReflectionCount as dbGetReflectionCount,
  getReflectionsByDateRange as dbGetReflectionsByDateRange,
} from "./db-reflections"

/** Return all reflections from database (async). */
export async function getReflectionsAsync(): Promise<Reflection[]> {
  return await dbGetAllReflections()
}

/** Get a reflection by date from database (async). */
export async function getReflectionByDateAsync(date: string): Promise<Reflection | null> {
  return await dbGetReflectionByDate(date)
}

/** Create or update a reflection for the given date (upsert) in database (async). */
export async function saveReflectionAsync(input: Omit<Reflection, "id" | "createdAt">): Promise<Reflection> {
  return await dbUpsertReflection(input)
}

/** Delete a reflection by date from database (async). */
export async function deleteReflectionAsync(date: string): Promise<void> {
  await dbDeleteReflectionByDate(date)
}

/** Get reflections within a date range from database (async). */
export async function getReflectionsByDateRangeAsync(startDate: string, endDate: string): Promise<Reflection[]> {
  return await dbGetReflectionsByDateRange(startDate, endDate)
}

/** Get reflection count from database (async). */
export async function getReflectionCountAsync(): Promise<number> {
  return await dbGetReflectionCount()
}

// ── Weekly Objectives (Database Async) ────────────────────────────────────

import {
  createWeeklyObjective as dbCreateWeeklyObjective,
  getWeeklyObjectiveById as dbGetWeeklyObjectiveById,
  getAllWeeklyObjectives as dbGetAllWeeklyObjectives,
  getWeeklyObjectivesByWeek as dbGetWeeklyObjectivesByWeek,
  getWeeklyObjectivesByGoal as dbGetWeeklyObjectivesByGoal,
  getWeeklyObjectivesByGoalAndWeek as dbGetWeeklyObjectivesByGoalAndWeek,
  updateWeeklyObjective as dbUpdateWeeklyObjective,
  deleteWeeklyObjective as dbDeleteWeeklyObjective,
  getWeeklyObjectiveCount as dbGetWeeklyObjectiveCount,
} from "./db-weekly-objectives"

/** Return all weekly objectives from database (async). */
export async function getWeeklyObjectivesAsync(): Promise<WeeklyObjective[]> {
  return await dbGetAllWeeklyObjectives()
}

/** Return objectives scoped to the given ISO week from database (async). */
export async function getObjectivesForWeekAsync(weekStart?: string): Promise<WeeklyObjective[]> {
  const ws = weekStart ?? weekStartKey()
  return await dbGetWeeklyObjectivesByWeek(ws)
}

/** Create a new weekly objective in database (async). */
export async function saveWeeklyObjectiveAsync(input: Omit<WeeklyObjective, "id" | "dailyTaskIds" | "createdAt">): Promise<WeeklyObjective> {
  return await dbCreateWeeklyObjective(input)
}

/** Update a weekly objective by ID in database (async). */
export async function updateWeeklyObjectiveAsync(id: string, patch: Partial<WeeklyObjective>): Promise<void> {
  await dbUpdateWeeklyObjective(id, patch)
}

/** Delete an objective from database (async). CASCADE DELETE handles linked tasks. */
export async function deleteWeeklyObjectiveAsync(id: string): Promise<void> {
  await dbDeleteWeeklyObjective(id)
}

/** Return objectives for a specific goal within a given week from database (async). */
export async function getObjectivesForGoalAsync(goalId: string, weekStart?: string): Promise<WeeklyObjective[]> {
  if (weekStart) {
    return await dbGetWeeklyObjectivesByGoalAndWeek(goalId, weekStart)
  }
  return await dbGetWeeklyObjectivesByGoal(goalId)
}

/** Get weekly objective count from database (async). */
export async function getWeeklyObjectiveCountAsync(): Promise<number> {
  return await dbGetWeeklyObjectiveCount()
}

// ── Daily Tasks (Database Async) ──────────────────────────────────────────

import {
  createTask as dbCreateTask,
  getTaskById as dbGetTaskById,
  getAllTasks as dbGetAllTasks,
  getTasksByDate as dbGetTasksByDate,
  getTasksByObjective as dbGetTasksByObjective,
  updateTask as dbUpdateTask,
  deleteTask as dbDeleteTask,
  getTaskCount as dbGetTaskCount,
  addChecklistItem as dbAddChecklistItem,
  updateChecklistItem as dbUpdateChecklistItem,
  deleteChecklistItem as dbDeleteChecklistItem,
} from "./db-tasks"

/** Return all tasks from database (async). */
export async function getDailyTasksAsync(): Promise<Task[]> {
  return await dbGetAllTasks()
}

/** Return tasks scheduled for a specific calendar date from database (async). */
export async function getTasksForDateAsync(date: string): Promise<Task[]> {
  return await dbGetTasksByDate(date)
}

/** Create a new daily task in database (async). */
export async function saveTaskAsync(input: Omit<Task, "id" | "checklist" | "createdAt">): Promise<Task> {
  return await dbCreateTask(input)
}

/** Update a task by ID in database (async). */
export async function updateTaskAsync(id: string, patch: Partial<Task>): Promise<void> {
  await dbUpdateTask(id, patch)
}

/** Delete a task from database (async). CASCADE DELETE handles checklist items. */
export async function deleteTaskAsync(id: string): Promise<void> {
  await dbDeleteTask(id)
}

/** Return all tasks belonging to a specific weekly objective from database (async). */
export async function getTasksForObjectiveAsync(objectiveId: string): Promise<Task[]> {
  return await dbGetTasksByObjective(objectiveId)
}

/** Get task count from database (async). */
export async function getTaskCountAsync(): Promise<number> {
  return await dbGetTaskCount()
}

/** Add a checklist item to a task in database (async). */
export async function addChecklistItemAsync(taskId: string, text: string): Promise<ChecklistItem> {
  return await dbAddChecklistItem(taskId, text)
}

/** Update a checklist item in database (async). */
export async function updateChecklistItemAsync(
  itemId: string,
  updates: { text?: string; done?: boolean }
): Promise<ChecklistItem> {
  return await dbUpdateChecklistItem(itemId, updates)
}

/** Delete a checklist item from database (async). */
export async function deleteChecklistItemAsync(itemId: string): Promise<void> {
  await dbDeleteChecklistItem(itemId)
}

// ── Roadmaps (Database Async) ─────────────────────────────────────────────

import {
  getRoadmaps as dbGetRoadmaps,
  getRoadmapForGoal as dbGetRoadmapForGoal,
  saveRoadmapForGoal as dbSaveRoadmapForGoal,
  deleteRoadmapForGoal as dbDeleteRoadmapForGoal,
  getRoadmapTrees as dbGetRoadmapTrees,
  getRoadmapTree as dbGetRoadmapTree,
  saveRoadmapTree as dbSaveRoadmapTree,
  deleteRoadmapTree as dbDeleteRoadmapTree,
  addRoadmapNode as dbAddRoadmapNode,
  updateRoadmapNode as dbUpdateRoadmapNode,
  deleteRoadmapNode as dbDeleteRoadmapNode,
  getRoadmapNodeById as dbGetRoadmapNodeById,
  getRoadmapNodeCount as dbGetRoadmapNodeCount,
} from "./db-roadmaps"

// Legacy Flat Roadmaps

/** Get all legacy roadmap phases for all goals from database (async). */
export async function getRoadmapsAsync(): Promise<RoadmapMap> {
  return await dbGetRoadmaps()
}

/** Get legacy roadmap phases for a specific goal from database (async). */
export async function getRoadmapForGoalAsync(goalId: string): Promise<Phase[]> {
  return await dbGetRoadmapForGoal(goalId)
}

/** Save/replace legacy roadmap phases for a goal in database (async). */
export async function saveRoadmapForGoalAsync(goalId: string, phases: Phase[]): Promise<void> {
  await dbSaveRoadmapForGoal(goalId, phases)
}

/** Delete all legacy roadmap phases for a goal from database (async). */
export async function deleteRoadmapForGoalAsync(goalId: string): Promise<void> {
  await dbDeleteRoadmapForGoal(goalId)
}

// Hierarchical Roadmap Trees

/** Get all hierarchical roadmap trees for all goals from database (async). */
export async function getRoadmapTreesAsync(): Promise<Record<string, RoadmapTree>> {
  return await dbGetRoadmapTrees()
}

/** Get hierarchical roadmap tree for a specific goal from database (async). */
export async function getRoadmapTreeAsync(goalId: string): Promise<RoadmapTree> {
  return await dbGetRoadmapTree(goalId)
}

/** Save/replace entire roadmap tree for a goal in database (async). */
export async function saveRoadmapTreeAsync(goalId: string, tree: RoadmapTree): Promise<void> {
  await dbSaveRoadmapTree(goalId, tree)
}

/** Delete entire roadmap tree for a goal from database (async). */
export async function deleteRoadmapTreeAsync(goalId: string): Promise<void> {
  await dbDeleteRoadmapTree(goalId)
}

/** Add a single roadmap node in database (async). */
export async function addRoadmapNodeAsync(
  goalId: string,
  node: Omit<RoadmapNode, "id" | "createdAt">
): Promise<RoadmapNode> {
  return await dbAddRoadmapNode(goalId, node)
}

/** Update a roadmap node in database (async). */
export async function updateRoadmapNodeAsync(
  goalId: string,
  nodeId: string,
  patch: Partial<RoadmapNode>
): Promise<void> {
  await dbUpdateRoadmapNode(nodeId, patch)
}

/** Delete a roadmap node and its descendants from database (async). */
export async function deleteRoadmapNodeAsync(goalId: string, nodeId: string): Promise<void> {
  await dbDeleteRoadmapNode(nodeId)
}

/** Get a single roadmap node by ID from database (async). */
export async function getRoadmapNodeByIdAsync(nodeId: string): Promise<RoadmapNode | null> {
  return await dbGetRoadmapNodeById(nodeId)
}

/** Get roadmap node count for a goal from database (async). */
export async function getRoadmapNodeCountAsync(goalId: string): Promise<number> {
  return await dbGetRoadmapNodeCount(goalId)
}
