'use server';

import { redirect } from 'next/navigation';

import { parseApiError } from '@/shared/lib/apiError';
import { API_URL } from '@/shared/lib/config';
import { ServerError } from '@/shared/lib/errors';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { logApiError } from '@/shared/lib/logger';

import type {
  AgentActionError,
  AgentProfile,
  AgentProfilePayload,
  AgentTask,
  AgentTaskPayload,
  AgentTaskRun,
  AgentTasksMeta,
  AgentToolDefinition,
} from '@/features/agents/model/types';
import type { ApiResponse } from '@/shared/types/common';

/**
 *
 * @param path
 * @param init
 * @param fallbackMessage
 */
async function requestAgentApi<T>(
  path: string,
  init: RequestInit,
  fallbackMessage: string,
): Promise<{ response: Response; json: ApiResponse<T> }> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...authHeaders,
      ...init.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 401) redirect('/api/auth/clear-session');

    const text = await response.text();

    logApiError({
      method: init.method,
      url: response.url,
      status: response.status,
      statusText: response.statusText,
      body: text,
    });

    throw new ServerError(parseApiError(text, fallbackMessage).message, {
      status: response.status,
      url: response.url,
      responseBody: text,
    });
  }

  const json = (await response.json()) as ApiResponse<T>;

  if (!json.success) {
    throw new ServerError(json.error ?? fallbackMessage, {
      url: response.url,
      status: response.status,
    });
  }

  return { response, json };
}

/**
 *
 * @param path
 * @param init
 * @param fallbackMessage
 */
async function actionAgentApi<T>(
  path: string,
  init: RequestInit,
  fallbackMessage: string,
): Promise<T | AgentActionError> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 401) redirect('/api/auth/clear-session');

    const text = await response.text();
    const parsed = parseApiError(text, fallbackMessage);

    logApiError({
      method: init.method,
      url: response.url,
      status: response.status,
      statusText: response.statusText,
      body: text,
    });

    if (response.status === 403 || response.status === 422) {
      return {
        data: null,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
        status: response.status,
      };
    }

    throw new ServerError(parsed.message, {
      status: response.status,
      url: response.url,
      responseBody: text,
    });
  }

  const json = (await response.json()) as ApiResponse<T>;

  if (!json.success) {
    return {
      data: null,
      error: json.error ?? fallbackMessage,
    };
  }

  return json.data as T;
}

/**
 *
 */
export async function getAgentProfiles() {
  const { response, json } = await requestAgentApi<AgentProfile[]>(
    '/agent-profiles',
    { method: 'GET' },
    'Failed to load agent profiles',
  );

  return {
    data: json.data ?? [],
    totalCount: Number(response.headers.get('Items-Count') ?? '0'),
  };
}

/**
 *
 * @param id
 */
export async function getAgentProfile(id: number) {
  const { json } = await requestAgentApi<AgentProfile>(
    `/agent-profiles/${id}`,
    { method: 'GET' },
    'Failed to load agent profile',
  );

  return json.data as AgentProfile;
}

/**
 *
 * @param payload
 */
export async function createAgentProfile(payload: AgentProfilePayload) {
  return actionAgentApi<AgentProfile>(
    '/agent-profiles',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Failed to create agent profile',
  );
}

/**
 *
 * @param id
 * @param payload
 */
