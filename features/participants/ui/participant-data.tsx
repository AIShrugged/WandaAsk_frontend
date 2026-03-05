import React from 'react';

import { participants } from '@/features/participants/lib/options';
import ParticipantMatcher from '@/features/participants/ui/participant-matcher';
import Participants from '@/features/participants/ui/participants';

import type { AttendeeProps, GuestProps } from '@/entities/participant';

/**
 * ParticipantData component.
 * @param root0
 * @param root0.eventId
 * @param root0.guests
 * @param root0.attendees
 * @param root0.withoutMatcher
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
    <div className='flex flex-row gap-16'>
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
