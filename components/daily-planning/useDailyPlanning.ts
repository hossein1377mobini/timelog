"use client"
import { useState, useEffect, useMemo, useCallback } from "react"
import {
  fetchGoals,
  fetchWeeklyObjectives,
  fetchTasksByObjective,
  createTask,
  updateTask as dbUpdateTask,
  fetchReflections,
  saveReflection,
  fetchTasks,
} from "@/lib/db-client"
import type { Goal, WeeklyObjective, Task, ChecklistItem, Reflection, TaskStatus } from "@/lib/types"
import { todayKey, generateId, weekStartKey } from "@/lib/utils"

export interface EditState {
  taskId: string
  title: string
  description: string
  estimatedTime: number
  scheduledTime: string
  priority: "high" | "medium" | "low"
  tags: string
  checklist: ChecklistItem[]
  newChecklistText: string
}

async function readInitialData() {
  const [goals, objectives, tasks, reflections] = await Promise.all([
    fetchGoals(),
    fetchWeeklyObjectives(weekStartKey()),
    fetchTasks(todayKey()),
    fetchReflections(),
  ])
  const ref = reflections.find((r: Reflection) => r.date === todayKey()) ?? null
  const objectiveTasks = new Map<string, Task[]>()
  await Promise.all(
    objectives.map(async (obj: WeeklyObjective) => {
      const tasks = await fetchTasksByObjective(obj.id)
      objectiveTasks.set(obj.id, tasks)
    }),
  )
  return { goals, objectives, tasks, ref, objectiveTasks }
}

