# Plan 002: Add integration tests for auth & CRUD paths

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat ba6dd1e..HEAD -- lib/ app/ vitest.config.ts package.json`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `ba6dd1e`, 2026-07-11

## Why this matters

Auth lifecycle, every API route handler, and all DB CRUD operations across 8 entity types have zero automated test coverage. A regression in access control, data scoping, or error handling will pass CI silently. These tests serve as characterization tests that make future refactoring (like removing the localStorage layer in plan 003) safe.

## Current state

- `vitest.config.ts`:
  ```ts
  import { defineConfig } from "vitest/config"
  import path from "path"
  export default defineConfig({
    test: {
      environment: "node",
      include: ["**/*.test.ts", "**/*.test.tsx"],
      globals: true,
    },
    resolve: {
      alias: { "@": path.resolve(__dirname, ".") },
    },
  })
  ```
- Existing test files: `lib/__tests__/analytics.test.ts`, `auth.test.ts`, `constants.test.ts`, `db-utils.test.ts`, `types.test.ts`, `utils.test.ts` — all utility-only, 53 tests total.
- DB layer: raw `pg` pool with `withDb`/`withTransaction` wrappers in `lib/db-utils.ts`.
- Auth: JWT via `jose`, cookie-based sessions.
- API routes in `app/api/*/route.ts` — each follows the pattern: getSession → query params → db function → JSON response.
- `package.json` has `vitest@^4.1.10` and `jsdom@^29.1.1` in devDeps. No test DB container setup exists.

## Commands you will need

| Purpose   | Command                          | Expected on success |
|-----------|----------------------------------|---------------------|
| Tests     | `npm test`                       | all pass            |
| Typecheck | `npx tsc --noEmit`               | exit 0, no errors   |

## Scope

**In scope**:
- `lib/__tests__/auth.test.ts` (expand existing — add createSession/destroySession/getSession tests)
- `lib/__tests__/db-utils.test.ts` (expand existing — add withDb/withTransaction tests with mocked pool)
- `lib/__tests__/api-routes.test.ts` (new file — test API route handlers)
- `vitest.config.ts` (may need mock configuration)

**Out of scope**:
- Actual PostgreSQL integration tests (requires test DB setup — separate effort)
- Component tests
- E2E tests
- Modifying any source code

## Steps

### Step 1: Expand `lib/__tests__/auth.test.ts` with session lifecycle tests

Add tests for `createSession`, `destroySession`, and `getSession` using mocked `jose` and `next/headers`. The existing file tests `signToken`/`verifyToken` — follow the same mock pattern.

Create/update `lib/__tests__/auth.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock jose
vi.mock("jose", () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mock-jwt-token"),
  })),
  jwtVerify: vi.fn(),
}))

// Mock next/headers cookies()
const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
}
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookies),
}))

describe("Auth — createSession", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = "test-secret-for-unit-tests"
  })

  it("sets a cookie with httpOnly, secure, sameSite=lax", async () => {
    const { createSession } = await import("@/lib/auth")
    await createSession("user-1", "alice")
    expect(mockCookies.set).toHaveBeenCalledWith(
      "compass_session",
      "mock-jwt-token",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      })
    )
  })
})

describe("Auth — getSession", () => {
  it("returns null when no cookie exists", async () => {
    mockCookies.get.mockReturnValue(undefined)
    const { getSession } = await import("@/lib/auth")
    const result = await getSession()
    expect(result).toBeNull()
  })

  it("returns payload when JWT verifies", async () => {
    mockCookies.get.mockReturnValue({ value: "valid-token" })
    const { jwtVerify } = await import("jose")
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: { sub: "user-1", username: "alice" },
    } as any)
    const { getSession } = await import("@/lib/auth")
    const result = await getSession()
    expect(result).toEqual({ sub: "user-1", username: "alice" })
  })
})

describe("Auth — destroySession", () => {
  it("clears the cookie with maxAge 0", async () => {
    const { destroySession } = await import("@/lib/auth")
    await destroySession()
    expect(mockCookies.set).toHaveBeenCalledWith(
      "compass_session",
      "",
      expect.objectContaining({ maxAge: 0 })
    )
  })
})
```

**Verify**: `npm test -- lib/__tests__/auth.test.ts` → all pass

### Step 2: Expand `lib/__tests__/db-utils.test.ts` with withDb/withTransaction tests

Add tests that mock the `pg` pool to verify `withDb` and `withTransaction` behavior.

```ts
// Add to existing file:
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock pg Pool
const mockRelease = vi.fn()
const mockQuery = vi.fn()
const mockClient = { query: mockQuery, release: mockRelease }

vi.mock("pg", () => ({
  Pool: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(mockClient),
    end: vi.fn(),
  })),
}))

describe("withDb", () => {
  beforeEach(() => vi.clearAllMocks())

  it("calls the callback with a client and releases it", async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 1 }] })
    const { withDb } = await import("@/lib/db-utils")
    const result = await withDb(async (client) => {
      const res = await client.query("SELECT 1 as id")
      return res.rows[0]
    })
    expect(result).toEqual({ id: 1 })
    expect(mockRelease).toHaveBeenCalled()
  })
})

describe("withTransaction", () => {
  it("commits on success", async () => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes("BEGIN")) return Promise.resolve({})
      if (sql.includes("COMMIT")) return Promise.resolve({})
      return Promise.resolve({ rows: [{ id: 1 }] })
    })
    const { withTransaction } = await import("@/lib/db-utils")
    await withTransaction(async (client) => {
      await client.query("SELECT 1")
    })
    expect(mockRelease).toHaveBeenCalled()
  })

  it("rolls back on error", async () => {
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes("BEGIN")) return Promise.resolve({})
      if (sql.includes("ROLLBACK")) return Promise.resolve({})
      if (sql.includes("COMMIT")) return Promise.reject(new Error("should not reach"))
      throw new Error("simulated db error")
    })
    const { withTransaction } = await import("@/lib/db-utils")
    await expect(
      withTransaction(async (client) => {
        await client.query("FAIL")
      })
    ).rejects.toThrow("simulated db error")
    expect(mockRelease).toHaveBeenCalled()
  })
})
```

**Verify**: `npm test -- lib/__tests__/db-utils.test.ts` → all pass

### Step 3: Create `lib/__tests__/api-routes.test.ts` with route handler tests

Test the auth routes (register, login, logout, me) and a CRUD route (goals) using mocked auth and db modules.

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock auth
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
  createSession: vi.fn(),
  destroySession: vi.fn(),
  verifyToken: vi.fn(),
  signToken: vi.fn(),
}))

// Mock db modules
vi.mock("@/lib/db-users", () => ({
  findByUsername: vi.fn(),
  createUser: vi.fn(),
  usernameExists: vi.fn(),
  emailExists: vi.fn(),
  findById: vi.fn(),
}))

vi.mock("@/lib/db-goals", () => ({
  getAllGoals: vi.fn(),
  createGoal: vi.fn(),
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
}))

function makeRequest(url: string, method = "GET", body?: unknown) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }) as any
}

describe("POST /api/auth/register", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 400 when username is missing", async () => {
    const { POST } = await import("@/app/api/auth/register/route")
    const req = makeRequest("http://localhost/api/auth/register", "POST", {
      email: "a@b.com",
      password: "12345678",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 409 when username already exists", async () => {
    const { usernameExists } = await import("@/lib/db-users")
    vi.mocked(usernameExists).mockResolvedValue(true)
    const { POST } = await import("@/app/api/auth/register/route")
    const req = makeRequest("http://localhost/api/auth/register", "POST", {
      username: "alice",
      email: "a@b.com",
      password: "12345678",
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
  })
})

describe("GET /api/goals", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when session is missing", async () => {
    const { getSession } = await import("@/lib/auth")
    vi.mocked(getSession).mockResolvedValue(null)
    const { GET } = await import("@/app/api/goals/route")
    const req = makeRequest("http://localhost/api/goals")
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it("returns goals when authenticated", async () => {
    const { getSession } = await import("@/lib/auth")
    const { getAllGoals } = await import("@/lib/db-goals")
    vi.mocked(getSession).mockResolvedValue({ sub: "user-1", username: "alice" } as any)
    vi.mocked(getAllGoals).mockResolvedValue([{ id: "g1", name: "Test Goal" }] as any)
    const { GET } = await import("@/app/api/goals/route")
    const req = makeRequest("http://localhost/api/goals")
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
  })
})
```

**Verify**: `npm test -- lib/__tests__/api-routes.test.ts` → all pass

### Step 4: Run full test suite and verify coverage

```bash
npm test
```

Expected: all existing 53 tests + new tests pass (aim for 65+ tests total).

**Verify**: `npm test` → all pass, exit 0

### Step 5: Verify typecheck still passes

```bash
npx tsc --noEmit
```

**Verify**: exit 0, no errors

## Test plan

- **Auth tests** (plan step 1): createSession cookie shape, getSession null when no cookie, getSession returns payload on valid JWT, destroySession clears cookie
- **DB utils tests** (plan step 2): withDb calls callback and releases, withTransaction commits on success, withTransaction rolls back on error
- **API route tests** (plan step 3): register returns 400 on missing fields, register returns 409 on duplicate, goals returns 401 when unauthenticated, goals returns data when authenticated
- Existing tests (`analytics.test.ts`, `constants.test.ts`, `types.test.ts`, `utils.test.ts`) — unchanged, must still pass

## Done criteria

- [ ] `npm test` exits 0 with 65+ tests passing
- [ ] `npx tsc --noEmit` exits 0
- [ ] New test files exist: `lib/__tests__/auth.test.ts` (expanded), `lib/__tests__/db-utils.test.ts` (expanded), `lib/__tests__/api-routes.test.ts` (new)
- [ ] Tests cover: auth lifecycle, db transaction behavior, API route error paths (401, 400, 409)
- [ ] `plans/README.md` status row for 002 updated to DONE

## STOP conditions

- If mocking `pg` pool is too complex with the current `withDb` architecture (the pool is created at module level — if it can't be intercepted, report and suggest a refactoring prerequisite).
- If a test file requires more than 3 imports to mock and the mock setup becomes unwieldy.
- If any test is flaky (timing-dependent, order-dependent) after 2 attempts to fix.

## Maintenance notes

- These are characterization tests — they document current behavior, not ideal behavior. If a test reveals a bug (e.g., missing validation), note it but don't fix it in this plan.
- The `vi.mock()` calls use `vi.resetModules()` pattern to ensure fresh imports per test. If adding tests for new modules, follow this pattern.
- Future: consider adding a test PostgreSQL container (docker-compose with test DB) for true integration tests. These mocks are a pragmatic first step.
