import { NextResponse } from 'next/server';

import { API_URL } from '@/shared/lib/config';
import { getAuthToken } from '@/shared/lib/getAuthToken';

import type { NextRequest } from 'next/server';

type ExportFormat = 'pdf' | 'excel' | 'html';

const ALLOWED_FORMATS = new Set<ExportFormat>(['pdf', 'excel', 'html']);

/**
 * GET /api/follow-ups/{id}/export?format=pdf|excel|html
 *
 * Proxies the export request to the Laravel backend and streams the binary
 * file back to the browser. Auth token is read from the httpOnly session cookie.
 * @param request
 * @param root0
 * @param root0.params
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 422 });
  }

  const format = (request.nextUrl.searchParams.get('format') ??
    'pdf') as ExportFormat;

  if (!ALLOWED_FORMATS.has(format)) {
    return NextResponse.json({ error: 'Invalid format' }, { status: 422 });
  }

  let token: string;

  try {
    token = await getAuthToken();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const backendRes = await fetch(
    `${API_URL}/followups/${id}/export?format=${format}`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: '*/*' },
      cache: 'no-store',
    },
  );

  if (!backendRes.ok) {
    return NextResponse.json(
      { error: 'Export failed' },
      { status: backendRes.status },
    );
  }

  const contentType =
    backendRes.headers.get('Content-Type') ?? 'application/octet-stream';
  const contentDisposition =
    backendRes.headers.get('Content-Disposition') ??
    `attachment; filename="followup.${format}"`;
  const blob = await backendRes.blob();

  return new NextResponse(blob, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': contentDisposition,
    },
  });
}
