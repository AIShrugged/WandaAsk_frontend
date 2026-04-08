'use client';

import { Calendar } from 'lucide-react';
import { useState } from 'react';

import { attachCalendar } from '@/features/calendar/api/calendar';

export function EmptyState() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className='flex flex-col items-center justify-center gap-4 py-20 text-center'>
      <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10'>
        <Calendar className='h-8 w-8 text-primary' />
      </div>
      <h3 className='text-lg font-semibold text-foreground'>
        Connect your calendar to get started
      </h3>
      <p className='max-w-sm text-sm text-muted-foreground'>
        Once connected, I&apos;ll automatically join your meetings and have
        notes and follow-ups ready for you.
      </p>
      <button
        type='button'
        onClick={handleAttach}
        disabled={isPending}
        className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50'
      >
        {isPending ? 'Connecting...' : 'Connect Calendar'}
      </button>
      {error && <p className='text-sm text-destructive'>{error}</p>}
    </div>
  );
}
