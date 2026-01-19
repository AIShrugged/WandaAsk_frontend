'use server';

import { API_URL } from '@/app/constants/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';

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
    },
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Transcript chunk fetch failed:', res.status, text);
    throw new Error('Failed to load transcript chunk');
  }

  const data = await res.json();
  const totalCount = Number(res.headers.get('Items-Count') || '0');

  return { data, totalCount, hasMore: offset + limit < totalCount };
}
