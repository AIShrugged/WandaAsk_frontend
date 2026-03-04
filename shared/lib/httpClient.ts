// ------------------------------
// Generic HTTP client
// ------------------------------
import { redirect } from 'next/navigation';

import { ServerError } from '@/shared/lib/errors';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { logApiError } from '@/shared/lib/logger';

import type { ApiResponse, PaginatedResult } from '@/shared/types/common';

export async function httpClient<T>(
  url: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) {
      redirect('/api/auth/clear-session');
    }

    const text = await res.text();
    logApiError({ method: options.method, url, status: res.status, statusText: res.statusText, body: text });
    throw new ServerError('A server error occurred. Please try again.', {
      status: res.status,
      url,
      responseBody: text,
    });
  }

  const json: ApiResponse<T> = await res.json();

  if (!json.success || !json.data) {
    throw new ServerError(json.error ?? 'Invalid API response', { url });
  }

  return { data: json.data };
}

// ------------------------------
// Paginated HTTP client — extracts Items-Count header
// ------------------------------
export async function httpClientList<T>(
  url: string,
  options: RequestInit = {},
): Promise<PaginatedResult<T>> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) {
      redirect('/api/auth/clear-session');
    }

    const text = await res.text();
    logApiError({ method: options.method, url, status: res.status, statusText: res.statusText, body: text });
    throw new ServerError('A server error occurred. Please try again.', {
      status: res.status,
      url,
      responseBody: text,
    });
  }

  const json: ApiResponse<T[]> = await res.json();

  if (!json.success || !json.data) {
    throw new ServerError(json.error ?? 'Invalid API response', { url });
  }

  const totalCount = Number(res.headers.get('Items-Count') ?? '0');

  return { data: json.data, totalCount, hasMore: json.data.length < totalCount };
}
