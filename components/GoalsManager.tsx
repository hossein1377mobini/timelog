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
import { Target, Plus, Edit2, Trash2, TrendingUp } from "lucide-react"
import { differenceInDays, formatDistanceToNow } from "date-fns"

interface Goal {
  id: number
  name: string
  tag: string
  targetHours: number
  deadline: string
  weeklyTarget: number
  color: string
  createdAt: number
}

interface Session {
  id: number
  taskName: string
  tags: string[]
  duration: number
  startedAt: number
}

const GOAL_COLORS = [
  { name: "Purple", bar: "#534AB7", cat: "bg-[#EEEDFE] text-[#3C3489] dark:bg-[#26215C] dark:text-[#CECBF6]" },
  { name: "Teal",   bar: "#0F6E56", cat: "bg-[#E1F5EE] text-[#085041] dark:bg-[#04342C] dark:text-[#9FE1CB]" },
  { name: "Amber",  bar: "#854F0B", cat: "bg-[#FAEEDA] text-[#633806] dark:bg-[#412402] dark:text-[#FAC775]" },
  { name: "Gray",   bar: "#5F5E5A", cat: "bg-[#F1EFE8] text-[#444441] dark:bg-[#2C2C2A] dark:text-[#D3D1C7]" },
  { name: "Blue",   bar: "#185FA5", cat: "bg-[#E6F1FB] text-[#0C447C] dark:bg-[#042C53] dark:text-[#B5D4F4]" },
  { name: "Coral",  bar: "#993C1D", cat: "bg-[#FAECE7] text-[#712B13] dark:bg-[#4A1B0C] dark:text-[#F5C4B3]" },
]

const EMPTY_FORM = {
  name: "",
  tag: "",
  targetHours: 100,
  deadline: "",
  weeklyTarget: 10,
  color: GOAL_COLORS[0].name,
}

type FormState = typeof EMPTY_FORM

function getLoggedHours(tag: string, sessions: Session[]): number {
  const secs = sessions
    .filter(s => s.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase()))
    .reduce((sum, s) => sum + s.duration, 0)
  return Math.round((secs / 3600) * 10) / 10
}

function getStatus(goal: Goal, logged: number) {
  if (!goal.deadline) return { label: "active", style: "bg-[hsl(var(--surface-strong))] text-[hsl(var(--muted))]" }
  const daysLeft = differenceInDays(new Date(goal.deadline), new Date())
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
  if (!goal.deadline) return goal.weeklyTarget
  const daysLeft = differenceInDays(new Date(goal.deadline), new Date())
  const weeksLeft = daysLeft / 7
  const remaining = Math.max(0, goal.targetHours - logged)
  if (weeksLeft <= 0) return remaining
  return Math.round((remaining / weeksLeft) * 10) / 10
}

