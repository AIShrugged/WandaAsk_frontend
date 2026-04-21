'use server';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';

/**
 * attachCalendar — initiates Google OAuth flow.
 * Returns the Google redirect URL on success.
 * Throws a user-friendly error message on failure.
 * @returns Google OAuth redirect URL.
 */
export async function attachCalendar(): Promise<string> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/google/oauth`, {
    method: 'POST',
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();

    let errorCode: string | undefined;

    try {
      const json = JSON.parse(text) as { meta?: { error_code?: string } };

      errorCode = json.meta?.error_code;
    } catch {
      // Non-JSON body — ignore
    }

    if (errorCode === 'SOURCE_ALREADY_EXISTS') {
      throw new Error('Google Calendar is already connected to your account.');
    }

    throw new Error('Failed to connect Google Calendar. Please try again.');
  }

  const { data } = await res.json();

  return data.redirect as string;
}
