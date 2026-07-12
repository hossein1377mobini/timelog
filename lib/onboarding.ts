/**
 * Onboarding state management — tracks whether a user has completed
 * the initial setup flow.
 *
 * Persisted in PostgreSQL via the settings table.
 */

import { getSetting, setSetting } from "@/lib/db-settings"

const ONBOARDING_KEY = "compass_onboarding_done"

/** Check whether the user has completed the onboarding flow. */
export async function isOnboardingDone(userId: string): Promise<boolean> {
  const value = await getSetting(userId, ONBOARDING_KEY)
  return value === "true"
}

/** Mark the onboarding flow as completed. */
export async function setOnboardingDone(userId: string): Promise<void> {
  await setSetting(userId, ONBOARDING_KEY, "true")
}
