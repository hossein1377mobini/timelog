"use client"

import { cn } from "@/lib/utils"

export function ScrollArea({ className, children, ...props }) {
  return (
    <div className={cn("overflow-hidden rounded-[8px]", className)} {...props}>
      <div className="max-h-full overflow-y-auto">{children}</div>
    </div>
  )
}
