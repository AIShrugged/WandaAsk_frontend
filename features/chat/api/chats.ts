'use server';

import { redirect } from 'next/navigation';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { logApiError } from '@/shared/lib/logger';

import type { Chat } from '@/features/chat/types';
import type { ApiResponse } from '@/shared/types/common';

export async function getChats(
  offset = 0,
  limit = 20,
): Promise<{ chats: Chat[]; totalCount: number; hasMore: boolean }> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(
    `${API_URL}/chats?offset=${offset}&limit=${limit}`,
    { headers: { ...authHeaders }, cache: 'no-store' },
  );

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();
    logApiError({ url: res.url, status: res.status, statusText: res.statusText, body: text });
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

export async function createChat(title: string | null = null): Promise<Chat> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}/chats`, {
    method: 'POST',
    headers: { ...authHeaders },
    body: JSON.stringify({ title }),
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();
    logApiError({ method: 'POST', url: res.url, status: res.status, statusText: res.statusText, body: text });
    throw new Error((JSON.parse(text) as { message?: string })?.message ?? 'Failed to create chat');
  }

  const json: ApiResponse<Chat> = await res.json();
  return json.data!;
}

export async function updateChatTitle(
  id: number,
  title: string,
): Promise<void> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}/chats/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders },
    body: JSON.stringify({ title }),
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();
    logApiError({ method: 'PUT', url: res.url, status: res.status, statusText: res.statusText, body: text });
    throw new Error((JSON.parse(text) as { message?: string })?.message ?? 'Failed to update chat title');
  }
}

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
    logApiError({ method: 'DELETE', url: res.url, status: res.status, statusText: res.statusText, body: text });
    throw new Error((JSON.parse(text) as { message?: string })?.message ?? 'Failed to delete chat');
  }
}
