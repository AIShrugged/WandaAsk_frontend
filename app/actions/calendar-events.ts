'use server';

import { revalidatePath } from 'next/cache';

import { getAuthHeaders } from '@/shared/lib/getAuthToken';

import type { EventProps } from '@/features/event/model/types';
import type { ApiResponse } from '@/shared/types/common';

export async function getEvent(id: string) {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${process.env.API_URL}/calendar-events/${id}`, {
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

  const res = await fetch(`${process.env.API_URL}/calendar-events?limit=50`, {
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

  const res = await fetch(
    `${process.env.API_URL}/calendar-events/${eventId}/bot/require`,
    {
      method: 'POST',
      cache: 'no-store',
      headers: {
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    throw new Error('Failed to switchBot');
  }

  revalidatePath('/dashboard/calendar');

  return await res.json();
}
