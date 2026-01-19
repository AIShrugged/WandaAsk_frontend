// ------------------------------
// Generic HTTP client
// ------------------------------
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
    const text = await res.text();
    throw new Error(
      `${options.method ?? 'GET'} ${url} failed: ${res.status} ${res.statusText} — ${text}`,
    );
  }

  const json: ApiResponse<T> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  return { data: json.data };
}
