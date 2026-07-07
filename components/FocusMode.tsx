"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Timer, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { POMODORO_PRESETS } from "@/lib/constants";
import { useFocusTimer } from "@/lib/hooks/useFocusTimer";
import {
  useFocusInterruptions,
  INTERRUPTION_TYPES,
  FocusInterruption,
} from "@/lib/hooks/useFocusInterruptions";
import { FocusInterruptionDialog } from "@/components/focus";
import { createInterruption } from "@/lib/db-client";
import type { InterruptionType } from "@/lib/types";

function formatMMSS(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function FocusMode() {
  const timer = useFocusTimer();
  const interruptions = useFocusInterruptions();
  const { interruptStartRef, setShowInterrupt } = interruptions;

  function openInterruptDialog() {
    timer.clearTimer();
    interruptStartRef.current = Date.now();
    setShowInterrupt(true);
  }

  function saveInterruption() {
    const rawDuration = interruptions.interruptStartRef.current
      ? Math.round((Date.now() - interruptions.interruptStartRef.current) / 1000)
      : undefined;

    const entry: FocusInterruption = {
      id: Date.now(),
      type: interruptions.interruptType as InterruptionType,
      note: interruptions.interruptNote.trim(),
      timestamp: Date.now(),
      duration: rawDuration,
      sessionId: null,
    };
    interruptions.addLocalInterruption(entry);

    createInterruption({
      sessionId: null,
      type: interruptions.interruptType,
      cause: interruptions.interruptNote.trim(),
      duration: rawDuration ?? 0,
      note: interruptions.interruptNote.trim(),
      timestamp: new Date().toISOString(),
      recoveryTime: 0,
      severity: "low",
    }).catch((e) => console.error("Failed to save interruption:", e));

    interruptions.clearInterruptInputs();
    timer.resumeTimer();
  }

  function skipAndResume() {
    interruptions.setShowInterrupt(false);
    timer.resumeTimer();
  }

  return (
    <>
      <Card className={undefined}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[14px] font-medium flex items-center gap-1.5">
              <Timer size={14} className="text-[hsl(var(--muted))]" />
              Focus mode
            </CardTitle>
            <div className="flex items-center gap-2">
              {timer.completedPomodoros > 0 && (
                <span className="flex items-center gap-1 text-[12px] text-[hsl(var(--muted))]">
                  <CheckCircle2
                    size={12}
                    className="text-[hsl(var(--success))]"
                  />
                  {timer.completedPomodoros} done
                </span>
              )}
              <Select
                value={timer.preset.label}
                onValueChange={timer.changePreset}
                disabled={timer.phase !== "idle"}
              >
                <SelectTrigger className="h-7 w-24 text-[12px] border-[hsl(var(--hairline))] hover:border-[hsl(var(--hairline-strong))] transition-colors focus:ring-1 focus:ring-[hsl(var(--ring))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POMODORO_PRESETS.map((p) => (
                    <SelectItem
                      key={p.label}
                      value={p.label}
                      className="text-[12px]"
                    >
                      {p.label} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="6"
                  opacity="0.2"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke={
                    timer.phase === "break"
                      ? "hsl(var(--success))"
                      : "hsl(var(--primary))"
                  }
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - timer.progress / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[22px] font-normal tabular-nums tracking-[-0.11px] text-[hsl(var(--body-strong))]">
                  {formatMMSS(timer.secondsLeft)}
                </span>
                <span className="text-[10px] text-[hsl(var(--muted))] mt-0.5 font-semibold uppercase tracking-[0.08em]">
                  {timer.phase === "idle"
                    ? "ready"
                    : timer.phase === "work"
                      ? "focus"
                      : "break"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {timer.phase === "idle" ? (
              <Button
                className="flex-1 h-9 font-medium transition-all hover:scale-[1.01] active:scale-[0.98]"
                onClick={timer.startWork}
              >
                <Zap size={14} className="mr-1.5" />
                Start focus
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="flex-1 h-9 border-[hsl(var(--error))]/40 text-[hsl(var(--error))] hover:bg-[hsl(var(--error))]/8 hover:border-[hsl(var(--error))]/60 transition-all"
                  onClick={timer.stopSession}
                >
                  Stop
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-9 border-[hsl(var(--timeline-thinking))]/50 text-[hsl(var(--body-strong))] hover:bg-[hsl(var(--timeline-thinking))]/10 transition-all"
                  onClick={openInterruptDialog}
                >
                  <AlertCircle size={13} className="mr-1.5" />
                  Interrupted
                </Button>
              </>
            )}
          </div>

          {interruptions.localInterruptions.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-[hsl(var(--hairline))]">
              <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted))] font-semibold pt-1">
                Today{'\u2019'}s interruptions
              </p>
              {interruptions.localInterruptions.slice(0, 3).map((item) => {
                const t = INTERRUPTION_TYPES.find(
                  (x) => x.value === item.type,
                )!;
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 py-1"
                  >
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${t.color}`}
                    >
                      {t.label}
                    </span>
                    <span className="text-[12px] text-[hsl(var(--muted))] truncate">
                      {item.note || "No note"}
                    </span>
                    {item.duration && (
                      <span className="text-[10px] text-[hsl(var(--muted))] shrink-0 ml-auto">
                        {Math.round(item.duration / 60)}m
                      </span>
                    )}
                  </div>
                );
              })}
              {interruptions.localInterruptions.length > 3 && (
                <p className="text-[10px] text-[hsl(var(--muted))]">
                  +{interruptions.localInterruptions.length - 3} more
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <FocusInterruptionDialog
        open={interruptions.showInterrupt}
        onOpenChange={interruptions.setShowInterrupt}
        interruptType={interruptions.interruptType}
        setInterruptType={interruptions.setInterruptType}
        interruptNote={interruptions.interruptNote}
        setInterruptNote={interruptions.setInterruptNote}
        onSave={saveInterruption}
        onSkip={skipAndResume}
      />
    </>
  );
}
