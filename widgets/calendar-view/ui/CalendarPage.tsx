'use client';

import Calendar from '@/features/calendar/ui/calendar';
import { EventPopupAll } from '@/features/event/ui/event-popup-all';
import { useModal } from '@/shared/hooks/use-modal';
import { CalendarEvent } from '@/widgets/calendar-view/ui/CalendarEvent';

import type { EventProps } from '@/entities/event';

/**
 * CalendarPage widget — full calendar UI composed from calendar + event features.
 * Lives in widgets/ because it crosses feature boundaries.
 * @param root0
 * @param root0.events
 * @param root0.currentMonth
 * @returns JSX element.
 */
export function CalendarPage({
  events,
  currentMonth,
}: {
  events: EventProps[];
  currentMonth: string;
}) {
  const { open, close } = useModal();
  /**
   * handleShowAll.
   * @param dayEvents - events for the day.
   */
  const handleShowAll = (dayEvents: EventProps[]) => {
    if (open) open(<EventPopupAll list={dayEvents} close={close} />);
  };

  return (
    <Calendar
      events={events}
      currentMonth={currentMonth}
      renderEvent={(event) => {
        return <CalendarEvent key={event.id} event={event} />;
      }}
      onShowAll={handleShowAll}
    />
  );
}
