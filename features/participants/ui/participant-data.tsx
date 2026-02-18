import React from 'react';

import { participants } from '@/features/participants/lib/options';
import ParticipantMatcher from '@/features/participants/ui/participant-matcher';
import Participants from '@/features/participants/ui/participants';

import type { AttendeeProps, GuestProps } from '@/entities/participant';

export default async function ParticipantData({
  eventId,
  guests,
  attendees,
}: {
  eventId: number;
  guests: GuestProps[];
  attendees: AttendeeProps[];
}) {
  return (
    <div className='flex flex-row gap-16'>
      <Participants list={guests} title={participants.guest} />
      <Participants list={attendees} title={participants.attendee} />

      <ParticipantMatcher
        eventId={eventId}
        guests={guests}
        attendees={attendees}
      />
    </div>
  );
}
