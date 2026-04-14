'use server';

import { API_URL } from '@/shared/lib/config';
import { httpClientList } from '@/shared/lib/httpClient';

import type { TranscriptProps } from '@/features/transcript/model/types';

/**
 * Load a paginated chunk of transcript entries for a calendar event.
 */
export async function loadTranscriptChunk(
  id: string,
  offset: number,
  limit: number,
): Promise<{ items: TranscriptProps[]; totalCount: number; hasMore: boolean }> {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  });

  const { data, totalCount, hasMore } = await httpClientList<TranscriptProps>(
    `${API_URL}/calendar-events/${id}/transcript?${params.toString()}`,
  );

  return { items: data, totalCount, hasMore };
}
