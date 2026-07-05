/**
 * Database persistence layer for weekly objectives.
 * 
 * This module provides async functions to read/write weekly objectives
 * from the PostgreSQL `weekly_objectives` table.
 */

import type { WeeklyObjective } from "@/lib/types"
import { withDb } from "@/lib/db-utils"
import { notifyDatabaseChange } from "@/lib/db-events"

/**
 * Create a new weekly objective in the database.
 * Returns the created objective with its generated ID.
 */
export async function createWeeklyObjective(input: Omit<WeeklyObjective, "id" | "dailyTaskIds" | "createdAt">): Promise<WeeklyObjective> {
  return withDb(async (client) => {
    const result = await client.query(
      `INSERT INTO weekly_objectives (
        goal_id, title, description, priority, status, week_start, week_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        input.goalId,
        input.title,
        input.description,
        input.priority,
        input.status,
        input.weekStart,
        input.weekEnd,
      ]
    )
    
    const row = result.rows[0]
    return {
      id: row.id,
      goalId: row.goal_id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      weekStart: row.week_start,
      weekEnd: row.week_end,
      dailyTaskIds: [], // Computed from tasks table
      createdAt: row.created_at,
    }
  })
}

/**
 * Get a weekly objective by ID.
 * Returns null if not found.
 */
export async function getWeeklyObjectiveById(id: string): Promise<WeeklyObjective | null> {
  return withDb(async (client) => {
    const result = await client.query(
      "SELECT * FROM weekly_objectives WHERE id = $1",
      [id]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    const row = result.rows[0]
    
    // Get linked task IDs
    const tasksResult = await client.query(
      "SELECT id FROM tasks WHERE objective_id = $1 ORDER BY created_at",
      [id]
    )
    
    return {
      id: row.id,
      goalId: row.goal_id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      weekStart: row.week_start,
      weekEnd: row.week_end,
      dailyTaskIds: tasksResult.rows.map(r => r.id),
      createdAt: row.created_at,
    }
  })
}

/**
 * Get all weekly objectives with pagination support.
 * @param options - Pagination options
 */
export async function getAllWeeklyObjectives(options?: {
  limit?: number;
  offset?: number;
}): Promise<WeeklyObjective[]> {
  const limit = options?.limit || 100;
  const offset = options?.offset || 0;
  
  return withDb(async (client) => {
    // Single query with aggregation to avoid N+1
    const result = await client.query(
      `SELECT 
        wo.*,
        COALESCE(
          json_agg(t.id ORDER BY t.created_at) 
          FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) as daily_task_ids
      FROM weekly_objectives wo
      LEFT JOIN tasks t ON wo.id = t.objective_id
      GROUP BY wo.id
      ORDER BY wo.week_start DESC, wo.priority DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    )
    
    return result.rows.map((row) => ({
      id: row.id,
      goalId: row.goal_id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      weekStart: row.week_start,
      weekEnd: row.week_end,
      dailyTaskIds: row.daily_task_ids,
      createdAt: row.created_at,
    }))
  })
}

/**
 * Get weekly objectives for a specific week.
 */
export async function getWeeklyObjectivesByWeek(weekStart: string): Promise<WeeklyObjective[]> {
  return withDb(async (client) => {
    // Single query with aggregation to avoid N+1
    const result = await client.query(
      `SELECT 
        wo.*,
        COALESCE(
          json_agg(t.id ORDER BY t.created_at) 
          FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) as daily_task_ids
      FROM weekly_objectives wo
      LEFT JOIN tasks t ON wo.id = t.objective_id
      WHERE wo.week_start = $1
      GROUP BY wo.id
      ORDER BY wo.priority DESC`,
      [weekStart]
    )
    
    return result.rows.map((row) => ({
      id: row.id,
      goalId: row.goal_id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      weekStart: row.week_start,
      weekEnd: row.week_end,
      dailyTaskIds: row.daily_task_ids,
      createdAt: row.created_at,
    }))
  })
}

/**
 * Get weekly objectives for a specific goal.
 */
