'use server';

import { API_URL } from '@/shared/lib/config';
import { httpClient } from '@/shared/lib/httpClient';

import type {
  LatestMeetingTasksData,
  UpcomingAgenda,
} from '@/features/main-dashboard/model/upcoming-agenda-types';

export async function getUpcomingAgenda(): Promise<UpcomingAgenda | null> {
  const result = await httpClient<UpcomingAgenda | null>(
    `${API_URL}/me/upcoming-agenda`,
  );

  return result.data ?? null;
}

export async function getLatestMeetingTasks(): Promise<LatestMeetingTasksData> {
  const result = await httpClient<LatestMeetingTasksData>(
    `${API_URL}/me/latest-tasks`,
  );

  return (
    result.data ?? {
      meeting_title: null,
      meeting_date: null,
      meeting_id: null,
      tasks: [],
      other_tasks: [],
    }
  );
}
