import EventSummary from '@/features/event/ui/event-summary';
import {
  getAttendees,
  getGuests,
} from '@/features/participants/api/participants';
import ParticipantData from '@/features/participants/ui/participant-data';

import type { EventProps } from '@/entities/event';

export default async function EventOverview({
  id,
  event,
  withoutMatcher,
}: {
  id: string;
  event: EventProps;
  withoutMatcher?: boolean;
}) {
  const [{ data: attendees = [] }, { data: guests = [] }] = await Promise.all([
    getAttendees(id),
    getGuests(id),
  ]);

  if (!event) return;

  return (
    <div className='flex flex-col gap-7'>
      <EventSummary event={event} />
      <ParticipantData
        guests={guests}
        attendees={attendees}
        eventId={Number(id)}
        withoutMatcher={withoutMatcher}
      />
    </div>
  );
}
