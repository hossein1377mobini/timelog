/**
 * Database persistence layer for focus sessions.
 * 
 * This module provides async functions to read/write sessions
 * from the PostgreSQL `sessions` table.
 */

import type { Session } from "@/lib/types"
import { withDb } from "@/lib/db-utils"
import { notifyDatabaseChange } from "@/lib/db-events"

/**
 * Create a new session in the database.
 * Returns the created session with its generated ID.
 */
export async function createSession(userId: string, input: Omit<Session, "id">): Promise<Session> {
  return withDb(async (client) => {
    const result = await client.query(
      `INSERT INTO sessions (
        task_id, task_name, tags, duration, duration_formatted,
        started_at, ended_at, date, pomodoro_count, productivity_rating, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
        userId,
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
  })
}

/**
 * Get a session by ID.
 * Returns null if not found.
 */
export async function getSessionById(userId: string, id: string): Promise<Session | null> {
  return withDb(async (client) => {
    const result = await client.query(
      "SELECT * FROM sessions WHERE id = $1 AND user_id = $2",
      [id, userId]
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
  })
}

/**
 * Get all sessions, ordered by started_at descending (newest first).
 * Supports pagination with limit and offset.
 */
export async function getAllSessions(userId: string, options?: {
  limit?: number;
  offset?: number;
}): Promise<{ sessions: Session[]; total: number }> {
  return withDb(async (client) => {
    const limit = options?.limit || 50
    const offset = options?.offset || 0
    
    // Get total count
    const countResult = await client.query("SELECT COUNT(*) as count FROM sessions WHERE user_id = $1", [userId])
    const total = parseInt(countResult.rows[0].count, 10)
    
    // Get paginated sessions
    const result = await client.query(
      "SELECT * FROM sessions WHERE user_id = $1 ORDER BY started_at DESC LIMIT $2 OFFSET $3",
      [userId, limit, offset]
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
  })
}

/**
 * Get sessions for a specific date.
 */
export async function getSessionsByDate(userId: string, date: string): Promise<Session[]> {
  return withDb(async (client) => {
    const result = await client.query(
      "SELECT * FROM sessions WHERE user_id = $1 AND date = $2 ORDER BY started_at DESC",
      [userId, date]
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
  })
}

/**
 * Get sessions within a date range (inclusive).
 */
export async function getSessionsByDateRange(userId: string, startDate: string, endDate: string): Promise<Session[]> {
  return withDb(async (client) => {
    const result = await client.query(
      "SELECT * FROM sessions WHERE user_id = $1 AND date >= $2 AND date <= $3 ORDER BY started_at DESC",
      [userId, startDate, endDate]
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
  })
}

/**
 * Get sessions that contain specific tags.
 */
export async function getSessionsByTags(userId: string, tags: string[]): Promise<Session[]> {
  return withDb(async (client) => {
    // Use PostgreSQL array overlap operator &&
    const result = await client.query(
      "SELECT * FROM sessions WHERE user_id = $1 AND tags && $2 ORDER BY started_at DESC",
      [userId, tags]
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
  })
}

/**
 * Update a session's productivity rating.
 */
export async function updateSessionRating(userId: string, id: string, rating: number): Promise<void> {
  return withDb(async (client) => {
    await client.query(
      "UPDATE sessions SET productivity_rating = $1 WHERE id = $2 AND user_id = $3",
      [rating, id, userId]
    )
  })
}

/**
 * Delete a session by ID.
 * Also cleans up any linked task reference.
 */
export async function deleteSession(userId: string, id: string): Promise<void> {
  return withDb(async (client) => {
    // Get the session first to find linked task
    const sessionResult = await client.query(
      "SELECT task_id FROM sessions WHERE id = $1 AND user_id = $2",
      [id, userId]
    )
    
    if (sessionResult.rows.length === 0) return
    
    const taskId = sessionResult.rows[0].task_id
    
    // Delete the session
    await client.query("DELETE FROM sessions WHERE id = $1 AND user_id = $2", [id, userId])
    
    // Clean up dangling task.session_id reference
    if (taskId) {
      await client.query(
        "UPDATE tasks SET session_id = NULL WHERE id = $1 AND session_id = $2",
        [taskId, id]
      )
    }
  })
}

/**
 * Delete all sessions (used for data reset).
 */
export async function deleteAllSessions(userId: string): Promise<void> {
  return withDb(async (client) => {
    await client.query("DELETE FROM sessions WHERE user_id = $1", [userId])
  })
}

/**
 * Get session count for analytics.
 */
export async function getSessionCount(userId: string): Promise<number> {
  return withDb(async (client) => {
    const result = await client.query("SELECT COUNT(*) as count FROM sessions WHERE user_id = $1", [userId])
    return parseInt(result.rows[0].count, 10)
  })
}

/**
 * Get total focus time (sum of all session durations) in seconds.
 */
export async function getTotalFocusTime(userId: string): Promise<number> {
  return withDb(async (client) => {
    const result = await client.query("SELECT COALESCE(SUM(duration), 0) as total FROM sessions WHERE user_id = $1", [userId])
    notifyDatabaseChange()
    return parseInt(result.rows[0].total, 10)
  })
}
