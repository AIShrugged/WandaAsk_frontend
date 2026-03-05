import { create } from 'zustand';

export type CachedListStore<T> = {
  items: T[];
  totalCount: number;
  offset: number;
  hasMore: boolean;
  isLoading: boolean;
  cacheKey: string | number | null;
  lastHydratedAt: number;
  hydrate: (items: T[], totalCount: number, cacheKey: string | number) => void;
  appendChunk: (newItems: T[], hasMore: boolean) => void;
  setLoading: (loading: boolean) => void;
  invalidate: () => void;
  removeItem: (id: number) => void;
};

/**
 * createCachedListStore.
 */
export function createCachedListStore<T>() {
  const initialState = {
    items: [] as T[],
    totalCount: 0,
    offset: 0,
    hasMore: false,
    isLoading: false,
    cacheKey: null as string | number | null,
    lastHydratedAt: 0,
  };

  return create<CachedListStore<T>>()((set, get) => {
    return {
      ...initialState,

      /**
       * hydrate.
       * @param items - items.
       * @param totalCount - totalCount.
       * @param cacheKey - cacheKey.
       * @returns Result.
       */
      hydrate: (items, totalCount, cacheKey) => {
        const state = get();

        if (
          state.cacheKey === cacheKey &&
          state.items.length > 0 &&
          state.lastHydratedAt > 0
        ) {
          return;
        }

        set({
          items,
          totalCount,
          offset: items.length,
          hasMore: items.length < totalCount,
          cacheKey,
          lastHydratedAt: Date.now(),
        });
      },

      /**
       * appendChunk.
       * @param newItems - newItems.
       * @param hasMore - hasMore.
       * @returns Result.
       */
      appendChunk: (newItems, hasMore) => {
        set((state) => {
          return {
            items: [...state.items, ...newItems],
            offset: state.offset + newItems.length,
            hasMore,
          };
        });
      },

      /**
       * setLoading.
       * @param loading - loading.
       * @returns Result.
       */
      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      /**
       * invalidate.
       */
      invalidate: () => {
        set({ ...initialState });
      },

      /**
       * removeItem.
       * @param id - id.
       * @returns Result.
       */
      /* eslint-disable sonarjs/no-nested-functions */
      /**
       *
       * @param id
       */
      removeItem: (id: number) => {
        set((state) => {
          return {
            items: state.items.filter((item) => {
              return (item as { id: number }).id !== id;
            }),
            totalCount: state.totalCount - 1,
          };
        });
      },
      /* eslint-enable sonarjs/no-nested-functions */
    };
  });
}
