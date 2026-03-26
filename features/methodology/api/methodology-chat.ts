'use server';

import { API_URL } from '@/shared/lib/config';
import { ServerError } from '@/shared/lib/errors';
import { httpClient } from '@/shared/lib/httpClient';

interface MethodologyChat {
  id: number;
  title: string | null;
  methodology_id: number;
  organization_id: number | null;
  team_id: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Returns the chat linked to the given methodology, or null if none exists.
 * Used by the follow-up analysis page to fetch artifacts for the methodology.
 * @param methodologyId - The methodology ID.
 * @returns The linked chat or null.
 */
export async function getMethodologyChat(
  methodologyId: number,
): Promise<MethodologyChat | null> {
  try {
    const { data } = await httpClient<MethodologyChat | null>(
      `${API_URL}/methodologies/${methodologyId}/chat`,
    );

    return data ?? null;
  } catch (error) {
    if (error instanceof ServerError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
