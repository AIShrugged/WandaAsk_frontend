'use client';

import ErrorDisplay from '@/shared/ui/error/ErrorDisplay';

import type { RichError } from '@/shared/ui/error/ErrorDisplay';

interface ErrorPageProps {
  error: globalThis.Error & { digest?: string };
  reset: () => void;
}

/**
 * ErrorPage component.
 * @param reset.error
 * @param reset - reset.
 * @param reset.reset
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className='flex h-full items-center justify-center p-4'>
      <div className='w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-sm'>
        <ErrorDisplay error={error as RichError} reset={reset} />
      </div>
    </div>
  );
}
