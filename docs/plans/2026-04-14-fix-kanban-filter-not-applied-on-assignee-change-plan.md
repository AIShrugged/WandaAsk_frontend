---
title: 'fix: Kanban filter not applied on assignee change without page reload'
type: fix
status: active
date: 2026-04-14
---

# fix: Kanban filter not applied on assignee change without page reload

## Overview

On `/dashboard/issues/kanban` (and the list tab), changing the Assignee filter
updates the URL correctly (`?assignee_id=22`) but the displayed kanban board
does **not** re-render with filtered data. A full page reload is required for
the filter to apply.

---

## Problem Statement

### Symptoms

- User changes the Assignee dropdown on the filter bar
- URL param `assignee_id` updates correctly
- The kanban board continues showing the **old (pre-filter) data**
- Full page reload shows the correct filtered data
- Same issue likely affects the list tab (both tabs share `IssuesLayoutClient`)

### Root Cause — Dual `columns` State with Conflicting Sync

The bug is caused by a **double-state + async sequencing** problem between
`IssuesKanbanTab` and `KanbanBoard`:

#### Layer 1 — `IssuesKanbanTab` (fetcher)

```
features/issues/ui/issues-kanban-tab.tsx:27-64
```

- Owns `columns` state, initialized from SSR `initialColumns` prop
- `useEffect([columnsVersion])` — fires when filters change, starts async
  `fetchKanbanIssues()`
- On success: `setColumns(result.data)` → passes updated `columns` as
  `initialColumns` to `KanbanBoard`

#### Layer 2 — `KanbanBoard` (renderer)

```
features/kanban/ui/kanban-board.tsx:499-508
```

```tsx
const [columns, setColumns] =
  useState<Record<IssueStatus, KanbanCard[]>>(initialColumns);

useEffect(() => {
  setColumns(initialColumns); // ← syncs from parent
}, [columnsVersion]); // ← depends on columnsVersion
```

- Also owns its **own internal** `columns` state
- Syncs from `initialColumns` prop via `useEffect([columnsVersion])`

#### The Race Condition

When `columnsVersion` increments (filter changes):

1. **Both** `useEffect([columnsVersion])` hooks fire in the same render cycle
2. `KanbanBoard.useEffect` → `setColumns(OLD initialColumns)` — the async fetch
   hasn't completed yet
3. `IssuesKanbanTab.useEffect` → starts async fetch (300ms–2s later) →
   `setColumns(NEW data)` → new `initialColumns` prop flows to `KanbanBoard`
4. **`KanbanBoard.useEffect([columnsVersion])` will NOT fire again** —
   `columnsVersion` didn't change again
5. Result: `KanbanBoard` receives new `initialColumns` as a React prop update,
   but never calls `setColumns()` with it → **stale data displayed**

#### Why Client-Side Filtering Also Fails

`KanbanBoard` applies client-side assignee filtering (lines 628–675) on its
**own internal `columns` state**, which is already filtered server-side from
SSR. Since the SSR fetch used the previous `assignee_id`, and the internal state
is now stale, client-side filtering operates on the wrong data set.

#### Why `status` filter appears to work (partially)

The `status` filter is applied client-side inside `KanbanBoard` against
`columns`. Because `columns` state in `KanbanBoard` gets set from
`initialColumns` at the same time `columnsVersion` fires, and `status` doesn't
trigger a server refetch, it appears to work by pure luck when data was loaded
without assignee filtering. But the assignee filter forces a server refetch,
hitting the race condition.

---

## Proposed Fix

### Option A — Remove `KanbanBoard`'s internal `columns` state (Recommended)

`KanbanBoard` should NOT own columns state at all — state management belongs in
`IssuesKanbanTab`. `KanbanBoard` should receive `columns` directly as a prop and
apply optimistic updates to a **local copy** without syncing from parent.

#### Changes

**`features/kanban/ui/kanban-board.tsx`**

```tsx
// Before
interface KanbanBoardProps {
  initialColumns: Record<IssueStatus, KanbanCard[]>;
  // ...
}

export function KanbanBoard({ initialColumns, ... }) {
  const [columns, setColumns] = useState(initialColumns);

  useEffect(() => {
    setColumns(initialColumns);  // ← REMOVE THIS
  }, [columnsVersion]);
  // ...
}

// After
interface KanbanBoardProps {
  columns: Record<IssueStatus, KanbanCard[]>;  // renamed from initialColumns
  // ...
}

export function KanbanBoard({ columns: externalColumns, ... }) {
  // Use externalColumns directly for filtering — no internal state
  // For optimistic drag-drop: keep a local "pending" state that
  // resets when externalColumns changes (via useEffect on reference equality)
  const [localOverride, setLocalOverride] = useState<Record<IssueStatus, KanbanCard[]> | null>(null);

  useEffect(() => {
    setLocalOverride(null);  // clear optimistic state on new server data
  }, [externalColumns]);

  const activeColumns = localOverride ?? externalColumns;
  // apply client-side filters on activeColumns
}
```

