"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import type { Task } from "@/lib/types";

interface UnfinishedTasksProps {
  unfinishedTasks: Task[];
  carryTaskIds: Set<string>;
  onToggle: (taskId: string) => void;
}

export default function UnfinishedTasks({
  unfinishedTasks,
  carryTaskIds,
  onToggle,
}: UnfinishedTasksProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
          Unfinished Tasks — carry to tomorrow?
        </p>
        {unfinishedTasks.length === 0 ? (
          <p className="text-[13px] text-[hsl(var(--muted))] py-2">
            All tasks completed! Great job today.
          </p>
        ) : (
          unfinishedTasks.map((task) => (
            <label
              key={task.id}
              className="flex items-center gap-3 px-3 py-2 rounded-[8px] border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))] cursor-pointer hover:border-[hsl(var(--primary))]/30 transition-colors"
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  carryTaskIds.has(task.id)
                    ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))]"
                    : "border-[hsl(var(--hairline-strong))]"
                }`}
              >
                {carryTaskIds.has(task.id) && (
                  <Check size={12} className="text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0" onClick={() => onToggle(task.id)}>
                <p className="text-[13px] text-[hsl(var(--body-strong))] truncate">
                  {task.title}
                </p>
                <p className="text-[10px] text-[hsl(var(--muted))]">
                  {task.status === "in-progress" ? "In progress" : "Pending"}
                </p>
              </div>
            </label>
          ))
        )}
      </CardContent>
    </Card>
  );
}
