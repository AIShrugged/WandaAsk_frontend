'use server';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';

/**
 * getCurrentUserId — fetches the authenticated user's ID from GET /users/me.
 * Note: this endpoint returns raw user JSON (no ApiEnvelope wrapper), id is at root.
 * @returns user id or null on failure.
 */
export async function getCurrentUserId(): Promise<number | null> {
  let authHeaders: Record<string, string>;

  try {
    authHeaders = await getAuthHeaders();
  } catch {
    return null;
  }

  const res = await fetch(`${API_URL}/users/me`, {
    headers: authHeaders,
    cache: 'no-store',
  });

  if (!res.ok) {
    return null;
  }

  const json: unknown = await res.json();

  if (
    json !== null &&
    typeof json === 'object' &&
    'id' in json &&
    typeof (json as { id: unknown }).id === 'number'
  ) {
    return (json as { id: number }).id;
  }

  return null;
}
