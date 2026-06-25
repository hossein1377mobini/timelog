"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Target, CalendarDays, Sun, ArrowRight, Check } from "lucide-react"

interface Props {
  onComplete: () => void
}

const STEPS = [
  {
    icon: Target,
    title: "Set your goals",
    desc: "Start by adding the big things you want to achieve — your PhD, a project, a habit. You can always add more later.",
    action: "I've added my goals",
  },
  {
    icon: CalendarDays,
    title: "Plan your week",
    desc: "Each week, pick which goals you'll focus on and break them into specific tasks. This becomes your weekly compass.",
    action: "Got it",
  },
  {
    icon: Sun,
    title: "Plan each day",
    desc: "Every morning, pick tasks from your weekly plan. Add free tasks too — the plan guides you, it doesn't cage you.",
    action: "Let's start",
  },
]

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 bg-[hsl(var(--background))]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[hsl(var(--surface-card))] border border-[hsl(var(--hairline))] rounded-[12px] p-8 max-w-md w-full space-y-6">

        <div className="flex gap-1.5 justify-center">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-[hsl(var(--primary))]" : "w-1.5 bg-[hsl(var(--hairline-strong))]"
              }`}
            />
          ))}
        </div>

        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-[12px] bg-[hsl(var(--surface-strong))] flex items-center justify-center">
            <Icon size={24} className="text-[hsl(var(--body-strong))]" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-[18px] font-semibold text-[hsl(var(--body-strong))]">{current.title}</h2>
          <p className="text-[14px] text-[hsl(var(--muted))] leading-relaxed">{current.desc}</p>
        </div>

        {step === 0 && (
          <div className="bg-[hsl(var(--canvas-soft))] rounded-[8px] p-3 text-[12px] text-[hsl(var(--muted))] space-y-1">
            <p className="font-medium text-[hsl(var(--body-strong))]">Example goals:</p>
            <p>• Complete PhD Thesis — 500h by Jun 2027</p>
            <p>• Launch YouTube channel — 200h by Dec 2026</p>
            <p>• House renovation — 100h by Sep 2026</p>
          </div>
        )}
        {step === 1 && (
          <div className="bg-[hsl(var(--canvas-soft))] rounded-[8px] p-3 text-[12px] text-[hsl(var(--muted))] space-y-1">
            <p className="font-medium text-[hsl(var(--body-strong))]">Each week you&apos;ll define:</p>
            <p>• Which goals to focus on this week</p>
            <p>• Specific tasks under each goal</p>
            <p>• Hour targets per goal</p>
          </div>
        )}
        {step === 2 && (
          <div className="bg-[hsl(var(--canvas-soft))] rounded-[8px] p-3 text-[12px] text-[hsl(var(--muted))] space-y-1">
            <p className="font-medium text-[hsl(var(--body-strong))]">Each morning you&apos;ll:</p>
            <p>• Pick tasks from your weekly plan</p>
            <p>• Add free tasks as needed</p>
            <p>• Set your ONE most important thing</p>
          </div>
        )}

        <Button
          className="w-full gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
          onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
        >
          {current.action}
          {isLast ? <Check size={14} /> : <ArrowRight size={14} />}
        </Button>

        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="w-full text-[12px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] transition-colors"
          >
            Back
          </button>
        )}
      </div>
    </div>
  )
}
