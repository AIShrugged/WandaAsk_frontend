'use client';

import { differenceInMinutes, format, parseISO } from 'date-fns';
import { Clock, Users, Video } from 'lucide-react';

import Card from '@/shared/ui/card/Card';

import { AgendaList } from './agenda-list';
import { AiPrepPanel } from './ai-prep-panel';
import { CarriedTasks } from './carried-tasks';

import type { CarriedTask, TodayEvent } from '../model/types';

interface MeetingDetailCardProps {
  event: TodayEvent;
  carriedTasks: CarriedTask[];
}

export function MeetingDetailCard({
  event,
  carriedTasks,
}: MeetingDetailCardProps) {
  const start = parseISO(event.starts_at);
  const end = parseISO(event.ends_at);
  const duration = differenceInMinutes(end, start);

  // Filter carried tasks relevant to this meeting series (by title)
  const relevantCarried = carriedTasks.filter(
    (t) => t.source_meeting_title === event.title,
  );

  return (
    <Card className='flex flex-col gap-0 overflow-hidden'>
      {/* Header */}
      <div className='px-5 pt-4 pb-3 border-b border-border'>
        <h3 className='text-base font-semibold text-foreground'>
          {event.title}
        </h3>
        <div className='flex items-center gap-3 mt-1 text-xs text-muted-foreground'>
          <span className='flex items-center gap-1'>
            <Clock className='h-3 w-3' />
            {format(start, 'HH:mm')} — {format(end, 'HH:mm')} ({duration} min)
          </span>
          {event.participants_count > 0 && (
            <span className='flex items-center gap-1'>
              <Users className='h-3 w-3' />
              {event.participants_count} people
            </span>
          )}
          {event.platform && (
            <span className='flex items-center gap-1'>
              <Video className='h-3 w-3' />
              {event.platform.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>

      <div className='flex flex-col gap-4 px-5 py-4'>
        {/* Briefing */}
        {event.summary && (
          <div>
            <p className='text-sm text-foreground'>
              <span className='font-semibold'>Briefing: </span>
              {event.summary.summary}
            </p>
            {event.review?.key_insight && (
              <p className='mt-2 text-xs text-muted-foreground italic'>
                {event.review.key_insight}
              </p>
            )}
          </div>
        )}

        {/* Agenda (tasks) */}
        <AgendaList tasks={event.tasks} />

        {/* Carried tasks */}
        <CarriedTasks tasks={relevantCarried} />

        {/* AI Prep */}
        <AiPrepPanel tasks={event.tasks} />
      </div>
    </Card>
  );
}
