---
title: refactor: Unified useInfiniteScroll hook (merge + universalize)
type: refactor
status: active
date: 2026-05-07
---

# refactor: Unified useInfiniteScroll Hook

## Overview

The codebase currently maintains two parallel hooks for infinite scrolling:

- `shared/hooks/use-infinite-scroll.ts` — lightweight, local-state-only, used in
  5 places
- `shared/hooks/use-cached-infinite-scroll.ts` — Zustand-backed, survives
  navigation, used in 1 place

Both duplicate the IntersectionObserver setup and share the same return shape.
This refactor merges them into a single universal `useInfiniteScroll<T>` hook
with an optional `store` parameter. Consumers with caching needs pass a store;
consumers without get the simpler path. The unified hook fixes a subtle observer
bug present in the cached variant, tightens the `createCachedListStore` generic
constraint, and aligns all 6 call sites to the single API.

---

## Problem Statement

### Duplication

Both hooks implement:

- Identical `IntersectionObserver` setup with `rootMargin: '20px'`
- Identical return signature `{ items, isLoading, hasMore, sentinelRef }`
- Identical silent-catch pattern in `loadMore`

Any fix (e.g. observer margin change, accessibility enhancement) must be applied
twice.

### Bug in `useCachedInfiniteScroll` observer

`use-cached-infinite-scroll.ts:84` — the intersection callback fires
`void loadMore()` unconditionally (no `entry.isIntersecting` guard beyond the
boolean). More importantly, the observer is recreated whenever `hasMore`,
`isLoading`, or `loadMore` changes — but the callback does **not** re-check
`entry.isIntersecting` at recreation time. In practice `loadMore` guards
internally via `store.getState()`, but this means each observer recreation
triggers an unnecessary extra call if the sentinel is still in view, creating
redundant network requests during the `isLoading → false` transition.

`useInfiniteScroll` handles this correctly: the observer callback checks
`entry.isIntersecting && hasMore && !isLoading` before calling `loadMore`.

### Inconsistent `fetchMore` return shapes

- `useInfiniteScroll`: expects `Promise<{ items: T[]; hasMore: boolean }>`
- `useCachedInfiniteScroll.fetchChunkAction`: expects
  `Promise<{ data: T[]; hasMore: boolean }>`

The field `items` vs `data` is inconsistent. The backend's `httpClientList`
returns `{ data, totalCount, hasMore }` — so `data` is the correct field name
per the existing `PaginatedResult<T>` type.

### Unsafe `removeItem` generic cast

`createCachedListStore.ts:109` — `(item as { id: number }).id` is an unsafe
cast. If `T` doesn't have an `id: number` field, this silently filters nothing
(never equals the passed `id`). The generic should be constrained to
`T extends { id: number }` when `removeItem` is needed.

### Missing `shared/hooks/index.ts` barrel

Consumers import via deep paths (`@/shared/hooks/use-infinite-scroll`) instead
of the public `@/shared/hooks` barrel. FSD requires each public directory to
expose an `index.ts`.

### Raw `fetch` in a UI component

`features/meetings/ui/meetings-list.tsx:70` calls raw
`fetch('/api/meetings?...')` in a client component — violating API Layer
Convention Rule 2 (use `httpClient`, never raw `fetch`). This is a pre-existing
issue but will be corrected as part of this refactor when we migrate that call
site.

---

## Proposed Solution

### Architecture Decision: Extend `useInfiniteScroll`, deprecate `useCachedInfiniteScroll`

**Option A — Keep both hooks** (rejected): Duplication remains; two APIs to
maintain.

**Option B — Replace both with a new hook** (rejected): Requires renaming all 6
call sites without a clear migration path, and loses the generation guard from
`useInfiniteScroll`.

**Option C — Extend `useInfiniteScroll` with optional `store` param** (chosen):

- `useInfiniteScroll` becomes the single canonical hook
- When `store` is provided → uses Zustand-backed state + hydration (replaces
  `useCachedInfiniteScroll`)
- When `store` is absent → uses local `useState` (existing behavior)
- One implementation of IntersectionObserver, generation guard, and observer fix
- Backward-compatible for the 5 existing call sites (no options change)
- `useCachedInfiniteScroll` is deleted after migration of the 1 call site

### Unified API

