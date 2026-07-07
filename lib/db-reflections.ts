/**
 * Database persistence layer for reflections.
 * 
 * This module provides async functions to read/write reflections
 * from the PostgreSQL `reflections` table.
 */

import type { Reflection } from "@/lib/types"
import { withDb } from "@/lib/db-utils"
import { notifyDatabaseChange } from "@/lib/db-events"

/**
 * Create a new reflection in the database.
 * Returns the created reflection with its generated ID.
 */
export async function createReflection(userId: string, input: Omit<Reflection, "id" | "createdAt">): Promise<Reflection> {
  return withDb(async (client) => {
    const result = await client.query(
      `INSERT INTO reflections (
        date, mood, accomplishments, challenges, improvements, rating, wins, tomorrow_plan, notes, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        input.date,
        input.mood,
        input.accomplishments,
        input.challenges,
        input.improvements,
        input.rating,
        input.wins,
        input.tomorrowPlan,
        input.notes,
        userId,
      ]
    )
    
    const row = result.rows[0]
    return {
      id: row.id,
      date: row.date,
      mood: row.mood,
      accomplishments: row.accomplishments,
      challenges: row.challenges,
      improvements: row.improvements,
      rating: row.rating,
      wins: row.wins,
      tomorrowPlan: row.tomorrow_plan,
      notes: row.notes,
      createdAt: row.created_at,
    }
  })
}

/**
 * Get a reflection by date.
 * Returns null if no reflection exists for the given date.
 */
export async function getReflectionByDate(userId: string, date: string): Promise<Reflection | null> {
  return withDb(async (client) => {
    const result = await client.query(
      "SELECT * FROM reflections WHERE user_id = $1 AND date = $2",
      [userId, date]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    const row = result.rows[0]
    return {
      id: row.id,
      date: row.date,
      mood: row.mood,
      accomplishments: row.accomplishments,
      challenges: row.challenges,
      improvements: row.improvements,
      rating: row.rating,
      wins: row.wins,
      tomorrowPlan: row.tomorrow_plan,
      notes: row.notes,
      createdAt: row.created_at,
    }
  })
}

/**
 * Get all reflections, ordered by date descending (newest first).
 * Supports pagination with limit and offset.
 */
export async function getAllReflections(userId: string, options?: {
  limit?: number;
  offset?: number;
}): Promise<{ reflections: Reflection[]; total: number }> {
  return withDb(async (client) => {
    const limit = options?.limit || 50
    const offset = options?.offset || 0
    
    // Get total count
    const countResult = await client.query("SELECT COUNT(*) as count FROM reflections WHERE user_id = $1", [userId])
    const total = parseInt(countResult.rows[0].count, 10)
    
    // Get paginated reflections
    const result = await client.query(
      "SELECT * FROM reflections WHERE user_id = $1 ORDER BY date DESC LIMIT $2 OFFSET $3",
      [userId, limit, offset]
    )
    
    const reflections = result.rows.map((row) => ({
      id: row.id,
      date: row.date,
      mood: row.mood,
      accomplishments: row.accomplishments,
      challenges: row.challenges,
      improvements: row.improvements,
      rating: row.rating,
      wins: row.wins,
      tomorrowPlan: row.tomorrow_plan,
      notes: row.notes,
      createdAt: row.created_at,
    }))
    
    return { reflections, total }
  })
}

/**
 * Upsert a reflection: create if doesn't exist, update if it does (by date).
 * Returns the created or updated reflection.
 */
export async function upsertReflection(userId: string, input: Omit<Reflection, "id" | "createdAt">): Promise<Reflection> {
  return withDb(async (client) => {
    const result = await client.query(
      `INSERT INTO reflections (
        date, mood, accomplishments, challenges, improvements, rating, wins, tomorrow_plan, notes, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id, date) DO UPDATE SET
        mood = EXCLUDED.mood,
        accomplishments = EXCLUDED.accomplishments,
        challenges = EXCLUDED.challenges,
        improvements = EXCLUDED.improvements,
        rating = EXCLUDED.rating,
        wins = EXCLUDED.wins,
        tomorrow_plan = EXCLUDED.tomorrow_plan,
        notes = EXCLUDED.notes
      RETURNING *`,
      [
        input.date,
        input.mood,
        input.accomplishments,
        input.challenges,
        input.improvements,
        input.rating,
        input.wins,
        input.tomorrowPlan,
        input.notes,
        userId,
      ]
    )
    
    const row = result.rows[0]
    return {
      id: row.id,
      date: row.date,
      mood: row.mood,
      accomplishments: row.accomplishments,
      challenges: row.challenges,
      improvements: row.improvements,
      rating: row.rating,
      wins: row.wins,
      tomorrowPlan: row.tomorrow_plan,
      notes: row.notes,
      createdAt: row.created_at,
    }
  })
}

/**
 * Delete a reflection by date.
 */
export async function deleteReflectionByDate(userId: string, date: string): Promise<void> {
  return withDb(async (client) => {
    await client.query("DELETE FROM reflections WHERE user_id = $1 AND date = $2", [userId, date])
  })
}

/**
 * Delete all reflections (used for testing/data reset).
 */
export async function deleteAllReflections(userId: string): Promise<void> {
  return withDb(async (client) => {
    await client.query("DELETE FROM reflections WHERE user_id = $1", [userId])
  })
}

/**
 * Get reflection count for analytics.
 */
export async function getReflectionCount(userId: string): Promise<number> {
  return withDb(async (client) => {
    const result = await client.query("SELECT COUNT(*) as count FROM reflections WHERE user_id = $1", [userId])
    return parseInt(result.rows[0].count, 10)
  })
}

/**
 * Get reflections within a date range.
 */
export async function getReflectionsByDateRange(userId: string, startDate: string, endDate: string): Promise<Reflection[]> {
  return withDb(async (client) => {
    const result = await client.query(
      "SELECT * FROM reflections WHERE user_id = $1 AND date >= $2 AND date <= $3 ORDER BY date DESC",
      [userId, startDate, endDate]
    )
    
    notifyDatabaseChange()
    
    return result.rows.map((row) => ({
      id: row.id,
      date: row.date,
      mood: row.mood,
      accomplishments: row.accomplishments,
      challenges: row.challenges,
      improvements: row.improvements,
      rating: row.rating,
      wins: row.wins,
      tomorrowPlan: row.tomorrow_plan,
      notes: row.notes,
      createdAt: row.created_at,
    }))
  })
}
