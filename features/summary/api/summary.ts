'use server';

import { API_URL } from '@/shared/lib/config';
import { httpClient } from '@/shared/lib/httpClient';

import type { DashboardApiResponse } from '@/features/summary/types';

/**
 * getSummaryData.
 * @returns Promise with the full dashboard summary response, or null on error.
 */
export async function getSummaryData(): Promise<DashboardApiResponse | null> {
  try {
    const result = await httpClient<DashboardApiResponse>(
      `${API_URL}/dashboard`,
    );

    return result.data ?? null;
  } catch {
    return null;
  }
}
