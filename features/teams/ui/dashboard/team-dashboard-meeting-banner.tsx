import { format, parseISO } from 'date-fns';
import { Calendar } from 'lucide-react';

import type { DashboardMeetingCard } from '../../model/dashboard-types';

interface TeamDashboardMeetingBannerProps {
  meeting: DashboardMeetingCard;
}

/**
 * TeamDashboardMeetingBanner — compact upcoming meeting strip.
 * @param props - Component props.
 * @param props.meeting
 */
export default function TeamDashboardMeetingBanner({
  meeting,
}: TeamDashboardMeetingBannerProps) {
  const startTime = format(parseISO(meeting.starts_at), 'MMM d, HH:mm');

  return (
    <div className='flex items-center gap-3 px-6 py-3 border-b border-border bg-primary/5'>
      <Calendar className='h-4 w-4 text-primary flex-shrink-0' />
      <div className='flex-1 min-w-0'>
        <span className='text-xs text-muted-foreground'>Upcoming: </span>
        <span className='text-sm font-medium text-foreground truncate'>
          {meeting.title}
        </span>
        <span className='text-xs text-muted-foreground ml-2'>{startTime}</span>
      </div>
      {meeting.meeting_link && (
        <a
          href={meeting.meeting_link.url}
          target='_blank'
          rel='noreferrer'
          className='flex-shrink-0 text-xs font-medium text-primary hover:text-primary/80 transition-colors'
        >
          {meeting.meeting_link.label}
        </a>
      )}
    </div>
  );
}
