import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import Day from '@/features/calendar/ui/day';
import Event from '@/features/calendar/ui/event';
import EventExtraButton from '@/features/calendar/ui/event-extra-button';

import type { EventProps } from '@/entities/event';

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

  const totalDays = differenceInCalendarDays(endDate, startDate) + 1;
  const weeksCount = Math.ceil(totalDays / 7);

  // Build date→events map once; use slice(0,10) — faster than split(' ')[0]
  const eventsByDate = new Map<string, EventProps[]>();
  for (const ev of events) {
    const key = ev.starts_at.slice(0, 10);
    const existing = eventsByDate.get(key);
    if (existing) {
      existing.push(ev);
    } else {
      eventsByDate.set(key, [ev]);
    }
  }

  return (
    <div
      className='grid grid-cols-7 border-t border-l border-border h-full'
      style={{ gridTemplateRows: `repeat(${weeksCount}, 1fr)` }}
    >
      {Array.from({ length: totalDays }, (_, i) => {
        const day = addDays(startDate, i);
        const dateKey = format(day, 'yyyy-MM-dd');
        const dayEvents = eventsByDate.get(dateKey) ?? [];
        const isCurrentMonth = isSameMonth(day, monthStart);

        return (
          <div
            key={dateKey}
            className={`relative border border-border flex flex-col h-full px-1 ${
              isCurrentMonth ? 'bg-background' : 'bg-muted text-muted-foreground'
            }`}
          >
            <Day currentDay={day} />
            <div className='flex-1 min-h-0'>
              {dayEvents.slice(0, 3).map(event => (
                <Event key={event.id} event={event} />
              ))}
              {dayEvents.length > 3 && (
                <EventExtraButton
                  dayEvents={dayEvents}
                  count={dayEvents.length - 3}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