export async function updateAgentProfile(
  id: number,
  payload: Partial<AgentProfilePayload>,
) {
  return actionAgentApi<AgentProfile>(
    `/agent-profiles/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    'Failed to update agent profile',
  );
}

/**
 *
 * @param id
 */
export async function deleteAgentProfile(id: number) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_URL}/agent-profiles/${id}`, {
    method: 'DELETE',
    headers: {
      ...authHeaders,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    const parsed = parseApiError(text, 'Failed to delete agent profile');

    return {
      error: parsed.message,
      status: response.status,
    };
  }

  return { error: null, status: response.status };
}

/**
 *
 * @param id
 * @param payload
 */
export async function validateAgentProfilePayload(
  id: number,
  payload: Record<string, unknown> | null,
) {
  return actionAgentApi<unknown>(
    `/agent-profiles/${id}/validate-payload`,
    {
      method: 'POST',
      body: JSON.stringify({ payload }),
    },
    'Failed to validate payload',
  );
}

/**
 *
 * @param offset
 * @param limit
 */
export async function getAgentTasks(offset = 0, limit = 20) {
  const safeLimit = Math.min(Math.max(limit, 1), 200);
  const safeOffset = Math.max(offset, 0);
  const params = new URLSearchParams({
    offset: String(safeOffset),
    limit: String(safeLimit),
  });
  const { response, json } = await requestAgentApi<AgentTask[]>(
    `/agent-tasks?${params}`,
    { method: 'GET' },
    'Failed to load agent tasks',
  );
  const data = json.data ?? [];
  const totalCount = Number(response.headers.get('Items-Count') ?? '0');
  const hasTotalCount = Number.isFinite(totalCount) && totalCount > 0;

  return {
    data,
    totalCount,
    hasMore: hasTotalCount
      ? safeOffset + data.length < totalCount
      : data.length === safeLimit,
  };
}

/**
 *
 * @param id
 */
export async function getAgentTask(id: number) {
  const { json } = await requestAgentApi<AgentTask>(
    `/agent-tasks/${id}`,
    { method: 'GET' },
    'Failed to load agent task',
  );

  return json.data as AgentTask;
}

/**
 *
 * @param payload
 */
export async function createAgentTask(payload: AgentTaskPayload) {
  return actionAgentApi<AgentTask>(
    '/agent-tasks',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Failed to create agent task',
  );
}

/**
 *
 * @param id
 * @param payload
 */
export async function updateAgentTask(
  id: number,
  payload: Partial<AgentTaskPayload>,
) {
  return actionAgentApi<AgentTask>(
    `/agent-tasks/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    'Failed to update agent task',
  );
}

/**
 *
 * @param id
 */
export async function deleteAgentTask(id: number) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_URL}/agent-tasks/${id}`, {
    method: 'DELETE',
    headers: {
      ...authHeaders,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    const parsed = parseApiError(text, 'Failed to delete agent task');

    return {
      error: parsed.message,
      status: response.status,
    };
  }

  return { error: null, status: response.status };
}

/**
 *
 * @param id
 */
export async function dispatchAgentTask(id: number) {
  return actionAgentApi<unknown>(
    `/agent-tasks/${id}/dispatch`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
    'Failed to dispatch agent task',
  );
}

/**
 *
 */
export async function getAgentTasksMeta() {
  const { json } = await requestAgentApi<AgentTasksMeta>(
    '/agent-tasks/meta',
    { method: 'GET' },
    'Failed to load agent task metadata',
  );

  return json.data ?? {};
}

/**
 *
 */
export async function getAgentTools() {
  const { json } = await requestAgentApi<AgentToolDefinition[]>(
    '/agent-tools',
    { method: 'GET' },
    'Failed to load agent tools',
  );

  return json.data ?? [];
}

/**
 *
 * @param id
 */
export async function getAgentTaskRuns(id: number) {
  const { response, json } = await requestAgentApi<AgentTaskRun[]>(
    `/agent-tasks/${id}/runs`,
    { method: 'GET' },
    'Failed to load task runs',
  );

  return {
    data: json.data ?? [],
    totalCount: Number(response.headers.get('Items-Count') ?? '0'),
  };
}

/**
 *
 * @param id
 * @param runId
 */
export async function getAgentTaskRun(id: number, runId: number) {
  const { json } = await requestAgentApi<AgentTaskRun>(
    `/agent-tasks/${id}/runs/${runId}`,
    { method: 'GET' },
    'Failed to load task run',
  );

  return json.data as AgentTaskRun;
}
