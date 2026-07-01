import type { Session, TaskStatus } from "@/lib/types";
import { weekStartKey } from "@/lib/utils";

/**
 * Helper functions for WeeklyPlan component
 */

/**
 * Build a map of logged hours by tag for the current week
 */
export function buildLoggedByTag(sessions: Session[]): Record<string, number> {
  const map: Record<string, number> = {};
  const ws = weekStartKey();
  for (const s of sessions) {
    if (s.date < ws) continue;
    for (const raw of s.tags) {
      const tag = raw.toLowerCase();
      map[tag] = (map[tag] ?? 0) + s.duration;
    }
  }
  for (const tag of Object.keys(map)) {
    map[tag] = Math.round(((map[tag] ?? 0) / 3600) * 10) / 10;
  }
  return map;
}

/**
 * Get human-readable label for task status
 */
export function statusLabel(status: TaskStatus): string {
  if (status === "completed") return "Completed";
  if (status === "in-progress") return "In Progress";
  return "Pending";
}

/**
 * Get Tailwind classes for task status badge
 */
export function statusColors(status: TaskStatus): string {
  if (status === "completed")
    return "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]";
  if (status === "in-progress")
    return "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]";
  return "bg-[hsl(var(--surface-strong))] text-[hsl(var(--muted))]";
}
