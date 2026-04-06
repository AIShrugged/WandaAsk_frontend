'use client';

import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, CheckCircle2, Clock, Radio, Video } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

import { ROUTES } from '@/shared/lib/routes';
import { Badge } from '@/shared/ui/badge';
import Card from '@/shared/ui/card/Card';

import { getMeetingState, MeetingDetailPanel } from './meeting-detail-panel';

import type { EventProps } from '@/entities/event';
import type { AttendeeProps, GuestProps } from '@/entities/participant';

interface MeetingRowProps {
  event: EventProps;
  now: Date;
  onSelect: (id: number) => void;
  isSelected: boolean;
}

/**
 * MeetingRow — single meeting entry with state-appropriate UI.
 * @param root0
 * @param root0.event
 * @param root0.now
 * @param root0.onSelect
 * @param root0.isSelected
 */
function MeetingRow({ event, now, onSelect, isSelected }: MeetingRowProps) {
  const state = getMeetingState(event, now);
  const start = parseISO(event.starts_at);
  const end = parseISO(event.ends_at);
  const timeLabel = `${format(start, 'HH:mm')} — ${format(end, 'HH:mm')}`;

  const iconBg =
    state === 'active'
      ? 'bg-emerald-500/10 text-emerald-400'
      : 'bg-primary/10 text-primary';

  const titleNode =
    state === 'completed' || state === 'active' ? (
      <Link
        href={`${ROUTES.DASHBOARD.MEETINGS}/${event.id}`}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className='text-sm font-medium text-foreground truncate hover:text-primary transition-colors'
      >
        {event.title}
      </Link>
    ) : (
      <p className='text-sm font-medium text-foreground truncate'>
        {event.title}
      </p>
    );

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={() => {
        onSelect(event.id);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(event.id);
      }}
      className={`flex items-start justify-between gap-3 py-3 border-b border-border/50 last:border-0 -mx-5 px-5 transition-colors cursor-pointer ${
        isSelected ? 'bg-accent/30' : 'hover:bg-accent/20'
      }`}
    >
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
            {titleNode}
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
}

interface MeetingGroupProps {
  title: string;
  events: EventProps[];
  now: Date;
  cap?: number;
  showCalendarLink?: boolean;
  selectedEventId: number | null;
  onSelect: (id: number) => void;
}

/**
 * MeetingGroup — a labeled section of meetings.
 * @param root0
 * @param root0.title
 * @param root0.events
 * @param root0.now
 * @param root0.cap
 * @param root0.showCalendarLink
 * @param root0.selectedEventId
 * @param root0.onSelect
 */
function MeetingGroup({
  title,
  events,
  now,
  cap,
  showCalendarLink = false,
  selectedEventId,
  onSelect,
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
          return (
            <MeetingRow
              key={event.id}
              event={event}
              now={now}
              onSelect={onSelect}
              isSelected={selectedEventId === event.id}
            />
          );
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
  initialSelectedId?: number | null;
  initialAttendees?: AttendeeProps[];
  initialGuests?: GuestProps[];
}

const PAST_EVENTS_CAP = 5;

/**
 * MeetingsBlock — unified full-width meetings list with Today / Tomorrow / Earlier sections.
 * Clicking a row opens an inline detail panel at 50% width.
 * Clicking the meeting title navigates to the full meeting page.
 * @param root0
 * @param root0.todayEvents
 * @param root0.tomorrowEvents
 * @param root0.pastEvents
 */
export function MeetingsBlock({
  todayEvents,
  tomorrowEvents,
  pastEvents,
  initialSelectedId = null,
  initialAttendees = [],
  initialGuests = [],
}: MeetingsBlockProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const meetingIdParam = searchParams.get('meeting_id');
  const selectedEventId: number | null = meetingIdParam
    ? Number(meetingIdParam)
    : initialSelectedId;

  const handleSelect = (id: number) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('meeting_id', String(id));
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const handleClose = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete('meeting_id');
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const now = new Date();

  const allEvents = useMemo(() => {
    return [...todayEvents, ...tomorrowEvents, ...pastEvents];
  }, [todayEvents, tomorrowEvents, pastEvents]);

  const selectedEvent = useMemo(() => {
    return (
      allEvents.find((e) => {
        return e.id === selectedEventId;
      }) ?? null
    );
  }, [allEvents, selectedEventId]);

  const isEmpty =
    todayEvents.length === 0 &&
    tomorrowEvents.length === 0 &&
    pastEvents.length === 0;

  return (
    <Card className='flex flex-row gap-0 overflow-hidden'>
      <div className='flex flex-col flex-1 min-w-0'>
        <div className='flex items-center justify-between px-5 py-4 border-b border-border'>
          <div className='flex items-center gap-2'>
            <Calendar className='h-4 w-4 text-primary' />
            <h2 className='text-base font-semibold text-foreground'>
              Meetings
            </h2>
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
            <MeetingGroup
              title='Today'
              events={todayEvents}
              now={now}
              selectedEventId={selectedEventId}
              onSelect={handleSelect}
            />
            <MeetingGroup
              title='Tomorrow'
              events={tomorrowEvents}
              now={now}
              selectedEventId={selectedEventId}
              onSelect={handleSelect}
            />
            <MeetingGroup
              title='Earlier'
              events={pastEvents}
              now={now}
              cap={PAST_EVENTS_CAP}
              showCalendarLink={pastEvents.length > PAST_EVENTS_CAP}
              selectedEventId={selectedEventId}
              onSelect={handleSelect}
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            key='meeting-detail'
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '50%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className='shrink-0 border-l border-border overflow-hidden min-w-[280px]'
          >
            <MeetingDetailPanel
              event={selectedEvent}
              onClose={handleClose}
              attendees={initialAttendees}
              guests={initialGuests}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
