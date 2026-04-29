import { Calendar, Clock, UserCircle } from 'lucide-react';

import { DecisionSourceBadge } from '@/features/decisions/ui/decision-source-badge';

import type { Decision } from '@/features/decisions/model/types';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  decision: Decision;
}

export function DecisionCard({ decision }: Props) {
  const authorName = decision.author?.name ?? decision.author_raw_name ?? null;
  const meeting = decision.calendar_event;

  return (
    <div
      className='flex flex-col gap-2 p-4 bg-background border border-border rounded-[var(--radius-card)] hover:border-border/80 transition-colors'
      data-decision-id={decision.id}
      data-meeting-id={meeting?.id ?? undefined}
      data-meeting-title={meeting?.title ?? undefined}
      data-meeting-date={meeting?.starts_at ?? undefined}
    >
      {decision.topic && (
        <span className='text-xs font-semibold text-primary/80 uppercase tracking-wide'>
          {decision.topic}
        </span>
      )}
      <p className='text-sm text-foreground leading-relaxed'>{decision.text}</p>

      <div className='flex items-center gap-3 flex-wrap mt-1'>
        <DecisionSourceBadge sourceType={decision.source_type} />

        {authorName && (
          <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
            <UserCircle className='w-3 h-3' />
            {authorName}
          </span>
        )}

        {meeting && (
          <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
            <Calendar className='w-3 h-3 shrink-0' />
            <span className='truncate max-w-[200px]'>{meeting.title}</span>
            <Clock className='w-3 h-3 shrink-0 ml-1' />
            {formatTime(meeting.starts_at)}
          </span>
        )}

        {decision.issues && decision.issues.length > 0 && (
          <span className='text-xs text-muted-foreground'>
            {decision.issues.length} issue
            {decision.issues.length === 1 ? '' : 's'}
          </span>
        )}
      </div>
    </div>
  );
}
