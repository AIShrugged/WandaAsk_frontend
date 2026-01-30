'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { attachCalendar } from '@/app/actions/calendar';
import { H1 } from '@/shared/ui/typography/H1';

import OnboardingImage from '../server/onboarding-image';

export default function OnboardingTrigger() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel('calendar_oauth');
    channelRef.current = channel;

    channel.onmessage = (event) => {
      if (event.data?.type !== 'CALENDAR_CONNECTED') return;

      if (event.data.success) {
        router.refresh();
      } else {
        setError(event.data.error ?? 'Failed to connect calendar');
        setIsPending(false);
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [router]);

  const handleAttach = async () => {
    setError(null);
    setIsPending(true);

    let url: string;
    try {
      url = await attachCalendar();
    } catch (error_) {
      setError((error_ as Error).message);
      setIsPending(false);
      return;
    }

    const popup = globalThis.open(
      url,
      'google_oauth',
      `width=700,height=700,left=${screen.width / 2 - 350},top=100,scrollbars=yes`,
    );

    if (!popup) {
      setError(
        'Popup was blocked by the browser. Please allow popups and try again.',
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
          Waiting for Google...
        </p>
      )}
      {error && <p className='text-sm mt-4 text-red-500'>{error}</p>}
    </div>
  );
}