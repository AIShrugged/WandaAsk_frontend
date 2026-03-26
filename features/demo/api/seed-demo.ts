'use server';

import { redirect } from 'next/navigation';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { logApiError } from '@/shared/lib/logger';

import type {
  SeedDemoParams,
  SeedDemoResult,
} from '@/features/demo/model/types';

type DemoSeedApiResponse = {
  success: boolean;
  data: {
    status: string;
    progress_percent: number | null;
    current_step_label: string | null;
  } | null;
  message: string;
  status: number;
  meta: Record<string, unknown>;
};

/**
 * seedDemo.
 * @param params - params.
 * @returns Promise.
 */
export async function seedDemo(
  params: SeedDemoParams,
): Promise<SeedDemoResult> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/demo/seed`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
    cache: 'no-store',
  });
  const text = await res.text();
  let json: DemoSeedApiResponse | undefined;
  try {
    json = JSON.parse(text) as DemoSeedApiResponse;
  } catch {
    // non-JSON response body
  }

  if (!res.ok) {
    if (res.status === 401) {
      redirect('/api/auth/clear-session');
    }

    logApiError({
      method: 'POST',
      url: `${API_URL}/demo/seed`,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

    throw new Error(
      json?.message ?? 'Failed to generate demo data. Please try again.',
    );
  }

  return { message: json?.message ?? 'Demo generation started' };
}
