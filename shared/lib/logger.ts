/**
 * Server-side logger — detailed output only in development/local environments.
 * In production all error details stay server-side only (not exposed to the client).
 */

export const isDev =
  process.env.NODE_ENV === 'development' ||
  process.env.APP_ENV === 'development' ||
  process.env.APP_ENV === 'local';

// ── ANSI colour palette (Unicode escapes required by unicorn/no-hex-escape) ─
const ESC = '\u001B[';
const C = {
  reset:   `${ESC}0m`,
  bold:    `${ESC}1m`,
  dim:     `${ESC}2m`,
  cyan:    `${ESC}36m`,
  green:   `${ESC}32m`,
  yellow:  `${ESC}33m`,
  red:     `${ESC}31m`,
  blue:    `${ESC}34m`,
  magenta: `${ESC}35m`,
  gray:    `${ESC}90m`,
  orange:  `${ESC}38;5;208m`,
} as const;

const DIVIDER = C.dim + '─'.repeat(72) + C.reset;

// ── Slow request threshold ─────────────────────────────────────────────────
// Override via NEXT_PUBLIC_DEBUG_SLOW_MS env var (e.g. "500" for 500 ms).
export const SLOW_THRESHOLD_MS: number =
  Number(process.env.NEXT_PUBLIC_DEBUG_SLOW_MS) || 800;

// ── Request ID counter ─────────────────────────────────────────────────────
let _reqCounter = 0;

export function createRequestId(): string {
  return `#${String(++_reqCounter).padStart(4, '0')}`;
}

// ── Timestamp ──────────────────────────────────────────────────────────────

export function formatTimestamp(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return hh + ':' + mm + ':' + ss + '.' + ms;
}

// ── Byte formatter ─────────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return String(bytes) + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// ── Stack trace capture ────────────────────────────────────────────────────

// Patterns that are always noise in a stack trace.
const STACK_NOISE = [
  'node_modules',
  'node:',
  'processTicksAndRejections',
  '<anonymous>',
  'next/dist',
];

/**
 * Captures a stack trace at the call site, strips framework internals,
 * and returns up to 3 relevant caller frames as a formatted string.
 *
 * @param skipFile - Filename substring to exclude (the calling debugger file).
 */
export function captureCallerStack(skipFile: string): string | undefined {
  const { stack } = new Error('Stack capture');
  if (!stack) return undefined;

  const noise = [...STACK_NOISE, skipFile];

  const frames = stack
    .split('\n')
    .slice(1) // skip the "Error" header line
    .map(l => l.trim())
    .filter(l => l.startsWith('at ') && !noise.some(n => l.includes(n)));

  if (frames.length === 0) return undefined;

  // Strip absolute project root on server to show relative paths.
  let root = '';
  if (globalThis.window === undefined) {
    try {
      root = process.cwd() + '/';
    } catch { /* edge runtime */ }
  }

  return frames
    .slice(0, 3)
    .map(l =>
      l
        .replace(/^at\s+/, '')
        .replace(root, '')
        // Browser: strip webpack-internal:// + chunk path prefix
        .replaceAll(/webpack-internal:\/\/\/[^/]*\/\.\//g, '')
        .replaceAll('\\', '/'),
    )
    .join('\n    ');
}

// ── Helpers ────────────────────────────────────────────────────────────────

const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
]);

export function sanitizeHeaders(
  headers: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [
      k,
      SENSITIVE_HEADERS.has(k.toLowerCase())
        ? v.slice(0, 8) + '\u2026' + v.slice(-4)
        : v,
    ]),
  );
}

function truncate(str: string, max = 2000): string {
  if (str.length <= max) return str;
  return (
    str.slice(0, max) +
    '\n' +
    C.dim +
    '  \u2026 (' +
    String(str.length - max) +
    ' chars omitted)' +
    C.reset
  );
}

function prettyBody(raw: string, indent = '    '): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
      .split('\n')
      .map(l => indent + l)
      .join('\n');
  } catch {
    return indent + raw;
  }
}

function statusColour(status: number): string {
  if (status >= 500) return C.red;
  if (status >= 400) return C.yellow;
  if (status >= 300) return C.blue;
  return C.green;
}

// ── Public types ───────────────────────────────────────────────────────────

export interface RequestLogContext {
  id: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  /** Formatted HH:MM:SS.mmm timestamp captured at request time. */
  timestamp?: string;
  /** Formatted caller stack frames from captureCallerStack(). */
  caller?: string;
  /**
   * Short label identifying the destination service: 'BACKEND', 'NEXT', 'EXT'.
   * When present, `url` is shown on a detail line and this tag + a short path
   * are shown in the header for readability.
   */
  tag?: string;
}

export interface ResponseLogContext {
  id: string;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  body?: string;
  /** Whether the request exceeded SLOW_THRESHOLD_MS. */
  slow?: boolean;
  /** Human-readable response size (e.g. "4.2 KB"). */
  size?: string;
  /** Value of x-nextjs-cache response header, if present (HIT / MISS / STALE). */
  cacheStatus?: string;
}

