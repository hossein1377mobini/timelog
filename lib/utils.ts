/**
 * General-purpose utility functions shared across the Compass application.
 *
 * Includes Tailwind class merging, ID generation, date helpers,
 * and duration formatting. All functions here are pure and have no
 * side-effects.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind CSS class names with conflict resolution.
 * Combines clsx for conditional classes and tailwind-merge for deduplication.
 *
 * @param inputs - Class values to merge (strings, objects, arrays)
 * @returns Merged class string with Tailwind conflicts resolved
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-blue-500", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a unique ID using timestamp and random characters.
 * Not cryptographically safe — suitable for local UI state only.
 *
 * @returns A unique string identifier (e.g. "lq3x8a7b2m")
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

/**
 * Returns the ISO date key (YYYY-MM-DD) for a given date.
 * Uses local timezone to avoid UTC conversion issues.
 *
 * @param date - The date to format (defaults to today)
 * @returns Date string in "YYYY-MM-DD" format
 *
 * @example
 * todayKey() // "2026-06-29"
 * todayKey(new Date("2025-01-01")) // "2025-01-01"
 */
export function todayKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Returns the ISO date key for the Monday of the week containing the given date.
 * Uses local timezone to avoid UTC conversion issues.
 *
 * @param date - Any date within the target week (defaults to today)
 * @returns Date string in "YYYY-MM-DD" format for the week's Monday
 *
 * @example
 * weekStartKey() // "2026-06-29" (if today is Monday)
 */
export function weekStartKey(date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const dayStr = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${dayStr}`
}

/**
 * Returns the ISO date key for the Sunday of the week containing the given date.
 * Uses local timezone to avoid UTC conversion issues.
 *
 * @param date - Any date within the target week (defaults to today)
 * @returns Date string in "YYYY-MM-DD" format for the week's Sunday
 */
export function weekEndKey(date = new Date()): string {
  const start = new Date(weekStartKey(date))
  start.setDate(start.getDate() + 6)
  const year = start.getFullYear()
  const month = String(start.getMonth() + 1).padStart(2, "0")
  const day = String(start.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Returns a human-readable label for the week containing the given date.
 *
 * @param date - Any date within the target week (defaults to today)
 * @returns Formatted string like "Jun 29 – Jul 5"
 */
export function weekLabel(date = new Date()): string {
  const start = new Date(weekStartKey(date))
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`
}

/**
 * Formats a duration in seconds into "HH:MM:SS" display string.
 *
 * @param totalSeconds - Duration in seconds
 * @returns Formatted time string (e.g. "01:23:45")
 *
 * @example
 * formatDuration(3723) // "01:02:03"
 */
export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

/**
 * Formats a duration in seconds into a compact "Xh Ym" or "Ym" display string.
 * This is the single source of truth — all components should import from here.
 *
 * @param totalSeconds - Duration in seconds
 * @returns Compact formatted string (e.g. "2h 15m" or "45m")
 *
 * @example
 * formatHM(0)      // "0m"
 * formatHM(2700)   // "45m"
 * formatHM(7200)   // "2h 0m"
 * formatHM(3723)   // "1h 2m"
 */
export function formatHM(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.round((totalSeconds % 3600) / 60)
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

/**
 * Converts seconds to hours, rounded to one decimal place.
 *
 * @param secs - Duration in seconds
 * @returns Hours as a number (e.g. 1.5)
 *
 * @example
 * secondsToHours(5400) // 1.5
 */
export function secondsToHours(secs: number): number {
  return Math.round((secs / 3600) * 10) / 10
}