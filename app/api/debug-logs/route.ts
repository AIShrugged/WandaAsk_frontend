import { NextRequest, NextResponse } from 'next/server';

import { clearLogs, getLogs, pushLog } from '@/shared/lib/debugLogBuffer';
import { isDev } from '@/shared/lib/logger';

import type { DebugLogEntry } from '@/shared/lib/debugLogBuffer';

/**
 *
 */
export function GET(): NextResponse {
  if (!isDev) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  return NextResponse.json(getLogs());
}

/**
 *
 * @param req
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isDev) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const action = req.nextUrl.searchParams.get('action');

  if (action === 'clear') {
    clearLogs();

    return NextResponse.json({ ok: true });
  }

  // Push client-side log entries sent from the browser.
  const body = (await req.json()) as DebugLogEntry | DebugLogEntry[];

  const entries = Array.isArray(body) ? body : [body];

  for (const entry of entries) {
    pushLog({ ...entry, source: 'client' });
  }

  return NextResponse.json({ ok: true });
}