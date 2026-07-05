"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Timer, AlertTriangle } from "lucide-react";
import { INTERRUPTION_TYPE_META } from "@/lib/constants";
import type { InterruptionType, InterruptionSeverity } from "@/lib/types";
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

// ── Component ────────────────────────────────────────────────────────────────

export default function TimerCard() {
  const t = useTimer();

  useEffect(() => {
    t.loadTasks();
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
            <TimerModeToggle t={t} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Big time display + pomodoro counter + status message */}
          <TimerDisplay t={t} />

          {/* Task selector — visible in idle / ready */}
          <TimerTaskSelector t={t} />

          {/* Tag input */}
          <TimerTagInput t={t} />

          {/* Pomodoro preset selector — only when idle */}
          <TimerPomodoroPresets t={t} />

          {/* Error */}
          {t.error && (
            <p className="flex items-center gap-1.5 text-[12px] text-[hsl(var(--error))]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {t.error}
            </p>
          )}

          {/* Distraction log panel (idle, has interruptions today) */}
          <TimerInterruptionSummary t={t} />

          {/* Controls */}
          <TimerControls t={t} />
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
