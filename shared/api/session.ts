'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { ROUTES } from '@/shared/lib/routes';

/**
 * clearSession.
 * @returns Promise.
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete('token');
  cookieStore.delete('organization_id');

  redirect(ROUTES.AUTH.LOGIN);
}

/**
 * logout.
 * @returns Promise.
 */
export async function logout(): Promise<void> {
  const authHeaders = await getAuthHeaders();

  const cookieStore = await cookies();

  const res = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (res.ok) {
    cookieStore.delete('token');
    cookieStore.delete('organization_id');

    redirect(ROUTES.AUTH.LOGIN);
  }
}
