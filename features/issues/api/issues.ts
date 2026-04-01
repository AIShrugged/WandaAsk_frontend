'use server';

import { redirect } from 'next/navigation';

import { parseApiError } from '@/shared/lib/apiError';
import { API_URL, FILES_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { logApiError } from '@/shared/lib/logger';

import type { AgentTaskRun } from '@/features/agents/model/types';
import type {
  Issue,
  IssueAttachment,
  IssueFilters,
  IssueUpsertDTO,
  PersonOption,
} from '@/features/issues/model/types';
import type { ApiResponse } from '@/shared/types/common';

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

  if (filters.organization_id)
    params.set('organization_id', String(filters.organization_id));

  if (filters.team_id) params.set('team_id', String(filters.team_id));
  params.set('offset', String(filters.offset ?? 0));
  params.set('limit', String(filters.limit ?? 10));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.order) params.set('order', filters.order);
  if (filters.search) params.set('search', filters.search);
  if (filters.id_from) params.set('id_from', String(filters.id_from));
  if (filters.id_to) params.set('id_to', String(filters.id_to));

  return params.toString();
}

/**
 * getIssues.
 * @param filters - list filters.
 * @returns paginated issues.
 */
export async function getIssues(filters: IssueFilters = {}) {
  const authHeaders = await getAuthHeaders();
  const query = buildIssuesQuery(filters);
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
  const query = buildIssuesQuery(filters);
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

    logApiError({
      method: 'GET',
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });
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

    logApiError({
      method: 'POST',
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

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

    logApiError({
      method: 'PATCH',
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

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

    logApiError({
      method: 'DELETE',
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });
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

    logApiError({
      method: 'POST',
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

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

    logApiError({
      method: 'GET',
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });
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
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/issues/${issueId}/attachments`, {
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
    throw new Error(parseApiError(text, 'Failed to load attachments').message);
  }

  const json: ApiResponse<IssueAttachmentApiResource[]> = await res.json();

  return (json.data ?? []).map((attachment) => {
    return normalizeIssueAttachment(attachment);
  });
}

/**
 * uploadIssueAttachment.
 * @param issueId - issue id.
 * @param formData - upload form data.
 * @returns uploaded attachment or validation error.
 */
export async function uploadIssueAttachment(
  issueId: number,
  formData: FormData,
): Promise<IssueAttachment | IssueActionError> {
  const authHeaders = await getAuthHeaders();
  const headers = new Headers(authHeaders);

  headers.delete('Content-Type');

  const res = await fetch(`${API_URL}/issues/${issueId}/attachments`, {
    method: 'POST',
    headers,
    body: formData,
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();
    const parsed = parseApiError(text, 'Failed to upload attachment');

    logApiError({
      method: 'POST',
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

    if (res.status === 422) {
      return {
        data: null,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      };
    }

    throw new Error(parsed.message);
  }

  const json: ApiResponse<IssueAttachmentApiResource> = await res.json();

  return normalizeIssueAttachment(json.data!);
}

/**
 * deleteAttachment.
 * @param attachmentId - attachment id.
 * @returns Promise.
 */
export async function deleteAttachment(attachmentId: number): Promise<void> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();

    logApiError({
      method: 'DELETE',
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });
    throw new Error(parseApiError(text, 'Failed to delete attachment').message);
  }
}
