# Plan 003: Eliminate dual storage layer (remove localStorage)

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat ba6dd1e..HEAD -- lib/storage.ts lib/storage-server.ts lib/db-events.ts lib/db-*.ts app/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/002-integration-tests.md
- **Category**: tech-debt
- **Planned at**: commit `ba6dd1e`, 2026-07-11

## Why this matters

The codebase has two complete persistence implementations: `lib/storage.ts` (localStorage, 537 lines) and `lib/db-*.ts` (PostgreSQL, multiple files). All API routes use the PostgreSQL layer, but `lib/storage.ts` and `lib/storage-server.ts` still exist. `app/actions.ts` imports from `storage-server.ts` for onboarding, and `lib/migration.ts` imports from `storage.ts`. The `notifyDatabaseChange()` in `db-events.ts` is dead code on the server (it calls `window.dispatchEvent` with an SSR guard). This dual layer increases maintenance surface, causes confusion about which storage to use, and makes every new feature require choosing between two data access patterns.

## Current state

- **Files importing `@/lib/storage`** (from grep):
  - `lib/migration.ts:15` — imports `getGoals, setGoals, getSessions, setSessions, getInterruptions, setInterruptions`
  - `lib/db-client.ts:7` — comment referencing it ("Components should import from this module instead of `@/lib/storage`")
- **Files importing `@/lib/storage-server`**:
  - `app/actions.ts:3` — imports `isOnboardingDoneAsync, setOnboardingDoneAsync`
- **Files importing `@/lib/db-events`** (notifyDatabaseChange):
  - `lib/db-goals.ts:10`
  - `lib/db-sessions.ts:10`
  - `lib/db-reflections.ts:10`
  - `lib/db-roadmaps.ts:11`
  - `lib/db-tasks.ts:10`
  - `lib/db-weekly-objectives.ts:10`
  - `add-event-notifications.ts:20` (script file, excluded from TS build)
  - `test-module9-events.ts:17` (test file)
- **`lib/storage-server.ts`** (409 lines) — async PostgreSQL wrappers for onboarding, sessions, tasks, etc. This is a *duplicate* of the `lib/db-*.ts` layer. `app/actions.ts` uses `isOnboardingDoneAsync`/`setOnboardingDoneAsync` from it.
- **`lib/db-settings.ts`** — has its own onboarding functions. Check whether `isOnboardingDoneAsync`/`setOnboardingDoneAsync` can come from here instead.

## Commands you will need

| Purpose   | Command                          | Expected on success |
|-----------|----------------------------------|---------------------|
| Typecheck | `npx tsc --noEmit`               | exit 0, no errors   |
| Tests     | `npm test`                       | all pass            |
| Build     | `npm run build`                  | exit 0              |

## Scope

**In scope**:
- `lib/storage.ts` — delete
- `lib/storage-server.ts` — delete
- `lib/db-events.ts` — delete
- `lib/db-goals.ts`, `lib/db-sessions.ts`, `lib/db-reflections.ts`, `lib/db-roadmaps.ts`, `lib/db-tasks.ts`, `lib/db-weekly-objectives.ts` — remove `notifyDatabaseChange` imports and calls
- `app/actions.ts` — rewrite to use `@/lib/db-settings` instead of `@/lib/storage-server`
- `lib/migration.ts` — update imports (may need to keep or remove depending on usage)
- `add-event-notifications.ts` — delete (one-shot migration script)
- `test-module9-events.ts` — delete (tests the deleted `db-events.ts`)

