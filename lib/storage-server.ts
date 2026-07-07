/**
 * Server-side storage layer for the Compass time-tracking app.
 * 
 * This module provides async wrapper functions that call database modules.
 * These functions should only be used in server components, API routes, or server actions.
 * All functions require a userId as the first parameter for user-scoped access.
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
export async function isOnboardingDoneAsync(userId: string): Promise<boolean> {
  const value = await getSetting(userId, KEYS.ONBOARDING_DONE)
  return value === "true"
}

/** Mark the onboarding flow as completed (async, database-backed). */
export async function setOnboardingDoneAsync(userId: string): Promise<void> {
  await setSetting(userId, KEYS.ONBOARDING_DONE, "true")
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
export async function getSessionsAsync(userId: string): Promise<Session[]> {
  const { sessions } = await dbGetAllSessions(userId)
  return sessions
}

/** Persist a new session to database and return it with its generated ID (async). */
export async function addSessionAsync(userId: string, input: Omit<Session, "id">): Promise<Session> {
  return await dbCreateSession(userId, input)
}

/** Remove a single session by ID from database (async). */
export async function deleteSessionAsync(userId: string, id: string): Promise<void> {
  await dbDeleteSession(userId, id)
}

/** Remove all sessions from database (async). */
export async function clearSessionsAsync(userId: string): Promise<void> {
  await dbDeleteAllSessions(userId)
}

/** Get sessions for a specific date from database (async). */
export async function getSessionsByDateAsync(userId: string, date: string): Promise<Session[]> {
  return await dbGetSessionsByDate(userId, date)
}

/** Get sessions within a date range from database (async). */
export async function getSessionsByDateRangeAsync(userId: string, startDate: string, endDate: string): Promise<Session[]> {
  return await dbGetSessionsByDateRange(userId, startDate, endDate)
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
export async function getInterruptionsAsync(userId: string): Promise<Interruption[]> {
  const { interruptions } = await dbGetAllInterruptions(userId)
  return interruptions
}

/** Persist a new interruption to database and return it with its generated ID (async). */
export async function addInterruptionAsync(userId: string, input: Omit<Interruption, "id">): Promise<Interruption> {
  return await dbCreateInterruption(userId, input)
}

/** Get interruptions for a specific session from database (async). */
export async function getInterruptionsBySessionAsync(userId: string, sessionId: string): Promise<Interruption[]> {
  return await dbGetInterruptionsBySession(userId, sessionId)
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
export async function getGoalsAsync(userId: string): Promise<Goal[]> {
  const { goals } = await dbGetAllGoals(userId)
  return goals
}

/** Create a new goal in database and return it with its generated ID (async). */
export async function addGoalAsync(userId: string, input: Omit<Goal, "id" | "roadmap" | "createdAt" | "updatedAt">): Promise<Goal> {
  return await dbCreateGoal(userId, input)
}

/** Get a goal by ID from database (async). */
export async function getGoalByIdAsync(userId: string, id: string): Promise<Goal | null> {
  return await dbGetGoalById(userId, id)
}

/** Update a goal by ID in database (async). */
export async function updateGoalAsync(userId: string, id: string, updates: Partial<Omit<Goal, "id" | "createdAt" | "updatedAt" | "roadmap">>): Promise<Goal> {
  return await dbUpdateGoal(userId, id, updates)
}

/** Delete a goal by ID from database (async). CASCADE DELETE handles related records. */
export async function deleteGoalAsync(userId: string, id: string): Promise<void> {
  await dbDeleteGoal(userId, id)
}

/** Get goal count from database (async). */
export async function getGoalCountAsync(userId: string, statusFilter?: string): Promise<number> {
  return await dbGetGoalCount(userId, statusFilter)
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
export async function getReflectionsAsync(userId: string): Promise<Reflection[]> {
  const { reflections } = await dbGetAllReflections(userId)
  return reflections
}

/** Get a reflection by date from database (async). */
export async function getReflectionByDateAsync(userId: string, date: string): Promise<Reflection | null> {
  return await dbGetReflectionByDate(userId, date)
}

/** Create or update a reflection for the given date (upsert) in database (async). */
export async function saveReflectionAsync(userId: string, input: Omit<Reflection, "id" | "createdAt">): Promise<Reflection> {
  return await dbUpsertReflection(userId, input)
}

/** Delete a reflection by date from database (async). */
export async function deleteReflectionAsync(userId: string, date: string): Promise<void> {
  await dbDeleteReflectionByDate(userId, date)
}

/** Get reflections within a date range from database (async). */
export async function getReflectionsByDateRangeAsync(userId: string, startDate: string, endDate: string): Promise<Reflection[]> {
  return await dbGetReflectionsByDateRange(userId, startDate, endDate)
}

/** Get reflection count from database (async). */
export async function getReflectionCountAsync(userId: string): Promise<number> {
  return await dbGetReflectionCount(userId)
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
export async function getWeeklyObjectivesAsync(userId: string): Promise<WeeklyObjective[]> {
  return await dbGetAllWeeklyObjectives(userId)
}

/** Return objectives scoped to the given ISO week from database (async). */
export async function getObjectivesForWeekAsync(userId: string, weekStart?: string): Promise<WeeklyObjective[]> {
  const ws = weekStart ?? weekStartKey()
  return await dbGetWeeklyObjectivesByWeek(userId, ws)
}

/** Create a new weekly objective in database (async). */
export async function saveWeeklyObjectiveAsync(userId: string, input: Omit<WeeklyObjective, "id" | "dailyTaskIds" | "createdAt">): Promise<WeeklyObjective> {
  return await dbCreateWeeklyObjective(userId, input)
}

/** Update a weekly objective by ID in database (async). */
export async function updateWeeklyObjectiveAsync(userId: string, id: string, patch: Partial<WeeklyObjective>): Promise<void> {
  await dbUpdateWeeklyObjective(userId, id, patch)
}

/** Delete an objective from database (async). CASCADE DELETE handles linked tasks. */
export async function deleteWeeklyObjectiveAsync(userId: string, id: string): Promise<void> {
  await dbDeleteWeeklyObjective(userId, id)
}

/** Return objectives for a specific goal within a given week from database (async). */
export async function getObjectivesForGoalAsync(userId: string, goalId: string, weekStart?: string): Promise<WeeklyObjective[]> {
  if (weekStart) {
    return await dbGetWeeklyObjectivesByGoalAndWeek(userId, goalId, weekStart)
  }
  return await dbGetWeeklyObjectivesByGoal(userId, goalId)
}

/** Get weekly objective count from database (async). */
export async function getWeeklyObjectiveCountAsync(userId: string): Promise<number> {
  return await dbGetWeeklyObjectiveCount(userId)
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
export async function getDailyTasksAsync(userId: string): Promise<Task[]> {
  return await dbGetAllTasks(userId)
}

/** Return tasks scheduled for a specific calendar date from database (async). */
export async function getTasksForDateAsync(userId: string, date: string): Promise<Task[]> {
  return await dbGetTasksByDate(userId, date)
}

/** Create a new daily task in database (async). */
export async function saveTaskAsync(userId: string, input: Omit<Task, "id" | "checklist" | "createdAt">): Promise<Task> {
  return await dbCreateTask(userId, input)
}

/** Update a task by ID in database (async). */
export async function updateTaskAsync(userId: string, id: string, patch: Partial<Task>): Promise<void> {
  await dbUpdateTask(userId, id, patch)
}

/** Delete a task from database (async). CASCADE DELETE handles checklist items. */
export async function deleteTaskAsync(userId: string, id: string): Promise<void> {
  await dbDeleteTask(userId, id)
}

/** Return all tasks belonging to a specific weekly objective from database (async). */
export async function getTasksForObjectiveAsync(userId: string, objectiveId: string): Promise<Task[]> {
  return await dbGetTasksByObjective(userId, objectiveId)
}

/** Get task count from database (async). */
export async function getTaskCountAsync(userId: string): Promise<number> {
  return await dbGetTaskCount(userId)
}

/** Add a checklist item to a task in database (async). */
export async function addChecklistItemAsync(userId: string, taskId: string, text: string): Promise<ChecklistItem> {
  return await dbAddChecklistItem(userId, taskId, text)
}

/** Update a checklist item in database (async). */
export async function updateChecklistItemAsync(
  userId: string,
  itemId: string,
  updates: { text?: string; done?: boolean }
): Promise<ChecklistItem> {
  return await dbUpdateChecklistItem(userId, itemId, updates)
}

/** Delete a checklist item from database (async). */
export async function deleteChecklistItemAsync(userId: string, itemId: string): Promise<void> {
  await dbDeleteChecklistItem(userId, itemId)
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
export async function getRoadmapsAsync(userId: string): Promise<RoadmapMap> {
  const { roadmaps } = await dbGetRoadmaps(userId)
  return roadmaps
}

/** Get legacy roadmap phases for a specific goal from database (async). */
export async function getRoadmapForGoalAsync(userId: string, goalId: string): Promise<Phase[]> {
  return await dbGetRoadmapForGoal(userId, goalId)
}

/** Save/replace legacy roadmap phases for a goal in database (async). */
export async function saveRoadmapForGoalAsync(userId: string, goalId: string, phases: Phase[]): Promise<void> {
  await dbSaveRoadmapForGoal(userId, goalId, phases)
}

/** Delete all legacy roadmap phases for a goal from database (async). */
export async function deleteRoadmapForGoalAsync(userId: string, goalId: string): Promise<void> {
  await dbDeleteRoadmapForGoal(userId, goalId)
}

// Hierarchical Roadmap Trees

/** Get all hierarchical roadmap trees for all goals from database (async). */
export async function getRoadmapTreesAsync(userId: string): Promise<Record<string, RoadmapTree>> {
  const { trees } = await dbGetRoadmapTrees(userId)
  return trees
}

/** Get hierarchical roadmap tree for a specific goal from database (async). */
export async function getRoadmapTreeAsync(userId: string, goalId: string): Promise<RoadmapTree> {
  return await dbGetRoadmapTree(userId, goalId)
}

/** Save/replace entire roadmap tree for a goal in database (async). */
export async function saveRoadmapTreeAsync(userId: string, goalId: string, tree: RoadmapTree): Promise<void> {
  await dbSaveRoadmapTree(userId, goalId, tree)
}

/** Delete entire roadmap tree for a goal from database (async). */
export async function deleteRoadmapTreeAsync(userId: string, goalId: string): Promise<void> {
  await dbDeleteRoadmapTree(userId, goalId)
}

/** Add a single roadmap node in database (async). */
export async function addRoadmapNodeAsync(
  userId: string,
  goalId: string,
  node: Omit<RoadmapNode, "id" | "createdAt">
): Promise<RoadmapNode> {
  return await dbAddRoadmapNode(userId, goalId, node)
}

/** Update a roadmap node in database (async). */
export async function updateRoadmapNodeAsync(
  userId: string,
  nodeId: string,
  patch: Partial<RoadmapNode>
): Promise<void> {
  await dbUpdateRoadmapNode(userId, nodeId, patch)
}

/** Delete a roadmap node and its descendants from database (async). */
export async function deleteRoadmapNodeAsync(userId: string, nodeId: string): Promise<void> {
  await dbDeleteRoadmapNode(userId, nodeId)
}

/** Get a single roadmap node by ID from database (async). */
export async function getRoadmapNodeByIdAsync(userId: string, nodeId: string): Promise<RoadmapNode | null> {
  return await dbGetRoadmapNodeById(userId, nodeId)
}

/** Get roadmap node count for a goal from database (async). */
export async function getRoadmapNodeCountAsync(userId: string, goalId: string): Promise<number> {
  return await dbGetRoadmapNodeCount(userId, goalId)
}
