---
title:
  'refactor: Kanban page-level scroll and issues page performance optimization'
type: refactor
status: active
date: 2026-04-15
---

# refactor: Kanban page-level scroll and issues page performance optimization

## Overview

Two interrelated improvements to the `/dashboard/issues` area:

1. **Kanban scroll model** — replace per-column vertical scroll with a single
   page-level (or board-level) scroll so the entire `KanbanBoard` grows with its
   content and the page scrolls as one unit.
2. **Performance optimization** — apply `useMemo`, `useCallback`, and
   `React.memo` throughout the issues/kanban subtree to eliminate unnecessary
   re-renders, memoize expensive filter computations, and stabilize callback
   references.

---

## Problem Statement

### 1 · Per-column scroll (current)

In `features/kanban/ui/kanban-board.tsx:456` each column's card list has
`overflow-y-auto`:

```tsx
{/* Cards */}
<div className='flex flex-col gap-2 p-2 overflow-y-auto min-h-[120px]'>
```

This means each column independently clips and scrolls its cards. The outer
board container uses `min-h-0` + `flex-1` to fill the viewport, so columns are
capped by the visible area. The result is a "fixed-height columns with inner
scrollbars" pattern that feels cramped and inconsistent.

**Desired behavior:** columns are as tall as their content, the entire board (or
page) scrolls vertically in one scroll context — no individual column
scrollbars.

### 2 · Missing memoization

- `KanbanBoard` rebuilds `filteredColumns` on every render (an O(n×m) loop with
  no memoization).
- `handleDrop`, `handleMoveToColumn`, `applyOptimisticMove`,
  `revertOptimisticMove` are recreated every render.
- `KanbanColumnComponent` and `KanbanCardItem` are plain functions — no
  `React.memo` wrapper — so any parent state change (e.g. `hoveredCard`,
  `movingCardId`) re-renders every column and every card.
- In `features/issues/ui/issues-page.tsx` the `handleSort` callback already uses
  `useCallback`, but inline objects and handlers inside the render loop are
  unstabilized.
- `IssuesLayoutClient` rebuilds filter state and context value on each URL push.

---

## Proposed Solution

### Part A — Page-level scroll for KanbanBoard

**Strategy:** Remove `min-h-0` / `overflow-y-auto` constraints from the column
card container and let the board container grow to natural height. Let
`IssuesKanbanTab` (and ultimately the page scroll container) handle overflow.

**Affected files:**

- `features/kanban/ui/kanban-board.tsx` — column card container, board outer
  layout
- `features/issues/ui/issues-kanban-tab.tsx` — wrapper div currently has
  `overflow-hidden h-full`
- `app/dashboard/issues/(list)/layout.tsx` or `IssuesLayoutClient` — page scroll
  container

**Changes:**

#### `features/kanban/ui/kanban-board.tsx`

1. **Column card container** (`KanbanColumnComponent`, line 456):

   ```tsx
   // Before
   <div className='flex flex-col gap-2 p-2 overflow-y-auto min-h-[120px]'>

   // After — no overflow constraint, grows naturally
   <div className='flex flex-col gap-2 p-2 min-h-[120px]'>
   ```

2. **Column wrapper** (line 412) — remove fixed height behaviour; columns now
   auto-height:

   ```tsx
   // Before — relies on flex constraints from parent to cap height
   'flex flex-col w-[calc(25%-9px)] min-w-[200px] shrink-0 rounded-xl border transition-colors';

   // After — same, but no height capping (parent no longer constrains height)
   'flex flex-col w-[calc(25%-9px)] min-w-[200px] shrink-0 rounded-xl border transition-colors self-start';
   ```

   `self-start` prevents columns from stretching to the height of the tallest
   sibling, giving each column its natural height.

3. **Board outer container** (line 681–711):

   ```tsx
   // Before
   <div className='flex flex-col h-full gap-3 relative'>
     <div className='flex gap-3 flex-1 min-h-0'>
       <div className='flex gap-3 overflow-x-auto pb-4 flex-1 min-h-0'>

   // After — remove h-full / min-h-0 constraints; let board size naturally
   <div className='flex flex-col gap-3 relative'>
     <div className='flex gap-3'>
       <div className='flex gap-3 overflow-x-auto pb-4 flex-1'>
   ```

#### `features/issues/ui/issues-kanban-tab.tsx`

```tsx
// Before
<div className='flex-1 overflow-hidden p-3 h-full'>

// After — allow content to grow and page to scroll
<div className='p-3'>
```

#### `features/issues/ui/issues-layout-client.tsx`

The outer wrapper in `IssuesLayoutClient` currently constrains inner content.
Ensure the scroll container is the page or the top-level card wrapper, not the
tab area:

