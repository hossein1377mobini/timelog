/**
 * Database persistence layer for daily tasks.
 * 
 * This module provides async functions to read/write daily tasks
 * from the PostgreSQL `tasks` table.
 */

import pool from "@/lib/db"
import type { Task, ChecklistItem } from "@/lib/types"
import { notifyDatabaseChange } from "@/lib/db-events"

/**
 * Create a new task in the database.
 * Returns the created task with its generated ID.
 */
export async function createTask(input: Omit<Task, "id" | "checklist" | "createdAt">): Promise<Task> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `INSERT INTO tasks (
        objective_id, title, description, estimated_time, priority, status,
        scheduled_date, scheduled_time, tags, session_id, pomodoro_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        input.objectiveId,
        input.title,
        input.description,
        input.estimatedTime,
        input.priority,
        input.status,
        input.scheduledDate,
        input.scheduledTime,
        input.tags,
        input.sessionId,
        input.pomodoroCount,
      ]
    )
    
    const row = result.rows[0]
    return {
      id: row.id,
      objectiveId: row.objective_id,
      title: row.title,
      description: row.description,
      estimatedTime: row.estimated_time,
      priority: row.priority,
      status: row.status,
      scheduledDate: row.scheduled_date,
      scheduledTime: row.scheduled_time,
      tags: row.tags,
      checklist: [], // Loaded separately if needed
      sessionId: row.session_id,
      pomodoroCount: row.pomodoro_count,
      createdAt: row.created_at,
    }
  } finally {
    client.release()
  }
}

/**
 * Get a task by ID, including its checklist items.
 * Returns null if not found.
 */
export async function getTaskById(id: string): Promise<Task | null> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      "SELECT * FROM tasks WHERE id = $1",
      [id]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    const row = result.rows[0]
    
    // Get checklist items
    const checklistResult = await client.query(
      "SELECT * FROM checklist_items WHERE task_id = $1 ORDER BY order_index",
      [id]
    )
    
    const checklist: ChecklistItem[] = checklistResult.rows.map((item) => ({
      id: item.id,
      text: item.text,
      done: item.done,
    }))
    
    return {
      id: row.id,
      objectiveId: row.objective_id,
      title: row.title,
      description: row.description,
      estimatedTime: row.estimated_time,
      priority: row.priority,
      status: row.status,
      scheduledDate: row.scheduled_date,
      scheduledTime: row.scheduled_time,
      tags: row.tags,
      checklist,
      sessionId: row.session_id,
      pomodoroCount: row.pomodoro_count,
      createdAt: row.created_at,
    }
  } finally {
    client.release()
  }
}

/**
 * Get all tasks with pagination support.
 * @param options - Pagination and filtering options
 */
export async function getAllTasks(options?: {
  limit?: number;
  offset?: number;
}): Promise<Task[]> {
  const limit = options?.limit || 100;
  const offset = options?.offset || 0;
  
  const client = await pool.connect()
  try {
    // Single query with LEFT JOIN to get tasks and checklists
    const result = await client.query(
      `SELECT 
        t.*,
        json_agg(
          json_build_object(
            'id', ci.id, 
            'text', ci.text, 
            'done', ci.done
          ) ORDER BY ci.order_index
        ) FILTER (WHERE ci.id IS NOT NULL) as checklist
      FROM tasks t
      LEFT JOIN checklist_items ci ON t.id = ci.task_id
      GROUP BY t.id
      ORDER BY t.scheduled_date DESC, t.scheduled_time DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    )
    
    return result.rows.map((row) => ({
      id: row.id,
      objectiveId: row.objective_id,
      title: row.title,
      description: row.description,
      estimatedTime: row.estimated_time,
      priority: row.priority,
      status: row.status,
      scheduledDate: row.scheduled_date,
      scheduledTime: row.scheduled_time,
      tags: row.tags,
      checklist: row.checklist || [],
      sessionId: row.session_id,
      pomodoroCount: row.pomodoro_count,
      createdAt: row.created_at,
    }))
  } finally {
    client.release()
  }
}

