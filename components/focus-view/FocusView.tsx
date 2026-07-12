"use client";

import React, { useEffect } from "react";
import { useTimer } from "@/lib/hooks/useTimer";
import { TimerModeToggle, TimerPomodoroPresets, TimerControls } from "@/components/timer";
import TimerSection from "./TimerSection";
import TaskSelector from "./TaskSelector";
import InterruptionSummary from "./InterruptionSummary";
import InterruptionDialog from "./InterruptionDialog";
import RatingDialog from "./RatingDialog";

interface FocusViewProps {
  preselectedTaskId?: string | null;
  preselectedTaskName?: string | null;
  onDone?: () => void;
}

export default function FocusView({
  preselectedTaskId = null,
  preselectedTaskName = null,
  onDone,
}: FocusViewProps) {
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

  // Wire up the Done callback
  useEffect(() => {
    t.doneCallbackRef.current = onDone ?? null;
    return () => { t.doneCallbackRef.current = null; };
  }, [onDone, t.doneCallbackRef]);

  const isActive = t.timerState === "running" || t.timerState === "paused" || t.timerState === "break";

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-200px)] justify-center">
      <TimerSection
        timeDisplay={t.timeDisplay}
        statusMessage={t.statusMessage}
        mode={t.mode}
        timerState={t.timerState}
        pomodoroSeconds={t.pomodoroSeconds}
        preset={t.preset}
        pomodoroCount={t.pomodoroCount}
        isActive={isActive}
        taskName={t.taskName}
        tags={t.tags}
      />

      {/* Controls — big and touchable */}
      <TimerControls t={t} />

      {/* Task selector + tags — only when not running */}
      <TaskSelector t={t} isActive={isActive} timerState={t.timerState} />

      {/* Interruptions */}
      <InterruptionSummary t={t} isActive={isActive} />

      {/* Error */}
      {t.error && (
        <p className="text-[12px] text-[hsl(var(--error))] mt-4">{t.error}</p>
      )}

      <InterruptionDialog t={t} />
      <RatingDialog t={t} />
    </div>
  );
}
