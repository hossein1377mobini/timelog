/**
 * Storage keys, database defaults, default settings, and feature flags.
 */

// ── LocalStorage keys (client mode) ──────────────────────────────────────────

export const STORAGE_KEYS = {
  SETTINGS: "compass_settings",
  PROJECTS: "compass_projects",
  TAGS: "compass_tags",
  TASKS: "compass_tasks",
  TIME_ENTRIES: "compass_time_entries",
  GOALS: "compass_goals",
  ROADMAPS: "compass_roadmaps",
  SESSIONS: "compass_sessions",
  INTERRUPTIONS: "compass_interruptions",
  REFLECTIONS: "compass_reflections",
  WEEKLY_OBJECTIVES: "compass_weekly_objectives",
} as const;

export const STORAGE_KEY_PREFIX = "compass_";
export const LOCALSTORAGE_SIZE_LIMIT_MB = 5;

// ── Database defaults ───────────────────────────────────────────────────────

export const DB_POOL_SIZE = 20;
export const DB_QUERY_TIMEOUT = 30000; // 30 seconds

// ── App metadata ────────────────────────────────────────────────────────────

export const APP_NAME = "Compass";

// ── Time thresholds for analytics ───────────────────────────────────────────

export const TIME_THRESHOLDS = {
  PRODUCTIVE_MINIMUM_MINUTES: 5,
  DEFAULT_POMODORO_MINUTES: 25,
  DEFAULT_BREAK_MINUTES: 5,
  MAX_SESSION_HOURS: 12,
} as const;

// ── Default user settings ───────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  pomodoroCountBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  workHoursPerDay: 8,
  workDaysPerWeek: 5,
  theme: "system" as const,
  notificationsEnabled: true,
  sidebarCollapsed: false,
};

export type Settings = typeof DEFAULT_SETTINGS;

// ── Default form state for GoalFormDialog ───────────────────────────────────

export const EMPTY_GOAL_FORM = {
  name: "",
  tag: "",
  targetHours: 100,
  weeklyTarget: 10,
  deadline: "",
  color: "Purple",
} as const;

// ── Feature flags ───────────────────────────────────────────────────────────

export const ENABLE_DEBUG_LOGGING = false;
export const ENABLE_TELEMETRY = false;

export const DEBUG_MODE = typeof process !== "undefined"
  ? process.env.NODE_ENV === "development"
  : false;

export const ANALYTICS_ENABLED = typeof process !== "undefined"
  ? process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true"
  : false;
