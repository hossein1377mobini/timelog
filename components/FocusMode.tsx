"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Timer, Zap, AlertCircle, CheckCircle2 } from "lucide-react"

import { POMODORO_PRESETS } from "@/lib/constants"
import {
  getInterruptions,
  addInterruption,
  addSession,
  dispatchStorageEvent,
} from "@/lib/storage"
import type { InterruptionType } from "@/lib/types"
import { todayKey, formatDuration } from "@/lib/utils"

interface FocusInterruption {
  id: number
  type: InterruptionType
  note: string
  timestamp: number
  duration?: number
  sessionId: string | null
}

const INTERRUPTION_TYPES: { value: InterruptionType; label: string; color: string }[] = [
  { value: "distraction", label: "Distraction", color: "bg-[hsl(var(--error))]/10 text-[hsl(var(--error))]" },
  { value: "external", label: "External", color: "bg-[hsl(var(--timeline-thinking))]/40 text-[hsl(var(--body-strong))]" },
  { value: "break", label: "Break", color: "bg-[hsl(var(--timeline-read))]/40 text-[hsl(var(--body-strong))]" },
  { value: "thought", label: "Thought", color: "bg-[hsl(var(--timeline-edit))]/40 text-[hsl(var(--body-strong))]" },
  { value: "admin", label: "Admin", color: "bg-[hsl(var(--muted))]/40 text-[hsl(var(--body-strong))]" },
]

function formatMMSS(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0")
  const s = (seconds % 60).toString().padStart(2, "0")
  return `${m}:${s}`
}

