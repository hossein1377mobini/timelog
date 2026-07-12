/**
 * Database persistence layer for daily tasks.
 *
 * Provides async functions to read/write daily tasks from the tasks table
 * using the {@link withDb} helper to eliminate connection boilerplate.
 */

import type { Task, ChecklistItem } from "@/lib/types"
import { withDb } from "@/lib/db-utils"



function rowToTask(row: Record<string, unknown>, checklist: ChecklistItem[] = []): Task {
  return {
    id: row.id as string,
    objectiveId: row.objective_id as string | null,
    title: row.title as string,
    description: row.description as string,
    estimatedTime: row.estimated_time as number,
    priority: row.priority as Task["priority"],
    status: row.status as Task["status"],
    scheduledDate: row.scheduled_date as string,
    scheduledTime: row.scheduled_time as string,
    tags: row.tags as string[],
    checklist,
    sessionId: row.session_id as string | null,
    pomodoroCount: row.pomodoro_count as number,
    createdAt: row.created_at as string,
  }
}

async function loadChecklist(client: import("pg").PoolClient, taskId: string): Promise<ChecklistItem[]> {
  const { rows } = await client.query(
    "SELECT * FROM checklist_items WHERE task_id = $1 ORDER BY order_index",
    [taskId],
  )
  return rows.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    text: r.text as string,
    done: r.done as boolean,
  }))
}

const TASK_COLUMNS = `
  user_id, objective_id, title, description, estimated_time, priority, status,
  scheduled_date, scheduled_time, tags, session_id, pomodoro_count
`

const TASK_SELECT = `
  t.*,
  json_agg(
    json_build_object('id', ci.id, 'text', ci.text, 'done', ci.done)
    ORDER BY ci.order_index
  ) FILTER (WHERE ci.id IS NOT NULL) AS checklist
`

// ── CRUD ─────────────────────────────────────────────────────────────────────

/** Create a new task and return it with its generated ID. */
export async function createTask(
  userId: string,
  input: Omit<Task, "id" | "checklist" | "createdAt">,
): Promise<Task> {
  return withDb(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO tasks (${TASK_COLUMNS}) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        userId,
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
      ],
    )
    return rowToTask(rows[0])
  })
}

/** Get a task by ID (includes checklist items). Returns null if not found. */
export async function getTaskById(userId: string, id: string): Promise<Task | null> {
  return withDb(async (client) => {
    const { rows } = await client.query("SELECT * FROM tasks WHERE id = $1 AND user_id = $2", [id, userId])
    if (rows.length === 0) return null
    const checklist = await loadChecklist(client, id)
    return rowToTask(rows[0], checklist)
  })
}

/** Get all tasks with optional pagination. */
export async function getAllTasks(userId: string, options?: {
  limit?: number
  offset?: number
}): Promise<Task[]> {
  const limit = options?.limit ?? 100
  const offset = options?.offset ?? 0
  return withDb(async (client) => {
    const { rows } = await client.query(
      `SELECT ${TASK_SELECT}
       FROM tasks t
       LEFT JOIN checklist_items ci ON t.id = ci.task_id
       WHERE t.user_id = $1
       GROUP BY t.id
       ORDER BY t.scheduled_date DESC, t.scheduled_time DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    )
    return rows.map((r: Record<string, unknown>) => rowToTask(r, (r.checklist ?? []) as ChecklistItem[]))
  })
}

/** Get tasks scheduled for a specific date. */
export async function getTasksByDate(userId: string, date: string): Promise<Task[]> {
  return withDb(async (client) => {
    const { rows } = await client.query(
      `SELECT ${TASK_SELECT}
       FROM tasks t
       LEFT JOIN checklist_items ci ON t.id = ci.task_id
       WHERE t.user_id = $1 AND t.scheduled_date = $2
       GROUP BY t.id
       ORDER BY t.scheduled_time`,
      [userId, date],
    )
    return rows.map((r: Record<string, unknown>) => rowToTask(r, (r.checklist ?? []) as ChecklistItem[]))
  })
}

/** Get tasks belonging to a specific weekly objective. */
export async function getTasksByObjective(userId: string, objectiveId: string): Promise<Task[]> {
  return withDb(async (client) => {
    const { rows } = await client.query(
      `SELECT ${TASK_SELECT}
       FROM tasks t
       LEFT JOIN checklist_items ci ON t.id = ci.task_id
       WHERE t.user_id = $1 AND t.objective_id = $2
       GROUP BY t.id
       ORDER BY t.scheduled_date, t.scheduled_time`,
      [userId, objectiveId],
    )
    return rows.map((r: Record<string, unknown>) => rowToTask(r, (r.checklist ?? []) as ChecklistItem[]))
  })
}

/** Update a task by ID. Returns the updated task. */
export async function updateTask(
  userId: string,
  id: string,
  updates: Partial<Omit<Task, "id" | "checklist" | "createdAt">>,
): Promise<Task> {
  return withDb(async (client) => {
    const fieldMap: Record<string, keyof typeof updates> = {
      objective_id: "objectiveId",
      title: "title",
      description: "description",
      estimated_time: "estimatedTime",
      priority: "priority",
      status: "status",
      scheduled_date: "scheduledDate",
      scheduled_time: "scheduledTime",
      tags: "tags",
      session_id: "sessionId",
      pomodoro_count: "pomodoroCount",
    }

    const setClauses: string[] = []
    const values: unknown[] = []
    let idx = 1

    for (const [col, key] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        setClauses.push(`${col} = $${idx++}`)
        values.push(updates[key])
      }
    }

    if (setClauses.length === 0) {
      const existing = await getTaskById(userId, id)
      if (!existing) throw new Error(`Task ${id} not found`)
      return existing
    }

    values.push(id)
    values.push(userId)
    const { rows } = await client.query(
      `UPDATE tasks SET ${setClauses.join(", ")} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
      values,
    )
    if (rows.length === 0) throw new Error(`Task ${id} not found`)
    const checklist = await loadChecklist(client, id)
    return rowToTask(rows[0], checklist)
  })
}

