"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Square,
  Zap,
  Coffee,
  AlertCircle,
} from "lucide-react";
import { useTimer } from "@/lib/hooks/useTimer";
import {
  TimerDisplay,
  TimerModeToggle,
  TimerTaskSelector,
  TimerTagInput,
  TimerPomodoroPresets,
  TimerInterruptionSummary,
  TimerControls,
} from "@/components/timer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { INTERRUPTION_TYPE_META } from "@/lib/constants";
import type { InterruptionType, InterruptionSeverity } from "@/lib/types";

interface FocusViewProps {
  preselectedTaskId?: string | null;
  preselectedTaskName?: string | null;
}

export default function FocusView({
  preselectedTaskId = null,
  preselectedTaskName = null,
}: {
  preselectedTaskId?: string | null;
  preselectedTaskName?: string | null;
}) {
  const t = useTimer();

  useEffect(() => {
    t.loadTasks();
  }, [t.loadTasks]);

  // Pre-select a task passed from Dashboard
  useEffect(() => {
    if (preselectedTaskId && t.tasks.length > 0) {
      const task = t.tasks.find((task) => task.id === preselectedTaskId);
      if (task) {
        t.setSelectedTaskId(task.id);
      }
    }
    if (preselectedTaskName) {
      t.setCustomTaskName(preselectedTaskName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedTaskId, preselectedTaskName, t.tasks]);

  const isActive = t.timerState === "running" || t.timerState === "paused" || t.timerState === "break";

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-200px)] justify-center">
      {/* Contextual display — what am I working on? */}
      {t.taskName && (
        <div className="text-center mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))] mb-1">
            Focusing on
          </p>
          <p className="text-[16px] font-medium text-[hsl(var(--body-strong))]">
            {t.taskName}
          </p>
          {t.tags.length > 0 && (
            <div className="flex justify-center gap-1.5 mt-2">
              {t.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Big timer display */}
      <div className="relative mb-8">
        {/* Progress ring for pomodoro mode */}
        {t.mode === "pomodoro" && isActive && (
          <svg
            className="absolute inset-0 -m-4 w-[calc(100%+32px)] h-[calc(100%+32px)] -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="2"
              opacity="0.15"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke={t.timerState === "break" ? "hsl(var(--success))" : "hsl(var(--primary))"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 46}`}
              strokeDashoffset={`${2 * Math.PI * 46 * (1 - t.pomodoroSeconds / (t.preset.work * 60))}`}
              className="transition-all duration-1000"
            />
          </svg>
        )}

        <div className="text-center px-8 py-8">
          <span className="text-[56px] md:text-[72px] font-light tabular-nums tracking-[-2px] text-[hsl(var(--body-strong))]">
            {t.timeDisplay}
          </span>
          {t.statusMessage() && (
            <p className="text-[12px] text-[hsl(var(--muted))] mt-2">
              {t.statusMessage()}
            </p>
          )}
          {t.mode === "pomodoro" && t.pomodoroCount > 0 && (
            <p className="text-[11px] text-[hsl(var(--success))] mt-1 font-medium">
              {t.pomodoroCount} pomodoro{t.pomodoroCount !== 1 ? "s" : ""} completed
            </p>
          )}
        </div>
      </div>

      {/* Controls — big and touchable */}
      <div className="flex gap-3 mb-8">
        {!isActive && t.timerState !== "ready" && (
          <>
            {/* Mode toggle when idle */}
            <TimerModeToggle t={t} />
          </>
        )}

        {t.timerState === "ready" && (
          <>
            {t.mode === "pomodoro" && <TimerPomodoroPresets t={t} />}
            <Button
              size="lg"
              onClick={t.mode === "pomodoro" ? t.handlePomodoroStart : t.handleStart}
              className="h-12 px-8 text-[15px] font-medium"
            >
              <Zap size={16} className="mr-2" />
              Start
            </Button>
          </>
        )}

        {t.timerState === "running" && (
          <>
            <Button
              size="lg"
              variant="outline"
              onClick={t.handlePause}
              className="h-12 px-6"
            >
              <Pause size={16} className="mr-2" />
              Pause
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={t.handleStopRequest}
              className="h-12 px-6 border-[hsl(var(--error))]/40 text-[hsl(var(--error))]"
            >
              <Square size={16} className="mr-2" />
              Stop
            </Button>
          </>
        )}

        {t.timerState === "paused" && (
          <>
            <Button
              size="lg"
              onClick={t.mode === "pomodoro" ? t.handlePomodoroResume : t.handleResume}
              className="h-12 px-8"
            >
              <Play size={16} className="mr-2" fill="currentColor" />
              Resume
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={t.handleStopRequest}
              className="h-12 px-6 border-[hsl(var(--error))]/40 text-[hsl(var(--error))]"
            >
              <Square size={16} className="mr-2" />
              Stop
            </Button>
          </>
        )}

        {t.timerState === "break" && (
          <>
            <Button
              size="lg"
              variant="outline"
              onClick={t.handleSkipBreak}
              className="h-12 px-8"
            >
              <Coffee size={16} className="mr-2" />
              Skip Break
            </Button>
          </>
        )}
      </div>

      {/* Task selector + tags — only when not running */}
      {!isActive && (
        <div className="w-full max-w-md space-y-3">
          <TimerTaskSelector t={t} />
          <TimerTagInput t={t} />
          <TimerPomodoroPresets t={t} />
        </div>
      )}

      {/* Interruption quick-log — only when running */}
      {isActive && t.timerState !== "break" && (
        <Button
          variant="outline"
          onClick={() => t.setInterruptOpen(true)}
          className="h-9 px-4 text-[12px] border-[hsl(var(--warning))]/40 text-[hsl(var(--warning))]"
        >
          <AlertCircle size={13} className="mr-1.5" />
          Log Interruption
        </Button>
      )}

      {/* Today's interruptions summary */}
      {t.todayInterruptions.length > 0 && (
        <div className="w-full max-w-md mt-6">
          <TimerInterruptionSummary t={t} />
        </div>
      )}

      {/* Error */}
      {t.error && (
        <p className="text-[12px] text-[hsl(var(--error))] mt-4">{t.error}</p>
      )}

      {/* ── Interruption Dialog ──────────────────────────────────────────── */}
      <Dialog open={t.interruptOpen} onOpenChange={t.setInterruptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Log Interruption
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                What happened?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {INTERRUPTION_TYPE_META.map((tp) => (
                  <button
                    key={tp.value}
                    onClick={() => t.setInterruptType(tp.value as InterruptionType)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium border transition-colors ${
                      t.interruptType === tp.value
                        ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
                        : "bg-[hsl(var(--canvas-soft))] text-[hsl(var(--body))] border-[hsl(var(--hairline))]"
                    }`}
                  >
                    <span>{tp.emoji}</span>
                    <span>{tp.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                Duration (minutes)
              </label>
              <Input
                type="number"
                min={0}
                value={t.interruptDuration}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => t.setInterruptDuration(Math.max(0, Number(e.target.value)))}
                className="h-9 text-[13px] w-28"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                Notes
              </label>
              <Textarea
                placeholder="What happened?"
                value={t.interruptNote}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => t.setInterruptNote(e.target.value)}
                className="text-[13px] resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                Severity
              </label>
              <div className="flex gap-1.5">
                {(["low", "medium", "high"] as InterruptionSeverity[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => t.setInterruptSeverity(s)}
                    className={`px-3 py-1 rounded-full text-[12px] font-medium border capitalize transition-colors ${
                      t.interruptSeverity === s
                        ? s === "low"
                          ? "bg-[hsl(var(--success))] text-white border-[hsl(var(--success))]"
                          : s === "medium"
                            ? "bg-[hsl(var(--warning))] text-white border-[hsl(var(--warning))]"
                            : "bg-[hsl(var(--error))] text-white border-[hsl(var(--error))]"
                        : "bg-[hsl(var(--canvas-soft))] text-[hsl(var(--body))] border-[hsl(var(--hairline))]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => t.setInterruptOpen(false)}>
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
                  className={`text-3xl transition-transform hover:scale-110 ${
                    star <= t.rating ? "opacity-100" : "opacity-30"
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
            {t.rating > 0 && (
              <p className="text-center text-[12px] text-[hsl(var(--muted))]">
                {["", "Rough session", "Below average", "Average", "Pretty good!", "Excellent! 🚀"][t.rating]}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => t.setRateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={t.handleRateConfirm}>Save Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
