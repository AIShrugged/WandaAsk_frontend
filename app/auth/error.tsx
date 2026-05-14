'use client';

import ErrorDisplay from '@/shared/ui/error/ErrorDisplay';

import type { RichError } from '@/shared/ui/error/ErrorDisplay';

// eslint-disable-next-line sonarjs/no-globals-shadowing
export default function Error({
  error,
  reset,
}: {
  error: globalThis.Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className='w-full max-w-[400px]'>
      <ErrorDisplay error={error as RichError} reset={reset} />
    </div>
  );
}
