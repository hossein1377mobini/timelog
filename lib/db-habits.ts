/**
 * Database persistence layer for habits and checkins.
 */

import { withDb } from "@/lib/db-utils"

export interface Habit {
  id: string
  userId: string
  name: string
  status: "active" | "quit"
  createdAt: string
}

export interface HabitWithCheckins extends Habit {
  checkins: string[]
}

// ── Row mappers ──────────────────────────────────────────────────────────────

function habitFromRow(row: Record<string, unknown>): Habit {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    status: row.status as "active" | "quit",
    createdAt: row.created_at as string,
  }
}

// ── Habits CRUD ──────────────────────────────────────────────────────────────

export async function getAllHabits(userId: string): Promise<HabitWithCheckins[]> {
  return withDb(async (client) => {
    const { rows } = await client.query(
      "SELECT id, user_id, name, status, created_at FROM habits WHERE user_id = $1 ORDER BY created_at DESC",
      [userId],
    )

    const habits: HabitWithCheckins[] = []
    for (const row of rows) {
      const h = habitFromRow(row)
      const { rows: checkinRows } = await client.query(
        "SELECT to_char(checkin_date, 'YYYY-MM-DD') AS checkin_date FROM habit_checkins WHERE habit_id = $1 ORDER BY checkin_date",
        [h.id],
      )
      habits.push({
        ...h,
        checkins: checkinRows.map((r: Record<string, unknown>) => r.checkin_date as string),
      })
    }
    return habits
  })
}

export async function createHabit(userId: string, name: string): Promise<Habit> {
  return withDb(async (client) => {
    const { rows } = await client.query(
      "INSERT INTO habits (user_id, name) VALUES ($1, $2) RETURNING *",
      [userId, name],
    )
    return habitFromRow(rows[0])
  })
}

export async function updateHabitStatus(
  userId: string,
  habitId: string,
  status: "active" | "quit",
): Promise<void> {
  return withDb(async (client) => {
    const { rowCount } = await client.query(
      "UPDATE habits SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3",
      [status, habitId, userId],
    )
    if (rowCount === 0) throw new Error("Habit not found")
  })
}

export async function deleteHabit(userId: string, habitId: string): Promise<void> {
  return withDb(async (client) => {
    const { rowCount } = await client.query(
      "DELETE FROM habits WHERE id = $1 AND user_id = $2",
      [habitId, userId],
    )
    if (rowCount === 0) throw new Error("Habit not found")
  })
}

// ── Checkins ─────────────────────────────────────────────────────────────────

export async function getHabitCheckins(
  userId: string,
  habitId: string,
): Promise<string[]> {
  return withDb(async (client) => {
    // Verify ownership
    const { rows: habitRows } = await client.query(
      "SELECT id FROM habits WHERE id = $1 AND user_id = $2",
      [habitId, userId],
    )
    if (habitRows.length === 0) throw new Error("Habit not found")

    const { rows } = await client.query(
      "SELECT to_char(checkin_date, 'YYYY-MM-DD') AS checkin_date FROM habit_checkins WHERE habit_id = $1 ORDER BY checkin_date",
      [habitId],
    )
    return rows.map((r: Record<string, unknown>) => r.checkin_date as string)
  })
}

export async function checkinHabit(
  userId: string,
  habitId: string,
  date: string,
): Promise<void> {
  return withDb(async (client) => {
    // Verify ownership
    const { rows: habitRows } = await client.query(
      "SELECT id FROM habits WHERE id = $1 AND user_id = $2",
      [habitId, userId],
    )
    if (habitRows.length === 0) throw new Error("Habit not found")

    await client.query(
      "INSERT INTO habit_checkins (habit_id, checkin_date) VALUES ($1, $2) ON CONFLICT (habit_id, checkin_date) DO NOTHING",
      [habitId, date],
    )
  })
}

export async function uncheckinHabit(
  userId: string,
  habitId: string,
  date: string,
): Promise<void> {
  return withDb(async (client) => {
    // Verify ownership
    const { rows: habitRows } = await client.query(
      "SELECT id FROM habits WHERE id = $1 AND user_id = $2",
      [habitId, userId],
    )
    if (habitRows.length === 0) throw new Error("Habit not found")

    await client.query(
      "DELETE FROM habit_checkins WHERE habit_id = $1 AND checkin_date = $2",
      [habitId, date],
    )
  })
}

export async function resetHabitCheckins(
  userId: string,
  habitId: string,
): Promise<void> {
  return withDb(async (client) => {
    // Verify ownership
    const { rows: habitRows } = await client.query(
      "SELECT id FROM habits WHERE id = $1 AND user_id = $2",
      [habitId, userId],
    )
    if (habitRows.length === 0) throw new Error("Habit not found")

    await client.query(
      "DELETE FROM habit_checkins WHERE habit_id = $1",
      [habitId],
    )
  })
}
