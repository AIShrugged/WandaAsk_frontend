'use server';

import { API_URL } from '@/shared/lib/config';
import { httpClient } from '@/shared/lib/httpClient';

export interface IssueStatsDelta {
  in_progress: number;
  completed: number;
  overdue: number;
}

export interface IssueStats {
  total: number;
  in_progress: number;
  completed: number;
  overdue: number;
  open: number;
  paused: number;
  delta: IssueStatsDelta;
}

export async function getIssueStats(): Promise<IssueStats> {
  const { data } = await httpClient<IssueStats>(`${API_URL}/issues/stats`);
  return data!;
}
