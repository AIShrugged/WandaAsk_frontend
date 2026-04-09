'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { detachCalendarFromProfile } from '@/features/calendar/api/source';

import type { Source } from '@/entities/source';

interface CalendarSectionProps {
  source: Source | null;
}

/**
 * CalendarSection — shows connected Google Calendar status on the Profile page.
 * If a calendar is connected, offers an inline-confirmed disconnect button.
 * @param root0 - Component props.
 * @param root0.source - The connected Source, or null if none.
 * @returns JSX element.
 */
export function CalendarSection({ source }: CalendarSectionProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, setIsPending] = useState(false);
  /**
   *
   */
  const handleDisconnect = async () => {
    if (!source) return;

    setIsPending(true);

    const result = await detachCalendarFromProfile(source.id);

    setIsPending(false);
    setConfirming(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Google Calendar disconnected.');
      router.refresh();
    }
  };

  if (!source) {
    return (
      <p className='text-sm text-muted-foreground'>No calendar connected.</p>
    );
  }

  return (
    <div className='flex items-center justify-between gap-4 rounded-[var(--radius-button)] border border-border bg-background px-3 py-2'>
      <div className='flex flex-col gap-0.5'>
        <span className='text-sm font-medium text-foreground'>
          Google Calendar
        </span>
        <span className='text-xs text-muted-foreground'>{source.identity}</span>
      </div>

      {confirming ? (
        <div className='flex items-center gap-2'>
          <span className='text-sm text-muted-foreground'>Are you sure?</span>
          <button
            type='button'
            onClick={handleDisconnect}
            disabled={isPending}
            className='text-sm text-destructive hover:underline disabled:opacity-50'
          >
            {isPending ? 'Disconnecting...' : 'Yes, disconnect'}
          </button>
          <button
            type='button'
            onClick={() => {
              setConfirming(false);
            }}
            disabled={isPending}
            className='text-sm text-muted-foreground hover:underline disabled:opacity-50'
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type='button'
          onClick={() => {
            setConfirming(true);
          }}
          className='text-sm text-muted-foreground hover:text-destructive hover:underline'
        >
          Disconnect
        </button>
      )}
    </div>
  );
}
