'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { parseApiError } from '@/shared/lib/apiError';
import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { logApiError } from '@/shared/lib/logger';

import type {
  TeamNotificationSetting,
  TeamNotificationSettingCreateDTO,
} from '@/features/teams/model/types';
import type { ApiResponse } from '@/shared/types/common';

export async function getTeamNotificationSettings(
  teamId: number | string,
): Promise<TeamNotificationSetting[]> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}/teams/${teamId}/notification-settings`, {
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');

    const text = await res.text();

    logApiError({ url: res.url, status: res.status, statusText: res.statusText, body: text });
    throw new Error('Failed to load notification settings');
  }

  const json: ApiResponse<TeamNotificationSetting[]> = await res.json();

  if (!json.success || !json.data) throw new Error('Invalid API response');

  return json.data;
}

export async function createTeamNotificationSetting(
  teamId: number | string,
  data: TeamNotificationSettingCreateDTO,
): Promise<{ error?: string; fieldErrors?: Record<string, string> }> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}/teams/${teamId}/notification-settings`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');

    const text = await res.text();
    const parsed = parseApiError(text, 'Failed to create notification setting');

    if (res.status === 422) {
      return { error: parsed.message, fieldErrors: parsed.fieldErrors };
    }

    return { error: parsed.message };
  }

  revalidatePath(`/dashboard/teams/${teamId}`);

  return {};
}

export async function updateTeamNotificationSetting(
  teamId: number | string,
  settingId: number,
  enabled: boolean,
): Promise<{ error?: string }> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(
    `${API_URL}/teams/${teamId}/notification-settings/${settingId}`,
    {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');

    return { error: 'Failed to update notification setting' };
  }

  revalidatePath(`/dashboard/teams/${teamId}`);

  return {};
}

export async function deleteTeamNotificationSetting(
  teamId: number | string,
  settingId: number,
): Promise<{ error?: string }> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(
    `${API_URL}/teams/${teamId}/notification-settings/${settingId}`,
    {
      method: 'DELETE',
      headers: { ...authHeaders },
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');

    return { error: 'Failed to delete notification setting' };
  }

  revalidatePath(`/dashboard/teams/${teamId}`);

  return {};
}
