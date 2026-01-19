import { API_URL } from '@/app/constants/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';

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
