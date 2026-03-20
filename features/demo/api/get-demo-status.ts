'use server';

import { redirect } from 'next/navigation';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { logApiError } from '@/shared/lib/logger';

export type DemoGenerationStatus =
  | 'generating'
  | 'ready'
  | 'failed'
  | 'pending';

export interface DemoStatusResult {
  status: DemoGenerationStatus;
  progress_percent: number | null;
  current_step_label: string | null;
  error: string | null;
  completed_at: string | null;
}

type DemoStatusApiResponse = {
  success: boolean;
  data: DemoStatusResult | null;
  message: string;
  status: number;
  meta: Record<string, unknown>;
};

/**
 * getDemoStatus.
 * @returns Promise.
 */
export async function getDemoStatus(): Promise<DemoStatusResult | null> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}/demo/status`, {
    method: 'GET',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    if (res.status === 401) {
      redirect('/api/auth/clear-session');
    }

    const text = await res.text();

    logApiError({
      method: 'GET',
      url: `${API_URL}/demo/status`,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });
    throw new Error('Failed to get demo status. Please try again.');
  }

  const json: DemoStatusApiResponse = await res.json();

  if (!json.success || !json.data) {
    return null;
  }

  return json.data;
}
