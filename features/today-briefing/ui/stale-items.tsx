'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ROUTES } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/button';
import { CollapsibleSection } from '@/shared/ui/layout/collapsible-section';

import type { StaleTask } from '../model/types';

const INITIAL_LIMIT = 3;

export function StaleItems({ tasks }: { tasks: StaleTask[] }) {
  const [showAll, setShowAll] = useState(false);

  if (tasks.length === 0) return null;

  const visible = showAll ? tasks : tasks.slice(0, INITIAL_LIMIT);
  const hasMore = tasks.length > INITIAL_LIMIT;

  return (
    <CollapsibleSection
      label='Stale — no progress across meetings'
      extraContent={null}
    >
      <div className='flex flex-col gap-2'>
        {visible.map((task) => {
          return (
            <div
              key={task.id}
              className='flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3'
            >
              <div className='h-2 w-2 shrink-0 rounded-full bg-orange-500' />
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium text-foreground'>
                  <Link
                    href={`${ROUTES.DASHBOARD.ISSUES}/${task.id}`}
                    className='transition-colors hover:text-primary hover:underline'
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
                  <p className='line-clamp-2 text-xs text-muted-foreground'>
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
        {hasMore && (
          <Button
            variant='ghost'
            size='xs'
            fullWidth={false}
            justify='end'
            className='self-end'
            onClick={() => {
              setShowAll((v) => {
                return !v;
              });
            }}
            rightIcon={
              showAll ? (
                <ChevronUp className='h-3.5 w-3.5' />
              ) : (
                <ChevronDown className='h-3.5 w-3.5' />
              )
            }
          >
            {showAll ? 'Show less' : `Show all (${tasks.length})`}
          </Button>
        )}
      </div>
    </CollapsibleSection>
  );
}
