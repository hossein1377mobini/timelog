/**
 * Database persistence layer for users (authentication).
 *
 * Provides async functions to read/write users from the PostgreSQL `users` table.
 */

import { withDb } from "@/lib/db-utils"

export interface User {
  id: string
  username: string
  email: string
  passwordHash: string
  createdAt: string
}

export interface SafeUser {
  id: string
  username: string
  email: string
  createdAt: string
}

function toSafeUser(row: Record<string, unknown>): SafeUser {
  return {
    id: row.id as string,
    username: row.username as string,
    email: row.email as string,
    createdAt: row.created_at as string,
  }
}

/**
 * Create a new user. Returns the safe (no password_hash) user object.
 */
export async function createUser(input: {
  username: string
  email: string
  passwordHash: string
}): Promise<SafeUser> {
  return withDb(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [input.username, input.email, input.passwordHash],
    )
    return toSafeUser(rows[0])
  })
}

/**
 * Find a user by username (used for login).
 * Returns the full row including password_hash.
 */
export async function findByUsername(username: string): Promise<User | null> {
  return withDb(async (client) => {
    const { rows } = await client.query(
      "SELECT * FROM users WHERE username = $1",
      [username],
    )
    if (rows.length === 0) return null
    const r = rows[0]
    return {
      id: r.id,
      username: r.username,
      email: r.email,
      passwordHash: r.password_hash,
      createdAt: r.created_at,
    }
  })
}

/**
 * Find a user by ID (used for session validation).
 * Returns the safe user object (no password_hash).
 */
export async function findById(id: string): Promise<SafeUser | null> {
  return withDb(async (client) => {
    const { rows } = await client.query(
      "SELECT id, username, email, created_at FROM users WHERE id = $1",
      [id],
    )
    if (rows.length === 0) return null
    return toSafeUser(rows[0])
  })
}

/**
 * Check if a username is already taken.
 */
export async function usernameExists(username: string): Promise<boolean> {
  return withDb(async (client) => {
    const { rows } = await client.query(
      "SELECT 1 FROM users WHERE username = $1 LIMIT 1",
      [username],
    )
    return rows.length > 0
  })
}

/**
 * Check if an email is already taken.
 */
export async function emailExists(email: string): Promise<boolean> {
  return withDb(async (client) => {
    const { rows } = await client.query(
      "SELECT 1 FROM users WHERE email = $1 LIMIT 1",
      [email],
    )
    return rows.length > 0
  })
}
