'use server';

import { redirect } from 'next/navigation';

import { parseApiError } from '@/shared/lib/apiError';
import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { logApiError } from '@/shared/lib/logger';

import type { AgentRun, Message, PageContext } from '@/features/chat/types';
import type { ApiResponse } from '@/shared/types/common';

type MessageActionError = {
  data: null;
  error: string;
  fieldErrors?: Record<string, string>;
};

/**
 * getMessages.
 * @param chatId
 * @param offset
 * @param limit
 * @returns Promise.
 */
// eslint-disable-next-line complexity
export async function getMessages(
  chatId: number,
  offset = 0,
  limit = 50,
): Promise<{ messages: Message[]; totalCount: number; hasMore: boolean }> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(
    `${API_URL}/chats/${chatId}/messages?offset=${offset}&limit=${limit}`,
    { headers: { ...authHeaders }, cache: 'no-store' },
  );

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();

    logApiError({
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });
    throw new Error(text || 'Failed to load messages');
  }

  const json: ApiResponse<Message[]> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  const totalCount = Number(res.headers.get('Items-Count') || '0');

  return {
    messages: json.data,
    totalCount,
    hasMore: offset + limit < totalCount,
  };
}

/**
 * sendMessage.
 * POST /api/v1/chats/{chatId}/messages
 * Returns the queued assistant placeholder message (status = 'queued').
 * @param chatId
 * @param content
 * @returns Promise.
 */
export async function sendMessage(
  chatId: number,
  content: string,
  pageContext?: PageContext,
): Promise<Message | MessageActionError> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/chats/${chatId}/messages`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      ...(pageContext?.page_html !== undefined && {
        page_html: pageContext.page_html,
      }),
      ...(pageContext?.page_title !== undefined && {
        page_title: pageContext.page_title,
      }),
      ...(pageContext?.page_url !== undefined && {
        page_url: pageContext.page_url,
      }),
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();

    logApiError({
      method: 'POST',
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

    const parsed = parseApiError(text, 'Failed to send message');

    if (res.status === 422) {
      return {
        data: null,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      };
    }

    throw new Error(parsed.message);
  }

  const json: ApiResponse<Message> = await res.json();

  return json.data!;
}

/**
 * pollRun.
 * GET /api/v1/chats/{chatId}/runs/{runUuid}
 * Returns the current run status and, when completed, the final message.
 * @param chatId
 * @param runUuid
 * @returns Promise.
 */
export async function pollRun(
  chatId: number,
  runUuid: string,
): Promise<AgentRun> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/chats/${chatId}/runs/${runUuid}`, {
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();

    logApiError({
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });
    throw new Error(text || 'Failed to poll run status');
  }

  const json: ApiResponse<AgentRun> = await res.json();

  return json.data!;
}
