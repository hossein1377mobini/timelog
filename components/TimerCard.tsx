"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Timer,
  Zap,
  Clock,
  AlertTriangle,
  Coffee,
  SkipForward,
} from "lucide-react";
import { POMODORO_PRESETS, INTERRUPTION_TYPE_META } from "@/lib/constants";
import type { InterruptionType, InterruptionSeverity } from "@/lib/types";
import { useTimer } from "@/lib/hooks/useTimer";

// ── Component ────────────────────────────────────────────────────────────────

export default function TimerCard() {
  const t = useTimer();

  useEffect(() => {
    t.loadTasks();
    window.addEventListener("storage", t.loadTasks);
    return () => window.removeEventListener("storage", t.loadTasks);
  }, [t.loadTasks]);

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
                onClick={() => t.handleModeChange("standard")}
                disabled={t.isActive}
                className={[
                  "px-2.5 py-1 rounded text-[11px] font-medium transition-colors",
                  t.mode === "standard"
                    ? "bg-[hsl(var(--surface-card))] text-[hsl(var(--body-strong))] shadow-sm"
                    : "text-[hsl(var(--muted))] hover:text-[hsl(var(--body))]",
                  t.isActive ? "opacity-40 cursor-not-allowed" : "",
                ].join(" ")}
              >
                Standard
              </button>
              <button
                onClick={() => t.handleModeChange("pomodoro")}
                disabled={t.isActive}
                className={[
                  "px-2.5 py-1 rounded text-[11px] font-medium transition-colors",
                  t.mode === "pomodoro"
                    ? "bg-[hsl(var(--surface-card))] text-[hsl(var(--body-strong))] shadow-sm"
                    : "text-[hsl(var(--muted))] hover:text-[hsl(var(--body))]",
                  t.isActive ? "opacity-40 cursor-not-allowed" : "",
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
              t.timerState === "break"
                ? "text-[hsl(var(--success))] bg-[hsl(var(--success)/0.08)]"
                : t.timerState === "running"
                  ? "text-[hsl(var(--body-strong))] bg-[hsl(var(--canvas-soft))]"
                  : "text-[hsl(var(--body-strong))] bg-[hsl(var(--canvas-soft))]",
              t.flashActive ? "bg-[hsl(var(--primary)/0.15)]" : "",
            ].join(" ")}
          >
            {t.timeDisplay}
          </div>

          {/* Pomodoro counter */}
          {t.mode === "pomodoro" &&
            (t.timerState === "running" ||
              t.timerState === "break" ||
              t.timerState === "paused") && (
              <div className="flex items-center justify-center gap-1.5 text-[13px] text-[hsl(var(--muted))]">
                <span className="text-base">🍅</span>
                <span>×</span>
                <span className="font-semibold text-[hsl(var(--body-strong))]">
                  {t.pomodoroCount}
                </span>
                <span className="ml-1">completed this session</span>
              </div>
            )}

          {/* Status message */}
          {t.statusMessage() && (
            <p className="text-center text-[13px] text-[hsl(var(--muted))] flex items-center justify-center gap-1.5">
              {t.timerState === "break" ? (
                <Coffee className="w-3.5 h-3.5 text-[hsl(var(--success))]" />
              ) : t.timerState === "running" ? (
                <Zap className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-[hsl(var(--muted))]" />
              )}
              {t.statusMessage()}
            </p>
          )}

          {/* Task selector — visible in idle / ready */}
          {t.isSelectable && (
            <div className="space-y-2">
              {t.tasks.length > 0 && (
                <Select
                  value={t.selectedTaskId}
                  onValueChange={(v: string) => {
                    t.setSelectedTaskId(v);
                    t.setCustomTaskName("");
                    t.setError("");
                    if (t.timerState === "idle") {
                      // We need to set timerState to "ready" but that's internal to the hook
                      // The hook handles this via selectedTaskId change
                    }
                  }}
                >
                  <SelectTrigger className="h-10 text-[14px]">
                    <SelectValue placeholder="Select a task..." />
                  </SelectTrigger>
                  <SelectContent>
                    {t.tasks.map((task) => (
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
                  t.tasks.length > 0
                    ? "Or type a custom task name..."
                    : "Task name..."
                }
                value={t.selectedTask ? t.selectedTask.title : t.customTaskName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (!t.selectedTaskId) {
                    t.setCustomTaskName(e.target.value);
                  }
                  t.setError("");
                }}
                readOnly={!!t.selectedTaskId}
                className="h-9 text-[14px]"
              />
            </div>
          )}

          {/* Tag input */}
          {!t.isActive && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag (e.g. deep-work)"
                  value={t.newTag}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    t.setNewTag(e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") t.handleAddTag();
                  }}
                  className="h-8 text-[12px]"
                />
                <Button
                  variant="outline"
                  onClick={t.handleAddTag}
                  className="h-8 px-2 shrink-0 text-[12px]"
                >
                  Add
                </Button>
              </div>

              {t.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {t.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer text-[11px] hover:opacity-70"
                      onClick={() => t.handleRemoveTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Running tags (read-only) */}
          {t.isActive && t.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {t.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[11px]">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Pomodoro preset selector — only when idle */}
          {t.mode === "pomodoro" && t.timerState === "idle" && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-[hsl(var(--muted))] font-medium uppercase tracking-wide">
                Work / Break
              </p>
              <div className="flex gap-2">
                {POMODORO_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => t.handlePresetChange(p)}
                    className={[
                      "flex-1 py-2 rounded-md text-[12px] font-medium border transition-colors",
                      t.preset.label === p.label
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
          {t.error && (
            <p className="flex items-center gap-1.5 text-[12px] text-[hsl(var(--error))]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {t.error}
            </p>
          )}

          {/* Distraction log panel (idle, has interruptions today) */}
          {t.timerState === "idle" &&
            t.todayInterruptions.length > 0 &&
            (() => {
              const counts: Record<string, number> = {};
              for (const i of t.todayInterruptions)
                counts[i.type] = (counts[i.type] || 0) + 1;
              const topType = Object.entries(counts).sort(
                (a, b) => b[1] - a[1],
              )[0];
              const totalMins = Math.round(
                t.todayInterruptions.reduce(
                  (s: number, i: { duration: number }) => s + i.duration,
                  0,
                ) / 60,
              );
              const last3 = [...t.todayInterruptions].reverse().slice(0, 3);
              return (
                <div className="rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas-soft))] px-3 py-2.5 space-y-1.5">
                  <p className="text-[11px] font-semibold text-[hsl(var(--body-strong))] flex items-center gap-1">
                    📊 Today's interruptions
                    <span className="ml-1 rounded-full bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] px-1.5 py-0.5 text-[10px] font-bold">
                      {t.todayInterruptions.length}
                    </span>
                  </p>
                  <div className="border-t border-[hsl(var(--hairline))] pt-1.5 space-y-0.5">
                    <p className="text-[11px] text-[hsl(var(--muted))]">
                      Most common:{" "}
                      <span className="text-[hsl(var(--body))] font-medium">
                        {
                          INTERRUPTION_TYPE_META.find(
                            (x) => x.value === topType?.[0],
                          )?.emoji
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
                        const meta = INTERRUPTION_TYPE_META.find(
                          (x) => x.value === i.type,
                        );
                        const mins = Math.round(i.duration / 60);
                        const note = i.note
                          ? i.note.length > 28
                            ? i.note.slice(0, 28) + "..."
                            : i.note
                          : "—";
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted))]"
                          >
                            <span>{meta?.emoji ?? "•"}</span>
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
            {t.mode === "standard" && (
              <>
                {t.timerState === "idle" || t.timerState === "ready" ? (
                  <Button className="flex-1 gap-1.5" onClick={t.handleStart}>
                    <Play className="w-4 h-4" />
                    Start
                  </Button>
                ) : t.timerState === "running" ? (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 gap-1.5"
                      onClick={t.handlePause}
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </Button>
                    <Button
                      variant="destructive"
                      className="gap-1.5"
                      onClick={t.handleStopRequest}
                    >
                      <Square className="w-4 h-4" />
                      Stop
                    </Button>
                  </>
                ) : t.timerState === "paused" ? (
                  <>
                    <Button
                      className="flex-1 gap-1.5"
                      onClick={t.handleResume}
                    >
                      <Play className="w-4 h-4" />
                      Resume
                    </Button>
                    <Button
                      variant="destructive"
                      className="gap-1.5"
                      onClick={t.handleStopRequest}
                    >
                      <Square className="w-4 h-4" />
                      Stop
                    </Button>
                  </>
                ) : null}

                {(t.timerState === "paused" ||
                  t.timerState === "idle" ||
                  t.timerState === "ready") && (
                  <Button
                    variant="ghost"
                    className="gap-1.5 px-3"
                    onClick={t.handleReset}
                    disabled={
                      t.timerState === "idle" && t.elapsedSeconds === 0
                    }
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}

            {/* Pomodoro mode buttons */}
            {t.mode === "pomodoro" && (
              <>
                {t.timerState === "idle" || t.timerState === "ready" ? (
                  <Button
                    className="flex-1 gap-1.5"
                    onClick={t.handlePomodoroStart}
                  >
                    <Play className="w-4 h-4" />
                    Start
                  </Button>
                ) : t.timerState === "running" ? (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 gap-1.5"
                      onClick={t.handlePomodoroPause}
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </Button>
                    <Button
                      variant="destructive"
                      className="gap-1.5"
                      onClick={t.handleStopRequest}
                    >
                      <Square className="w-4 h-4" />
                      Stop
                    </Button>
                  </>
                ) : t.timerState === "paused" ? (
                  <>
                    <Button
                      className="flex-1 gap-1.5"
                      onClick={t.handlePomodoroResume}
                    >
                      <Play className="w-4 h-4" />
                      Resume
                    </Button>
                    <Button
                      variant="destructive"
                      className="gap-1.5"
                      onClick={t.handleStopRequest}
                    >
                      <Square className="w-4 h-4" />
                      Stop
                    </Button>
                  </>
                ) : t.timerState === "break" ? (
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={t.handleSkipBreak}
                  >
                    <SkipForward className="w-4 h-4" />
                    Skip Break
                  </Button>
                ) : null}

                {(t.timerState === "paused" ||
                  t.timerState === "idle" ||
                  t.timerState === "ready") && (
                  <Button
                    variant="ghost"
                    className="gap-1.5 px-3"
                    onClick={t.handleReset}
                    disabled={t.timerState === "idle"}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}

            {/* Interrupted button — visible when running */}
            {t.timerState === "running" && (
              <Button
                variant="outline"
                className="gap-1.5 text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.4)] hover:bg-[hsl(var(--warning)/0.08)]"
                onClick={() => t.setInterruptOpen(true)}
              >
                <AlertTriangle className="w-4 h-4" />
                Interrupted
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Interruption Dialog ──────────────────────────────────────────── */}
      <Dialog open={t.interruptOpen} onOpenChange={t.setInterruptOpen}>
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
                {INTERRUPTION_TYPE_META.map((tp) => (
                  <button
                    key={tp.value}
                    onClick={() =>
                      t.setInterruptType(tp.value as InterruptionType)
                    }
                    className={[
                      "flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium border transition-colors",
                      t.interruptType === tp.value
                        ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
                        : "bg-[hsl(var(--canvas-soft))] text-[hsl(var(--body))] border-[hsl(var(--hairline))] hover:border-[hsl(var(--hairline-strong))]",
                    ].join(" ")}
                  >
                    <span>{tp.emoji}</span>
                    <span>{tp.label}</span>
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
                value={t.interruptDuration}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  t.setInterruptDuration(
                    Math.max(0, Number(e.target.value)),
                  )
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
                value={t.interruptNote}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  t.setInterruptNote(e.target.value)
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
                      onClick={() => t.setInterruptSeverity(s)}
                      className={[
                        "px-3 py-1 rounded-full text-[12px] font-medium border capitalize transition-colors",
                        t.interruptSeverity === s
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
            <Button
              variant="ghost"
              onClick={() => t.setInterruptOpen(false)}
            >
              Skip
            </Button>
            <Button onClick={t.handleInterruptConfirm}>Log it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Rating Dialog ────────────────────────────────────────────────── */}
      <Dialog open={t.rateOpen} onOpenChange={t.setRateOpen}>
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
                  onClick={() => t.setRating(star)}
                  className={[
                    "text-3xl transition-transform hover:scale-110",
                    star <= t.rating ? "opacity-100" : "opacity-30",
                  ].join(" ")}
                >
                  ⭐
                </button>
              ))}
            </div>
            {t.rating > 0 && (
              <p className="text-center text-[12px] text-[hsl(var(--muted))]">
                {
                  [
                    "",
                    "Rough session",
                    "Below average",
                    "Average",
                    "Pretty good!",
                    "Excellent! 🚀",
                  ][t.rating]
                }
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => t.setRateOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={t.handleRateConfirm}>Save Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}