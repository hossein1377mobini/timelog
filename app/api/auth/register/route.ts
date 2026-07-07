/**
 * POST /api/auth/register
 *
 * Body: { username, email, password }
 * Creates a user, sets session cookie, returns safe user.
 */
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createUser, usernameExists, emailExists } from "@/lib/db-users"
import { createSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password } = body

    // ── Validation ────────────────────────────────────────────────────
    if (!username || typeof username !== "string" || username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 },
      )
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      )
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      )
    }

    // ── Uniqueness checks ─────────────────────────────────────────────
    if (await usernameExists(username)) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 },
      )
    }
    if (await emailExists(email)) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      )
    }

    // ── Create user ───────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await createUser({ username, email, passwordHash })

    // ── Set session cookie ────────────────────────────────────────────
    await createSession(user.id, user.username)

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("POST /api/auth/register error:", error)
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 },
    )
  }
}
