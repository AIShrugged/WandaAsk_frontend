'use server';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';

/**
 * loadTranscriptChunk.
 * @param id
 * @param offset
 * @param limit
 * @returns Promise.
 */
export async function loadTranscriptChunk(
  id: string,
  offset: number,
  limit: number,
) {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(
    `${API_URL}/calendar-events/${id}/transcript?offset=${offset}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        ...authHeaders,
      },
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    throw new Error('Failed to load transcript chunk');
  }

  const data = await res.json();

  const totalCount = Number(res.headers.get('Items-Count') || '0');

  return { data, totalCount, hasMore: offset + limit < totalCount };
}
