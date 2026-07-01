import React from "react";
import { Flag, Play, Check } from "lucide-react";
import type { Task } from "@/lib/types";

/**
 * Helper functions for DailyPlanning component
 */

/**
 * Renders a priority badge for a task
 */
export function priorityBadge(priority: Task["priority"]) {
  if (priority === "high")
    return (
      <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-[hsl(var(--error))]">
        <Flag size={8} />
        High
      </span>
    );
  if (priority === "medium")
    return (
      <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-[hsl(var(--warning))]">
        <Flag size={8} />
        Med
      </span>
    );
  return <span className="text-[9px] text-[hsl(var(--muted))]">· Low</span>;
}

/**
 * Renders a status button for cycling through task statuses
 */
export function statusButton(
  task: Task,
  onCycleStatus: (task: Task) => void
) {
  if (task.status === "pending")
    return (
      <button
        onClick={() => onCycleStatus(task)}
        title="Start task"
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center border border-[hsl(var(--hairline))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] text-[hsl(var(--muted))] transition-all"
      >
        <Play size={9} />
      </button>
    );
  if (task.status === "in-progress")
    return (
      <button
        onClick={() => onCycleStatus(task)}
        title="Mark done"
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/30 hover:bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] transition-all"
      >
        <Check size={9} />
      </button>
    );
  // completed
  return (
    <button
      onClick={() => onCycleStatus(task)}
      title="Reopen"
      className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-[hsl(var(--success))] border-transparent text-white hover:opacity-80 transition-all"
    >
      <Check size={9} />
    </button>
  );
}

/**
 * Format today's date for display
 */
export function formatTodayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
