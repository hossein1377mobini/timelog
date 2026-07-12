"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { TimerInterruptionSummary } from "@/components/timer";

interface InterruptionSummaryProps {
  t: any;
  isActive: boolean;
}

export default function InterruptionSummary({ t, isActive }: InterruptionSummaryProps) {
  if (!isActive && t.todayInterruptions.length === 0) return null;

  return (
    <div className="w-full max-w-md mt-6">
      {/* Interruption quick-log — only when running */}
      {isActive && t.timerState !== "break" && (
        <Button
          variant="outline"
          onClick={() => t.setInterruptOpen(true)}
          className="h-9 px-4 text-[12px] border-[hsl(var(--warning))]/40 text-[hsl(var(--warning))]"
        >
          <AlertCircle size={13} className="mr-1.5" />
          Log Interruption
        </Button>
      )}

      {/* Today's interruptions summary */}
      {t.todayInterruptions.length > 0 && (
        <div className="w-full max-w-md mt-6">
          <TimerInterruptionSummary t={t} />
        </div>
      )}
    </div>
  );
}
