import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

import { useInfiniteScroll } from '@/shared/hooks/use-infinite-scroll';
import { createCachedListStore } from '@/shared/store/create-cached-list-store';

// ─── IntersectionObserver mock ────────────────────────────────────────────────

type IOCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let ioCallback: IOCallback | null = null;
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();

const sentinelDiv = document.createElement('div');

Object.defineProperty(globalThis, 'IntersectionObserver', {
  value: jest.fn().mockImplementation((cb: IOCallback) => {
    ioCallback = cb;
    return { observe: mockObserve, disconnect: mockDisconnect };
  }),
  writable: true,
});

// Force sentinelRef.current to always point to a real element
// by intercepting useRef at the React level.
const originalUseRef = React.useRef;
jest.spyOn(React, 'useRef').mockImplementation(<T>(init: T) => {
  // Only intercept null refs that are likely sentinel divs
  if (init === null) {
    const ref = originalUseRef<HTMLDivElement>(sentinelDiv as HTMLDivElement);
    return ref as React.MutableRefObject<T>;
  }
  return originalUseRef(init) as React.MutableRefObject<T>;
});

function triggerIntersection(isIntersecting: boolean) {
  ioCallback?.([{ isIntersecting } as IntersectionObserverEntry]);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Item = { id: number; name: string };

function makeItem(id: number): Item {
  return { id, name: `item-${id}` };
}

function makeFetchMore(pages: Item[][], delay = 0) {
  let call = 0;
  return jest.fn(async () => {
    const page = pages[call++] ?? [];
    if (delay)
      await new Promise((r) => {
        return setTimeout(r, delay);
      });
    return { data: page, hasMore: call < pages.length };
  });
}

// ─── Local mode ───────────────────────────────────────────────────────────────

describe('useInfiniteScroll — local mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ioCallback = null;
  });

  it('returns initial items and hasMore', () => {
    const initial = [makeItem(1), makeItem(2)];
    const fetchMore = makeFetchMore([]);

    const { result } = renderHook(() => {
      return useInfiniteScroll<Item>({
        fetchMore,
        initialItems: initial,
        initialHasMore: true,
      });
    });

    expect(result.current.items).toEqual(initial);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.sentinelRef).toBeDefined();
  });

  it('calls fetchMore and appends items when sentinel intersects', async () => {
    const page2 = [makeItem(3), makeItem(4)];
    const fetchMore = makeFetchMore([page2]);
    const initial = [makeItem(1), makeItem(2)];

    const { result } = renderHook(() => {
      return useInfiniteScroll<Item>({
        fetchMore,
        initialItems: initial,
        initialHasMore: true,
      });
    });

    act(() => {
      triggerIntersection(true);
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(4);
    });

    expect(result.current.items[2]).toEqual(makeItem(3));
    expect(result.current.hasMore).toBe(false);
    expect(fetchMore).toHaveBeenCalledTimes(1);
    expect(fetchMore).toHaveBeenCalledWith(2);
  });

  it('does NOT call fetchMore when hasMore is false', async () => {
    const fetchMore = makeFetchMore([]);

    renderHook(() => {
      return useInfiniteScroll<Item>({
        fetchMore,
        initialItems: [makeItem(1)],
        initialHasMore: false,
      });
    });

    act(() => {
      triggerIntersection(true);
    });

    await waitFor(() => {});
    expect(fetchMore).not.toHaveBeenCalled();
  });

  it('does NOT call fetchMore when not intersecting', async () => {
    const fetchMore = makeFetchMore([[makeItem(2)]]);

    renderHook(() => {
      return useInfiniteScroll<Item>({
        fetchMore,
        initialItems: [makeItem(1)],
        initialHasMore: true,
      });
    });

    act(() => {
      triggerIntersection(false);
    });

    await waitFor(() => {});
    expect(fetchMore).not.toHaveBeenCalled();
  });

  it('resets state when initialItems reference changes', async () => {
    const initial1 = [makeItem(1)];
    const initial2 = [makeItem(10), makeItem(11)];
    const fetchMore = makeFetchMore([]);

    const { result, rerender } = renderHook(
      ({ items }: { items: Item[] }) => {
        return useInfiniteScroll<Item>({
          fetchMore,
          initialItems: items,
          initialHasMore: false,
        });
      },
      { initialProps: { items: initial1 } },
    );

    expect(result.current.items).toEqual(initial1);

    rerender({ items: initial2 });

    await waitFor(() => {
      expect(result.current.items).toEqual(initial2);
    });
    expect(result.current.items).toHaveLength(2);
  });

  it('generation guard discards stale fetchMore results', async () => {
    let resolvePage1: (v: void) => void;
    const page1Promise = new Promise<void>((r) => {
      resolvePage1 = r;
    });

    const staleFetchMore = jest.fn(async () => {
      await page1Promise;
      return { data: [makeItem(99)], hasMore: false };
    });

    const initial1 = [makeItem(1)];
    const initial2 = [makeItem(2)];

    const { result, rerender } = renderHook(
      ({ items }: { items: Item[] }) => {
        return useInfiniteScroll<Item>({
          fetchMore: staleFetchMore,
          initialItems: items,
          initialHasMore: true,
        });
      },
      { initialProps: { items: initial1 } },
    );

    act(() => {
      triggerIntersection(true);
    });

    rerender({ items: initial2 });

    act(() => {
      resolvePage1!();
    });

    await waitFor(() => {});

    expect(result.current.items).toEqual(initial2);
    expect(result.current.items).not.toContainEqual(makeItem(99));
  });

  it('evicts oldest items when maxItems is exceeded', async () => {
    const page2 = [makeItem(3), makeItem(4)];
    const fetchMore = makeFetchMore([page2]);
    const initial = [makeItem(1), makeItem(2)];

    const { result } = renderHook(() => {
      return useInfiniteScroll<Item>({
        fetchMore,
        initialItems: initial,
        initialHasMore: true,
        maxItems: 3,
      });
    });

    act(() => {
      triggerIntersection(true);
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(3);
    });

    expect(result.current.items).toEqual([
      makeItem(2),
      makeItem(3),
      makeItem(4),
    ]);
  });
});

