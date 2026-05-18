'use client';

import { AttachCalendarButton } from './attach-calendar-button';

export default function OnboardingTrigger({
  organizationId,
}: {
  organizationId: number;
}) {
  return (
    <div className='flex flex-col gap-3 p-6'>
      <p className='text-sm text-muted-foreground'>No calendar connected.</p>
      <AttachCalendarButton
        organizationId={organizationId}
        className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 self-start'
        pendingText='Redirecting to Google...'
      >
        Connect Google Calendar
      </AttachCalendarButton>
    </div>
  );
}