```ts
// shared/hooks/use-infinite-scroll.ts

type FetchResult<T> = { data: T[]; hasMore: boolean };

type UseInfiniteScrollOptions<T> = {
  // Required in both modes
  fetchMore: (offset: number) => Promise<FetchResult<T>>;
  initialItems: T[];
  initialHasMore: boolean;

  // Optional: caching mode
  store?: StoreHook<T>; // Zustand store from createCachedListStore
  cacheKey?: string | number; // Cache identity key (required when store is set)
  limit?: number; // Page size (passed to fetchMore as second arg when store is set)
  totalCount?: number; // Total count (required in store mode for hasMore derivation)

  // Optional: simple mode only
  maxItems?: number; // Evict oldest items when list exceeds this size
};
```

**Key design decisions:**

1. **`fetchMore` return field renamed to `data`** (from `items`) to match
   `PaginatedResult<T>` and `httpClientList` output. All 5 existing call sites
   adapt their `fetchMore` wrapper to return `{ data, hasMore }` instead of
   `{ items, hasMore }`.

2. **`store` mode hydration**: when `store` is provided, hook calls
   `store.getState().hydrate(initialItems, totalCount!, cacheKey!)` on mount —
   identical to current `useCachedInfiniteScroll` behavior.

3. **Observer fixed for both modes**: the intersection callback always checks
   `entry.isIntersecting && hasMore && !isLoading` before calling `loadMore`,
   regardless of mode. In store mode, `hasMore` and `isLoading` are sourced from
   the Zustand store selectors (reactive).

4. **`limit` threading**: when `store` is provided, `fetchMore` receives
   `(offset, limit)` — enabling the call site to pass page size. In simple mode,
   the `limit` parameter is unused (consumers already encode page size in their
   `fetchMore` closure).

### `createCachedListStore` improvements

```ts
// shared/store/create-cached-list-store.ts

// Constrained variant — when removeItem is needed
export function createCachedListStore<T extends { id: number }>(): ...

// OR: keep generic, but make removeItem only available when constrained
// Decision: add overloaded export for typed safety — see Phase 2
```

The `removeItem` method's unsafe `(item as { id: number }).id` cast is replaced
with a properly constrained generic. Existing `TeamProps` entity already has
`id: number`, so the single known call site is unaffected.

---

## Backend Contract Verification

The backend pagination contract (verified from
`/Users/slavapopov/Documents/WandaAsk_backend/`):

| Aspect               | Backend                                                             | Frontend (current)                           | Frontend (target)         |
| -------------------- | ------------------------------------------------------------------- | -------------------------------------------- | ------------------------- |
| Pagination params    | `offset: int, limit: int` (via `ApiResourceRequest`)                | Each call site hardcodes manually            | No change needed          |
| Total count delivery | `Items-Count` response header via `ApiResponse::list()`             | `httpClientList` reads header → `totalCount` | No change                 |
| `hasMore` source     | Not sent — derived client-side                                      | `data.length < totalCount`                   | Same, centralized in hook |
| Response field       | `data` array in envelope `{ success, data, message, status, meta }` | Correctly read via `httpClient`              | No change                 |

The `fetchMore` return shape change (`items` → `data`) aligns the hook with what
`httpClientList<T>` already returns:
`{ data: T[], totalCount: number, hasMore: boolean }`. Call sites can
destructure `{ data, hasMore }` directly from `httpClientList` without an
adapter object.

---

## Implementation Phases

### Phase 1 — Extend `useInfiniteScroll` (core hook)

**Files changed:**

- `shared/hooks/use-infinite-scroll.ts` — rewrite with store support
- `shared/hooks/index.ts` — create barrel file

**Tasks:**

- [ ] Add optional `store`, `cacheKey`, `totalCount`, `limit` params to
      `UseInfiniteScrollOptions<T>`
- [ ] Branch internal logic: when `store` is defined, use Zustand selectors for
      `items/isLoading/hasMore`; otherwise use `useState`
- [ ] Add hydration `useEffect` (store mode only)
- [ ] Unify `loadMore` `useCallback` — guards via reactive state in both modes
- [ ] Fix observer callback: check
      `entry.isIntersecting && hasMore && !isLoading` in store mode (currently
      only guarded inside `loadMore`)
- [ ] Rename `fetchMore` return field from `items` to `data` in type definitions
- [ ] Create `shared/hooks/index.ts` exporting `{ useInfiniteScroll }`

**Pseudo-code sketch:**

