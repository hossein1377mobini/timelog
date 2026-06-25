"use client"

import { cn } from "@/lib/utils"

const variantStyles = {
  default: "bg-[hsl(var(--surface-strong))] text-[hsl(var(--body-strong))]",
  secondary: "bg-[hsl(var(--canvas-soft))] text-[hsl(var(--body))]",
  outline: "border border-[hsl(var(--hairline))] bg-transparent text-[hsl(var(--body))]",
}

export function Badge({ className, variant = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}
