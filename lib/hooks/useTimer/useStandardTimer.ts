import { useRef, useCallback, useState } from "react"
import type { TimerState } from "./types"

export interface StandardTimerState {
  elapsedSeconds: number
  isActive: boolean
  isSelectable: boolean
  timerState: TimerState
  handleStart: () => void
  handlePause: () => void
  handleResume: () => void
  handleReset: () => void
  timeDisplay: string
  elapsedSecondsRef: React.MutableRefObject<number>
}

interface UseStandardTimerOptions {
  taskName: string
  timerState: TimerState
  setTimerState: (s: TimerState) => void
  onStop: () => void
  formatDisplay?: (seconds: number) => string
}

export function useStandardTimer(
  opts: UseStandardTimerOptions,
): StandardTimerState {
  const {
    taskName,
    timerState,
    setTimerState,
    onStop,
    formatDisplay = (s) => `${s}`,
  } = opts

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedSecondsRef = useRef<number>(0)

  const isSelectable = timerState === "idle" || timerState === "ready"
  const isActive =
    timerState === "running" || timerState === "paused" || timerState === "break"

  const timeDisplay = formatDisplay(elapsedSeconds)

  function clearTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const handleStart = useCallback(() => {
    if (!taskName) return
    startTimeRef.current = Date.now()
    pausedSecondsRef.current = 0
    setElapsedSeconds(0)
    setTimerState("running")
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(
        Math.floor((Date.now() - startTimeRef.current) / 1000) +
          pausedSecondsRef.current,
      )
    }, 1000)
  }, [taskName, setTimerState])

  const handlePause = useCallback(() => {
    clearTimer()
    pausedSecondsRef.current = elapsedSeconds
    setTimerState("paused")
  }, [elapsedSeconds, setTimerState])

  const handleResume = useCallback(() => {
    startTimeRef.current = Date.now()
    setTimerState("running")
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(
        Math.floor((Date.now() - startTimeRef.current) / 1000) +
          pausedSecondsRef.current,
      )
    }, 1000)
  }, [setTimerState])

  const handleReset = useCallback(() => {
    clearTimer()
    setElapsedSeconds(0)
    pausedSecondsRef.current = 0
    startTimeRef.current = 0
    setTimerState("idle")
  }, [setTimerState])

  return {
    elapsedSeconds,
    isActive,
    isSelectable,
    timerState,
    handleStart,
    handlePause,
    handleResume,
    handleReset,
    timeDisplay,
    elapsedSecondsRef: { current: elapsedSeconds },
  }
}
