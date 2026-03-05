import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';

/**
 * getSources.
 * @returns Promise.
 */
export async function getSources() {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}/sources`, {
    headers: {
      ...authHeaders,
    },
    cache: 'no-store',
  });

  if (!res.ok) return null;

  return res.json();
}
