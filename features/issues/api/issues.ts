'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { parseApiError } from '@/shared/lib/apiError';
import { API_URL, FILES_URL } from '@/shared/lib/config';
import { ServerError } from '@/shared/lib/errors';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { httpClient, httpClientList } from '@/shared/lib/httpClient';

import type { AgentTaskRun } from '@/features/agents/model/types';
import type {
  Issue,
  IssueAttachment,
  IssueFilters,
  IssueUpsertDTO,
  PersonOption,
} from '@/features/issues/model/types';
import type { ApiResponse } from '@/shared/types/common';
import type { ActionResult } from '@/shared/types/server-action';

type IssueActionError = {
  data: null;
  error: string;
  fieldErrors?: Record<string, string>;
};

type IssueAttachmentApiResource = IssueAttachment & {
  file_path?: string | null;
  file_url?: string | null;
  uploaded_at?: string | null;
};

/**
 * getFilesBaseUrl.
 * @returns base files url.
 */
function getFilesBaseUrl() {
  if (FILES_URL) {
    return FILES_URL.replace(/\/$/, '');
  }

  const apiUrl = new URL(API_URL);

  return `${apiUrl.origin}/storage`;
}

/**
 * normalizeIssueAttachment.
 * @param attachment - backend attachment resource.
 * @returns normalized attachment.
 */
function normalizeIssueAttachment(
  attachment: IssueAttachmentApiResource,
): IssueAttachment {
  const filePath = attachment.file_path ?? null;
  const baseUrl = getFilesBaseUrl();
  const normalizedFilePath = filePath ? filePath.replace(/^\/+/, '') : null;

  return {
    ...attachment,
    file_path: filePath,
    file_url: attachment.file_url ?? null,
    file_name:
      attachment.file_name ??
      (normalizedFilePath
        ? (normalizedFilePath.split('/').pop() ?? null)
        : null),
    original_name:
      attachment.original_name ??
      attachment.name ??
      (normalizedFilePath
        ? (normalizedFilePath.split('/').pop() ?? null)
        : null),
    url:
      attachment.file_url ??
      attachment.url ??
      (normalizedFilePath ? `${baseUrl}/${normalizedFilePath}` : null),
  };
}

/**
 * buildIssuesQuery.
 * @param filters - filters.
 * @returns query string.
 */
function buildIssuesQuery(filters: IssueFilters = {}) {
  const params = new URLSearchParams();

  if (filters.status) params.set('status', filters.status);

  if (filters.type) params.set('type', filters.type);

  if (filters.assignee) params.set('assignee', String(filters.assignee));

  if (filters.unassigned) params.set('unassigned', '1');

  if (filters.organization_id)
    params.set('organization_id', String(filters.organization_id));

  if (filters.team_id) params.set('team_id', String(filters.team_id));
  params.set('offset', String(filters.offset ?? 0));
  params.set('limit', String(filters.limit ?? 10));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.order) params.set('order', filters.order);
  if (filters.search) params.set('search', filters.search);
  if (filters.archived) params.set('archived', '1');
  if (filters.exclude_archived) params.set('exclude_archived', '1');

  return params.toString();
}

/**
 * getIssues.
 * @param filters - list filters.
 * @returns paginated issues.
 */
