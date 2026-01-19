'use server';

import { API_URL } from '@/app/constants/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';

export async function attachCalendar() {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL} /google/oauth`, {
    method: 'POST',
    headers: {
      ...authHeaders,
    },
    credentials: 'include',
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to initiate Google OAuth: ${res.status} ${text}`);
  }

  const { data } = await res.json();
  return data.redirect as string;
}
