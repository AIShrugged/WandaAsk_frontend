import EventSummary from '@/features/event/ui/event-summary';
import {
  getAttendees,
  getGuests,
} from '@/features/participants/api/participants';
import ParticipantData from '@/shared/ui/participant/participant-data';

import type { EventProps } from '@/entities/event';

/**
 * EventOverview component.
 * @param root0
 * @param root0.id
 * @param root0.event
 * @param root0.withoutMatcher
 */
export default async function EventOverview({
  id,
  event,
  withoutMatcher,
}: {
  id: string;
  event: EventProps;
  withoutMatcher?: boolean;
}) {
  const [attendeesResult, guestsResult] = await Promise.allSettled([
    getAttendees(id),
    getGuests(id),
  ]);
  const attendees =
    attendeesResult.status === 'fulfilled'
      ? (attendeesResult.value.data ?? [])
      : [];
  const guests =
    guestsResult.status === 'fulfilled' ? (guestsResult.value.data ?? []) : [];

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
