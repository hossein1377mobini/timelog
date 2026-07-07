/**
 * GET /api/auth/me
 *
 * Returns the currently logged-in user's safe profile,
 * or 401 if not authenticated.
 */
import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      )
    }
    return NextResponse.json({ user })
  } catch (error) {
    console.error("GET /api/auth/me error:", error)
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 },
    )
  }
}
