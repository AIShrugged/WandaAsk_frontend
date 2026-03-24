'use client';

import clsx from 'clsx';
import { parse, format } from 'date-fns';
import {
  Bot,
  Circle,
  CircleCheckBig,
  CircleDashed,
  Clock4,
  Video,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { EventPopup } from '@/features/event';
import { getAttendees, getGuests } from '@/features/participants';
import { useModal } from '@/shared/hooks/use-modal';
import { formatDate } from '@/shared/lib/dateFormatter';
import { isEventPast } from '@/shared/lib/isEventPast';
import { ROUTES } from '@/shared/lib/routes';

import type { EventProps } from '@/entities/event';

/**
 * formatTime formats a "yyyy-MM-dd HH:mm:ss" string to "h:mm a".
 * @param dateString - date string.
 * @returns formatted time.
 */
function formatTime(dateString: string): string {
  const date = parse(dateString, 'yyyy-MM-dd HH:mm:ss', new Date());

  return format(date, 'h:mm a');
}

/**
 * stripHtml removes HTML tags from a string.
 * @param html - HTML string.
 * @returns plain text.
 */
function stripHtml(html: string): string {
  return (
    html
      // eslint-disable-next-line sonarjs/slow-regex
      .replaceAll(/<[^>]*>/g, ' ')
      .replaceAll(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Event component.
 * @param props - Component props.
 * @param props.event
 * @returns JSX element.
 */
const Event = ({ event }: { event: EventProps }) => {
  const isPast = isEventPast(event.ends_at);

  const noSummary = isPast && !event.has_summary;

  const { push } = useRouter();

  const { open, close } = useModal();

  const [isPending, startTransition] = useTransition();

  /**
   * handleClick.
   * @param e - e.
   * @returns Result.
   */
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPast) {
      push(`${ROUTES.DASHBOARD.MEETING}/${event.id}?tab=summary`);

      return;
    }

    if (!open) return;

    startTransition(async () => {
      try {
        const [{ data: attendees = [] }, { data: guests = [] }] =
          await Promise.all([
            getAttendees(String(event.id)),
            getGuests(String(event.id)),
          ]);

        open(
          <EventPopup
            attendees={attendees}
            guests={guests}
            event={event}
            close={close}
          />,
        );
      } catch {
        open(
          <EventPopup attendees={[]} guests={[]} event={event} close={close} />,
        );
      }
    });
  };

  return (
    <div className='relative group mb-1'>
      {/* Event pill */}
      <div
        onClick={handleClick}
        className={clsx(
          'flex flex-row items-center gap-2 rounded-full p-[6px] transition-colors cursor-pointer select-none',
          isPast
            ? 'bg-muted text-muted-foreground'
            : 'bg-primary text-primary-foreground',
          isPending && 'opacity-60',
        )}
      >
        <div className='flex flex-row items-center gap-2 flex-shrink-0'>
          {/* eslint-disable no-nested-ternary, sonarjs/no-nested-conditional */}
          {isPast ? (
            noSummary ? (
              <CircleDashed className='text-muted-foreground/60' size={14} />
            ) : (
              <CircleCheckBig className='text-primary' size={14} />
            )
          ) : (
            <Circle size={14} />
          )}
          {/* eslint-enable no-nested-ternary, sonarjs/no-nested-conditional */}
          {isPast && (
            <p className='text-xs text-muted-foreground line-through whitespace-nowrap'>
              {formatDate(event.starts_at)}
            </p>
          )}
        </div>
        <p className='text-xs font-bold truncate min-w-0'>{event.title}</p>
      </div>

      {/* Tooltip */}
      <div
        className={clsx(
          'pointer-events-none absolute z-50 left-0 top-full mt-1',
          'w-56 rounded-xl border border-border bg-card shadow-lg',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
        )}
      >
        {/* Title */}
        <div className='px-3 pt-3 pb-2 border-b border-border/60'>
          <p className='text-xs font-semibold text-foreground leading-snug'>
            {event.title}
          </p>
        </div>

        <div className='px-3 py-2 flex flex-col gap-1.5'>
          {/* Time */}
          <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
            <Clock4 className='h-3 w-3 flex-shrink-0' />
            <span>
              {formatTime(event.starts_at)} – {formatTime(event.ends_at)}
            </span>
          </div>

          {/* Platform */}
          {event.platform ? (
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <Video className='h-3 w-3 flex-shrink-0' />
              <span className='capitalize'>{event.platform}</span>
            </div>
          ) : null}

          {/* Description */}
          {event.description ? (
            <p className='text-xs text-muted-foreground leading-relaxed line-clamp-3 pt-0.5'>
              {stripHtml(event.description)}
            </p>
          ) : null}

          {/* Bot */}
          <div className='flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5'>
            <Bot className='h-3 w-3 flex-shrink-0' />
            <span className={event.required_bot ? 'text-primary' : ''}>
              {event.required_bot ? 'Bot added' : 'No bot'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

Event.displayName = 'CalendarEvent';

export default Event;
