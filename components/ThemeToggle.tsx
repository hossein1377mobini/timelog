"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-9 h-9" />

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-9 w-9 rounded-full hover:bg-[hsl(var(--surface-strong))] transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark"
        ? <Sun size={16} className="text-[hsl(var(--muted))]" />
        : <Moon size={16} className="text-[hsl(var(--muted))]" />
      }
    </Button>
  )
}