**Out of scope**:
- `lib/db-*.ts` files themselves (don't change their DB logic)
- `app/api/` routes (they already use `db-*.ts`)
- `components/` (should already use `db-client.ts` or API routes)

## Steps

### Step 1: Verify `lib/db-settings.ts` has onboarding functions

Read `lib/db-settings.ts` and confirm it has (or can be extended with) `isOnboardingDone` and `setOnboardingDone` functions that take a `userId` parameter and query the `settings` table. If they don't exist, add them (following the same `withDb` pattern as other settings functions in that file).

**Verify**: `npx tsc --noEmit` → exit 0

### Step 2: Rewrite `app/actions.ts` to use `@/lib/db-settings`

Replace the import in `app/actions.ts`:
```ts
// BEFORE
import { isOnboardingDoneAsync, setOnboardingDoneAsync } from "@/lib/storage-server"

// AFTER
import { getSetting, setSetting } from "@/lib/db-settings"
```

And update the function bodies to use the DB settings layer. The onboarding status can be stored as a boolean setting with key `"onboarding_done"`.

**Verify**: `npx tsc --noEmit` → exit 0

### Step 3: Remove `notifyDatabaseChange` from all db modules

For each of these files, remove the import line and the `notifyDatabaseChange()` call:
- `lib/db-goals.ts` — line 10 (import) and line 359 (call)
- `lib/db-sessions.ts` — line 10 (import) and line 271 (call)
- `lib/db-reflections.ts` — line 10 (import) and line 215 (call)
- `lib/db-tasks.ts` — line 10 (import, call may exist in other locations)
- `lib/db-roadmaps.ts` — line 11 (import, call may exist in other locations)
- `lib/db-weekly-objectives.ts` — line 10 (import, call may exist in other locations)

For each file: remove the import, then remove every `notifyDatabaseChange()` call (grep to find all locations).

**Verify**: `grep -rn "notifyDatabaseChange" lib/db-*.ts` → no matches

### Step 4: Delete dead files

```bash
rm lib/storage.ts
rm lib/storage-server.ts
rm lib/db-events.ts
rm add-event-notifications.ts
rm test-module9-events.ts
```

**Verify**: `ls lib/storage.ts lib/storage-server.ts lib/db-events.ts` → all "No such file"

### Step 5: Update `lib/migration.ts`

Read `lib/migration.ts`. It imports from `@/lib/storage` — update it to import from the appropriate `@/lib/db-*.ts` modules, or delete the file entirely if it's a one-time migration script that's no longer needed (check if it's referenced anywhere).

**Verify**: `grep -rn "lib/storage" lib/ app/` → no matches (only `db-client.ts` comment should remain, which is fine)

### Step 6: Clean up `lib/db-client.ts` comment

In `lib/db-client.ts:7`, update the comment from "Components should import from this module instead of `@/lib/storage`" to something like "Client-side data fetching layer — all requests go through the API."

### Step 7: Verify build and tests

```bash
npx tsc --noEmit && npm run build && npm test
```

**Verify**: all exit 0

### Step 8: Verify no localStorage usage remains in production code

```bash
grep -rn "localStorage" lib/ app/ components/ --include="*.ts" --include="*.tsx"
```

Expected: zero matches (or only in comments). If any component still imports from `@/lib/storage`, that's a STOP condition.

## Test plan

- Run existing test suite — all 65+ tests from plan 002 should still pass
- Verify that `app/actions.ts` onboarding functions work by checking typecheck passes
- No new tests needed for this plan — it's a deletion/cleanup

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` exits 0
- [ ] `npm test` exits 0
- [ ] `grep -rn "lib/storage" lib/ app/ components/` → no import matches
- [ ] `grep -rn "notifyDatabaseChange" lib/` → no matches
- [ ] `lib/storage.ts`, `lib/storage-server.ts`, `lib/db-events.ts` deleted
- [ ] `plans/README.md` status row for 003 updated to DONE

## STOP conditions

- If a component still imports from `@/lib/storage` that we didn't discover during recon — this means the localStorage layer is still active in client components and removing it would break the UI. Report which components and what they use.
- If `lib/migration.ts` is imported by something else and can't be simply deleted.
- If `lib/db-settings.ts` doesn't have onboarding functions and adding them requires schema changes.
- If the build fails after Step 4 and the cause isn't obvious within 2 fix attempts.

## Maintenance notes

- After this change, all data flows through PostgreSQL via `lib/db-*.ts`. The `lib/db-client.ts` module is the client-side fetch wrapper.
- The `dispatchStorageEvent` / `compass-storage-update` window event system is gone. If components were relying on it for real-time updates, they'll need to use SWR/React Query revalidation or polling instead. Check for any `useStorageSync` or event listener patterns in components.
- Future: consider adding SWR or React Query for client-side data caching and revalidation.
