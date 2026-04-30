'use server';

import { API_URL } from '@/shared/lib/config';
import { httpClientList } from '@/shared/lib/httpClient';

import type { MeetingKeyPoint } from '@/features/decisions/model/types';

export async function getKeyPoints(
  teamId: number,
  search?: string | null,
  offset = 0,
  limit = 30,
) {
  const params = new URLSearchParams();
  params.set('offset', String(offset));
  params.set('limit', String(limit));

  if (search?.trim()) {
    params.set('search', search.trim());
  }

  return httpClientList<MeetingKeyPoint>(
    `${API_URL}/teams/${teamId}/key-points?${params}`,
  );
}
