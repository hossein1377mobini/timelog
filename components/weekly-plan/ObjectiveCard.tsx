"use client"

import React from "react"
import { Edit2, Trash2, Plus, ListTodo } from "lucide-react"
import { fetchTasksByObjective } from "@/lib/db-client"
import type { WeeklyObjective } from "@/lib/types"
import { statusLabel, statusColors } from "./weeklyPlanHelpers"

interface ObjectiveCardProps {
  obj: WeeklyObjective;
  color: { bar: string; cat: string; badge: string };
  onCycleStatus: (obj: WeeklyObjective) => void;
  onEdit: (obj: WeeklyObjective) => void;
  onDelete: (id: string) => void;
  onAddTask: (obj: WeeklyObjective) => void;
}

export const ObjectiveCard = React.memo(function ObjectiveCard({
  obj,
  color,
  onCycleStatus,
  onEdit,
  onDelete,
  onAddTask,
}: ObjectiveCardProps) {
  const [tasks, setTasks] = React.useState<Array<{ status: string }>>([])

  React.useEffect(() => {
    fetchTasksByObjective(obj.id).then(setTasks).catch(() => setTasks([]))
  }, [obj.id])

  const doneTasks = tasks.filter((t) => t.status === "completed").length
  const taskPct =
    tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0

  const borderClass =
    obj.status === "completed"
      ? "border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5"
      : obj.status === "in-progress"
        ? "border-[hsl(var(--primary))]/30 bg-[hsl(var(--primary))]/5"
        : "border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))]"

  return (
    <div
      className={`group rounded-lg border p-3 transition-all ${borderClass}`}
    >
      {/* Title row */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[12px] font-medium ${
                obj.status === "completed"
                  ? "line-through text-[hsl(var(--muted))]"
                  : "text-[hsl(var(--body-strong))]"
              }`}
            >
              {obj.title}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${statusColors(obj.status)}`}
            >
              {statusLabel(obj.status)}
            </span>
          </div>
          {obj.description && (
            <p className="text-[11px] text-[hsl(var(--muted))] mt-0.5 line-clamp-2">
              {obj.description}
            </p>
          )}
        </div>
        {/* Action buttons (always visible, compact) */}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(obj)}
            title="Edit"
            className="w-5 h-5 flex items-center justify-center rounded text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] hover:bg-[hsl(var(--surface-strong))] transition-colors"
          >
            <Edit2 size={10} />
          </button>
          <button
            onClick={() => onDelete(obj.id)}
            title="Delete"
            className="w-5 h-5 flex items-center justify-center rounded text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] hover:bg-[hsl(var(--error))]/10 transition-colors"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>

      {/* Task progress bar */}
      {tasks.length > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[hsl(var(--muted))] flex items-center gap-1">
              <ListTodo size={9} />
              {doneTasks}/{tasks.length} daily tasks
            </span>
            <span className="text-[10px] text-[hsl(var(--muted))]">
              {taskPct}%
            </span>
          </div>
          <div className="h-1 bg-[hsl(var(--surface-strong))] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${taskPct}%`, background: color.bar }}
            />
          </div>
        </div>
      )}

      {/* Action row */}
      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onCycleStatus(obj)}
          className={`text-[10px] px-2 py-1 rounded-md border font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${
            obj.status === "completed"
              ? "border-[hsl(var(--hairline))] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))]"
              : obj.status === "in-progress"
                ? "border-[hsl(var(--success))]/40 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/10"
                : "border-[hsl(var(--primary))]/40 text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10"
          }`}
        >
          {obj.status === "completed"
            ? "↩ Mark pending"
            : obj.status === "in-progress"
              ? "✓ Mark complete"
              : "▶ Start"}
        </button>
        <button
          onClick={() => onAddTask(obj)}
          className="text-[10px] px-2 py-1 rounded-md border border-[hsl(var(--hairline))] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] hover:border-[hsl(var(--hairline-strong))] transition-all flex items-center gap-1"
        >
          <Plus size={9} />
          Add daily task
        </button>
      </div>
    </div>
  )
})