/**
 * Get tasks for a specific date.
 */
export async function getTasksByDate(date: string): Promise<Task[]> {
  const client = await pool.connect()
  try {
    // Single query with LEFT JOIN to avoid N+1
    const result = await client.query(
      `SELECT 
        t.*,
        json_agg(
          json_build_object(
            'id', ci.id, 
            'text', ci.text, 
            'done', ci.done
          ) ORDER BY ci.order_index
        ) FILTER (WHERE ci.id IS NOT NULL) as checklist
      FROM tasks t
      LEFT JOIN checklist_items ci ON t.id = ci.task_id
      WHERE t.scheduled_date = $1
      GROUP BY t.id
      ORDER BY t.scheduled_time`,
      [date]
    )
    
    return result.rows.map((row) => ({
      id: row.id,
      objectiveId: row.objective_id,
      title: row.title,
      description: row.description,
      estimatedTime: row.estimated_time,
      priority: row.priority,
      status: row.status,
      scheduledDate: row.scheduled_date,
      scheduledTime: row.scheduled_time,
      tags: row.tags,
      checklist: row.checklist || [],
      sessionId: row.session_id,
      pomodoroCount: row.pomodoro_count,
      createdAt: row.created_at,
    }))
  } finally {
    client.release()
  }
}

/**
 * Get tasks for a specific objective.
 */
export async function getTasksByObjective(objectiveId: string): Promise<Task[]> {
  const client = await pool.connect()
  try {
    // Single query with LEFT JOIN to avoid N+1
    const result = await client.query(
      `SELECT 
        t.*,
        json_agg(
          json_build_object(
            'id', ci.id, 
            'text', ci.text, 
            'done', ci.done
          ) ORDER BY ci.order_index
        ) FILTER (WHERE ci.id IS NOT NULL) as checklist
      FROM tasks t
      LEFT JOIN checklist_items ci ON t.id = ci.task_id
      WHERE t.objective_id = $1
      GROUP BY t.id
      ORDER BY t.scheduled_date, t.scheduled_time`,
      [objectiveId]
    )
    
    return result.rows.map((row) => ({
      id: row.id,
      objectiveId: row.objective_id,
      title: row.title,
      description: row.description,
      estimatedTime: row.estimated_time,
      priority: row.priority,
      status: row.status,
      scheduledDate: row.scheduled_date,
      scheduledTime: row.scheduled_time,
      tags: row.tags,
      checklist: row.checklist || [],
      sessionId: row.session_id,
      pomodoroCount: row.pomodoro_count,
      createdAt: row.created_at,
    }))
  } finally {
    client.release()
  }
}

/**
 * Update a task by ID.
 * Returns the updated task.
 */
