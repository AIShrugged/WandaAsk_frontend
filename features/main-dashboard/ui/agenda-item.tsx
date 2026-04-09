'use client';

import { format, parseISO } from 'date-fns';
import { CalendarClock } from 'lucide-react';
import { useState } from 'react';

import { AgendaStatusBadge } from '@/features/main-dashboard/ui/agenda-status-badge';
import { Badge } from '@/shared/ui/badge';

import type { MeetingAgenda } from '@/features/main-dashboard/model/agenda-types';

interface AgendaItemProps {
  agenda: MeetingAgenda;
}

export function AgendaItem({ agenda }: AgendaItemProps) {
  const [expanded, setExpanded] = useState(false);
  const hasContent = agenda.status === 'done' && Boolean(agenda.content);

  return (
    <div className='flex items-start gap-3 py-3 border-b border-border/50 last:border-0'>
      <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary'>
        <CalendarClock className='h-4 w-4' />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='text-sm font-medium text-foreground truncate'>
          {agenda.calendar_event.title}
        </p>
        <div className='flex items-center gap-1.5 mt-0.5 flex-wrap'>
          <Badge
            variant={agenda.type === 'personal' ? 'primary' : 'default'}
            className='text-xs'
          >
            {agenda.type === 'personal' ? 'Personal' : 'General'}
          </Badge>
          <span className='text-xs text-muted-foreground'>
            {format(parseISO(agenda.calendar_event.starts_at), 'MMM d, HH:mm')}
          </span>
        </div>
        {hasContent && (
          <div className='mt-1.5'>
            <p
              className={`text-xs text-muted-foreground whitespace-pre-wrap ${expanded ? '' : 'line-clamp-3'}`}
            >
              {agenda.content}
            </p>
            <button
              type='button'
              onClick={() => {
                setExpanded((prev) => {
                  return !prev;
                });
              }}
              className='mt-1 text-xs text-primary hover:underline'
            >
              {expanded ? 'Show less ↑' : 'Show more ↓'}
            </button>
          </div>
        )}
      </div>
      <AgendaStatusBadge status={agenda.status} />
    </div>
  );
}
