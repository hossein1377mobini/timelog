"use client"

import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { GOAL_COLORS, type DraftGoal } from "./types"

export default function GoalRow({
  goal, onChange, onRemove, showRemove,
}: {
  goal: DraftGoal
  onChange: (patch: Partial<DraftGoal>) => void
  onRemove: () => void
  showRemove: boolean
}) {
  return (
    <div className="group relative rounded-[10px] border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas-soft))] p-3 space-y-2.5 transition-all hover:border-[hsl(var(--hairline-strong))]">
      {showRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-[hsl(var(--muted))] opacity-0 group-hover:opacity-100 hover:text-[hsl(var(--error))] hover:bg-[hsl(var(--error))]/10 transition-all"
          aria-label="Remove goal"
        >
          <X size={11} />
        </button>
      )}
      <Input
        value={goal.name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ name: e.target.value })}
        placeholder="Goal name — e.g. Complete PhD Thesis"
        className="h-8 text-[13px] bg-[hsl(var(--surface-card))] border-[hsl(var(--hairline))]"
      />
      <div className="flex items-center gap-2">
        <Input
          value={goal.tag}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ tag: e.target.value })}
          placeholder="#tag"
          className="h-8 text-[12px] font-mono w-28 shrink-0 bg-[hsl(var(--surface-card))] border-[hsl(var(--hairline))]"
        />
        <Input
          type="number"
          min={1}
          value={goal.targetHours}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ targetHours: Number(e.target.value) })}
          className="h-8 text-[12px] w-20 shrink-0 bg-[hsl(var(--surface-card))] border-[hsl(var(--hairline))]"
        />
        <span className="text-[11px] text-[hsl(var(--muted))] shrink-0">hours</span>
        <div className="flex gap-1.5 ml-auto">
          {GOAL_COLORS.map(c => (
            <button
              key={c.name}
              onClick={() => onChange({ color: c.name })}
              className={`w-4 h-4 rounded-full transition-all active:scale-90 ${
                goal.color === c.name
                  ? "ring-2 ring-offset-1 ring-[hsl(var(--body-strong))] scale-110"
                  : "opacity-50 hover:opacity-100 hover:scale-105"
              }`}
              style={{ background: c.bar }}
              aria-label={c.name}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
