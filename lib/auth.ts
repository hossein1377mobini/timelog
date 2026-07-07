/**
 * Authentication utilities — JWT-based session management.
 *
 * Uses `jose` for JWT signing/verification (Edge-compatible,
 * works in middleware).
 *
 * SESSION_COOKIE_NAME: the HTTP-only cookie holding the JWT.
 * JWT payload shape: { sub: user_id, username: string, iat, exp }
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose"
import { cookies } from "next/headers"
import { findById } from "@/lib/db-users"

const SESSION_COOKIE_NAME = "compass_session"
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "compass-dev-secret-min-32-chars!!",
)

// 7 days in seconds
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7

export interface SessionPayload extends JWTPayload {
  sub: string // user_id
  username: string
}

// ── Server Action helpers (can import cookies()) ──────────────────────

/** Create a signed JWT and set it as an HTTP-only cookie. */
export async function createSession(userId: string, username: string) {
  const token = await new SignJWT({ sub: userId, username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(JWT_SECRET)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  })
}

/** Destroy the session cookie. */
export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}

/** Get session payload from the current request cookie. */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (!payload.sub || !payload.username) return null

    return {
      sub: payload.sub as string,
      username: payload.username as string,
    } as SessionPayload
  } catch {
    return null
  }
}

/** Get the logged-in user's safe profile from session. */
export async function getSessionUser() {
  const session = await getSession()
  if (!session) return null
  return findById(session.sub)
}

// ── Middleware helpers (don't depend on next/headers cookies) ─────────

/** Verify a raw token string (for middleware usage). */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (!payload.sub || !payload.username) return null
    return { sub: payload.sub as string, username: payload.username as string } as SessionPayload
  } catch {
    return null
  }
}

/** Create a JWT string without setting cookies (for middleware token creation). */
export async function signToken(userId: string, username: string): Promise<string> {
  return await new SignJWT({ sub: userId, username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(JWT_SECRET)
}
