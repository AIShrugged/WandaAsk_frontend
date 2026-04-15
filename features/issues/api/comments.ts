'use server';

import { revalidatePath } from 'next/cache';

import { parseApiError } from '@/shared/lib/apiError';
import { API_URL } from '@/shared/lib/config';
import { ServerError } from '@/shared/lib/errors';
import { httpClient, httpClientList } from '@/shared/lib/httpClient';

import type { IssueComment } from '@/features/issues/model/types';
import type { ActionResult } from '@/shared/types/server-action';

export async function getIssueComments(
  issueId: number,
): Promise<IssueComment[]> {
  const result = await httpClientList<IssueComment>(
    `${API_URL}/issues/${issueId}/comments`,
  );
  return result.data ?? [];
}

export async function createIssueComment(
  issueId: number,
  payload: { content: string; parent_id?: number | null },
): Promise<ActionResult<IssueComment>> {
  try {
    const { data } = await httpClient<IssueComment>(
      `${API_URL}/issues/${issueId}/comments`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      },
    );
    revalidatePath(`/dashboard/issues/${issueId}`);
    return { data, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to post comment',
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

export async function updateIssueComment(
  issueId: number,
  commentId: number,
  content: string,
): Promise<ActionResult<IssueComment>> {
  try {
    const { data } = await httpClient<IssueComment>(
      `${API_URL}/comments/${commentId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ content }),
        headers: { 'Content-Type': 'application/json' },
      },
    );
    revalidatePath(`/dashboard/issues/${issueId}`);
    return { data, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to update comment',
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

export async function deleteIssueComment(
  issueId: number,
  commentId: number,
): Promise<ActionResult<null>> {
  try {
    await httpClient(`${API_URL}/comments/${commentId}`, { method: 'DELETE' });
    revalidatePath(`/dashboard/issues/${issueId}`);
    return { data: null, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to delete comment',
      );
      return { data: null, error: parsed.message };
    }
    throw error;
  }
}
