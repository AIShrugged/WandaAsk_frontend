'use server';

import { API_URL } from '@/shared/lib/config';
import { httpClient } from '@/shared/lib/httpClient';

import type { IssueHistoryPeriod, IssueStatsHistory } from '../model/types';

export async function getIssueStatsHistory(
  period: IssueHistoryPeriod,
  range?: number,
): Promise<IssueStatsHistory> {
  const params = new URLSearchParams({ period });
  if (range !== undefined) params.set('range', String(range));
  const { data } = await httpClient<IssueStatsHistory>(
    `${API_URL}/issues/stats/history?${params}`,
  );
  return data!;
}
