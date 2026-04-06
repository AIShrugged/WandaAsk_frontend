'use server';

import { API_URL } from '@/shared/lib/config';
import { httpClient } from '@/shared/lib/httpClient';
import { parseApiError } from '@/shared/lib/apiError';
import { ServerError } from '@/shared/lib/errors';

import type { ActionResult } from '@/shared/types/server-action';

export async function sendDirectMessage(
  recipientUserId: number,
  message: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await httpClient(`${API_URL}/me/today/send-message`, {
      method: 'POST',
      body: JSON.stringify({
        recipient_user_id: recipientUserId,
        message,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    return { data: { success: true }, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to send message',
      );
      return { data: null, error: parsed.message };
    }
    throw error;
  }
}
