'use server';

import { API_URL } from '@/shared/lib/config';
import { ServerError } from '@/shared/lib/errors';
import { httpClient } from '@/shared/lib/httpClient';

import type { ArtifactsResponse } from '@/entities/artifact/model/types';

export async function getArtifacts(
  chatId: number,
): Promise<ArtifactsResponse | null> {
  try {
    const { data } = await httpClient<ArtifactsResponse>(
      `${API_URL}/chats/${chatId}/artifacts`,
    );

    return data ?? null;
  } catch (error) {
    if (error instanceof ServerError && error.status === 404) return null;
    throw error;
  }
}
