/**
 * Database persistence layer for application settings.
 * 
 * This module provides async functions to read/write settings
 * from the PostgreSQL `settings` table.
 */

import pool from "@/lib/db"
import { notifyDatabaseChange } from "@/lib/db-events"

/**
 * Get a setting value by key.
 * Returns null if the setting doesn't exist.
 */
export async function getSetting(key: string): Promise<string | null> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      "SELECT value FROM settings WHERE key = $1",
      [key]
    )
    return result.rows.length > 0 ? result.rows[0].value : null
  } finally {
    client.release()
  }
}

/**
 * Set a setting value by key.
 * Creates the setting if it doesn't exist, updates it if it does (upsert).
 */
export async function setSetting(key: string, value: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query(
      `INSERT INTO settings (key, value, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (key) 
       DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
      [key, value]
    )
  } finally {
    client.release()
  }
}

/**
 * Delete a setting by key.
 */
export async function deleteSetting(key: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("DELETE FROM settings WHERE key = $1", [key])
  } finally {
    client.release()
  }
}

/**
 * Get all settings as a key-value map.
 */
export async function getAllSettings(): Promise<Record<string, string>> {
  const client = await pool.connect()
  try {
    const result = await client.query("SELECT key, value FROM settings")
    const settings: Record<string, string> = {}
    for (const row of result.rows) {
      settings[row.key] = row.value
    }
    return settings
  } finally {
    notifyDatabaseChange()
    client.release()
  }
}
