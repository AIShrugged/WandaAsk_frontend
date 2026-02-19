import { format, isSameMonth, parseISO } from 'date-fns';

import type { EventProps } from '@/entities/event';

export default function CalendarAgenda({
  events,
  currentMonth,
}: {
  events: EventProps[];
  currentMonth: string;
}) {
  const monthStart = parseISO(currentMonth + '-01');

  const monthEvents = events
    .filter(ev => isSameMonth(parseISO(ev.starts_at.split(' ')[0]), monthStart))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  if (!monthEvents.length) {
    return (
      <p className='text-secondary text-sm py-4 text-center'>
        No events this month
      </p>
    );
  }

  const grouped = new Map<string, EventProps[]>();
  for (const ev of monthEvents) {
    const key = ev.starts_at.split(' ')[0];
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(ev);
  }

  return (
    <div className='flex flex-col gap-4 py-2'>
      {Array.from(grouped.entries()).map(([date, dayEvents]) => (
        <div key={date}>
          <p className='text-xs font-medium text-secondary mb-1'>
            {format(parseISO(date), 'EEE, d MMM')}
          </p>
          <div className='flex flex-col gap-1'>
            {dayEvents.map(ev => (
              <div
                key={ev.id}
                className='px-3 py-2 rounded-lg bg-secondary text-sm text-primary truncate'
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
