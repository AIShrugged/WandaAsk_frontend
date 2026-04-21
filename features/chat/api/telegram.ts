'use server';

import { redirect } from 'next/navigation';

import { parseApiError } from '@/shared/lib/apiError';
import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';

import type { TelegramChatRegistration } from '@/features/chat/types';
import type { ApiResponse } from '@/shared/types/common';

type TelegramAttachActionError = {
  data: null;
  error: string;
  fieldErrors?: Record<string, string>;
};

/**
 * getTelegramChats.
 * @returns Promise.
 */
export async function getTelegramChats(): Promise<TelegramChatRegistration[]> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/telegram/chats`, {
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');

    throw new Error('Failed to load Telegram chats');
  }

  const json: ApiResponse<TelegramChatRegistration[]> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  return json.data;
}

/**
 * issueTelegramAttachCode.
 * @param id - telegram registration id.
 * @param payload - tenant scope payload.
 * @param payload.organization_id
 * @param payload.team_id
 * @returns ActionResult.
 */
export async function issueTelegramAttachCode(
  id: number,
  payload: { organization_id: number; team_id?: number | null },
): Promise<TelegramChatRegistration | TelegramAttachActionError> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/telegram/chats/${id}/attach-code`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: payload.organization_id,
      team_id: payload.team_id ?? null,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();

    const parsed = parseApiError(text, 'Failed to generate attach code');

    if (res.status === 422) {
      return {
        data: null,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      };
    }

    throw new Error(parsed.message);
  }

  const json: ApiResponse<TelegramChatRegistration> = await res.json();

  return json.data!;
}
