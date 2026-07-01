"use client";

import React from "react";
import { Edit2, Trash2, Clock, Check, ChevronDown, ChevronUp } from "lucide-react";
import type { Task, Goal, WeeklyObjective } from "@/lib/types";
import { GOAL_COLOR_MAP } from "@/lib/constants";
import { priorityBadge, statusButton } from "./dailyPlanningHelpers";

interface TaskItemProps {
  task: Task;
  goalInfo: { objective: WeeklyObjective; goal: Goal } | null;
  checklistOpen: boolean;
  onCycleStatus: (task: Task) => void;
  onToggleChecklist: (taskId: string) => void;
  onToggleChecklistItem: (task: Task, itemId: string) => void;
  onEdit: (task: Task) => void;
  onRemove: (taskId: string) => void;
}

/**
 * TaskItem - Displays a single task with checklist
 * Memoized to prevent unnecessary re-renders
 */
export const TaskItem = React.memo(function TaskItem({
  task,
  goalInfo,
  checklistOpen,
  onCycleStatus,
  onToggleChecklist,
  onToggleChecklistItem,
  onEdit,
  onRemove,
}: TaskItemProps) {
  const doneItems = task.checklist.filter((c) => c.done).length;

  return (
    <div
      className={`rounded-lg border transition-all ${
        task.status === "completed"
          ? "border-[hsl(var(--success))]/20 bg-[hsl(var(--success))]/5"
          : task.status === "in-progress"
            ? "border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/5"
            : "border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))]"
      }`}
    >
      {/* Task row */}
      <div className="flex items-start gap-2 px-2.5 py-2">
        {/* Status button */}
        <div className="mt-0.5">{statusButton(task, onCycleStatus)}</div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[12px] font-medium leading-tight ${
                task.status === "completed"
                  ? "line-through text-[hsl(var(--muted))]"
                  : "text-[hsl(var(--body-strong))]"
              }`}
            >
              {task.title}
            </span>
            {goalInfo && (
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                  GOAL_COLOR_MAP[goalInfo.goal.color as keyof typeof GOAL_COLOR_MAP] ??
                  GOAL_COLOR_MAP.Purple
                }`}
              >
                {goalInfo.goal.tag}
              </span>
            )}
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            {priorityBadge(task.priority)}
            {task.estimatedTime > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-[hsl(var(--muted))]">
                <Clock size={8} />
                {task.estimatedTime}m
              </span>
            )}
            {task.scheduledTime && (
              <span className="text-[9px] text-[hsl(var(--muted))]">
                @ {task.scheduledTime}
              </span>
            )}
            {task.checklist.length > 0 && (
              <button
                onClick={() => onToggleChecklist(task.id)}
                className="inline-flex items-center gap-0.5 text-[9px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body))] transition-colors"
              >
                {checklistOpen ? (
                  <ChevronUp size={8} />
                ) : (
                  <ChevronDown size={8} />
                )}
                {doneItems}/{task.checklist.length}
              </button>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          <button
            onClick={() => onEdit(task)}
            className="text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] transition-colors"
            title="Edit task"
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={() => onRemove(task.id)}
            className="text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] transition-colors"
            title="Remove from today"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Checklist (collapsible) */}
      {checklistOpen && task.checklist.length > 0 && (
        <div className="px-4 pb-2 space-y-1 border-t border-[hsl(var(--hairline))] pt-2">
          {task.checklist.map((item) => (
            <button
              key={item.id}
              onClick={() => onToggleChecklistItem(task, item.id)}
              className="flex items-center gap-2 w-full text-left group/cl"
            >
              <span
                className={`shrink-0 w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all ${
                  item.done
                    ? "bg-[hsl(var(--success))] border-[hsl(var(--success))]"
                    : "border-[hsl(var(--hairline))] group-hover/cl:border-[hsl(var(--hairline-strong))]"
                }`}
              >
                {item.done && (
                  <Check
                    size={8}
                    className="text-white"
                  />
                )}
              </span>
              <span
                className={`text-[11px] ${
                  item.done
                    ? "line-through text-[hsl(var(--muted))]"
                    : "text-[hsl(var(--body))]"
                }`}
              >
                {item.text}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
