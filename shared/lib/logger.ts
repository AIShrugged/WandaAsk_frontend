/**
 * Server-side logger — detailed output only in development/local environments.
 * In production all error details stay server-side only (not exposed to the client).
 */

const isDev = process.env.NODE_ENV === 'development';

interface ApiErrorContext {
  method?: string;
  url: string;
  status: number;
  statusText?: string;
  body?: string;
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
    `\n[API Error] ${method} ${url}\n` +
    `  Status : ${status}${statusText ? ` ${statusText}` : ''}\n` +
    `  Body   : ${body ?? '(empty)'}\n`,
  );
}
