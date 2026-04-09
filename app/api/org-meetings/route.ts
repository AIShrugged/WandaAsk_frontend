import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { API_URL } from '@/shared/lib/config';
import { logApiError } from '@/shared/lib/logger';

import type { CalendarEventListItem } from '@/features/meetings/model/types';
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
 * GET /api/org-meetings?offset=0&limit=20&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
 * Proxies to the backend organization calendar endpoint.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const offset = parsePositiveInt(searchParams.get('offset'), 0);
  const requestedLimit = parsePositiveInt(
    searchParams.get('limit'),
    DEFAULT_LIMIT,
  );
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  });

  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);

  const backendUrl = `${API_URL}/calendar-events/organization?${params.toString()}`;

  const backendRes = await fetch(backendUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!backendRes.ok) {
    const body = await backendRes.text();

    logApiError({
      method: 'GET',
      url: backendUrl,
      status: backendRes.status,
      statusText: backendRes.statusText,
      body,
    });

    return NextResponse.json(
      { error: 'Failed to load organization meetings' },
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
