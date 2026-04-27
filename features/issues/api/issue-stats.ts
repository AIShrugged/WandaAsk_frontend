'use server';

import { API_URL } from '@/shared/lib/config';
import { httpClient } from '@/shared/lib/httpClient';

import type { IssueStats } from '../model/types';

export async function getIssueStats(): Promise<IssueStats> {
  const { data } = await httpClient<IssueStats>(`${API_URL}/issues/stats`);
  return data!;
}
