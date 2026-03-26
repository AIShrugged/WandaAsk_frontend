'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { detachCalendar } from '@/features/calendar/api/source';

/**
 * DetachCalendarButton — button that disconnects Google Calendar.
 * Shows an inline confirmation step before calling the detach action.
 * @param root0
 * @param root0.sourceId - ID of the Source to delete.
 */
export default function DetachCalendarButton({
  sourceId,
}: {
  sourceId: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, setIsPending] = useState(false);
  /**
   *
   */
  const handleDisconnect = async () => {
    setIsPending(true);

    const result = await detachCalendar(sourceId);

    // redirect() in server action throws internally — this branch only
    // executes when the action returns an error (no redirect happened).
    if (result.error) {
      toast.error(result.error);
      setIsPending(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
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
    );
  }

  return (
    <button
      type='button'
      onClick={() => {
        setConfirming(true);
      }}
      className='text-sm text-muted-foreground hover:text-destructive hover:underline'
    >
      Disconnect calendar
    </button>
  );
}
