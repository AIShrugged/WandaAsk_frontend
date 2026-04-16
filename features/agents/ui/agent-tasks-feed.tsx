'use client';

import { ListTodo } from 'lucide-react';
import Link from 'next/link';
import { useCallback } from 'react';

import { getAgentTasks } from '@/features/agents/api/agents';
import { formatDateTime } from '@/features/agents/lib/format';
import { AgentRunStatusBadge } from '@/features/agents/ui/agent-run-status-badge';
import { useInfiniteScroll } from '@/shared/hooks/use-infinite-scroll';
import { ROUTES } from '@/shared/lib/routes';
import { EmptyState } from '@/shared/ui/feedback/empty-state';
import { InfiniteScrollStatus } from '@/shared/ui/layout/infinite-scroll-status';
import SpinLoader from '@/shared/ui/layout/spin-loader';

import type { AgentTask } from '@/features/agents/model/types';

const PAGE_SIZE = 20;

type Props = {
  initialItems: AgentTask[];
  totalCount: number;
};

/**
 * @param root0
 * @param root0.initialItems
 * @param root0.totalCount
 */
export function AgentTasksFeed({ initialItems, totalCount }: Props) {
  const fetchMore = useCallback(async (offset: number) => {
    const { data, hasMore } = await getAgentTasks(offset, PAGE_SIZE);
    return { items: data, hasMore };
  }, []);

  const { items, isLoading, hasMore, sentinelRef } = useInfiniteScroll({
    fetchMore,
    initialItems,
    initialHasMore: initialItems.length < totalCount,
  });

  if (items.length === 0 && !isLoading) {
    return (
      <EmptyState
        icon={ListTodo}
        title='No agent tasks yet'
        description='Scheduled agent tasks will appear here.'
      />
    );
  }

  return (
    <div className='flex flex-col gap-4'>
      {items.map((item) => {
        return (
          <Link
            key={item.id}
            href={`${ROUTES.DASHBOARD.AGENT_TASKS}/${item.id}`}
            className='block'
          >
            <article className='relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-card p-4 transition-colors hover:border-border/60 hover:bg-card/80'>
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    {item.latest_run_status ? (
                      <AgentRunStatusBadge status={item.latest_run_status} />
                    ) : (
                      <span className='text-xs text-muted-foreground'>
                        No runs
                      </span>
                    )}
                    <span className='text-xs uppercase tracking-wide text-muted-foreground'>
                      {item.schedule_type ?? 'Manual'}
                    </span>
                  </div>
                  <p className='mt-3 text-sm font-medium leading-6 text-foreground'>
                    {item.name}
                  </p>
                  {item.prompt !== null && (
                    <p className='mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground'>
                      {item.prompt}
                    </p>
                  )}
                  <div className='mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                    <span>Created: {formatDateTime(item.created_at)}</span>
                    {item.next_run_at !== null && (
                      <span>Next run: {formatDateTime(item.next_run_at)}</span>
                    )}
                    {item.agent_profile !== null &&
                      item.agent_profile !== undefined && (
                        <span>Profile: {item.agent_profile.name}</span>
                      )}
                  </div>
                </div>
              </div>
            </article>
          </Link>
        );
      })}

      {!hasMore && items.length > 0 ? (
        <div className='py-4'>
          <InfiniteScrollStatus itemCount={items.length} />
        </div>
      ) : (
        <div ref={sentinelRef} className='h-10' />
      )}

      {isLoading && (
        <div className='flex justify-center py-4'>
          <SpinLoader />
        </div>
      )}
    </div>
  );
}
