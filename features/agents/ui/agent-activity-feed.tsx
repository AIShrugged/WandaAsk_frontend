'use client';

import { Activity } from 'lucide-react';
import { useCallback } from 'react';

import { getAgentActivity } from '@/features/agents/api/activity';
import { formatDateTime } from '@/features/agents/lib/format';
import { useInfiniteScroll } from '@/shared/hooks/use-infinite-scroll';
import { Badge } from '@/shared/ui/badge';
import { EmptyState } from '@/shared/ui/feedback/empty-state';
import { InfiniteScrollStatus } from '@/shared/ui/layout/infinite-scroll-status';
import SpinLoader from '@/shared/ui/layout/spin-loader';

import type { AgentActivityItem } from '@/features/agents/model/types';

const PAGE_SIZE = 50;

/**
 *
 * @param success
 */
function getStatusVariant(success: boolean) {
  return success ? 'success' : 'destructive';
}

/**
 *
 * @param value
 */
function formatRunUuid(value: string | null) {
  if (!value) return '—';

  if (value.length <= 12) return value;

  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

type Props = {
  initialItems: AgentActivityItem[];
  totalCount: number;
  agentRunUuid?: string;
};

/**
 *
 * @param root0
 * @param root0.initialItems
 * @param root0.totalCount
 * @param root0.agentRunUuid
 */
export function AgentActivityFeed({
  initialItems,
  totalCount,
  agentRunUuid,
}: Props) {
  const fetchMore = useCallback(
    async (offset: number) => {
      const { items, hasMore } = await getAgentActivity(
        offset,
        PAGE_SIZE,
        agentRunUuid,
      );

      return { items, hasMore };
    },
    [agentRunUuid],
  );

  const { items, isLoading, hasMore, sentinelRef } = useInfiniteScroll({
    fetchMore,
    initialItems,
    initialHasMore: initialItems.length < totalCount,
  });

  if (items.length === 0 && !isLoading) {
    return (
      <EmptyState
        icon={Activity}
        title='No agent activity yet'
        description='Activity entries will appear here when agents run tools or complete actions.'
      />
    );
  }

  return (
    <div className='flex flex-col gap-4'>
      {items.map((item) => {
        return (
          <article
            key={item.id}
            className='relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-card p-4'
          >
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div className='min-w-0 flex-1'>
                <div className='flex flex-wrap items-center gap-2'>
                  <Badge variant={getStatusVariant(item.success)}>
                    {item.success ? 'Success' : 'Failed'}
                  </Badge>
                  <span className='text-xs uppercase tracking-wide text-muted-foreground'>
                    {item.tool_name}
                  </span>
                </div>
                <p className='mt-3 text-sm leading-6 text-foreground'>
                  {item.description}
                </p>
                <div className='mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                  <span>Created: {formatDateTime(item.created_at)}</span>
                  <span>Run: {formatRunUuid(item.agent_run_uuid)}</span>
                </div>
              </div>
            </div>
          </article>
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
