'use server';

import { revalidatePath } from 'next/cache';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { logApiError } from '@/shared/lib/logger';
import { ROUTES } from '@/shared/lib/routes';

import type { ActionResult } from '@/shared/types/server-action';

/**
 * updateProfile — updates the authenticated user's display name.
 * @param data - Request payload.
 * @param data.name - New display name (1–255 characters).
 * @returns ActionResult.
 */
export async function updateProfile(data: {
  name: string;
}): Promise<ActionResult> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/users/me`, {
    method: 'PATCH',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();

    logApiError({
      method: 'PATCH',
      url: `${API_URL}/users/me`,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

    return { data: null, error: 'Failed to update profile. Please try again.' };
  }

  revalidatePath(ROUTES.DASHBOARD.PROFILE);

  return { data: undefined, error: null };
}

/**
 * changePassword — changes the authenticated user's password via PATCH /users/me.
 * @param data - Request payload.
 * @param data.current_password - The user's current password.
 * @param data.password - The new password (min 8 characters).
 * @param data.password_confirmation - Must match `password`.
 * @returns ActionResult with optional errorCode for field-level handling.
 */
export async function changePassword(data: {
  current_password: string;
  password: string;
  password_confirmation: string;
}): Promise<ActionResult> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/users/me`, {
    method: 'PATCH',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();

    logApiError({
      method: 'PATCH',
      url: `${API_URL}/users/me`,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

    try {
      const json = JSON.parse(text) as {
        message?: string;
        meta?: { error_code?: string };
      };

      if (json.meta?.error_code === 'INVALID_CURRENT_PASSWORD') {
        return {
          data: null,
          error: 'Current password is incorrect',
          errorCode: 'INVALID_CURRENT_PASSWORD',
        };
      }

      if (json.message) {
        return { data: null, error: json.message };
      }
    } catch {
      // use default message
    }

    return {
      data: null,
      error: 'Failed to change password. Please try again.',
    };
  }

  return { data: undefined, error: null };
}
