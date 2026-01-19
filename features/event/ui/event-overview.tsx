import EventSummary from '@/features/event/ui/event-summary';
import ParticipantData from '@/features/participants/ui/participant-data';

import type { EventProps } from '@/features/event/model/types';
import type {
  AttendeeProps,
  GuestProps,
} from '@/features/participants/model/types';

export default function EventOverview({
  id,
  event,
  guests,
  attendees,
}: {
  id: string;
  event: EventProps;
  guests: GuestProps[];
  attendees: AttendeeProps[];
}) {
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
