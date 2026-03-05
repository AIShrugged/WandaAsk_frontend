'use client';

import ErrorDisplay from '@/shared/ui/error/ErrorDisplay';

import type { RichError } from '@/shared/ui/error/ErrorDisplay';

// Global error boundary — catches errors in the root layout itself.
// Must include <html> and <body> tags.
/**
 * GlobalError component.
 * @param root0
 * @param root0.error
 * @param root0.reset
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: globalThis.Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang='ru'>
      <body>
        <div className='flex min-h-screen items-center justify-center bg-gray-50 p-4'>
          <div className='w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm'>
            <ErrorDisplay error={error as RichError} reset={reset} />
          </div>
        </div>
      </body>
    </html>
  );
}
