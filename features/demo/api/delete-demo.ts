'use server';

import { redirect } from 'next/navigation';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { logApiError } from '@/shared/lib/logger';

import type { ActionResult } from '@/shared/types/server-action';

/**
 * deleteDemo — permanently deletes all demo data for the authenticated user.
 * @returns ActionResult.
 */
export async function deleteDemo(): Promise<ActionResult> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}/demo`, {
    method: 'DELETE',
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');

    const text = await res.text();

    logApiError({
      method: 'DELETE',
      url: `${API_URL}/demo`,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

    if (res.status === 404) {
      return { data: null, error: 'No demo data found.' };
    }

    return {
      data: null,
      error: 'Failed to delete demo data. Please try again.',
    };
  }

  return { data: undefined, error: null };
}
