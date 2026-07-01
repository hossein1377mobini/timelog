import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[8px] border border-transparent bg-clip-padding text-[14px] font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 leading-[1.0]",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--accent))]",
        outline:
          "border-[hsl(var(--hairline-strong))] bg-[hsl(var(--surface-card))] text-[hsl(var(--body-strong))] hover:bg-[hsl(var(--surface-strong))] aria-expanded:bg-[hsl(var(--surface-strong))] aria-expanded:text-[hsl(var(--body-strong))]",
        secondary:
          "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))]/95 aria-expanded:bg-[hsl(var(--secondary))] aria-expanded:text-[hsl(var(--secondary-foreground))]",
        ghost:
          "bg-transparent hover:bg-[hsl(var(--surface-strong))] text-[hsl(var(--body-strong))] aria-expanded:bg-[hsl(var(--surface-strong))] aria-expanded:text-[hsl(var(--body-strong))]",
        destructive:
          "bg-[hsl(var(--destructive))]/12 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/20 focus-visible:border-[hsl(var(--destructive))]/40 focus-visible:ring-[hsl(var(--destructive))]/20",
        link: "text-[hsl(var(--primary))] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-[18px] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-7 gap-1 rounded-[4px] px-3 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-[6px] px-4 text-[13px] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-9",
        "icon-xs": "size-7 rounded-[4px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-[6px]",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
