import { onboardingDraftResponseSchema } from '@/features/onboarding/model/schemas';
import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId');

  if (!orgId) {
    return Response.json({ error: 'Missing orgId' }, { status: 400 });
  }

  let headers: Record<string, string>;

  try {
    headers = await getAuthHeaders();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const res = await fetch(`${API_URL}/organizations/${orgId}/drafts/latest`, {
    headers,
    cache: 'no-store',
  });

  if (res.status === 404) {
    return Response.json({ status: 'not_found' });
  }

  if (!res.ok) {
    return Response.json({ error: 'Backend error' }, { status: res.status });
  }

  const json = await res.json();
  const parsed = onboardingDraftResponseSchema.safeParse(json.data);

  if (!parsed.success) {
    return Response.json({ error: 'Invalid response shape' }, { status: 502 });
  }

  return Response.json(parsed.data);
}
