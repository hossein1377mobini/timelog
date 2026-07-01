"use server";

import { runMigrations } from "@/lib/migration";
import { isOnboardingDoneAsync, setOnboardingDoneAsync } from "@/lib/storage-server";

/**
 * Server action to run database migrations.
 * 
 * ⚠️ NOTE: This action is deprecated. Migrations should run client-side only.
 * The migration code requires localStorage which is not available on the server.
 * 
 * Instead, call runMigrations() directly from a client component's useEffect.
 * 
 * @deprecated Use client-side runMigrations() instead
 * @throws {Error} Always throws - migrations cannot run on server
 */
export async function runMigrationsAction() {
  throw new Error(
    'Migrations must run client-side. Call runMigrations() from a client component instead.'
  );
}

/**
 * Server action to check if onboarding is complete.
 * 
 * @returns Boolean indicating onboarding status
 */
export async function checkOnboardingAction(): Promise<boolean> {
  try {
    return await isOnboardingDoneAsync();
  } catch (error) {
    console.error('Failed to check onboarding status:', error);
    // Return false as fallback to show onboarding
    return false;
  }
}

/**
 * Server action to mark onboarding as complete.
 * 
 * @throws {Error} If setting onboarding status fails
 */
export async function completeOnboardingAction(): Promise<void> {
  try {
    await setOnboardingDoneAsync();
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
    throw new Error(
      error instanceof Error
        ? `Failed to complete onboarding: ${error.message}`
        : 'Failed to complete onboarding'
    );
  }
}
