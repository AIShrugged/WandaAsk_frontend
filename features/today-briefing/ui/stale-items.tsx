'use client';

import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';

import { CollapsibleSection } from './collapsible-section';

import type { StaleTask } from '../model/types';

interface StaleItemsProps {
  tasks: StaleTask[];
}

export function StaleItems({ tasks }: StaleItemsProps) {
  if (tasks.length === 0) return null;

  return (
    <CollapsibleSection label='Stale — no progress across meetings'>
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
    </CollapsibleSection>
  );
}
