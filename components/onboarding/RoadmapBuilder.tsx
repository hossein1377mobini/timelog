"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { X, Plus, ChevronUp, ChevronDown } from "lucide-react"
import { GOAL_COLORS } from "./types"
import type { Goal, Phase } from "@/lib/types"

export default function RoadmapBuilder({
  goal,
  phases,
  onChange,
}: {
  goal: Goal
  phases: Phase[]
  onChange: (phases: Phase[]) => void
}) {
  const [input, setInput] = useState("")
  const [error, setError] = useState("")
  const color = GOAL_COLORS.find(c => c.name === goal.color) || GOAL_COLORS[0]

  function addPhase() {
    const name = input.trim()
    if (!name) return
    if (phases.some(p => p.name.trim().toLowerCase() === name.toLowerCase())) {
      setError("This phase already exists")
      return
    }
    onChange([...phases, { id: crypto.randomUUID(), name, done: false }])
    setInput("")
    setError("")
  }

  function removePhase(id: string) {
    onChange(phases.filter(p => p.id !== id))
  }

  function movePhase(id: string, dir: -1 | 1) {
    const idx = phases.findIndex(p => p.id === id)
    if (idx < 0) return
    const next = [...phases]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    onChange(next)
  }

  return (
    <div className="rounded-[10px] border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas-soft))] p-3 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color.bar }} />
        <span className="text-[13px] font-medium text-[hsl(var(--body-strong))] truncate">{goal.name}</span>
        <span className="text-[11px] font-mono text-[hsl(var(--muted))] shrink-0">{goal.tag}</span>
      </div>

      {phases.length > 0 && (
        <div className="space-y-1">
          {phases.map((p, i) => (
            <div
              key={p.id}
              className="group flex items-center gap-2 bg-[hsl(var(--surface-card))] rounded-[7px] px-2.5 py-1.5 border border-[hsl(var(--hairline))]"
            >
              <span
                className="text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-white"
                style={{ background: color.bar }}
              >
                {i + 1}
              </span>
              <span className="text-[12px] text-[hsl(var(--body-strong))] flex-1 truncate">{p.name}</span>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => movePhase(p.id, -1)}
                  disabled={i === 0}
                  className="w-5 h-5 flex items-center justify-center rounded text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] disabled:opacity-20 transition-colors"
                  aria-label="Move up"
                >
                  <ChevronUp size={11} />
                </button>
                <button
                  onClick={() => movePhase(p.id, 1)}
                  disabled={i === phases.length - 1}
                  className="w-5 h-5 flex items-center justify-center rounded text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] disabled:opacity-20 transition-colors"
                  aria-label="Move down"
                >
                  <ChevronDown size={11} />
                </button>
                <button
                  onClick={() => removePhase(p.id)}
                  className="w-5 h-5 flex items-center justify-center rounded text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] transition-colors"
                  aria-label="Remove phase"
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setInput(e.target.value); setError("") }}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addPhase()}
          placeholder="Phase name — e.g. Research"
          className="h-8 text-[12px] bg-[hsl(var(--surface-card))] border-[hsl(var(--hairline))] flex-1"
        />
        <button
          onClick={addPhase}
          disabled={!input.trim()}
          className="h-8 px-3 rounded-[7px] border border-[hsl(var(--hairline))] text-[12px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] hover:border-[hsl(var(--hairline-strong))] hover:bg-[hsl(var(--surface-strong))] disabled:opacity-30 transition-all flex items-center gap-1 shrink-0"
        >
          <Plus size={12} />
          Add
        </button>
      </div>
      {error && <p className="text-[11px] text-[hsl(var(--error))]">{error}</p>}
    </div>
  )
}