```ts
// shared/hooks/use-infinite-scroll.ts
'use client';

type FetchResult<T> = { data: T[]; hasMore: boolean };

type UseInfiniteScrollOptions<T> = {
  fetchMore: (offset: number, limit?: number) => Promise<FetchResult<T>>;
  initialItems: T[];
  initialHasMore: boolean;
  store?: StoreHook<T>;
  cacheKey?: string | number;
  totalCount?: number;
  limit?: number;
  maxItems?: number;
};

export function useInfiniteScroll<T>(options: UseInfiniteScrollOptions<T>) {
  const hasStore = !!options.store;

  // --- Store mode state ---
  const storeItems = options.store?.((s) => s.items) ?? [];
  const storeLoading = options.store?.((s) => s.isLoading) ?? false;
  const storeHasMore = options.store?.((s) => s.hasMore) ?? false;

  // --- Local mode state ---
  const [localItems, setLocalItems] = useState<T[]>(options.initialItems);
  const [localOffset, setLocalOffset] = useState(options.initialItems.length);
  const [localHasMore, setLocalHasMore] = useState(options.initialHasMore);
  const [localLoading, setLocalLoading] = useState(false);
  const generationRef = useRef(0);

  // Active state (select by mode)
  const items = hasStore ? storeItems : localItems;
  const isLoading = hasStore ? storeLoading : localLoading;
  const hasMore = hasStore ? storeHasMore : localHasMore;

  // Store hydration
  useEffect(() => {
    if (!options.store || !options.cacheKey || options.totalCount === undefined)
      return;
    options.store
      .getState()
      .hydrate(options.initialItems, options.totalCount, options.cacheKey);
  }, [
    options.store,
    options.initialItems,
    options.totalCount,
    options.cacheKey,
  ]);

  // Local reset on initialItems change
  useEffect(() => {
    if (hasStore) return;
    generationRef.current += 1;
    setLocalItems(options.initialItems);
    setLocalOffset(options.initialItems.length);
    setLocalHasMore(options.initialHasMore);
    setLocalLoading(false);
  }, [options.initialItems]);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (hasStore) {
      const state = options.store!.getState();
      if (state.isLoading || !state.hasMore) return;
      state.setLoading(true);
      try {
        const { data, hasMore: more } = await options.fetchMore(
          state.offset,
          options.limit,
        );
        options.store!.getState().appendChunk(data, more);
      } catch {
        /* silent */
      } finally {
        options.store!.getState().setLoading(false);
      }
    } else {
      if (localLoading || !localHasMore) return;
      setLocalLoading(true);
      const generation = generationRef.current;
      try {
        const { data: newItems, hasMore: more } =
          await options.fetchMore(localOffset);
        if (generationRef.current !== generation) return;
        setLocalItems((prev) => {
          const combined = [...prev, ...newItems];
          return options.maxItems && combined.length > options.maxItems
            ? combined.slice(-options.maxItems)
            : combined;
        });
        setLocalOffset((prev) => prev + newItems.length);
        setLocalHasMore(more);
      } catch {
        /* silent */
      } finally {
        if (generationRef.current === generation) setLocalLoading(false);
      }
    }
  }, [hasStore, options, localLoading, localHasMore, localOffset]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) void loadMore();
      },
      { rootMargin: '20px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  return { items, isLoading, hasMore, sentinelRef };
}
```

### Phase 2 — Fix `createCachedListStore` generic constraint

**Files changed:**

- `shared/store/create-cached-list-store.ts`

**Tasks:**

- [ ] Add `T extends { id: number }` constraint to the generic (the function
      signature)
- [ ] Remove the unsafe `(item as { id: number }).id` cast — replace with direct
      `item.id`
- [ ] Verify `features/teams/model/teams-store.ts` — confirm `TeamProps` has
      `id: number`
- [ ] Verify `CachedListStore<T>` type export — update if needed

### Phase 3 — Migrate all 6 call sites

#### 3a. Adapt `fetchMore` wrappers to return `{ data, hasMore }` (rename `items` → `data`)

All 5 `useInfiniteScroll` call sites currently return
`{ items: newItems, hasMore: more }`. They must be updated to
`{ data: newItems, hasMore: more }`.

**Files:**

- `features/transcript/ui/transcript-history.tsx` (line ~46) — `fetchMore`
  wrapper returns `{ items }` → `{ data }`
