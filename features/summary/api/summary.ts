'use server';

import { API_URL } from '@/shared/lib/config';
import { httpClient } from '@/shared/lib/httpClient';

import type { DashboardApiResponse } from '@/features/summary/types';

/**
 * getSummaryData.
 * @returns Promise with the full dashboard summary response.
 */
export async function getSummaryData(): Promise<DashboardApiResponse> {
  const result = await httpClient<DashboardApiResponse>(`${API_URL}/dashboard`);

  return result.data as DashboardApiResponse;
}
