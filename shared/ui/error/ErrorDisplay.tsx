'use client';

import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Monitor,
  RefreshCw,
  Server,
  Wifi,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { ErrorSource } from '@/shared/lib/errors';

// ------------------------------
// Public interface — matches both AppError instances and plain serialized errors
// coming from the Next.js server → client error boundary.
// In production only `message` and `digest` survive serialization.
// ------------------------------
export interface RichError {
  message: string;
  stack?: string;
  digest?: string;
  source?: ErrorSource;
  status?: number;
  url?: string;
  responseBody?: string;
  name?: string;
}

interface ErrorDisplayProps {
  error: RichError;
  reset: () => void;
}

const isDev =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_APP_ENV === 'development';

// ── Source config ─────────────────────────────────────────────────────────────

const SOURCE_LABEL: Record<ErrorSource, string> = {
  server: 'Server Error',
  frontend: 'Frontend Error',
  network: 'Network Error',
  unknown: 'Error',
};
const SOURCE_BADGE: Record<ErrorSource, string> = {
  server: 'bg-red-50 text-red-700 border border-red-200',
  frontend: 'bg-orange-50 text-orange-700 border border-orange-200',
  network: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  unknown: 'bg-muted text-muted-foreground border',
};
const SOURCE_ACCENT: Record<ErrorSource, string> = {
  server: 'border-l-red-500',
  frontend: 'border-l-orange-500',
  network: 'border-l-yellow-500',
  unknown: 'border-l-border',
};

/**
 * SourceIcon component.
 * @param props - Component props.
 * @param props.source
 */
