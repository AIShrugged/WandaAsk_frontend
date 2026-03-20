'use server';

import { redirect } from 'next/navigation';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { logApiError } from '@/shared/lib/logger';

/**
 * getFollowUp.
 * @param id - id.
 * @returns Promise.
 */
export async function getFollowUp(id: number) {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}/followups/${id}`, {
    headers: {
      ...authHeaders,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) {
      redirect('/api/auth/clear-session');
    }

    const text = await res.text();

    logApiError({
      method: 'GET',
      url: `${API_URL}/followups/${id}`,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

    throw new Error('Failed to load follow-up. Please try again.');
  }

  const json = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  return { data: json.data };
}
