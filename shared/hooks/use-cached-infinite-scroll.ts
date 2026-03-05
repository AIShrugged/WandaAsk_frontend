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
  fetchChunkAction: (
    offset: number,
    limit: number,
  ) => Promise<{ data: T[]; hasMore: boolean }>;
  cacheKey: string | number;
  initialItems: T[];
  totalCount: number;
  limit?: number;
};

/**
 * useCachedInfiniteScroll hook.
 * @param root0
 * @param root0.store
 * @param root0.fetchChunkAction
 * @param root0.cacheKey
 * @param root0.initialItems
 * @param root0.totalCount
 * @param root0.limit
 */
export function useCachedInfiniteScroll<T>({
  store,
  fetchChunkAction,
  cacheKey,
  initialItems,
  totalCount,
  limit = DEFAULT_LIMIT,
}: UseCachedInfiniteScrollOptions<T>) {
  const items = store((s) => {
    return s.items;
  });

  const isLoading = store((s) => {
    return s.isLoading;
  });

  const hasMore = store((s) => {
    return s.hasMore;
  });

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    store.getState().hydrate(initialItems, totalCount, cacheKey);
  }, [store, initialItems, totalCount, cacheKey]);

  const loadMore = useCallback(async () => {
    const state = store.getState();

    if (state.isLoading || !state.hasMore) return;

    state.setLoading(true);
    try {
      const { data, hasMore: more } = await fetchChunkAction(
        state.offset,
        limit,
      );

      store.getState().appendChunk(data, more);
    } catch {
      // silently fail
    } finally {
      store.getState().setLoading(false);
    }
  }, [store, fetchChunkAction, limit]);

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

    return () => {
      return observer.disconnect();
    };
  }, [hasMore, isLoading, loadMore]);

  return { items, isLoading, hasMore, sentinelRef };
}
