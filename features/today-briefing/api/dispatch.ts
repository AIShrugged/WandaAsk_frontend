'use server';

import { parseApiError } from '@/shared/lib/apiError';
import { API_URL } from '@/shared/lib/config';
import { ServerError } from '@/shared/lib/errors';
import { httpClient } from '@/shared/lib/httpClient';

import type { ActionResult } from '@/shared/types/server-action';

export async function dispatchTaskToAgent(
  issueId: number,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { data } = await httpClient<{ success: boolean }>(
      `${API_URL}/issues/${issueId}/dispatch`,
      { method: 'POST' },
    );
    return { data: data ?? { success: true }, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to dispatch task to agent',
      );
      return { data: null, error: parsed.message };
    }
    throw error;
  }
}
