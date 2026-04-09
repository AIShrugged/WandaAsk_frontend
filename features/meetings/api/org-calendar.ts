'use server';

import { API_URL } from '@/shared/lib/config';
import { httpClientList } from '@/shared/lib/httpClient';

import type { CalendarEventListItem } from '@/features/meetings/model/types';

/**
 * Fetch organization-wide bot meetings from the backend.
 * Returns meetings where required_bot=true across all org users.
 */
export async function getOrgCalendarEvents(
  offset: number,
  limit: number,
  dateFrom?: string,
  dateTo?: string,
) {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  });

  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);

  return httpClientList<CalendarEventListItem>(
    `${API_URL}/calendar-events/organization?${params.toString()}`,
  );
}