export default function GoalsManager() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<FormState>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  useEffect(() => {
    loadGoals()
    loadSessions()
    window.addEventListener("storage", loadSessions)
    return () => window.removeEventListener("storage", loadSessions)
  }, [])

  function loadGoals() {
    setGoals(JSON.parse(localStorage.getItem("compass_goals") || "[]"))
  }

  function loadSessions() {
    setSessions(JSON.parse(localStorage.getItem("compass_sessions") || "[]"))
  }

  function saveGoals(updated: Goal[]) {
    localStorage.setItem("compass_goals", JSON.stringify(updated))
    setGoals(updated)
  }

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setOpen(true)
  }

  function openEdit(goal: Goal) {
    setEditingId(goal.id)
    setForm({
      name: goal.name,
      tag: goal.tag,
      targetHours: goal.targetHours,
      deadline: goal.deadline,
      weeklyTarget: goal.weeklyTarget,
      color: goal.color,
    })
    setErrors({})
    setOpen(true)
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
    const color = GOAL_COLORS.find(c => c.name === form.color) || GOAL_COLORS[0]
    if (editingId !== null) {
      saveGoals(goals.map(g => g.id === editingId
        ? { ...g, ...form, tag: form.tag.startsWith("#") ? form.tag : `#${form.tag}` }
        : g
      ))
    } else {
      const newGoal: Goal = {
        id: Date.now(),
        name: form.name.trim(),
        tag: form.tag.trim().startsWith("#") ? form.tag.trim() : `#${form.tag.trim()}`,
        targetHours: Number(form.targetHours),
        deadline: form.deadline,
        weeklyTarget: Number(form.weeklyTarget),
        color: color.name,
        createdAt: Date.now(),
      }
      saveGoals([...goals, newGoal])
    }
    setOpen(false)
  }

  function handleDelete(id: number) {
    saveGoals(goals.filter(g => g.id !== id))
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
      <Card className="">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[14px] font-medium flex items-center gap-1.5">
              <Target size={14} className="text-[hsl(var(--muted))]" />
              Goals
            </CardTitle>
            <Button
              size="sm"
              onClick={openAdd}
              className="h-7 text-[12px] px-3 gap-1 transition-all hover:scale-[1.02] active:scale-[0.97]"
            >
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
              <p className="text-[14px] text-[hsl(var(--muted))] group-hover:text-[hsl(var(--body-strong))] transition-colors">
                Add your first goal
              </p>
              <p className="text-[12px] text-[hsl(var(--muted))] text-center max-w-48">
                Track big goals and automatically link time from your sessions
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map(goal => {
                const color = GOAL_COLORS.find(c => c.name === goal.color) || GOAL_COLORS[0]
                const logged = getLoggedHours(goal.tag, sessions)
                const pct = Math.min(100, Math.round((logged / goal.targetHours) * 100))
                const remaining = Math.max(0, Math.round((goal.targetHours - logged) * 10) / 10)
                const daysLeft = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null
                const neededPerWeek = getNeededPerWeek(goal, logged)
                const status = getStatus(goal, logged)

                return (
                  <div
                    key={goal.id}
                    className="border border-[hsl(var(--hairline))] rounded-[12px] p-4 hover:border-[hsl(var(--hairline-strong))] transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-medium text-[hsl(var(--body-strong))]">{goal.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${color.cat}`}>
                            {goal.tag}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.style}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-[hsl(var(--muted))]">
                          {goal.targetHours}h target
                          {goal.deadline && ` · due ${new Date(goal.deadline).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                        <button
                          onClick={() => openEdit(goal)}
                          className="w-7 h-7 rounded-[6px] border border-[hsl(var(--hairline))] flex items-center justify-center text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] hover:border-[hsl(var(--hairline-strong))] hover:bg-[hsl(var(--surface-strong))] transition-all active:scale-95"
                          aria-label="Edit goal"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(goal.id)}
                          className="w-7 h-7 rounded-[6px] border border-[hsl(var(--hairline))] flex items-center justify-center text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] hover:border-[hsl(var(--error))]/50 hover:bg-[hsl(var(--error))]/5 transition-all active:scale-95"
                          aria-label="Delete goal"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-1.5 bg-[hsl(var(--surface-strong))] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: color.bar }}
                        />
                      </div>
                      <span className="text-[12px] font-medium tabular-nums w-9 text-right text-[hsl(var(--body-strong))]">{pct}%</span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {[
                        { label: "logged", value: `${logged}h` },
                        { label: "remaining", value: `${remaining}h` },
                        { label: "needed/wk", value: `${neededPerWeek}h` },
                        daysLeft !== null
                          ? { label: "days left", value: daysLeft > 0 ? `${daysLeft}` : "overdue" }
                          : null,
                      ].filter(Boolean).map(stat => (
                        <span key={stat!.label} className="text-[11px] text-[hsl(var(--muted))]">
                          <span className="font-medium text-[hsl(var(--body-strong))]">{stat!.value}</span>
                          {" "}{stat!.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}

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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold">
              {editingId ? "Edit goal" : "New goal"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Goal name</label>
              <Input
                value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("name", e.target.value)}
                placeholder="e.g. Complete PhD Thesis"
                className="h-9 text-[14px]"
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-[12px] text-[hsl(var(--error))]">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                Linked tag
                <span className="font-normal ml-1 text-[hsl(var(--muted))]">— sessions with this tag count toward this goal</span>
              </label>
              <Input
                value={form.tag}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("tag", e.target.value)}
                placeholder="#phd"
                className="h-9 text-[14px] font-mono"
                aria-invalid={!!errors.tag}
              />
              {errors.tag && <p className="text-[12px] text-[hsl(var(--error))]">{errors.tag}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Target hours</label>
                <Input
                  type="number"
                  min={1}
                  value={form.targetHours}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("targetHours", Number(e.target.value))}
                  className="h-9 text-[14px]"
                  aria-invalid={!!errors.targetHours}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Weekly target (h)</label>
                <Input
                  type="number"
                  min={1}
                  value={form.weeklyTarget}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("weeklyTarget", Number(e.target.value))}
                  className="h-9 text-[14px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                Deadline
                <span className="font-normal ml-1 text-[hsl(var(--muted))]">(optional)</span>
              </label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("deadline", e.target.value)}
                className="h-9 text-[14px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Color</label>
              <div className="flex gap-2 flex-wrap">
                {GOAL_COLORS.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setField("color", c.name)}
                    className={`w-7 h-7 rounded-full transition-all active:scale-90 ${
                      form.color === c.name
                        ? "ring-2 ring-offset-2 ring-[hsl(var(--body-strong))] scale-110"
                        : "hover:scale-105 opacity-70 hover:opacity-100"
                    }`}
                    style={{ background: c.bar }}
                    aria-label={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="transition-all hover:scale-[1.01] active:scale-[0.98]"
            >
              {editingId ? "Save changes" : "Create goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold">Delete goal?</DialogTitle>
          </DialogHeader>
          <p className="text-[14px] text-[hsl(var(--muted))] py-1">
            This will remove the goal and its progress tracking. Your session history won&apos;t be affected.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteConfirm !== null && handleDelete(deleteConfirm)}
              className="transition-all active:scale-[0.97]"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
