'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type UseInfiniteScrollOptions<T> = {
  fetchMore: (offset: number) => Promise<{ items: T[]; hasMore: boolean }>;
  initialItems: T[];
  initialHasMore: boolean;
  maxItems?: number;
};

export function useInfiniteScroll<T>({
  fetchMore,
  initialItems,
  initialHasMore,
  maxItems,
}: UseInfiniteScrollOptions<T>) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [offset, setOffset] = useState(initialItems.length);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    try {
      const { items: newItems, hasMore: more } = await fetchMore(offset);

      setItems(prev => {
        const combined = [...prev, ...newItems];
        if (maxItems && combined.length > maxItems) {
          return combined.slice(-maxItems);
        }
        return combined;
      });
      setOffset(prev => prev + newItems.length);
      setHasMore(more);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [fetchMore, offset, isLoading, hasMore, maxItems]);

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

  return { items, isLoading, hasMore, sentinelRef };
}
