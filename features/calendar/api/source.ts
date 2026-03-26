'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { logApiError } from '@/shared/lib/logger';
import { ROUTES } from '@/shared/lib/routes';

import type { Source } from '@/entities/source';
import type { ApiResponse } from '@/shared/types/common';
import type { ActionResult } from '@/shared/types/server-action';

/**
 * getSources — fetches the list of calendar sources for the authenticated user.
 * @returns Array of Source objects, or empty array on error.
 */
export async function getSources(): Promise<Source[]> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/sources`, {
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();

    logApiError({
      url: `${API_URL}/sources`,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

    return [];
  }

  const json: ApiResponse<Source[]> = await res.json();

  return json.data ?? [];
}

/**
 * detachCalendar — removes a calendar source (disconnects Google Calendar).
 * Calls DELETE /v1/sources/{id}.
 * @param sourceId - The numeric ID of the Source to delete.
 * @returns ActionResult.
 */
export async function detachCalendar(sourceId: number): Promise<ActionResult> {
  const authHeaders = await getAuthHeaders();
  const url = `${API_URL}/sources/${sourceId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();

    logApiError({
      method: 'DELETE',
      url,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

    return {
      data: null,
      error: 'Failed to disconnect Google Calendar. Please try again.',
    };
  }

  revalidatePath(ROUTES.DASHBOARD.CALENDAR, 'layout');
  revalidatePath(ROUTES.DASHBOARD.PROFILE, 'layout');
  redirect(ROUTES.DASHBOARD.CALENDAR);
}

/**
 * detachCalendarFromProfile — removes a calendar source without redirecting.
 * Used on the Profile page where navigation should stay on /dashboard/profile.
 * @param sourceId - The numeric ID of the Source to delete.
 * @returns ActionResult.
 */
export async function detachCalendarFromProfile(
  sourceId: number,
): Promise<ActionResult> {
  const authHeaders = await getAuthHeaders();
  const url = `${API_URL}/sources/${sourceId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();

    logApiError({
      method: 'DELETE',
      url,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

    return {
      data: null,
      error: 'Failed to disconnect Google Calendar. Please try again.',
    };
  }

  revalidatePath(ROUTES.DASHBOARD.CALENDAR, 'layout');
  revalidatePath(ROUTES.DASHBOARD.PROFILE, 'layout');

  return { data: undefined, error: null };
}
