/**
 * POST /api/auth/login
 *
 * Body: { username, password }
 * Verifies credentials, sets session cookie, returns safe user.
 */
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { findByUsername } from "@/lib/db-users"
import { createSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 },
      )
    }

    const user = await findByUsername(username)
    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      )
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      )
    }

    await createSession(user.id, user.username)

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error("POST /api/auth/login error:", error)
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 },
    )
  }
}
