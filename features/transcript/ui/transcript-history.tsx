'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

import { loadTranscriptChunk } from '@/app/actions/transcript';
import { filters } from '@/features/transcript/lib/options';
import TranscriptList from '@/features/transcript/ui/transcript-list';
import SpinLoader from '@/shared/ui/layout/spin-loader';

import type {
  TranscriptsProps,
  TranscriptProps,
} from '@/features/transcript/model/types';

const MAX_ITEMS_IN_MEMORY = 500;

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
  const [items, setItems] = useState<TranscriptProps[]>(initialData.data);
  const [offset, setOffset] = useState(initialData.data.length);
  const [hasMore, setHasMore] = useState(
    initialData.data.length < initialTotal,
  );
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    try {
      const { data, hasMore: more } = await loadTranscriptChunk(
        eventId,
        offset,
        filters.limit,
      );

      setItems(prev => {
        const newItems = [...prev, ...data.data];
        // Limit items in memory to prevent memory issues
        if (newItems.length > MAX_ITEMS_IN_MEMORY) {
          return newItems.slice(-MAX_ITEMS_IN_MEMORY);
        }
        return newItems;
      });
      setOffset(prev => prev + data.data.length);
      setHasMore(more);
    } catch {
      // Error loading transcript chunk - silently fail
    } finally {
      setIsLoading(false);
    }
  }, [eventId, offset, isLoading, hasMore]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) {
          void loadMore();
        }
      },
      { rootMargin: '20px' },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  return (
    <div className='space-y-4'>
      <TranscriptList data={items} />

      {!hasMore && items.length > 0 ? (
        <div className='text-center text-gray-500'>
          Loaded: {items.length} (all) items
        </div>
      ) : (
        <div ref={sentinelRef} className='h-10' />
      )}

      {isLoading && <SpinLoader />}
    </div>
  );
}
