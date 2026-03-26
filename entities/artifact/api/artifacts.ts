'use server';

import { redirect } from 'next/navigation';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { logApiError } from '@/shared/lib/logger';

import type { ArtifactsResponse } from '@/entities/artifact/model/types';

type ArtifactsApiResponse = {
  success: boolean;
  data: ArtifactsResponse | null;
  message: string;
  status: number;
};

/**
 * Fetches all artifacts for the given chat.
 * Returns null if the chat has no artifacts (404) or on error.
 * @param chatId - The chat ID.
 * @returns ArtifactsResponse or null.
 */
export async function getArtifacts(
  chatId: number,
): Promise<ArtifactsResponse | null> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}/chats/${chatId}/artifacts`, {
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();

    logApiError({
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

    return null;
  }

  const json: ArtifactsApiResponse = await res.json();

  if (!json.success || !json.data) return null;

  return json.data;
}
