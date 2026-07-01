/**
 * Database persistence layer for reflections.
 * 
 * This module provides async functions to read/write reflections
 * from the PostgreSQL `reflections` table.
 */

import pool from "@/lib/db"
import type { Reflection } from "@/lib/types"
import { notifyDatabaseChange } from "@/lib/db-events"

/**
 * Create a new reflection in the database.
 * Returns the created reflection with its generated ID.
 */
export async function createReflection(input: Omit<Reflection, "id" | "createdAt">): Promise<Reflection> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `INSERT INTO reflections (
        date, mood, accomplishments, challenges, improvements, rating, wins, tomorrow_plan, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
  } finally {
    client.release()
  }
}

/**
 * Get a reflection by date.
 * Returns null if no reflection exists for the given date.
 */
export async function getReflectionByDate(date: string): Promise<Reflection | null> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      "SELECT * FROM reflections WHERE date = $1",
      [date]
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
  } finally {
    client.release()
  }
}

/**
 * Get all reflections, ordered by date descending (newest first).
 * Supports pagination with limit and offset.
 */
export async function getAllReflections(options?: {
  limit?: number;
  offset?: number;
}): Promise<{ reflections: Reflection[]; total: number }> {
  const client = await pool.connect()
  try {
    const limit = options?.limit || 50
    const offset = options?.offset || 0
    
    // Get total count
    const countResult = await client.query("SELECT COUNT(*) as count FROM reflections")
    const total = parseInt(countResult.rows[0].count, 10)
    
    // Get paginated reflections
    const result = await client.query(
      "SELECT * FROM reflections ORDER BY date DESC LIMIT $1 OFFSET $2",
      [limit, offset]
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
  } finally {
    client.release()
  }
}

/**
 * Upsert a reflection: create if doesn't exist, update if it does (by date).
 * Returns the created or updated reflection.
 */
export async function upsertReflection(input: Omit<Reflection, "id" | "createdAt">): Promise<Reflection> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `INSERT INTO reflections (
        date, mood, accomplishments, challenges, improvements, rating, wins, tomorrow_plan, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (date) DO UPDATE SET
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
  } finally {
    client.release()
  }
}

/**
 * Delete a reflection by date.
 */
export async function deleteReflectionByDate(date: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("DELETE FROM reflections WHERE date = $1", [date])
  } finally {
    client.release()
  }
}

/**
 * Delete all reflections (used for testing/data reset).
 */
export async function deleteAllReflections(): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("DELETE FROM reflections")
  } finally {
    client.release()
  }
}

/**
 * Get reflection count for analytics.
 */
export async function getReflectionCount(): Promise<number> {
  const client = await pool.connect()
  try {
    const result = await client.query("SELECT COUNT(*) as count FROM reflections")
    return parseInt(result.rows[0].count, 10)
  } finally {
    client.release()
  }
}

/**
 * Get reflections within a date range.
 */
export async function getReflectionsByDateRange(startDate: string, endDate: string): Promise<Reflection[]> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      "SELECT * FROM reflections WHERE date >= $1 AND date <= $2 ORDER BY date DESC",
      [startDate, endDate]
    )
    
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
  } finally {
    notifyDatabaseChange()
    client.release()
  }
}
