'use server';

import { revalidatePath } from 'next/cache';

import { API_URL } from '@/shared/lib/config';
import { httpClient } from '@/shared/lib/httpClient';

import type { UserPreferences } from '@/entities/user';
import type { ActionResult } from '@/shared/types/server-action';

export async function updateUserPreferences(
  payload: UserPreferences,
): Promise<ActionResult> {
  try {
    await httpClient<void>(`${API_URL}/users/me/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    revalidatePath('/dashboard', 'layout');
    return { data: undefined, error: null };
  } catch {
    return {
      data: null,
      error: 'Failed to save menu preferences. Please try again.',
    };
  }
}
