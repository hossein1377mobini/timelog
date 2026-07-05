/**
 * UI constants: tabs, views, moods, labels, chart appearances, and goal colours.
 */

// ── Tab definitions ─────────────────────────────────────────────────────────

export const TAB_OPTIONS = [
  { value: "timer",       label: "Timer",     icon: "Clock" },
  { value: "daily-plan",  label: "Daily Plan", icon: "ListTodo" },
  { value: "focus",       label: "Focus Mode", icon: "Zap" },
  { value: "goals",       label: "Goals",     icon: "Target" },
  { value: "history",     label: "History",   icon: "History" },
] as const;

export type TabValue = (typeof TAB_OPTIONS)[number]["value"];

export const VIEW_OPTIONS = [
  { value: "daily",  label: "Day" },
  { value: "weekly", label: "Week" },
  { value: "monthly",label: "Month" },
  { value: "all",    label: "All" },
] as const;

export type ViewValue = (typeof VIEW_OPTIONS)[number]["value"];

// ── Mood & rating system ────────────────────────────────────────────────────

export const DEFAULT_MOOD = 3;
export const DEFAULT_ENERGY = 3;
export const DEFAULT_RATING = 3;
export const MIN_RATING = 1;
export const MAX_RATING = 5;
export const MOODS = ["😊", "😐", "😔", "😤", "😴"] as const;

// ── Priority / Status / Interruption labels ─────────────────────────────────

export const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
} as const;

export const STATUS_LABELS = {
  pending: "Pending",
  active: "Active",
  completed: "Completed",
  archived: "Archived",
  paused: "Paused",
} as const;

export const INTERRUPTION_TYPES = {
  internal: "Internal",
  external: "External",
  technical: "Technical",
  break: "Break",
} as const;

// ── Chart colours for AnalyticsDashboard ─────────────────────────────────────

export const CHART_COLORS = [
  "#534AB7",
  "#0F6E56",
  "#854F0B",
  "#5F5E5A",
  "#185FA5",
  "#993C1D",
];

export const DEFAULT_GOAL_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
] as const;

// ── Goal colour system ───────────────────────────────────────────────────────

export const GOAL_COLORS = [
  { name: "Purple",   value: "#534AB7", bar: "#534AB7", cat: "bg-[hsl(var(--purple))]/15 text-[hsl(var(--purple))]", badge: "bg-[hsl(var(--purple))]/20 text-[hsl(var(--purple))] border-purple-500/30" },
  { name: "Teal",     value: "#0F6E56", bar: "#0F6E56", cat: "bg-[hsl(var(--teal))]/15 text-[hsl(var(--teal))]", badge: "bg-[hsl(var(--teal))]/20 text-[hsl(var(--teal))] border-teal-500/30" },
  { name: "Amber",    value: "#854F0B", bar: "#854F0B", cat: "bg-[hsl(var(--amber))]/15 text-[hsl(var(--amber))]", badge: "bg-[hsl(var(--amber))]/20 text-[hsl(var(--amber))] border-amber-500/30" },
  { name: "Gray",     value: "#5F5E5A", bar: "#5F5E5A", cat: "bg-[hsl(var(--gray))]/15 text-[hsl(var(--gray))]", badge: "bg-[hsl(var(--gray))]/20 text-[hsl(var(--gray))] border-gray-500/30" },
  { name: "Blue",     value: "#185FA5", bar: "#185FA5", cat: "bg-[hsl(var(--blue))]/15 text-[hsl(var(--blue))]", badge: "bg-[hsl(var(--blue))]/20 text-[hsl(var(--blue))] border-blue-500/30" },
  { name: "Coral",    value: "#993C1D", bar: "#993C1D", cat: "bg-[hsl(var(--coral))]/15 text-[hsl(var(--coral))]", badge: "bg-[hsl(var(--coral))]/20 text-[hsl(var(--coral))] border-coral-500/30" },
] as const;

/** Goal colour → Tailwind class string (legacy shape). */
export const GOAL_COLOR_MAP: Record<string, string> = {
  Purple: "bg-[#534AB7]/10 text-[#534AB7]",
  Teal: "bg-[#0F6E56]/10 text-[#0F6E56]",
  Amber: "bg-[#854F0B]/10 text-[#854F0B]",
  Gray: "bg-[#5F5E5A]/10 text-[#5F5E5A]",
  Blue: "bg-[#185FA5]/10 text-[#185FA5]",
  Coral: "bg-[#993C1D]/10 text-[#993C1D]",
} as const;

/** Goal colour → { bar, cat, badge } shape (used by WeeklyPlan components). */
export const GOAL_COLOR_RECORD: Record<string, { bar: string; cat: string; badge: string }> = {
  Purple: { bar: "#534AB7", cat: "bg-[#534AB7]/10 text-[#534AB7]", badge: "bg-[#534AB7]/20" },
  Teal:   { bar: "#0F6E56", cat: "bg-[#0F6E56]/10 text-[#0F6E56]", badge: "bg-[#0F6E56]/20" },
  Amber:  { bar: "#854F0B", cat: "bg-[#854F0B]/10 text-[#854F0B]", badge: "bg-[#854F0B]/20" },
  Gray:   { bar: "#5F5E5A", cat: "bg-[#5F5E5A]/10 text-[#5F5E5A]", badge: "bg-[#5F5E5A]/20" },
  Blue:   { bar: "#185FA5", cat: "bg-[#185FA5]/10 text-[#185FA5]", badge: "bg-[#185FA5]/20" },
  Coral:  { bar: "#993C1D", cat: "bg-[#993C1D]/10 text-[#993C1D]", badge: "bg-[#993C1D]/20" },
} as const;

/** Safe accessor for GOAL_COLOR_RECORD, always returns a defined entry. */
export function getGoalColor(key: string): { readonly bar: string; readonly cat: string; readonly badge: string } {
  return GOAL_COLOR_RECORD[key] ?? GOAL_COLOR_RECORD.Purple!;
}

/** Map of colour name → hex string for RoadmapTreeView. */
export const GOAL_BAR_MAP: Record<string, string> = {
  Purple: "#534AB7", Teal: "#0F6E56", Amber: "#854F0B",
  Gray: "#5F5E5A", Blue: "#185FA5", Coral: "#993C1D",
};

/** Safe hex-string accessor for GOAL_BAR_MAP. */
export function getGoalBarColor(key: string): string {
  return GOAL_BAR_MAP[key] ?? "#534AB7";
}
