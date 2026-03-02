'use server';

import { revalidatePath } from 'next/cache';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';

import type { EventProps } from '@/entities/event';
import type { ApiResponse } from '@/shared/types/common';

export async function getEvent(id: string) {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}/calendar-events/${id}`, {
    method: 'GET',
    headers: {
      ...authHeaders,
    },
    next: { revalidate: 60 },
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

export async function getEvents() {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}/calendar-events?limit=50`, {
    method: 'GET',
    headers: {
      ...authHeaders,
    },
    next: { revalidate: 60 },
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

  revalidatePath('/dashboard/calendar');

  return await res.json();
}

export async function getFollowUps(id: number) {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(
    `${API_URL}/calendar-events/${id}/followups?limit=50`,
    {
      method: 'GET',
      headers: {
        ...authHeaders,
      },
      next: { revalidate: 60 },
    },
  );

  if (!res.ok) {
    return null;
  }

  return res.json();
}

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
