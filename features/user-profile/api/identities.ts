'use server';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { logApiError } from '@/shared/lib/logger';

import type { Identity } from '../types';
import type { ApiResponse } from '@/shared/types/common';
import type { ActionResult } from '@/shared/types/server-action';

const IDENTITIES_URL = `${API_URL}/users/me/identities`;

/**
 * getIdentities — fetches all linked external channel identities for the authenticated user.
 * @returns Array of Identity objects, or empty array on error.
 */
export async function getIdentities(): Promise<Identity[]> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(IDENTITIES_URL, {
    headers: authHeaders,
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();

    logApiError({
      method: 'GET',
      url: IDENTITIES_URL,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

    return [];
  }

  const json = (await res.json()) as ApiResponse<Identity[]>;

  return json.data ?? [];
}

/**
 * linkIdentity — links a new external channel identity for the authenticated user.
 * @param data - Link payload.
 * @param data.channel - The channel name (e.g. "telegram", "zoom").
 * @param data.identifier - The channel-specific identifier (e.g. Telegram user ID).
 * @returns ActionResult containing the created Identity on success.
 */
export async function linkIdentity(data: {
  channel: string;
  identifier: string;
}): Promise<ActionResult<Identity>> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(IDENTITIES_URL, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();

    logApiError({
      method: 'POST',
      url: IDENTITIES_URL,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

    if (res.status === 409) {
      return {
        data: null,
        error: 'This identity is already linked to another user.',
        errorCode: 'IDENTITY_CONFLICT',
      };
    }

    if (res.status === 404) {
      try {
        const json = JSON.parse(text) as { message?: string };

        return { data: null, error: json.message ?? 'Channel not found.' };
      } catch {
        return { data: null, error: 'Channel not found.' };
      }
    }

    return { data: null, error: 'Failed to link identity. Please try again.' };
  }

  const json = (await res.json()) as ApiResponse<Identity>;

  if (!json.data) {
    return { data: null, error: 'No data returned from server.' };
  }

  return { data: json.data, error: null };
}

/**
 * unlinkIdentity — removes a linked identity by its profile ID.
 * @param profileId - The identity record ID to unlink.
 * @returns ActionResult.
 */
export async function unlinkIdentity(profileId: number): Promise<ActionResult> {
  const authHeaders = await getAuthHeaders();

  const url = `${IDENTITIES_URL}/${profileId}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders,
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
      error: 'Failed to unlink identity. Please try again.',
    };
  }

  return { data: undefined, error: null };
}
