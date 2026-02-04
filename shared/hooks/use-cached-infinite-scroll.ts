'use client';

import { useEffect, useRef, useCallback } from 'react';

import type { CachedListStore } from '@/shared/store/create-cached-list-store';

const DEFAULT_LIMIT = 10;

type StoreHook<T> = {
  <U>(selector: (state: CachedListStore<T>) => U): U;
  getState: () => CachedListStore<T>;
};

type UseCachedInfiniteScrollOptions<T> = {
  store: StoreHook<T>;
  fetchChunk: (
    offset: number,
    limit: number,
  ) => Promise<{ data: T[]; hasMore: boolean }>;
  cacheKey: string | number;
  initialItems: T[];
  totalCount: number;
  limit?: number;
};

export function useCachedInfiniteScroll<T>({
  store,
  fetchChunk,
  cacheKey,
  initialItems,
  totalCount,
  limit = DEFAULT_LIMIT,
}: UseCachedInfiniteScrollOptions<T>) {
  const items = store(s => s.items);
  const isLoading = store(s => s.isLoading);
  const hasMore = store(s => s.hasMore);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    store.getState().hydrate(initialItems, totalCount, cacheKey);
  }, [store, initialItems, totalCount, cacheKey]);

  const loadMore = useCallback(async () => {
    const state = store.getState();
    if (state.isLoading || !state.hasMore) return;

    state.setLoading(true);
    try {
      const { data, hasMore: more } = await fetchChunk(state.offset, limit);
      store.getState().appendChunk(data, more);
    } catch {
      // silently fail
    } finally {
      store.getState().setLoading(false);
    }
  }, [store, fetchChunk, limit]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
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
