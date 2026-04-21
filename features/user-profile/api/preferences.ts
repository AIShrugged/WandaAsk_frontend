'use server';

import { revalidatePath } from 'next/cache';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { logApiError } from '@/shared/lib/logger';

import type { UserPreferences } from '@/entities/user';
import type { ActionResult } from '@/shared/types/server-action';

export async function updateUserPreferences(
  payload: UserPreferences,
): Promise<ActionResult> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/users/me/preferences`, {
    method: 'PUT',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();

    logApiError({
      method: 'PUT',
      url: `${API_URL}/users/me/preferences`,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

    return {
      data: null,
      error: 'Failed to save menu preferences. Please try again.',
    };
  }

  revalidatePath('/dashboard', 'layout');

  return { data: undefined, error: null };
}
