"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { INTERRUPTION_TYPE_META } from "@/lib/constants";
import type { InterruptionType, InterruptionSeverity } from "@/lib/types";

interface InterruptionDialogProps {
  t: any;
}

export default function InterruptionDialog({ t }: InterruptionDialogProps) {
  return (
    <Dialog open={t.interruptOpen} onOpenChange={t.setInterruptOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Log Interruption
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
              What happened?
            </label>
            <div className="flex flex-wrap gap-1.5">
              {INTERRUPTION_TYPE_META.map((tp) => (
                <button
                  key={tp.value}
                  onClick={() => t.setInterruptType(tp.value as InterruptionType)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium border transition-colors ${
                    t.interruptType === tp.value
                      ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
                      : "bg-[hsl(var(--canvas-soft))] text-[hsl(var(--body))] border-[hsl(var(--hairline))]"
                  }`}
                >
                  <span>{tp.emoji}</span>
                  <span>{tp.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
              Duration (minutes)
            </label>
            <Input
              type="number"
              min={0}
              value={t.interruptDuration}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => t.setInterruptDuration(Math.max(0, Number(e.target.value)))}
              className="h-9 text-[13px] w-28"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
              Notes
            </label>
            <Textarea
              placeholder="What happened?"
              value={t.interruptNote}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => t.setInterruptNote(e.target.value)}
              className="text-[13px] resize-none"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
              Severity
            </label>
            <div className="flex gap-1.5">
              {(["low", "medium", "high"] as InterruptionSeverity[]).map((s) => (
                <button
                  key={s}
                  onClick={() => t.setInterruptSeverity(s)}
                  className={`px-3 py-1 rounded-full text-[12px] font-medium border capitalize transition-colors ${
                    t.interruptSeverity === s
                      ? s === "low"
                        ? "bg-[hsl(var(--success))] text-white border-[hsl(var(--success))]"
                        : s === "medium"
                          ? "bg-[hsl(var(--warning))] text-white border-[hsl(var(--warning))]"
                          : "bg-[hsl(var(--error))] text-white border-[hsl(var(--error))]"
                      : "bg-[hsl(var(--canvas-soft))] text-[hsl(var(--body))] border-[hsl(var(--hairline))]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => t.setInterruptOpen(false)}>
            Skip
          </Button>
          <Button onClick={t.handleInterruptConfirm}>Log it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
