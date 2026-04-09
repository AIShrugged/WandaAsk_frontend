import Event from '@/features/calendar/ui/event';

import type { EventProps } from '@/entities/event';

/**
 * EventItem component.
 * @param props - Component props.
 * @param props.event
 */
export default function EventItem({ event }: { event: EventProps }) {
  return <Event event={event} />;
}
