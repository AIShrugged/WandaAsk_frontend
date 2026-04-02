import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { Calendar, CheckCircle2, Clock, Radio, Video } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';
import { Badge } from '@/shared/ui/badge';
import Card from '@/shared/ui/card/Card';

import type { EventProps } from '@/entities/event';

type MeetingState = 'active' | 'upcoming' | 'completed';

/**
 * getMeetingState — classify a meeting based on current time.
 * @param event - meeting event.
 * @param now - current timestamp.
 * @returns meeting state.
 */
function getMeetingState(event: EventProps, now: Date): MeetingState {
  const start = new Date(event.starts_at);
  const end = new Date(event.ends_at);

  if (start <= now && end >= now) return 'active';
  if (start > now) return 'upcoming';
  return 'completed';
}

interface MeetingRowProps {
  event: EventProps;
  now: Date;
}

/**
 * MeetingRow — single meeting entry with state-appropriate UI.
 * @param root0
 * @param root0.event
 * @param root0.now
 */
function MeetingRow({ event, now }: MeetingRowProps) {
  const state = getMeetingState(event, now);
  const start = parseISO(event.starts_at);
  const end = parseISO(event.ends_at);
  const timeLabel = `${format(start, 'HH:mm')} — ${format(end, 'HH:mm')}`;

  const iconBg =
    state === 'active'
      ? 'bg-emerald-500/10 text-emerald-400'
      : 'bg-primary/10 text-primary';

  const inner = (
    <div className='flex items-start justify-between gap-3 py-3'>
      <div className='flex items-start gap-3 min-w-0 flex-1'>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md mt-0.5 ${iconBg}`}
        >
          {state === 'active' && <Radio className='h-4 w-4' />}
          {state === 'completed' && <Video className='h-4 w-4' />}
          {state === 'upcoming' && <Calendar className='h-4 w-4' />}
        </div>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2 flex-wrap'>
            <p className='text-sm font-medium text-foreground truncate'>
              {event.title}
            </p>
            {state === 'active' && (
              <Badge variant='success' className='text-[10px] px-1.5 py-0'>
                Live
              </Badge>
            )}
            {state === 'completed' && event.has_summary && (
              <span className='flex items-center gap-1 text-[10px] text-emerald-400'>
                <CheckCircle2 className='h-3 w-3' />
                Summary
              </span>
            )}
          </div>
          <div className='flex items-center gap-1 mt-0.5'>
            <Clock className='h-3 w-3 text-muted-foreground' />
            <span className='text-xs text-muted-foreground'>
              {state === 'completed'
                ? formatDistanceToNow(end, { addSuffix: true })
                : timeLabel}
            </span>
          </div>
        </div>
      </div>

      <div className='flex items-center gap-2 shrink-0'>
        {state === 'active' && event.url && (
          <a
            href={event.url}
            target='_blank'
            rel='noopener noreferrer'
            onClick={(ev) => {
              ev.stopPropagation();
            }}
            className='inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/25 transition-colors'
          >
            Join
          </a>
        )}
      </div>
    </div>
  );

  if (state === 'completed' || state === 'active') {
    return (
      <Link
        href={`${ROUTES.DASHBOARD.MEETING}/${event.id}`}
        className='block border-b border-border/50 last:border-0 hover:bg-accent/20 -mx-5 px-5 transition-colors'
      >
        {inner}
      </Link>
    );
  }

  return <div className='border-b border-border/50 last:border-0'>{inner}</div>;
}

interface MeetingGroupProps {
  title: string;
  events: EventProps[];
  now: Date;
  cap?: number;
  showCalendarLink?: boolean;
}

/**
 * MeetingGroup — a labeled section of meetings.
 * @param root0
 * @param root0.title
 * @param root0.events
 * @param root0.now
 * @param root0.cap
 * @param root0.showCalendarLink
 */
function MeetingGroup({
  title,
  events,
  now,
  cap,
  showCalendarLink = false,
}: MeetingGroupProps) {
  if (events.length === 0) return null;

  const displayed = cap ? events.slice(0, cap) : events;
  const hasMore = cap !== undefined && events.length > cap;

  return (
    <div>
      <p className='px-5 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
        {title}
      </p>
      <div className='px-5'>
        {displayed.map((event) => {
          return <MeetingRow key={event.id} event={event} now={now} />;
        })}
      </div>
      {(hasMore || showCalendarLink) && (
        <div className='px-5 py-2'>
          <Link
            href={ROUTES.DASHBOARD.CALENDAR}
            className='text-xs text-primary hover:underline'
          >
            {hasMore
              ? `+${events.length - displayed.length} more — View all in Calendar`
              : 'View all in Calendar'}
          </Link>
        </div>
      )}
    </div>
  );
}

interface MeetingsBlockProps {
  todayEvents: EventProps[];
  tomorrowEvents: EventProps[];
  pastEvents: EventProps[];
}

const PAST_EVENTS_CAP = 5;

/**
 * MeetingsBlock — unified full-width meetings list with Today / Tomorrow / Earlier sections.
 * Active meetings show a "Join" button and Live badge.
 * Completed meetings link to the detail page.
 * @param root0
 * @param root0.todayEvents
 * @param root0.tomorrowEvents
 * @param root0.pastEvents
 */
export function MeetingsBlock({
  todayEvents,
  tomorrowEvents,
  pastEvents,
}: MeetingsBlockProps) {
  const now = new Date();
  const isEmpty =
    todayEvents.length === 0 &&
    tomorrowEvents.length === 0 &&
    pastEvents.length === 0;

  return (
    <Card className='flex flex-col gap-0 overflow-hidden'>
      <div className='flex items-center justify-between px-5 py-4 border-b border-border'>
        <div className='flex items-center gap-2'>
          <Calendar className='h-4 w-4 text-primary' />
          <h2 className='text-base font-semibold text-foreground'>Meetings</h2>
        </div>
        <Link
          href={ROUTES.DASHBOARD.CALENDAR}
          className='text-xs text-primary hover:underline'
        >
          Open calendar
        </Link>
      </div>

      {isEmpty ? (
        <p className='py-8 text-sm text-muted-foreground text-center'>
          No meetings scheduled
        </p>
      ) : (
        <div className='divide-y divide-border/30'>
          <MeetingGroup title='Today' events={todayEvents} now={now} />
          <MeetingGroup title='Tomorrow' events={tomorrowEvents} now={now} />
          <MeetingGroup
            title='Earlier'
            events={pastEvents}
            now={now}
            cap={PAST_EVENTS_CAP}
            showCalendarLink={pastEvents.length > PAST_EVENTS_CAP}
          />
        </div>
      )}
    </Card>
  );
}
