import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import EventExtraButton from '@/features/calendar/client/event-extra-button';
import Day from '@/features/calendar/server/day';
import EventData from '@/features/event/ui/event-data';

import type { EventProps } from '@/features/event/model/types';

export default function Cells({
  currentMonth,
  events = [],
}: {
  currentMonth: string;
  events: EventProps[];
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const daysDiff =
    Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  const weeksCount = Math.ceil(daysDiff / 7);

  const eventsByDate = new Map<string, EventProps[]>();
  for (const ev of events) {
    const key = ev.starts_at.split(' ')[0];
    if (!eventsByDate.has(key)) eventsByDate.set(key, []);
    eventsByDate.get(key)!.push(ev);
  }

  const cells = [];
  let day = new Date(startDate);

  while (day <= endDate) {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayEvents = eventsByDate.get(dateKey) || [];
    const isCurrentMonth = isSameMonth(day, monthStart);

    cells.push(
      <div
        key={day.toISOString()}
        className={`
          relative border border-gray-200 flex flex-col h-full px-1
          ${isCurrentMonth ? 'bg-white' : 'bg-layout text-secondary'}
        `}
      >
        <Day currentDay={day} />
        <div className='flex-1 min-h-0'>
          {dayEvents.slice(0, 3).map(event => (
            <EventData key={event.id} event={event} />
          ))}
          {dayEvents.length > 3 && (
            <EventExtraButton
              dayEvents={dayEvents}
              count={dayEvents.length - 3}
            />
          )}
        </div>
      </div>,
    );

    day = addDays(day, 1);
  }

  return (
    <div
      className='grid grid-cols-7 border-t border-l border-gray-200 h-full'
      style={{ gridTemplateRows: `repeat(${weeksCount}, 1fr)` }}
    >
      {cells}
    </div>
  );
}
