/**
 * Application-wide constants for the Compass time-tracking app.
 * 
 * This module centralizes magic numbers and commonly used values
 * to improve code readability and maintainability.
 */

// ── Time Constants ──────────────────────────────────────────────────────────

/** Number of milliseconds in one second */
export const MILLISECONDS_PER_SECOND = 1000;

/** Number of milliseconds in one minute (60,000) */
export const MILLISECONDS_PER_MINUTE = 60 * MILLISECONDS_PER_SECOND;

/** Number of milliseconds in one hour (3,600,000) */
export const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;

/** Number of milliseconds in one day (86,400,000) */
export const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;

/** Number of seconds in one minute */
export const SECONDS_PER_MINUTE = 60;

/** Number of seconds in one hour (3,600) */
export const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;

/** Number of seconds in one day (86,400) */
export const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;

/** Number of minutes in one hour */
export const MINUTES_PER_HOUR = 60;

/** Number of hours in one day */
export const HOURS_PER_DAY = 24;

// ── Date & Calendar Constants ───────────────────────────────────────────────

/** Number of days in a week */
export const DAYS_PER_WEEK = 7;

/** ISO weekday number for Monday (1) */
export const WEEKDAY_MONDAY = 1;

/** ISO weekday number for Sunday (0 or 7) */
export const WEEKDAY_SUNDAY = 0;

/** Maximum number of days to check for streak calculation (10 years safety limit) */
export const MAX_STREAK_DAYS = 3650;

// ── Default Pagination Values ───────────────────────────────────────────────

/** Default page size for database queries */
export const DEFAULT_PAGE_SIZE = 50;

/** Maximum page size allowed for database queries */
export const MAX_PAGE_SIZE = 1000;

// ── UI Constants ────────────────────────────────────────────────────────────

/** Default mood rating (1-5 scale) */
export const DEFAULT_MOOD = 3;

/** Default energy level (1-5 scale) */
export const DEFAULT_ENERGY = 3;

/** Default productivity rating (1-5 scale) */
export const DEFAULT_RATING = 3;

/** Minimum rating value */
export const MIN_RATING = 1;

/** Maximum rating value */
export const MAX_RATING = 5;

/** Mood emoji options for daily planning */
export const MOODS = ["😊", "😐", "😔", "😤", "😴"] as const;

/** Goal color mapping with Tailwind CSS classes */
export const GOAL_COLOR_MAP = {
  Purple: "bg-[#534AB7]/10 text-[#534AB7]",
  Teal: "bg-[#0F6E56]/10 text-[#0F6E56]",
  Amber: "bg-[#854F0B]/10 text-[#854F0B]",
  Gray: "bg-[#5F5E5A]/10 text-[#5F5E5A]",
  Blue: "bg-[#185FA5]/10 text-[#185FA5]",
  Coral: "bg-[#993C1D]/10 text-[#993C1D]",
} as const;

/** Goal color record for WeeklyPlan components */
export const GOAL_COLOR_RECORD = {
  Purple: { bar: "#534AB7", cat: "bg-[#534AB7]/10 text-[#534AB7]", badge: "bg-[#534AB7]/20" },
  Teal: { bar: "#0F6E56", cat: "bg-[#0F6E56]/10 text-[#0F6E56]", badge: "bg-[#0F6E56]/20" },
  Amber: { bar: "#854F0B", cat: "bg-[#854F0B]/10 text-[#854F0B]", badge: "bg-[#854F0B]/20" },
  Gray: { bar: "#5F5E5A", cat: "bg-[#5F5E5A]/10 text-[#5F5E5A]", badge: "bg-[#5F5E5A]/20" },
  Blue: { bar: "#185FA5", cat: "bg-[#185FA5]/10 text-[#185FA5]", badge: "bg-[#185FA5]/20" },
  Coral: { bar: "#993C1D", cat: "bg-[#993C1D]/10 text-[#993C1D]", badge: "bg-[#993C1D]/20" },
} as const;

// ── Storage Constants ───────────────────────────────────────────────────────

/** localStorage key prefix for all Compass data */
export const STORAGE_KEY_PREFIX = "compass_";

/** Maximum localStorage size limit (typical browser limit: 5-10MB) */
export const LOCALSTORAGE_SIZE_LIMIT_MB = 5;

// ── Analytics Constants ─────────────────────────────────────────────────────

/** Minimum session duration to count as productive (in seconds) */
export const MIN_PRODUCTIVE_SESSION_DURATION = 300; // 5 minutes

/** Default pomodoro duration (in minutes) */
export const DEFAULT_POMODORO_DURATION = 25;

/** Default break duration (in minutes) */
export const DEFAULT_BREAK_DURATION = 5;

/** Default long break duration (in minutes) */
export const DEFAULT_LONG_BREAK_DURATION = 15;

// ── Database Constants ──────────────────────────────────────────────────────

/** Default database connection pool size */
export const DB_POOL_SIZE = 20;

/** Database query timeout (in milliseconds) */
export const DB_QUERY_TIMEOUT = 30000; // 30 seconds

// ── Priority Labels ─────────────────────────────────────────────────────────

export const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
} as const;

// ── Status Labels ───────────────────────────────────────────────────────────

export const STATUS_LABELS = {
  pending: "Pending",
  active: "Active",
  completed: "Completed",
  archived: "Archived",
  paused: "Paused",
} as const;

// ── Interruption Types ──────────────────────────────────────────────────────

export const INTERRUPTION_TYPES = {
  internal: "Internal",
  external: "External",
  technical: "Technical",
  break: "Break",
} as const;

// ── Color Palette ───────────────────────────────────────────────────────────

export const DEFAULT_GOAL_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
] as const;

// ── Feature Flags ───────────────────────────────────────────────────────────

/** Enable debug logging in development */
export const DEBUG_MODE = process.env.NODE_ENV === "development";

/** Enable analytics tracking */
export const ANALYTICS_ENABLED = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";