- `features/agents/ui/agent-tasks-feed.tsx` (line ~36) — same rename
- `features/agents/ui/agent-activity-feed.tsx` (line ~68) — same rename
- `features/agents/ui/agent-tasks-list.tsx` (line ~58) — same rename
- `features/meetings/ui/meetings-list.tsx` (line ~98) — same rename, PLUS fix
  raw `fetch` violation (see 3b)

#### 3b. Fix `meetings-list.tsx` raw fetch violation

**File:** `features/meetings/ui/meetings-list.tsx`

Current: directly calls `fetch('/api/meetings?offset=X&limit=Y')` in client
component.

Target: move the data-fetch logic to a server action in
`features/meetings/api/meetings.ts` using `httpClientList`. The client
component's `fetchMore` prop becomes a call to that server action.

- [ ] Create or update `features/meetings/api/meetings.ts` with a
      `loadMeetingsChunk(offset: number, limit: number)` server action
- [ ] Update `meetings-list.tsx` to call the server action instead of raw
      `fetch`

#### 3c. Migrate `useCachedInfiniteScroll` call site

**File:** `features/teams/ui/team-list.tsx` (line ~54)

Current:

```ts
import { useCachedInfiniteScroll } from '@/shared/hooks/use-cached-infinite-scroll';

const { items, ... } = useCachedInfiniteScroll({
  store: useTeamsStore,
  fetchChunkAction: loadTeamsChunk,
  cacheKey: organizationId,
  initialItems: initialTeams,
  totalCount,
  limit: 20,
});
```

Target:

```ts
import { useInfiniteScroll } from '@/shared/hooks';

const { items, ... } = useInfiniteScroll({
  fetchMore: loadTeamsChunk,   // loadTeamsChunk signature must now return { data, hasMore }
  initialItems: initialTeams,
  initialHasMore: initialTeams.length < totalCount,
  store: useTeamsStore,
  cacheKey: organizationId,
  totalCount,
  limit: 20,
});
```

- [ ] Update `loadTeamsChunk` return shape to `{ data, hasMore }` (matching
      renamed convention)
- [ ] Update `team-list.tsx` import and options object

### Phase 4 — Delete deprecated hook and add barrel

**Files:**

- `shared/hooks/use-cached-infinite-scroll.ts` — delete
- `shared/hooks/index.ts` — ensure it's complete (exports only
  `useInfiniteScroll`)

### Phase 5 — Tests

**Files:**

- `shared/hooks/__tests__/use-infinite-scroll.test.ts` — update or create

**Tasks:**

- [ ] Test local mode: initial render, sentinel intersection triggers
      `loadMore`, reset on `initialItems` change
- [ ] Test store mode: hydration skip (cache hit), `appendChunk` called on
      intersection, `invalidate` clears data
- [ ] Test observer fix: verify `loadMore` NOT called when `hasMore = false` in
      store mode
- [ ] Test `maxItems` eviction (local mode only)
- [ ] Test generation guard: rapid `initialItems` changes do not append stale
      data

**Mock pattern:**

```ts
// Mock IntersectionObserver (not in jsdom)
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
Object.defineProperty(globalThis, 'IntersectionObserver', {
  value: jest.fn().mockImplementation((cb) => ({
    observe: mockObserve,
    disconnect: mockDisconnect,
    _trigger: (entry: Partial<IntersectionObserverEntry>) => cb([entry]),
  })),
  writable: true,
});
```

---

## Acceptance Criteria

### Functional

- [ ] `useInfiniteScroll` works in local mode (all 5 existing call sites) with
      no behavior change
- [ ] `useInfiniteScroll` works in store mode (team-list) with caching preserved
      across navigation
- [ ] Observer fires `loadMore` only when
      `entry.isIntersecting && hasMore && !isLoading` in both modes
- [ ] No duplicate network requests on observer recreation during loading
- [ ] `maxItems` eviction still works (transcript-history)
- [ ] Generation guard prevents stale appends on rapid filter changes (local
      mode)
- [ ] Hydration skip (cache hit) works: navigating away and back does not
      re-fetch page 1
- [ ] `invalidate()` on mutation busts cache and forces re-hydration on next
      mount

### Code Quality

- [ ] `use-cached-infinite-scroll.ts` is deleted
- [ ] `shared/hooks/index.ts` barrel exists and exports `useInfiniteScroll`
- [ ] All call sites import from `@/shared/hooks` (no deep paths)
- [ ] `createCachedListStore<T>` has `T extends { id: number }` constraint — no
      unsafe cast
