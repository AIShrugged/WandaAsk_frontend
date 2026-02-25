'use server';

import { redirect } from 'next/navigation';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { logApiError } from '@/shared/lib/logger';

import type { Message } from '@/features/chat/types';
import type { ApiResponse } from '@/shared/types/common';

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
    logApiError({ url: res.url, status: res.status, statusText: res.statusText, body: text });
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

export async function sendMessage(
  chatId: number,
  content: string,
): Promise<Message[]> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}/chats/${chatId}/messages`, {
    method: 'POST',
    headers: { ...authHeaders },
    body: JSON.stringify({ content }),
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();
    logApiError({ method: 'POST', url: res.url, status: res.status, statusText: res.statusText, body: text });
    throw new Error((JSON.parse(text) as { message?: string })?.message ?? 'Failed to send message');
  }

  const json: ApiResponse<Message | Message[]> = await res.json();
  const data = json.data!;
  return Array.isArray(data) ? data : [data];
}
