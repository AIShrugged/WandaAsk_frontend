'use server';

import { API_URL } from '@/shared/lib/config';
import { httpClient } from '@/shared/lib/httpClient';

export async function generateNudge(date?: string): Promise<string | null> {
  const params = date ? `?date=${date}` : '';
  const { data } = await httpClient<{ nudge: string | null }>(
    `${API_URL}/me/today/nudge${params}`,
    { method: 'POST' },
  );

  return data?.nudge ?? null;
}
