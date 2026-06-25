"use client"

import { cn } from "@/lib/utils"

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-[10px] border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))] px-3 py-2 text-sm text-[hsl(var(--body-strong))] shadow-sm transition duration-150 ease-in-out placeholder:text-[hsl(var(--muted))] hover:border-[hsl(var(--hairline-strong))] focus:outline-none focus:border-[hsl(var(--ring))] focus:ring-2 focus:ring-[hsl(var(--ring))]/20 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}
