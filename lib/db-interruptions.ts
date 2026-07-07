/**
 * Database persistence layer for interruptions.
 *
 * Provides async functions to read/write interruptions from the
 * PostgreSQL `interruptions` table using the {@link withDb} helper.
 */

import type { Interruption } from "@/lib/types"
import { withDb } from "@/lib/db-utils"

// ── Row mapping helpers ──────────────────────────────────────────────────────

function rowToInterruption(row: Record<string, unknown>): Interruption {
  return {
    id: row.id as string,
    sessionId: row.session_id as string | null,
    type: row.type as Interruption["type"],
    cause: row.cause as string,
    duration: row.duration as number,
    note: row.note as string,
    timestamp: row.timestamp as string,
    recoveryTime: row.recovery_time as number,
    severity: row.severity as Interruption["severity"],
  }
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * Create a new interruption.  Returns the created interruption with its ID.
 */
export async function createInterruption(
  userId: string,
  input: Omit<Interruption, "id">,
): Promise<Interruption> {
  return withDb(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO interruptions (
        session_id, type, cause, duration, note, timestamp, recovery_time, severity, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        input.sessionId || null,
        input.type,
        input.cause,
        input.duration,
        input.note,
        input.timestamp,
        input.recoveryTime,
        input.severity,
        userId,
      ],
    )
    return rowToInterruption(rows[0])
  })
}

/**
 * Get all interruptions, newest first, with pagination.
 */
export async function getAllInterruptions(userId: string, options?: {
  limit?: number
  offset?: number
}): Promise<{ interruptions: Interruption[]; total: number }> {
  return withDb(async (client) => {
    const limit = options?.limit || 50
    const offset = options?.offset || 0

    const { rows: countRows } = await client.query(
      "SELECT COUNT(*) as count FROM interruptions WHERE user_id = $1", [userId],
    )
    const total = parseInt(countRows[0].count as string, 10)

    const { rows } = await client.query(
      "SELECT * FROM interruptions WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3",
      [userId, limit, offset],
    )
    return { interruptions: rows.map(rowToInterruption), total }
  })
}

/**
 * Get interruptions for a specific session, newest first.
 */
export async function getInterruptionsBySession(
  userId: string,
  sessionId: string,
): Promise<Interruption[]> {
  return withDb(async (client) => {
    const { rows } = await client.query(
      "SELECT * FROM interruptions WHERE user_id = $1 AND session_id = $2 ORDER BY timestamp DESC",
      [userId, sessionId],
    )
    return rows.map(rowToInterruption)
  })
}

/**
 * Get interruptions within a date range.
 */
export async function getInterruptionsByDateRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<Interruption[]> {
  return withDb(async (client) => {
    const { rows } = await client.query(
      `SELECT * FROM interruptions
       WHERE user_id = $1 AND timestamp::date >= $2::date AND timestamp::date <= $3::date
       ORDER BY timestamp DESC`,
      [userId, startDate, endDate],
    )
    return rows.map(rowToInterruption)
  })
}

/**
 * Delete an interruption by ID.
 */
export async function deleteInterruption(userId: string, id: string): Promise<void> {
  return withDb(async (client) => {
    await client.query("DELETE FROM interruptions WHERE id = $1 AND user_id = $2", [id, userId])
  })
}

/**
 * Delete all interruptions (data reset).
 */
export async function deleteAllInterruptions(userId: string): Promise<void> {
  return withDb(async (client) => {
    await client.query("DELETE FROM interruptions WHERE user_id = $1", [userId])
  })
}

/**
 * Get total interruption count.
 */
export async function getInterruptionCount(userId: string): Promise<number> {
  return withDb(async (client) => {
    const { rows } = await client.query(
      "SELECT COUNT(*) as count FROM interruptions WHERE user_id = $1", [userId],
    )
    return parseInt(rows[0].count as string, 10)
  })
}

/**
 * Get total interruption time (sum of durations) in seconds.
 */
export async function getTotalInterruptionTime(userId: string): Promise<number> {
  return withDb(async (client) => {
    const { rows } = await client.query(
      "SELECT COALESCE(SUM(duration), 0) as total FROM interruptions WHERE user_id = $1", [userId],
    )
    return parseInt(rows[0].total as string, 10)
  })
}
