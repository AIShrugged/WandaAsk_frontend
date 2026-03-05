import React from 'react';

import ParticipantMatching from '@/features/participants/ui/participant-matching';
import ParticipantsTitle from '@/features/participants/ui/participants-title';

import type { AttendeeProps, GuestProps } from '@/entities/participant';

/**
 * ParticipantMatcher component.
 * @param root0
 * @param root0.eventId
 * @param root0.guests
 * @param root0.attendees
 */
export default function ParticipantMatcher({
  eventId,
  guests,
  attendees,
}: {
  eventId: number;
  guests: GuestProps[];
  attendees: AttendeeProps[];
}) {
  return (
    <div>
      <ParticipantsTitle>Match guests</ParticipantsTitle>

      <ParticipantMatching
        eventId={eventId}
        guests={guests}
        attendees={attendees}
      />
    </div>
  );
}