function SourceIcon({ source }: { source: ErrorSource }) {
  const cls = 'h-3.5 w-3.5 shrink-0';

  if (source === 'server') return <Server className={cls} />;

  if (source === 'frontend') return <Monitor className={cls} />;

  if (source === 'network') return <Wifi className={cls} />;

  return <AlertCircle className={cls} />;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * buildDebugText.
 * @param error - error.
 * @returns Result.
 */
function buildDebugText(error: RichError): string {
  const source = error.source ?? 'unknown';
  const lines: string[] = [
    `[${SOURCE_LABEL[source]}] ${error.name ?? 'Error'}: ${error.message}`,
  ];

  if (error.status !== undefined) lines.push(`HTTP Status: ${error.status}`);

  if (error.url !== undefined) lines.push(`URL: ${error.url}`);

  if (error.digest !== undefined) lines.push(`Digest: ${error.digest}`);

  if (error.responseBody !== undefined && error.responseBody.length > 0) {
    lines.push(`\nResponse Body:\n${error.responseBody}`);
  }

  if (error.stack !== undefined) lines.push(`\nStack Trace:\n${error.stack}`);

  return lines.join('\n');
}

// ── Production view ───────────────────────────────────────────────────────────

/**
 * ProdErrorView component.
 * @param props - Component props.
 * @param props.reset
 */
function ProdErrorView({ reset }: { reset: () => void }) {
  return (
    <div className='flex flex-col items-center justify-center gap-6 p-10 text-center'>
      <div className='flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10'>
        <AlertCircle className='h-8 w-8 text-destructive' />
      </div>
      <div className='space-y-2'>
        <h2 className='text-xl font-semibold text-foreground'>
          Something went wrong
        </h2>
        <p className='max-w-sm text-sm text-muted-foreground'>
          We&apos;re sorry for the inconvenience. Please try again, or contact
          support if the issue persists.
        </p>
      </div>
      <button
        onClick={reset}
        className='flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
      >
        <RefreshCw className='h-4 w-4' />
        Try again
      </button>
    </div>
  );
}

// ── Dev view ──────────────────────────────────────────────────────────────────

/**
 * DevErrorView component.
 * @param reset.error
 * @param reset - reset.
 * @param reset.reset
 */
function DevErrorView({ error, reset }: ErrorDisplayProps) {
  const source = error.source ?? 'unknown';
  const label = SOURCE_LABEL[source];
  const badgeClass = SOURCE_BADGE[source];
  const accentClass = SOURCE_ACCENT[source];
  const [isStackOpen, setIsStackOpen] = useState(false);
  /**
   * handleCopy.
   */
  const handleCopy = () => {
    navigator.clipboard.writeText(buildDebugText(error)).then(() => {
      toast.success('Debug info copied to clipboard');
    });
  };

  return (
    <div className={`flex flex-col gap-5 border-l-4 p-5 ${accentClass}`}>
      {/* ── Header ── */}
      <div className='flex flex-wrap items-center gap-2'>
        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}
        >
          <SourceIcon source={source} />
          {label}
        </span>

        {error.status !== undefined && (
          <span className='rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground'>
            HTTP {error.status}
          </span>
        )}

        {error.name !== undefined && error.name !== 'Error' && (
          <span className='rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground'>
            {error.name}
          </span>
        )}
      </div>

      {/* ── Message & URL ── */}
      <div>
        <p className='text-sm font-medium text-foreground'>{error.message}</p>
        {error.url !== undefined && (
          <p className='mt-1 break-all font-mono text-xs text-muted-foreground'>
            → {error.url}
          </p>
        )}
      </div>

      {/* ── Response body ── */}
      {error.responseBody !== undefined && error.responseBody.length > 0 && (
        <div>
          <p className='mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
            Response Body
          </p>
          <pre className='overflow-x-auto rounded-md bg-muted p-3 text-xs leading-relaxed'>
            {error.responseBody}
          </pre>
        </div>
      )}

      {/* ── Stack trace (collapsible) ── */}
      {error.stack !== undefined && (
        <div>
          <button
            onClick={() => {
              return setIsStackOpen((prev) => {
                return !prev;
              });
            }}
            className='flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground'
          >
            {isStackOpen ? (
              <ChevronUp className='h-3 w-3' />
            ) : (
              <ChevronDown className='h-3 w-3' />
            )}
            Stack Trace
          </button>
          {isStackOpen && (
            <pre className='mt-2 overflow-x-auto rounded-md bg-muted p-3 text-xs leading-relaxed'>
              {error.stack}
            </pre>
          )}
        </div>
      )}

      {/* ── Digest ── */}
      {error.digest !== undefined && (
        <p className='text-xs text-muted-foreground'>
          <span className='font-medium'>Digest:</span>{' '}
          <code className='font-mono'>{error.digest}</code>
        </p>
      )}

      {/* ── Actions ── */}
      <div className='flex items-center gap-3 pt-1'>
        <button
          onClick={reset}
          className='flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
        >
          <RefreshCw className='h-3.5 w-3.5' />
          Try again
        </button>
        <button
          onClick={handleCopy}
          className='flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted'
        >
          <Copy className='h-3.5 w-3.5' />
          Copy debug info
        </button>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * ErrorDisplay component.
 * @param reset.error
 * @param reset - reset.
 * @param reset.reset
 */
export default function ErrorDisplay({ error, reset }: ErrorDisplayProps) {
  const source = error.source ?? 'unknown';
  const label = SOURCE_LABEL[source];

  useEffect(() => {
    if (!isDev) return;

    // eslint-disable-next-line no-console
    console.group(
      `%c[${label}]%c ${error.name ?? 'Error'}: ${error.message}`,
      'color: #ef4444; font-weight: bold;',
      'color: inherit; font-weight: normal;',
    );
    // eslint-disable-next-line no-console
    console.error('Error object:', error);

    // eslint-disable-next-line no-console
    if (error.status !== undefined) console.log('HTTP Status:', error.status);

    // eslint-disable-next-line no-console
    if (error.url !== undefined) console.log('URL:', error.url);

    if (error.responseBody !== undefined)
      console.log('Response body:', error.responseBody);

    // eslint-disable-next-line no-console
    if (error.digest !== undefined) console.log('Digest:', error.digest);
    // eslint-disable-next-line no-console
    console.groupEnd();
  }, [error, label]);

  if (!isDev) return <ProdErrorView reset={reset} />;

  return <DevErrorView error={error} reset={reset} />;
}