**`features/issues/ui/issues-kanban-tab.tsx`**

```tsx
// Pass columns state from IssuesKanbanTab directly
<KanbanBoard
  columns={columns}          // was initialColumns={columns}
  // remove columnsVersion — no longer needed for sync
  ...
/>
```

This eliminates the dual-state problem entirely. `IssuesKanbanTab` owns the
truth, `KanbanBoard` renders it.

---

### Option B — Replace `useEffect([columnsVersion])` sync with prop-derived state

Keep `KanbanBoard`'s internal state but sync it properly using `useMemo` or
direct derivation rather than an effect:

**`features/kanban/ui/kanban-board.tsx`**

```tsx
// Remove:
useEffect(() => {
  setColumns(initialColumns);
}, [columnsVersion]);

// Add: sync when initialColumns reference changes (after IssuesKanbanTab updates it)
const prevInitialRef = useRef(initialColumns);
if (prevInitialRef.current !== initialColumns) {
  prevInitialRef.current = initialColumns;
  setColumns(initialColumns); // synchronous render-time update
}
```

This is a React anti-pattern ("setState during render") but is valid for derived
state. A cleaner version uses `getDerivedStateFromProps` / the `key` prop.

---

### Option C — Use `key` prop to reset `KanbanBoard`

Force a full remount of `KanbanBoard` when `columnsVersion` changes:

**`features/issues/ui/issues-kanban-tab.tsx`**

```tsx
<KanbanBoard
  key={columnsVersion}    // remount on version change
  initialColumns={columns}
  ...
/>
```

Pro: simple, no race condition. Con: remount loses scroll position, animation
state, hovered cards.

---

## Recommended Approach: Option A

Option A is the cleanest fix. The fundamental issue is that `KanbanBoard` trying
to own a copy of server data is an anti-pattern when `IssuesKanbanTab` already
manages it. The board should only manage UI state (drag state, hover state,
optimistic moves).

---

## Acceptance Criteria

- [ ] Changing the Assignee dropdown updates the kanban board immediately (no
      page reload required)
- [ ] Changing any filter (status, type, organization, team, search) updates the
      kanban board correctly
- [ ] Optimistic drag-and-drop still works correctly after a filter change
- [ ] The list tab is unaffected
- [ ] No TypeScript errors
- [ ] Passes `npm run lint`

---

## Files to Modify

| File                                             | Change                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `features/kanban/ui/kanban-board.tsx:499-508`    | Remove or fix `useEffect([columnsVersion])` sync; rename `initialColumns` → `columns` prop |
| `features/issues/ui/issues-kanban-tab.tsx:68-76` | Pass `columns={columns}` instead of `initialColumns={columns}`                             |

---

## Context

### How the filter flow currently works (correctly)

```
User changes Assignee dropdown
  → SharedFiltersBar.onChange({ assignee_id: value })
  → IssuesLayoutClient.handleFiltersChange(patch)
    → setFilters(prev => {...prev, ...patch})   // context.filters updated ✓
    → setFiltersVersion(v => v+1)               // context.filtersVersion updated ✓
    → columnsVersionRef.current++
    → setColumnsVersion(current)                // context.columnsVersion updated ✓
  → useEffect([filters]) → updateUrl()          // URL updated ✓

  → IssuesKanbanTab.useEffect([columnsVersion]) fires
    → fetchKanbanIssues({ assignee_id: filters.assignee_id })   // correct ✓
    → setColumns(result.data)                   // IssuesKanbanTab state updated ✓
    → <KanbanBoard initialColumns={columns} />  // new prop flows down ✓

  → KanbanBoard receives new initialColumns prop
    → BUT useEffect([columnsVersion]) already fired (before fetch completed)
    → setColumns(initialColumns) NOT called again                // BUG ✗
    → KanbanBoard.columns state is stale                         // BUG ✗
```

### SSR initial load (works correctly)

On page load, `app/dashboard/issues/(list)/kanban/page.tsx` reads `assignee_id`
from `searchParams` and passes pre-filtered `initialColumns` to
`IssuesKanbanTab`. So the first render is correct. The bug only manifests on
subsequent client-side filter changes.

---

## References

- `features/issues/ui/issues-kanban-tab.tsx` — fetcher wrapper (lines 27–64)
- `features/kanban/ui/kanban-board.tsx` — renderer with stale sync (lines
  499–508, 628–675)
- `features/issues/ui/issues-layout-client.tsx` — filter state owner (lines
  104–161)
- `features/issues/ui/shared-filters-bar.tsx` — filter UI controls
