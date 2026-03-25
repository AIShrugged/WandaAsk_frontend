import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { Video, Clock, CheckCircle2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';
import Card from '@/shared/ui/card/Card';

import type { EventProps } from '@/entities/event';

interface LastMeetingBlockProps {
  meeting: EventProps | null;
}

/**
 * LastMeetingBlock — shows the most recent past meeting.
 * @param root0
 * @param root0.meeting
 */
export function LastMeetingBlock({ meeting }: LastMeetingBlockProps) {
  return (
    <Card className='flex flex-col gap-0'>
      <div className='flex items-center justify-between px-5 py-4 border-b border-border'>
        <h2 className='text-base font-semibold text-foreground'>
          Last Meeting
        </h2>
        {meeting && (
          <Link
            href={`${ROUTES.DASHBOARD.MEETING}/${meeting.id}`}
            className='text-xs text-primary hover:underline'
          >
            View details
          </Link>
        )}
      </div>
      <div className='px-5 py-4'>
        {meeting === null ? (
          <p className='text-sm text-muted-foreground text-center py-2'>
            No past meetings found
          </p>
        ) : (
          <div className='flex flex-col gap-3'>
            <div className='flex items-start gap-3'>
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary'>
                <Video className='h-4 w-4' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-sm font-semibold text-foreground leading-snug'>
                  {meeting.title}
                </p>
                <p className='text-xs text-muted-foreground mt-0.5'>
                  {formatDistanceToNow(parseISO(meeting.ends_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              {meeting.url && (
                <a
                  href={meeting.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='shrink-0 text-muted-foreground hover:text-primary transition-colors'
                >
                  <ExternalLink className='h-3.5 w-3.5' />
                </a>
              )}
            </div>
            <div className='flex flex-wrap gap-3'>
              <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                <Clock className='h-3.5 w-3.5' />
                <span>
                  {format(parseISO(meeting.starts_at), 'MMM d, HH:mm')} —{' '}
                  {format(parseISO(meeting.ends_at), 'HH:mm')}
                </span>
              </div>
              {meeting.has_summary && (
                <div className='flex items-center gap-1.5 text-xs text-emerald-400'>
                  <CheckCircle2 className='h-3.5 w-3.5' />
                  <span>Summary available</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
