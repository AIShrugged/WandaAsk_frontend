'use client';

import { BookOpen } from 'lucide-react';
import { useCallback } from 'react';

import { loadMethodologiesChunk } from '@/features/methodology/api/methodology';
import { useMethodologyStore } from '@/features/methodology/model/methodology-store';
import MethodologyItem from '@/features/methodology/ui/methodology-item';
import { useCachedInfiniteScroll } from '@/shared/hooks/use-cached-infinite-scroll';
import { EmptyState } from '@/shared/ui/feedback/empty-state';
import { InfiniteScrollStatus } from '@/shared/ui/layout/infinite-scroll-status';
import SpinLoader from '@/shared/ui/layout/spin-loader';

import type { MethodologyProps } from '@/features/methodology/model/types';

type Props = {
  initialMethodologies: MethodologyProps[];
  totalCount: number;
  organizationId: string;
};

/**
 * MethodologyList component.
 * @param root0
 * @param root0.initialMethodologies
 * @param root0.totalCount
 * @param root0.organizationId
 * @returns JSX element.
 */
export default function MethodologyList({
  initialMethodologies,
  totalCount,
  organizationId,
}: Props) {
  const fetchChunkAction = useCallback(
    async (offset: number, limit: number) => {
      const { data, hasMore } = await loadMethodologiesChunk(
        organizationId,
        offset,
        limit,
      );

      return { data, hasMore };
    },
    [organizationId],
  );
  const { items, isLoading, hasMore, sentinelRef } =
    useCachedInfiniteScroll<MethodologyProps>({
      store: useMethodologyStore,
      fetchChunkAction,
      cacheKey: organizationId,
      initialItems: initialMethodologies,
      totalCount,
    });

  if (!items) return null;

  if (items.length === 0 && !isLoading) {
    return (
      <EmptyState
        icon={BookOpen}
        title='No methodologies yet'
        description='Add a methodology to define your process'
      />
    );
  }

  return (
    <div className='flex flex-col h-full'>
      {items.map((methodology) => {
        return (
          <MethodologyItem key={methodology.id} methodology={methodology} />
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
