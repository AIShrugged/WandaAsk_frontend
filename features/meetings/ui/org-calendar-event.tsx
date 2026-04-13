'use client';

import clsx from 'clsx';
import { Circle, CircleCheckBig, CircleDashed } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { isEventPast } from '@/shared/lib/isEventPast';
import { ROUTES } from '@/shared/lib/routes';

import { MeetingCalendarPopover } from './meeting-calendar-popover';

import type { CalendarEventListItem } from '@/features/meetings/model/types';

interface OrgCalendarEventProps {
  event: CalendarEventListItem;
}

/**
 * OrgCalendarEvent — event pill for the org meetings calendar grid.
 * Visual rules:
 *   - Past + has_summary   → primary pill (violet)
 *   - Past + no summary    → muted + CircleDashed
 *   - Future               → primary fill
 * Clicking a future event opens an action popover.
 * Clicking a past event navigates to the meeting detail.
 * @param props - Component props.
 * @param props.event - Calendar event item.
 */
export function OrgCalendarEvent({ event }: OrgCalendarEventProps) {
  const isPast = isEventPast(event.ends_at);
  const hasSummary = event.has_summary;
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { push } = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPast) {
      push(`${ROUTES.DASHBOARD.MEETINGS}/${event.id}`);

      return;
    }

    setPopoverOpen((prev) => {
      return !prev;
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

      {/* Hover tooltip (past events only — future opens popover) */}
      {!popoverOpen && (
        <div
          className={clsx(
            'pointer-events-none absolute z-40 left-0 top-full mt-1',
            'w-56 rounded-xl border border-border bg-card shadow-lg',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
          )}
        >
          <div className='px-3 pt-3 pb-2 border-b border-border/60'>
            <p className='text-xs font-semibold text-foreground leading-snug'>
              {event.title}
            </p>
          </div>
        </div>
      )}

      {/* Popover — future events only */}
      {popoverOpen && !isPast && (
        <MeetingCalendarPopover
          event={event}
          onClose={() => {
            return setPopoverOpen(false);
          }}
        />
      )}
    </div>
  );
}