// ─── Store mode ───────────────────────────────────────────────────────────────

describe('useInfiniteScroll — store mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ioCallback = null;
  });

  function makeStore() {
    return createCachedListStore<Item>();
  }

  it('hydrates store from initialItems on mount', async () => {
    const store = makeStore();
    const initial = [makeItem(1), makeItem(2)];
    const fetchMore = makeFetchMore([]);

    renderHook(() => {
      return useInfiniteScroll<Item>({
        fetchMore,
        initialItems: initial,
        initialHasMore: true,
        store,
        cacheKey: 'org-1',
        totalCount: 10,
      });
    });

    await waitFor(() => {
      expect(store.getState().items).toEqual(initial);
    });
    expect(store.getState().totalCount).toBe(10);
    expect(store.getState().cacheKey).toBe('org-1');
  });

  it('skips hydration when cacheKey matches (cache hit)', async () => {
    const store = makeStore();
    const initial = [makeItem(1)];
    const fetchMore = makeFetchMore([]);

    store.getState().hydrate([makeItem(99)], 5, 'org-1');

    renderHook(() => {
      return useInfiniteScroll<Item>({
        fetchMore,
        initialItems: initial,
        initialHasMore: true,
        store,
        cacheKey: 'org-1',
        totalCount: 5,
      });
    });

    await waitFor(() => {});

    expect(store.getState().items).toEqual([makeItem(99)]);
  });

  it('calls fetchMore and appendChunk on intersection', async () => {
    const store = makeStore();
    const initial = [makeItem(1)];
    const page2 = [makeItem(2), makeItem(3)];
    const fetchMore = makeFetchMore([page2]);

    renderHook(() => {
      return useInfiniteScroll<Item>({
        fetchMore,
        initialItems: initial,
        initialHasMore: true,
        store,
        cacheKey: 'org-1',
        totalCount: 3,
        limit: 10,
      });
    });

    await waitFor(() => {
      expect(store.getState().items).toEqual(initial);
    });

    act(() => {
      triggerIntersection(true);
    });

    await waitFor(() => {
      expect(store.getState().items).toHaveLength(3);
    });

    expect(fetchMore).toHaveBeenCalledWith(1, 10);
    expect(store.getState().hasMore).toBe(false);
  });

  it('does NOT call fetchMore when hasMore is false in store mode', async () => {
    const store = makeStore();
    const initial = [makeItem(1)];
    const fetchMore = jest.fn().mockResolvedValue({ data: [], hasMore: false });

    store.getState().hydrate(initial, 1, 'org-2');

    renderHook(() => {
      return useInfiniteScroll<Item>({
        fetchMore,
        initialItems: initial,
        initialHasMore: false,
        store,
        cacheKey: 'org-2',
        totalCount: 1,
      });
    });

    act(() => {
      triggerIntersection(true);
    });

    await waitFor(() => {});
    expect(fetchMore).not.toHaveBeenCalled();
  });

  it('invalidate clears store state', () => {
    const store = makeStore();
    store.getState().hydrate([makeItem(1)], 1, 'org-3');

    store.getState().invalidate();

    expect(store.getState().items).toHaveLength(0);
    expect(store.getState().cacheKey).toBeNull();
    expect(store.getState().totalCount).toBe(0);
  });
});
