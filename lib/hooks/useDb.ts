"use client"

/**
 * Database-backed React hooks for the Compass app.
 *
 * Each hook mirrors the corresponding `@/lib/storage` functions but
 * reads/writes PostgreSQL via the `/api/*` route handlers.
 */

import { useState, useEffect, useCallback } from "react"
import type { Goal, Session, Reflection, WeeklyObjective, Task, Interruption, Phase, RoadmapTree, RoadmapNode } from "@/lib/types"
import * as db from "@/lib/db-client"

// ── Generic fetch wrapper ────────────────────────────────────────────

function useApiData<T>(fetcher: () => Promise<T>): { data: T | null; loading: boolean; error: Error | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(() => {
    const doFetch = async () => {
      try {
        const result = await fetcher()
        setData(result)
      } catch (e) {
        setError(e as Error)
      } finally {
        setLoading(false)
      }
    }
    doFetch()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Promise.resolve().then(() => fetch())
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}

// ── Goals ────────────────────────────────────────────────────────────

export function useGoalsDb() {
  return useApiData<Goal[]>(() => db.fetchGoals())
}

export async function createGoalDb(input: Parameters<typeof db.createGoal>[0]) {
  return db.createGoal(input)
}

export async function updateGoalDb(id: string, patch: Partial<Goal>) {
  return db.updateGoal(id, patch)
}

export async function deleteGoalDb(id: string) {
  return db.deleteGoal(id)
}

// ── Sessions ─────────────────────────────────────────────────────────

export function useSessionsDb() {
  return useApiData<Session[]>(() => db.fetchSessions())
}

export function useSessionsByDateDb(date: string) {
  return useApiData<Session[]>(() => db.fetchSessionsByDate(date))
}

export async function createSessionDb(input: Omit<Session, "id">) {
  return db.createSession(input)
}

export async function deleteSessionDb(id: string) {
  return db.deleteSession(id)
}

// ── Tasks ────────────────────────────────────────────────────────────

export function useTasksDb(date?: string) {
  return useApiData<Task[]>(() => db.fetchTasks(date))
}

export async function createTaskDb(input: Omit<Task, "id" | "createdAt">) {
  return db.createTask(input)
}

export async function updateTaskDb(id: string, patch: Partial<Task>) {
  return db.updateTask(id, patch)
}

export async function deleteTaskDb(id: string) {
  return db.deleteTask(id)
}

// ── Reflections ──────────────────────────────────────────────────────

export function useReflectionsDb() {
  return useApiData<Reflection[]>(() => db.fetchReflections())
}

export async function saveReflectionDb(input: Omit<Reflection, "id" | "createdAt">) {
  return db.saveReflection(input)
}

export async function deleteReflectionDb(date: string) {
  return db.deleteReflection(date)
}

// ── Weekly Objectives ────────────────────────────────────────────────

export function useWeeklyObjectivesDb(weekStart?: string) {
  return useApiData<WeeklyObjective[]>(() => db.fetchWeeklyObjectives(weekStart))
}

export async function createWeeklyObjectiveDb(input: Omit<WeeklyObjective, "id" | "createdAt">) {
  return db.createWeeklyObjective(input)
}

export async function updateWeeklyObjectiveDb(id: string, patch: Partial<WeeklyObjective>) {
  return db.updateWeeklyObjective(id, patch)
}

export async function deleteWeeklyObjectiveDb(id: string) {
  return db.deleteWeeklyObjective(id)
}

// ── Settings ─────────────────────────────────────────────────────────

export async function getSettingDb(key: string): Promise<string | null> {
  return db.fetchSetting(key)
}

export async function setSettingDb(key: string, value: string): Promise<void> {
  return db.setSetting(key, value)
}

// ── Interruptions ─────────────────────────────────────────────────────

export function useInterruptionsDb() {
  return useApiData<Interruption[]>(() => db.fetchInterruptions())
}

export async function createInterruptionDb(input: Omit<Interruption, "id">) {
  return db.createInterruption(input)
}

// ── Roadmaps (legacy flat phases) ────────────────────────────────────

export function useRoadmapPhasesDb(goalId: string) {
  return useApiData<Phase[]>(() => db.fetchRoadmapPhases(goalId))
}

export async function saveRoadmapPhasesDb(goalId: string, phases: Phase[]) {
  return db.saveRoadmapPhases(goalId, phases)
}

// ── Roadmaps (hierarchical tree) ────────────────────────────────────

export function useRoadmapTreeDb(goalId: string) {
  return useApiData<RoadmapTree>(() => db.fetchRoadmapTree(goalId))
}

export async function addRoadmapNodeDb(goalId: string, node: Omit<RoadmapNode, "id" | "createdAt">) {
  return db.addRoadmapNode(goalId, node)
}

export async function updateRoadmapNodeDb(nodeId: string, updates: Partial<RoadmapNode>) {
  return db.updateRoadmapNodeDb(nodeId, updates)
}

export async function deleteRoadmapNodeDb(nodeId: string) {
  return db.deleteRoadmapNodeDb(nodeId)
}
