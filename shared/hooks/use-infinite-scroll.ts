'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { CachedListStore } from '@/shared/store/create-cached-list-store';

type FetchResult<T> = { data: T[]; hasMore: boolean };

type CachedStoreHook<T extends { id: number }> = {
  <U>(selector: (state: CachedListStore<T>) => U): U;
  getState: () => CachedListStore<T>;
};

type UseInfiniteScrollOptions<T> = {
  fetchMore: (offset: number, limit?: number) => Promise<FetchResult<T>>;
  initialItems: T[];
  initialHasMore: boolean;
  maxItems?: number;
  store?: T extends { id: number }
    ? CachedStoreHook<T & { id: number }>
    : never;
  cacheKey?: string | number;
  totalCount?: number;
  limit?: number;
};

export function useInfiniteScroll<T>({
  fetchMore,
  initialItems,
  initialHasMore,
  maxItems,
  store,
  cacheKey,
  totalCount,
  limit,
}: UseInfiniteScrollOptions<T>) {
  const hasStore = store !== undefined;

  // Store mode — Zustand selectors (only active when store is provided)
  const storeItems =
    store?.((s) => {
      return s.items as T[];
    }) ?? ([] as T[]);
  const storeLoading =
    store?.((s) => {
      return s.isLoading;
    }) ?? false;
  const storeHasMore =
    store?.((s) => {
      return s.hasMore;
    }) ?? false;

  // Local mode — plain useState
  const [localItems, setLocalItems] = useState<T[]>(initialItems);
  const [localOffset, setLocalOffset] = useState(initialItems.length);
  const [localHasMore, setLocalHasMore] = useState(initialHasMore);
  const [localLoading, setLocalLoading] = useState(false);
  const generationRef = useRef(0);

  const items = hasStore ? storeItems : localItems;
  const isLoading = hasStore ? storeLoading : localLoading;
  const hasMore = hasStore ? storeHasMore : localHasMore;

  // Store mode: hydrate on mount / when SSR props change
  useEffect(() => {
    if (!store || cacheKey === undefined || totalCount === undefined) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (store.getState() as any).hydrate(initialItems, totalCount, cacheKey);
  }, [store, initialItems, totalCount, cacheKey]);

  // Local mode: reset when SSR props change (e.g. filter change)
  useEffect(() => {
    if (hasStore) return;
    generationRef.current += 1;
    setLocalItems(initialItems);
    setLocalOffset(initialItems.length);
    setLocalHasMore(initialHasMore);
    setLocalLoading(false);
  }, [initialItems]);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (hasStore && store) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state = store.getState() as any;
      if (state.isLoading || !state.hasMore) return;
      state.setLoading(true);
      try {
        const { data, hasMore: more } = await fetchMore(state.offset, limit);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (store.getState() as any).appendChunk(data, more);
      } catch {
        // silently fail
      } finally {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (store.getState() as any).setLoading(false);
      }
    } else {
      if (localLoading || !localHasMore) return;
      setLocalLoading(true);
      const generation = generationRef.current;
      try {
        const { data: newItems, hasMore: more } = await fetchMore(localOffset);
        if (generationRef.current !== generation) return;
        setLocalItems((prev) => {
          const combined = [...prev, ...newItems];
          if (maxItems && combined.length > maxItems) {
            return combined.slice(-maxItems);
          }
          return combined;
        });
        setLocalOffset((prev) => {
          return prev + newItems.length;
        });
        setLocalHasMore(more);
      } catch {
        setLocalLoading(false);
      }
    }
  }, [
    hasStore,
    store,
    fetchMore,
    limit,
    localLoading,
    localHasMore,
    localOffset,
    maxItems,
  ]);

  // Keep a stable ref to loadMore so the observer never needs to be recreated.
  // This prevents the double-page-load bug in React 19 concurrent mode where
  // IntersectionObserver fires an initial entry on every re-observe() call.
  const loadMoreRef = useRef(loadMore);
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMoreRef.current().catch(() => {});
        }
      },
      { rootMargin: '20px' },
    );

    observer.observe(sentinelRef.current);

    return () => {
      return observer.disconnect();
    };
  }, []);

  return { items, isLoading, hasMore, sentinelRef };
}
