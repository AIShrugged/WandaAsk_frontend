'use client';

import ErrorDisplay from '@/shared/ui/error/ErrorDisplay';

import type { RichError } from '@/shared/ui/error/ErrorDisplay';

/**
 * Error component.
 * @param root0
 * @param root0.error
 * @param root0.reset
 */
// eslint-disable-next-line sonarjs/no-globals-shadowing
export default function Error({
  error,
  reset,
}: {
  error: globalThis.Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className='flex min-h-screen items-center justify-center bg-muted/40 p-4'>
      <div className='w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-sm'>
        <ErrorDisplay error={error as RichError} reset={reset} />
      </div>
    </div>
  );
}
