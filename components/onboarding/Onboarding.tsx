"use client"

import { useState, useEffect } from "react"
import { fetchGoals } from "@/lib/db-client"
import type { Goal } from "@/lib/types"
import StepGoals from "./StepGoals"
import StepRoadmap from "./StepRoadmap"
import StepWeek from "./StepWeek"
import StepDay from "./StepDay"

interface Props {
  onComplete: () => void
}

const STEPS = [StepGoals, StepRoadmap, StepWeek, StepDay]
const TOTAL_STEPS = STEPS.length

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [goals, setGoals] = useState<Goal[]>([])

  useEffect(() => {
    fetchGoals().then(setGoals).catch(console.error)
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-[hsl(var(--background))]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[hsl(var(--surface-card))] border border-[hsl(var(--hairline))] rounded-[16px] p-7 max-w-md w-full shadow-lg">

        <div className="flex gap-1.5 justify-center mb-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-6 bg-[hsl(var(--primary))]"
                  : i < step
                  ? "w-1.5 bg-[hsl(var(--primary))]/40"
                  : "w-1.5 bg-[hsl(var(--hairline-strong))]"
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <StepGoals
            onNext={g => {
              setGoals(g)
              setStep(1)
            }}
          />
        )}
        {step === 1 && (
          <StepRoadmap
            goals={goals}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && <StepWeek onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <StepDay onComplete={onComplete} onBack={() => setStep(2)} />}
      </div>
    </div>
  )
}
