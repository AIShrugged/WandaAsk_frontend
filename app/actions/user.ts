'use server';

import { cache } from 'react';

import { API_URL } from '@/app/constants/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';

export const getUser = cache(async () => {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}/users/me`, {
    method: 'GET',
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch user');

  const json = await res.json();
  return { data: json };
});
