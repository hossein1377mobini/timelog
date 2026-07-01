import React from "react";
import { CalendarDays } from "lucide-react";

interface EmptyStateProps {
  onOpen: () => void;
}

export const EmptyState = React.memo(function EmptyState({
  onOpen,
}: EmptyStateProps) {
  return (
    <div
      onClick={onOpen}
      className="border border-dashed border-[hsl(var(--hairline-strong))] rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer hover:border-[hsl(var(--body))]/30 hover:bg-[hsl(var(--canvas-soft))] transition-all group"
    >
      <CalendarDays
        size={20}
        className="text-[hsl(var(--muted))] group-hover:text-[hsl(var(--body-strong))] transition-colors"
      />
      <p className="text-[14px] text-[hsl(var(--muted))] group-hover:text-[hsl(var(--body-strong))] transition-colors">
        Plan this week
      </p>
      <p className="text-[12px] text-[hsl(var(--muted))] text-center max-w-48">
        Pick goals and set objectives for the week
      </p>
    </div>
  );
});
