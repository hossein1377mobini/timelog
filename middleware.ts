/**
 * Next.js Middleware — protects all /api/* routes except /api/auth/*.
 *
 * Reads the `compass_session` cookie, verifies the JWT.
 * Returns 401 for unauthenticated requests.
 */

import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const SESSION_COOKIE_NAME = "compass_session"
const JWT_SECRET = new TextEncoder().encode(
  getJwtSecret(),
)

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (process.env.NODE_ENV === "production" && !secret) {
    throw new Error("JWT_SECRET environment variable is required in production")
  }
  return secret || "compass-dev-secret-min-32-chars!!"
}

// Routes that don't need authentication
const PUBLIC_PATHS = [
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/logout",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /api/* routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Allow public auth routes
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Check for session cookie
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    )
  }

  // Verify JWT
  try {
    await jwtVerify(token, JWT_SECRET)
    return NextResponse.next()
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired session" },
      { status: 401 },
    )
  }
}

export const config = {
  matcher: ["/api/:path*"],
}
