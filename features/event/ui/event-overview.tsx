import EventSummary from '@/features/event/ui/event-summary';
import ParticipantData from '@/features/participants/ui/participant-data';

import type { EventProps } from '@/entities/event';
import { getAttendees, getGuests } from '@/features/participants/api/participants';

export default async function EventOverview({
  id,
  event,
}: {
  id: string;
  event: EventProps;
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
      />
    </div>
  );
}
