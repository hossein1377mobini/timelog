/**
 * Barrel re-export for split constants modules.
 * All existing importers of `@/lib/constants` continue to work unchanged.
 */

export {
  MILLISECONDS_PER_SECOND, MILLISECONDS_PER_MINUTE, MILLISECONDS_PER_HOUR, MILLISECONDS_PER_DAY,
  SECONDS_PER_MINUTE, SECONDS_PER_HOUR, SECONDS_PER_DAY,
  MINUTES_PER_HOUR, HOURS_PER_DAY,
  DAYS_PER_WEEK, WEEKDAY_MONDAY, WEEKDAY_SUNDAY, MAX_STREAK_DAYS,
  DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE,
  DEFAULT_POMODORO_DURATION, DEFAULT_BREAK_DURATION, DEFAULT_LONG_BREAK_DURATION,
  MIN_PRODUCTIVE_SESSION_DURATION,
  POMODORO_PRESETS,
} from "./constants/time"
export type { PomodoroPreset } from "./constants/time"
import type { InterruptionType } from "./types";

export type InterruptionTypeMeta = {
  value: InterruptionType;
  label: string;
  emoji: string;
  color: string;
};

export const INTERRUPTION_TYPE_META: InterruptionTypeMeta[] = [
  { value: "distraction", label: "Distraction", emoji: "📱", color: "bg-[hsl(var(--error))]/10 text-[hsl(var(--error))]" },
  { value: "external",    label: "External",    emoji: "🚪", color: "bg-[hsl(var(--timeline-thinking))]/40 text-[hsl(var(--body-strong))]" },
  { value: "break",       label: "Break",       emoji: "☕", color: "bg-[hsl(var(--timeline-read))]/40 text-[hsl(var(--body-strong))]" },
  { value: "thought",     label: "Thought",     emoji: "💭", color: "bg-[hsl(var(--timeline-edit))]/40 text-[hsl(var(--body-strong))]" },
  { value: "admin",       label: "Admin",       emoji: "📋", color: "bg-[hsl(var(--muted))]/40 text-[hsl(var(--body-strong))]" },
];

export {
  TAB_OPTIONS, VIEW_OPTIONS,
  DEFAULT_MOOD, DEFAULT_ENERGY, DEFAULT_RATING, MIN_RATING, MAX_RATING, MOODS,
  PRIORITY_LABELS, STATUS_LABELS, INTERRUPTION_TYPES,
  CHART_COLORS, DEFAULT_GOAL_COLORS,
  GOAL_COLORS, GOAL_COLOR_MAP, GOAL_COLOR_RECORD, GOAL_BAR_MAP,
  getGoalColor, getGoalBarColor,
} from "./constants/ui"
export type { TabValue, ViewValue } from "./constants/ui"

export {
  APP_NAME,
  STORAGE_KEYS, STORAGE_KEY_PREFIX, LOCALSTORAGE_SIZE_LIMIT_MB,
  DB_POOL_SIZE, DB_QUERY_TIMEOUT,
  TIME_THRESHOLDS,
  DEFAULT_SETTINGS,
  EMPTY_GOAL_FORM,
  ENABLE_DEBUG_LOGGING, ENABLE_TELEMETRY, DEBUG_MODE, ANALYTICS_ENABLED,
} from "./constants/storage"
export type { Settings } from "./constants/storage"
