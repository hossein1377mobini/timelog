"use client"
import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Edit2, Trash2, Map, Check, ArrowRight } from "lucide-react"
import { differenceInDays } from "date-fns"
import type { Goal, Session } from "@/lib/types"
import { GOAL_COLORS } from "@/lib/constants"
import { fetchRoadmapPhases } from "@/lib/db-client"
import { getLoggedHours, getStatus, getNeededPerWeek } from "./goalHelpers"
import { RoadmapStepper } from "./RoadmapStepper"

interface Props {
  goal: Goal
  sessions: Session[]
  onEdit: () => void
  onDelete: () => void
}

export function GoalCard({ goal, sessions, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const color = GOAL_COLORS.find(c => c.name === goal.color) || GOAL_COLORS[0]
  const logged = getLoggedHours(goal.tag, sessions)
  const pct = Math.min(100, Math.round((logged / goal.targetHours) * 100))
  const remaining = Math.max(0, Math.round((goal.targetHours - logged) * 10) / 10)
  const daysLeft = goal.targetDate ? differenceInDays(new Date(goal.targetDate), new Date()) : null
  const neededPerWeek = getNeededPerWeek(goal, logged)
  const status = getStatus(goal, logged)

  const [phaseCount, setPhaseCount] = useState(0)
  useEffect(() => {
    fetchRoadmapPhases(goal.id).then(phases => setPhaseCount(phases.length)).catch(() => setPhaseCount(0))
  }, [goal.id, expanded])

  return (
    <div className="border border-[hsl(var(--hairline))] rounded-[12px] p-4 hover:border-[hsl(var(--hairline-strong))] transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-medium text-[hsl(var(--body-strong))]">{goal.name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${color.cat}`}>{goal.tag}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.style}`}>{status.label}</span>
          </div>
          <p className="text-[11px] text-[hsl(var(--muted))]">
            {goal.targetHours}h target
            {goal.targetDate && ` · due ${new Date(goal.targetDate).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`}
          </p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
          <button onClick={onEdit}
            className="w-7 h-7 rounded-[6px] border border-[hsl(var(--hairline))] flex items-center justify-center text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] transition-all active:scale-95"
            aria-label="Edit goal"><Edit2 size={12} /></button>
          <button onClick={onDelete}
            className="w-7 h-7 rounded-[6px] border border-[hsl(var(--hairline))] flex items-center justify-center text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] transition-all active:scale-95"
            aria-label="Delete goal"><Trash2 size={12} /></button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-1.5 bg-[hsl(var(--surface-strong))] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: color.bar }} />
        </div>
        <span className="text-[12px] font-medium tabular-nums w-9 text-right text-[hsl(var(--body-strong))]">{pct}%</span>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {([
          { label: "logged", value: `${logged}h` },
          { label: "remaining", value: `${remaining}h` },
          { label: "needed/wk", value: `${neededPerWeek}h` },
          daysLeft !== null ? { label: "days left", value: daysLeft > 0 ? `${daysLeft}` : "overdue" } : null,
        ].filter(Boolean) as { label: string; value: string }[]).map(stat => (
          <span key={stat.label} className="text-[11px] text-[hsl(var(--muted))]">
            <span className="font-medium text-[hsl(var(--body-strong))]">{stat.value}</span> {stat.label}
          </span>
        ))}
      </div>

      {/* Roadmap section — always prominent */}
      <div className="mt-3 pt-3 border-t border-[hsl(var(--hairline))]">
        <button onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center gap-2 py-1.5 text-[12px] font-medium text-[hsl(var(--body-strong))] hover:text-[hsl(var(--primary))] transition-colors">
          <Map size={13} className="text-[hsl(var(--primary))]" />
          <span>Roadmap</span>
          {phaseCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-medium">
              {phaseCount} phases
            </span>
          )}
          <ArrowRight size={12} className={`ml-auto transition-transform ${expanded ? "rotate-90" : ""}`} />
        </button>

        {expanded && <RoadmapStepper goalId={goal.id} color={color} />}
      </div>
    </div>
  )
}