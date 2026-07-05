"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTimer } from "@/lib/hooks/useTimer";

type TimerHook = ReturnType<typeof useTimer>;

interface Props {
  t: TimerHook;
}

export default function TimerTaskSelector({ t }: Props) {
  if (!t.isSelectable) return null;

  return (
    <div className="space-y-2">
      {t.tasks.length > 0 && (
        <Select
          value={t.selectedTaskId}
          onValueChange={(v: string) => {
            t.setSelectedTaskId(v);
            t.setCustomTaskName("");
            t.setError("");
            if (t.timerState === "idle") {
              // We need to set timerState to "ready" but that's internal to the hook
              // The hook handles this via selectedTaskId change
            }
          }}
        >
          <SelectTrigger className="h-10 text-[14px]">
            <SelectValue placeholder="Select a task..." />
          </SelectTrigger>
          <SelectContent>
            {t.tasks.map((task: { id: string; title: string; estimatedTime: number }) => (
              <SelectItem
                key={task.id}
                value={task.id}
                className="text-[13px]"
              >
                <span>{task.title}</span>
                {task.estimatedTime > 0 && (
                  <span className="text-[10px] text-[hsl(var(--muted))] ml-1.5">
                    ({task.estimatedTime}m)
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Input
        placeholder={
          t.tasks.length > 0
            ? "Or type a custom task name..."
            : "Task name..."
        }
        value={t.selectedTask ? t.selectedTask.title : t.customTaskName}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          if (!t.selectedTaskId) {
            t.setCustomTaskName(e.target.value);
          }
          t.setError("");
        }}
        readOnly={!!t.selectedTaskId}
        className="h-9 text-[14px]"
      />
    </div>
  );
}
