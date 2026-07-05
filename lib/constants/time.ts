/**
 * Time-related constants: durations, date helpers, and defaults.
 */

export const MILLISECONDS_PER_SECOND = 1000;
export const MILLISECONDS_PER_MINUTE = 60 * MILLISECONDS_PER_SECOND;
export const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;
export const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;

export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
export const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;

export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;

export const DAYS_PER_WEEK = 7;
export const WEEKDAY_MONDAY = 1;
export const WEEKDAY_SUNDAY = 0;
export const MAX_STREAK_DAYS = 3650;

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 1000;

export const DEFAULT_POMODORO_DURATION = 25;
export const DEFAULT_BREAK_DURATION = 5;
export const DEFAULT_LONG_BREAK_DURATION = 15;
export const MIN_PRODUCTIVE_SESSION_DURATION = 300; // 5 minutes

export type PomodoroPreset = {
  label: string;
  work: number;
  break: number;
};

export const POMODORO_PRESETS: PomodoroPreset[] = [
  { label: "25", work: 25, break: 5 },
  { label: "30", work: 30, break: 5 },
  { label: "35", work: 35, break: 10 },
  { label: "45", work: 45, break: 10 },
  { label: "60", work: 60, break: 15 },
  { label: "Custom", work: 0, break: 0 },
];
