'use server';

import { redirect } from 'next/navigation';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { ROUTES } from '@/shared/lib/routes';

import type { FocusedIssue, FocusedIssuesMeta } from '../types';

interface FocusedIssuesEnvelope {
  success: boolean;
  data: FocusedIssue[];
  message: string;
  status: number;
  meta: FocusedIssuesMeta;
}

export async function getFocusedIssues(): Promise<{
  issues: FocusedIssue[];
  hasFocus: boolean;
  focusText: string | null;
  matchedCount: number;
}> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/me/issues/focused`, {
    method: 'GET',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) {
      redirect(ROUTES.AUTH.LOGIN);
    }
    throw new Error('Failed to load focused issues.');
  }

  const json: FocusedIssuesEnvelope = await res.json();

  if (!json.success) {
    return { issues: [], hasFocus: false, focusText: null, matchedCount: 0 };
  }

  return {
    issues: json.data ?? [],
    hasFocus: json.meta?.has_focus ?? false,
    focusText: json.meta?.focus_text ?? null,
    matchedCount: json.meta?.matched_count ?? 0,
  };
}
