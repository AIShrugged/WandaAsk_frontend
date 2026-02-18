'use server';

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

  const json: UserProps = await res.json();

  return { data: json };
});
