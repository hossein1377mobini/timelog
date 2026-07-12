"use client"
import { useState, useEffect, useMemo, useCallback } from "react"
import {
  fetchGoals,
  fetchWeeklyObjectives,
  fetchSessions,
  createWeeklyObjective,
  updateWeeklyObjective,
  fetchRoadmapTree,
} from "@/lib/db-client"
import type { Goal, WeeklyObjective, RoadmapTree } from "@/lib/types"
import { weekStartKey, weekEndKey, weekLabel, formatHM, todayKey } from "@/lib/utils"

export interface ObjectiveWithGoal extends WeeklyObjective {
  goal: Goal | undefined
}

export interface YearWeek {
  weekStart: string
  weekEnd: string
  total: number
  completed: number
}

export function useObjectivesView() {
  const weekKey = weekStartKey()
  const weekEnd = weekEndKey()
  const [goals, setGoals] = useState<Goal[]>([])
  const [objectives, setObjectives] = useState<WeeklyObjective[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [roadmapTrees, setRoadmapTrees] = useState<Record<string, RoadmapTree>>({})
  const [loading, setLoading] = useState(true)
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [showWeeklyReflection, setShowWeeklyReflection] = useState(false)
  const [yearWeeks, setYearWeeks] = useState<YearWeek[]>([])

  const loadData = useCallback(async () => {
    try {
      const [g, o, s] = await Promise.all([
        fetchGoals(),
        fetchWeeklyObjectives(weekKey),
        fetchSessions(),
      ])
      setGoals(g)
      setObjectives(o)
      setSessions(s)
      const activeGoals = g.filter((goal: Goal) => goal.status === "active")
      const trees: Record<string, RoadmapTree> = {}
      for (const goal of activeGoals) {
        trees[goal.id] = await fetchRoadmapTree(goal.id)
      }
      setRoadmapTrees(trees)
    } catch (e) {
      console.error("Failed to load objectives data:", e)
    } finally {
      setLoading(false)
    }
  }, [weekKey])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    fetchWeeklyObjectives().then((allObjs: WeeklyObjective[]) => {
      const weekMap = new Map<string, { total: number; completed: number }>()
      const now = new Date()
      const currentWeek = new Date(weekStartKey(now))
      for (let i = 0; i < 52; i++) {
        const start = new Date(currentWeek)
        start.setDate(start.getDate() - i * 7)
        const key = weekStartKey(start)
        weekMap.set(key, { total: 0, completed: 0 })
      }
      for (const obj of allObjs) {
        const existing = weekMap.get(obj.weekStart) || { total: 0, completed: 0 }
        existing.total++
        if (obj.status === "completed") existing.completed++
        weekMap.set(obj.weekStart, existing)
      }
      setYearWeeks(
        Array.from(weekMap.entries())
          .map(([weekStart, data]) => ({ weekStart, weekEnd: weekEndKey(new Date(weekStart)), ...data }))
          .sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
      )
    }).catch(console.error)
  }, [])

  const objectivesWithGoals = useMemo<ObjectiveWithGoal[]>(() => {
    const goalMap = new Map(goals.map((g) => [g.id, g]))
    return objectives.map((o) => ({ ...o, goal: goalMap.get(o.goalId) }))
  }, [objectives, goals])

  const activeGoals = goals.filter((g) => g.status === "active")

  const weekSessionSeconds = useMemo(() =>
    sessions
      .filter((s) => s.weekStart === weekKey)
      .reduce((sum, s) => sum + s.duration, 0),
    [sessions, weekKey],
  )

  async function handleAddObjective(data: { goalId: string; milestoneId: string | null; title: string; description: string }) {
    await createWeeklyObjective({
      goalId: data.goalId, milestoneId: data.milestoneId,
      title: data.title, description: data.description,
      priority: objectives.filter((o) => o.goalId === data.goalId).length + 1,
      status: "pending", weekStart: weekKey, weekEnd, dailyTaskIds: [],
    })
    await loadData()
  }

  async function cycleStatus(obj: WeeklyObjective) {
    const next: "pending" | "in-progress" | "completed" =
      obj.status === "pending" ? "in-progress"
      : obj.status === "in-progress" ? "completed"
      : "pending"
    await updateWeeklyObjective(obj.id, { status: next })
    await loadData()
  }

  function handleEndWeek() { setShowWeeklyReflection(true) }
  function handleReflectionDone() { setShowWeeklyReflection(false); loadData() }
  function handleReflectionClose() { setShowWeeklyReflection(false) }

  return {
    loading, goals, objectives, objectivesWithGoals, activeGoals,
    weekKey, weekEnd, yearWeeks, roadmapTrees, weekSessionSeconds,
    showAddSheet, setShowAddSheet,
    showWeeklyReflection, setShowWeeklyReflection,
    handleAddObjective, cycleStatus,
    handleEndWeek, handleReflectionDone, handleReflectionClose,
  }
}
