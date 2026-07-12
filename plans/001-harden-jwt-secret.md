# Plan 001: Harden JWT secret with production env guard

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat ba6dd1e..HEAD -- lib/auth.ts middleware.ts next.config.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `ba6dd1e`, 2026-07-11

## Why this matters

If `JWT_SECRET` is not set in production (no env validation exists), the JWT is signed with the known string `"compass-dev-secret-min-32-chars!!"` visible in source code. Any attacker can forge valid session tokens and impersonate any user. Additionally, the Content Security Policy is entirely commented out in `next.config.ts`, leaving no XSS mitigation layer.

## Current state

- `lib/auth.ts:16-18` — hardcoded fallback:
  ```ts
  const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "compass-dev-secret-min-32-chars!!",
  )
  ```
- `middleware.ts:12-14` — identical hardcoded fallback:
  ```ts
  const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "compass-dev-secret-min-32-chars!!",
  )
  ```
- `next.config.ts:6-34` — CSP headers entirely commented out.

## Commands you will need

| Purpose   | Command                          | Expected on success |
|-----------|----------------------------------|---------------------|
| Typecheck | `npx tsc --noEmit`               | exit 0, no errors   |
| Build     | `npm run build`                  | exit 0              |

## Scope

**In scope**:
- `lib/auth.ts`
- `middleware.ts`
- `next.config.ts`
- `lib/db.ts` (if it has a similar default password fallback for DB_PASSWORD)

**Out of scope**:
- Any other `lib/db-*.ts` files
- `app/` directory
- `components/` directory

## Steps

### Step 1: Remove hardcoded fallback from `lib/auth.ts`

Replace lines 16-18 in `lib/auth.ts`:
```ts
// BEFORE
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "compass-dev-secret-min-32-chars!!",
)

// AFTER
if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is required. " +
    "Set it in .env.local for development or in your production environment.",
  )
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
```

**Verify**: `npx tsc --noEmit 2>&1 | head -20` → exit 0 (no new type errors)

### Step 2: Remove hardcoded fallback from `middleware.ts`

Replace lines 12-14 in `middleware.ts`:
```ts
// BEFORE
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "compass-dev-secret-min-32-chars!!",
)

// AFTER
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required.")
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
```

**Verify**: `npx tsc --noEmit 2>&1 | head -20` → exit 0

### Step 3: Uncomment and harden CSP headers in `next.config.ts`

Replace the entire `next.config.ts` with:
```ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.52.65"],
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "Content-Security-Policy",
          value:
            process.env.NODE_ENV === "development"
              ? [
                  "default-src 'self'",
                  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
                  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                  "img-src 'self' data: https:",
                  "font-src 'self' https://fonts.gstatic.com",
                  "connect-src 'self' ws: wss: http: https:",
                ].join("; ")
              : [
                  "default-src 'self'",
                  "script-src 'self'",
                  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                  "img-src 'self' data: https:",
                  "font-src 'self' https://fonts.gstatic.com",
                  "connect-src 'self' https:",
                  "object-src 'none'",
                  "base-uri 'none'",
                  "form-action 'self'",
                ].join("; "),
        },
      ],
    },
  ],
}

export default nextConfig
```

**Verify**: `npx tsc --noEmit 2>&1 | head -20` → exit 0

### Step 4: Check `lib/db.ts` for similar default password

Read `lib/db.ts` — if it has `process.env.DB_PASSWORD || '123456789'` or similar, apply the same guard pattern (throw if not set in production, allow dev fallback only if NODE_ENV !== "production").

```ts
// If default password exists:
const DB_PASSWORD = process.env.NODE_ENV === "production" && !process.env.DB_PASSWORD
  ? (() => { throw new Error("DB_PASSWORD required in production") })()
  : process.env.DB_PASSWORD || "123456789"
```

**Verify**: `npm run build` → exit 0

### Step 5: Verify `.env.local` is in `.gitignore`

Confirm `.env.local` is gitignored (it is in `.gitignore` per recon). No action needed unless it's missing.

## Test plan

No new tests needed for this plan — it's a configuration/hardening change. The build succeeding is the verification gate.

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` exits 0
- [ ] `grep -rn "compass-dev-secret" lib/ middleware.ts` returns no matches
- [ ] `grep -rn "123456789" lib/db.ts` returns no matches (or is production-guarded)
- [ ] `next.config.ts` has uncommented CSP headers
- [ ] `plans/README.md` status row for 001 updated to DONE

## STOP conditions

- If removing the fallback breaks the build and you can't fix it in 2 attempts.
- If `lib/db.ts` has a more complex database connection pattern that doesn't easily allow a guard.
- If any out-of-scope file needs modification to make the build pass.

## Maintenance notes

- After this change, any environment without `JWT_SECRET` set will crash on startup. This is intentional — it prevents silent fallback to a known secret.
- Existing JWTs signed with the old fallback secret will be invalid after this change. Users must re-login.
- The CSP `'unsafe-inline'` for styles is required by Tailwind CSS and Next.js. Don't remove it.
