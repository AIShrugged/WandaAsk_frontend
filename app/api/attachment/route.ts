import { type NextRequest, NextResponse } from 'next/server';

import { API_URL } from '@/shared/lib/config';
import { getAuthToken } from '@/shared/lib/getAuthToken';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const id = request.nextUrl.searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  let token: string;

  try {
    token = await getAuthToken();
  } catch {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const upstream = await fetch(`${API_URL}/attachments/${id}/download`, {
    headers: { Authorization: `Bearer ${token}`, Accept: '*/*' },
    cache: 'no-store',
  });

  if (!upstream.ok) {
    const body = await upstream.text();

    // eslint-disable-next-line no-console
    console.error(
      '[attachment proxy] upstream error',
      upstream.status,
      upstream.url,
      body,
    );

    return NextResponse.json(
      {
        error: 'Failed to fetch attachment',
        status: upstream.status,
        detail: body,
      },
      { status: upstream.status },
    );
  }

  const headers = new Headers({
    'Content-Type':
      upstream.headers.get('Content-Type') ?? 'application/octet-stream',
  });
  const contentDisposition = upstream.headers.get('Content-Disposition');

  if (contentDisposition)
    headers.set('Content-Disposition', contentDisposition);

  return new NextResponse(upstream.body, { status: 200, headers });
}
