"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Sun, Moon, Plus, Check, X } from "lucide-react"
import { format, startOfWeek } from "date-fns"

interface WeekTask { id: number; text: string; done: boolean }
interface WeekGoal { goalId: number; hourTarget: number; tasks: WeekTask[] }
interface WeekPlan { weekStart: string; goals: WeekGoal[] }
interface Goal { id: number; name: string; tag: string; color: string }

interface DailyTask {
  id: number
  text: string
  done: boolean
  fromWeekly: boolean
  weeklyGoalId?: number
  weeklyTaskId?: number
}

interface MorningPlan {
  oneThing: string
  tasks: DailyTask[]
  interruptions: string
  mood: number
  energy: number
}

interface EveningReflection {
  accomplishments: string
  distractions: string
  rating: number
  differently: string
  gratitude: [string, string, string]
  tomorrowFocus: string
  mood: number
}

interface DailyRecord {
  date: string
  morning?: MorningPlan
  evening?: EveningReflection
}

const MOODS = ["😔", "😐", "🙂", "😊", "🤩"]

const GOAL_COLORS: Record<string, string> = {
  Purple: "bg-[#EEEDFE] text-[#3C3489] dark:bg-[#26215C] dark:text-[#CECBF6]",
  Teal:   "bg-[#E1F5EE] text-[#085041] dark:bg-[#04342C] dark:text-[#9FE1CB]",
  Amber:  "bg-[#FAEEDA] text-[#633806] dark:bg-[#412402] dark:text-[#FAC775]",
  Gray:   "bg-[#F1EFE8] text-[#444441] dark:bg-[#2C2C2A] dark:text-[#D3D1C7]",
  Blue:   "bg-[#E6F1FB] text-[#0C447C] dark:bg-[#042C53] dark:text-[#B5D4F4]",
  Coral:  "bg-[#FAECE7] text-[#712B13] dark:bg-[#4A1B0C] dark:text-[#F5C4B3]",
}

function todayKey() { return format(new Date(), "yyyy-MM-dd") }
function weekKey() {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
}

