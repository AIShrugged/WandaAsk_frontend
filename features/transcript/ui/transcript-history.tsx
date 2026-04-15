'use client';

import { useCallback } from 'react';

import { loadTranscriptChunk } from '@/features/transcript/api/transcript';
import { filters } from '@/features/transcript/lib/options';
import TranscriptList from '@/features/transcript/ui/transcript-list';
import { useInfiniteScroll } from '@/shared/hooks/use-infinite-scroll';
import { InfiniteScrollStatus } from '@/shared/ui/layout/infinite-scroll-status';
import SpinLoader from '@/shared/ui/layout/spin-loader';

import type { TranscriptProps } from '@/features/transcript/model/types';

type Props = {
  eventId: string;
  initialItems: TranscriptProps[];
  initialTotal: number;
};

/**
 * TranscriptHistory component — client wrapper with infinite scroll.
 * @param root0
 * @param root0.eventId
 * @param root0.initialItems
 * @param root0.initialTotal
 */
export default function TranscriptHistory({
  eventId,
  initialItems,
  initialTotal,
}: Props) {
  const fetchMore = useCallback(
    async (offset: number) => {
      const { items, hasMore } = await loadTranscriptChunk(
        eventId,
        offset,
        filters.limit,
      );

      return { items, hasMore };
    },
    [eventId],
  );

  const { items, isLoading, hasMore, sentinelRef } =
    useInfiniteScroll<TranscriptProps>({
      fetchMore,
      initialItems,
      initialHasMore: initialItems.length < initialTotal,
      maxItems: 500,
    });

  return (
    <div className='space-y-4'>
      <TranscriptList data={items} />

      {!hasMore && items.length > 0 ? (
        <InfiniteScrollStatus itemCount={items.length} />
      ) : (
        <div ref={sentinelRef} className='h-10' />
      )}

      {isLoading && <SpinLoader />}
    </div>
  );
}
