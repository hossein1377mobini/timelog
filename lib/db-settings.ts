/**
 * Database persistence layer for application settings.
 *
 * Provides async functions to read/write settings from the
 * PostgreSQL `settings` table using the {@link withDb} helper.
 */

import { withDb } from "@/lib/db-utils"

/**
 * Get a setting value by key.  Returns null if the setting doesn't exist.
 */
export async function getSetting(userId: string, key: string): Promise<string | null> {
  return withDb(async (client) => {
    const result = await client.query(
      "SELECT value FROM settings WHERE user_id = $1 AND key = $2",
      [userId, key],
    )
    return result.rows.length > 0 ? result.rows[0].value : null
  })
}

/**
 * Create or update a setting (upsert).
 */
export async function setSetting(userId: string, key: string, value: string): Promise<void> {
  return withDb(async (client) => {
    await client.query(
      `INSERT INTO settings (key, value, user_id, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, key)
       DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
      [key, value, userId],
    )
  })
}

/**
 * Delete a setting by key.
 */
export async function deleteSetting(userId: string, key: string): Promise<void> {
  return withDb(async (client) => {
    await client.query("DELETE FROM settings WHERE user_id = $1 AND key = $2", [userId, key])
  })
}

/**
 * Get all settings as a key-value map.
 */
export async function getAllSettings(userId: string): Promise<Record<string, string>> {
  return withDb(async (client) => {
    const result = await client.query("SELECT key, value FROM settings WHERE user_id = $1", [userId])
    const settings: Record<string, string> = {}
    for (const row of result.rows) {
      settings[row.key] = row.value
    }
    return settings
  })
}
