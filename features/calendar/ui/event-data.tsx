import Event from '@/features/calendar/ui/event';

import type { EventProps } from '@/entities/event';

export default function EventItem({ event }: { event: EventProps }) {
  return <Event event={event} />;
}
