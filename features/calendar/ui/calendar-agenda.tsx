import { format, isSameMonth, parseISO } from 'date-fns';

import { isEventPast } from '@/shared/lib/isEventPast';

import type { EventProps } from '@/entities/event';

// currentMonth is always "yyyy-MM-dd" (e.g. "2026-03-01")
/**
 * eventDateKey.
 * @param ev - ev.
 * @returns Result.
 */
const eventDateKey = (ev: EventProps) => {
  return ev.starts_at.slice(0, 10);
};

/**
 * CalendarAgenda component.
 * @param root0
 * @param root0.events
 * @param root0.currentMonth
 */
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
    .filter((ev) => {
      return isSameMonth(parseISO(eventDateKey(ev)), monthStart);
    })
    .toSorted((a, b) => {
      return a.starts_at.localeCompare(b.starts_at);
    });

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
      {[...grouped.entries()].map(([date, dayEvents]) => {
        return (
          <div key={date}>
            <p className='text-xs font-medium text-muted-foreground mb-1'>
              {format(parseISO(date), 'EEE, d MMM')}
            </p>
            <div className='flex flex-col gap-1'>
              {dayEvents.map((ev) => {
                const noSummary = isEventPast(ev.ends_at) && !ev.has_summary;

                return (
                  <div
                    key={ev.id}
                    className='px-3 py-2 rounded-md bg-muted text-sm text-foreground flex items-center gap-2'
                  >
                    <span className='truncate flex-1'>{ev.title}</span>
                    {noSummary && (
                      <span className='text-xs text-muted-foreground/60 whitespace-nowrap flex-shrink-0'>
                        No summary
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
