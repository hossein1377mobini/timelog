"use client";

import React from "react";
import { Textarea } from "@/components/ui/textarea";

interface ReflectionNotesProps {
  reflectionText: string;
  onReflectionTextChange: (text: string) => void;
}

export default function ReflectionNotes({
  reflectionText,
  onReflectionTextChange,
}: ReflectionNotesProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
        How did your day go?
      </p>
      <Textarea
        placeholder="Write your thoughts, what went well, what you could improve..."
        value={reflectionText}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          onReflectionTextChange(e.target.value)
        }
        className="text-[13px] resize-none min-h-[80px]"
        rows={3}
      />
    </div>
  );
}
