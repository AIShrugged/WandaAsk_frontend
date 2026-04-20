'use server';

import { redirect } from 'next/navigation';

import { parseApiError } from '@/shared/lib/apiError';
import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { logApiError } from '@/shared/lib/logger';

import type { IssueStatus } from '@/features/issues/model/types';
import type { KanbanCard, KanbanFilters } from '@/features/kanban/model/types';
import type { ApiResponse } from '@/shared/types/common';
import type { ActionResult } from '@/shared/types/server-action';

/**
 * buildKanbanQuery builds query params for kanban issues request.
 * @param filters - filters.
 * @returns query string.
 */
function buildKanbanQuery(filters: KanbanFilters = {}): string {
  const params = new URLSearchParams();

  if (filters.organization_id) {
    params.set('organization_id', String(filters.organization_id));
  }

  if (filters.team_id) {
    params.set('team_id', String(filters.team_id));
  }

  if (filters.type) {
    params.set('type', filters.type);
  }

  if (filters.assignee_id) {
    params.set('assignee', String(filters.assignee_id));
  }

  if (filters.unassigned) {
    params.set('unassigned', '1');
  }

  if (filters.archived) {
    params.set('archived', '1');
  } else if (filters.exclude_archived) {
    params.set('exclude_archived', '1');
  }

  params.set('limit', String(filters.limit ?? 100));
  params.set('sort', filters.sort ?? 'updated_at');
  params.set('order', filters.order ?? 'desc');

  return params.toString();
}

/**
 * getKanbanIssues fetches all issues for the kanban board grouped by status.
 * NOTE: When backend adds a dedicated /kanban endpoint, switch this fetch to that URL.
 * @param filters - kanban filters.
 * @returns map of status → cards.
 */
export async function getKanbanIssues(
  filters: KanbanFilters = {},
): Promise<Record<IssueStatus, KanbanCard[]>> {
  const authHeaders = await getAuthHeaders();
  const query = buildKanbanQuery({ exclude_archived: true, ...filters });
  const res = await fetch(`${API_URL}/issues?${query}`, {
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');

    const text = await res.text();

    logApiError({
      method: 'GET',
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

    throw new Error(parseApiError(text, 'Failed to load kanban data').message);
  }

  const json: ApiResponse<KanbanCard[]> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.message ?? json.error ?? 'Invalid API response');
  }

  const grouped: Record<IssueStatus, KanbanCard[]> = {
    open: [],
    in_progress: [],
    paused: [],
    review: [],
    reopen: [],
    done: [],
  };

  for (const card of json.data) {
    if (card.status in grouped) {
      grouped[card.status].push(card);
    }
  }

  return grouped;
}

/**
 * moveKanbanCard moves a card to a new status column.
 * NOTE: When backend adds PATCH /issues/:id/status, switch to that endpoint.
 * @param cardId - issue id.
 * @param status - target status.
 * @param card - current card data for the patch payload.
 * @returns updated card.
 */
export async function moveKanbanCard(
  cardId: number,
  status: IssueStatus,
  card: KanbanCard,
): Promise<KanbanCard> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/issues/${cardId}`, {
    method: 'PATCH',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: card.name,
      description: card.description,
      type: card.type,
      status,
      organization_id: card.organization_id,
      team_id: card.team_id,
      assignee_id: card.assignee_id,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');

    const text = await res.text();

    logApiError({
      method: 'PATCH',
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

    throw new Error(parseApiError(text, 'Failed to move card').message);
  }

  const json: ApiResponse<KanbanCard> = await res.json();

  return json.data!;
}

/**
 * fetchKanbanIssues is a callable Server Action for client-side filter re-fetching.
 * Wraps getKanbanIssues with ActionResult so callers can handle errors gracefully.
 * @param filters - kanban filters.
 * @returns ActionResult with grouped cards or error message.
 */
export async function fetchKanbanIssues(
  filters: KanbanFilters,
): Promise<ActionResult<Record<IssueStatus, KanbanCard[]>>> {
  try {
    const data = await getKanbanIssues(filters);
    return { data, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * fetchArchivedKanbanCards fetches archived done cards for the kanban Done column.
 * Returns a flat list sorted by close_date descending.
 * @param filters - kanban filters (org, team, type, assignee, search).
 * @returns ActionResult with flat list of archived KanbanCards.
 */
export async function fetchArchivedKanbanCards(
  filters: KanbanFilters,
): Promise<ActionResult<KanbanCard[]>> {
  const authHeaders = await getAuthHeaders();
  const query = buildKanbanQuery({
    ...filters,
    archived: true,
    sort: 'updated_at',
    order: 'desc',
  });
  const res = await fetch(`${API_URL}/issues?${query}`, {
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();

    logApiError({
      method: 'GET',
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

    return {
      data: null,
      error: parseApiError(text, 'Failed to load archived cards').message,
    };
  }

  const json: ApiResponse<KanbanCard[]> = await res.json();

  return { data: json.data ?? [], error: null };
}
