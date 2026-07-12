/**
 * Database persistence layer for goals.
 * 
 * This module provides async functions to read/write goals
 * from the PostgreSQL `goals` table.
 */

import type { Goal } from "@/lib/types"
import { withDb } from "@/lib/db-utils"

/**
 * Create a new goal
 * Returns the created goal with its generated ID.
 */
export async function createGoal(userId: string, input: Omit<Goal, "id" | "createdAt" | "updatedAt" | "roadmap">): Promise<Goal> {
  return withDb(async (client) => {
    const result = await client.query(
      `INSERT INTO goals (
        name, description, category, tag, target_hours, target_date, weekly_target,
        priority, status, color, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        input.name,
        input.description,
        input.category,
        input.tag,
        input.targetHours,
        input.targetDate,
        input.weeklyTarget,
        input.priority,
        input.status,
        input.color,
        userId,
      ]
    )
    
    const row = result.rows[0]
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      tag: row.tag,
      targetHours: row.target_hours,
      targetDate: row.target_date,
      weeklyTarget: row.weekly_target,
      priority: row.priority,
      status: row.status,
      color: row.color,
      roadmap: [], // Empty roadmap array - populated separately
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  })
}

/**
 * Get a goal by ID.
 */
export async function getGoalById(userId: string, id: string): Promise<Goal | null> {
  return withDb(async (client) => {
    const result = await client.query(
      "SELECT * FROM goals WHERE id = $1 AND user_id = $2",
      [id, userId]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    const row = result.rows[0]
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      tag: row.tag,
      targetHours: row.target_hours,
      targetDate: row.target_date,
      weeklyTarget: row.weekly_target,
      priority: row.priority,
      status: row.status,
      color: row.color,
      roadmap: [], // Empty roadmap array - populated separately
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  })
}

/**
 * Get all goals, ordered by createdAt descending (newest first).
 * Can optionally filter by status.
 * Supports pagination with limit and offset.
 */
export async function getAllGoals(userId: string, options?: {
  statusFilter?: string;
  limit?: number;
  offset?: number;
}): Promise<{ goals: Goal[]; total: number }> {
  return withDb(async (client) => {
    const limit = options?.limit || 50
    const offset = options?.offset || 0
    const statusFilter = options?.statusFilter
    
    let countQuery = "SELECT COUNT(*) as count FROM goals WHERE user_id = $1"
    let query = "SELECT * FROM goals WHERE user_id = $1"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any[] = [userId]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const countParams: any[] = [userId]
    
    if (statusFilter) {
      countQuery += " AND status = $2"
      query += " AND status = $2"
      params.push(statusFilter)
      countParams.push(statusFilter)
    }
    
    // Get total count
    const countResult = await client.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].count, 10)
    
    // Get paginated goals
    query += " ORDER BY created_at DESC LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2)
    params.push(limit, offset)
    
    const result = await client.query(query, params)
    
    const goals = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      tag: row.tag,
      targetHours: row.target_hours,
      targetDate: row.target_date,
      weeklyTarget: row.weekly_target,
      priority: row.priority,
      status: row.status,
      color: row.color,
      roadmap: [], // Empty roadmap array - populated separately
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
    
    return { goals, total }
  })
}

/**
 * Get goals by category.
 */
export async function getGoalsByCategory(userId: string, category: string): Promise<Goal[]> {
  return withDb(async (client) => {
    const result = await client.query(
      "SELECT * FROM goals WHERE user_id = $1 AND category = $2 ORDER BY created_at DESC",
      [userId, category]
    )
    
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      tag: row.tag,
      targetHours: row.target_hours,
      targetDate: row.target_date,
      weeklyTarget: row.weekly_target,
      priority: row.priority,
      status: row.status,
      color: row.color,
      roadmap: [], // Empty roadmap array - populated separately
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  })
}

/**
 * Get goals by status.
 */
export async function getGoalsByStatus(userId: string, status: string): Promise<Goal[]> {
  return withDb(async (client) => {
    const result = await client.query(
      "SELECT * FROM goals WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC",
      [userId, status]
    )
    
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      tag: row.tag,
      targetHours: row.target_hours,
      targetDate: row.target_date,
      weeklyTarget: row.weekly_target,
      priority: row.priority,
      status: row.status,
      color: row.color,
      roadmap: [], // Empty roadmap array - populated separately
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  })
}

/**
 * Update a goal by ID.
 * Returns the updated goal.
 */
export async function updateGoal(userId: string, id: string, updates: Partial<Omit<Goal, "id" | "createdAt" | "updatedAt" | "roadmap">>): Promise<Goal> {
  return withDb(async (client) => {
    // Build dynamic update query
    const setClauses: string[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = []
    let paramCount = 1

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramCount++}`)
      values.push(updates.name)
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramCount++}`)
      values.push(updates.description)
    }
    if (updates.category !== undefined) {
      setClauses.push(`category = $${paramCount++}`)
      values.push(updates.category)
    }
    if (updates.tag !== undefined) {
      setClauses.push(`tag = $${paramCount++}`)
      values.push(updates.tag)
    }
    if (updates.targetHours !== undefined) {
      setClauses.push(`target_hours = $${paramCount++}`)
      values.push(updates.targetHours)
    }
    if (updates.targetDate !== undefined) {
      setClauses.push(`target_date = $${paramCount++}`)
      values.push(updates.targetDate)
    }
    if (updates.weeklyTarget !== undefined) {
      setClauses.push(`weekly_target = $${paramCount++}`)
      values.push(updates.weeklyTarget)
    }
    if (updates.priority !== undefined) {
      setClauses.push(`priority = $${paramCount++}`)
      values.push(updates.priority)
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramCount++}`)
      values.push(updates.status)
    }
    if (updates.color !== undefined) {
      setClauses.push(`color = $${paramCount++}`)
      values.push(updates.color)
    }

    // Always update updated_at timestamp
    setClauses.push(`updated_at = CURRENT_TIMESTAMP`)

    if (setClauses.length === 1) {
      // Only updated_at change, just return current goal
      const goal = await getGoalById(userId, id)
      if (!goal) throw new Error(`Goal not found: ${id}`)
      return goal
    }

    values.push(id)
    values.push(userId)
    const query = `UPDATE goals SET ${setClauses.join(", ")} WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`

    const result = await client.query(query, values)
    
    if (result.rows.length === 0) {
      throw new Error(`Goal not found: ${id}`)
    }
    
    const row = result.rows[0]
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      tag: row.tag,
      targetHours: row.target_hours,
      targetDate: row.target_date,
      weeklyTarget: row.weekly_target,
      priority: row.priority,
      status: row.status,
      color: row.color,
      roadmap: [], // Empty roadmap array - populated separately
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  })
}