```tsx
// Wherever the children are rendered — ensure no overflow-hidden that clips the board
// Typically the parent <main> or the dashboard Card already handles the outer scroll
```

> **Note:** The exact class diff depends on the actual `IssuesLayoutClient`
> layout. Read it first and adjust accordingly. The principle is: one
> `overflow-y-auto` at the outermost wrapper (the page/card), zero
> `overflow-hidden` between that wrapper and `KanbanBoard`.

---

### Part B — Performance optimization

#### 1. Memoize `filteredColumns` in `KanbanBoard`

```tsx
// features/kanban/ui/kanban-board.tsx

const filteredColumns = useMemo(() => {
  const lowerSearch = filters.search.toLowerCase();
  const result: Record<IssueStatus, KanbanCard[]> = {
    open: [],
    in_progress: [],
    paused: [],
    done: [],
  };

  for (const col of KANBAN_COLUMNS) {
    if (filters.status && col.id !== filters.status) continue;
    const targetColId = filters.status || col.id;
    for (const card of activeColumns[col.id] ?? []) {
      if (
        filters.assignee_id &&
        card.assignee_id !== Number(filters.assignee_id)
      )
        continue;
      if (filters.type && card.type !== filters.type) continue;
      if (
        lowerSearch.length > 0 &&
        !card.name.toLowerCase().includes(lowerSearch) &&
        !(card.description?.toLowerCase().includes(lowerSearch) ?? false)
      )
        continue;
      result[targetColId].push(card);
    }
  }
  return result;
}, [activeColumns, filters]);
```

#### 2. Stabilize callbacks in `KanbanBoard`

```tsx
const applyOptimisticMove = useCallback((...) => { ... }, []);
const revertOptimisticMove = useCallback((...) => { ... }, []);

const handleDrop = useCallback((cardId, sourceStatus, targetStatus) => {
  // same logic
}, [activeColumns, applyOptimisticMove, revertOptimisticMove]);

const handleMoveToColumn = useCallback((card, status) => {
  handleDrop(card.id, card.status, status);
}, [handleDrop]);
```

#### 3. Wrap `KanbanColumnComponent` with `React.memo`

```tsx
// features/kanban/ui/kanban-board.tsx

const KanbanColumnComponent = memo(function KanbanColumnComponent({
  id,
  label,
  color,
  cards,
  onDrop,
  onMoveToColumn,
  movingCardId,
  onCardClick,
}: KanbanColumnProps) {
  // ... existing implementation unchanged
});
```

With stable `handleDrop` and `handleMoveToColumn` references, only the column
whose `cards` array changes will re-render.

#### 4. Wrap `KanbanCardItem` with `React.memo`

```tsx
const KanbanCardItem = memo(function KanbanCardItem({
  card,
  onMoveToColumn,
  columns,
  isMoving,
  onCardClick,
}) {
  // ... existing implementation unchanged
});
```

#### 5. Memoize context value in `FiltersContext` / `IssuesLayoutClient`

```tsx
// features/issues/ui/issues-layout-client.tsx

const contextValue = useMemo(
  () => ({
    filters,
    filtersVersion,
    columnsVersion,
    initialSort,
    initialOrder,
  }),
  [filters, filtersVersion, columnsVersion, initialSort, initialOrder],
);

return (
  <FiltersContext.Provider value={contextValue}>
    {children}
  </FiltersContext.Provider>
);
```

#### 6. Stabilize `handleSort` and inline handlers in `IssuesPage`

`handleSort` already uses `useCallback`. Audit and stabilize any remaining
inline `() => ...` handlers passed as props to table rows or cells that cause
full-table re-renders.

#### 7. Wrap `TaskPreviewModal` render guard

The `TaskPreviewModal` (lines 62–245) is inline in `KanbanBoard`'s render. Since
it's conditionally shown via `hoveredCard` state, changes to `hoveredCard`
currently re-render the entire board. Extract `TaskPreviewModal` as a `memo`
component or ensure it is already isolated enough that the board columns do not
re-render when modal opens/closes.

```tsx
// Already gated by AnimatePresence + conditional — verify KanbanColumnComponent
// does not re-render when hoveredCard changes (it shouldn't if memo is applied correctly)
```

---

## Acceptance Criteria

### Scroll

- [ ] The kanban board no longer shows per-column scrollbars
- [ ] Columns grow to their natural height; the user scrolls the page (or a
      single outer container) to see all cards
- [ ] Horizontal scroll still works when columns exceed viewport width
      (`overflow-x-auto` preserved on the inner board row)
- [ ] The loading overlay (`absolute inset-0`) still covers the full board
      correctly after the layout change
- [ ] The task preview modal still positions correctly

### Performance