export async function getWeeklyObjectivesByGoal(goalId: string): Promise<WeeklyObjective[]> {
  return withDb(async (client) => {
    // Single query with aggregation to avoid N+1
    const result = await client.query(
      `SELECT 
        wo.*,
        COALESCE(
          json_agg(t.id ORDER BY t.created_at) 
          FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) as daily_task_ids
      FROM weekly_objectives wo
      LEFT JOIN tasks t ON wo.id = t.objective_id
      WHERE wo.goal_id = $1
      GROUP BY wo.id
      ORDER BY wo.week_start DESC, wo.priority DESC`,
      [goalId]
    )
    
    return result.rows.map((row) => ({
      id: row.id,
      goalId: row.goal_id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      weekStart: row.week_start,
      weekEnd: row.week_end,
      dailyTaskIds: row.daily_task_ids,
      createdAt: row.created_at,
    }))
  })
}

/**
 * Get weekly objectives for a specific goal within a specific week.
 */
export async function getWeeklyObjectivesByGoalAndWeek(goalId: string, weekStart: string): Promise<WeeklyObjective[]> {
  return withDb(async (client) => {
    // Single query with aggregation to avoid N+1
    const result = await client.query(
      `SELECT 
        wo.*,
        COALESCE(
          json_agg(t.id ORDER BY t.created_at) 
          FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) as daily_task_ids
      FROM weekly_objectives wo
      LEFT JOIN tasks t ON wo.id = t.objective_id
      WHERE wo.goal_id = $1 AND wo.week_start = $2
      GROUP BY wo.id
      ORDER BY wo.priority DESC`,
      [goalId, weekStart]
    )
    
    return result.rows.map((row) => ({
      id: row.id,
      goalId: row.goal_id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      weekStart: row.week_start,
      weekEnd: row.week_end,
      dailyTaskIds: row.daily_task_ids,
      createdAt: row.created_at,
    }))
  })
}

/**
 * Update a weekly objective by ID.
 * Returns the updated objective.
 */
export async function updateWeeklyObjective(
  id: string,
  updates: Partial<Omit<WeeklyObjective, "id" | "dailyTaskIds" | "createdAt">>
): Promise<WeeklyObjective> {
  return withDb(async (client) => {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (updates.goalId !== undefined) {
      fields.push(`goal_id = $${paramIndex++}`)
      values.push(updates.goalId)
    }
    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex++}`)
      values.push(updates.title)
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`)
      values.push(updates.description)
    }
    if (updates.priority !== undefined) {
      fields.push(`priority = $${paramIndex++}`)
      values.push(updates.priority)
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`)
      values.push(updates.status)
    }
    if (updates.weekStart !== undefined) {
      fields.push(`week_start = $${paramIndex++}`)
      values.push(updates.weekStart)
    }
    if (updates.weekEnd !== undefined) {
      fields.push(`week_end = $${paramIndex++}`)
      values.push(updates.weekEnd)
    }

    if (fields.length === 0) {
      const current = await getWeeklyObjectiveById(id)
      if (!current) throw new Error(`Weekly objective ${id} not found`)
      return current
    }

    values.push(id)
    const { rows } = await client.query(
      `UPDATE weekly_objectives SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values,
    )
    if (rows.length === 0) throw new Error(`Weekly objective ${id} not found`)
    const row = rows[0]!

    const { rows: taskRows } = await client.query(
      "SELECT id FROM tasks WHERE objective_id = $1 ORDER BY created_at",
      [id],
    )

    return {
      id: row.id,
      goalId: row.goal_id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      weekStart: row.week_start,
      weekEnd: row.week_end,
      dailyTaskIds: taskRows.map(r => r.id),
      createdAt: row.created_at,
    }
  })
}

/**
 * Delete a weekly objective by ID.
 * CASCADE DELETE will also remove linked tasks.
 */
export async function deleteWeeklyObjective(id: string): Promise<void> {
  return withDb(async (client) => {
    await client.query("DELETE FROM weekly_objectives WHERE id = $1", [id])
  })
}

/**
 * Delete all weekly objectives (used for testing/data reset).
 * CASCADE DELETE will also remove all linked tasks.
 */
export async function deleteAllWeeklyObjectives(): Promise<void> {
  return withDb(async (client) => {
    await client.query("DELETE FROM weekly_objectives")
  })
}

/**
 * Get weekly objective count for analytics.
 */
export async function getWeeklyObjectiveCount(): Promise<number> {
  return withDb(async (client) => {
    const { rows } = await client.query("SELECT COUNT(*) as count FROM weekly_objectives")
    return parseInt(rows[0].count as string, 10)
  })
}
