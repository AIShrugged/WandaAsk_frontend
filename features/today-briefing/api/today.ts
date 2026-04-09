'use server';

import { API_URL } from '@/shared/lib/config';
import { httpClient } from '@/shared/lib/httpClient';

import type { TodayBriefing } from '../model/types';

const EMPTY_BRIEFING: TodayBriefing = {
  state: 'empty',
  date: '',
  events: [],
  carried_tasks: [],
  waiting_on_you: [],
  stale: [],
  nudge: null,
};

export async function getTodayBriefing(date?: string): Promise<TodayBriefing> {
  const params = date ? `?date=${date}` : '';
  const { data } = await httpClient<TodayBriefing>(
    `${API_URL}/me/today${params}`,
  );

  return data ?? EMPTY_BRIEFING;
}
