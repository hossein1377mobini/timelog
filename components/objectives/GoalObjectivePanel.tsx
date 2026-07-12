"use client"
import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import type { ObjectiveWithGoal } from "./useObjectivesView"

interface Props {
  objectives: ObjectiveWithGoal[]
  onCycleStatus: (obj: any) => void
}

export default function GoalObjectivePanel({ objectives, onCycleStatus }: Props) {
  if (objectives.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-[12px] text-[hsl(var(--muted))]">No objectives for this goal this week</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {objectives.map((obj) => (
        <div
          key={obj.id}
          className="flex items-center gap-2 px-3 py-2 rounded-[8px] border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))]"
        >
          <Button
            size="sm"
            variant={obj.status === "completed" ? "default" : "outline"}
            className={`w-7 h-7 p-0 flex items-center justify-center shrink-0 ${
              obj.status === "completed"
                ? "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90"
                : ""
            }`}
            onClick={() => onCycleStatus(obj)}
          >
            <Check size={12} className="text-white" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className={`text-[13px] truncate ${
              obj.status === "completed"
                ? "line-through text-[hsl(var(--muted))]"
                : "text-[hsl(var(--body-strong))]"
            }`}>
              {obj.title}
            </p>
            {obj.milestoneId && obj.description && (
              <p className="text-[10px] text-[hsl(var(--muted))] truncate">{obj.description}</p>
            )}
          </div>
          <span className="text-[9px] uppercase tracking-[0.08em] shrink-0 px-1.5 py-0.5 rounded text-[hsl(var(--muted))] bg-[hsl(var(--surface-strong))]">
            {obj.status}
          </span>
        </div>
      ))}
    </div>
  )
}
