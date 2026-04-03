import React from 'react';

import { participants } from '@/features/participants/lib/options';
import Participants from '@/features/participants/ui/participants';
import ParticipantMatcher from '@/shared/ui/participant/participant-matcher';

import type { AttendeeProps, GuestProps } from '@/entities/participant';

/**
 * ParticipantData component.
 * @param root0
 * @param root0.eventId
 * @param root0.guests
 * @param root0.attendees
 * @param root0.withoutMatcher
 * @returns JSX element.
 */
export default async function ParticipantData({
  eventId,
  guests,
  attendees,
  withoutMatcher,
}: {
  eventId: number;
  guests: GuestProps[];
  attendees: AttendeeProps[];
  withoutMatcher?: boolean;
}) {
  return (
    <div className='flex flex-col sm:flex-row gap-8 sm:gap-16'>
      <Participants list={guests} title={participants.guest} />
      <Participants list={attendees} title={participants.attendee} />

      {!withoutMatcher && (
        <ParticipantMatcher
          eventId={eventId}
          guests={guests}
          attendees={attendees}
        />
      )}
    </div>
  );
}
