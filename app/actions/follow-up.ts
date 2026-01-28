import { API_URL } from '@/app/constants/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';

export async function getfollowUp(id: number) {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}/followups/${id}`, {
    method: 'GET',
    headers: {
      ...authHeaders,
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}
