import { useState, useRef } from "react";
import type { InterruptionType } from "@/lib/types";

export interface FocusInterruption {
  id: number;
  type: InterruptionType;
  note: string;
  timestamp: number;
  duration?: number | undefined;
  sessionId: string | null;
}

export const INTERRUPTION_TYPES: {
  value: InterruptionType;
  label: string;
  color: string;
}[] = [
  {
    value: "distraction",
    label: "Distraction",
    color: "bg-[hsl(var(--error))]/10 text-[hsl(var(--error))]",
  },
  {
    value: "external",
    label: "External",
    color: "bg-[hsl(var(--timeline-thinking))]/40 text-[hsl(var(--body-strong))]",
  },
  {
    value: "break",
    label: "Break",
    color: "bg-[hsl(var(--timeline-read))]/40 text-[hsl(var(--body-strong))]",
  },
  {
    value: "thought",
    label: "Thought",
    color: "bg-[hsl(var(--timeline-edit))]/40 text-[hsl(var(--body-strong))]",
  },
  {
    value: "admin",
    label: "Admin",
    color: "bg-[hsl(var(--muted))]/40 text-[hsl(var(--body-strong))]",
  },
];

export function useFocusInterruptions() {
  const [localInterruptions, setLocalInterruptions] = useState<
    FocusInterruption[]
  >([]);
  const [showInterrupt, setShowInterrupt] = useState(false);
  const [interruptType, setInterruptType] =
    useState<InterruptionType>("distraction");
  const [interruptNote, setInterruptNote] = useState("");

  const interruptStartRef = useRef<number | null>(null);

  function addLocalInterruption(entry: FocusInterruption) {
    setLocalInterruptions((prev) => [entry, ...prev]);
  }

  function clearInterruptInputs() {
    setInterruptNote("");
    setShowInterrupt(false);
  }

  return {
    localInterruptions,
    setLocalInterruptions,
    showInterrupt,
    setShowInterrupt,
    interruptType,
    setInterruptType,
    interruptNote,
    setInterruptNote,
    interruptStartRef,
    addLocalInterruption,
    clearInterruptInputs,
  };
}
