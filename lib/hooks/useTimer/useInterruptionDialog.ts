import { useState, useCallback } from "react"
import type { InterruptionType, InterruptionSeverity } from "@/lib/types"

export interface InterruptionDialogState {
  interruptOpen: boolean
  interruptType: InterruptionType
  interruptNote: string
  interruptSeverity: InterruptionSeverity
  interruptDuration: number
  setInterruptOpen: (v: boolean) => void
  setInterruptType: (v: InterruptionType) => void
  setInterruptNote: (v: string) => void
  setInterruptSeverity: (v: InterruptionSeverity) => void
  setInterruptDuration: (v: number) => void
  resetInterruption: () => void
}

/** Initial interruption form values. */
const INIT_INTERRUPTION = {
  type: "distraction" as InterruptionType,
  note: "",
  severity: "low" as InterruptionSeverity,
  duration: 5,
}

export function useInterruptionDialog(): InterruptionDialogState {
  const [interruptOpen, setInterruptOpen] = useState(false)
  const [interruptType, setInterruptType] = useState<InterruptionType>(
    INIT_INTERRUPTION.type,
  )
  const [interruptNote, setInterruptNote] = useState(INIT_INTERRUPTION.note)
  const [interruptSeverity, setInterruptSeverity] = useState<InterruptionSeverity>(
    INIT_INTERRUPTION.severity,
  )
  const [interruptDuration, setInterruptDuration] = useState(
    INIT_INTERRUPTION.duration,
  )

  const resetInterruption = useCallback(() => {
    setInterruptType(INIT_INTERRUPTION.type)
    setInterruptNote(INIT_INTERRUPTION.note)
    setInterruptSeverity(INIT_INTERRUPTION.severity)
    setInterruptDuration(INIT_INTERRUPTION.duration)
  }, [])

  return {
    interruptOpen,
    interruptType,
    interruptNote,
    interruptSeverity,
    interruptDuration,
    setInterruptOpen,
    setInterruptType,
    setInterruptNote,
    setInterruptSeverity,
    setInterruptDuration,
    resetInterruption,
  }
}
