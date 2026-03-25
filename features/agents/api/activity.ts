'use server';

import { redirect } from 'next/navigation';

import { parseApiError } from '@/shared/lib/apiError';
import { API_URL } from '@/shared/lib/config';
import { ServerError } from '@/shared/lib/errors';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { logApiError } from '@/shared/lib/logger';

import type {
  AgentActivityItem,
  AgentActivityResponse,
} from '@/features/agents/model/types';
import type { ApiResponse } from '@/shared/types/common';

const DEFAULT_LIMIT = 50;

const MAX_LIMIT = 200;

/**
 * Fetches global agent activity entries.
 *
 * @param offset - Pagination offset.
 * @param limit - Page size.
 * @param agentRunUuid - Optional agent run filter.
 */
export async function getAgentActivity(
  offset = 0,
  limit = DEFAULT_LIMIT,
  agentRunUuid?: string,
): Promise<AgentActivityResponse> {
  const authHeaders = await getAuthHeaders();

  const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

  const safeOffset = Math.max(offset, 0);

  const searchParams = new URLSearchParams({
    offset: String(safeOffset),
    limit: String(safeLimit),
  });

  if (agentRunUuid) {
    searchParams.set('agent_run_uuid', agentRunUuid);
  }

  const response = await fetch(`${API_URL}/agent-activity?${searchParams}`, {
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 401) redirect('/api/auth/clear-session');

    const text = await response.text();

    logApiError({
      method: 'GET',
      url: response.url,
      status: response.status,
      statusText: response.statusText,
      body: text,
    });

    throw new ServerError(
      parseApiError(text, 'Failed to load agent activity').message,
      {
        status: response.status,
        url: response.url,
        responseBody: text,
      },
    );
  }

  const json = (await response.json()) as ApiResponse<AgentActivityItem[]>;

  if (!json.success) {
    throw new ServerError(json.error ?? 'Failed to load agent activity', {
      url: response.url,
      status: response.status,
    });
  }

  const items = json.data ?? [];

  const totalCount = Number(response.headers.get('Items-Count') ?? '0');

  return {
    items,
    totalCount,
    hasMore: safeOffset + items.length < totalCount,
  };
}
