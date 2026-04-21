'use server';

import { revalidatePath } from 'next/cache';

import { API_URL } from '@/shared/lib/config';
import { httpClient } from '@/shared/lib/httpClient';

const PATCH_HEADERS = { 'Content-Type': 'application/json' };

/**
 * Saves the current tour step index to the backend.
 * Fire-and-forget — failures are silently swallowed.
 * @param lastStep - The step index to persist.
 * @returns Promise.
 */
export async function saveTourProgress(lastStep: number): Promise<void> {
  try {
    await httpClient(`${API_URL}/users/me`, {
      method: 'PATCH',
      body: JSON.stringify({ onboarding_last_step: lastStep }),
      headers: PATCH_HEADERS,
    });
  } catch {
    // Silent failure — localStorage is the source of truth until backend is ready
  }
}

/**
 * Marks the onboarding tour as completed on the backend.
 * Fire-and-forget — failures are silently swallowed.
 * @returns Promise.
 */
export async function markTourComplete(): Promise<void> {
  try {
    await httpClient(`${API_URL}/users/me`, {
      method: 'PATCH',
      body: JSON.stringify({ onboarding_completed: true }),
      headers: PATCH_HEADERS,
    });
    revalidatePath('/dashboard');
  } catch {
    // Silent failure — localStorage is the source of truth until backend is ready
  }
}

/**
 * Resets the onboarding tour state on the backend.
 * Fire-and-forget — failures are silently swallowed.
 * @returns Promise.
 */
export async function resetTour(): Promise<void> {
  try {
    await httpClient(`${API_URL}/users/me`, {
      method: 'PATCH',
      body: JSON.stringify({
        onboarding_completed: false,
        onboarding_last_step: 0,
      }),
      headers: PATCH_HEADERS,
    });
    revalidatePath('/dashboard');
  } catch {
    // Silent failure — localStorage is the source of truth until backend is ready
  }
}
