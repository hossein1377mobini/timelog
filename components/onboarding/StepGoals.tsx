"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Target, ArrowRight, Plus } from "lucide-react"
import { fetchGoals, createGoal } from "@/lib/db-client"
import type { Goal } from "@/lib/types"
import GoalRow from "./GoalRow"
import { EMPTY_DRAFT, normaliseTag, type DraftGoal } from "./types"

export default function StepGoals({ onNext }: { onNext: (goals: Goal[]) => void }) {
  const [drafts, setDrafts] = useState<DraftGoal[]>([{ id: crypto.randomUUID(), ...EMPTY_DRAFT }])
  const [existingGoals, setExistingGoals] = useState<Goal[]>([])
  const [duplicateError, setDuplicateError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchGoals().then(setExistingGoals).catch(console.error)
  }, [])

  function addRow() {
    setDrafts(d => [...d, { id: crypto.randomUUID(), ...EMPTY_DRAFT }])
  }

  function updateRow(id: string, patch: Partial<DraftGoal>) {
    setDrafts(d => d.map(g => g.id === id ? { ...g, ...patch } : g))
    setDuplicateError("")
  }

  function removeRow(id: string) {
    setDrafts(d => d.filter(g => g.id !== id))
  }

  async function saveAndContinue() {
    setSaving(true)
    try {
      const allGoals = await fetchGoals()
      const valid: Goal[] = []

      for (const g of drafts) {
        if (!g.name.trim() || !g.tag.trim()) continue
        const tag = normaliseTag(g.tag)
        const name = g.name.trim()

        const isDuplicate = allGoals.some(
          existing => existing.name.trim().toLowerCase() === name.toLowerCase()
        )
        if (isDuplicate) {
          setDuplicateError(`"${name}" already exists`)
          return
        }

        const savedGoal = await createGoal({
          name,
          description: "",
          category: "",
          tag,
          targetHours: Number(g.targetHours) || 100,
          targetDate: "",
          weeklyTarget: 0,
          priority: "medium",
          status: "active",
          color: g.color,
        })
        valid.push(savedGoal)
      }

      onNext(valid)
    } catch (e) {
      console.error("Failed to save goals:", e)
    } finally {
      setSaving(false)
    }
  }

  async function handleSkip() {
    try {
      const existing = await fetchGoals()
      onNext(existing)
    } catch {
      onNext([])
    }
  }

  const hasAnyValid = drafts.some(g => g.name.trim() && g.tag.trim())

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1.5">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-[12px] bg-[hsl(var(--surface-strong))] flex items-center justify-center">
            <Target size={22} className="text-[hsl(var(--body-strong))]" />
          </div>
        </div>
        <h2 className="text-[18px] font-semibold text-[hsl(var(--body-strong))]">What are your big goals?</h2>
        <p className="text-[13px] text-[hsl(var(--muted))] leading-relaxed max-w-xs mx-auto">
          Add the things you want to achieve this year. Each one gets its own tag so Compass can track time automatically.
        </p>
      </div>

      <div className="space-y-2">
        {drafts.map(g => (
          <GoalRow
            key={g.id}
            goal={g}
            onChange={patch => updateRow(g.id, patch)}
            onRemove={() => removeRow(g.id)}
            showRemove={drafts.length > 1}
          />
        ))}
        <button
          onClick={addRow}
          className="w-full border border-dashed border-[hsl(var(--hairline-strong))] rounded-[10px] py-2.5 flex items-center justify-center gap-1.5 text-[12px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] hover:border-[hsl(var(--body))]/30 hover:bg-[hsl(var(--canvas-soft))] transition-all active:scale-[0.99]"
        >
          <Plus size={12} />
          Add another goal
        </button>
      </div>

      {duplicateError && (
        <p className="text-[11px] text-[hsl(var(--error))] text-center">{duplicateError}</p>
      )}

      <p className="text-[11px] text-[hsl(var(--muted))] text-center">
        Use a short tag like <span className="font-mono">#phd</span> or <span className="font-mono">#youtube</span> — sessions with that tag count toward this goal.
      </p>

      <div className="flex flex-col gap-2 pt-1">
        <Button
          className="w-full gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
          onClick={saveAndContinue}
          disabled={!hasAnyValid || saving}
        >
          {saving ? "Saving..." : "Save goals & continue"}
          <ArrowRight size={14} />
        </Button>
        <button
          onClick={handleSkip}
          className="w-full text-[12px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] transition-colors py-1"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
