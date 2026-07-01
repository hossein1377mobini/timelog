/**
 * Database persistence layer for focus sessions.
 * 
 * This module provides async functions to read/write sessions
 * from the PostgreSQL `sessions` table.
 */

import pool from "@/lib/db"
import type { Session } from "@/lib/types"
import { notifyDatabaseChange } from "@/lib/db-events"

/**
 * Create a new session in the database.
 * Returns the created session with its generated ID.
 */
export async function createSession(input: Omit<Session, "id">): Promise<Session> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `INSERT INTO sessions (
        task_id, task_name, tags, duration, duration_formatted,
        started_at, ended_at, date, pomodoro_count, productivity_rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        input.taskId || null,
        input.taskName,
        input.tags || [],
        input.duration,
        input.durationFormatted,
        input.startedAt,
        input.endedAt,
        input.date,
        input.pomodoroCount || 0,
        input.productivityRating || null,
      ]
    )
    
    const row = result.rows[0]
    return {
      id: row.id,
      taskId: row.task_id,
      taskName: row.task_name,
      tags: row.tags,
      duration: row.duration,
      durationFormatted: row.duration_formatted,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      date: row.date,
      pomodoroCount: row.pomodoro_count,
      productivityRating: row.productivity_rating,
    }
  } finally {
    client.release()
  }
}

/**
 * Get a session by ID.
 * Returns null if not found.
 */
export async function getSessionById(id: string): Promise<Session | null> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      "SELECT * FROM sessions WHERE id = $1",
      [id]
    )
    
    if (result.rows.length === 0) return null
    
    const row = result.rows[0]
    return {
      id: row.id,
      taskId: row.task_id,
      taskName: row.task_name,
      tags: row.tags,
      duration: row.duration,
      durationFormatted: row.duration_formatted,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      date: row.date,
      pomodoroCount: row.pomodoro_count,
      productivityRating: row.productivity_rating,
    }
  } finally {
    client.release()
  }
}

/**
 * Get all sessions, ordered by started_at descending (newest first).
 * Supports pagination with limit and offset.
 */
export async function getAllSessions(options?: {
  limit?: number;
  offset?: number;
}): Promise<{ sessions: Session[]; total: number }> {
  const client = await pool.connect()
  try {
    const limit = options?.limit || 50
    const offset = options?.offset || 0
    
    // Get total count
    const countResult = await client.query("SELECT COUNT(*) as count FROM sessions")
    const total = parseInt(countResult.rows[0].count, 10)
    
    // Get paginated sessions
    const result = await client.query(
      "SELECT * FROM sessions ORDER BY started_at DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    )
    
    const sessions = result.rows.map((row) => ({
      id: row.id,
      taskId: row.task_id,
      taskName: row.task_name,
      tags: row.tags,
      duration: row.duration,
      durationFormatted: row.duration_formatted,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      date: row.date,
      pomodoroCount: row.pomodoro_count,
      productivityRating: row.productivity_rating,
    }))
    
    return { sessions, total }
  } finally {
    client.release()
  }
}

/**
 * Get sessions for a specific date.
 */
export async function getSessionsByDate(date: string): Promise<Session[]> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      "SELECT * FROM sessions WHERE date = $1 ORDER BY started_at DESC",
      [date]
    )
    
    return result.rows.map((row) => ({
      id: row.id,
      taskId: row.task_id,
      taskName: row.task_name,
      tags: row.tags,
      duration: row.duration,
      durationFormatted: row.duration_formatted,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      date: row.date,
      pomodoroCount: row.pomodoro_count,
      productivityRating: row.productivity_rating,
    }))
  } finally {
    client.release()
  }
}

/**
 * Get sessions within a date range (inclusive).
 */
export async function getSessionsByDateRange(startDate: string, endDate: string): Promise<Session[]> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      "SELECT * FROM sessions WHERE date >= $1 AND date <= $2 ORDER BY started_at DESC",
      [startDate, endDate]
    )
    
    return result.rows.map((row) => ({
      id: row.id,
      taskId: row.task_id,
      taskName: row.task_name,
      tags: row.tags,
      duration: row.duration,
      durationFormatted: row.duration_formatted,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      date: row.date,
      pomodoroCount: row.pomodoro_count,
      productivityRating: row.productivity_rating,
    }))
  } finally {
    client.release()
  }
}

/**
 * Get sessions that contain specific tags.
 */
export async function getSessionsByTags(tags: string[]): Promise<Session[]> {
  const client = await pool.connect()
  try {
    // Use PostgreSQL array overlap operator &&
    const result = await client.query(
      "SELECT * FROM sessions WHERE tags && $1 ORDER BY started_at DESC",
      [tags]
    )
    
    return result.rows.map((row) => ({
      id: row.id,
      taskId: row.task_id,
      taskName: row.task_name,
      tags: row.tags,
      duration: row.duration,
      durationFormatted: row.duration_formatted,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      date: row.date,
      pomodoroCount: row.pomodoro_count,
      productivityRating: row.productivity_rating,
    }))
  } finally {
    client.release()
  }
}

/**
 * Update a session's productivity rating.
 */
export async function updateSessionRating(id: string, rating: number): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query(
      "UPDATE sessions SET productivity_rating = $1 WHERE id = $2",
      [rating, id]
    )
  } finally {
    client.release()
  }
}

/**
 * Delete a session by ID.
 * Also cleans up any linked task reference.
 */
export async function deleteSession(id: string): Promise<void> {
  const client = await pool.connect()
  try {
    // Get the session first to find linked task
    const sessionResult = await client.query(
      "SELECT task_id FROM sessions WHERE id = $1",
      [id]
    )
    
    if (sessionResult.rows.length === 0) return
    
    const taskId = sessionResult.rows[0].task_id
    
    // Delete the session
    await client.query("DELETE FROM sessions WHERE id = $1", [id])
    
    // Clean up dangling task.session_id reference
    if (taskId) {
      await client.query(
        "UPDATE tasks SET session_id = NULL WHERE id = $1 AND session_id = $2",
        [taskId, id]
      )
    }
  } finally {
    client.release()
  }
}

/**
 * Delete all sessions (used for data reset).
 */
export async function deleteAllSessions(): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("DELETE FROM sessions")
  } finally {
    client.release()
  }
}

/**
 * Get session count for analytics.
 */
export async function getSessionCount(): Promise<number> {
  const client = await pool.connect()
  try {
    const result = await client.query("SELECT COUNT(*) as count FROM sessions")
    return parseInt(result.rows[0].count, 10)
  } finally {
    client.release()
  }
}

/**
 * Get total focus time (sum of all session durations) in seconds.
 */
export async function getTotalFocusTime(): Promise<number> {
  const client = await pool.connect()
  try {
    const result = await client.query("SELECT COALESCE(SUM(duration), 0) as total FROM sessions")
    return parseInt(result.rows[0].total, 10)
  } finally {
    notifyDatabaseChange()
    client.release()
  }
}
