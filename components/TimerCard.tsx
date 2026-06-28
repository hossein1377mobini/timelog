"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getTasksForDate,
  addSession,
  updateTask,
  addInterruption,
  dispatchStorageEvent,
} from "@/lib/storage";
import type { Task, InterruptionType, InterruptionSeverity } from "@/lib/types";
import { todayKey, formatDuration } from "@/lib/types";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Timer,
  Zap,
  AlertTriangle,
  Coffee,
  SkipForward,
  Clock,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type TimerState = "idle" | "ready" | "running" | "paused" | "break";
type TimerMode = "standard" | "pomodoro";

interface PomodoroPreset {
  label: string;
  work: number;
  break: number;
}

const POMODORO_PRESETS: PomodoroPreset[] = [
  { label: "25 / 5", work: 25, break: 5 },
  { label: "50 / 10", work: 50, break: 10 },
  { label: "90 / 20", work: 90, break: 20 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ── Interruption analytics helper ───────────────────────────────────────────

function getTodayInterruptions() {
  if (typeof window === "undefined") return [];
  try {
    const all = JSON.parse(
      localStorage.getItem("compass_interruptions") || "[]",
    );
    const today = new Date().toISOString().slice(0, 10);
    return all.filter(
      (i: { timestamp: string }) => i.timestamp.slice(0, 10) === today,
    );
  } catch {
    return [];
  }
}

const INTERRUPT_TYPES = [
  { value: "distraction", emoji: "📱", label: "Distraction" },
  { value: "external", emoji: "👤", label: "External" },
  { value: "thought", emoji: "🧠", label: "Thought" },
  { value: "break", emoji: "😴", label: "Break" },
  { value: "admin", emoji: "📋", label: "Admin" },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export default function TimerCard() {
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
  const [preset, setPreset] = useState<PomodoroPreset>(POMODORO_PRESETS[0]);
  const [pomodoroSeconds, setPomodoroSeconds] = useState<number>(
    POMODORO_PRESETS[0].work * 60,
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

  // Today's interruptions (for analytics panel)
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

  // ── Load tasks ──────────────────────────────────────────────────────────────

  useEffect(() => {
    function onStorage() {
      const all = getTasksForDate(todayKey());
      setTasks(all.filter((t) => t.status !== "completed"));
      setTodayInterruptions(getTodayInterruptions());
    }
    window.addEventListener("storage", onStorage);
    onStorage(); // initial load after mount
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId),
    [tasks, selectedTaskId],
  );

  const taskName: string = selectedTask?.title || customTaskName.trim();

  // ── Interval management ─────────────────────────────────────────────────────

  function clearTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  // ── Standard timer controls ─────────────────────────────────────────────────

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

  function handleRateConfirm() {
    const endTime = Date.now();
    const duration = elapsedSeconds;

    addSession({
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
      updateTask(selectedTaskId, {
        status: "completed",
        pomodoroCount: mode === "pomodoro" ? pomodoroCount : 0,
      });
    }

    dispatchStorageEvent();
    setTasks(
      getTasksForDate(todayKey()).filter((t) => t.status !== "completed"),
    );
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

  // ── Pomodoro timer controls ─────────────────────────────────────────────────

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
          // Work phase complete → start break
          triggerWorkComplete();
          return preset.break * 60;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function triggerWorkComplete() {
    clearTimer();
    setPomodoroCount((c) => c + 1);
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 800);
    setTimerState("break");
    intervalRef.current = setInterval(() => {
      setPomodoroSeconds((prev) => {
        if (prev <= 1) {
          // Break complete → ready for next round
          clearTimer();
          setTimerState("ready");
          return preset.work * 60;
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

  // ── Tags ────────────────────────────────────────────────────────────────────

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

  // ── Interruption ────────────────────────────────────────────────────────────

  function handleInterruptConfirm() {
    addInterruption({
      sessionId: null,
      type: interruptType,
      cause: interruptNote,
      duration: interruptDuration * 60,
      note: interruptNote,
      timestamp: new Date().toISOString(),
      recoveryTime: 0,
      severity: interruptSeverity,
    });
    setInterruptOpen(false);
    setInterruptNote("");
    setInterruptType("distraction");
    setInterruptSeverity("low");
    setInterruptDuration(5);
    setTodayInterruptions(getTodayInterruptions());
  }

  // ── Mode toggle ─────────────────────────────────────────────────────────────

  function handleModeChange(m: TimerMode) {
    if (timerState !== "idle") return;
    setMode(m);
    setPomodoroSeconds(preset.work * 60);
    setPomodoroCount(0);
  }

  // ── Preset selection ────────────────────────────────────────────────────────

  function handlePresetChange(p: PomodoroPreset) {
    if (timerState !== "idle") return;
    setPreset(p);
    setPomodoroSeconds(p.work * 60);
  }

  // ── Display helpers ─────────────────────────────────────────────────────────

  const isSelectable = timerState === "idle" || timerState === "ready";
  const isActive =
    timerState === "running" ||
    timerState === "paused" ||
    timerState === "break";

  const timeDisplay: string =
    mode === "standard"
      ? formatDuration(elapsedSeconds)
      : formatCountdown(pomodoroSeconds);

  function statusMessage(): string | null {
    if (timerState === "break") return "Break time! ☕";
    if (timerState === "running" && taskName) return `Working on: ${taskName}`;
    if (timerState === "paused" && taskName) return `Paused — ${taskName}`;
    if (timerState === "ready" && taskName) return `Ready: ${taskName}`;
    return null;
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-[14px] font-medium">
              <Timer className="w-4 h-4 text-[hsl(var(--primary))]" />
              Timer
            </CardTitle>

            {/* Mode toggle */}
            <div className="flex gap-1 rounded-md border border-[hsl(var(--hairline))] p-0.5 bg-[hsl(var(--canvas-soft))]">
              <button
                onClick={() => handleModeChange("standard")}
                disabled={isActive}
                className={[
                  "px-2.5 py-1 rounded text-[11px] font-medium transition-colors",
                  mode === "standard"
                    ? "bg-[hsl(var(--surface-card))] text-[hsl(var(--body-strong))] shadow-sm"
                    : "text-[hsl(var(--muted))] hover:text-[hsl(var(--body))]",
                  isActive ? "opacity-40 cursor-not-allowed" : "",
                ].join(" ")}
              >
                Standard
              </button>
              <button
                onClick={() => handleModeChange("pomodoro")}
                disabled={isActive}
                className={[
                  "px-2.5 py-1 rounded text-[11px] font-medium transition-colors",
                  mode === "pomodoro"
                    ? "bg-[hsl(var(--surface-card))] text-[hsl(var(--body-strong))] shadow-sm"
                    : "text-[hsl(var(--muted))] hover:text-[hsl(var(--body))]",
                  isActive ? "opacity-40 cursor-not-allowed" : "",
                ].join(" ")}
              >
                🍅 Pomodoro
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Big time display */}
          <div
            className={[
              "text-5xl font-mono font-bold text-center py-6 rounded-lg transition-all duration-300",
              timerState === "break"
                ? "text-[hsl(var(--success))] bg-[hsl(var(--success)/0.08)]"
                : timerState === "running"
                  ? "text-[hsl(var(--body-strong))] bg-[hsl(var(--canvas-soft))]"
                  : "text-[hsl(var(--body-strong))] bg-[hsl(var(--canvas-soft))]",
              flashActive ? "bg-[hsl(var(--primary)/0.15)]" : "",
            ].join(" ")}
          >
            {timeDisplay}
          </div>

          {/* Pomodoro counter */}
          {mode === "pomodoro" &&
            (timerState === "running" ||
              timerState === "break" ||
              timerState === "paused") && (
              <div className="flex items-center justify-center gap-1.5 text-[13px] text-[hsl(var(--muted))]">
                <span className="text-base">🍅</span>
                <span>×</span>
                <span className="font-semibold text-[hsl(var(--body-strong))]">
                  {pomodoroCount}
                </span>
                <span className="ml-1">completed this session</span>
              </div>
            )}

          {/* Status message */}
          {statusMessage() && (
            <p className="text-center text-[13px] text-[hsl(var(--muted))] flex items-center justify-center gap-1.5">
              {timerState === "break" ? (
                <Coffee className="w-3.5 h-3.5 text-[hsl(var(--success))]" />
              ) : timerState === "running" ? (
                <Zap className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-[hsl(var(--muted))]" />
              )}
              {statusMessage()}
            </p>
          )}

          {/* Task selector — visible in idle / ready */}
          {isSelectable && (
            <div className="space-y-2">
              {tasks.length > 0 && (
                <Select
                  value={selectedTaskId}
                  onValueChange={(v: string) => {
                    setSelectedTaskId(v);
                    setCustomTaskName("");
                    setError("");
                    if (timerState === "idle") setTimerState("ready");
                  }}
                >
                  <SelectTrigger className="h-10 text-[14px]">
                    <SelectValue placeholder="Select a task..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map((task) => (
                      <SelectItem
                        key={task.id}
                        value={task.id}
                        className="text-[13px]"
                      >
                        <span>{task.title}</span>
                        {task.estimatedTime > 0 && (
                          <span className="text-[10px] text-[hsl(var(--muted))] ml-1.5">
                            ({task.estimatedTime}m)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Input
                placeholder={
                  tasks.length > 0
                    ? "Or type a custom task name..."
                    : "Task name..."
                }
                value={selectedTask ? selectedTask.title : customTaskName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (!selectedTaskId) {
                    setCustomTaskName(e.target.value);
                    if (e.target.value.trim() && timerState === "idle") {
                      setTimerState("ready");
                    } else if (
                      !e.target.value.trim() &&
                      timerState === "ready"
                    ) {
                      setTimerState("idle");
                    }
                  }
                  setError("");
                }}
                readOnly={!!selectedTaskId}
                className="h-9 text-[14px]"
              />
            </div>
          )}

          {/* Tag input */}
          {!isActive && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag (e.g. deep-work)"
                  value={newTag}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewTag(e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") handleAddTag();
                  }}
                  className="h-8 text-[12px]"
                />
                <Button
                  variant="outline"
                  onClick={handleAddTag}
                  className="h-8 px-2 shrink-0 text-[12px]"
                >
                  Add
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer text-[11px] hover:opacity-70"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Running tags (read-only) */}
          {isActive && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[11px]">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Pomodoro preset selector — only when idle */}
          {mode === "pomodoro" && timerState === "idle" && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-[hsl(var(--muted))] font-medium uppercase tracking-wide">
                Work / Break
              </p>
              <div className="flex gap-2">
                {POMODORO_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handlePresetChange(p)}
                    className={[
                      "flex-1 py-2 rounded-md text-[12px] font-medium border transition-colors",
                      preset.label === p.label
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))]"
                        : "border-[hsl(var(--hairline))] text-[hsl(var(--muted))] hover:border-[hsl(var(--hairline-strong))] hover:text-[hsl(var(--body))]",
                    ].join(" ")}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="flex items-center gap-1.5 text-[12px] text-[hsl(var(--error))]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </p>
          )}

          {/* ── Distraction log panel (idle, has interruptions today) ── */}
          {timerState === "idle" &&
            todayInterruptions.length > 0 &&
            (() => {
              const counts: Record<string, number> = {};
              for (const i of todayInterruptions)
                counts[i.type] = (counts[i.type] || 0) + 1;
              const topType = Object.entries(counts).sort(
                (a, b) => b[1] - a[1],
              )[0];
              const totalMins = Math.round(
                todayInterruptions.reduce(
                  (s: number, i: { duration: number }) => s + i.duration,
                  0,
                ) / 60,
              );
              const last3 = [...todayInterruptions].reverse().slice(0, 3);
              return (
                <div className="rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas-soft))] px-3 py-2.5 space-y-1.5">
                  <p className="text-[11px] font-semibold text-[hsl(var(--body-strong))] flex items-center gap-1">
                    📊 Today&apos;s interruptions
                    <span className="ml-1 rounded-full bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] px-1.5 py-0.5 text-[10px] font-bold">
                      {todayInterruptions.length}
                    </span>
                  </p>
                  <div className="border-t border-[hsl(var(--hairline))] pt-1.5 space-y-0.5">
                    <p className="text-[11px] text-[hsl(var(--muted))]">
                      Most common:{" "}
                      <span className="text-[hsl(var(--body))] font-medium">
                        {
                          INTERRUPT_TYPES.find((t) => t.value === topType?.[0])
                            ?.emoji
                        }{" "}
                        {topType?.[0]} ({topType?.[1]}×)
                      </span>
                    </p>
                    <p className="text-[11px] text-[hsl(var(--muted))]">
                      Total time lost:{" "}
                      <span className="text-[hsl(var(--body))] font-medium">
                        {totalMins}m
                      </span>
                    </p>
                  </div>
                  <div className="space-y-0.5 pt-0.5">
                    {last3.map(
                      (
                        i: {
                          type: string;
                          duration: number;
                          note: string;
                          timestamp: string;
                        },
                        idx: number,
                      ) => {
                        const t = INTERRUPT_TYPES.find(
                          (x) => x.value === i.type,
                        );
                        const mins = Math.round(i.duration / 60);
                        const note = i.note
                          ? i.note.length > 28
                            ? i.note.slice(0, 28) + "…"
                            : i.note
                          : "—";
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted))]"
                          >
                            <span>{t?.emoji ?? "•"}</span>
                            <span className="capitalize">{i.type}</span>
                            <span className="text-[hsl(var(--hairline-strong))]">
                              ·
                            </span>
                            <span className="flex-1 truncate">{note}</span>
                            <span className="shrink-0 text-[10px]">
                              {mins}m
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              );
            })()}

          {/* Controls */}
          <div className="flex gap-2 pt-1">
            {/* Standard mode buttons */}
            {mode === "standard" && (
              <>
                {timerState === "idle" || timerState === "ready" ? (
                  <Button className="flex-1 gap-1.5" onClick={handleStart}>
                    <Play className="w-4 h-4" />
                    Start
                  </Button>
                ) : timerState === "running" ? (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 gap-1.5"
                      onClick={handlePause}
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </Button>
                    <Button
                      variant="destructive"
                      className="gap-1.5"
                      onClick={handleStopRequest}
                    >
                      <Square className="w-4 h-4" />
                      Stop
                    </Button>
                  </>
                ) : timerState === "paused" ? (
                  <>
                    <Button className="flex-1 gap-1.5" onClick={handleResume}>
                      <Play className="w-4 h-4" />
                      Resume
                    </Button>
                    <Button
                      variant="destructive"
                      className="gap-1.5"
                      onClick={handleStopRequest}
                    >
                      <Square className="w-4 h-4" />
                      Stop
                    </Button>
                  </>
                ) : null}

                {(timerState === "paused" ||
                  timerState === "idle" ||
                  timerState === "ready") && (
                  <Button
                    variant="ghost"
                    className="gap-1.5 px-3"
                    onClick={handleReset}
                    disabled={timerState === "idle" && elapsedSeconds === 0}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}

            {/* Pomodoro mode buttons */}
            {mode === "pomodoro" && (
              <>
                {timerState === "idle" || timerState === "ready" ? (
                  <Button
                    className="flex-1 gap-1.5"
                    onClick={handlePomodoroStart}
                  >
                    <Play className="w-4 h-4" />
                    Start
                  </Button>
                ) : timerState === "running" ? (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 gap-1.5"
                      onClick={handlePomodoroPause}
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </Button>
                    <Button
                      variant="destructive"
                      className="gap-1.5"
                      onClick={handleStopRequest}
                    >
                      <Square className="w-4 h-4" />
                      Stop
                    </Button>
                  </>
                ) : timerState === "paused" ? (
                  <>
                    <Button
                      className="flex-1 gap-1.5"
                      onClick={handlePomodoroResume}
                    >
                      <Play className="w-4 h-4" />
                      Resume
                    </Button>
                    <Button
                      variant="destructive"
                      className="gap-1.5"
                      onClick={handleStopRequest}
                    >
                      <Square className="w-4 h-4" />
                      Stop
                    </Button>
                  </>
                ) : timerState === "break" ? (
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={handleSkipBreak}
                  >
                    <SkipForward className="w-4 h-4" />
                    Skip Break
                  </Button>
                ) : null}

                {(timerState === "paused" ||
                  timerState === "idle" ||
                  timerState === "ready") && (
                  <Button
                    variant="ghost"
                    className="gap-1.5 px-3"
                    onClick={handleReset}
                    disabled={timerState === "idle"}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}

            {/* Interrupted button — visible when running */}
            {timerState === "running" && (
              <Button
                variant="outline"
                className="gap-1.5 text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.4)] hover:bg-[hsl(var(--warning)/0.08)]"
                onClick={() => setInterruptOpen(true)}
              >
                <AlertTriangle className="w-4 h-4" />
                Interrupted
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Interruption Dialog ─────────────────────────────────────────────── */}
      <Dialog open={interruptOpen} onOpenChange={setInterruptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🔀 Log Interruption
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Type pills */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                What happened?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {INTERRUPT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() =>
                      setInterruptType(t.value as InterruptionType)
                    }
                    className={[
                      "flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium border transition-colors",
                      interruptType === t.value
                        ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
                        : "bg-[hsl(var(--canvas-soft))] text-[hsl(var(--body))] border-[hsl(var(--hairline))] hover:border-[hsl(var(--hairline-strong))]",
                    ].join(" ")}
                  >
                    <span>{t.emoji}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                Duration (minutes)
              </label>
              <Input
                type="number"
                min={0}
                value={interruptDuration}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setInterruptDuration(Math.max(0, Number(e.target.value)))
                }
                className="h-9 text-[13px] w-28"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                Notes
              </label>
              <Textarea
                placeholder="What happened? e.g. social media, phone call..."
                value={interruptNote}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setInterruptNote(e.target.value)
                }
                className="text-[13px] resize-none"
                rows={3}
              />
            </div>

            {/* Severity pills */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                Severity
              </label>
              <div className="flex gap-1.5">
                {(["low", "medium", "high"] as InterruptionSeverity[]).map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => setInterruptSeverity(s)}
                      className={[
                        "px-3 py-1 rounded-full text-[12px] font-medium border capitalize transition-colors",
                        interruptSeverity === s
                          ? s === "low"
                            ? "bg-[hsl(var(--success))] text-white border-[hsl(var(--success))]"
                            : s === "medium"
                              ? "bg-[hsl(var(--warning))] text-white border-[hsl(var(--warning))]"
                              : "bg-[hsl(var(--error))] text-white border-[hsl(var(--error))]"
                          : "bg-[hsl(var(--canvas-soft))] text-[hsl(var(--body))] border-[hsl(var(--hairline))] hover:border-[hsl(var(--hairline-strong))]",
                      ].join(" ")}
                    >
                      {s}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setInterruptOpen(false)}>
              Skip
            </Button>
            <Button onClick={handleInterruptConfirm}>Log it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Rating Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={rateOpen} onOpenChange={setRateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>How did that session go?</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <p className="text-[13px] text-[hsl(var(--muted))] text-center">
              Rate your productivity for this session
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={[
                    "text-3xl transition-transform hover:scale-110",
                    star <= rating ? "opacity-100" : "opacity-30",
                  ].join(" ")}
                >
                  ⭐
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-[12px] text-[hsl(var(--muted))]">
                {
                  [
                    "",
                    "Rough session",
                    "Below average",
                    "Average",
                    "Pretty good!",
                    "Excellent! 🚀",
                  ][rating]
                }
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRateConfirm}>Save Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
