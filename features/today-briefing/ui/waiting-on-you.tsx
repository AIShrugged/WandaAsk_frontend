'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ROUTES } from '@/shared/lib/routes';

import { CollapsibleSection } from './collapsible-section';

import type { WaitingTask } from '../model/types';

interface WaitingOnYouProps {
  tasks: WaitingTask[];
}

const INITIAL_LIMIT = 3;

export function WaitingOnYou({ tasks }: WaitingOnYouProps) {
  const [showAll, setShowAll] = useState(false);

  if (tasks.length === 0) return null;

  const visible = showAll ? tasks : tasks.slice(0, INITIAL_LIMIT);
  const hasMore = tasks.length > INITIAL_LIMIT;

  return (
    <CollapsibleSection label='Waiting on you'>
      <div className='flex flex-col gap-2'>
        {visible.map((task) => {
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
                  className='block truncate text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline'
                >
                  {task.name}
                </Link>
                {(task.source_meeting_title || task.description) && (
                  <p className='line-clamp-2 text-xs text-muted-foreground'>
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
        {hasMore && (
          <button
            onClick={() => {
              return setShowAll((v) => {
                return !v;
              });
            }}
            className='flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground'
          >
            {showAll ? (
              <>
                <ChevronUp className='h-3.5 w-3.5' />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className='h-3.5 w-3.5' />
                Show all ({tasks.length})
              </>
            )}
          </button>
        )}
      </div>
    </CollapsibleSection>
  );
}