export interface ApiErrorContext {
  method?: string;
  url: string;
  status: number;
  statusText?: string;
  body?: string;
}

// ── Log functions ──────────────────────────────────────────────────────────

/**
 * Log an outgoing HTTP request.
 * Outputs timestamp, method, URL, sanitised headers, body, and caller stack.
 */
function tagColour(tag: string): string {
  if (tag === 'BACKEND') return C.magenta;
  if (tag === 'NEXT') return C.blue;
  return C.gray;
}

export function logRequest(ctx: RequestLogContext): void {
  if (!isDev) return;

  const { id, method, url, headers = {}, body, timestamp, caller, tag } = ctx;
  const sanitized = sanitizeHeaders(headers);

  const hdrsStr =
    Object.entries(sanitized).length > 0
      ? Object.entries(sanitized)
          .map(([k, v]) => '    ' + C.gray + k + C.reset + ': ' + v)
          .join('\n')
      : '    ' + C.gray + '(none)' + C.reset;

  const tsStr = timestamp ? '  ' + C.gray + timestamp + C.reset : '';

  // When a tag is present, show "[TAG] path" in the header and full URL as a detail.
  const urlDisplay = tag
    ? tagColour(tag) + C.bold + '[' + tag + ']' + C.reset + '  ' + new URL(url).pathname
    : url;

  let out =
    '\n' +
    DIVIDER +
    '\n' +
    C.cyan +
    C.bold +
    '  \u2B06  ' +
    method.toUpperCase() +
    C.reset +
    '  ' +
    urlDisplay +
    '  ' +
    C.gray +
    id +
    C.reset +
    tsStr +
    '\n';

  if (tag) {
    out += C.dim + '  URL' + C.reset + '      ' + C.gray + url + C.reset + '\n';
  }

  out += C.dim + '  Headers' + C.reset + '\n' + hdrsStr + '\n';

  if (body) {
    out +=
      C.dim + '  Body' + C.reset + '\n' + prettyBody(truncate(body)) + '\n';
  }

  if (caller) {
    out +=
      C.dim +
      '  Caller' +
      C.reset +
      '   ' +
      C.gray +
      caller +
      C.reset +
      '\n';
  }

  // eslint-disable-next-line no-console
  console.log(out);
}

/**
 * Log an HTTP response including status, timing, size, cache info, and body.
 * Slow responses (> SLOW_THRESHOLD_MS) are highlighted in orange.
 */
export function logResponse(ctx: ResponseLogContext): void {
  if (!isDev) return;

  const { id, method, url, status, durationMs, body, slow, size, cacheStatus } =
    ctx;
  const sc = statusColour(status);
  const headerColour = slow ? C.orange : sc;

  const timeStr = slow
    ? C.orange + C.bold + '\u26A0 SLOW  ' + C.reset + C.orange + String(durationMs) + 'ms' + C.reset
    : String(durationMs) + 'ms';

  let out =
    headerColour +
    C.bold +
    '  \u2B07  ' +
    method.toUpperCase() +
    C.reset +
    '  ' +
    url +
    '\n' +
    '     ' +
    C.dim +
    'Status' +
    C.reset +
    '   ' +
    sc +
    String(status) +
    C.reset +
    '\n' +
    '     ' +
    C.dim +
    'Time  ' +
    C.reset +
    '   ' +
    timeStr +
    '  ' +
    C.gray +
    id +
    C.reset +
    '\n';

  if (size) {
    out += '     ' + C.dim + 'Size  ' + C.reset + '   ' + size + '\n';
  }

  if (cacheStatus) {
    const cacheColour = cacheStatus === 'HIT' ? C.green : C.gray;
    out +=
      '     ' +
      C.dim +
      'Cache ' +
      C.reset +
      '   ' +
      cacheColour +
      cacheStatus +
      C.reset +
      '\n';
  }

  if (body) {
    out +=
      C.dim +
      '     Body  ' +
      C.reset +
      '\n' +
      prettyBody(truncate(body), '       ') +
      '\n';
  }

  // eslint-disable-next-line no-console
  console.log(out);
}

/**
 * Log an API error. In dev prints full context; in production is a no-op
 * (Next.js already logs server-side errors to the terminal in production).
 */
export function logApiError(context: ApiErrorContext): void {
  if (!isDev) return;

  const method = context.method ?? 'GET';
  const { url, status, statusText, body } = context;

  // eslint-disable-next-line no-console
  console.error(
    '\n' +
      C.red +
      C.bold +
      '  \u2716  ' +
      method +
      ' ' +
      url +
      C.reset +
      '\n' +
      '     ' +
      C.dim +
      'Status' +
      C.reset +
      '   ' +
      C.red +
      String(status) +
      (statusText ? ' ' + statusText : '') +
      C.reset +
      '\n' +
      '     ' +
      C.dim +
      'Body  ' +
      C.reset +
      '   ' +
      (body ?? '(empty)') +
      '\n',
  );
}
