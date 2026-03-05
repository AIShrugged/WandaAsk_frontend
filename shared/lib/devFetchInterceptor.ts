/**
 * Client-side fetch interceptor for development debugging.
 *
 * Patches `window.fetch` to log all outgoing requests and responses to the
 * browser's DevTools console with colour-coded, collapsible group entries.
 *
 * Logs per request:
 *   - Timestamp, method, URL, request ID
 *   - Headers, body (auto-parsed JSON)
 *   - Caller stack trace (best-effort with source maps)
 *   - X-Debug-Request-ID header injected for backend log correlation
 *
 * Logs per response:
 *   - Status, duration, response size
 *   - Next.js cache status (x-nextjs-cache)
 *   - ⚠ SLOW warning when duration > SLOW_THRESHOLD_MS
 *   - Response body (auto-parsed JSON)
 *
 * Returns a cleanup function that restores the original `window.fetch`.
 * Complete no-op in production (dead-code eliminated by Next.js build).
 */

import {
  SLOW_THRESHOLD_MS,
  captureCallerStack,
  formatBytes,
  formatTimestamp,
  isDev,
} from '@/shared/lib/logger';

// ── URL tag resolution (client-side) ───────────────────────────────────────

type ClientTag = 'NEXT' | 'EXT';

/**
 * resolveClientTag.
 * @param url - url.
 * @returns Result.
 */
function resolveClientTag(url: string): ClientTag | undefined {
  try {
    const origin = globalThis.location?.origin;

    if (!origin) return undefined;
    const urlOrigin = new URL(url).origin;

    if (urlOrigin === origin) return 'NEXT';

    return 'EXT';
  } catch {
    return undefined; // relative URLs need no tag
  }
}

// Flag to prevent double-patching on React StrictMode double-invoke / HMR.
const PATCHED_KEY = '__tribes_fetch_debug_patched';

const SKIP_PATTERNS = [
  '/_next/',
  '/favicon',
  '__nextjs',
  'webpack-hmr',
  '_rsc=',
];

/**
 * shouldSkip.
 * @param url - url.
 * @returns Result.
 */
function shouldSkip(url: string): boolean {
  return SKIP_PATTERNS.some((p) => {
    return url.includes(p);
  });
}

/**
 * extractUrl.
 * @param input - input.
 * @returns Result.
 */
function extractUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;

  if (input instanceof URL) return input.href;

  return (input as Request).url;
}

/**
 * tryJson.
 * @param text - text.
 * @returns Result.
 */
function tryJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * statusStyle.
 * @param status - status.
 * @returns Result.
 */
function statusStyle(status: number): string {
  if (status >= 500) return 'color:#ef4444;font-weight:bold';

  if (status >= 400) return 'color:#f59e0b;font-weight:bold';

  if (status >= 300) return 'color:#60a5fa;font-weight:bold';

  return 'color:#22c55e;font-weight:bold';
}

const LABEL = 'color:#94a3b8;font-weight:bold';

const MUTED = 'color:#6b7280;font-size:0.8em';

const MONO = 'font-family:monospace';

let _counter = 0;

/**
 * nextId.
 */
function nextId(): string {
  return `#${String(++_counter).padStart(4, '0')}`;
}

/**
 * Builds a new RequestInit with the X-Debug-Request-ID header injected.
 * Does not mutate the original init object.
 * @param init
 * @param id
 */
function withDebugHeader(init: RequestInit, id: string): RequestInit {
  const headers = new Headers(init.headers as HeadersInit | undefined);

  headers.set('X-Debug-Request-ID', id);

  return { ...init, headers };
}

// ── Helpers for log group building ─────────────────────────────────────────

/**
 * resolveReqColor.
 * @param slow - slow.
 * @param ok - ok.
 * @returns Result.
 */
function resolveReqColor(slow: boolean, ok: boolean): string {
  if (slow) return '#f97316';

  if (ok) return '#22c55e';

  return '#ef4444';
}

/**
 * buildTimeLabel.
 * @param slow - slow.
 * @param durationMs - durationMs.
 * @returns Result.
 */
function buildTimeLabel(slow: boolean, durationMs: number): string {
  if (slow) return `%c\u26A0 SLOW%c  ${String(durationMs)}ms`;

  return `%c%c${String(durationMs)}ms`;
}

/**
 * computeResponseSize.
 * @param res - res.
 * @param body - body.
 * @returns Result.
 */
function computeResponseSize(res: Response, body: unknown): string | undefined {
  const contentLength = res.headers.get('content-length');

  let byteCount = 0;

  if (contentLength) {
    byteCount = Number(contentLength);
  } else if (typeof body === 'string') {
    byteCount = body.length;
  } else {
    byteCount = JSON.stringify(body ?? '').length;
  }

  return byteCount > 0 ? formatBytes(byteCount) : undefined;
}

// ── Log helpers ────────────────────────────────────────────────────────────

/**
 * tagStyle.
 * @param tag - tag.
 * @returns Result.
 */
function tagStyle(tag: ClientTag | undefined): string {
  if (tag === 'NEXT') return 'color:#60a5fa;font-weight:bold';

  if (tag === 'EXT') return 'color:#a78bfa;font-weight:bold';

  return '';
}

/**
 * logReqGroup.
 * @param id
 * @param method
 * @param url
 * @param timestamp
 * @param init
 * @param caller
 * @param tag
 */