- [ ] `meetings-list.tsx` uses server action instead of raw `fetch`
- [ ] `fetchMore` return type consistently uses
      `{ data: T[]; hasMore: boolean }` everywhere
- [ ] No ESLint errors introduced
- [ ] TypeScript strict mode passes with no `any`

### Tests

- [ ] Unit tests cover local mode reset, store mode hydration, observer guard
      fix
- [ ] Coverage thresholds remain ≥ current levels (branches: 20, functions: 24,
      lines: 23)

---

## Risk Analysis

| Risk                                                                                  | Likelihood | Impact                                 | Mitigation                                                                                                                  |
| ------------------------------------------------------------------------------------- | ---------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `fetchMore` return rename (`items` → `data`) breaks a call site                       | Medium     | Runtime: items never append            | Update all 5 wrappers in Phase 3a; TypeScript will catch mismatches                                                         |
| Store mode `hasMore`/`isLoading` read from reactive selectors causes extra re-renders | Low        | Performance                            | Zustand's selector equality prevents re-renders when value doesn't change                                                   |
| `loadMore` `useCallback` dependency array becomes stale in store mode                 | Medium     | Infinite scroll stops after first page | Use `store.getState()` inside callback (not reactive) for all mutations — same pattern as current `useCachedInfiniteScroll` |
| `meetings-list.tsx` raw-fetch migration changes URL/auth behavior                     | Low        | Meetings list stops loading            | Read `features/meetings/api/` and Next.js Route Handler before writing SA                                                   |
| `T extends { id: number }` constraint breaks a non-team store                         | Low        | Compile error                          | Only one store uses `createCachedListStore` (teams); `TeamProps` has `id: number`                                           |

---

## Dependencies & Prerequisites

- No new packages required
- Backend contract: `offset` + `limit` params, `Items-Count` header — already
  verified in `ApiResourceRequest.php` and `ApiResponse::list()`
- `features/meetings/api/` — need to check if `loadMeetingsChunk` already exists
  before creating

---

## File Change Summary

| File                                                 | Action                                          |
| ---------------------------------------------------- | ----------------------------------------------- |
| `shared/hooks/use-infinite-scroll.ts`                | Rewrite (extend with store mode)                |
| `shared/hooks/use-cached-infinite-scroll.ts`         | **Delete**                                      |
| `shared/hooks/index.ts`                              | **Create** (barrel)                             |
| `shared/store/create-cached-list-store.ts`           | Fix generic constraint + remove unsafe cast     |
| `features/transcript/ui/transcript-history.tsx`      | Update `fetchMore` return shape                 |
| `features/agents/ui/agent-tasks-feed.tsx`            | Update `fetchMore` return shape                 |
| `features/agents/ui/agent-activity-feed.tsx`         | Update `fetchMore` return shape                 |
| `features/agents/ui/agent-tasks-list.tsx`            | Update `fetchMore` return shape                 |
| `features/meetings/ui/meetings-list.tsx`             | Update `fetchMore` return shape + fix raw fetch |
| `features/meetings/api/meetings.ts`                  | Create/update `loadMeetingsChunk` server action |
| `features/teams/ui/team-list.tsx`                    | Migrate to unified `useInfiniteScroll`          |
| `shared/hooks/__tests__/use-infinite-scroll.test.ts` | Create/update tests                             |

---

## References

### Internal

- `shared/hooks/use-infinite-scroll.ts` — current implementation (all 96 lines)
- `shared/hooks/use-cached-infinite-scroll.ts` — current implementation (all 99
  lines)
- `shared/store/create-cached-list-store.ts` — Zustand store factory (119 lines)
- `shared/lib/httpClient.ts` — `httpClientList<T>` returns `PaginatedResult<T>`
- `shared/types/common.ts:16` — `PaginatedResult<T>` definition
- `features/teams/model/teams-store.ts` — only `createCachedListStore` usage
- `features/teams/ui/team-list.tsx:54` — only `useCachedInfiniteScroll` usage
- `/Users/slavapopov/Documents/WandaAsk_backend/app/Http/Requests/API/ApiResourceRequest.php:26–30`
  — backend `offset`/`limit` validation
- `/Users/slavapopov/Documents/WandaAsk_backend/app/Http/Responses/ApiResponse.php:53–64`
  — `Items-Count` header pattern
