'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ROUTES } from '@/shared/lib/routes';

import type { StaleTask } from '../model/types';

interface StaleItemsProps {
  tasks: StaleTask[];
}

export function StaleItems({ tasks }: StaleItemsProps) {
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
        <span>Stale — no progress across meetings</span>
        {isExpanded ? (
          <ChevronUp className='h-3 w-3' />
        ) : (
          <ChevronDown className='h-3 w-3' />
        )}
      </button>

      {isExpanded && (
        <div className='flex flex-col gap-2'>
          {tasks.slice(0, 5).map((task) => {
            return (
              <div
                key={task.id}
                className='flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3'
              >
                <div className='h-2 w-2 shrink-0 rounded-full bg-orange-500' />
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-medium text-foreground truncate'>
                    <Link
                      href={`${ROUTES.DASHBOARD.ISSUES}/${task.id}`}
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
                  </p>
                  {task.description && (
                    <p className='text-xs text-muted-foreground line-clamp-2'>
                      {task.description}
                    </p>
                  )}
                </div>
                <span className='shrink-0 rounded-md bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-500'>
                  {task.syncs_since_created} meetings
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
