'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ROUTES } from '@/shared/lib/routes';

import type { WaitingTask } from '../model/types';

interface WaitingOnYouProps {
  tasks: WaitingTask[];
}

export function WaitingOnYou({ tasks }: WaitingOnYouProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (tasks.length === 0) return null;

  return (
    <div className='flex flex-col gap-2'>
      <button
        onClick={() => {
          return setIsExpanded((v) => {
            return !v;
          });
        }}
        className='flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors'
      >
        <span>Waiting on you</span>
        {isExpanded ? (
          <ChevronUp className='h-3 w-3' />
        ) : (
          <ChevronDown className='h-3 w-3' />
        )}
      </button>

      {isExpanded && (
        <div className='flex flex-col gap-2'>
          {tasks.slice(0, 5).map((task) => {
            const isUrgent = task.age_days > 7;
            return (
              <div
                key={task.id}
                className='flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3'
              >
                <div
                  className={`h-2 w-2 shrink-0 rounded-full ${isUrgent ? 'bg-red-500' : 'bg-blue-500'}`}
                />
                <div className='min-w-0 flex-1'>
                  <Link
                    href={`${ROUTES.DASHBOARD.ISSUES}/${task.id}`}
                    className='text-sm font-medium text-foreground truncate hover:text-primary hover:underline transition-colors block'
                  >
                    {task.name}
                  </Link>
                  {(task.source_meeting_title || task.description) && (
                    <p className='text-xs text-muted-foreground line-clamp-2'>
                      {task.source_meeting_title &&
                        `From ${task.source_meeting_title}`}
                      {task.source_meeting_title && task.description && ' · '}
                      {task.description}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${isUrgent ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}
                >
                  {task.age_days}d
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
