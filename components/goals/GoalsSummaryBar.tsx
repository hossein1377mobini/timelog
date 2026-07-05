import { getLoggedHours, getStatus } from "./goalHelpers"
import type { Goal, Session } from "@/lib/types"

interface Props {
  goals: Goal[]
  sessions: Session[]
}

export function GoalsSummaryBar({ goals, sessions }: Props) {
  const totalLoggedHours = goals.reduce((sum, g) => sum + getLoggedHours(g.tag, sessions), 0)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekSessions = sessions.filter(s => new Date(s.startedAt) >= weekStart)
  const weekHours = Math.round(weekSessions.reduce((s, x) => s + x.duration, 0) / 3600 * 10) / 10
  const weekTarget = goals.reduce((s, g) => s + g.weeklyTarget, 0)
  const onTrackCount = goals.filter(g => getStatus(g, getLoggedHours(g.tag, sessions)).label === "on track").length

  return (
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: "Active", value: goals.length, sub: `${onTrackCount} on track` },
        { label: "Total logged", value: `${Math.round(totalLoggedHours)}h`, sub: "all goals" },
        { label: "This week", value: `${weekHours}h`, sub: `of ${weekTarget}h target` },
      ].map(m => (
        <div key={m.label} className="bg-[hsl(var(--canvas-soft))] rounded-[8px] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted))] mb-1">{m.label}</p>
          <p className="text-[18px] font-normal leading-none text-[hsl(var(--body-strong))]">{m.value}</p>
          <p className="text-[10px] text-[hsl(var(--muted))] mt-1">{m.sub}</p>
        </div>
      ))}
    </div>
  )
}