export default function FocusMode() {
  const [preset, setPreset] = useState(POMODORO_PRESETS[0])
  const [phase, setPhase] = useState<"idle" | "work" | "break">("idle")
  const [secondsLeft, setSecondsLeft] = useState(preset.work * 60)
  const [localInterruptions, setLocalInterruptions] = useState<FocusInterruption[]>([])
  const [showInterrupt, setShowInterrupt] = useState(false)
  const [interruptType, setInterruptType] = useState<InterruptionType>("distraction")
  const [interruptNote, setInterruptNote] = useState("")
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [workStartTime, setWorkStartTime] = useState<number>(0)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const interruptStartRef = useRef<number | null>(null)

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  useEffect(() => {
    if (phase === "idle") return
    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current!)
          if (phase === "work") {
            handlePomodoroComplete()
          } else {
            setPhase("idle")
            return preset.work * 60
          }
          return preset.work * 60
        }
        return s - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [phase, preset])

  function startWork() {
    setPhase("work")
    setSecondsLeft(preset.work * 60)
    setWorkStartTime(Date.now())
  }

  function handlePomodoroComplete() {
    // Save session for the completed pomodoro
    const duration = preset.work * 60
    addSession({
      taskId: null,
      taskName: "Focus session",
      tags: ["#focus"],
      duration,
      durationFormatted: formatDuration(duration),
      startedAt: new Date(workStartTime).toISOString(),
      endedAt: new Date().toISOString(),
      date: todayKey(),
      pomodoroCount: completedPomodoros + 1,
      productivityRating: null,
    })
    dispatchStorageEvent()
    setCompletedPomodoros(p => p + 1)
    setPhase("break")
  }

  function stopSession() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    // If we were in work phase, save the partial session
    if (phase === "work" && workStartTime > 0) {
      const elapsed = Math.floor((Date.now() - workStartTime) / 1000)
      if (elapsed > 0) {
        addSession({
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
        })
        dispatchStorageEvent()
      }
    }
    setPhase("idle")
    setSecondsLeft(preset.work * 60)
    setWorkStartTime(0)
  }

  function openInterruptDialog() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    interruptStartRef.current = Date.now()
    setShowInterrupt(true)
  }

  function resumeTimer() {
    if (phase !== "idle") {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!)
            if (phase === "work") {
              handlePomodoroComplete()
            } else {
              setPhase("idle")
              return preset.work * 60
            }
            return preset.work * 60
          }
          return s - 1
        })
      }, 1000)
    }
  }

  function saveInterruption() {
    const duration = interruptStartRef.current
      ? Math.round((Date.now() - interruptStartRef.current) / 1000)
      : undefined
    const entry: FocusInterruption = {
      id: Date.now(),
      type: interruptType,
      note: interruptNote.trim(),
      timestamp: Date.now(),
      duration,
      sessionId: null,
    }
    setLocalInterruptions(prev => [entry, ...prev])
    // Persist to global storage using the proper addInterruption function
    // instead of overwriting all interruptions
    addInterruption({
      sessionId: null,
      type: interruptType,
      cause: interruptNote.trim(),
      duration: duration ?? 0,
      note: interruptNote.trim(),
      timestamp: new Date().toISOString(),
      recoveryTime: 0,
      severity: "low",
    })
    dispatchStorageEvent()
    setInterruptNote("")
    setShowInterrupt(false)
    resumeTimer()
  }

  function changePreset(label: string) {
    const p = POMODORO_PRESETS.find(x => x.label === label)!
    setPreset(p)
    setPhase("idle")
    setSecondsLeft(p.work * 60)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const progress = phase === "work"
    ? ((preset.work * 60 - secondsLeft) / (preset.work * 60)) * 100
    : phase === "break"
    ? ((preset.break * 60 - secondsLeft) / (preset.break * 60)) * 100
    : 0

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
              {completedPomodoros > 0 && (
                <span className="flex items-center gap-1 text-[12px] text-[hsl(var(--muted))]">
                  <CheckCircle2 size={12} className="text-[hsl(var(--success))]" />
                  {completedPomodoros} done
                </span>
              )}
              <Select value={preset.label} onValueChange={changePreset} disabled={phase !== "idle"}>
                <SelectTrigger className="h-7 w-24 text-[12px] border-[hsl(var(--hairline))] hover:border-[hsl(var(--hairline-strong))] transition-colors focus:ring-1 focus:ring-[hsl(var(--ring))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POMODORO_PRESETS.map(p => (
                    <SelectItem key={p.label} value={p.label} className="text-[12px]">
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
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="6"
                  opacity="0.2"
                />
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke={phase === "break" ? "hsl(var(--success))" : "hsl(var(--primary))"}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[22px] font-normal tabular-nums tracking-[-0.11px] text-[hsl(var(--body-strong))]">
                  {formatMMSS(secondsLeft)}
                </span>
                <span className="text-[10px] text-[hsl(var(--muted))] mt-0.5 font-semibold uppercase tracking-[0.08em]">
                  {phase === "idle" ? "ready" : phase === "work" ? "focus" : "break"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {phase === "idle" ? (
              <Button
                className="flex-1 h-9 font-medium transition-all hover:scale-[1.01] active:scale-[0.98]"
                onClick={startWork}
              >
                <Zap size={14} className="mr-1.5" />
                Start focus
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="flex-1 h-9 border-[hsl(var(--error))]/40 text-[hsl(var(--error))] hover:bg-[hsl(var(--error))]/8 hover:border-[hsl(var(--error))]/60 transition-all"
                  onClick={stopSession}
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

          {localInterruptions.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-[hsl(var(--hairline))]">
              <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted))] font-semibold pt-1">
                Today's interruptions
              </p>
              {localInterruptions.slice(0, 3).map(item => {
                const t = INTERRUPTION_TYPES.find(x => x.value === item.type)!
                return (
                  <div key={item.id} className="flex items-start gap-2 py-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${t.color}`}>
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
                )
              })}
              {localInterruptions.length > 3 && (
                <p className="text-[10px] text-[hsl(var(--muted))]">
                  +{localInterruptions.length - 3} more
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showInterrupt} onOpenChange={setShowInterrupt}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold">Log interruption</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <label className="text-[12px] text-[hsl(var(--muted))] font-medium">Type</label>
              <div className="flex flex-wrap gap-1.5">
                {INTERRUPTION_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setInterruptType(t.value)}
                    className={`text-[12px] px-2.5 py-1 rounded-full font-medium transition-all border ${
                      interruptType === t.value
                        ? `${t.color} border-transparent scale-[1.03]`
                        : "border-[hsl(var(--hairline))] text-[hsl(var(--muted))] hover:border-[hsl(var(--hairline-strong))] hover:text-[hsl(var(--body-strong))]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] text-[hsl(var(--muted))] font-medium">
                What happened? <span className="font-normal">(optional)</span>
              </label>
              <Textarea
                value={interruptNote}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInterruptNote(e.target.value)}
                placeholder="e.g. Phone call from client, checked Twitter..."
                className="resize-none h-20 text-[14px] focus:ring-1 focus:ring-[hsl(var(--ring))] transition-shadow"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowInterrupt(false)
                resumeTimer()
              }}
              className="text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))]"
            >
              Skip & resume
            </Button>
            <Button
              size="sm"
              onClick={saveInterruption}
              className="transition-all hover:scale-[1.01] active:scale-[0.98]"
            >
              Save & resume
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}