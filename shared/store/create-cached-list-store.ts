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

  return create<CachedListStore<T>>()((set, get) => ({
    ...initialState,

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

    appendChunk: (newItems, hasMore) => {
      set(state => ({
        items: [...state.items, ...newItems],
        offset: state.offset + newItems.length,
        hasMore,
      }));
    },

    setLoading: (loading) => {
      set({ isLoading: loading });
    },

    invalidate: () => {
      set({ ...initialState });
    },

    removeItem: (id: number) => {
      set(state => ({
        items: state.items.filter((item: any) => item.id !== id),
        totalCount: state.totalCount - 1,
      }));
    },
  }));
}
