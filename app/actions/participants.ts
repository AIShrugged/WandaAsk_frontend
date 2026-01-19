'use server';

import { revalidatePath } from 'next/cache';

import { getAuthHeaders } from '@/shared/lib/getAuthToken';

import type {
  AttendeeProps,
  GuestProps,
} from '@/features/participants/model/types';
import type { ApiResponse } from '@/shared/types/common';

export async function getAttendees(id: number) {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(
    `${process.env.API_URL}/calendar-events/${id}/participants`,
    {
      method: 'GET',
      headers: {
        ...authHeaders,
      },
      next: { revalidate: 60 },
    },
  );

  const json: ApiResponse<AttendeeProps[]> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  return {
    data: json.data,
    status: json.status,
  };
}

export async function getGuests(id: number) {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(
    `${process.env.API_URL}/calendar-events/${id}/profiles`,
    {
      method: 'GET',
      headers: {
        ...authHeaders,
      },
      next: { revalidate: 60 },
    },
  );

  const json: ApiResponse<GuestProps[]> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  return {
    data: json.data,
    status: json.status,
  };
}

export async function setProfile(
  eventId: number,
  participantId: number,
  guestId: string | null,
) {
  const authHeaders = await getAuthHeaders();

  const payload: any = {
    calendar_event_id: eventId,
    participant_id: participantId,
    profile_id: guestId,
  };

  const res = await fetch(
    `${process.env.API_URL}/calendar-events/${eventId}/participants/${participantId}/set-profile`,
    {
      method: 'POST',
      headers: {
        ...authHeaders,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error('setProfile failed:', res.status, errorText);
    throw new Error('Не удалось сохранить сопоставление');
  }

  revalidatePath('/dashboard/meeting');

  return { success: true };
}
