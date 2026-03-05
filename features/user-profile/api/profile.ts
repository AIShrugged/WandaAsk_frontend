'use server';

import { revalidatePath } from 'next/cache';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { logApiError } from '@/shared/lib/logger';

import type { ActionResult } from '@/shared/types/server-action';

/**
 * updateProfile.
 * @param data
 * @param data.name
 * @param data.email
 * @returns Promise.
 */
export async function updateProfile(data: {
  name: string;
  email: string;
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

  revalidatePath('/dashboard');

  return { data: undefined, error: null };
}

/**
 * changePassword.
 * @param data
 * @param data.current_password
 * @param data.password
 * @param data.password_confirmation
 * @returns Promise.
 */
export async function changePassword(data: {
  current_password: string;
  password: string;
  password_confirmation: string;
}): Promise<ActionResult> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}/users/me/password`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();

    logApiError({
      method: 'POST',
      url: `${API_URL}/users/me/password`,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

    let message = 'Failed to change password. Please try again.';
    try {
      const json = JSON.parse(text) as { message?: string };

      if (json.message) message = json.message;
    } catch {
      // use default message
    }

    return { data: null, error: message };
  }

  return { data: undefined, error: null };
}
