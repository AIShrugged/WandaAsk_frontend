'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ROUTES } from '@/shared/lib/routes';
import { Badge } from '@/shared/ui/badge';

import type { MeetingTask } from '../model/types';

const STATUS_VARIANT: Record<string, 'default' | 'primary' | 'destructive'> = {
  open: 'default',
  in_progress: 'primary',
  paused: 'default',
  review: 'primary',
  reopen: 'destructive',
  done: 'default',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  in_progress: 'In progress',
  paused: 'Paused',
  review: 'Review',
  reopen: 'Reopened',
  done: 'Done',
};

interface AgendaListProps {
  tasks: MeetingTask[];
  totalCount: number;
  doneCount: number;
  meetingState: string;
}

export function AgendaList({ tasks, totalCount, doneCount, meetingState }: AgendaListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const isReady = meetingState === 'ready';
  const label = isReady ? 'Action items from this meeting' : 'Tasks from last sync';
  const emptyText = isReady ? 'No tasks from this meeting' : 'No tasks from previous meeting';

  if (totalCount === 0) {
    return (
      <p className='text-xs text-muted-foreground italic'>
        {emptyText}
      </p>
    );
  }

  return (
    <div className='flex flex-col gap-1'>
      <div className='mb-2'>
        <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
          {label}
        </span>
      </div>

      {tasks.map((task, i) => {
        const isExpanded = expandedId === task.id;
        return (
          <button
            key={task.id}
            type='button'
            onClick={() => {
              return setExpandedId(isExpanded ? null : task.id);
            }}
            className='flex items-start gap-2 rounded-md px-2 py-2 text-left hover:bg-muted/50 transition-colors w-full'
          >
            <span className='text-xs text-muted-foreground mt-0.5 w-4 shrink-0'>
              {i + 1}.
            </span>
            <div className='min-w-0 flex-1'>
              <div className='flex items-start gap-2'>
                <span className='text-sm text-foreground flex-1'>
                  <Link
                    href={`${ROUTES.DASHBOARD.ISSUES}/${task.id}`}
                    onClick={(e) => {
                      return e.stopPropagation();
                    }}
                    className='hover:text-primary hover:underline transition-colors'
                  >
                    {task.name}
                  </Link>
                  {task.assignee_name && (
                    <span className='text-muted-foreground'>
                      {' '}
                      — {task.assignee_name}
                    </span>
                  )}
                </span>
                <Badge
                  variant={
                    task.is_overdue
                      ? 'destructive'
                      : (STATUS_VARIANT[task.status] ?? 'default')
                  }
                  className='shrink-0 text-[10px]'
                >
                  {task.is_overdue
                    ? 'Overdue'
                    : (STATUS_LABEL[task.status] ?? task.status)}
                </Badge>
              </div>
              {isExpanded && task.description && (
                <p className='mt-1.5 text-xs text-muted-foreground whitespace-pre-wrap'>
                  {task.description}
                </p>
              )}
            </div>
            {task.description && (
              <span className='mt-0.5 shrink-0 text-muted-foreground'>
                {isExpanded ? (
                  <ChevronDown className='h-3.5 w-3.5' />
                ) : (
                  <ChevronRight className='h-3.5 w-3.5' />
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
