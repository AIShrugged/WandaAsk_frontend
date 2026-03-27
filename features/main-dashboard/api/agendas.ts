'use server';

import { API_URL } from '@/shared/lib/config';
import { httpClientList } from '@/shared/lib/httpClient';

import type { MeetingAgenda } from '@/features/main-dashboard/model/agenda-types';

/**
 * getMyAgendas — fetches upcoming meeting agendas for the current user.
 * Returns both general and personal agendas for future events.
 */
export async function getMyAgendas(): Promise<MeetingAgenda[]> {
  const result = await httpClientList<MeetingAgenda>(`${API_URL}/me/agendas`);

  return result.data;
}
