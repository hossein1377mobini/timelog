"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

function safeParseSessions(raw) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export default function TimerCard() {
  const [taskName, setTaskName] = useState("")
  const [todayTasks, setTodayTasks] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [tags, setTags] = useState([])
  const [newTag, setNewTag] = useState("")
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState("")

  const intervalRef = useRef(null)
  const startTimeRef = useRef(null)
  const runningTaskRef = useRef("")

useEffect(() => {
  loadTodayTasks()

  function refresh() {
    loadTodayTasks()
  }

  window.addEventListener("storage", refresh)

  return () => {
    clearInterval(intervalRef.current)
    window.removeEventListener("storage", refresh)
  }
}, [])

function loadTodayTasks() {
  const records = JSON.parse(
    localStorage.getItem("compass_daily_records") || "[]"
  )

  const today = new Date().toISOString().split("T")[0]

  const record = records.find(r => r.date === today)

  if (!record?.morning?.tasks) {
    setTodayTasks([])
    return
  }

  setTodayTasks(record.morning.tasks.filter(t => !t.done))
}

  function handleStart() {
    if (!taskName.trim()) {
      setError("Please enter a task name before starting.")
      return
    }

    setError("")
    setIsRunning(true)
    startTimeRef.current = Date.now()
    runningTaskRef.current = taskName
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1)
    }, 1000)
  }

  function handleStop() {
    clearInterval(intervalRef.current)
    setIsRunning(false)

    const endTime = Date.now()
    const duration = seconds

  const taskData = {
  id: startTimeRef.current,
  taskName: runningTaskRef.current,
  tags,
  duration,
  durationFormatted: formatTime(duration),
  startedAt: startTimeRef.current,
  endedAt: endTime,
  date: new Date().toISOString().split("T")[0],
  }

    const existing = safeParseSessions(localStorage.getItem("compass_sessions"))
    existing.unshift(taskData)
    localStorage.setItem("compass_sessions", JSON.stringify(existing))
    window.dispatchEvent(new Event("storage"))
    markTaskCompleted(runningTaskRef.current)

    setSeconds(0)
    setTaskName("")
    setTags([])
  }

function markTaskCompleted(taskText) {
  const records = JSON.parse(
    localStorage.getItem("compass_daily_records") || "[]"
  )

  const today = new Date().toISOString().split("T")[0]

  const record = records.find(r => r.date === today)

  if (!record?.morning?.tasks) return

  record.morning.tasks = record.morning.tasks.map(task =>
    task.text === taskText
      ? { ...task, done: true }
      : task
  )

  localStorage.setItem(
    "compass_daily_records",
    JSON.stringify(records)
  )

  window.dispatchEvent(new Event("storage"))
}

  function handleReset() {
    clearInterval(intervalRef.current)
    setIsRunning(false)
    setSeconds(0)
  }

  function handleAddTag() {
    if (!newTag.trim()) {
      setError("Tag cannot be empty.")
      return
    }

    const tag = newTag.trim().startsWith("#") ? newTag.trim() : `#${newTag.trim()}`
    if (!tags.includes(tag)) {
      setTags([...tags, tag])
    }
    setNewTag("")
    setError("")
  }

  function handleRemoveTag(tag) {
    setTags(tags.filter((t) => t !== tag))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-5xl font-mono font-bold text-center py-4">
          {formatTime(seconds)}
        </div>

<select
  value={taskName}
  onChange={(e) => {
    setTaskName(e.target.value)
    setError("")
  }}
  disabled={isRunning}
  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
>
  <option value="">Select a task...</option>

  {todayTasks.map((task) => (
    <option key={task.id} value={task.text}>
      {task.text}
    </option>
  ))}
</select>

        <div className="flex gap-2">
          <Input
            placeholder="Add tag"
            value={newTag}
            onChange={(e) => {
              setNewTag(e.target.value)
              setError("")
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
            disabled={isRunning}
          />
          <Button variant="outline" onClick={handleAddTag} disabled={isRunning}>
            Add
          </Button>
        </div>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => !isRunning && handleRemoveTag(tag)}
              >
                {tag} {!isRunning && "×"}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {!isRunning ? (
            <Button className="flex-1" onClick={handleStart} disabled={!taskName.trim()}>
              Start
            </Button>
          ) : (
            <Button className="flex-1" variant="destructive" onClick={handleStop}>
              Stop
            </Button>
          )}
          <Button variant="outline" onClick={handleReset} disabled={!isRunning}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}