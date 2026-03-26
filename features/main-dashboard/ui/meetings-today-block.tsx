import { format, parseISO } from 'date-fns';
import { Calendar, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';
import Card from '@/shared/ui/card/Card';

import type { EventProps } from '@/entities/event';

interface MeetingRowProps {
  event: EventProps;
}

/**
 * MeetingRow — single meeting entry.
 * @param root0
 * @param root0.event
 */
function MeetingRow({ event }: MeetingRowProps) {
  const start = parseISO(event.starts_at);
  const end = parseISO(event.ends_at);
  const timeLabel = `${format(start, 'HH:mm')} — ${format(end, 'HH:mm')}`;

  return (
    <div className='flex items-start justify-between gap-3 py-3 border-b border-border/50 last:border-0'>
      <div className='flex items-start gap-3 min-w-0'>
        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary mt-0.5'>
          <Calendar className='h-4 w-4' />
        </div>
        <div className='min-w-0'>
          <p className='text-sm font-medium text-foreground truncate'>
            {event.title}
          </p>
          <div className='flex items-center gap-1 mt-0.5'>
            <Clock className='h-3 w-3 text-muted-foreground' />
            <span className='text-xs text-muted-foreground'>{timeLabel}</span>
          </div>
        </div>
      </div>
      {event.url && (
        <a
          href={event.url}
          target='_blank'
          rel='noopener noreferrer'
          className='shrink-0 text-muted-foreground hover:text-primary transition-colors'
        >
          <ExternalLink className='h-3.5 w-3.5' />
        </a>
      )}
    </div>
  );
}

interface MeetingsDayBlockProps {
  title: string;
  events: EventProps[];
}

/**
 * MeetingsDayBlock — card for one day's meetings.
 * @param root0
 * @param root0.title
 * @param root0.events
 */
export function MeetingsDayBlock({ title, events }: MeetingsDayBlockProps) {
  return (
    <Card className='flex flex-col gap-0'>
      <div className='flex items-center justify-between px-5 py-4 border-b border-border'>
        <h2 className='text-base font-semibold text-foreground'>{title}</h2>
        <span className='text-xs text-muted-foreground tabular-nums'>
          {events.length === 1 ? '1 meeting' : `${events.length} meetings`}
        </span>
      </div>
      <div className='px-5'>
        {events.length === 0 ? (
          <p className='py-4 text-sm text-muted-foreground text-center'>
            No meetings scheduled
          </p>
        ) : (
          events.map((event) => {
            return <MeetingRow key={event.id} event={event} />;
          })
        )}
      </div>
      <div className='px-5 py-3 border-t border-border'>
        <Link
          href={ROUTES.DASHBOARD.CALENDAR}
          className='text-xs text-primary hover:underline'
        >
          Open calendar
        </Link>
      </div>
    </Card>
  );
}