export default function DailyPlanning() {
  const [tab, setTab] = useState<"morning" | "evening">("morning")
  const [record, setRecord] = useState<DailyRecord>({ date: todayKey() })
  const [editing, setEditing] = useState<boolean>(true)
  const [goals, setGoals] = useState<Goal[]>([])
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null)
  const [newFreeTask, setNewFreeTask] = useState("")

  const [oneThing, setOneThing] = useState("")
  const [interruptions, setInterruptions] = useState("")
  const [mood, setMood] = useState(0)
  const [energy, setEnergy] = useState(0)
  const [tasks, setTasks] = useState<DailyTask[]>([])

  const [accomplishments, setAccomplishments] = useState("")
  const [distractions, setDistractions] = useState("")
  const [rating, setRating] = useState(0)
  const [differently, setDifferently] = useState("")
  const [gratitude, setGratitude] = useState<[string, string, string]>(["", "", ""])
  const [tomorrowFocus, setTomorrowFocus] = useState("")
  const [eveningMood, setEveningMood] = useState(0)

  useEffect(() => {
    load()
    window.addEventListener("storage", load)
    return () => window.removeEventListener("storage", load)
  }, [])

  function load() {
    const g: Goal[] = JSON.parse(localStorage.getItem("compass_goals") || "[]")
    setGoals(g)

    const plans: WeekPlan[] = JSON.parse(localStorage.getItem("compass_weekly_plans") || "[]")
    const wp = plans.find(p => p.weekStart === weekKey()) || null
    setWeekPlan(wp)

    const records: DailyRecord[] = JSON.parse(localStorage.getItem("compass_daily_records") || "[]")
    const today = records.find(r => r.date === todayKey())

    if (today) {
      setRecord(today)
      if (today.morning) {
        setOneThing(today.morning.oneThing)
        setTasks(today.morning.tasks)
        setInterruptions(today.morning.interruptions)
        setMood(today.morning.mood)
        setEnergy(today.morning.energy)
        setEditing(false)
      } else {
        if (wp) {
          const preloaded: DailyTask[] = []
          wp.goals.forEach(wg => {
            wg.tasks.filter(t => !t.done).forEach(t => {
              preloaded.push({
                id: Date.now() + Math.random(),
                text: t.text,
                done: false,
                fromWeekly: true,
                weeklyGoalId: wg.goalId,
                weeklyTaskId: t.id,
              })
            })
          })
          setTasks(preloaded)
          setEditing(true)
        }
      }
      if (today.evening) {
        setAccomplishments(today.evening.accomplishments)
        setDistractions(today.evening.distractions)
        setRating(today.evening.rating)
        setDifferently(today.evening.differently)
        setGratitude(today.evening.gratitude)
        setTomorrowFocus(today.evening.tomorrowFocus)
        setEveningMood(today.evening.mood)
      }
    } else {
      const preloaded: DailyTask[] = []
      if (wp) {
        wp.goals.forEach(wg => {
          wg.tasks.filter(t => !t.done).forEach(t => {
            preloaded.push({
              id: Date.now() + Math.random(),
              text: t.text,
              done: false,
              fromWeekly: true,
              weeklyGoalId: wg.goalId,
              weeklyTaskId: t.id,
            })
          })
        })
      }
      setEditing(true)
      const carryover: DailyTask[] = JSON.parse(localStorage.getItem("compass_pending_carryover") || "[]")
      const seen = new Set(preloaded.map(t => t.text.toLowerCase()))
      carryover.forEach(t => {
        if (!seen.has(t.text.toLowerCase())) {
          preloaded.push(t)
          seen.add(t.text.toLowerCase())
        }
      })
      setTasks(preloaded)
    }
  }

  function saveRecord(updated: DailyRecord) {
    const records: DailyRecord[] = JSON.parse(localStorage.getItem("compass_daily_records") || "[]")
    const idx = records.findIndex(r => r.date === todayKey())
    if (idx >= 0) records[idx] = updated
    else records.push(updated)
    localStorage.setItem("compass_daily_records", JSON.stringify(records))
    setRecord(updated)
  }

  function saveMorning() {
    const morning: MorningPlan = { oneThing, tasks, interruptions, mood, energy }
    saveRecord({ ...record, morning })
    localStorage.removeItem("compass_pending_carryover")
    setEditing(false)
  }

  function saveEvening() {
    const evening: EveningReflection = {
      accomplishments, distractions, rating, differently,
      gratitude, tomorrowFocus, mood: eveningMood,
    }
    saveRecord({ ...record, evening })

    const incomplete = tasks.filter(t => !t.done).map(t => ({
      id: Date.now() + Math.random(),
      text: t.text,
      done: false,
      fromWeekly: false,
    }))
    localStorage.setItem("compass_pending_carryover", JSON.stringify(incomplete))
    setEditing(false)
  }

  function toggleTask(task: DailyTask) {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))
    if (task.fromWeekly && task.weeklyGoalId && task.weeklyTaskId) {
      const plans: WeekPlan[] = JSON.parse(localStorage.getItem("compass_weekly_plans") || "[]")
      const idx = plans.findIndex(p => p.weekStart === weekKey())
      if (idx < 0) return
      const gi = plans[idx].goals.findIndex(g => g.goalId === task.weeklyGoalId)
      if (gi < 0) return
      const ti = plans[idx].goals[gi].tasks.findIndex(t => t.id === task.weeklyTaskId)
      if (ti < 0) return
      plans[idx].goals[gi].tasks[ti].done = !plans[idx].goals[gi].tasks[ti].done
      localStorage.setItem("compass_weekly_plans", JSON.stringify(plans))
    }
  }

  function removeTask(id: number) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function addFreeTask() {
    if (!newFreeTask.trim()) return
    setTasks(prev => [...prev, {
      id: Date.now(),
      text: newFreeTask.trim(),
      done: false,
      fromWeekly: false,
    }])
    setNewFreeTask("")
  }

  function getGoalForTask(task: DailyTask): Goal | undefined {
    if (!task.weeklyGoalId) return undefined
    return goals.find(g => g.id === task.weeklyGoalId)
  }

  const isEvening = new Date().getHours() >= 17
  const morningSaved = !!record.morning
  const eveningSaved = !!record.evening

  return (
    <Card className="">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[14px] font-medium flex items-center gap-1.5">
            {tab === "morning"
              ? <Sun size={14} className="text-[hsl(var(--timeline-thinking))]" />
              : <Moon size={14} className="text-[hsl(var(--timeline-edit))]" />
            }
            Daily planning
          </CardTitle>
          <div className="flex items-center gap-2">
            {morningSaved && tab === "morning" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] font-medium">
                Saved
              </span>
            )}
            {eveningSaved && tab === "evening" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] font-medium">
                Saved
              </span>
            )}
            <span className="text-[12px] text-[hsl(var(--muted))]">
              {format(new Date(), "EEE MMM d")}
            </span>
          </div>
        </div>

        <div className="flex gap-1 mt-2 bg-[hsl(var(--canvas-soft))] rounded-[8px] p-1">
          {(["morning", "evening"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 h-7 rounded-[6px] text-[12px] font-medium transition-all ${
                tab === t
                  ? "bg-[hsl(var(--surface-card))] text-[hsl(var(--body-strong))] shadow-sm"
                  : "text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))]"
              }`}
            >
              {t === "morning" ? <Sun size={11} /> : <Moon size={11} />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">

        {tab === "morning" && !editing && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-medium text-[hsl(var(--body-strong))]">Today&apos;s One Thing</h3>
                  <p className="text-[14px] text-[hsl(var(--body))">{record.morning?.oneThing || "—"}</p>
                </div>
                <div>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-[12px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))]"
                  >
                    Edit plan
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-[12px] font-medium text-[hsl(var(--muted))]">Today&apos;s tasks</h4>
                <div className="mt-2 space-y-2">
                  {(record.morning?.tasks || []).map(t => (
                    <div key={t.id} className={`p-2 rounded-[8px] ${t.done ? 'bg-[hsl(var(--success))]/5' : 'bg-[hsl(var(--surface-card))]'} border border-[hsl(var(--hairline))]`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[14px] ${t.done ? 'line-through text-[hsl(var(--muted))]' : 'text-[hsl(var(--body-strong))]'}`}>{t.text}</span>
                        <span className="text-[12px] text-[hsl(var(--muted))]">{t.fromWeekly ? 'Planned' : 'Free'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[12px] font-medium text-[hsl(var(--muted))]">Notes</h4>
                <p className="text-[14px] text-[hsl(var(--body))]">{record.morning?.interruptions || '—'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[12px] font-medium text-[hsl(var(--muted))]">Mood</h4>
                  <div className="text-[18px]">{record.morning?.mood ? MOODS[record.morning.mood - 1] : '—'}</div>
                </div>
                <div>
                  <h4 className="text-[12px] font-medium text-[hsl(var(--muted))]">Energy</h4>
                  <div className="text-[14px] text-[hsl(var(--body))]">{record.morning?.energy || '—'}/5</div>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "morning" && editing && (
          <>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                What&apos;s your ONE thing today?
              </label>
              <Input
                value={oneThing}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOneThing(e.target.value)}
                placeholder="The most important thing to accomplish..."
                className="h-9 text-[14px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                Today&apos;s tasks
              </label>

              {tasks.filter(t => t.fromWeekly).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted))] font-semibold">
                    From this week&apos;s plan
                  </p>
                  {tasks.filter(t => t.fromWeekly).map(task => {
                    const goal = getGoalForTask(task)
                    const colorClass = goal ? GOAL_COLORS[goal.color] || GOAL_COLORS.Purple : ""
                    return (
                      <div
                        key={task.id}
                        className={`group flex items-center gap-2 p-2.5 rounded-[8px] border transition-all ${
                          task.done
                            ? "border-[hsl(var(--success))]/20 bg-[hsl(var(--success))]/5"
                            : "border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))] hover:border-[hsl(var(--hairline-strong))]"
                        }`}
                      >
                          <button
                            onClick={() => toggleTask(task)}
                            className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all shrink-0 ${
                              task.done ? "bg-[hsl(var(--success))] border-[hsl(var(--success))]" : "border-[hsl(var(--hairline))] hover:border-[hsl(var(--hairline-strong))]"
                            }`}
                          >
                            {task.done && <Check size={10} className="text-white" />}
                          </button>
                        <span className={`text-[12px] flex-1 ${task.done ? "line-through text-[hsl(var(--muted))]" : "text-[hsl(var(--body-strong))]"}`}>
                          {task.text}
                        </span>
                        {goal && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${colorClass}`}>
                            {goal.tag}
                          </span>
                        )}
                        <button
                          onClick={() => removeTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] shrink-0"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {tasks.filter(t => !t.fromWeekly).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted))] font-semibold">
                    Other tasks
                  </p>
                  {tasks.filter(t => !t.fromWeekly).map(task => (
                    <div
                      key={task.id}
                      className={`group flex items-center gap-2 p-2.5 rounded-[8px] border transition-all ${
                        task.done
                          ? "border-[hsl(var(--success))]/20 bg-[hsl(var(--success))]/5"
                          : "border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))] hover:border-[hsl(var(--hairline-strong))]"
                      }`}
                    >
                      <button
                          onClick={() => toggleTask(task)}
                        className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all shrink-0 ${
                          task.done ? "bg-[hsl(var(--success))] border-[hsl(var(--success))]" : "border-[hsl(var(--hairline))] hover:border-[hsl(var(--hairline-strong))]"
                        }`}
                      >
                        {task.done && <Check size={10} className="text-white" />}
                      </button>
                      <span className={`text-[12px] flex-1 ${task.done ? "line-through text-[hsl(var(--muted))]" : "text-[hsl(var(--body-strong))]"}`}>
                        {task.text}
                      </span>
                      <button
                        onClick={() => removeTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] shrink-0"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={newFreeTask}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFreeTask(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addFreeTask()}
                  placeholder="Add a task..."
                  className="h-8 text-[12px]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addFreeTask}
                  disabled={!newFreeTask.trim()}
                  className="h-8 px-2 shrink-0"
                >
                  <Plus size={13} />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                Expected interruptions
              </label>
              <Input
                value={interruptions}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInterruptions(e.target.value)}
                placeholder="e.g. Meeting at 11am, dentist at 3pm..."
                className="h-9 text-[14px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Mood</label>
                <div className="flex gap-1">
                  {MOODS.map((m, i) => (
                    <button
                      key={i}
                      onClick={() => setMood(i + 1)}
                      className={`w-8 h-8 rounded-[8px] border text-[16px] flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
                        mood === i + 1
                          ? "border-[hsl(var(--timeline-edit))] bg-[hsl(var(--timeline-edit))]/10 scale-110"
                          : "border-[hsl(var(--hairline))] bg-[hsl(var(--canvas-soft))]"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                  Energy — {energy}/5
                </label>
                <div className="flex gap-1 mt-1">
                  {[1,2,3,4,5].map(i => (
                    <button
                      key={i}
                      onClick={() => setEnergy(i)}
                      className={`flex-1 h-2 rounded-full transition-all ${
                        energy >= i ? "bg-[hsl(var(--success))]" : "bg-[hsl(var(--surface-strong))]"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-[hsl(var(--muted))]">
                  <span>low</span><span>high</span>
                </div>
              </div>
            </div>

            <Button
              className="w-full gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
              onClick={saveMorning}
            >
              <Check size={13} />
              {morningSaved ? "Update morning plan" : "Save morning plan"}
            </Button>
          </>
        )}

        {tab === "evening" && (
          <>
            {!isEvening && !eveningSaved && (
              <div className="bg-[hsl(var(--canvas-soft))] rounded-[8px] p-3 text-[12px] text-[hsl(var(--muted))] text-center">
                Evening reflection is best done at the end of your day. Come back after 5 PM!
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">What did you accomplish?</label>
              <Textarea
                value={accomplishments}
                onChange={e => setAccomplishments(e.target.value)}
                placeholder="List what you got done today..."
                className="resize-none h-20 text-[14px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Day rating</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <button
                      key={i}
                      onClick={() => setRating(i)}
                      className={`text-[18px] transition-all hover:scale-110 active:scale-95 ${
                        rating >= i ? "text-[hsl(var(--timeline-done))]" : "text-[hsl(var(--surface-strong))]"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Evening mood</label>
                <div className="flex gap-1">
                  {MOODS.map((m, i) => (
                    <button
                      key={i}
                      onClick={() => setEveningMood(i + 1)}
                      className={`w-8 h-8 rounded-[8px] border text-[16px] flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
                        eveningMood === i + 1
                          ? "border-[hsl(var(--timeline-edit))] bg-[hsl(var(--timeline-edit))]/10 scale-110"
                          : "border-[hsl(var(--hairline))] bg-[hsl(var(--canvas-soft))]"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">What distracted you?</label>
              <Input
                value={distractions}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDistractions(e.target.value)}
                placeholder="e.g. Social media, unexpected calls..."
                className="h-9 text-[14px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">What would you do differently?</label>
              <Input
                value={differently}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDifferently(e.target.value)}
                placeholder="e.g. Start earlier, fewer context switches..."
                className="h-9 text-[14px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">3 things you&apos;re grateful for</label>
              {([0,1,2] as const).map(i => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[12px] text-[hsl(var(--muted))] w-4">{i+1}</span>
                  <Input
                    value={gratitude[i]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const g: [string,string,string] = [...gratitude] as [string,string,string]
                      g[i] = e.target.value
                      setGratitude(g)
                    }}
                    placeholder={["Something that went well...", "Someone who helped...", "Something small..."][i]}
                    className="h-8 text-[12px]"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Tomorrow&apos;s focus</label>
              <Input
                value={tomorrowFocus}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTomorrowFocus(e.target.value)}
                placeholder="What&apos;s the most important thing tomorrow?"
                className="h-9 text-[14px]"
              />
            </div>

            <Button
              className="w-full gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
              onClick={saveEvening}
            >
              <Check size={13} />
              {eveningSaved ? "Update reflection" : "Save reflection"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
