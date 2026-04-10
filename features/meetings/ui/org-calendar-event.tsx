'use client';

import clsx from 'clsx';
import {
  Bot,
  Circle,
  CircleCheckBig,
  CircleDashed,
  Clock4,
  Video,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { isEventPast } from '@/shared/lib/isEventPast';
import { ROUTES } from '@/shared/lib/routes';

import type { CalendarEventListItem } from '@/features/meetings/model/types';

/**
 * formatTime formats an ISO or "yyyy-MM-dd HH:mm:ss" string to "h:mm AM/PM".
 * @param dateString - date string.
 * @returns formatted time string.
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString.replace(' ', 'T'));

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

interface OrgCalendarEventProps {
  event: CalendarEventListItem;
}

/**
 * OrgCalendarEvent — event pill for the org meetings calendar grid.
 * Visual rules:
 *   - Past + has_summary   → primary pill (violet)
 *   - Past + no summary + required_bot → muted + CircleDashed
 *   - Past + no bot        → muted
 *   - Future               → primary outline style
 * @param props - Component props.
 * @param props.event - Calendar event item.
 */
export function OrgCalendarEvent({ event }: OrgCalendarEventProps) {
  const isPast = isEventPast(event.ends_at);
  const hasSummary = event.has_summary;
  const { push } = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    push(`${ROUTES.DASHBOARD.MEETINGS}/${event.id}`);
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
            hasSummary ? (
              <CircleCheckBig className='text-primary' size={14} />
            ) : (
              <CircleDashed className='text-muted-foreground/60' size={14} />
            )
          ) : (
            <Circle size={14} />
          )}
          {/* eslint-enable no-nested-ternary, sonarjs/no-nested-conditional */}
        </div>
        <p className='text-xs font-bold truncate min-w-0'>{event.title}</p>
      </div>

      {/* Hover tooltip */}
      <div
        className={clsx(
          'pointer-events-none absolute z-50 left-0 top-full mt-1',
          'w-56 rounded-xl border border-border bg-card shadow-lg',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
        )}
      >
        <div className='px-3 pt-3 pb-2 border-b border-border/60'>
          <p className='text-xs font-semibold text-foreground leading-snug'>
            {event.title}
          </p>
        </div>

        <div className='px-3 py-2 flex flex-col gap-1.5'>
          {/* Time range */}
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

          {/* Bot status */}
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
}
