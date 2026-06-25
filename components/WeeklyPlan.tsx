"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { CalendarDays, Plus, Trash2, Check, ChevronDown, ChevronUp } from "lucide-react"
import { startOfWeek, endOfWeek, format, isSameWeek } from "date-fns"

interface Goal {
  id: number
  name: string
  tag: string
  color: string
  weeklyTarget: number
}

interface WeekTask {
  id: number
  text: string
  done: boolean
}

interface WeekGoal {
  goalId: number
  hourTarget: number
  tasks: WeekTask[]
}

interface WeekPlan {
  weekStart: string
  goals: WeekGoal[]
}

const GOAL_COLORS: Record<string, { bar: string; cat: string }> = {
  Purple: { bar: "#534AB7", cat: "bg-[#EEEDFE] text-[#3C3489] dark:bg-[#26215C] dark:text-[#CECBF6]" },
  Teal:   { bar: "#0F6E56", cat: "bg-[#E1F5EE] text-[#085041] dark:bg-[#04342C] dark:text-[#9FE1CB]" },
  Amber:  { bar: "#854F0B", cat: "bg-[#FAEEDA] text-[#633806] dark:bg-[#412402] dark:text-[#FAC775]" },
  Gray:   { bar: "#5F5E5A", cat: "bg-[#F1EFE8] text-[#444441] dark:bg-[#2C2C2A] dark:text-[#D3D1C7]" },
  Blue:   { bar: "#185FA5", cat: "bg-[#E6F1FB] text-[#0C447C] dark:bg-[#042C53] dark:text-[#B5D4F4]" },
  Coral:  { bar: "#993C1D", cat: "bg-[#FAECE7] text-[#712B13] dark:bg-[#4A1B0C] dark:text-[#F5C4B3]" },
}

function getWeekKey(date = new Date()) {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd")
}

function getWeekLabel(date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return `${format(start, "MMM d")} – ${format(end, "MMM d")}`
}

