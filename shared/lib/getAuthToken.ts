import { cookies } from 'next/headers';

export async function getAuthToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) throw new Error('Unauthorized');

  return token;
}

export async function getAuthHeaders() {
  const token = await getAuthToken();

  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}
