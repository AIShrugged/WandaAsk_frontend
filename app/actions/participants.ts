'use server';

import { revalidatePath } from 'next/cache';
import { cache } from 'react';

import { API_URL } from '@/app/constants/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';

import type {
  AttendeeProps,
  GuestProps,
} from '@/features/participants/model/types';
import type { ApiResponse } from '@/shared/types/common';

export const getAttendees = cache(
  async (id: string): Promise<ApiResponse<AttendeeProps[]>> => {
    const authHeaders = await getAuthHeaders();

    const res = await fetch(`${API_URL}/calendar-events/${id}/participants`, {
      method: 'GET',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `getMethodologies failed: ${res.status} ${res.statusText} — ${text}`,
      );
    }

    const json: ApiResponse<AttendeeProps[]> = await res.json();

    if (!json.success || !json.data) {
      throw new Error(json.error ?? 'Invalid API response');
    }

    return { data: json.data };
  },
);

export const getGuests = cache(
  async (id: string): Promise<ApiResponse<GuestProps[]>> => {
    const authHeaders = await getAuthHeaders();

    const res = await fetch(`${API_URL}/calendar-events/${id}/profiles`, {
      method: 'GET',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `getMethodologies failed: ${res.status} ${res.statusText} — ${text}`,
      );
    }

    const json: ApiResponse<GuestProps[]> = await res.json();

    if (!json.success || !json.data) {
      throw new Error(json.error ?? 'Invalid API response');
    }

    return { data: json.data };
  },
);

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
    `${API_URL}/calendar-events/${eventId}/participants/${participantId}/set-profile`,
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
