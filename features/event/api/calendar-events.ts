'use server';

import { revalidatePath } from 'next/cache';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { ROUTES } from '@/shared/lib/routes';

import type { EventProps } from '@/entities/event';
import type { MeetingTask } from '@/features/meeting/types';
import type {
  CalendarEventDetailResponse,
  CalendarEventListItem,
} from '@/features/meetings/model/types';
import type { ApiResponse } from '@/shared/types/common';

/**
 * getEvent.
 * @param id - id.
 * @returns Promise.
 */
export async function getEvent(id: string) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/calendar-events/${id}`, {
    method: 'GET',
    headers: {
      ...authHeaders,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to getSummary');
  }

  const json: ApiResponse<EventProps> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  return {
    data: json.data,
    status: json.status,
  };
}

/**
 * getEvents.
 * @returns Promise.
 */
export async function getEvents() {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/calendar-events?limit=50`, {
    method: 'GET',
    headers: {
      ...authHeaders,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to getEvents');
  }

  const json: ApiResponse<EventProps[]> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  return {
    data: json.data,
    status: json.status,
  };
}

/**
 * getCalendarEvents.
 * @returns Promise.
 */
export async function getCalendarEvents() {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/calendar-events`, {
    method: 'GET',
    headers: {
      ...authHeaders,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to getCalendarEvents');
  }

  const json: ApiResponse<CalendarEventListItem[]> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  return {
    data: json.data,
    status: json.status,
  };
}

/**
 * getCalendarEventDetail.
 * @param calendarEventId - calendarEventId.
 * @returns Promise.
 */
export async function getCalendarEventDetail(calendarEventId: string | number) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(
    `${API_URL}/calendar-events/${calendarEventId}/detail`,
    {
      method: 'GET',
      headers: {
        ...authHeaders,
      },
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    throw new Error('Failed to getCalendarEventDetail');
  }

  const json: ApiResponse<CalendarEventDetailResponse> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  return {
    data: json.data,
    status: json.status,
  };
}

/**
 * switchBot.
 * @param eventId - eventId.
 * @param botRequired - botRequired.
 * @returns Promise.
 */
export async function switchBot(eventId: number, botRequired: boolean) {
  const authHeaders = await getAuthHeaders();
  const payload = {
    calendar_event_id: eventId,
    required_bot: botRequired,
  };
  const res = await fetch(`${API_URL}/calendar-events/${eventId}/bot/require`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      ...authHeaders,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to switchBot');
  }

  revalidatePath(ROUTES.DASHBOARD.CALENDAR);

  return await res.json();
}

/**
 * getFollowUps.
 * @param id - id.
 * @returns Promise.
 */
export async function getFollowUps(id: number) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(
    `${API_URL}/calendar-events/${id}/followups?limit=50`,
    {
      method: 'GET',
      headers: {
        ...authHeaders,
      },
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    return null;
  }

  return res.json();
}

/**
 * getEventFollowUp.
 * @param calendarEventId - calendarEventId.
 * @returns Promise.
 */
export const getEventFollowUp = async (calendarEventId: number | string) => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(
    `${API_URL}/calendar-events/${calendarEventId}/followup`,
    {
      headers: {
        ...authHeaders,
      },
      cache: 'no-store',
    },
  );

  if (res.status === 404) {
    return { data: null };
  }

  if (!res.ok) {
    const text = await res.text();

    throw new Error(`${text}`);
  }

  const json = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  return { data: json.data };
};

/**
 * getMeetingTasks — fetches AI-extracted tasks for a calendar event.
 * @param calendarEventId - The calendar event ID.
 * @returns Array of MeetingTask objects.
 */
export async function getMeetingTasks(
  calendarEventId: string,
): Promise<MeetingTask[]> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(
    `${API_URL}/calendar-events/${calendarEventId}/tasks`,
    {
      headers: { ...authHeaders },
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to load tasks: ${res.status}`);
  }

  const json: ApiResponse<MeetingTask[]> = await res.json();

  return json.data ?? [];
}