export async function getIssues(filters: IssueFilters = {}) {
  const authHeaders = await getAuthHeaders();
  const query = buildIssuesQuery({ exclude_archived: true, ...filters });
  const res = await fetch(`${API_URL}/issues?${query}`, {
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();

    throw new Error(parseApiError(text, 'Failed to load issues').message);
  }

  const json: ApiResponse<Issue[]> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  const totalCount = Number(res.headers.get('Items-Count') || '0');

  return {
    data: json.data,
    totalCount,
    hasMore: (filters.offset ?? 0) + (filters.limit ?? 10) < totalCount,
  };
}

/**
 * loadIssuesChunk loads a page of issues for infinite scroll.
 * @param filters - list filters including offset and limit.
 * @returns paginated chunk.
 */
export async function loadIssuesChunk(filters: IssueFilters = {}) {
  const authHeaders = await getAuthHeaders();
  const query = buildIssuesQuery({ exclude_archived: true, ...filters });
  const res = await fetch(`${API_URL}/issues?${query}`, {
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();

    throw new Error(parseApiError(text, 'Failed to load issues').message);
  }

  const json: ApiResponse<Issue[]> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  const totalCount = Number(res.headers.get('Items-Count') || '0');
  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;

  return {
    items: json.data,
    hasMore: offset + limit < totalCount,
  };
}

/**
 * getArchivedCount returns the total count of archived issues matching filters.
 * Archived = status done AND close_date 14+ days ago.
 * @param filters - shared filters (org, team, assignee, type, search).
 * @returns count.
 */
export async function getArchivedCount(
  filters: IssueFilters = {},
): Promise<number> {
  const authHeaders = await getAuthHeaders();
  const query = buildIssuesQuery({
    ...filters,
    archived: true,
    limit: 1,
    offset: 0,
  });
  const res = await fetch(`${API_URL}/issues?${query}`, {
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');

    return 0;
  }

  return Number(res.headers.get('Items-Count') || '0');
}

/**
 * loadArchivedChunk loads a page of archived issues.
 * @param filters - list filters including offset and limit.
 * @returns paginated chunk.
 */
export async function loadArchivedChunk(
  filters: IssueFilters = {},
): Promise<{ items: Issue[]; hasMore: boolean }> {
  const authHeaders = await getAuthHeaders();
  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;
  const query = buildIssuesQuery({
    ...filters,
    archived: true,
    limit,
    offset,
  });
  const res = await fetch(`${API_URL}/issues?${query}`, {
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();

    throw new Error(
      parseApiError(text, 'Failed to load archived issues').message,
    );
  }

  const json: ApiResponse<Issue[]> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  const totalCount = Number(res.headers.get('Items-Count') || '0');

  return {
    items: json.data,
    hasMore: offset + limit < totalCount,
  };
}

/**
 * getIssue.
 * @param id - issue id.
 * @returns issue resource.
 */
export async function getIssue(id: number): Promise<Issue> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/issues/${id}`, {
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();

    throw new Error(parseApiError(text, 'Failed to load issue').message);
  }

  const json: ApiResponse<Issue> = await res.json();

  return json.data!;
}

/**
 * createIssue.
 * @param payload - issue payload.
 * @returns created issue or validation error.
 */
export async function createIssue(
  payload: IssueUpsertDTO,
): Promise<Issue | IssueActionError> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/issues`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();
    const parsed = parseApiError(text, 'Failed to create issue');

    if (res.status === 422) {
      return {
        data: null,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      };
    }

    throw new Error(parsed.message);
  }

  const json: ApiResponse<Issue> = await res.json();

  return json.data!;
}

/**
 * updateIssue.
 * @param id - issue id.
 * @param payload - issue payload.
 * @returns updated issue or validation error.
 */
export async function updateIssue(
  id: number,
  payload: IssueUpsertDTO,
): Promise<Issue | IssueActionError> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/issues/${id}`, {
    method: 'PATCH',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();
    const parsed = parseApiError(text, 'Failed to update issue');

    if (res.status === 422) {
      return {
        data: null,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      };
    }

    throw new Error(parsed.message);
  }

  const json: ApiResponse<Issue> = await res.json();

  revalidatePath('/dashboard/issues');
  revalidatePath('/dashboard/kanban');

  return json.data!;
}

/**
 * deleteIssue.
 * @param id - issue id.
 * @returns Promise.
 */
export async function deleteIssue(id: number): Promise<void> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/issues/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();

    throw new Error(parseApiError(text, 'Failed to delete issue').message);
  }
}

/**
 * dispatchIssue.
 * @param id - issue id.
 * @returns AgentTaskRun on success or error message.
 */
export async function dispatchIssue(
  id: number,
): Promise<{ data: AgentTaskRun | null; error: string | null }> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/issues/${id}/dispatch`, {
    method: 'POST',
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();

    return {
      data: null,
      error: parseApiError(text, 'Failed to dispatch agent for issue').message,
    };
  }

  const json: ApiResponse<AgentTaskRun> = await res.json();

  return { data: json.data ?? null, error: null };
}

/**
 * getPersons.
 * @returns persons list.
 */
export async function getPersons(): Promise<PersonOption[]> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/persons`, {
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();

    throw new Error(parseApiError(text, 'Failed to load persons').message);
  }

  const json: ApiResponse<PersonOption[]> = await res.json();

  return json.data ?? [];
}

/**
 * getIssueAttachments.
 * @param issueId - issue id.
 * @returns attachments.
 */
export async function getIssueAttachments(
  issueId: number,
): Promise<IssueAttachment[]> {
  const result = await httpClientList<IssueAttachmentApiResource>(
    `${API_URL}/issues/${issueId}/attachments`,
  );

  return result.data.map((attachment) => {
    return normalizeIssueAttachment(attachment);
  });
}

/**
 * uploadIssueAttachment.
 * @param issueId - issue id.
 * @param file - file to upload.
 * @returns uploaded attachment or error.
 */
export async function uploadIssueAttachment(
  issueId: number,
  file: File,
): Promise<ActionResult<IssueAttachment>> {
  try {
    const formData = new FormData();

    formData.append('file', file);

    const { data } = await httpClient<IssueAttachmentApiResource>(
      `${API_URL}/issues/${issueId}/attachments`,
      { method: 'POST', body: formData },
    );

    if (!data) return { data: null, error: 'Upload failed' };

    return { data: normalizeIssueAttachment(data), error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to upload attachment',
      );

      return {
        data: null,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      };
    }

    throw error;
  }
}

/**
 * deleteAttachment.
 * @param attachmentId - attachment id.
 * @returns action result.
 */
export async function deleteAttachment(
  attachmentId: number,
): Promise<ActionResult<null>> {
  try {
    await httpClient(`${API_URL}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });

    return { data: null, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to delete attachment',
      );

      return { data: null, error: parsed.message, fieldErrors: undefined };
    }

    throw error;
  }
}