export function useDailyPlanning() {
  const [tab, setTab] = useState<"morning" | "evening">("morning")
  const [goals, setGoals] = useState<Goal[]>([])
  const [objectives, setObjectives] = useState<WeeklyObjective[]>([])
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [objectiveTasks, setObjectiveTasks] = useState<Map<string, Task[]>>(new Map())
  const [editing, setEditing] = useState(true)
  const [newFreeTask, setNewFreeTask] = useState("")
  const [mood, setMood] = useState(0)
  const [energy, setEnergy] = useState(0)
  const [openChecklists, setOpenChecklists] = useState<Set<string>>(new Set())
  const [editState, setEditState] = useState<EditState | null>(null)
  const [accomplishments, setAccomplishments] = useState("")
  const [distractions, setDistractions] = useState("")
  const [rating, setRating] = useState(0)
  const [differently, setDifferently] = useState("")
  const [gratitude, setGratitude] = useState<[string, string, string]>(["", "", ""])
  const [tomorrowFocus, setTomorrowFocus] = useState("")
  const [eveningMood, setEveningMood] = useState(0)
  const [newAccomplishment, setNewAccomplishment] = useState("")
  const [newDistraction, setNewDistraction] = useState("")
  const [newDifferently, setNewDifferently] = useState("")

  useEffect(() => {
    (async () => {
      try {
        const data = await readInitialData()
        setGoals(data.goals)
        setObjectives(data.objectives)
        setTodayTasks(data.tasks)
        setObjectiveTasks(data.objectiveTasks)
        if (data.tasks.length > 0) setEditing(false)
        if (data.ref) {
          setAccomplishments(data.ref.accomplishments.join("\n"))
          setDistractions(data.ref.challenges.join("\n"))
          setRating(data.ref.rating)
          setDifferently(data.ref.improvements.join("\n"))
          setGratitude(
            data.ref.wins.length >= 3
              ? [data.ref.wins[0] || "", data.ref.wins[1] || "", data.ref.wins[2] || ""]
              : ["", "", ""],
          )
          setTomorrowFocus(data.ref.tomorrowPlan)
          setEveningMood(data.ref.mood)
        }
      } catch (e) {
        console.error("Failed to load daily planning data:", e)
      }
    })()
  }, [])

  const objectiveGoalMap = useMemo(() => {
    const map = new Map<string, { objective: WeeklyObjective; goal: Goal }>()
    for (const obj of objectives) {
      const goal = goals.find((g) => g.id === obj.goalId)
      if (goal) map.set(obj.id, { objective: obj, goal })
    }
    return map
  }, [objectives, goals])

  const objectiveGroups = useMemo(() => {
    const todayIds = new Set(todayTasks.map((t) => t.id))
    return objectives
      .map((obj) => {
        const goal = goals.find((g) => g.id === obj.goalId)
        if (!goal) return null
        const allObjTasks = objectiveTasks.get(obj.id) ?? []
        if (allObjTasks.length === 0) return null
        return {
          objective: obj,
          goal,
          tasks: allObjTasks,
          todayTaskIds: new Set(allObjTasks.filter((t) => todayIds.has(t.id)).map((t) => t.id)),
        }
      })
      .filter(Boolean) as {
      objective: WeeklyObjective
      goal: Goal
      tasks: Task[]
      todayTaskIds: Set<string>
    }[]
  }, [objectives, goals, todayTasks, objectiveTasks])

  const completedCount = todayTasks.filter((t) => t.status === "completed").length
  const totalEstimated = todayTasks.reduce((sum, t) => sum + (t.estimatedTime ?? 0), 0)
  const progressPct = todayTasks.length === 0
    ? 0
    : Math.round((completedCount / todayTasks.length) * 100)

  async function addFreeTask() {
    const text = newFreeTask.trim()
    if (!text) return
    const task = await createTask({
      objectiveId: null, title: text, description: "", estimatedTime: 0,
      priority: "medium", status: "pending", scheduledDate: todayKey(),
      scheduledTime: "", tags: [], checklist: [], sessionId: null, pomodoroCount: 0,
    })
    setTodayTasks((prev) => [...prev, task])
    setNewFreeTask("")
  }

  async function selectTaskFromObjective(task: Task) {
    await dbUpdateTask(task.id, { scheduledDate: todayKey() })
    setTodayTasks((prev) => [...prev, { ...task, scheduledDate: todayKey() }])
  }

  async function removeTask(taskId: string) {
    await dbUpdateTask(taskId, { scheduledDate: "" })
    setTodayTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  function saveMorningPlan() { setEditing(false) }

  async function cycleStatus(task: Task) {
    const next: TaskStatus =
      task.status === "pending" ? "in-progress"
      : task.status === "in-progress" ? "completed"
      : "pending"
    await dbUpdateTask(task.id, { status: next })
    setTodayTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)))
  }

  async function toggleChecklistItem(task: Task, itemId: string) {
    const newChecklist = task.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item,
    )
    await dbUpdateTask(task.id, { checklist: newChecklist })
    setTodayTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, checklist: newChecklist } : t)))
  }

  function toggleChecklist(taskId: string) {
    setOpenChecklists((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  function openEdit(task: Task) {
    setEditState({
      taskId: task.id, title: task.title, description: task.description,
      estimatedTime: task.estimatedTime, scheduledTime: task.scheduledTime,
      priority: task.priority, tags: task.tags.join(", "),
      checklist: task.checklist.map((c) => ({ ...c })), newChecklistText: "",
    })
  }

  async function saveEdit() {
    if (!editState) return
    const patch: Partial<Task> = {
      title: editState.title.trim() || "(untitled)",
      description: editState.description,
      estimatedTime: editState.estimatedTime,
      scheduledTime: editState.scheduledTime,
      priority: editState.priority,
      tags: editState.tags.split(",").map((s) => s.trim()).filter(Boolean),
      checklist: editState.checklist,
    }
    await dbUpdateTask(editState.taskId, patch)
    setTodayTasks((prev) => prev.map((t) => (t.id === editState.taskId ? { ...t, ...patch } : t)))
    setEditState(null)
  }

  function addChecklistItem() {
    if (!editState) return
    const text = editState.newChecklistText.trim()
    if (!text) return
    setEditState((prev) =>
      prev ? { ...prev, checklist: [...prev.checklist, { id: generateId(), text, done: false }], newChecklistText: "" } : null,
    )
  }

  function removeChecklistItem(itemId: string) {
    setEditState((prev) =>
      prev ? { ...prev, checklist: prev.checklist.filter((c) => c.id !== itemId) } : null,
    )
  }

  function toggleEditChecklistItem(itemId: string) {
    setEditState((prev) =>
      prev ? { ...prev, checklist: prev.checklist.map((c) => c.id === itemId ? { ...c, done: !c.done } : c) } : null,
    )
  }

  async function saveEveningReflection() {
    await saveReflection({
      date: todayKey(), mood: eveningMood,
      accomplishments: accomplishments.split("\n").filter(Boolean),
      challenges: distractions.split("\n").filter(Boolean),
      improvements: differently.split("\n").filter(Boolean),
      rating, wins: gratitude.filter(Boolean),
      tomorrowPlan: tomorrowFocus, notes: "",
    })
  }

  return {
    tab, setTab, goals, objectives, todayTasks, editing, setEditing,
    newFreeTask, setNewFreeTask, mood, setMood, energy, setEnergy,
    openChecklists, setOpenChecklists,
    editState, setEditState,
    accomplishments, setAccomplishments,
    distractions, setDistractions,
    rating, setRating,
    differently, setDifferently,
    gratitude, setGratitude,
    tomorrowFocus, setTomorrowFocus,
    eveningMood, setEveningMood,
    newAccomplishment, setNewAccomplishment,
    newDistraction, setNewDistraction,
    newDifferently, setNewDifferently,
    objectiveGoalMap, objectiveGroups,
    completedCount, totalEstimated, progressPct,
    addFreeTask, selectTaskFromObjective, removeTask, saveMorningPlan,
    cycleStatus, toggleChecklistItem, toggleChecklist,
    openEdit, saveEdit, addChecklistItem, removeChecklistItem, toggleEditChecklistItem,
    saveEveningReflection,
  }
}
