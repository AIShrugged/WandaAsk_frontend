'use client';

import { useState } from 'react';

import { attachCalendar } from '@/features/calendar/api/calendar';
import { H1 } from '@/shared/ui/typography/H1';

import OnboardingImage from './onboarding-image';

/**
 * OnboardingTrigger component.
 */
export default function OnboardingTrigger() {
  const [isPending, setIsPending] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /**
   * handleAttach.
   * @returns Promise.
   */
  const handleAttach = async () => {
    setError(null);
    setIsPending(true);

    try {
      globalThis.location.href = await attachCalendar();
    } catch (error_) {
      setError(
        error_ instanceof Error ? error_.message : 'Something went wrong',
      );
      setIsPending(false);
    }
  };

  return (
    <div className='flex flex-col gap-7.5 justify-center items-center h-full w-full'>
      <H1>Continue with Google</H1>
      <button
        type='button'
        onClick={handleAttach}
        disabled={isPending}
        className='cursor-pointer focus:outline-none'
      >
        <OnboardingImage />
      </button>
      {isPending && (
        <p className='text-sm mt-4 text-muted-foreground'>
          Redirecting to Google...
        </p>
      )}
      {error && <p className='text-sm mt-4 text-red-500'>{error}</p>}
    </div>
  );
}
