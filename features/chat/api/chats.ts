'use server';

import { redirect } from 'next/navigation';

import { parseApiError } from '@/shared/lib/apiError';
import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';

import type { Chat, ChatUpsertDTO } from '@/features/chat/types';
import type { ApiResponse } from '@/shared/types/common';

type ChatActionError = {
  data: null;
  error: string;
  fieldErrors?: Record<string, string>;
};

/**
 * getChats.
 * @param offset
 * @param limit
 * @returns Promise.
 */
export async function getChats(
  offset = 0,
  limit = 20,
): Promise<{ chats: Chat[]; totalCount: number; hasMore: boolean }> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/chats?offset=${offset}&limit=${limit}`, {
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();

    throw new Error(text || 'Failed to load chats');
  }

  const json: ApiResponse<Chat[]> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  const totalCount = Number(res.headers.get('Items-Count') || '0');

  return {
    chats: json.data,
    totalCount,
    hasMore: offset + limit < totalCount,
  };
}

/**
 * getChat.
 * @param id - chat id.
 * @returns Promise.
 */
export async function getChat(id: number): Promise<Chat> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/chats/${id}`, {
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();

    throw new Error(parseApiError(text, 'Failed to load chat').message);
  }

  const json: ApiResponse<Chat> = await res.json();

  return json.data!;
}

export async function createChat(
  payloadOrTitle: Partial<ChatUpsertDTO> | string | null = {},
): Promise<Chat | ChatActionError> {
  const authHeaders = await getAuthHeaders();
  const payload =
    typeof payloadOrTitle === 'string' || payloadOrTitle === null
      ? { title: payloadOrTitle }
      : payloadOrTitle;
  const body: Record<string, number | string | null> = {};

  if ('title' in payload) {
    body.title = payload.title ?? null;
  }

  if ('organization_id' in payload) {
    body.organization_id = payload.organization_id ?? null;
  }

  if ('team_id' in payload) {
    body.team_id = payload.team_id ?? null;
  }

  const res = await fetch(`${API_URL}/chats`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();

    const parsed = parseApiError(text, 'Failed to create chat');

    if (res.status === 422) {
      return {
        data: null,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      };
    }

    throw new Error(parsed.message);
  }

  const json: ApiResponse<Chat> = await res.json();

  return json.data!;
}

/**
 * updateChat.
 * @param id - chat id.
 * @param payload - title and tenant scope payload.
 * @returns ActionResult.
 */
export async function updateChat(
  id: number,
  payload: Partial<ChatUpsertDTO>,
): Promise<Chat | ChatActionError> {
  const authHeaders = await getAuthHeaders();
  const body: Record<string, number | string | null> = {};

  if ('title' in payload) {
    body.title = payload.title ?? null;
  }

  if ('organization_id' in payload) {
    body.organization_id = payload.organization_id ?? null;
  }

  if ('team_id' in payload) {
    body.team_id = payload.team_id ?? null;
  }

  const res = await fetch(`${API_URL}/chats/${id}`, {
    method: 'PATCH',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();

    const parsed = parseApiError(text, 'Failed to update chat');

    if (res.status === 422) {
      return {
        data: null,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      };
    }

    throw new Error(parsed.message);
  }

  const json: ApiResponse<Chat> = await res.json();

  return json.data!;
}

/**
 * updateChatTitle.
 * @param id - chat id.
 * @param title - new title.
 * @returns Promise.
 */
export async function updateChatTitle(
  id: number,
  title: string,
): Promise<void> {
  const result = await updateChat(id, { title });

  if (result && 'error' in result) {
    throw new Error(result.error);
  }
}

/**
 * deleteChat.
 * @param id - id.
 * @returns Promise.
 */
export async function deleteChat(id: number): Promise<void> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/chats/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();

    throw new Error(parseApiError(text, 'Failed to delete chat').message);
  }
}
