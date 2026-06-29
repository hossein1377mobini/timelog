/**
 * Single source of truth for all shared constants.
 * Every component should import from here instead of defining its own copy.
 */

import type { InterruptionType } from "@/lib/types"

// ── Goal colour palette ──────────────────────────────────────────────────────

export interface GoalColor {
  name: string
  bar: string
  cat: string
  badge: string
}

export const GOAL_COLORS: GoalColor[] = [
  {
    name: "Purple",
    bar: "#534AB7",
    cat: "bg-[#EEEDFE] text-[#3C3489] dark:bg-[#26215C] dark:text-[#CECBF6]",
    badge: "bg-[#EEEDFE] text-[#534AB7] dark:bg-[#26215C] dark:text-[#CECBF6]",
  },
  {
    name: "Teal",
    bar: "#0F6E56",
    cat: "bg-[#E1F5EE] text-[#085041] dark:bg-[#04342C] dark:text-[#9FE1CB]",
    badge: "bg-[#E1F5EE] text-[#0F6E56] dark:bg-[#04342C] dark:text-[#9FE1CB]",
  },
  {
    name: "Amber",
    bar: "#854F0B",
    cat: "bg-[#FAEEDA] text-[#633806] dark:bg-[#412402] dark:text-[#FAC775]",
    badge: "bg-[#FAEEDA] text-[#854F0B] dark:bg-[#412402] dark:text-[#FAC775]",
  },
  {
    name: "Gray",
    bar: "#5F5E5A",
    cat: "bg-[#F1EFE8] text-[#444441] dark:bg-[#2C2C2A] dark:text-[#D3D1C7]",
    badge: "bg-[#F1EFE8] text-[#5F5E5A] dark:bg-[#2C2C2A] dark:text-[#D3D1C7]",
  },
  {
    name: "Blue",
    bar: "#185FA5",
    cat: "bg-[#E6F1FB] text-[#0C447C] dark:bg-[#042C53] dark:text-[#B5D4F4]",
    badge: "bg-[#E6F1FB] text-[#185FA5] dark:bg-[#042C53] dark:text-[#B5D4F4]",
  },
  {
    name: "Coral",
    bar: "#993C1D",
    cat: "bg-[#FAECE7] text-[#712B13] dark:bg-[#4A1B0C] dark:text-[#F5C4B3]",
    badge: "bg-[#FAECE7] text-[#993C1D] dark:bg-[#4A1B0C] dark:text-[#F5C4B3]",
  },
]

/** Map of color name → Tailwind classes for category badges (e.g. DailyPlanning) */
export const GOAL_COLOR_MAP: Record<string, string> = Object.fromEntries(
  GOAL_COLORS.map((c) => [c.name, c.cat])
)

/** Map of color name → full colour object (bar, cat, badge) */
export const GOAL_COLOR_RECORD: Record<string, GoalColor> = Object.fromEntries(
  GOAL_COLORS.map((c) => [c.name, c])
)

/** Map of color name → bar hex string (e.g. for RoadmapTreeView) */
export const GOAL_BAR_MAP: Record<string, string> = Object.fromEntries(
  GOAL_COLORS.map((c) => [c.name, c.bar])
)

/** Default color name */
export const DEFAULT_GOAL_COLOR = GOAL_COLORS[0].name

// ── Pomodoro presets ─────────────────────────────────────────────────────────

export interface PomodoroPreset {
  label: string
  work: number
  break: number
}

export const POMODORO_PRESETS: PomodoroPreset[] = [
  { label: "25 / 5", work: 25, break: 5 },
  { label: "50 / 10", work: 50, break: 10 },
  { label: "90 / 20", work: 90, break: 20 },
]

// ── Interruption type metadata ───────────────────────────────────────────────

export const INTERRUPTION_TYPE_META: {
  value: InterruptionType
  emoji: string
  label: string
  color: string
}[] = [
  {
    value: "distraction",
    emoji: "📱",
    label: "Distraction",
    color: "bg-[hsl(var(--error))]/10 text-[hsl(var(--error))]",
  },
  {
    value: "external",
    emoji: "👤",
    label: "External",
    color: "bg-[hsl(var(--timeline-thinking))]/40 text-[hsl(var(--body-strong))]",
  },
  {
    value: "thought",
    emoji: "🧠",
    label: "Thought",
    color: "bg-[hsl(var(--timeline-edit))]/40 text-[hsl(var(--body-strong))]",
  },
  {
    value: "break",
    emoji: "😴",
    label: "Break",
    color: "bg-[hsl(var(--timeline-read))]/40 text-[hsl(var(--body-strong))]",
  },
  {
    value: "admin",
    emoji: "📋",
    label: "Admin",
    color: "bg-[hsl(var(--muted))]/20 text-[hsl(var(--muted))]",
  },
]

// ── Moods ────────────────────────────────────────────────────────────────────

export const MOODS = ["😔", "😐", "🙂", "😊", "🤩"]

// ── Goal form defaults ───────────────────────────────────────────────────────

export const EMPTY_GOAL_FORM = {
  name: "",
  tag: "",
  targetHours: 100,
  deadline: "",
  weeklyTarget: 10,
  color: DEFAULT_GOAL_COLOR,
}