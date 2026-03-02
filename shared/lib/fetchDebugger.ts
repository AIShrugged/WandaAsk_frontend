/**
 * Server-side fetch debugger.
 *
 * Patches `globalThis.fetch` to log every outgoing HTTP request and response
 * in the Next.js Node.js runtime. Installed once via `instrumentation.ts`.
 *
 * Active only when `NODE_ENV === 'development'`.
 */

import {
  SLOW_THRESHOLD_MS,
  captureCallerStack,
  createRequestId,
  formatBytes,
  formatTimestamp,
  isDev,
  logApiError,
  logRequest,
  logResponse,
  sanitizeHeaders,
} from '@/shared/lib/logger';

// ── Startup banner ─────────────────────────────────────────────────────────

const ESC = '\u001B[';
const B = {
  reset:   `${ESC}0m`,
  bold:    `${ESC}1m`,
  dim:     `${ESC}2m`,
  magenta: `${ESC}35m`,
  gray:    `${ESC}90m`,
  cyan:    `${ESC}36m`,
} as const;

function logDebugBanner(): void {
  const backendUrl = process.env.API_URL ?? '(not set)';
  const threshold  = String(SLOW_THRESHOLD_MS) + 'ms';
  const line       = B.dim + '─'.repeat(60) + B.reset;

  // eslint-disable-next-line no-console
  console.log(
    '\n' + line + '\n' +
    B.magenta + B.bold + '  \u25C6 Tribes Fetch Debugger' + B.reset + '\n' +
    '  ' + B.dim + 'Backend  ' + B.reset + B.cyan + backendUrl + B.reset + '\n' +
    '  ' + B.dim + 'Slow \u2265  ' + B.reset + threshold + '\n' +
    line + '\n',
  );
}

// ── URL tag resolution ──────────────────────────────────────────────────────

type RequestTag = 'BACKEND' | 'EXT';

function resolveTag(url: string): RequestTag | undefined {
  const apiUrl = process.env.API_URL;
  if (apiUrl && url.startsWith(apiUrl)) return 'BACKEND';
  // Any other absolute URL to a different host
  try {
    const { origin } = new URL(url);
    if (origin !== 'null') return 'EXT';
  } catch { /* relative URL — no tag */ }
  return undefined;
}

// Symbol used to mark the fetch wrapper so double-patching is detected.
const PATCHED_SYM = Symbol.for('__tribes_fetch_debug_patched');

// URL substrings that should NOT be logged (internal Next.js plumbing).
const SKIP_PATTERNS = [
  '/_next/',
  '/favicon',
  '__nextjs',
  'webpack-hmr',
  '_rsc=',
];

function shouldSkip(url: string): boolean {
  return SKIP_PATTERNS.some(p => url.includes(p));
}

function extractUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return (input as Request).url;
}

function extractHeaders(init: RequestInit): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!init.headers) return headers;

  if (init.headers instanceof Headers) {
    for (const [k, v] of init.headers.entries()) {
      headers[k] = v;
    }
  } else if (Array.isArray(init.headers)) {
    for (const [k, v] of init.headers) headers[String(k)] = String(v);
  } else {
    Object.assign(headers, init.headers as Record<string, string>);
  }

  return headers;
}

function extractBodyText(init: RequestInit): string | undefined {
  if (!init.body) return undefined;
  if (typeof init.body === 'string') return init.body;
  return '(non-string body \u2014 FormData / ArrayBuffer / etc.)';
}

function isStreaming(res: Response): boolean {
  const ct = res.headers.get('content-type') ?? '';
  return ct.includes('text/event-stream') || ct.includes('octet-stream');
}

/**
 * Builds a new RequestInit with the X-Debug-Request-ID header injected.
 * Does not mutate the original init object.
 */
function withDebugHeader(init: RequestInit, id: string): RequestInit {
  const headers = new Headers(init.headers as HeadersInit | undefined);
  headers.set('X-Debug-Request-ID', id);
  return { ...init, headers };
}

/**
 * Installs a debug wrapper around `globalThis.fetch`.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function patchServerFetch(): void {
  if (!isDev) return;

  // Detect double-patch via a Symbol property on globalThis.
  const g = globalThis as typeof globalThis & { [PATCHED_SYM]?: true };
  if (g[PATCHED_SYM]) return;

  logDebugBanner();

  const original = globalThis.fetch;

  globalThis.fetch = async function debugFetch(
    input: RequestInfo | URL,
    init: RequestInit = {},
  ): Promise<Response> {
    const url = extractUrl(input);
    if (shouldSkip(url)) return original(input, init);

    // Capture caller stack and timestamp BEFORE the async boundary
    // so the stack reflects the actual call site.
    const caller = captureCallerStack('fetchDebugger');
    const timestamp = formatTimestamp();

    const id = createRequestId();
    const method = ((init.method ?? 'GET') as string).toUpperCase();
    const rawHeaders = extractHeaders(init);
    const body = extractBodyText(init);

    logRequest({
      id,
      method,
      url,
      headers: sanitizeHeaders(rawHeaders),
      body,
      timestamp,
      caller,
      tag: resolveTag(url),
    });

    // Inject X-Debug-Request-ID so the backend can correlate logs.
    const patchedInit = withDebugHeader(init, id);

    const start = performance.now();

    try {
      const res = await original(input, patchedInit);
      const durationMs = Math.round(performance.now() - start);

      // Clone before reading so the caller's response stream is untouched.
      let responseBody: string | undefined;
      if (!isStreaming(res)) {
        try {
          responseBody = await res.clone().text();
        } catch { /* ignore read errors on non-critical clone */ }
      }

      // Response size: prefer Content-Length header, fall back to body length.
      const contentLength = res.headers.get('content-length');
      const byteCount = contentLength
        ? Number(contentLength)
        : (responseBody?.length ?? 0);
      const size = byteCount > 0 ? formatBytes(byteCount) : undefined;

      // Next.js Data Cache status.
      const rawCache = res.headers.get('x-nextjs-cache');
      const cacheStatus = rawCache ?? undefined;

      logResponse({
        id,
        method,
        url,
        status: res.status,
        durationMs,
        body: responseBody,
        slow: durationMs > SLOW_THRESHOLD_MS,
        size,
        cacheStatus,
      });

      return res;
    } catch (error) {
      const durationMs = Math.round(performance.now() - start);
      logApiError({
        method,
        url,
        status: 0,
        statusText:
          'Network error after ' +
          String(durationMs) +
          'ms \u2014 ' +
          String(error),
      });
      throw error;
    }
  };

  g[PATCHED_SYM] = true;
}
