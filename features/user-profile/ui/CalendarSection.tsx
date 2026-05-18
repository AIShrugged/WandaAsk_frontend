'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { detachCalendarFromProfile } from '@/features/calendar/api/source';
import { AttachCalendarButton } from '@/features/calendar/ui/attach-calendar-button';

import type { Source } from '@/entities/source';

export function CalendarSection({
  source,
  organizationId,
  organizationName,
}: {
  source: Source | null;
  organizationId: number;
  organizationName?: string | null;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, setIsPending] = useState(false);

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
      <div className='flex flex-col gap-3'>
        <p className='text-sm text-muted-foreground'>No calendar connected.</p>
        <AttachCalendarButton
          organizationId={organizationId}
          className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 self-start'
        >
          Connect Google Calendar
        </AttachCalendarButton>
      </div>
    );
  }

  return (
    <div className='flex items-center justify-between gap-4 rounded-[var(--radius-button)] border border-border bg-background px-3 py-2'>
      <div className='flex flex-col gap-0.5'>
        <span className='text-sm font-medium text-foreground'>
          Google Calendar
        </span>
        <span className='text-xs text-muted-foreground'>{source.identity}</span>
        {organizationName && (
          <span className='text-xs text-muted-foreground'>
            Organization: {organizationName}
          </span>
        )}
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
