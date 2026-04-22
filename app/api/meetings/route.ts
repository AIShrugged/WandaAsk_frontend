import { NextRequest, NextResponse } from 'next/server';

import { API_URL } from '@/shared/lib/config';
import { getAuthToken } from '@/shared/lib/getAuthToken';

import type { CalendarEventListItem } from '@/features/meetings';
import type { ApiResponse } from '@/shared/types/common';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

/**
 * GET /api/meetings?offset=0&limit=20
 */
export async function GET(request: NextRequest) {
  const offset = parsePositiveInt(
    request.nextUrl.searchParams.get('offset'),
    0,
  );
  const requestedLimit = parsePositiveInt(
    request.nextUrl.searchParams.get('limit'),
    DEFAULT_LIMIT,
  );
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);

  let token: string;

  try {
    token = await getAuthToken();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const backendRes = await fetch(
    `${API_URL}/calendar-events?offset=${offset}&limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    },
  );

  if (!backendRes.ok) {
    return NextResponse.json(
      { error: 'Failed to load meetings' },
      { status: backendRes.status },
    );
  }

  const json = (await backendRes.json()) as ApiResponse<
    CalendarEventListItem[]
  >;
  const totalCount = Number(backendRes.headers.get('Items-Count') ?? '0');

  return NextResponse.json({
    items: json.data ?? [],
    totalCount,
  });
}
