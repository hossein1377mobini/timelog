import { useState, useCallback } from "react"
import type { Task } from "@/lib/types"
import { todayKey } from "@/lib/utils"
import { fetchTasks } from "@/lib/db-client"

export interface TaskSelectorState {
  tasks: Task[]
  selectedTaskId: string
  customTaskName: string
  selectedTask: Task | undefined
  taskName: string
  loadTasks: () => Promise<void>
  setSelectedTaskId: (id: string) => void
  setCustomTaskName: (name: string) => void
}

export function useTaskSelector(): TaskSelectorState {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string>("")
  const [customTaskName, setCustomTaskName] = useState<string>("")

  const selectedTask = tasks.find((t) => t.id === selectedTaskId)
  const taskName: string = selectedTask?.title || customTaskName.trim()

  const loadTasks = useCallback(async () => {
    try {
      const all = await fetchTasks(todayKey())
      setTasks(all.filter((t) => t.status !== "completed"))
    } catch (e) {
      console.error("Failed to load tasks:", e)
    }
  }, [])

  return {
    tasks,
    selectedTaskId,
    customTaskName,
    selectedTask,
    taskName,
    loadTasks,
    setSelectedTaskId,
    setCustomTaskName,
  }
}