export default function WeeklyPlan() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [plan, setPlan] = useState<WeekPlan | null>(null)
  const [showSetup, setShowSetup] = useState(false)
  const [selectedGoalIds, setSelectedGoalIds] = useState<number[]>([])
  const [taskInputs, setTaskInputs] = useState<Record<number, string>>({})
  const [hourTargets, setHourTargets] = useState<Record<number, number>>({})
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  const weekKey = getWeekKey()

  useEffect(() => {
    load()
    window.addEventListener("storage", load)
    return () => window.removeEventListener("storage", load)
  }, [])

  function load() {
    const g = JSON.parse(localStorage.getItem("compass_goals") || "[]")
    setGoals(g)
    const plans: WeekPlan[] = JSON.parse(localStorage.getItem("compass_weekly_plans") || "[]")
    const current = plans.find(p => p.weekStart === getWeekKey())
    setPlan(current || null)
  }

  function openSetup() {
    if (plan) {
      setSelectedGoalIds(plan.goals.map(g => g.goalId))
      const ht: Record<number, number> = {}
      plan.goals.forEach(g => { ht[g.goalId] = g.hourTarget })
      setHourTargets(ht)
    } else {
      setSelectedGoalIds([])
      setHourTargets({})
    }
    setTaskInputs({})
    setShowSetup(true)
  }

  function toggleGoal(id: number) {
    setSelectedGoalIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
    if (!hourTargets[id]) {
      const goal = goals.find(g => g.id === id)
      setHourTargets(prev => ({ ...prev, [id]: goal?.weeklyTarget || 5 }))
    }
  }

  function addTask(goalId: number) {
    const text = (taskInputs[goalId] || "").trim()
    if (!text) return
    const plans: WeekPlan[] = JSON.parse(localStorage.getItem("compass_weekly_plans") || "[]")
    const idx = plans.findIndex(p => p.weekStart === weekKey)
    if (idx >= 0) {
      const goalIdx = plans[idx].goals.findIndex(g => g.goalId === goalId)
      if (goalIdx >= 0) {
        plans[idx].goals[goalIdx].tasks.push({ id: Date.now(), text, done: false })
        localStorage.setItem("compass_weekly_plans", JSON.stringify(plans))
        load()
      }
    }
    setTaskInputs(prev => ({ ...prev, [goalId]: "" }))
  }

  function toggleTask(goalId: number, taskId: number) {
    const plans: WeekPlan[] = JSON.parse(localStorage.getItem("compass_weekly_plans") || "[]")
    const idx = plans.findIndex(p => p.weekStart === weekKey)
    if (idx < 0) return
    const gi = plans[idx].goals.findIndex(g => g.goalId === goalId)
    if (gi < 0) return
    const ti = plans[idx].goals[gi].tasks.findIndex(t => t.id === taskId)
    if (ti < 0) return
    plans[idx].goals[gi].tasks[ti].done = !plans[idx].goals[gi].tasks[ti].done
    localStorage.setItem("compass_weekly_plans", JSON.stringify(plans))
    load()
  }

  function deleteTask(goalId: number, taskId: number) {
    const plans: WeekPlan[] = JSON.parse(localStorage.getItem("compass_weekly_plans") || "[]")
    const idx = plans.findIndex(p => p.weekStart === weekKey)
    if (idx < 0) return
    const gi = plans[idx].goals.findIndex(g => g.goalId === goalId)
    if (gi < 0) return
    plans[idx].goals[gi].tasks = plans[idx].goals[gi].tasks.filter(t => t.id !== taskId)
    localStorage.setItem("compass_weekly_plans", JSON.stringify(plans))
    load()
  }

  function savePlan() {
    if (!selectedGoalIds.length) return
    const plans: WeekPlan[] = JSON.parse(localStorage.getItem("compass_weekly_plans") || "[]")
    const existing = plans.find(p => p.weekStart === weekKey)
    const newPlanGoals: WeekGoal[] = selectedGoalIds.map(goalId => {
      const existingGoal = existing?.goals.find(g => g.goalId === goalId)
      return {
        goalId,
        hourTarget: hourTargets[goalId] || 5,
        tasks: existingGoal?.tasks || [],
      }
    })
    const newPlan: WeekPlan = { weekStart: weekKey, goals: newPlanGoals }
    const updated = plans.filter(p => p.weekStart !== weekKey)
    updated.push(newPlan)
    localStorage.setItem("compass_weekly_plans", JSON.stringify(updated))
    setShowSetup(false)
    load()
  }

  function getLoggedHours(goalId: number): number {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return 0
    const sessions = JSON.parse(localStorage.getItem("compass_sessions") || "[]")
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const secs = sessions
      .filter((s: any) =>
        new Date(s.startedAt) >= weekStart &&
        s.tags.map((t: string) => t.toLowerCase()).includes(goal.tag.toLowerCase())
      )
      .reduce((sum: number, s: any) => sum + s.duration, 0)
    return Math.round((secs / 3600) * 10) / 10
  }

  return (
    <>
      <Card className="">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[14px] font-medium flex items-center gap-1.5">
              <CalendarDays size={14} className="text-[hsl(var(--muted))]" />
              Weekly plan
              <span className="text-[12px] font-normal text-[hsl(var(--muted))] ml-1">
                {getWeekLabel()}
              </span>
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={openSetup}
              className="h-7 text-[12px] px-3 transition-all hover:scale-[1.01] active:scale-[0.97]"
            >
              {plan ? "Edit plan" : "Set up week"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="">
          {!plan ? (
            <div
              onClick={openSetup}
              className="border border-dashed border-[hsl(var(--hairline-strong))] rounded-[12px] p-8 flex flex-col items-center gap-2 cursor-pointer hover:border-[hsl(var(--body))]/30 hover:bg-[hsl(var(--canvas-soft))] transition-all group"
            >
              <CalendarDays size={20} className="text-[hsl(var(--muted))] group-hover:text-[hsl(var(--body-strong))] transition-colors" />
              <p className="text-[14px] text-[hsl(var(--muted))] group-hover:text-[hsl(var(--body-strong))] transition-colors">
                Plan this week
              </p>
              <p className="text-[12px] text-[hsl(var(--muted))] text-center max-w-48">
                Pick goals and tasks to focus on this week
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {plan.goals.map(weekGoal => {
                const goal = goals.find(g => g.id === weekGoal.goalId)
                if (!goal) return null
                const color = GOAL_COLORS[goal.color] || GOAL_COLORS.Purple
                const logged = getLoggedHours(weekGoal.goalId)
                const pct = Math.min(100, Math.round((logged / weekGoal.hourTarget) * 100))
                const doneTasks = weekGoal.tasks.filter(t => t.done).length
                const isExpanded = expanded[weekGoal.goalId] !== false

                return (
                  <div key={weekGoal.goalId} className="border border-[hsl(var(--hairline))] rounded-[12px] overflow-hidden">
                    <button
                      onClick={() => setExpanded(prev => ({ ...prev, [weekGoal.goalId]: !isExpanded }))}
                      className="w-full flex items-center gap-3 p-3 hover:bg-[hsl(var(--canvas-soft))] transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[12px] font-medium text-[hsl(var(--body-strong))]">{goal.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${color.cat}`}>
                            {goal.tag}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-[hsl(var(--surface-strong))] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: color.bar }}
                            />
                          </div>
                          <span className="text-[10px] text-[hsl(var(--muted))] whitespace-nowrap">
                            {logged}h / {weekGoal.hourTarget}h
                          </span>
                          {doneTasks > 0 && (
                            <span className="text-[10px] text-[hsl(var(--muted))] whitespace-nowrap">
                              {doneTasks}/{weekGoal.tasks.length} tasks
                            </span>
                          )}
                        </div>
                      </div>
                      {isExpanded
                        ? <ChevronUp size={14} className="text-[hsl(var(--muted))] shrink-0" />
                        : <ChevronDown size={14} className="text-[hsl(var(--muted))] shrink-0" />
                      }
                    </button>

                    {isExpanded && (
                      <div className="border-t border-[hsl(var(--hairline))] px-3 pb-3 pt-2 space-y-1.5 bg-[hsl(var(--canvas-soft))]/50">
                        {weekGoal.tasks.length === 0 && (
                          <p className="text-[12px] text-[hsl(var(--muted))] py-1">No tasks yet — add some below</p>
                        )}
                        {weekGoal.tasks.map(task => (
                          <div
                            key={task.id}
                            className={`group flex items-center gap-2 p-2 rounded-[8px] border transition-all ${
                              task.done
                                ? "border-[hsl(var(--success))]/20 bg-[hsl(var(--success))]/5"
                                : "border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))] hover:border-[hsl(var(--hairline-strong))]"
                            }`}
                          >
                            <button
                              onClick={() => toggleTask(weekGoal.goalId, task.id)}
                              className={`w-4 h-4 rounded-[4px] flex items-center justify-center border transition-all shrink-0 ${
                                task.done
                                  ? "bg-[hsl(var(--success))] border-[hsl(var(--success))]"
                                  : "border-[hsl(var(--hairline))] hover:border-[hsl(var(--hairline-strong))]"
                              }`}
                            >
                              {task.done && <Check size={10} className="text-white" />}
                            </button>
                            <span className={`text-[12px] flex-1 ${task.done ? "line-through text-[hsl(var(--muted))]" : "text-[hsl(var(--body-strong))]"}`}>
                              {task.text}
                            </span>
                            <button
                              onClick={() => deleteTask(weekGoal.goalId, task.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-[hsl(var(--muted))] hover:text-[hsl(var(--error))]"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ))}

                        <div className="flex gap-2 pt-1">
                          <Input
                            value={taskInputs[weekGoal.goalId] || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaskInputs(prev => ({ ...prev, [weekGoal.goalId]: e.target.value }))}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addTask(weekGoal.goalId)}
                            placeholder="Add a task..."
                            className="h-8 text-[12px]"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 shrink-0"
                            onClick={() => addTask(weekGoal.goalId)}
                            disabled={!taskInputs[weekGoal.goalId]?.trim()}
                          >
                            <Plus size={12} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold">
              {plan ? "Edit weekly plan" : "Plan this week"}
              <span className="text-[12px] font-normal text-[hsl(var(--muted))] ml-2">
                {getWeekLabel()}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {goals.length === 0 ? (
              <p className="text-[14px] text-[hsl(var(--muted))] text-center py-4">
                Add goals first before planning your week.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                    Which goals will you focus on this week?
                  </label>
                  <div className="space-y-2">
                    {goals.map(goal => {
                      const color = GOAL_COLORS[goal.color] || GOAL_COLORS.Purple
                      const selected = selectedGoalIds.includes(goal.id)
                      return (
                        <div key={goal.id} className="space-y-2">
                          <button
                            onClick={() => toggleGoal(goal.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-[12px] border text-left transition-all ${
                              selected
                                ? "border-[hsl(var(--hairline-strong))] bg-[hsl(var(--canvas-soft))]"
                                : "border-[hsl(var(--hairline))] hover:border-[hsl(var(--hairline-strong))] hover:bg-[hsl(var(--canvas-soft))]/50"
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all shrink-0 ${
                              selected ? "bg-[hsl(var(--body-strong))] border-[hsl(var(--body-strong))]" : "border-[hsl(var(--hairline))]"
                            }`}>
                              {selected && <Check size={10} className="text-[hsl(var(--canvas))]" />}
                            </div>
                            <span className={`text-[12px] px-2 py-0.5 rounded-full font-medium ${color.cat}`}>
                              {goal.tag}
                            </span>
                            <span className="text-[14px] flex-1 text-[hsl(var(--body-strong))]">{goal.name}</span>
                          </button>

                          {selected && (
                            <div className="pl-3 flex items-center gap-2">
                              <label className="text-[12px] text-[hsl(var(--muted))] whitespace-nowrap">
                                Hour target this week:
                              </label>
                              <Input
                                type="number"
                                min={1}
                                value={hourTargets[goal.id] || goal.weeklyTarget}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHourTargets(prev => ({ ...prev, [goal.id]: Number(e.target.value) }))}
                                className="h-7 w-20 text-[12px]"
                              />
                              <span className="text-[12px] text-[hsl(var(--muted))]">hours</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <p className="text-[12px] text-[hsl(var(--muted))]">
                  You&apos;ll add specific tasks after saving — directly in the weekly plan card.
                </p>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSetup(false)}
              className="text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))]">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={savePlan}
              disabled={!selectedGoalIds.length}
              className="transition-all hover:scale-[1.01] active:scale-[0.98]"
            >
              {plan ? "Save changes" : "Save plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
