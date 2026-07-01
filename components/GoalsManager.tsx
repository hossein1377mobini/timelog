"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Target, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Check, X, Map } from "lucide-react"
import { differenceInDays } from "date-fns"
import type { Goal, Session, Phase } from "@/lib/types"
import { generateId } from "@/lib/utils"
import { getGoals, setGoals, getSessions, dispatchStorageEvent, saveRoadmapForGoal, getRoadmapForGoal } from "@/lib/storage"
import { GOAL_COLORS, EMPTY_GOAL_FORM } from "@/lib/constants"

// ── helpers ───────────────────────────────────────────────────────────────────
function getLoggedHours(tag: string, sessions: Session[]): number {
  const secs = sessions
    .filter(s => s.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase()))
    .reduce((sum, s) => sum + s.duration, 0)
  return Math.round((secs / 3600) * 10) / 10
}

function getStatus(goal: Goal, logged: number) {
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

function getNeededPerWeek(goal: Goal, logged: number): number {
  if (!goal.targetDate) return goal.weeklyTarget
  const daysLeft = differenceInDays(new Date(goal.targetDate), new Date())
  const weeksLeft = daysLeft / 7
  const remaining = Math.max(0, goal.targetHours - logged)
  if (weeksLeft <= 0) return remaining
  return Math.round((remaining / weeksLeft) * 10) / 10
}

type FormState = typeof EMPTY_GOAL_FORM

// ── RoadmapStepper ────────────────────────────────────────────────────────────
function RoadmapStepper({
  goalId,
  color,
}: {
  goalId: string
  color: { bar: string }
}) {
  const [phases, setPhases] = useState<Phase[]>([])
  const [adding, setAdding] = useState(false)
  const [input, setInput] = useState("")

  useEffect(() => {
    loadPhases()
  }, [goalId])

  function loadPhases() {
    const loaded = getRoadmapForGoal(goalId)
    setPhases(loaded)
  }

  function savePhases(updated: Phase[]) {
    saveRoadmapForGoal(goalId, updated)
    setPhases(updated)
  }

  function toggleDone(id: string) {
    const idx = phases.findIndex(p => p.id === id)
    if (idx < 0) return
    const currentDoneUpTo = phases.reduce((last, p, i) => p.done ? i : last, -1)
    if (idx === currentDoneUpTo) {
      savePhases(phases.map((p, i) => ({ ...p, done: i < idx })))
    } else {
      savePhases(phases.map((p, i) => ({ ...p, done: i <= idx })))
    }
  }

  function addPhase() {
    const name = input.trim()
    if (!name) return
    savePhases([...phases, { id: generateId(), name, done: false }])
    setInput("")
    setAdding(false)
  }

  function removePhase(id: string) {
    savePhases(phases.filter(p => p.id !== id))
  }

  const currentIdx = phases.findIndex(p => !p.done)

  if (phases.length === 0 && !adding) {
    return (
      <div className="pt-2 border-t border-[hsl(var(--hairline))] mt-3">
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] transition-colors"
        >
          <Map size={11} />
          Add roadmap phases
        </button>
      </div>
    )
  }

  return (
    <div className="pt-3 border-t border-[hsl(var(--hairline))] mt-3 space-y-2.5">
      <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted))] font-medium">Roadmap</p>

      {phases.length > 0 && (
        <div className="flex items-center gap-0 overflow-x-auto pb-1 -mx-0.5 px-0.5">
          {phases.map((phase, i) => {
            const isDone = phase.done
            const isCurrent = i === currentIdx

            return (
              <React.Fragment key={phase.id}>
                {i > 0 && (
                  <div
                    className="h-px w-4 shrink-0 transition-colors"
                    style={{ background: phases[i - 1].done ? color.bar : "hsl(var(--hairline-strong))" }}
                  />
                )}

                <div className="flex flex-col items-center gap-1 shrink-0 group/phase">
                  <button
                    onClick={() => toggleDone(phase.id)}
                    title={isDone ? "Mark incomplete" : "Mark complete"}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${
                      isDone
                        ? "border-transparent text-white"
                        : isCurrent
                        ? "border-2 bg-transparent"
                        : "border-[hsl(var(--hairline-strong))] bg-transparent"
                    }`}
                    style={
                      isDone
                        ? { background: color.bar }
                        : isCurrent
                        ? { borderColor: color.bar }
                        : {}
                    }
                  >
                    {isDone && <Check size={11} strokeWidth={2.5} />}
                    {isCurrent && (
                      <div className="w-2 h-2 rounded-full" style={{ background: color.bar }} />
                    )}
                  </button>

                  <div className="flex flex-col items-center gap-0.5 relative">
                    <span
                      className={`text-[10px] font-medium max-w-[60px] text-center leading-tight truncate ${
                        isDone
                          ? "text-[hsl(var(--muted))] line-through"
                          : isCurrent
                          ? "text-[hsl(var(--body-strong))]"
                          : "text-[hsl(var(--muted))]"
                      }`}
                    >
                      {phase.name}
                    </span>
                    {isCurrent && (
                      <span
                        className="text-[9px] font-semibold px-1 py-0.5 rounded-sm text-white leading-none"
                        style={{ background: color.bar }}
                      >
                        Now
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => removePhase(phase.id)}
                    className="opacity-0 group-hover/phase:opacity-100 w-3.5 h-3.5 flex items-center justify-center rounded-full text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] transition-all"
                    aria-label="Remove phase"
                  >
                    <X size={9} />
                  </button>
                </div>
              </React.Fragment>
            )
          })}
        </div>
      )}

      {adding ? (
        <div className="flex gap-2">
          <Input
            autoFocus
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") addPhase()
              if (e.key === "Escape") { setAdding(false); setInput("") }
            }}
            placeholder="Phase name"
            className="h-7 text-[11px] bg-[hsl(var(--surface-card))] border-[hsl(var(--hairline))]"
          />
          <button
            onClick={addPhase}
            disabled={!input.trim()}
            className="h-7 px-2.5 rounded-[6px] border border-[hsl(var(--hairline))] text-[11px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] hover:border-[hsl(var(--hairline-strong))] disabled:opacity-30 transition-all"
          >
            Add
          </button>
          <button
            onClick={() => { setAdding(false); setInput("") }}
            className="h-7 w-7 flex items-center justify-center rounded-[6px] border border-[hsl(var(--hairline))] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] transition-all"
          >
            <X size={11} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-[11px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] transition-colors"
        >
          <Plus size={11} />
          Add phase
        </button>
      )}
    </div>
  )
}

// ── GoalCard ──────────────────────────────────────────────────────────────────
function GoalCard({
  goal,
  sessions,
  onEdit,
  onDelete,
}: {
  goal: Goal
  sessions: Session[]
  onEdit: () => void
  onDelete: () => void
}) {
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
    const loaded = getRoadmapForGoal(goal.id)
    setPhaseCount(loaded.length)
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
          <button
            onClick={onEdit}
            className="w-7 h-7 rounded-[6px] border border-[hsl(var(--hairline))] flex items-center justify-center text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] hover:border-[hsl(var(--hairline-strong))] hover:bg-[hsl(var(--surface-strong))] transition-all active:scale-95"
            aria-label="Edit goal"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-[6px] border border-[hsl(var(--hairline))] flex items-center justify-center text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] hover:border-[hsl(var(--error))]/50 hover:bg-[hsl(var(--error))]/5 transition-all active:scale-95"
            aria-label="Delete goal"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-1.5 bg-[hsl(var(--surface-strong))] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: color.bar }}
          />
        </div>
        <span className="text-[12px] font-medium tabular-nums w-9 text-right text-[hsl(var(--body-strong))]">{pct}%</span>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {([
          { label: "logged", value: `${logged}h` },
          { label: "remaining", value: `${remaining}h` },
          { label: "needed/wk", value: `${neededPerWeek}h` },
          daysLeft !== null
            ? { label: "days left", value: daysLeft > 0 ? `${daysLeft}` : "overdue" }
            : null,
        ].filter(Boolean) as { label: string; value: string }[]).map(stat => (
          <span key={stat.label} className="text-[11px] text-[hsl(var(--muted))]">
            <span className="font-medium text-[hsl(var(--body-strong))]">{stat.value}</span>
            {" "}{stat.label}
          </span>
        ))}
      </div>

      {/* Roadmap toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="mt-3 flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] transition-colors"
      >
        <Map size={11} />
        {phaseCount > 0 ? `Roadmap · ${phaseCount} phases` : "Roadmap"}
        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {expanded && (
        <RoadmapStepper goalId={goal.id} color={color} />
      )}
    </div>
  )
}

// ── main GoalsManager ─────────────────────────────────────────────────────────
export default function GoalsManager() {
  const [goals, setGoalsState] = useState<Goal[]>([])
  const [sessions, setSessionsState] = useState<Session[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_GOAL_FORM)
  const [errors, setErrors] = useState<Partial<FormState>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    loadGoals()
    loadSessions()
    window.addEventListener("compass-storage-update", () => {
      loadGoals()
      loadSessions()
    })
    return () => window.removeEventListener("compass-storage-update", () => {
      loadGoals()
      loadSessions()
    })
  }, [])

  function loadGoals() {
    setGoalsState(getGoals())
  }
  function loadSessions() {
    setSessionsState(getSessions())
  }

  function saveGoalsLocal(updated: Goal[]) {
    setGoals(updated)
    setGoalsState(updated)
    dispatchStorageEvent()
  }

  function openAdd() {
    setEditingId(null); setForm(EMPTY_GOAL_FORM); setErrors({}); setOpen(true)
  }
  function openEdit(goal: Goal) {
    setEditingId(goal.id)
    setForm({
      name: goal.name,
      tag: goal.tag,
      targetHours: goal.targetHours,
      deadline: goal.targetDate || "",
      weeklyTarget: goal.weeklyTarget,
      color: goal.color,
    })
    setErrors({}); setOpen(true)
  }

  function validate(): boolean {
    const e: Partial<FormState> = {}
    if (!form.name.trim()) e.name = "Name is required"
    if (!form.tag.trim()) e.tag = "Tag is required"
    if (!form.targetHours || form.targetHours <= 0) e.targetHours = 1
    if (!form.weeklyTarget || form.weeklyTarget <= 0) e.weeklyTarget = 1
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const tag = form.tag.trim().startsWith("#") ? form.tag.trim() : `#${form.tag.trim()}`
    if (editingId !== null) {
      saveGoalsLocal(goals.map(g => g.id === editingId
        ? {
            ...g,
            name: form.name.trim(),
            tag,
            targetHours: Number(form.targetHours),
            targetDate: form.deadline,
            weeklyTarget: Number(form.weeklyTarget),
            color: form.color,
            updatedAt: new Date().toISOString(),
          }
        : g
      ))
    } else {
      const now = new Date().toISOString()
      saveGoalsLocal([...goals, {
        id: generateId(),
        name: form.name.trim(),
        description: "",
        category: "",
        tag,
        targetHours: Number(form.targetHours),
        targetDate: form.deadline,
        weeklyTarget: Number(form.weeklyTarget),
        priority: "medium",
        status: "active",
        color: form.color,
        roadmap: [],
        createdAt: now,
        updatedAt: now,
      }])
    }
    setOpen(false)
  }

  function handleDelete(id: string) {
    saveGoalsLocal(goals.filter(g => g.id !== id))
    setDeleteConfirm(null)
  }

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  const totalLoggedHours = goals.reduce((sum, g) => sum + getLoggedHours(g.tag, sessions), 0)
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0,0,0,0)
  const weekSessions = sessions.filter(s => new Date(s.startedAt) >= weekStart)
  const weekHours = Math.round(weekSessions.reduce((s, x) => s + x.duration, 0) / 3600 * 10) / 10
  const weekTarget = goals.reduce((s, g) => s + g.weeklyTarget, 0)
  const onTrackCount = goals.filter(g => getStatus(g, getLoggedHours(g.tag, sessions)).label === "on track").length

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[14px] font-medium flex items-center gap-1.5">
              <Target size={14} className="text-[hsl(var(--muted))]" />
              Goals
            </CardTitle>
            <Button size="sm" onClick={openAdd} className="h-7 text-[12px] px-3 gap-1 transition-all hover:scale-[1.02] active:scale-[0.97]">
              <Plus size={12} />
              Add goal
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {goals.length > 0 && (
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
          )}

          {goals.length === 0 ? (
            <div
              onClick={openAdd}
              className="border border-dashed border-[hsl(var(--hairline-strong))] rounded-[12px] p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[hsl(var(--body))]/30 hover:bg-[hsl(var(--canvas-soft))] transition-all group"
            >
              <Target size={20} className="text-[hsl(var(--muted))] group-hover:text-[hsl(var(--body-strong))] transition-colors" />
              <p className="text-[14px] text-[hsl(var(--muted))] group-hover:text-[hsl(var(--body-strong))] transition-colors">Add your first goal</p>
              <p className="text-[12px] text-[hsl(var(--muted))] text-center max-w-48">Track big goals and automatically link time from your sessions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  sessions={sessions}
                  onEdit={() => openEdit(goal)}
                  onDelete={() => setDeleteConfirm(goal.id)}
                />
              ))}
              <button
                onClick={openAdd}
                className="w-full border border-dashed border-[hsl(var(--hairline-strong))] rounded-[12px] py-3 flex items-center justify-center gap-2 text-[12px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] hover:border-[hsl(var(--body))]/30 hover:bg-[hsl(var(--canvas-soft))] transition-all active:scale-[0.99]"
              >
                <Plus size={13} />
                Add another goal
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold">{editingId ? "Edit goal" : "New goal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Goal name</label>
              <Input value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("name", e.target.value)} placeholder="e.g. Complete PhD Thesis" className="h-9 text-[14px]" aria-invalid={!!errors.name} />
              {errors.name && <p className="text-[12px] text-[hsl(var(--error))]">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                Linked tag
                <span className="font-normal ml-1 text-[hsl(var(--muted))]">— sessions with this tag count toward this goal</span>
              </label>
              <Input value={form.tag} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("tag", e.target.value)} placeholder="#phd" className="h-9 text-[14px] font-mono" aria-invalid={!!errors.tag} />
              {errors.tag && <p className="text-[12px] text-[hsl(var(--error))]">{errors.tag}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Target hours</label>
                <Input type="number" min={1} value={form.targetHours} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("targetHours", Number(e.target.value))} className="h-9 text-[14px]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Weekly target (h)</label>
                <Input type="number" min={1} value={form.weeklyTarget} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("weeklyTarget", Number(e.target.value))} className="h-9 text-[14px]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Deadline <span className="font-normal">(optional)</span></label>
              <Input type="date" value={form.deadline} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("deadline", e.target.value)} className="h-9 text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Color</label>
              <div className="flex gap-2 flex-wrap">
                {GOAL_COLORS.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setField("color", c.name)}
                    className={`w-7 h-7 rounded-full transition-all active:scale-90 ${form.color === c.name ? "ring-2 ring-offset-2 ring-[hsl(var(--body-strong))] scale-110" : "hover:scale-105 opacity-70 hover:opacity-100"}`}
                    style={{ background: c.bar }}
                    aria-label={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))]">Cancel</Button>
            <Button size="sm" onClick={handleSave} className="transition-all hover:scale-[1.01] active:scale-[0.98]">{editingId ? "Save changes" : "Create goal"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold">Delete goal?</DialogTitle>
          </DialogHeader>
          <p className="text-[14px] text-[hsl(var(--muted))] py-1">
            This will remove the goal, its roadmap, and progress tracking. Your session history won't be affected.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => deleteConfirm !== null && handleDelete(deleteConfirm)} className="transition-all active:scale-[0.97]">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}