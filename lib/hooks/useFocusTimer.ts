import { useState, useEffect, useRef } from "react";
import { createSession, fetchTasks } from "@/lib/db-client";
import { todayKey, formatDuration } from "@/lib/utils";
import { POMODORO_PRESETS } from "@/lib/constants";
import type { PomodoroPreset } from "@/lib/constants";

export type FocusPhase = "idle" | "work" | "break";

export function useFocusTimer() {
  const [preset, setPreset] = useState<PomodoroPreset>(POMODORO_PRESETS[0]!);
  const [phase, setPhase] = useState<FocusPhase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(preset.work * 60);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [workStartTime, setWorkStartTime] = useState<number>(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  useEffect(() => {
    if (phase === "idle") return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearTimer();
          // Use ref to get the latest phase inside the stale closure
          const currentPhase = phaseRef.current;
          if (currentPhase === "work") {
            handlePomodoroComplete();
          } else {
            setPhase("idle");
          }
          return preset.work * 60;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, preset]);

  function startWork() {
    setPhase("work");
    setSecondsLeft(preset.work * 60);
    setWorkStartTime(Date.now());
  }

  async function handlePomodoroComplete() {
    try {
      await createSession({
        taskId: null,
        taskName: "Focus session",
        tags: ["#focus"],
        duration: preset.work * 60,
        durationFormatted: formatDuration(preset.work * 60),
        startedAt: new Date(workStartTime).toISOString(),
        endedAt: new Date().toISOString(),
        date: todayKey(),
        pomodoroCount: completedPomodoros + 1,
        productivityRating: null,
      });
    } catch (e) {
      console.error("Failed to save focus session:", e);
    }
    setCompletedPomodoros((p) => p + 1);
    setPhase("break");
  }

  async function stopSession() {
    clearTimer();
    if (phase === "work" && workStartTime > 0) {
      const elapsed = Math.floor((Date.now() - workStartTime) / 1000);
      if (elapsed > 0) {
        try {
          await createSession({
            taskId: null,
            taskName: "Focus session",
            tags: ["#focus"],
            duration: elapsed,
            durationFormatted: formatDuration(elapsed),
            startedAt: new Date(workStartTime).toISOString(),
            endedAt: new Date().toISOString(),
            date: todayKey(),
            pomodoroCount: completedPomodoros,
            productivityRating: null,
          });
        } catch (e) {
          console.error("Failed to save focus session:", e);
        }
      }
    }
    setPhase("idle");
    setSecondsLeft(preset.work * 60);
    setWorkStartTime(0);
  }

  function resumeTimer() {
    if (phaseRef.current !== "idle") {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearTimer();
            const currentPhase = phaseRef.current;
            if (currentPhase === "work") {
              handlePomodoroComplete();
            } else {
              setPhase("idle");
            }
            return preset.work * 60;
          }
          return s - 1;
        });
      }, 1000);
    }
  }

  function changePreset(label: string) {
    const p = POMODORO_PRESETS.find((x) => x.label === label)!;
    setPreset(p);
    setPhase("idle");
    setSecondsLeft(p.work * 60);
    clearTimer();
  }

  const progress =
    phase === "work"
      ? ((preset.work * 60 - secondsLeft) / (preset.work * 60)) * 100
      : phase === "break"
        ? ((preset.break * 60 - secondsLeft) / (preset.break * 60)) * 100
        : 0;

  return {
    preset,
    setPreset,
    phase,
    setPhase,
    secondsLeft,
    setSecondsLeft,
    completedPomodoros,
    workStartTime,
    startWork,
    stopSession,
    resumeTimer,
    changePreset,
    progress,
    clearTimer,
    intervalRef,
  };
}
