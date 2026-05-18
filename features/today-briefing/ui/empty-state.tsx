'use client';

import { Calendar } from 'lucide-react';

import { AttachCalendarButton } from '@/features/calendar/ui/attach-calendar-button';

export function EmptyState({ organizationId }: { organizationId: number }) {
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
      <AttachCalendarButton
        organizationId={organizationId}
        className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50'
      >
        Connect Calendar
      </AttachCalendarButton>
    </div>
  );
}
