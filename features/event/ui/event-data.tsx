'use server';

import { getAttendees, getGuests } from '@/app/actions/participants';
import Event from '@/features/calendar/client/event';

import type { EventProps } from '@/features/event/model/types';

type Props = {
  event: EventProps;
};

const EventServer = async ({ event }: Props) => {
  const [{ data: attendees }, { data: guests }] = await Promise.all([
    getAttendees(event.id),
    getGuests(event.id),
  ]);

  return <Event guests={guests} attendees={attendees} event={event} />;
};

export default EventServer;
