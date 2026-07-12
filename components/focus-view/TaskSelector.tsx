"use client";

import React from "react";
import {
  TimerTaskSelector,
  TimerTagInput,
  TimerPomodoroPresets,
} from "@/components/timer";

interface TaskSelectorProps {
  t: any;
  isActive: boolean;
  timerState: string;
}

export default function TaskSelector({ t, isActive, timerState }: TaskSelectorProps) {
  // Show ready-state start also for pomodoro mode
  const showPresets = timerState === "ready" && t.mode === "pomodoro";
  const showSelector = !isActive;

  if (!showSelector) return null;

  return (
    <div className="w-full max-w-md space-y-3">
      {showPresets && <TimerPomodoroPresets t={t} />}
      <TimerTaskSelector t={t} />
      <TimerTagInput t={t} />
    </div>
  );
}