- [ ] `filteredColumns` is not recomputed on unrelated state changes (e.g.,
      `hoveredCard` toggle, `movingCardId` change)
- [ ] Opening/closing the task preview modal does not re-render
      `KanbanColumnComponent` or `KanbanCardItem` instances
- [ ] Moving a card only re-renders the two affected columns (source + target),
      not all four
- [ ] No regression in drag-and-drop: optimistic updates still apply and revert
      correctly
- [ ] Context value reference in `FiltersContext` is stable between renders that
      do not change filter values
- [ ] `npm run lint` passes with no new warnings
- [ ] TypeScript strict build passes (`npm run build`)

### No regressions

- [ ] Filter changes (search, assignee, org, type, status) still refetch and
      update the board
- [ ] Switching between Kanban and List tabs preserves filters via
      `preserveSearchParams`
- [ ] Infinite scroll on the list tab is unaffected

---

## Implementation Phases

### Phase 1 — Scroll model (isolated CSS/layout change)

1. Remove `overflow-y-auto` from column card container in
   `KanbanColumnComponent`
2. Remove `min-h-0` / `h-full` constraints from board outer containers
3. Remove `overflow-hidden h-full` from `IssuesKanbanTab` wrapper
4. Ensure exactly one `overflow-y-auto` exists on the outer scroll container
   (page card)
5. Visually verify: columns grow, page scrolls, horizontal overflow still works
6. Check loading overlay still covers board

### Phase 2 — Core memoization in `KanbanBoard`

1. Move `filteredColumns` logic into `useMemo`
2. Wrap `applyOptimisticMove`, `revertOptimisticMove` in `useCallback`
3. Wrap `handleDrop`, `handleMoveToColumn` in `useCallback`
4. Apply `React.memo` to `KanbanColumnComponent`
5. Apply `React.memo` to `KanbanCardItem`
6. Verify no TypeScript errors

### Phase 3 — Context and list page optimization

1. Memoize `FiltersContext` value in `IssuesLayoutClient`
2. Audit `IssuesPage` for unstable props passed to table cell renderers
3. Memoize `TaskPreviewModal` if it causes column re-renders

### Phase 4 — Verification

1. Manual test: drag card, apply filter, open preview modal — check React
   DevTools re-render highlights
2. `npm run lint:fix && npm run format`
3. `npm run build` — zero errors

---

## Files to Modify

| File                                          | Change                                                                                                                                                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/kanban/ui/kanban-board.tsx`         | Remove per-column `overflow-y-auto`; remove board `h-full`/`min-h-0`; add `useMemo` for `filteredColumns`; `useCallback` for handlers; `memo` for `KanbanColumnComponent` and `KanbanCardItem` |
| `features/issues/ui/issues-kanban-tab.tsx`    | Remove `overflow-hidden h-full` from wrapper div                                                                                                                                               |
| `features/issues/ui/issues-layout-client.tsx` | Memoize context value; ensure no `overflow-hidden` clips board                                                                                                                                 |
| `features/issues/ui/issues-page.tsx`          | Audit and stabilize any remaining unstable inline handlers                                                                                                                                     |

---

## Risk Analysis

| Risk                                                                                                                             | Mitigation                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Loading overlay (`absolute inset-0`) may no longer cover the full board if parent loses fixed height                             | Set `position: relative` explicitly on the board container after removing `h-full`                               |
| `useCallback` on `handleDrop` captures stale `activeColumns`                                                                     | Include `activeColumns` in deps array; verify optimistic update still works                                      |
| `React.memo` on `KanbanCardItem` may prevent re-render of cards being moved if `isMoving` prop identity is stale                 | Prop is derived from `movingCardId === card.id` — a primitive comparison, safe                                   |
| Removing `overflow-hidden` from `IssuesKanbanTab` may expose hidden overflow in parent that causes layout shifts                 | Test with many cards across all columns at various viewport sizes                                                |
| `memo` on `KanbanColumnComponent` + new `cards` array reference on every filter change may cause all columns to re-render anyway | `filteredColumns` from `useMemo` returns new arrays only when `activeColumns`/`filters` change — this is correct |

---

## References

- `features/kanban/ui/kanban-board.tsx:456` — current `overflow-y-auto` on
  column card container
- `features/kanban/ui/kanban-board.tsx:681-711` — board outer layout with
  `h-full` / `min-h-0`
- `features/issues/ui/issues-kanban-tab.tsx` — wrapper
  `flex-1 overflow-hidden p-3 h-full`
- `features/issues/ui/issues-layout-client.tsx` — filter context provider, URL
  sync
- `features/issues/ui/issues-page.tsx:236-246` — existing `useCallback` for
  `handleSort`
- `shared/hooks/use-infinite-scroll.ts` — IntersectionObserver, unaffected by
  this change
