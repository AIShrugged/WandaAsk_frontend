'use client';

import { H1 } from '@/shared/ui/typography/H1';

import { AttachCalendarButton } from './attach-calendar-button';
import OnboardingImage from './onboarding-image';

export default function OnboardingTrigger({
  organizationId,
}: {
  organizationId: number;
}) {
  return (
    <div className='flex flex-col gap-7.5 justify-center items-center h-full w-full'>
      <H1>Continue with Google</H1>
      <AttachCalendarButton
        organizationId={organizationId}
        className='cursor-pointer focus:outline-none'
        pendingText='Redirecting to Google...'
      >
        <OnboardingImage />
      </AttachCalendarButton>
    </div>
  );
}
