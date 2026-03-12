'use server';

import { redirect } from 'next/navigation';
import { cache } from 'react';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';

import type { UserProps } from '@/entities/user';

export const getUser = cache(async () => {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}/users/me`, {
    method: 'GET',
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) {
      redirect('/api/auth/clear-session');
    }

    return { data: null };
  }

  const json: UserProps = await res.json();

  return { data: json };
});