function logReqGroup(
  id: string,
  method: string,
  url: string,
  timestamp: string,
  init: RequestInit,
  caller: string | undefined,
  tag: ClientTag | undefined,
): void {
  // When a tag exists, show short path in the label and full URL inside the group.
  let urlDisplay = url;
  try {
    if (tag) urlDisplay = new URL(url).pathname;
  } catch {
    /* keep full url */
  }

  const tagLabel = tag ? `%c[${tag}]%c ` : '%c%c';

  const tagSt = tag ? tagStyle(tag) : '';

  // eslint-disable-next-line no-console
  console.groupCollapsed(
    `%c\u2B06 ${method}%c ` + tagLabel + `${urlDisplay} %c${id}  ${timestamp}`,
    'color:#38bdf8;font-weight:bold;' + MONO,
    'color:inherit;' + MONO,
    tagSt,
    'color:inherit;' + MONO,
    MUTED,
  );

  if (tag) {
    // eslint-disable-next-line no-console
    console.log('%cURL', LABEL, url);
  }

  if (init.headers) {
    // eslint-disable-next-line no-console
    console.log('%cHeaders', LABEL, init.headers);
  }

  if (init.body !== undefined && init.body !== null) {
    const body = typeof init.body === 'string' ? tryJson(init.body) : init.body;

    // eslint-disable-next-line no-console
    console.log('%cBody', LABEL, body);
  }

  if (caller) {
    // eslint-disable-next-line no-console
    console.log(
      '%cCaller\n   ' + caller,
      'color:#94a3b8;font-weight:bold;font-family:monospace;white-space:pre',
    );
  }

  // eslint-disable-next-line no-console
  console.groupEnd();
}

/**
 * logResGroup.
 * @param id
 * @param method
 * @param url
 * @param res
 * @param durationMs
 * @returns Promise.
 */
async function logResGroup(
  id: string,
  method: string,
  url: string,
  res: Response,
  durationMs: number,
): Promise<void> {
  const ct = res.headers.get('content-type') ?? '';

  const isStream =
    ct.includes('text/event-stream') || ct.includes('octet-stream');

  const slow = durationMs > SLOW_THRESHOLD_MS;

  // Collect response headers for display.
  const resHeaders: Record<string, string> = {};

  for (const [k, v] of res.headers.entries()) {
    resHeaders[k] = v;
  }

  // Clone to avoid consuming the caller's response body.
  let responseBody: unknown;

  if (!isStream) {
    try {
      const text = await res.clone().text();

      if (text) responseBody = tryJson(text);
    } catch {
      /* ignore clone read errors */
    }
  }

  const size = computeResponseSize(res, responseBody);

  const cacheStatus = res.headers.get('x-nextjs-cache');

  const reqColor = resolveReqColor(slow, res.ok);

  const timeLabel = buildTimeLabel(slow, durationMs);

  const slowStyle = slow ? 'color:#f97316;font-weight:bold' : '';

  const metaParts: string[] = [];

  if (size) metaParts.push(size);

  if (cacheStatus) metaParts.push(cacheStatus);
  const meta = metaParts.length > 0 ? '  ' + metaParts.join('  ') : '';

  // eslint-disable-next-line no-console
  console.groupCollapsed(
    `%c\u2B07 ${method}%c ${url} %c${res.status}%c  ` +
      timeLabel +
      `%c${meta} %c${id}`,
    `color:${reqColor};font-weight:bold;` + MONO,
    'color:inherit;' + MONO,
    statusStyle(res.status),
    '',
    slowStyle,
    '',
    'color:#6b7280',
    MUTED,
  );

  if (Object.keys(resHeaders).length > 0) {
    // eslint-disable-next-line no-console
    console.log('%cHeaders', LABEL, resHeaders);
  }

  if (isStream) {
    // eslint-disable-next-line no-console
    console.log('%cBody', LABEL, '(streaming)');
  } else {
    // eslint-disable-next-line no-console
    console.log('%cBody', LABEL, responseBody ?? '(empty)');
  }

  // eslint-disable-next-line no-console
  console.groupEnd();
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * installClientFetchDebugger.
 */
export function installClientFetchDebugger(): () => void {
  if (!isDev) return () => {};

  if (globalThis.window === undefined) return () => {};

  const g = globalThis as typeof globalThis & { [PATCHED_KEY]?: boolean };

  if (g[PATCHED_KEY]) return () => {};

  const original = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async function debugFetch(
    input: RequestInfo | URL,
    init: RequestInit = {},
  ): Promise<Response> {
    const url = extractUrl(input);

    if (shouldSkip(url)) return original(input, init);

    // Capture caller stack and timestamp BEFORE the async boundary
    // so the stack reflects the actual call site.
    const caller = captureCallerStack('devFetchInterceptor');

    const timestamp = formatTimestamp();

    const id = nextId();

    const method = ((init.method ?? 'GET') as string).toUpperCase();

    const tag = resolveClientTag(url);

    logReqGroup(id, method, url, timestamp, init, caller, tag);

    // Inject X-Debug-Request-ID so the backend can correlate logs.
    const patchedInit = withDebugHeader(init, id);

    const start = performance.now();

    try {
      const res = await original(input, patchedInit);

      const durationMs = Math.round(performance.now() - start);

      await logResGroup(id, method, url, res, durationMs);

      return res;
    } catch (error) {
      const durationMs = Math.round(performance.now() - start);

      // eslint-disable-next-line no-console
      console.error(
        `%c\u2716 ${method} ${url}%c  failed after ${String(durationMs)}ms`,
        'color:#ef4444;font-weight:bold;' + MONO,
        'color:#6b7280',
        error,
      );
      throw error;
    }
  };

  g[PATCHED_KEY] = true;

  return function cleanup(): void {
    globalThis.fetch = original;
    delete g[PATCHED_KEY];
    _counter = 0;
  };
}
