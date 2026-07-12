"use client"
import { useState, useEffect, useMemo } from "react"
import {
  fetchGoals,
  fetchWeeklyObjectives,
  fetchSessions,
  createWeeklyObjective,
  updateWeeklyObjective,
  deleteWeeklyObjective,
  createTask,
} from "@/lib/db-client"
import type { Goal, WeeklyObjective, Session, TaskStatus } from "@/lib/types"
import { weekStartKey, weekEndKey, weekLabel, todayKey } from "@/lib/utils"
import { buildLoggedByTag } from "./weeklyPlanHelpers"

interface GoalGroup {
  goal: Goal
  objectives: WeeklyObjective[]
  logged: number
}

export function useWeeklyPlan() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [objectives, setObjectives] = useState<WeeklyObjective[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState<1 | 2>(1)
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([])
  const [hourTargets, setHourTargets] = useState<Record<string, number>>({})
  const [focusedGoalId, setFocusedGoalId] = useState<string | null>(null)
  const [addingToGoalId, setAddingToGoalId] = useState<string | null>(null)
  const [newObjTitle, setNewObjTitle] = useState("")
  const [newObjDesc, setNewObjDesc] = useState("")
  const [editingObj, setEditingObj] = useState<WeeklyObjective | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [addTaskObj, setAddTaskObj] = useState<WeeklyObjective | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")

  const weekKey = weekStartKey()
  const weekEnd = weekEndKey()

  const loadData = async () => {
    try {
      const [g, o, s] = await Promise.all([
        fetchGoals(),
        fetchWeeklyObjectives(weekKey),
        fetchSessions(),
      ])
      setGoals(g)
      setObjectives(o)
      setSessions(s)
    } catch (e) {
      console.error("Failed to load weekly plan data:", e)
    }
  }

  useEffect(() => { loadData() }, [])

  const loggedByTag = useMemo(() => buildLoggedByTag(sessions), [sessions])

  const goalGroups = useMemo<GoalGroup[]>(() =>
    goals
      .filter((g) => g.status === "active")
      .map((goal) => ({
        goal,
        objectives: objectives.filter((o) => o.goalId === goal.id),
        logged: loggedByTag[goal.tag.toLowerCase()] ?? 0,
      }))
      .filter((g) => g.objectives.length > 0),
    [goals, objectives, loggedByTag],
  )

  function openWizard() {
    const existingGoalIds = [...new Set(objectives.map((o) => o.goalId))]
    setSelectedGoalIds(existingGoalIds)
    const ht: Record<string, number> = {}
    existingGoalIds.forEach((id) => {
      const g = goals.find((x) => x.id === id)
      ht[id] = g?.weeklyTarget || 5
    })
    setHourTargets(ht)
    setWizardStep(1)
    setFocusedGoalId(existingGoalIds[0] ?? null)
    setWizardOpen(true)
  }

  function toggleGoalSelection(id: string) {
    setSelectedGoalIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
    if (!hourTargets[id]) {
      const g = goals.find((x) => x.id === id)
      setHourTargets((prev) => ({ ...prev, [id]: g?.weeklyTarget || 5 }))
    }
  }

  function goToStep2() {
    if (selectedGoalIds.length === 0) return
    setFocusedGoalId(selectedGoalIds[0] ?? null)
    setWizardStep(2)
  }

  async function closeWizard() {
    setWizardOpen(false)
    setAddingToGoalId(null)
    setNewObjTitle("")
    setNewObjDesc("")
    await loadData()
  }

  async function addObjective(goalId: string) {
    const title = newObjTitle.trim()
    if (!title) return
    await createWeeklyObjective({
      goalId,
      milestoneId: null,
      title,
      description: newObjDesc.trim(),
      priority: objectives.filter((o) => o.goalId === goalId).length + 1,
      status: "pending",
      weekStart: weekKey,
      weekEnd,
      dailyTaskIds: [],
    })
    setNewObjTitle("")
    setNewObjDesc("")
    setAddingToGoalId(null)
    await loadData()
  }

  async function cycleStatus(obj: WeeklyObjective) {
    const next: TaskStatus =
      obj.status === "pending" ? "in-progress"
      : obj.status === "in-progress" ? "completed"
      : "pending"
    await updateWeeklyObjective(obj.id, { status: next })
    await loadData()
  }

  function openEdit(obj: WeeklyObjective) {
    setEditingObj(obj)
    setEditTitle(obj.title)
    setEditDesc(obj.description)
  }

  async function saveEdit() {
    if (!editingObj || !editTitle.trim()) return
    await updateWeeklyObjective(editingObj.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
    })
    setEditingObj(null)
    await loadData()
  }

  async function deleteObj(id: string) {
    await deleteWeeklyObjective(id)
    await loadData()
  }

  async function addDailyTask() {
    if (!addTaskObj || !newTaskTitle.trim()) return
    const task = await createTask({
      objectiveId: addTaskObj.id,
      title: newTaskTitle.trim(), description: "",
      estimatedTime: 0, priority: "medium", status: "pending",
      scheduledDate: todayKey(), scheduledTime: "", tags: [],
      checklist: [], sessionId: null, pomodoroCount: 0,
    })
    await updateWeeklyObjective(addTaskObj.id, {
      dailyTaskIds: [...addTaskObj.dailyTaskIds, task.id],
    })
    setNewTaskTitle("")
    setAddTaskObj(null)
    await loadData()
  }

  return {
    // Data
    goals, objectives, goalGroups, weekKey, weekEnd,
    // Wizard
    wizardOpen, wizardStep, selectedGoalIds, hourTargets, focusedGoalId,
    openWizard, toggleGoalSelection, goToStep2, closeWizard,
    setHourTargets, setWizardStep, setFocusedGoalId,
    // Inline add
    addingToGoalId, newObjTitle, newObjDesc, addObjective,
    setAddingToGoalId, setNewObjTitle, setNewObjDesc,
    // Expand
    expanded, setExpanded,
    // CRUD
    cycleStatus, openEdit, saveEdit, deleteObj,
    // Edit dialog
    editingObj, editTitle, editDesc, setEditingObj, setEditTitle, setEditDesc,
    // Add task dialog
    addTaskObj, newTaskTitle, setAddTaskObj, setNewTaskTitle, addDailyTask,
  }
}
