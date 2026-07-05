/**
 * Shared analytics helpers for computing metrics from Session arrays.
 *
 * These are pure functions – they take data in, return computed results,
 * and have no side-effects. They are safe to call on both server and
 * client.
 */

import type { Session } from "@/lib/types";

// ─── Date helpers ────────────────────────────────────────────────────────────

/** Return `YYYY-MM-DD` for a given Date (uses local timezone). */
export function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today's date as `YYYY-MM-DD`. */
export function todayKey(): string {
  return toYMD(new Date());
}

// ─── Session grouping ────────────────────────────────────────────────────────

/**
 * Group sessions by the calendar date they started on.
 * Returns a Map keyed by `YYYY-MM-DD` → array of sessions.
 */
export function groupSessionsByDate(
  sessions: Session[],
): Map<string, Session[]> {
  const map = new Map<string, Session[]>();
  for (const s of sessions) {
    const key =
      s.date && /^\d{4}-\d{2}-\d{2}$/.test(s.date)
        ? s.date
        : toYMD(new Date(s.startedAt));
    const arr = map.get(key);
    if (arr) arr.push(s);
    else map.set(key, [s]);
  }
  return map;
}

/**
 * Sum total duration per calendar date.
 * Returns a Map keyed by `YYYY-MM-DD` → total seconds for that date.
 */
export function dailyDurationMap(sessions: Session[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const key =
      s.date && /^\d{4}-\d{2}-\d{2}$/.test(s.date)
        ? s.date
        : toYMD(new Date(s.startedAt));
    map.set(key, (map.get(key) ?? 0) + s.duration);
  }
  return map;
}

// ─── Streak calculations ─────────────────────────────────────────────────────

/**
 * Compute the current consecutive-day streak.
 *
 * If today has at least one session, the streak starts today.
 * Otherwise it starts from yesterday.
 */
export function currentStreak(sessions: Session[]): number {
  const dailies = dailyDurationMap(sessions);
  const td = todayKey();
  const cursor = new Date();
  if (!dailies.has(td)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  const MAX_DAYS = 3650; // 10 years safety limit
  let daysChecked = 0;
  while (daysChecked < MAX_DAYS) {
    if (!dailies.has(toYMD(cursor))) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
    daysChecked++;
  }
  return streak;
}

/**
 * Compute the all-time best (longest) consecutive-day streak.
 */
export function bestStreak(sessions: Session[]): number {
  const dailies = dailyDurationMap(sessions);
  if (dailies.size === 0) return 0;
  const sorted = Array.from(dailies.keys()).sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]!);
    const curr = new Date(sorted[i]!);
    const diff = (curr.getTime() - prev.getTime()) / 86_400_000;
    if (diff === 1) {
      run++;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }
  return best;
}

// ─── Period helpers ──────────────────────────────────────────────────────────

/** Return sessions whose `startedAt` falls on the same calendar day as `date`. */
export function sessionsOnDate(
  sessions: Session[],
  date: Date,
): Session[] {
  const target = date.toDateString();
  return sessions.filter((s) => new Date(s.startedAt).toDateString() === target);
}

/** Return sessions that started within the current ISO week (Mon–Sun). */
export function sessionsThisWeek(sessions: Session[]): Session[] {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // 0=Mon
  const start = new Date(now);
  start.setDate(now.getDate() - dow);
  start.setHours(0, 0, 0, 0);
  return sessions.filter((s) => new Date(s.startedAt) >= start);
}

/** Sum total seconds of an array of sessions. */
export function totalDuration(sessions: Session[]): number {
  return sessions.reduce((sum, s) => sum + s.duration, 0);
}

// ─── Tag analytics ───────────────────────────────────────────────────────────

/**
 * Compute total seconds per tag across all sessions.
 * Returns entries sorted descending by duration.
 */
export function tagTotals(
  sessions: Session[],
): [string, number][] {
  const map: Record<string, number> = {};
  for (const s of sessions) {
    for (const t of s.tags) {
      map[t] = (map[t] ?? 0) + s.duration;
    }
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

// ─── Time-of-day analytics ───────────────────────────────────────────────────

export type TimeBucket = "Morning" | "Afternoon" | "Evening" | "Night";

/**
 * Distribute session seconds into four time-of-day buckets.
 */
export function timeOfDayDistribution(
  sessions: Session[],
): Record<TimeBucket, number> {
  const buckets: Record<TimeBucket, number> = {
    Morning: 0,
    Afternoon: 0,
    Evening: 0,
    Night: 0,
  };
  for (const s of sessions) {
    const h = new Date(s.startedAt).getHours();
    if (h < 12) buckets.Morning += s.duration;
    else if (h < 17) buckets.Afternoon += s.duration;
    else if (h < 21) buckets.Evening += s.duration;
    else buckets.Night += s.duration;
  }
  return buckets;
}