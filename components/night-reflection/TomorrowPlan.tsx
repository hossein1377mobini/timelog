"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ChevronRight } from "lucide-react";

interface TomorrowPlanProps {
  tomorrowTasks: Array<{ title: string; carried: boolean }>;
  removeNewTask: (index: number) => void;
}

export default function TomorrowPlan({
  tomorrowTasks,
  removeNewTask,
}: TomorrowPlanProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
          Tomorrow&apos;s Plan
        </p>
        {tomorrowTasks.map((t, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-[8px] border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))]"
          >
            {t.carried ? (
              <ChevronRight size={14} className="text-[hsl(var(--warning))] shrink-0" />
            ) : (
              <Plus size={14} className="text-[hsl(var(--success))] shrink-0" />
            )}
            <p className="flex-1 text-[13px] text-[hsl(var(--body-strong))] truncate">
              {t.title}
            </p>
            <span className="text-[9px] uppercase tracking-[0.08em] text-[hsl(var(--muted))] shrink-0">
              {t.carried ? "Carried" : "New"}
            </span>
            {!t.carried && (
              <button
                onClick={() => removeNewTask(i)}
                className="text-[10px] text-[hsl(var(--error))] hover:underline shrink-0"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
