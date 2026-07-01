/**
 * Database persistence layer for interruptions.
 * 
 * This module provides async functions to read/write interruptions
 * from the PostgreSQL `interruptions` table.
 */

import pool from "@/lib/db"
import type { Interruption } from "@/lib/types"
import { notifyDatabaseChange } from "@/lib/db-events"

/**
 * Create a new interruption in the database.
 * Returns the created interruption with its generated ID.
 */
export async function createInterruption(input: Omit<Interruption, "id">): Promise<Interruption> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `INSERT INTO interruptions (
        session_id, type, cause, duration, note, timestamp, recovery_time, severity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
      ]
    )
    
    const row = result.rows[0]
    return {
      id: row.id,
      sessionId: row.session_id,
      type: row.type,
      cause: row.cause,
      duration: row.duration,
      note: row.note,
      timestamp: row.timestamp,
      recoveryTime: row.recovery_time,
      severity: row.severity,
    }
  } finally {
    client.release()
  }
}

/**
 * Get all interruptions, ordered by timestamp descending (newest first).
 * Supports pagination with limit and offset.
 */
export async function getAllInterruptions(options?: {
  limit?: number;
  offset?: number;
}): Promise<{ interruptions: Interruption[]; total: number }> {
  const client = await pool.connect()
  try {
    const limit = options?.limit || 50
    const offset = options?.offset || 0
    
    // Get total count
    const countResult = await client.query("SELECT COUNT(*) as count FROM interruptions")
    const total = parseInt(countResult.rows[0].count, 10)
    
    // Get paginated interruptions
    const result = await client.query(
      "SELECT * FROM interruptions ORDER BY timestamp DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    )
    
    const interruptions = result.rows.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      type: row.type,
      cause: row.cause,
      duration: row.duration,
      note: row.note,
      timestamp: row.timestamp,
      recoveryTime: row.recovery_time,
      severity: row.severity,
    }))
    
    return { interruptions, total }
  } finally {
    client.release()
  }
}

/**
 * Get interruptions for a specific session.
 */
export async function getInterruptionsBySession(sessionId: string): Promise<Interruption[]> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      "SELECT * FROM interruptions WHERE session_id = $1 ORDER BY timestamp DESC",
      [sessionId]
    )
    
    return result.rows.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      type: row.type,
      cause: row.cause,
      duration: row.duration,
      note: row.note,
      timestamp: row.timestamp,
      recoveryTime: row.recovery_time,
      severity: row.severity,
    }))
  } finally {
    client.release()
  }
}

/**
 * Get interruptions within a date range.
 */
export async function getInterruptionsByDateRange(startDate: string, endDate: string): Promise<Interruption[]> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT * FROM interruptions 
       WHERE timestamp::date >= $1::date AND timestamp::date <= $2::date 
       ORDER BY timestamp DESC`,
      [startDate, endDate]
    )
    
    return result.rows.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      type: row.type,
      cause: row.cause,
      duration: row.duration,
      note: row.note,
      timestamp: row.timestamp,
      recoveryTime: row.recovery_time,
      severity: row.severity,
    }))
  } finally {
    client.release()
  }
}

/**
 * Delete an interruption by ID.
 */
export async function deleteInterruption(id: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("DELETE FROM interruptions WHERE id = $1", [id])
  } finally {
    client.release()
  }
}

/**
 * Delete all interruptions (used for data reset).
 */
export async function deleteAllInterruptions(): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("DELETE FROM interruptions")
  } finally {
    client.release()
  }
}

/**
 * Get interruption count for analytics.
 */
export async function getInterruptionCount(): Promise<number> {
  const client = await pool.connect()
  try {
    const result = await client.query("SELECT COUNT(*) as count FROM interruptions")
    return parseInt(result.rows[0].count, 10)
  } finally {
    client.release()
  }
}

/**
 * Get total interruption time (sum of all durations) in seconds.
 */
export async function getTotalInterruptionTime(): Promise<number> {
  const client = await pool.connect()
  try {
    const result = await client.query("SELECT COALESCE(SUM(duration), 0) as total FROM interruptions")
    return parseInt(result.rows[0].total, 10)
  } finally {
    notifyDatabaseChange()
    client.release()
  }
}
