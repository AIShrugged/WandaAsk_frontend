// ------------------------------
// Generic HTTP client
// ------------------------------
import { redirect } from 'next/navigation';

import { getAuthHeaders } from '@/shared/lib/getAuthToken';

import type { ApiResponse } from '@/shared/types/common';

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
    // eslint-disable-next-line no-console
    console.error(`[httpClient] ${options.method ?? 'GET'} ${url} → ${res.status} ${res.statusText}: ${text}`);
    throw new Error('A server error occurred. Please try again.');
  }

  const json: ApiResponse<T> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  return { data: json.data };
}
