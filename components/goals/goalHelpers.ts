import { differenceInDays } from "date-fns"
import type { Goal, Session } from "@/lib/types"
import { EMPTY_GOAL_FORM } from "@/lib/constants"

export type FormState = {
  name: string
  tag: string
  targetHours: number
  weeklyTarget: number
  deadline: string
  color: string
}

export function getLoggedHours(tag: string, sessions: Session[]): number {
  const secs = sessions
    .filter(s => s.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase()))
    .reduce((sum, s) => sum + s.duration, 0)
  return Math.round((secs / 3600) * 10) / 10
}

export function getStatus(goal: Goal, logged: number): { label: string; style: string } {
  if (!goal.targetDate) return { label: "active", style: "bg-[hsl(var(--surface-strong))] text-[hsl(var(--muted))]" }
  const daysLeft = differenceInDays(new Date(goal.targetDate), new Date())
  const remaining = goal.targetHours - logged
  const weeksLeft = daysLeft / 7
  const neededPerWeek = weeksLeft > 0 ? remaining / weeksLeft : Infinity
  if (daysLeft < 0) return { label: "overdue", style: "bg-[hsl(var(--error))]/10 text-[hsl(var(--error))]" }
  if (logged >= goal.targetHours) return { label: "complete", style: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" }
  if (neededPerWeek > goal.weeklyTarget * 1.3) return { label: "behind", style: "bg-[hsl(var(--error))]/10 text-[hsl(var(--error))]" }
  if (neededPerWeek > goal.weeklyTarget * 1.05) return { label: "at risk", style: "bg-[hsl(var(--timeline-thinking))]/40 text-[hsl(var(--body-strong))]" }
  return { label: "on track", style: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" }
}

export function getNeededPerWeek(goal: Goal, logged: number): number {
  if (!goal.targetDate) return goal.weeklyTarget
  const daysLeft = differenceInDays(new Date(goal.targetDate), new Date())
  const weeksLeft = daysLeft / 7
  const remaining = Math.max(0, goal.targetHours - logged)
  if (weeksLeft <= 0) return remaining
  return Math.round((remaining / weeksLeft) * 10) / 10
}
