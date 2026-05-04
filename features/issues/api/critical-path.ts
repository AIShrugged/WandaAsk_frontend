'use server';

import { parseApiError } from '@/shared/lib/apiError';
import { API_URL } from '@/shared/lib/config';
import { ServerError } from '@/shared/lib/errors';
import { httpClient } from '@/shared/lib/httpClient';

import type { CriticalPathGraph } from '../model/types';
import type { ActionResult } from '@/shared/types/server-action';

type CriticalPathScope = { team_id?: number; organization_id?: number };

export async function getCriticalPath(
  scope: CriticalPathScope,
): Promise<CriticalPathGraph | null> {
  const params = new URLSearchParams();
  if (scope.team_id) params.set('team_id', String(scope.team_id));
  if (scope.organization_id)
    params.set('organization_id', String(scope.organization_id));

  const qs = params.toString();
  const url = qs
    ? `${API_URL}/critical-path?${qs}`
    : `${API_URL}/critical-path`;
  const { data } = await httpClient<CriticalPathGraph>(url);
  return data ?? null;
}

export async function rebuildCriticalPath(
  scope: CriticalPathScope,
): Promise<ActionResult<{ status: string; graph_id: number }>> {
  try {
    const { data } = await httpClient<{ status: string; graph_id: number }>(
      `${API_URL}/critical-path/rebuild`,
      {
        method: 'POST',
        body: JSON.stringify(scope),
        headers: { 'Content-Type': 'application/json' },
      },
    );
    if (!data) {
      return { data: null, error: 'No data returned from rebuild' };
    }
    return { data, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to rebuild critical path',
      );
      return { data: null, error: parsed.message };
    }
    throw error;
  }
}
