'use server';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { logApiError } from '@/shared/lib/logger';

import type { Source } from '@/entities/source';
import type { ApiResponse } from '@/shared/types/common';

/**
 * getSources — fetches the list of calendar sources for the authenticated user.
 * @returns Array of Source objects, or empty array on error.
 */
export async function getSources(): Promise<Source[]> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}/sources`, {
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();

    logApiError({
      url: `${API_URL}/sources`,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

    return [];
  }

  const json: ApiResponse<Source[]> = await res.json();

  return json.data ?? [];
}
