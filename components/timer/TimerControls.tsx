"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  SkipForward,
  AlertTriangle,
} from "lucide-react";
import { useTimer } from "@/lib/hooks/useTimer";

type TimerHook = ReturnType<typeof useTimer>;

interface Props {
  t: TimerHook;
}

export default function TimerControls({ t }: Props) {
  return (
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
  );
}
