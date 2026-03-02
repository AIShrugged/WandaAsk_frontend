import { format, isSameMonth, parseISO } from 'date-fns';

import type { EventProps } from '@/entities/event';

// currentMonth is always "yyyy-MM-dd" (e.g. "2026-03-01")
const eventDateKey = (ev: EventProps) => ev.starts_at.slice(0, 10);

export default function CalendarAgenda({
  events,
  currentMonth,
}: {
  events: EventProps[];
  currentMonth: string;
}) {
  // Fix: currentMonth is already a full date string ("2026-03-01"), no need to append "-01"
  const monthStart = parseISO(currentMonth);

  const monthEvents = events
    .filter(ev => isSameMonth(parseISO(eventDateKey(ev)), monthStart))
    .toSorted((a, b) => a.starts_at.localeCompare(b.starts_at));

  if (monthEvents.length === 0) {
    return (
      <p className='text-muted-foreground text-sm py-4 text-center'>
        No events this month
      </p>
    );
  }

  const grouped = new Map<string, EventProps[]>();
  for (const ev of monthEvents) {
    const key = eventDateKey(ev);
    const existing = grouped.get(key);
    if (existing) {
      existing.push(ev);
    } else {
      grouped.set(key, [ev]);
    }
  }

  return (
    <div className='flex flex-col gap-4 py-2'>
      {[...grouped.entries()].map(([date, dayEvents]) => (
        <div key={date}>
          <p className='text-xs font-medium text-muted-foreground mb-1'>
            {format(parseISO(date), 'EEE, d MMM')}
          </p>
          <div className='flex flex-col gap-1'>
            {dayEvents.map(ev => (
              <div
                key={ev.id}
                className='px-3 py-2 rounded-md bg-muted text-sm text-foreground truncate'
              >
                {ev.title}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