/**
 * Delete a goal by ID.
 * CASCADE DELETE: Also deletes all related weekly_objectives, tasks, roadmap_phases, and roadmap_nodes.
 */
export async function deleteGoal(userId: string, id: string): Promise<void> {
  return withDb(async (client) => {
    // The database schema has CASCADE DELETE constraints, so this will automatically
    // delete related records in weekly_objectives, tasks, roadmap_phases, and roadmap_nodes
    await client.query("DELETE FROM goals WHERE id = $1 AND user_id = $2", [id, userId])
  })
}

/**
 * Get goal count for analytics.
 */
export async function getGoalCount(userId: string, statusFilter?: string): Promise<number> {
  return withDb(async (client) => {
    let query = "SELECT COUNT(*) as count FROM goals WHERE user_id = $1"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any[] = [userId]
    
    if (statusFilter) {
      query += " AND status = $2"
      params.push(statusFilter)
    }
    
    const result = await client.query(query, params)
    return parseInt(result.rows[0].count, 10)
  })
}

/**
 * Get goal count by status for analytics.
 */
export async function getGoalCountByStatus(userId: string): Promise<Record<string, number>> {
  return withDb(async (client) => {
    const result = await client.query(
      "SELECT status, COUNT(*) as count FROM goals WHERE user_id = $1 GROUP BY status",
      [userId]
    )
    
    const counts: Record<string, number> = {}
    result.rows.forEach((row) => {
      counts[row.status] = parseInt(row.count, 10)
    })
    return counts
  })
}

/**
 * Delete all goals (used for testing/data reset).
 */
export async function deleteAllGoals(userId: string): Promise<void> {
  return withDb(async (client) => {
    await client.query("DELETE FROM goals WHERE user_id = $1", [userId])
  })
}