export async function updateTask(
  id: string,
  updates: Partial<Omit<Task, "id" | "checklist" | "createdAt">>
): Promise<Task> {
  const client = await pool.connect()
  try {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (updates.objectiveId !== undefined) {
      fields.push(`objective_id = $${paramIndex++}`)
      values.push(updates.objectiveId)
    }
    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex++}`)
      values.push(updates.title)
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`)
      values.push(updates.description)
    }
    if (updates.estimatedTime !== undefined) {
      fields.push(`estimated_time = $${paramIndex++}`)
      values.push(updates.estimatedTime)
    }
    if (updates.priority !== undefined) {
      fields.push(`priority = $${paramIndex++}`)
      values.push(updates.priority)
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`)
      values.push(updates.status)
    }
    if (updates.scheduledDate !== undefined) {
      fields.push(`scheduled_date = $${paramIndex++}`)
      values.push(updates.scheduledDate)
    }
    if (updates.scheduledTime !== undefined) {
      fields.push(`scheduled_time = $${paramIndex++}`)
      values.push(updates.scheduledTime)
    }
    if (updates.tags !== undefined) {
      fields.push(`tags = $${paramIndex++}`)
      values.push(updates.tags)
    }
    if (updates.sessionId !== undefined) {
      fields.push(`session_id = $${paramIndex++}`)
      values.push(updates.sessionId)
    }
    if (updates.pomodoroCount !== undefined) {
      fields.push(`pomodoro_count = $${paramIndex++}`)
      values.push(updates.pomodoroCount)
    }

    if (fields.length === 0) {
      // No updates provided, just return current state
      const current = await getTaskById(id)
      if (!current) {
        throw new Error(`Task ${id} not found`)
      }
      return current
    }

    values.push(id)
    const result = await client.query(
      `UPDATE tasks SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      throw new Error(`Task ${id} not found`)
    }

    const row = result.rows[0]
    
    // Get checklist items
    const checklistResult = await client.query(
      "SELECT * FROM checklist_items WHERE task_id = $1 ORDER BY order_index",
      [id]
    )
    
    const checklist: ChecklistItem[] = checklistResult.rows.map((item) => ({
      id: item.id,
      text: item.text,
      done: item.done,
    }))

    return {
      id: row.id,
      objectiveId: row.objective_id,
      title: row.title,
      description: row.description,
      estimatedTime: row.estimated_time,
      priority: row.priority,
      status: row.status,
      scheduledDate: row.scheduled_date,
      scheduledTime: row.scheduled_time,
      tags: row.tags,
      checklist,
      sessionId: row.session_id,
      pomodoroCount: row.pomodoro_count,
      createdAt: row.created_at,
    }
  } finally {
    client.release()
  }
}

/**
 * Add a checklist item to a task.
 */
export async function addChecklistItem(taskId: string, text: string): Promise<ChecklistItem> {
  const client = await pool.connect()
  try {
    // Get current max order_index
    const maxResult = await client.query(
      "SELECT COALESCE(MAX(order_index), -1) as max_order FROM checklist_items WHERE task_id = $1",
      [taskId]
    )
    const orderIndex = maxResult.rows[0].max_order + 1
    
    const result = await client.query(
      `INSERT INTO checklist_items (task_id, text, done, order_index)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [taskId, text, false, orderIndex]
    )
    
    const row = result.rows[0]
    return {
      id: row.id,
      text: row.text,
      done: row.done,
    }
  } finally {
    client.release()
  }
}

/**
 * Update a checklist item (toggle done status or change text).
 */
export async function updateChecklistItem(
  itemId: string,
  updates: { text?: string; done?: boolean }
): Promise<ChecklistItem> {
  const client = await pool.connect()
  try {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (updates.text !== undefined) {
      fields.push(`text = $${paramIndex++}`)
      values.push(updates.text)
    }
    if (updates.done !== undefined) {
      fields.push(`done = $${paramIndex++}`)
      values.push(updates.done)
    }

    if (fields.length === 0) {
      throw new Error("No updates provided")
    }

    values.push(itemId)
    const result = await client.query(
      `UPDATE checklist_items SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      throw new Error(`Checklist item ${itemId} not found`)
    }

    const row = result.rows[0]
    return {
      id: row.id,
      text: row.text,
      done: row.done,
    }
  } finally {
    client.release()
  }
}

/**
 * Delete a checklist item.
 */
export async function deleteChecklistItem(itemId: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("DELETE FROM checklist_items WHERE id = $1", [itemId])
  } finally {
    client.release()
  }
}

/**
 * Delete a task by ID.
 * CASCADE DELETE will also remove linked checklist items.
 */
export async function deleteTask(id: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("DELETE FROM tasks WHERE id = $1", [id])
  } finally {
    client.release()
  }
}

/**
 * Delete all tasks (used for testing/data reset).
 * CASCADE DELETE will also remove all linked checklist items.
 */
export async function deleteAllTasks(): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("DELETE FROM tasks")
  } finally {
    client.release()
  }
}

/**
 * Get task count for analytics.
 */
export async function getTaskCount(): Promise<number> {
  const client = await pool.connect()
  try {
    const result = await client.query("SELECT COUNT(*) as count FROM tasks")
    return parseInt(result.rows[0].count, 10)
  } finally {
    notifyDatabaseChange()
    client.release()
  }
}
