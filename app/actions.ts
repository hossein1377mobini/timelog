"use server";

import { isOnboardingDone, setOnboardingDone } from "@/lib/onboarding";
import { getSession } from "@/lib/auth";

/**
 * Server action to check if onboarding is complete.
 *
 * @returns Boolean indicating onboarding status
 */
export async function checkOnboardingAction(): Promise<boolean> {
  try {
    const session = await getSession();
    if (!session) return false;
    return await isOnboardingDone(session.sub);
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
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    await setOnboardingDone(session.sub);
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
    throw new Error(
      error instanceof Error
        ? `Failed to complete onboarding: ${error.message}`
        : 'Failed to complete onboarding'
    );
  }
}
