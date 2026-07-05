"use server";

import { isOnboardingDoneAsync, setOnboardingDoneAsync } from "@/lib/storage-server";

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
