"use client"

/**
 * Timer hook — finite-state machine for focus sessions.
 *
 * Composes smaller focused hooks for task selection, timer controls,
 * pomodoro cycles, interruption dialogs, and rating dialogs into
 * one convenient API consumed by {@link FocusView} et al.
 */

import { useEffect, useRef, useState } from "react"
import { formatDuration, todayKey } from "@/lib/utils"
import { createSession, updateTask, createInterruption, fetchTasks, fetchInterruptions } from "@/lib/db-client"

import type { TimerState, TimerMode } from "./types"
import { useTaskSelector } from "./useTaskSelector"
import { usePomodoro, type PomodoroState } from "./usePomodoro"
import { useInterruptionDialog, type InterruptionDialogState } from "./useInterruptionDialog"
import { useRatingDialog, type RatingDialogState } from "./useRatingDialog"

export type { TimerState, TimerMode }

// ── Helpers ──────────────────────────────────────────────────────────────

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

// ── Hook ─────────────────────────────────────────────────────────────────

export function useTimer() {
  // State
  const [mode, setMode] = useState<TimerMode>("standard")
  const [timerState, setTimerState] = useState<TimerState>("idle")
  const [error, setError] = useState<string>("")

  // Intervals
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedSecondsRef = useRef<number>(0)

  // Derived sub-hooks
  const task = useTaskSelector()
  const pomodoro = usePomodoro({
    taskName: task.taskName,
    timerState,
    setTimerState,
    mode,
    setMode,
  })
  const interruption = useInterruptionDialog()
  const rating = useRatingDialog()

  // Done callback
  const doneCallbackRef = useRef<(() => void) | null>(null)

  // Elapsed seconds (managed for both modes)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)

  // Today's interruptions
  const [todayInterruptions, setTodayInterruptions] = useState<
    Array<{ type: string; duration: number; note: string; timestamp: string }>
  >([])

  // ── Derived ────────────────────────────────────────────────────────────

  const isSelectable = timerState === "idle" || timerState === "ready"
  const isActive = timerState === "running" || timerState === "paused" || timerState === "break"

  const timeDisplay: string =
    mode === "standard"
      ? formatDuration(elapsedSeconds)
      : formatCountdown(pomodoro.pomodoroSeconds)

  // ── Cleanup ────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // ── Auto-transition to "ready" when task is selected ────────────────────

  useEffect(() => {
    const t = setTimeout(() => {
      if (timerState === "idle" && task.taskName) {
        setTimerState("ready")
      } else if (timerState === "ready" && !task.taskName) {
        setTimerState("idle")
      }
    }, 0)
    return () => clearTimeout(t)
  }, [task.taskName, timerState])

  // ── Load tasks from DB ─────────────────────────────────────────────────

  useEffect(() => {
    task.loadTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Interval management ────────────────────────────────────────────────

  function clearTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // ── Standard timer controls ────────────────────────────────────────────

  function handleStart() {
    if (!task.taskName) {
      setError("Select a task or enter a name before starting.")
      return
    }
    setError("")
    startTimeRef.current = Date.now()
    pausedSecondsRef.current = 0
    setElapsedSeconds(0)
    setTimerState("running")
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(
        Math.floor((Date.now() - startTimeRef.current) / 1000) + pausedSecondsRef.current,
      )
    }, 1000)
  }

  function handlePause() {
    clearTimer()
    pausedSecondsRef.current = elapsedSeconds
    setTimerState("paused")
  }

  function handleResume() {
    startTimeRef.current = Date.now()
    setTimerState("running")
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(
        Math.floor((Date.now() - startTimeRef.current) / 1000) + pausedSecondsRef.current,
      )
    }, 1000)
  }

  function handleStopRequest() {
    clearTimer()
    rating.setRating(0)
    rating.setRateOpen(true)
  }

  // ── Session persistence ─────────────────────────────────────────────────

  async function handleRateConfirm() {
    const endTime = Date.now()
    const duration = elapsedSeconds

    try {
      await createSession({
        taskId: task.selectedTaskId || null,
        taskName: task.taskName,
        tags: tags,
        duration,
        durationFormatted: formatDuration(duration),
        startedAt: new Date(startTimeRef.current - pausedSecondsRef.current * 1000).toISOString(),
        endedAt: new Date(endTime).toISOString(),
        date: todayKey(),
        pomodoroCount: mode === "pomodoro" ? pomodoro.pomodoroCount : 0,
        productivityRating: rating.rating || null,
      })

      if (task.selectedTaskId) {
        await updateTask(task.selectedTaskId, {
          status: "completed",
          pomodoroCount: mode === "pomodoro" ? pomodoro.pomodoroCount : 0,
        })
      }

      await task.loadTasks()
    } catch (e) {
      console.error("Failed to save session:", e)
    }

    resetAll()
    rating.setRateOpen(false)
  }

  /** Save the session and reset without marking the task as completed. */
  async function handleDoneSession() {
    const endTime = Date.now()
    const duration = elapsedSeconds
    try {
      await createSession({
        taskId: task.selectedTaskId || null,
        taskName: task.taskName,
        tags: tags,
        duration,
        durationFormatted: formatDuration(duration),
        startedAt: new Date(startTimeRef.current - pausedSecondsRef.current * 1000).toISOString(),
        endedAt: new Date(endTime).toISOString(),
        date: todayKey(),
        pomodoroCount: mode === "pomodoro" ? pomodoro.pomodoroCount : 0,
        productivityRating: null,
      })
    } catch (e) {
      console.error("Failed to save session:", e)
    }
    resetAll()
    doneCallbackRef.current?.()
  }

  function handleReset() {
    clearTimer()
    resetAll()
  }

  function resetAll() {
    setTimerState("idle")
    setElapsedSeconds(0)
    pausedSecondsRef.current = 0
    startTimeRef.current = 0
    pomodoro.resetPomodoro()
    task.setSelectedTaskId("")
    task.setCustomTaskName("")
    setError("")
  }

  // ── Tags ────────────────────────────────────────────────────────────────

  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState<string>("")

  function handleAddTag() {
    const raw = newTag.trim()
    if (!raw) return
    const tag = raw.startsWith("#") ? raw.toLowerCase() : `#${raw.toLowerCase()}`
    if (!tags.includes(tag)) setTags([...tags, tag])
    setNewTag("")
  }

  function handleRemoveTag(tag: string) {
    if (timerState === "running") return
    setTags(tags.filter((t) => t !== tag))
  }

  // ── Interruption ────────────────────────────────────────────────────────

  async function handleInterruptConfirm() {
    try {
      await createInterruption({
        sessionId: null,
        type: interruption.interruptType,
        cause: interruption.interruptNote,
        duration: interruption.interruptDuration * 60,
        note: interruption.interruptNote,
        timestamp: new Date().toISOString(),
        recoveryTime: 0,
        severity: interruption.interruptSeverity,
      })
    } catch (e) {
      console.error("Failed to save interruption:", e)
    }
    interruption.setInterruptOpen(false)
    interruption.resetInterruption()
    task.loadTasks()
  }

  // ── Status message ──────────────────────────────────────────────────────

  function statusMessage(): string | null {
    if (timerState === "break") return "Break time! ☕"
    if (timerState === "running" && task.taskName) return `Working on: ${task.taskName}`
    if (timerState === "paused" && task.taskName) return `Paused — ${task.taskName}`
    if (timerState === "ready" && task.taskName) return `Ready: ${task.taskName}`
    return null
  }

  return {
    // Tasks (from useTaskSelector)
    tasks: task.tasks,
    selectedTaskId: task.selectedTaskId,
    setSelectedTaskId: task.setSelectedTaskId,
    customTaskName: task.customTaskName,
    setCustomTaskName: task.setCustomTaskName,
    selectedTask: task.selectedTask,
    taskName: task.taskName,
    loadTasks: task.loadTasks,

    // Tags (local)
    tags,
    newTag,
    setNewTag,
    handleAddTag,
    handleRemoveTag,

    // Timer
    mode,
    timerState,
    elapsedSeconds,
    isSelectable,
    isActive,
    timeDisplay,
    statusMessage,

    // Standard controls
    handleStart,
    handlePause,
    handleResume,
    handleStopRequest,
    handleReset,
    resetAll,

    // Pomodoro (from usePomodoro)
    preset: pomodoro.preset,
    pomodoroSeconds: pomodoro.pomodoroSeconds,
    pomodoroCount: pomodoro.pomodoroCount,
    flashActive: pomodoro.flashActive,
    handlePomodoroStart: pomodoro.handlePomodoroStart,
    handleSkipBreak: pomodoro.handleSkipBreak,
    handlePomodoroPause: pomodoro.handlePomodoroPause,
    handlePomodoroResume: pomodoro.handlePomodoroResume,
    handleModeChange: pomodoro.handleModeChange,
    handlePresetChange: pomodoro.handlePresetChange,

    // Error
    error,
    setError,

    // Interruption (from useInterruptionDialog)
    interruptOpen: interruption.interruptOpen,
    setInterruptOpen: interruption.setInterruptOpen,
    interruptType: interruption.interruptType,
    setInterruptType: interruption.setInterruptType,
    interruptNote: interruption.interruptNote,
    setInterruptNote: interruption.setInterruptNote,
    interruptSeverity: interruption.interruptSeverity,
    setInterruptSeverity: interruption.setInterruptSeverity,
    interruptDuration: interruption.interruptDuration,
    setInterruptDuration: interruption.setInterruptDuration,
    handleInterruptConfirm,
    todayInterruptions,

    // Rating (from useRatingDialog)
    rateOpen: rating.rateOpen,
    setRateOpen: rating.setRateOpen,
    rating: rating.rating,
    setRating: rating.setRating,
    handleRateConfirm,

    // Done session
    handleDoneSession,
    doneCallbackRef,
  }
}
