"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ListChecks, Target, CalendarDays, ChevronDown, ChevronRight, Sun, Moon } from "lucide-react"
import WeeklyPlan from "./WeeklyPlan"
import DailyPlanning from "./DailyPlanning"
import YearlyWeeklyCalendar from "./YearlyWeeklyCalendar"
import GoalsManager from "./GoalsManager"

export default function PlanView() {
  const [activeSection, setActiveSection] = useState<"weekly" | "daily" | "yearly" | "goals">("weekly")

  const sections = [
    { id: "weekly", label: "Week", icon: CalendarDays },
    { id: "daily", label: "Day", icon: ListChecks },
    { id: "yearly", label: "Year", icon: CalendarDays },
    { id: "goals", label: "Goals", icon: Target },
  ] as const

  return (
    <div className="space-y-4">
      {/* Section toggle */}
      <div className="flex flex-wrap gap-1.5">
        {sections.map((s) => {
          const active = activeSection === s.id
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all ${
                active
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "bg-[hsl(var(--surface-card))] text-[hsl(var(--muted))] border border-[hsl(var(--hairline))] hover:text-[hsl(var(--body-strong))]"
              }`}
            >
              <s.icon size={14} />
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Content by section */}
      {activeSection === "weekly" && <WeeklyPlan />}
      {activeSection === "daily" && <DailyPlanning />}
      {activeSection === "yearly" && <YearlyWeeklyCalendar />}
      {activeSection === "goals" && <GoalsManager />}
    </div>
  )
}