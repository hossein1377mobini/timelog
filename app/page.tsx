"use client"

import { useState, useEffect } from "react"
import TimerCard from "@/components/TimerCard"
import SessionHistory from "@/components/SessionHistory"
import WeeklyReport from "@/components/WeeklyReport"
import MetricsBar from "@/components/MetricsBar"
import FocusMode from "@/components/FocusMode"
import ThemeToggle from "@/components/ThemeToggle"
import GoalsManager from "@/components/GoalsManager"
import WeeklyPlan from "@/components/WeeklyPlan"
import DailyPlanning from "@/components/DailyPlanning"
import Onboarding from "@/components/Onboarding"
import CalendarHeatmap from "@/components/CalendarHeatmap"
import { Timer, Zap, BarChart2, History, Target, CalendarDays, Sun } from "lucide-react"

const TABS = [
  { id: "timer",   label: "Timer",   icon: Timer },
  { id: "plan",    label: "Plan",    icon: Sun },
  { id: "focus",   label: "Focus",   icon: Zap },
  { id: "goals",   label: "Goals",   icon: Target },
  { id: "history", label: "History", icon: History },
] as const

type TabId = typeof TABS[number]["id"]

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("timer")
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const done = localStorage.getItem("compass_onboarding_done")
    if (!done) setShowOnboarding(true)
  }, [])

  function completeOnboarding() {
    localStorage.setItem("compass_onboarding_done", "true")
    setShowOnboarding(false)
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--canvas))] text-[hsl(var(--body))]">
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="max-w-[1200px] mx-auto px-8 py-20 space-y-20">
          <header className="rounded-[12px] border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))] p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CompassIcon />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
                    Compass
                  </p>
                  <h1 className="text-[36px] font-normal leading-[1.2] tracking-[-0.72px] text-[hsl(var(--body-strong))]">
                    Your day, distilled into calm focus.
                  </h1>
                </div>
              </div>
              <ThemeToggle />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
              <button className="rounded-[8px] border border-[hsl(var(--hairline-strong))] bg-[hsl(var(--surface-card))] px-4 py-2 text-[14px] font-medium text-[hsl(var(--body-strong))] transition hover:bg-[hsl(var(--surface-strong))]">
                Today
              </button>
              <button className="rounded-[8px] border border-[hsl(var(--hairline))] bg-transparent px-4 py-2 text-[14px] font-medium text-[hsl(var(--muted))] transition hover:bg-[hsl(var(--surface-strong))] hover:text-[hsl(var(--body-strong))]">
                Week
              </button>
              <button className="rounded-[8px] border border-[hsl(var(--hairline))] bg-transparent px-4 py-2 text-[14px] font-medium text-[hsl(var(--muted))] transition hover:bg-[hsl(var(--surface-strong))] hover:text-[hsl(var(--body-strong))]">
                Month
              </button>
            </div>
          </header>

          <section className="space-y-8">
            <MetricsBar />
            <div className="grid grid-cols-[1.4fr_1fr_1.2fr] gap-6">
              <div className="space-y-6">
                <TimerCard />
                <FocusMode />
              </div>
              <div className="space-y-6">
                <DailyPlanning />
                <WeeklyPlan />
              </div>
              <div className="space-y-6">
                <WeeklyReport />
                <SessionHistory />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <CalendarHeatmap />
            <GoalsManager />
          </section>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col min-h-screen bg-[hsl(var(--canvas))]">
        <div className="flex items-center justify-between px-4 py-4 border-b border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))]/90 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <CompassIcon />
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
              Compass
            </span>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 pb-24 space-y-4">
          {activeTab === "timer"   && <><MetricsBar /><TimerCard /></>}
          {activeTab === "plan"    && <><DailyPlanning /><WeeklyPlan /></>}
          {activeTab === "focus"   && <FocusMode />}
          {activeTab === "goals"   && <GoalsManager />}
          {activeTab === "history" && (
            <>
              <CalendarHeatmap />
              <WeeklyReport />
              <SessionHistory />
            </>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-20 bg-[hsl(var(--background))] border-t border-[hsl(var(--hairline))]">
          <div className="flex items-center justify-around px-2 py-1 safe-area-bottom">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-[8px] transition-all active:scale-95 ${
                    active ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))]"
                  }`}
                >
                  <div className={`p-1.5 rounded-[8px] transition-colors ${active ? "bg-[hsl(var(--primary))]/10" : ""}`}>
                    <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                  </div>
                  <span className={`text-[10px] font-medium ${active ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted))]"}`}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function CompassIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className="text-[hsl(var(--muted))]">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}
