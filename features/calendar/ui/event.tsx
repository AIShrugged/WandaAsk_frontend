'use client';

import clsx from 'clsx';
import { format } from 'date-fns';
import {
  Bot,
  Circle,
  CircleCheckBig,
  CircleDashed,
  Clock4,
  Video,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  BotPillIcon,
  getBotPillIndicator,
  getMeetingDisplayState,
} from '@/features/meetings';
import { formatDate, parseEventDate } from '@/shared/lib/dateFormatter';
import { isEventPast } from '@/shared/lib/isEventPast';
import { ROUTES } from '@/shared/lib/routes';

import type { EventProps } from '@/entities/event';

/**
 * formatTime formats a date string to "h:mm a".
 * Accepts "yyyy-MM-dd HH:mm:ss" or ISO 8601 strings.
 */
function formatTime(dateString: string): string {
  return format(parseEventDate(dateString), 'h:mm a');
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

interface EventComponentProps {
  event: EventProps;
  onFutureEventClick?: (event: EventProps) => void;
}

/**
 * Event component.
 * @param props - Component props.
 * @param props.event
 * @param props.onFutureEventClick - Callback invoked when clicking a future event (opens popup).
 * @returns JSX element.
 */
// eslint-disable-next-line complexity
const Event = ({ event, onFutureEventClick }: EventComponentProps) => {
  const isPast = isEventPast(event.ends_at);
  const noSummary = isPast && !event.has_summary;
  const displayState = getMeetingDisplayState(event);
  const botIndicator = getBotPillIndicator(displayState);
  const { push } = useRouter();
  /**
   * navigateToMeeting navigates to the meeting summary page.
   * @returns void.
   */
  const navigateToMeeting = () => {
    push(`${ROUTES.DASHBOARD.MEETINGS}/${event.id}`);
  };
  /**
   * handleClick handles event pill click.
   * @param e - mouse event.
   * @returns void.
   */
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPast) {
      navigateToMeeting();

      return;
    }

    onFutureEventClick?.(event);
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
        <BotPillIcon indicator={botIndicator} size={12} />
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
