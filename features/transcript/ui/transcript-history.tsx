'use client';

import { useCallback } from 'react';

import { loadTranscriptChunk } from '@/app/actions/transcript';
import { filters } from '@/features/transcript/lib/options';
import TranscriptList from '@/features/transcript/ui/transcript-list';
import { useInfiniteScroll } from '@/shared/hooks/use-infinite-scroll';
import { InfiniteScrollStatus } from '@/shared/ui/layout/infinite-scroll-status';
import SpinLoader from '@/shared/ui/layout/spin-loader';

import type {
  TranscriptsProps,
  TranscriptProps,
} from '@/features/transcript/model/types';

type Props = {
  eventId: string;
  initialData: TranscriptsProps;
  initialTotal: number;
};

export default function TranscriptHistory({
  eventId,
  initialData,
  initialTotal,
}: Props) {
  const fetchMore = useCallback(
    async (offset: number) => {
      const { data, hasMore } = await loadTranscriptChunk(
        eventId,
        offset,
        filters.limit,
      );
      return { items: data.data as TranscriptProps[], hasMore };
    },
    [eventId],
  );

  const { items, isLoading, hasMore, sentinelRef } =
    useInfiniteScroll<TranscriptProps>({
      fetchMore,
      initialItems: initialData.data,
      initialHasMore: initialData.data.length < initialTotal,
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
