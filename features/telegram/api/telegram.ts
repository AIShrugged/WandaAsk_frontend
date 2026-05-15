'use server';

import { parseApiError } from '@/shared/lib/apiError';
import { API_URL } from '@/shared/lib/config';
import { ServerError } from '@/shared/lib/errors';
import { httpClient, httpClientList } from '@/shared/lib/httpClient';

import type { TelegramChatRegistration } from '@/entities/telegram';
import type { ActionResult } from '@/shared/types/server-action';

export async function getTelegramChats() {
  return httpClientList<TelegramChatRegistration>(`${API_URL}/telegram/chats`);
}

export async function issueTelegramAttachCode(
  id: number,
  payload: { organization_id: number; team_id?: number | null },
): Promise<ActionResult<TelegramChatRegistration>> {
  try {
    const { data } = await httpClient<TelegramChatRegistration>(
      `${API_URL}/telegram/chats/${id}/attach-code`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      },
    );
    if (!data) {
      throw new ServerError('Empty response from server', {
        url: `${API_URL}/telegram/chats/${id}/attach-code`,
        status: 200,
      });
    }
    return { data, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to issue attach code',
      );
      return {
        data: null,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      };
    }
    throw error;
  }
}
