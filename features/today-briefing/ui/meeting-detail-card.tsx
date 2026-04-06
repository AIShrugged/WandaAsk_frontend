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

  // Show all carried tasks — backend already filters by user's meeting series
  const relevantCarried = carriedTasks;

  return (
    <Card className='flex flex-col gap-0 overflow-hidden'>
      {/* Header */}
      <div className='px-5 pt-4 pb-3 border-b border-border'>
        {event.meeting_url ? (
          <a
            href={event.meeting_url}
            target='_blank'
            rel='noopener noreferrer'
            className='text-base font-semibold text-foreground hover:text-primary transition-colors'
          >
            {event.title}
          </a>
        ) : (
          <span className='text-base font-semibold text-foreground'>
            {event.title}
          </span>
        )}
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
        {/* Briefing (from past meeting summary) */}
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

        {/* Agenda content (upcoming/general agenda for future meetings) */}
        {!event.summary && event.agenda_content && (
          <div>
            <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
              Agenda
            </span>
            <p className='mt-1 text-sm text-foreground whitespace-pre-wrap'>
              {event.agenda_content}
            </p>
          </div>
        )}

        {/* Agenda (tasks) */}
        <AgendaList
          tasks={event.tasks}
          totalCount={event.total_tasks_count}
          doneCount={event.done_tasks_count}
        />

        {/* Readiness bar */}
        {event.total_tasks_count > 0 && (
          <div className='flex items-center gap-3'>
            <div className='h-2 flex-1 rounded-full bg-muted-foreground/20'>
              <div
                className='h-full rounded-full bg-emerald-500 transition-all'
                style={{
                  width: `${(event.done_tasks_count / event.total_tasks_count) * 100}%`,
                }}
              />
            </div>
            <span className='text-xs text-muted-foreground shrink-0'>
              {event.done_tasks_count} of {event.total_tasks_count} ready
            </span>
          </div>
        )}

        {/* Carried tasks */}
        <CarriedTasks tasks={relevantCarried} />

        {/* AI Prep */}
        <AiPrepPanel
          event={event}
          tasks={event.tasks}
          carriedTasks={relevantCarried}
        />
      </div>
    </Card>
  );
}
