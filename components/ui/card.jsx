"use client"

import { cn } from "@/lib/utils"

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))] text-[hsl(var(--body-strong))] shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] duration-150 hover:border-[hsl(var(--hairline-strong))] hover:shadow-[var(--shadow)]",
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-6 pt-0", className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <h2 className={cn("text-[18px] font-semibold leading-[1.4] tracking-[0]", className)} {...props} />
}
