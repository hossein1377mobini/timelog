"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { InterruptionType } from "@/lib/types";
import { INTERRUPTION_TYPES } from "@/lib/hooks/useFocusInterruptions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interruptType: InterruptionType;
  setInterruptType: (type: InterruptionType) => void;
  interruptNote: string;
  setInterruptNote: (note: string) => void;
  onSave: () => void;
  onSkip: () => void;
}

export default function FocusInterruptionDialog({
  open,
  onOpenChange,
  interruptType,
  setInterruptType,
  interruptNote,
  setInterruptNote,
  onSave,
  onSkip,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold">
            Log interruption
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <label className="text-[12px] text-[hsl(var(--muted))] font-medium">
              Type
            </label>
            <div className="flex flex-wrap gap-1.5">
              {INTERRUPTION_TYPES.map((t) => (
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
              What happened?{" "}
              <span className="font-normal">(optional)</span>
            </label>
            <Textarea
              value={interruptNote}
              onChange={(
                e: React.ChangeEvent<HTMLTextAreaElement>,
              ) => setInterruptNote(e.target.value)}
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
            onClick={onSkip}
            className="text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))]"
          >
            Skip & resume
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            className="transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            Save & resume
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
