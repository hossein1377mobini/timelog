"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Play, Check, Clock } from "lucide-react";
import type { Task, Goal, WeeklyObjective } from "@/lib/types";
import { formatHM } from "@/lib/utils";

interface TodaySummaryProps {
  completedCount: number;
  totalCount: number;
  totalSeconds: number;
  pendingTasks: Task[];
  completedTasks: Task[];
  activeTaskId: string | null;
  objectiveMap: Map<string, { objective: WeeklyObjective; goal: Goal }>;
  newTaskTitle: string;
  onNewTaskTitleChange: (val: string) => void;
  onAddQuickTask: () => Promise<void>;
  onCycleStatus: (task: Task) => Promise<void>;
  onStartTask: (task: Task) => Promise<void>;
}

export default function TodaySummary({
  completedCount,
  totalCount,
  totalSeconds,
  pendingTasks,
  completedTasks,
  activeTaskId,
  objectiveMap,
  newTaskTitle,
  onNewTaskTitleChange,
  onAddQuickTask,
  onCycleStatus,
  onStartTask,
}: TodaySummaryProps) {
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
              My Day
            </p>
            <p className="text-[18px] font-normal text-[hsl(var(--body-strong))]">
              {completedCount}/{totalCount} tasks · {formatHM(totalSeconds)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-[hsl(var(--surface-strong))] rounded-full overflow-hidden">
              <div
                className="h-full bg-[hsl(var(--primary))] rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[12px] font-medium text-[hsl(var(--muted))] tabular-nums">
              {progressPct}%
            </span>
          </div>
        </div>

        {/* Quick add */}
        <div className="flex gap-2 mb-3">
          <Input
            value={newTaskTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNewTaskTitleChange(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && onAddQuickTask()}
            placeholder="Add a task for today..."
            className="h-9 text-[13px] flex-1"
          />
          <Button
            size="sm"
            onClick={onAddQuickTask}
            className="h-9 px-3 shrink-0"
            disabled={!newTaskTitle.trim()}
          >
            <Plus size={14} />
          </Button>
        </div>

        {/* Task list */}
        <div className="space-y-1.5">
          {pendingTasks.length === 0 && completedTasks.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[13px] text-[hsl(var(--muted))]">
                No tasks yet. Add one above or plan your day in the Plan tab.
              </p>
            </div>
          )}

          {pendingTasks.map((task) => {
            const objInfo = task.objectiveId ? objectiveMap.get(task.objectiveId) : null;
            const isActive = activeTaskId === task.id;
            return (
              <div
                key={task.id}
                className={`flex items-center gap-2 rounded-[8px] border px-3 py-2.5 transition-all ${
                  isActive
                    ? "border-[hsl(var(--primary))]/40 bg-[hsl(var(--primary))]/5"
                    : "border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))]"
                }`}
              >
                <button
                  onClick={() => onCycleStatus(task)}
                  className="w-5 h-5 rounded-full border-2 border-[hsl(var(--hairline-strong))] shrink-0 flex items-center justify-center transition-colors hover:border-[hsl(var(--primary))]"
                >
                  {task.status === "in-progress" && (
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] truncate ${task.status === "completed" ? "line-through text-[hsl(var(--muted))]" : "text-[hsl(var(--body-strong))]"}`}>
                    {task.title}
                  </p>
                  {objInfo && (
                    <p className="text-[10px] text-[hsl(var(--muted))] truncate">
                      {objInfo.goal.name} → {objInfo.objective.title}
                    </p>
                  )}
                </div>

                {task.estimatedTime > 0 && (
                  <span className="text-[10px] text-[hsl(var(--muted))] shrink-0 flex items-center gap-0.5">
                    <Clock size={10} /> {task.estimatedTime}m
                  </span>
                )}

                {task.status !== "completed" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onStartTask(task)}
                    className="h-7 px-2 shrink-0 text-[hsl(var(--primary))]"
                  >
                    <Play size={12} fill="currentColor" />
                  </Button>
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
                onClick={() => onCycleStatus(task)}
                className="w-5 h-5 rounded-full bg-[hsl(var(--success))] shrink-0 flex items-center justify-center"
              >
                <Check size={11} className="text-white" />
              </button>
              <p className="flex-1 text-[13px] line-through text-[hsl(var(--muted))] truncate">
                {task.title}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
