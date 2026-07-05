"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, X, Map, Check } from "lucide-react"
import { generateId } from "@/lib/utils"
import type { Phase } from "@/lib/types"
import { fetchRoadmapPhases, saveRoadmapPhases } from "@/lib/db-client"

interface Props {
  goalId: string
  color: { bar: string }
}

export function RoadmapStepper({ goalId, color }: Props) {
  const [phases, setPhases] = useState<Phase[]>([])
  const [adding, setAdding] = useState(false)
  const [input, setInput] = useState("")

  useEffect(() => {
    fetchRoadmapPhases(goalId).then(setPhases).catch(() => setPhases([]))
  }, [goalId])

  function save(updated: Phase[]) {
    saveRoadmapPhases(goalId, updated).catch(console.error)
    setPhases(updated)
  }

  function toggleDone(id: string) {
    const idx = phases.findIndex(p => p.id === id)
    if (idx < 0) return
    const currentDoneUpTo = phases.reduce((last, p, i) => p.done ? i : last, -1)
    if (idx === currentDoneUpTo) {
      save(phases.map((p, i) => ({ ...p, done: i < idx })))
    } else {
      save(phases.map((p, i) => ({ ...p, done: i <= idx })))
    }
  }

  function addPhase() {
    const name = input.trim()
    if (!name) return
    save([...phases, { id: generateId(), name, done: false }])
    setInput("")
    setAdding(false)
  }

  function removePhase(id: string) {
    save(phases.filter(p => p.id !== id))
  }

  const currentIdx = phases.findIndex(p => !p.done)

  if (phases.length === 0 && !adding) {
    return (
      <div className="pt-2 border-t border-[hsl(var(--hairline))] mt-3">
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] transition-colors">
          <Map size={11} /> Add roadmap phases
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
                  <div className="h-px w-4 shrink-0 transition-colors"
                    style={{ background: phases[i - 1]?.done ? color.bar : "hsl(var(--hairline-strong))" }} />
                )}
                <div className="flex flex-col items-center gap-1 shrink-0 group/phase">
                  <button onClick={() => toggleDone(phase.id)}
                    title={isDone ? "Mark incomplete" : "Mark complete"}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${
                      isDone ? "border-transparent text-white" : isCurrent
                        ? "border-2 bg-transparent" : "border-[hsl(var(--hairline-strong))] bg-transparent"
                    }`}
                    style={isDone ? { background: color.bar } : isCurrent ? { borderColor: color.bar } : {}}>
                    {isDone && <Check size={11} strokeWidth={2.5} />}
                    {isCurrent && <div className="w-2 h-2 rounded-full" style={{ background: color.bar }} />}
                  </button>
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <span className={`text-[10px] font-medium max-w-[60px] text-center leading-tight truncate ${
                      isDone ? "text-[hsl(var(--muted))] line-through" : isCurrent
                        ? "text-[hsl(var(--body-strong))]" : "text-[hsl(var(--muted))]"
                    }`}>{phase.name}</span>
                    {isCurrent && (
                      <span className="text-[9px] font-semibold px-1 py-0.5 rounded-sm text-white leading-none"
                        style={{ background: color.bar }}>Now</span>
                    )}
                  </div>
                  <button onClick={() => removePhase(phase.id)}
                    className="opacity-0 group-hover/phase:opacity-100 w-3.5 h-3.5 flex items-center justify-center rounded-full text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] transition-all"
                    aria-label="Remove phase"><X size={9} /></button>
                </div>
              </React.Fragment>
            )
          })}
        </div>
      )}

      {adding ? (
        <div className="flex gap-2">
          <Input autoFocus value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") addPhase()
              if (e.key === "Escape") { setAdding(false); setInput("") }
            }}
            placeholder="Phase name"
            className="h-7 text-[11px] bg-[hsl(var(--surface-card))] border-[hsl(var(--hairline))]" />
          <button onClick={addPhase} disabled={!input.trim()}
            className="h-7 px-2.5 rounded-[6px] border border-[hsl(var(--hairline))] text-[11px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] disabled:opacity-30 transition-all">Add</button>
          <button onClick={() => { setAdding(false); setInput("") }}
            className="h-7 w-7 flex items-center justify-center rounded-[6px] border border-[hsl(var(--hairline))] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] transition-all">
            <X size={11} /></button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-[11px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] transition-colors">
          <Plus size={11} /> Add phase</button>
      )}
    </div>
  )
}