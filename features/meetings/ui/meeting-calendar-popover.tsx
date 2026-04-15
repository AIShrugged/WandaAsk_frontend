'use client';

import { Bot, Calendar, Clock4, Video, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { getMeetingDisplayState } from '@/features/meetings/model/meeting-state';
import { ROUTES } from '@/shared/lib/routes';

import { BotToggleButton } from './bot-toggle-button';
import { MeetingJoinButton } from './meeting-join-button';

import type { CalendarEventListItem } from '@/features/meetings/model/types';

function formatTimeRange(startsAt: Date, endsAt: Date): string {
  const fmt = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${fmt.format(startsAt)} – ${fmt.format(endsAt)}`;
}

interface MeetingCalendarPopoverProps {
  event: CalendarEventListItem;
  onClose: () => void;
}

/**
 * MeetingCalendarPopover — shown when clicking a future calendar event pill.
 * Provides Connect and Bot toggle actions without navigating away.
 * For past meetings, it navigates to the detail page instead.
 */
export function MeetingCalendarPopover({
  event,
  onClose,
}: MeetingCalendarPopoverProps) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const displayState = getMeetingDisplayState(event);
  const isPast =
    displayState === 'past_with_summary' ||
    displayState === 'past_missed_bot' ||
    displayState === 'past_no_bot';
  const isCompleted = event.has_summary;
  const startsAt = new Date(event.starts_at.replace(' ', 'T'));
  const endsAt = new Date(event.ends_at.replace(' ', 'T'));

  // Close on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleViewDetails = () => {
    router.push(ROUTES.DASHBOARD.MEETING_DETAIL(event.id));
    onClose();
  };

  return (
    <div
      ref={ref}
      className='absolute z-50 left-0 top-full mt-1 w-64 rounded-xl border border-border bg-card shadow-lg'
      onClick={(e) => {
        return e.stopPropagation();
      }}
    >
      {/* Header */}
      <div className='flex items-start justify-between gap-2 border-b border-border/60 px-4 pt-3 pb-2'>
        <p className='text-xs font-semibold leading-snug text-foreground line-clamp-2'>
          {event.title}
        </p>
        <button
          type='button'
          onClick={onClose}
          className='flex-shrink-0 rounded-md p-0.5 text-muted-foreground hover:text-foreground transition-colors'
        >
          <X className='h-3.5 w-3.5' />
        </button>
      </div>

      {/* Meta */}
      <div className='flex flex-col gap-1.5 px-4 py-3'>
        <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
          <Clock4 className='h-3 w-3 flex-shrink-0' />
          <span>{formatTimeRange(startsAt, endsAt)}</span>
        </div>
        {event.platform && (
          <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
            <Video className='h-3 w-3 flex-shrink-0' />
            <span className='capitalize'>{event.platform}</span>
          </div>
        )}
        <div className='flex items-center gap-1.5 text-xs'>
          <Bot className='h-3 w-3 flex-shrink-0 text-muted-foreground' />
          <span
            className={
              event.required_bot ? 'text-primary' : 'text-muted-foreground'
            }
          >
            {event.required_bot ? 'Bot scheduled' : 'No bot'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className='flex flex-wrap items-center gap-2 border-t border-border/60 px-4 py-3'>
        {!isPast && (
          <MeetingJoinButton url={event.url} isCompleted={isCompleted} />
        )}
        {!isPast && (
          <BotToggleButton eventId={event.id} isBotAdded={event.required_bot} />
        )}
        <button
          type='button'
          onClick={handleViewDetails}
          className='inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground'
        >
          <Calendar className='h-3 w-3' />
          View details
        </button>
      </div>
    </div>
  );
}
