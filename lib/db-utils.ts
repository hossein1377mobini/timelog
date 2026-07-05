/**
 * Database utility helpers to reduce boilerplate in persistence modules.
 *
 * Wraps the common `pool.connect() … client.release()` pattern so each
 * module can focus on its query logic rather than connection management.
 */

import pool from "@/lib/db"
import type { PoolClient, QueryResult } from "pg"

/**
 * Execute a callback inside a single database connection, releasing it
 * in a `finally` block so connections are never leaked.
 *
 * @example
 * ```ts
 * const rows = await withDb(async (client) => {
 *   const result = await client.query("SELECT * FROM tasks")
 *   return result.rows
 * })
 * ```
 */
export async function withDb<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}

/**
 * Execute a transaction: begin, run `fn`, and commit or rollback on error.
 *
 * @example
 * ```ts
 * await withTransaction(async (client) => {
 *   await client.query("DELETE FROM tasks WHERE id = $1", [id])
 * })
 * ```
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const result = await fn(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

/**
 * Map a single database row to a typed object, returning null when no row
 * is found.  Callers pass a mapper that transforms the raw row.
 */
export function mapRow<T>(
  rows: Record<string, unknown>[],
  mapper: (row: Record<string, unknown>) => T,
): T | null {
  if (rows.length === 0) return null
  return mapper(rows[0]!)
}

/**
 * Map *all* returned rows.
 */
export function mapRows<T>(
  rows: Record<string, unknown>[],
  mapper: (row: Record<string, unknown>) => T,
): T[] {
  return rows.map(mapper)
}
