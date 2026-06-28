"use client"

import { Button } from "@/components/ui/button"
import { CalendarDays, ArrowRight } from "lucide-react"

export default function StepWeek({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="space-y-5">
      <div className="text-center space-y-1.5">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-[12px] bg-[hsl(var(--surface-strong))] flex items-center justify-center">
            <CalendarDays size={22} className="text-[hsl(var(--body-strong))]" />
          </div>
        </div>
        <h2 className="text-[18px] font-semibold text-[hsl(var(--body-strong))]">Plan your week</h2>
        <p className="text-[13px] text-[hsl(var(--muted))] leading-relaxed max-w-xs mx-auto">
          Each week, pick which goals you&apos;ll focus on and break them into specific tasks. This becomes your weekly compass.
        </p>
      </div>
      <div className="bg-[hsl(var(--canvas-soft))] rounded-[10px] p-3.5 space-y-2 text-[12px] text-[hsl(var(--muted))]">
        <p className="font-medium text-[hsl(var(--body-strong))] text-[13px]">Each week you&apos;ll define:</p>
        <div className="space-y-1.5">
          {["Which goals to focus on this week", "Specific tasks under each goal", "Hour targets per goal"].map(item => (
            <div key={item} className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-[hsl(var(--muted))] shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 pt-1">
        <Button className="w-full gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]" onClick={onNext}>
          Got it <ArrowRight size={14} />
        </Button>
        <button onClick={onBack} className="w-full text-[12px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] transition-colors py-1">
          Back
        </button>
      </div>
    </div>
  )
}
