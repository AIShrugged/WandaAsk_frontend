import React from 'react';

import ParticipantMatching from '@/features/participants/ui/participant-matching';
import ParticipantsTitle from '@/features/participants/ui/participants-title';

import type {
  AttendeeProps,
  GuestProps,
} from '@/features/participants/model/types';

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
