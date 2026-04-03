'use client';

import { format, parseISO } from 'date-fns';
import { Calendar, Clock, ExternalLink, Radio, Video, X } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';
import { Badge } from '@/shared/ui/badge';
import ParticipantData from '@/shared/ui/participant/participant-data';

import type { EventProps } from '@/entities/event';
import type { AttendeeProps, GuestProps } from '@/entities/participant';

type MeetingState = 'active' | 'upcoming' | 'completed';

/**
 * getMeetingState — classify a meeting based on current time.
 * @param event - meeting event.
 * @param now - current timestamp.
 * @returns meeting state.
 */
export function getMeetingState(event: EventProps, now: Date): MeetingState {
  const start = new Date(event.starts_at);
  const end = new Date(event.ends_at);

  if (start <= now && end >= now) return 'active';
  if (start > now) return 'upcoming';
  return 'completed';
}

interface MeetingDetailPanelProps {
  event: EventProps;
  onClose: () => void;
  attendees: AttendeeProps[];
  guests: GuestProps[];
}

/**
 * MeetingDetailPanel — slide-in detail view for a meeting on the overview page.
 * @param root0
 * @param root0.event
 * @param root0.onClose
 */
export function MeetingDetailPanel({
  event,
  onClose,
  attendees,
  guests,
}: MeetingDetailPanelProps) {
  const now = new Date();
  const state = getMeetingState(event, now);
  const start = parseISO(event.starts_at);
  const end = parseISO(event.ends_at);

  const dateLabel = format(start, 'EEE, d MMM');
  const timeLabel = `${format(start, 'HH:mm')} — ${format(end, 'HH:mm')}`;

  return (
    <div className='flex flex-col h-full p-5 gap-4 overflow-y-auto'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0 flex-1'>
          <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1'>
            Meeting detail
          </p>
          {state === 'completed' || state === 'active' ? (
            <Link
              href={`${ROUTES.DASHBOARD.MEETING}/${event.id}`}
              className='text-base font-semibold text-foreground hover:text-primary transition-colors line-clamp-2'
            >
              {event.title}
            </Link>
          ) : (
            <p className='text-base font-semibold text-foreground line-clamp-2'>
              {event.title}
            </p>
          )}
        </div>
        <button
          type='button'
          onClick={onClose}
          className='shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors'
          aria-label='Close detail panel'
        >
          <X className='h-4 w-4' />
        </button>
      </div>

      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-2'>
          {state === 'active' && (
            <Badge variant='success' className='gap-1'>
              <Radio className='h-3 w-3' />
              Live
            </Badge>
          )}
          {state === 'upcoming' && (
            <Badge variant='default' className='gap-1'>
              <Calendar className='h-3 w-3' />
              Upcoming
            </Badge>
          )}
          {state === 'completed' && (
            <Badge variant='default' className='gap-1'>
              <Video className='h-3 w-3' />
              Completed
            </Badge>
          )}
          {event.platform ? (
            <Badge variant='default' className='capitalize'>
              {event.platform}
            </Badge>
          ) : null}
        </div>

        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Clock className='h-3.5 w-3.5 shrink-0' />
          <span>
            {dateLabel} · {timeLabel}
          </span>
        </div>
      </div>

      {event.description ? (
        <div className='rounded-[var(--radius-card)] border border-border bg-background/20 px-4 py-3'>
          <p className='text-xs font-medium text-muted-foreground mb-1'>
            Description
          </p>
          <p className='text-sm text-foreground line-clamp-4'>
            {event.description}
          </p>
        </div>
      ) : null}

      {((guests && guests.length > 0) ||
        (attendees && attendees.length > 0)) && (
        <ParticipantData
          guests={guests}
          attendees={attendees}
          withoutMatcher
          eventId={event.id}
        />
      )}

      <div className='flex flex-col gap-2 mt-auto pt-2'>
        {state === 'active' && event.url ? (
          <a
            href={event.url}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/25 transition-colors'
          >
            <ExternalLink className='h-4 w-4' />
            Join meeting
          </a>
        ) : null}
        {(state === 'completed' || state === 'active') && (
          <Link
            href={`${ROUTES.DASHBOARD.MEETING}/${event.id}`}
            className='inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/30 transition-colors'
          >
            View full meeting
          </Link>
        )}
      </div>
    </div>
  );
}
