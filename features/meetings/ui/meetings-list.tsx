import { format, isSameWeek, parseISO, startOfWeek, subWeeks } from 'date-fns';
import { CalendarClock } from 'lucide-react';

import { MeetingCard } from '@/features/meetings/ui/meeting-card';
import { EmptyState } from '@/shared/ui/feedback/empty-state';

import type { CalendarEventListItem } from '@/features/meetings/model/types';

const WEEK_STARTS_ON = 1;

function parseDate(value: string) {
  const date = parseISO(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getWeekLabel(weekStart: Date) {
  const now = new Date();

  if (isSameWeek(weekStart, now, { weekStartsOn: WEEK_STARTS_ON })) {
    return 'THIS WEEK';
  }

  if (
    isSameWeek(weekStart, subWeeks(now, 1), {
      weekStartsOn: WEEK_STARTS_ON,
    })
  ) {
    return 'LAST WEEK';
  }

  return format(weekStart, 'MMM d, yyyy');
}

function getWeekKey(date: Date) {
  return String(startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON }).getTime());
}

interface MeetingsListProps {
  items: CalendarEventListItem[];
}

/**
 * MeetingsList component.
 * @param props - Component props.
 * @param props.items - Calendar event items.
 * @returns JSX element.
 */
export function MeetingsList({ items }: MeetingsListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title='No meetings yet'
        description='Meetings will appear here after calendar events are synced.'
      />
    );
  }

  const sortedItems = items.toSorted((left, right) => {
    const rightValue = parseDate(right.starts_at)?.getTime() ?? 0;
    const leftValue = parseDate(left.starts_at)?.getTime() ?? 0;

    return rightValue - leftValue;
  });

  const grouped = new Map<string, CalendarEventListItem[]>();

  for (const meeting of sortedItems) {
    const startsAt = parseDate(meeting.starts_at);
    const key = startsAt ? getWeekKey(startsAt) : 'unknown';
    const current = grouped.get(key) ?? [];

    current.push(meeting);
    grouped.set(key, current);
  }

  const sections = [...grouped.entries()].toSorted((left, right) => {
    const leftDate = left[0] === 'unknown' ? 0 : Number(left[0]);
    const rightDate = right[0] === 'unknown' ? 0 : Number(right[0]);

    return rightDate - leftDate;
  });

  return (
    <div className='flex flex-col gap-8'>
      {sections.map(([weekKey, weekMeetings]) => {
        const title =
          weekKey === 'unknown'
            ? 'UNSCHEDULED'
            : getWeekLabel(new Date(Number(weekKey)));

        return (
          <section key={weekKey} className='flex flex-col gap-3'>
            <div className='px-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/90'>
              {title}
            </div>

            <div className='flex flex-col gap-3'>
              {weekMeetings.map((meeting) => {
                return <MeetingCard key={meeting.id} meeting={meeting} />;
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
