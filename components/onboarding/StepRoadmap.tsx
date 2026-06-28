"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Map, ArrowRight } from "lucide-react"
import { getRoadmaps, setRoadmaps, cleanOrphanedRoadmaps, dispatchStorageEvent } from "@/lib/storage"
import type { Goal, Phase, RoadmapMap } from "@/lib/types"
import RoadmapBuilder from "./RoadmapBuilder"

export default function StepRoadmap({
  goals,
  onNext,
  onBack,
}: {
  goals: Goal[]
  onNext: () => void
  onBack: () => void
}) {
  const [roadmapMap, setRoadmapMap] = useState<RoadmapMap>(() => {
    const existing = getRoadmaps()
    const map: RoadmapMap = {}
    for (const g of goals) {
      map[g.id] = existing[g.id] ?? []
    }
    return map
  })

  function updateGoalPhases(goalId: string, phases: Phase[]) {
    setRoadmapMap(m => ({ ...m, [goalId]: phases }))
  }

  function saveAndContinue() {
    try {
      const existing = getRoadmaps()
      const merged = { ...existing, ...roadmapMap }
      setRoadmaps(merged)

      const allGoalIds = [...new Set([...Object.keys(existing), ...goals.map(g => g.id)])]
      cleanOrphanedRoadmaps(allGoalIds)

      dispatchStorageEvent()
    } catch (e) {
      console.error("Failed to save roadmaps:", e)
    }
    onNext()
  }

  const hasAnyPhases = Object.values(roadmapMap).some(p => p.length > 0)

  if (goals.length === 0) {
    return (
      <div className="space-y-5 text-center">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-[12px] bg-[hsl(var(--surface-strong))] flex items-center justify-center">
            <Map size={22} className="text-[hsl(var(--body-strong))]" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h2 className="text-[18px] font-semibold text-[hsl(var(--body-strong))]">Create a roadmap</h2>
          <p className="text-[13px] text-[hsl(var(--muted))] leading-relaxed max-w-xs mx-auto">
            Add goals first, then you can break each one into phases like Research → Writing → Review.
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <Button className="w-full gap-2" onClick={onNext}>
            Continue <ArrowRight size={14} />
          </Button>
          <button onClick={onBack} className="w-full text-[12px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] transition-colors py-1">
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1.5">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-[12px] bg-[hsl(var(--surface-strong))] flex items-center justify-center">
            <Map size={22} className="text-[hsl(var(--body-strong))]" />
          </div>
        </div>
        <h2 className="text-[18px] font-semibold text-[hsl(var(--body-strong))]">Create a roadmap</h2>
        <p className="text-[13px] text-[hsl(var(--muted))] leading-relaxed max-w-xs mx-auto">
          Break each goal into phases — the order you&apos;ll tackle it in. You can always edit these later.
        </p>
      </div>

      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-0.5">
        {goals.map(g => (
          <RoadmapBuilder
            key={g.id}
            goal={g}
            phases={roadmapMap[g.id] || []}
            onChange={phases => updateGoalPhases(g.id, phases)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <Button
          className="w-full gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
          onClick={saveAndContinue}
        >
          {hasAnyPhases ? "Save roadmap & continue" : "Continue"}
          <ArrowRight size={14} />
        </Button>
        <button
          onClick={onNext}
          className="w-full text-[12px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] transition-colors py-1"
        >
          Skip for now
        </button>
        <button
          onClick={onBack}
          className="w-full text-[12px] text-[hsl(var(--muted))]/60 hover:text-[hsl(var(--muted))] transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  )
}
