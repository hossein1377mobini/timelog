"use client";
/**
 * React hook that encapsulates the entire focus-timer state machine.
 *
 * Supports two modes:
 * - **standard** – simple start / pause / resume / stop stopwatch
 * - **pomodoro** – work/break cycle with configurable presets
 *
 * The hook also manages task selection, tags, interruptions,
 * and productivity rating on session completion.
 *
 * MIGRATED: Now uses PostgreSQL via @/lib/db-client instead of localStorage.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import type { Task, InterruptionType, InterruptionSeverity } from "@/lib/types";
import { todayKey, formatDuration } from "@/lib/utils";
import {
  fetchTasks,
  createSession,
  updateTask,
  createInterruption as dbCreateInterruption,
  fetchInterruptions,
} from "@/lib/db-client";
import { POMODORO_PRESETS } from "@/lib/constants";
import type { PomodoroPreset } from "@/lib/constants";

// ── Types ────────────────────────────────────────────────────────────────────

/** Finite-state machine states for the timer UI. */
export type TimerState = "idle" | "ready" | "running" | "paused" | "break";
/** Timer operating mode. */
export type TimerMode = "standard" | "pomodoro";

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useTimer() {
  // Tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [customTaskName, setCustomTaskName] = useState<string>("");

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>("");

  // Timer mode + state
  const [mode, setMode] = useState<TimerMode>("standard");
  const [timerState, setTimerState] = useState<TimerState>("idle");

  // Standard: elapsed seconds
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Pomodoro
  const [preset, setPreset] = useState<PomodoroPreset>(POMODORO_PRESETS[0]!);
  const [pomodoroSeconds, setPomodoroSeconds] = useState<number>(
    POMODORO_PRESETS[0]!.work * 60,
  );
  const [pomodoroCount, setPomodoroCount] = useState<number>(0);
  const [flashActive, setFlashActive] = useState<boolean>(false);

  // Error
  const [error, setError] = useState<string>("");

  // Interruption dialog
  const [interruptOpen, setInterruptOpen] = useState<boolean>(false);
  const [interruptType, setInterruptType] =
    useState<InterruptionType>("distraction");
  const [interruptNote, setInterruptNote] = useState<string>("");
  const [interruptSeverity, setInterruptSeverity] =
    useState<InterruptionSeverity>("low");
  const [interruptDuration, setInterruptDuration] = useState<number>(5);

  // Today's interruptions
  const [todayInterruptions, setTodayInterruptions] = useState<
    Array<{ type: string; duration: number; note: string; timestamp: string }>
  >([]);

  // Rating dialog
  const [rateOpen, setRateOpen] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(0);

  // Refs
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedSecondsRef = useRef<number>(0);

  // Derived
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const taskName: string = selectedTask?.title || customTaskName.trim();
  const isSelectable = timerState === "idle" || timerState === "ready";
  const isActive =
    timerState === "running" ||
    timerState === "paused" ||
    timerState === "break";

  const timeDisplay: string =
    mode === "standard"
      ? formatDuration(elapsedSeconds)
      : formatCountdown(pomodoroSeconds);

  // ── Cleanup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ── Auto-transition to "ready" when task is selected ────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      if (timerState === "idle" && taskName) {
        setTimerState("ready");
      } else if (timerState === "ready" && !taskName) {
        setTimerState("idle");
      }
    }, 0);
    return () => clearTimeout(t);
  }, [taskName, timerState]);

  // ── Load tasks from DB ─────────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
    try {
      const all = await fetchTasks(todayKey());
      setTasks(all.filter((t) => t.status !== "completed"));

      // Load today's interruptions
      const today = new Date().toISOString().slice(0, 10);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);
      const interruptions = await fetchInterruptions(today, tomorrowStr);
      setTodayInterruptions(
        interruptions
          .filter((i) => i.timestamp.slice(0, 10) === today)
          .map((i) => ({ type: i.type, duration: i.duration, note: i.note, timestamp: i.timestamp })),
      );
    } catch (e) {
      console.error("Failed to load tasks:", e);
    }
  }, []);

  // ── Interval management ─────────────────────────────────────────────────
  function clearTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  // ── Standard timer controls ─────────────────────────────────────────────
  function handleStart() {
    if (!taskName) {
      setError("Select a task or enter a name before starting.");
      return;
    }
    setError("");
    startTimeRef.current = Date.now();
    pausedSecondsRef.current = 0;
    setElapsedSeconds(0);
    setTimerState("running");
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(
        Math.floor((Date.now() - startTimeRef.current) / 1000) +
          pausedSecondsRef.current,
      );
    }, 1000);
  }

  function handlePause() {
    clearTimer();
    pausedSecondsRef.current = elapsedSeconds;
    setTimerState("paused");
  }

  function handleResume() {
    startTimeRef.current = Date.now();
    setTimerState("running");
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(
        Math.floor((Date.now() - startTimeRef.current) / 1000) +
          pausedSecondsRef.current,
      );
    }, 1000);
  }

  function handleStopRequest() {
    clearTimer();
    setRating(0);
    setRateOpen(true);
  }

  async function handleRateConfirm() {
    const endTime = Date.now();
    const duration = elapsedSeconds;

    try {
      await createSession({
        taskId: selectedTaskId || null,
        taskName,
        tags,
        duration,
        durationFormatted: formatDuration(duration),
        startedAt: new Date(
          startTimeRef.current - pausedSecondsRef.current * 1000,
        ).toISOString(),
        endedAt: new Date(endTime).toISOString(),
        date: todayKey(),
        pomodoroCount: mode === "pomodoro" ? pomodoroCount : 0,
        productivityRating: rating || null,
      });

      if (selectedTaskId) {
        await updateTask(selectedTaskId, {
          status: "completed",
          pomodoroCount: mode === "pomodoro" ? pomodoroCount : 0,
        });
      }

      // Reload tasks from DB
      const all = await fetchTasks(todayKey());
      setTasks(all.filter((t) => t.status !== "completed"));
    } catch (e) {
      console.error("Failed to save session:", e);
    }

    resetAll();
    setRateOpen(false);
  }

  function handleReset() {
    clearTimer();
    resetAll();
  }

  function resetAll() {
    setTimerState("idle");
    setElapsedSeconds(0);
    pausedSecondsRef.current = 0;
    startTimeRef.current = 0;
    setPomodoroCount(0);
    setPomodoroSeconds(preset.work * 60);
    setSelectedTaskId("");
    setCustomTaskName("");
    setTags([]);
    setNewTag("");
    setError("");
  }

  // ── Pomodoro timer controls ─────────────────────────────────────────────
  function triggerWorkComplete() {
    clearTimer();
    setPomodoroCount((c) => c + 1);
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 800);
    setTimerState("break");
    intervalRef.current = setInterval(() => {
      setPomodoroSeconds((prev) => {
        if (prev <= 1) {
          clearTimer();
          setTimerState("ready");
          return preset.work * 60;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handlePomodoroStart() {
    if (!taskName) {
      setError("Select a task or enter a name before starting.");
      return;
    }
    setError("");
    startTimeRef.current = Date.now();
    pausedSecondsRef.current = 0;
    setElapsedSeconds(0);
    setPomodoroSeconds(preset.work * 60);
    setTimerState("running");
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(
        Math.floor((Date.now() - startTimeRef.current) / 1000) +
          pausedSecondsRef.current,
      );
      setPomodoroSeconds((prev) => {
        if (prev <= 1) {
          triggerWorkComplete();
          return preset.break * 60;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handleSkipBreak() {
    clearTimer();
    setPomodoroSeconds(preset.work * 60);
    setTimerState("ready");
  }

  function handlePomodoroPause() {
    clearTimer();
    pausedSecondsRef.current = elapsedSeconds;
    setTimerState("paused");
  }

  function handlePomodoroResume() {
    startTimeRef.current = Date.now();
    setTimerState("running");
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(
        Math.floor((Date.now() - startTimeRef.current) / 1000) +
          pausedSecondsRef.current,
      );
      setPomodoroSeconds((prev) => {
        if (prev <= 1) {
          triggerWorkComplete();
          return preset.break * 60;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // ── Tags ────────────────────────────────────────────────────────────────
  function handleAddTag() {
    const raw = newTag.trim();
    if (!raw) return;
    const tag = raw.startsWith("#")
      ? raw.toLowerCase()
      : `#${raw.toLowerCase()}`;
    if (!tags.includes(tag)) setTags([...tags, tag]);
    setNewTag("");
  }

  function handleRemoveTag(tag: string) {
    if (timerState === "running") return;
    setTags(tags.filter((t) => t !== tag));
  }

  // ── Interruption ────────────────────────────────────────────────────────
  async function handleInterruptConfirm() {
    try {
      await dbCreateInterruption({
        sessionId: null,
        type: interruptType,
        cause: interruptNote,
        duration: interruptDuration * 60,
        note: interruptNote,
        timestamp: new Date().toISOString(),
        recoveryTime: 0,
        severity: interruptSeverity,
      });
    } catch (e) {
      console.error("Failed to save interruption:", e);
    }
    setInterruptOpen(false);
    setInterruptNote("");
    setInterruptType("distraction");
    setInterruptSeverity("low");
    setInterruptDuration(5);
    // Reload today's interruptions
    loadTasks();
  }

  // ── Mode toggle ─────────────────────────────────────────────────────────
  function handleModeChange(m: TimerMode) {
    if (timerState !== "idle") return;
    setMode(m);
    setPomodoroSeconds(preset.work * 60);
    setPomodoroCount(0);
  }

  function handlePresetChange(p: PomodoroPreset) {
    if (timerState !== "idle") return;
    setPreset(p);
    setPomodoroSeconds(p.work * 60);
  }

  // ── Status message ──────────────────────────────────────────────────────
  function statusMessage(): string | null {
    if (timerState === "break") return "Break time! ☕";
    if (timerState === "running" && taskName) return `Working on: ${taskName}`;
    if (timerState === "paused" && taskName) return `Paused — ${taskName}`;
    if (timerState === "ready" && taskName) return `Ready: ${taskName}`;
    return null;
  }

  return {
    // Tasks
    tasks,
    selectedTaskId,
    setSelectedTaskId,
    customTaskName,
    setCustomTaskName,
    selectedTask,
    taskName,
    loadTasks,

    // Tags
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

    // Pomodoro
    preset,
    pomodoroSeconds,
    pomodoroCount,
    flashActive,
    handlePomodoroStart,
    handleSkipBreak,
    handlePomodoroPause,
    handlePomodoroResume,
    handleModeChange,
    handlePresetChange,

    // Error
    error,
    setError,

    // Interruption
    interruptOpen,
    setInterruptOpen,
    interruptType,
    setInterruptType,
    interruptNote,
    setInterruptNote,
    interruptSeverity,
    setInterruptSeverity,
    interruptDuration,
    setInterruptDuration,
    handleInterruptConfirm,
    todayInterruptions,

    // Rating
    rateOpen,
    setRateOpen,
    rating,
    setRating,
    handleRateConfirm,
  };
}
