'use client';

import Cells from '@/features/calendar/ui/cells';
import { EventPopupAll } from '@/features/event/ui/event-popup-all';
import { useModal } from '@/shared/hooks/use-modal';
import { CalendarEvent } from '@/widgets/calendar-view/ui/CalendarEvent';

import type { EventProps } from '@/entities/event';

/**
 * CalendarCells widget — composes Cells with CalendarEvent and EventPopupAll.
 * Kept in widgets/ because it crosses feature boundaries (calendar + event).
 * @param root0
 * @param root0.currentMonth
 * @param root0.events
 * @returns JSX element.
 */
export default function CalendarCells({
  currentMonth,
  events = [],
}: {
  currentMonth: string;
  events: EventProps[];
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
    <Cells
      currentMonth={currentMonth}
      events={events}
      renderEvent={(event) => {
        return <CalendarEvent key={event.id} event={event} />;
      }}
      onShowAll={handleShowAll}
    />
  );
}
