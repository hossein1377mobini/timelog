export interface DraftGoal {
  id: string
  name: string
  tag: string
  targetHours: number
  color: string
}

export const GOAL_COLORS = [
  { name: "Purple", bar: "#534AB7" },
  { name: "Teal",   bar: "#0F6E56" },
  { name: "Amber",  bar: "#854F0B" },
  { name: "Gray",   bar: "#5F5E5A" },
  { name: "Blue",   bar: "#185FA5" },
  { name: "Coral",  bar: "#993C1D" },
] as const

export const EMPTY_DRAFT: Omit<DraftGoal, "id"> = {
  name: "",
  tag: "",
  targetHours: 100,
  color: "Purple",
}

export function normaliseTag(raw: string): string {
  const t = raw.trim().replace(/^#+/, "").toLowerCase()
  return t ? `#${t}` : ""
}
