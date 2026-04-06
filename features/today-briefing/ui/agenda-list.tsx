'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

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
}

export function AgendaList({ tasks }: AgendaListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (tasks.length === 0) {
    return (
      <p className='text-xs text-muted-foreground italic'>
        No tasks extracted from this meeting
      </p>
    );
  }

  const doneCount = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className='flex flex-col gap-1'>
      <div className='flex items-center justify-between mb-2'>
        <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
          Agenda
        </span>
        <span className='text-xs text-muted-foreground'>
          {doneCount} of {tasks.length} done
        </span>
      </div>

      {/* Readiness bar */}
      <div className='h-1.5 w-full rounded-full bg-muted mb-3'>
        <div
          className='h-full rounded-full bg-emerald-500 transition-all'
          style={{
            width: `${tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0}%`,
          }}
        />
      </div>

      {tasks.map((task, i) => {
        const isExpanded = expandedId === task.id;
        return (
          <button
            key={task.id}
            type='button'
            onClick={() =>
              setExpandedId(isExpanded ? null : task.id)
            }
            className='flex items-start gap-2 rounded-md px-2 py-2 text-left hover:bg-muted/50 transition-colors w-full'
          >
            <span className='text-xs text-muted-foreground mt-0.5 w-4 shrink-0'>
              {i + 1}.
            </span>
            <div className='min-w-0 flex-1'>
              <div className='flex items-start gap-2'>
                <span className='text-sm text-foreground flex-1'>
                  {task.name}
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
                  {task.is_overdue ? 'Overdue' : (STATUS_LABEL[task.status] ?? task.status)}
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
