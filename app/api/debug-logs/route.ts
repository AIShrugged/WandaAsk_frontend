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

  // Capture browser metadata from the incoming request.
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    undefined;
  const userAgent = req.headers.get('user-agent') ?? undefined;
  const referer = req.headers.get('referer') ?? undefined;
  // Push client-side log entries sent from the browser.
  const body = (await req.json()) as DebugLogEntry | DebugLogEntry[];
  const entries = Array.isArray(body) ? body : [body];

  for (const entry of entries) {
    pushLog({
      ...entry,
      source: 'client',
      clientIp: entry.clientIp ?? clientIp,
      userAgent: entry.userAgent ?? userAgent,
      referer: entry.referer ?? referer,
    });
  }

  return NextResponse.json({ ok: true });
}
