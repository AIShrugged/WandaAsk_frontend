'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { ROUTES } from '@/shared/lib/routes';

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete('token');
  cookieStore.delete('organization_id');

  redirect(ROUTES.AUTH.LOGIN);
}

export async function logout(): Promise<void> {
  const authHeaders = await getAuthHeaders();
  const cookieStore = await cookies();

  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
  } finally {
    // Always clear local session, even if the backend call fails.
    cookieStore.delete('token');
    cookieStore.delete('organization_id');
  }

  redirect(ROUTES.AUTH.LOGIN);
}
