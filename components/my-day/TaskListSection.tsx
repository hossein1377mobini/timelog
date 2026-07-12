"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Play, Check, Clock } from "lucide-react";
import type { Task, Goal, WeeklyObjective } from "@/lib/types";
import { formatHM } from "@/lib/utils";

interface TaskListSectionProps {
  pendingTasks: Task[];
  completedTasks: Task[];
  expandedTaskId: string | null;
  setExpandedTaskId: (id: string | null) => void;
  objectiveMap: Map<string, { objective: WeeklyObjective; goal: Goal }>;
  taskDurations: Map<string, number>;
  onStartTimer: (taskId: string, taskName: string) => void;
  handleComplete: (task: Task) => Promise<void>;
  handleUncomplete: (task: Task) => Promise<void>;
}

export default function TaskListSection({
  pendingTasks,
  completedTasks,
  expandedTaskId,
  setExpandedTaskId,
  objectiveMap,
  taskDurations,
  onStartTimer,
  handleComplete,
  handleUncomplete,
}: TaskListSectionProps) {
  return (
    <div className="space-y-1.5">
      {pendingTasks.length === 0 && completedTasks.length === 0 && (
        <div className="text-center py-8">
          <p className="text-[13px] text-[hsl(var(--muted))]">
            No tasks yet. Add one above or plan your week in the Plan tab.
          </p>
        </div>
      )}

      {pendingTasks.map((task) => {
        const isExpanded = expandedTaskId === task.id;
        const objInfo = task.objectiveId ? objectiveMap.get(task.objectiveId) : null;
        const trackedSeconds = taskDurations.get(task.id) || 0;
        return (
          <div key={task.id}>
            <div
              className={`flex items-center gap-2 rounded-[8px] border px-3 py-2.5 transition-all ${
                isExpanded
                  ? "border-[hsl(var(--primary))]/40 bg-[hsl(var(--primary))]/5"
                  : "border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))]"
              }`}
            >
              <button
                onClick={() => {
                  if (isExpanded) setExpandedTaskId(null);
                  else setExpandedTaskId(task.id);
                }}
                className="w-5 h-5 rounded-full border-2 border-[hsl(var(--hairline-strong))] shrink-0 flex items-center justify-center transition-colors hover:border-[hsl(var(--primary))]"
              >
                {task.status === "in-progress" && (
                  <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] truncate text-[hsl(var(--body-strong))]">
                  {task.title}
                </p>
                {objInfo && (
                  <p className="text-[10px] text-[hsl(var(--muted))] truncate">
                    {objInfo.goal.name} → {objInfo.objective.title}
                  </p>
                )}
              </div>

              {trackedSeconds > 0 && (
                <span className="text-[10px] text-[hsl(var(--muted))] shrink-0 flex items-center gap-0.5">
                  <Clock size={10} /> {formatHM(trackedSeconds)}
                </span>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (isExpanded) setExpandedTaskId(null);
                  else setExpandedTaskId(task.id);
                }}
                className="h-7 px-2 shrink-0 text-[hsl(var(--primary))]"
              >
                <Play size={12} fill="currentColor" />
              </Button>
            </div>

            {/* Expandable action row */}
            {isExpanded && (
              <div className="flex items-center gap-2 pl-10 pr-3 py-2 animate-in fade-in slide-in-from-top-1 duration-150">
                <Button
                  size="sm"
                  onClick={() => {
                    setExpandedTaskId(null);
                    onStartTimer(task.id, task.title);
                  }}
                  className="h-8 px-3 text-[12px]"
                >
                  <Play size={13} className="mr-1.5" fill="currentColor" />
                  Timer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setExpandedTaskId(null);
                    handleComplete(task);
                  }}
                  className="h-8 px-3 text-[12px] border-[hsl(var(--success))]/40 text-[hsl(var(--success))]"
                >
                  <Check size={13} className="mr-1.5" />
                  Complete
                </Button>
              </div>
            )}
          </div>
        );
      })}

      {completedTasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-2 rounded-[8px] border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))]/50 px-3 py-2.5"
        >
          <button
            onClick={() => handleUncomplete(task)}
            className="w-5 h-5 rounded-full bg-[hsl(var(--success))] shrink-0 flex items-center justify-center"
          >
            <Check size={11} className="text-white" />
          </button>
          <p className="flex-1 text-[13px] line-through text-[hsl(var(--muted))] truncate">
            {task.title}
          </p>
          {taskDurations.get(task.id) ? (
            <span className="text-[10px] text-[hsl(var(--muted))] shrink-0">
              {formatHM(taskDurations.get(task.id)!)}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
