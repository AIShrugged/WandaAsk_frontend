'use server';

import { getAttendees, getGuests } from '@/features/participants/api/participants';
import Event from '@/features/calendar/ui/event';

import type { EventProps } from '@/entities/event';

type Props = {
  event: EventProps;
};

const EventServer = async ({ event }: Props) => {
  const [{ data: attendees = [] }, { data: guests = [] }] = await Promise.all([
    getAttendees(String(event.id)),
    getGuests(String(event.id)),
  ]);

  return <Event guests={guests} attendees={attendees} event={event} />;
};

export default EventServer;
