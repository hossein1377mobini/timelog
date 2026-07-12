import { useState, useCallback, useRef } from "react"
import type { TimerState } from "./types"
import { POMODORO_PRESETS } from "@/lib/constants"
import type { PomodoroPreset } from "@/lib/constants"

export interface PomodoroState {
  preset: PomodoroPreset
  pomodoroSeconds: number
  pomodoroCount: number
  flashActive: boolean
  handlePomodoroStart: () => void
  handleSkipBreak: () => void
  handlePomodoroPause: () => void
  handlePomodoroResume: () => void
  handleModeChange: (m: "standard" | "pomodoro") => void
  handlePresetChange: (p: PomodoroPreset) => void
  resetPomodoro: () => void
}

interface UsePomodoroOptions {
  taskName: string
  timerState: TimerState
  setTimerState: (s: TimerState) => void
  mode: "standard" | "pomodoro"
  setMode: (m: "standard" | "pomodoro") => void
  onWorkComplete?: () => void
}

export function usePomodoro(opts: UsePomodoroOptions): PomodoroState {
  const { taskName, timerState, setTimerState, mode, setMode } = opts

  const [preset, setPreset] = useState<PomodoroPreset>(POMODORO_PRESETS[0]!)
  const [pomodoroSeconds, setPomodoroSeconds] = useState<number>(
    POMODORO_PRESETS[0]!.work * 60,
  )
  const [pomodoroCount, setPomodoroCount] = useState<number>(0)
  const [flashActive, setFlashActive] = useState<boolean>(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function clearTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  function triggerWorkComplete() {
    clearTimer()
    setPomodoroCount((c) => c + 1)
    setFlashActive(true)
    setTimeout(() => setFlashActive(false), 800)
    setTimerState("break")
    intervalRef.current = setInterval(() => {
      setPomodoroSeconds((prev) => {
        if (prev <= 1) {
          clearTimer()
          setTimerState("ready")
          return preset.work * 60
        }
        return prev - 1
      })
    }, 1000)
  }

  const handlePomodoroStart = useCallback(() => {
    if (!taskName) return
    setPomodoroSeconds(preset.work * 60)
    setTimerState("running")
    intervalRef.current = setInterval(() => {
      setPomodoroSeconds((prev) => {
        if (prev <= 1) {
          triggerWorkComplete()
          return preset.break * 60
        }
        return prev - 1
      })
    }, 1000)
  }, [taskName, preset, setTimerState])

  const handleSkipBreak = useCallback(() => {
    clearTimer()
    setPomodoroSeconds(preset.work * 60)
    setTimerState("ready")
  }, [preset, setTimerState])

  const handlePomodoroPause = useCallback(() => {
    clearTimer()
    setTimerState("paused")
  }, [setTimerState])

  const handlePomodoroResume = useCallback(() => {
    setTimerState("running")
    intervalRef.current = setInterval(() => {
      setPomodoroSeconds((prev) => {
        if (prev <= 1) {
          triggerWorkComplete()
          return preset.break * 60
        }
        return prev - 1
      })
    }, 1000)
  }, [setTimerState, preset])

  const handleModeChange = useCallback(
    (m: "standard" | "pomodoro") => {
      if (timerState !== "idle") return
      setMode(m)
      setPomodoroSeconds(preset.work * 60)
      setPomodoroCount(0)
    },
    [timerState, preset, setMode],
  )

  const handlePresetChange = useCallback(
    (p: PomodoroPreset) => {
      if (timerState !== "idle") return
      setPreset(p)
      setPomodoroSeconds(p.work * 60)
    },
    [timerState],
  )

  const resetPomodoro = useCallback(() => {
    setPomodoroCount(0)
    setPomodoroSeconds(preset.work * 60)
  }, [preset])

  return {
    preset,
    pomodoroSeconds,
    pomodoroCount,
    flashActive,
    handlePomodoroStart,
    handleSkipBreak,
    handlePomodoroPause,
    handlePomodoroResume,
    handleModeChange,
    handlePresetChange,
    resetPomodoro,
  }
}