// ── Checklist items ──────────────────────────────────────────────────────────

/** Add a checklist item to a task. */
export async function addChecklistItem(userId: string, taskId: string, text: string): Promise<ChecklistItem> {
  return withDb(async (client) => {
    const { rows: maxRow } = await client.query(
      "SELECT COALESCE(MAX(order_index), -1) AS max_order FROM checklist_items WHERE task_id = $1",
      [taskId],
    )
    const orderIndex = (maxRow[0]?.max_order ?? -1) + 1
    const { rows } = await client.query(
      `INSERT INTO checklist_items (task_id, text, done, order_index, user_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [taskId, text, false, orderIndex, userId],
    )
    return { id: rows[0].id as string, text: rows[0].text as string, done: rows[0].done as boolean }
  })
}

/** Update a checklist item (toggle done or change text). */
export async function updateChecklistItem(
  userId: string,
  itemId: string,
  updates: { text?: string; done?: boolean },
): Promise<ChecklistItem> {
  return withDb(async (client) => {
    const setClauses: string[] = []
    const values: unknown[] = []
    let idx = 1
    if (updates.text !== undefined) {
      setClauses.push(`text = $${idx++}`)
      values.push(updates.text)
    }
    if (updates.done !== undefined) {
      setClauses.push(`done = $${idx++}`)
      values.push(updates.done)
    }
    if (setClauses.length === 0) throw new Error("No updates provided")
    values.push(itemId)
    values.push(userId)
    const { rows } = await client.query(
      `UPDATE checklist_items SET ${setClauses.join(", ")} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
      values,
    )
    if (rows.length === 0) throw new Error(`Checklist item ${itemId} not found`)
    return { id: rows[0].id as string, text: rows[0].text as string, done: rows[0].done as boolean }
  })
}

/** Delete a checklist item. */
export async function deleteChecklistItem(userId: string, itemId: string): Promise<void> {
  return withDb(async (client) => {
    await client.query("DELETE FROM checklist_items WHERE id = $1 AND user_id = $2", [itemId, userId])
  })
}

// ── Delete / utility ─────────────────────────────────────────────────────────

/** Delete a task (CASCADE removes linked checklist items). */
export async function deleteTask(userId: string, id: string): Promise<void> {
  return withDb(async (client) => {
    await client.query("DELETE FROM tasks WHERE id = $1 AND user_id = $2", [id, userId])
  })
}

/** Delete all tasks (for testing / data reset). */
export async function deleteAllTasks(userId: string): Promise<void> {
  return withDb(async (client) => {
    await client.query("DELETE FROM tasks WHERE user_id = $1", [userId])
  })
}

/** Get task count. */
export async function getTaskCount(userId: string): Promise<number> {
  return withDb(async (client) => {
    const { rows } = await client.query("SELECT COUNT(*) AS count FROM tasks WHERE user_id = $1", [userId])
    return parseInt(rows[0].count as string, 10)
  })
}
