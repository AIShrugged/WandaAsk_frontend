---
title:
  'refactor: Universal shared DataTable component with infinite scroll, sorting,
  and column filters'
type: refactor
status: active
date: 2026-05-08
---

# refactor: Universal Shared DataTable Component

## Enhancement Summary

**Deepened on:** 2026-05-08 **Research agents used:** TypeScript reviewer,
Architecture strategist, Performance oracle, Code simplicity reviewer, Frontend
races reviewer, Pattern recognition specialist, Accessibility auditor, Document
coherence reviewer, Accessible row navigation research, React 19 generic
component patterns research

### Key Improvements from Research

1. **Remove `filterValue`/`onFilterChange` from `TableColumn`** — consensus
   across architecture, TypeScript, performance, and simplicity reviewers.
   Column definitions must be filter-state-free; filter UI belongs in the
   `header: ReactNode` slot. This also fixes a React Compiler deopt.
2. **Stable observer pattern** — the `useInfiniteScroll` hook recreates
   `IntersectionObserver` on every `loadMore` change, causing double-page-load
   in React 19 concurrent mode. Fix via `loadMoreRef` pattern before
   implementing `DataTable`.
3. **Accessible row navigation** — `<a>` wrapping `<tr>` is invalid HTML. Use
   the stretchy-link pattern: anchor in first `<td>`,
   `::after { position: absolute; inset: 0 }` overlay.
4. **`keyExtractor` not `getRowKey`** — codebase already uses `keyExtractor` in
   `GenericList<T>`.
5. **`TableColumn<T>` not `ColumnDef<T>`** — follows existing noun style
   (`DropdownOption`, `PaginatedResult`).
6. **Simplify scope** — `decisions-table` and `key-points-table` should NOT be
   migrated (different visual style, no duplication gain). `IssuesPage`
   migration is evaluate-only after agent tables are done.
7. **`SortOrder` consolidation** — currently defined in two places; consolidate
   to `types.ts` first.
8. **`'use client'`** — `DataTable` must be a Client Component (uses refs, event
   handlers).
9. **React 19 refs** — use `React.RefObject<HTMLDivElement>` (not `| null` in
   type param); no `forwardRef` needed, pass `ref` as prop directly.
10. **`header: ReactNode`** — making `header` a `ReactNode` (not just `string`)
    lets each feature embed `<SortableHeader>` directly in the column
    definition, removing `sortField`/`sortOrder`/`onSort` from `DataTableProps`
    entirely.

### New Considerations Discovered

- **`useInfiniteScroll` observer churn is a pre-existing bug** that must be
  fixed independently — affects all 5 existing consumers of the hook, not just
  `DataTable`.
- **`IssuesPage` has inline cell mutations** (status/assignee dropdowns) that
  cannot be expressed through a generic `renderCell` without closing over local
  component state — it is a special case that may never be a clean `DataTable`
  consumer.
- **Dual DOM rendering** (CSS-hidden mobile + desktop) doubles DOM node count;
  use `display: none` (Tailwind `hidden`) to ensure hidden layer is removed from
  accessibility tree automatically.
- **`aria-rowcount="-1"`** signals infinite/unknown row count to screen readers
  — prevents misleading "row X of 47" announcements.

---

## Overview

The codebase has **6+ independent table implementations** (issues, agent tasks,
agent profiles, agent task runs, decisions, archived issues) that all duplicate
the same patterns: `<table>` markup, responsive mobile-card fallback,
`useInfiniteScroll` wiring, and `SortableHeader` usage. This refactor extracts a
generic `DataTable<T>` component into `shared/ui/table/` that handles:

- Column definitions with typed render functions and custom cell renderers
- Built-in infinite scroll (wiring `useInfiniteScroll` sentinel and status)
- Optional sortable column headers — embedded directly in column's `header` slot
- Responsive mobile card fallback via a pluggable render slot
- Accessible table structure: `<caption>`, `scope="col"`, `aria-sort`,
  `aria-rowcount`

The existing `SortableHeader` stays as a low-level primitive; `DataTable`
renders it when features embed it in column `header` slots.

---

## Problem Statement

### Duplication Inventory

| File                                          | Lines | Infinite scroll    | Sorting | Mobile cards | Migration target       |
| --------------------------------------------- | ----- | ------------------ | ------- | ------------ | ---------------------- |
| `features/issues/ui/issues-page.tsx`          | ~400  | ✅                 | ✅      | ❌           | Evaluate after phase 3 |
| `features/agents/ui/agent-tasks-list.tsx`     | ~170  | ✅                 | ❌      | ✅           | Phase 3                |
| `features/agents/ui/agent-profiles-list.tsx`  | ~120  | ❌                 | ❌      | ✅           | Phase 2                |
| `features/agents/ui/agent-task-runs-list.tsx` | ~100  | ❌                 | ❌      | ✅           | Phase 2                |
| `features/decisions/ui/decisions-table.tsx`   | ~80   | ❌                 | ❌      | ❌           | ❌ out of scope        |
| `features/decisions/ui/key-points-table.tsx`  | ~60   | ❌                 | ❌      | ❌           | ❌ out of scope        |
| `features/issues/ui/archived-section.tsx`     | ~100  | ❌ (load-more btn) | ❌      | ❌           | ❌ out of scope        |

**Why decisions/key-points are out of scope:** They use a distinctly different
visual style (`rounded-[var(--radius-card)] border border-border` wrapper,
`bg-muted/20` thead vs `bg-accent/30`). They are ≤91 lines, have no
sort/scroll/mobile variants, and gain near nothing from migration. The churn
cost exceeds the benefit.

**Why archived-section is out of scope:** It deliberately uses a load-more
button (not infinite scroll) to avoid sentinel collision with the parent
`IssuesPage` sentinel.

Each file independently re-implements:

- `<div className='hidden md:block overflow-x-auto'>` wrapper
- `<table className='w-full min-w-[900px] text-sm'>` with fixed `<thead>`
- `<div className='flex flex-col gap-3 md:hidden'>` mobile cards section
- Sentinel div `<div ref={sentinelRef} className='h-10' />`
- `SpinLoader` on loading state
- `InfiniteScrollStatus` on completion

### No TanStack Table — confirmed by research

TanStack Table v8 has a confirmed open issue
([#5567](https://github.com/TanStack/table/issues/5567)) where it does not
re-render correctly with the React Compiler because its internal patterns break
the Rules of React. The workaround requires `'use no memo'` directives that
defeat the compiler's purpose. This is a hard blocker for this project.
Additionally, all sorting and filtering is **server-side** — TanStack's
client-side feature set is irrelevant.

---

## Proposed Solution

### Architecture Decision: `header: ReactNode` eliminates sort props from DataTable

**The key insight from research:** making `header` a `ReactNode` on
`TableColumn` (not just `string`) lets each feature embed `<SortableHeader>`
directly in the column definition. This removes `sortField`, `sortOrder`, and
`onSort` from `DataTableProps` entirely — the feature owns sort state and passes
pre-configured `<SortableHeader>` nodes:

```tsx
// features/issues/model/issue-columns.tsx
const columns: TableColumn<Issue>[] = [
  {
    id: 'name',
    header: (
      <SortableHeader
        label="Name"
        field="name"
        currentSort={sortField}
        currentOrder={sortOrder}
        onSort={handleSort}
      />
    ),
    renderCell: (issue) => <Link href={...}>{issue.name}</Link>,
  },
  {
    id: 'status',
    header: 'Status',  // plain string for non-sortable columns
    renderCell: (issue) => <IssueStatusBadge status={issue.status} />,
  },
];
```

`DataTable` renders `col.header` verbatim inside `<th scope="col">` — no
knowledge of sort state.

### `TableColumn<T>` type

```ts
// shared/ui/table/types.ts
export type SortOrder = 'asc' | 'desc'; // single source of truth — remove from SortableHeader.tsx

export interface TableColumn<T> {
  id: string; // renamed from 'key' (avoids React key prop confusion)
  header: React.ReactNode; // string | <SortableHeader> | any header JSX
  renderCell: (row: T) => React.ReactNode; // renamed from 'accessor' — matches GenericList.renderItem style
  cellClassName?: string; // td className override (renamed from 'className')
  renderCardField?: (row: T) => React.ReactNode; // optional mobile-card override for this field
}
```

**Research-driven changes from original plan:**

- `id` (not `key`) — `key` collides with React's reserved prop name
- `header: ReactNode` (not `string`) — enables embedded `<SortableHeader>` or
  filter UI
- `renderCell` (not `accessor`) — matches `GenericList.renderItem` convention;
  `accessor` is a TanStack-ism with different semantics
- `cellClassName` (not `className`) — prevents confusion between td and
  container className
- Removed: `headerClassName`, `minWidth`, `sortField`, `filterOptions`,
  `filterValue`, `onFilterChange` (all YAGNI or violate layer separation)
- Added: `renderCardField` — optional override for how this column renders in
  mobile cards

### `DataTable<T>` component

```ts
// shared/ui/table/DataTable.tsx
'use client';

interface DataTableProps<T> {
  // Data
  columns: TableColumn<T>[];
  items: T[];
  keyExtractor: (row: T) => string | number; // matches GenericList convention

  // Infinite scroll (all three required together when used)
  isLoading?: boolean;
  hasMore?: boolean;
  sentinelRef?: React.RefObject<HTMLDivElement>; // React 19: RefObject<T>, not RefObject<T | null>

  // Row behaviour (mutually exclusive with per-cell links in renderCell)
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T) => string;

  // Mobile fallback (if omitted, table is always shown without md: prefix)
  renderMobileCard?: (row: T) => React.ReactNode;

  // Accessibility (required for WCAG compliance)
  caption: string; // rendered as <caption> — required, no default
  captionSrOnly?: boolean; // apply sr-only to caption if already visible via heading

  // Layout
  tableMinWidth?: string; // e.g. 'min-w-[900px]' — applied to <table>
  tableFixed?: boolean; // enables table-fixed layout (for colgroup-controlled columns)
  className?: string;
}
```

**Why `getRowHref` was removed:** The accessible stretchy-link pattern (anchor
in first `<td>`, `::after` overlay) must be implemented inside `renderCell` of
the first column — it requires knowing which column is "primary". Generalising
this in `DataTable` adds complexity without proportional value. Each feature
implements row-level navigation through its `renderCell` for the primary column
(same as the existing pattern in `agent-profiles-list` and `agent-tasks-list`).

### Component structure

```
shared/ui/table/
  types.ts               ← TableColumn<T>, SortOrder, (SortOrder moved here from SortableHeader)
  DataTable.tsx          ← 'use client', generic table component
  SortableHeader.tsx     ← existing, imports SortOrder from ./types
  index.ts               ← re-exports DataTable, TableColumn, SortOrder, SortableHeader
```

### Responsive pattern

```tsx
// DataTable.tsx (sketch)
export function DataTable<T>({
  columns,
  items,
  keyExtractor,
  isLoading,
  hasMore,
  sentinelRef,
  renderMobileCard,
  caption,
  captionSrOnly,
  tableMinWidth,
  tableFixed,
  className,
  onRowClick,
  getRowClassName,
}: DataTableProps<T>) {
  return (
    <>
      {/* Mobile card list — display:none on md+ (auto-removes from a11y tree) */}
      {renderMobileCard && (
        <div className='flex flex-col gap-3 md:hidden'>
          {items.map((row) => (
            <div key={keyExtractor(row)}>{renderMobileCard(row)}</div>
          ))}
          {/* Mobile loading / sentinel share the same sentinel ref */}
          {isLoading && <SpinLoader />}
          {hasMore && <div ref={sentinelRef} className='h-2' />}
          {!hasMore && items.length > 0 && (
            <InfiniteScrollStatus itemCount={items.length} />
          )}
        </div>
      )}

      {/* Desktop table — display:none below md when mobile cards exist */}
      <div
        className={cn(
          'overflow-x-auto',
          renderMobileCard && 'hidden md:block',
          className,
        )}
      >
        {/* aria-live region for load announcements */}
        <div
          role='status'
          aria-live='polite'
          aria-atomic='true'
          className='sr-only'
        >
          {isLoading ? 'Loading data…' : ''}
        </div>

        <table
          className={cn(
            'w-full text-sm',
            tableFixed && 'table-fixed',
            tableMinWidth,
          )}
          aria-rowcount={hasMore ? -1 : items.length} // -1 = infinite/unknown
        >
          <caption className={cn(captionSrOnly && 'sr-only')}>
            {caption}
          </caption>

          <thead className='bg-accent/30 text-left text-muted-foreground'>
            <tr>
              {columns.map((col) => (
                <th key={col.id} scope='col' className='px-4 py-3 font-medium'>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {items.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row)}
                aria-rowindex={rowIndex + 1} // required when aria-rowcount is set
                className={cn(
                  'border-b border-border/60 align-top text-foreground',
                  onRowClick && 'cursor-pointer',
                  getRowClassName?.(row),
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') onRowClick(row);
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cn('px-4 py-3', col.cellClassName)}
                  >
                    {col.renderCell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Desktop loading / sentinel */}
        {isLoading && (
          <div className='flex justify-center py-4'>
            <SpinLoader />
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <InfiniteScrollStatus itemCount={items.length} />
        )}
        {hasMore && <div ref={sentinelRef} className='h-10' />}
      </div>
    </>
  );
}
```

### Accessible row navigation (stretchy-link pattern)

For tables where the entire row navigates to a detail page (agent tasks, agent
profiles), the primary cell `renderCell` implements the stretchy-link:

```tsx
// In the feature's column definition (first column):
{
  id: 'name',
  header: 'Name',
  renderCell: (task) => (
    // The <tr> must have position:relative (add via getRowClassName or global tr style)
    <Link
      href={`${ROUTES.DASHBOARD.AGENT_TASKS}/${task.id}`}
      className='font-medium text-primary hover:underline
                 after:absolute after:inset-0 after:content-[""]'
    >
      {task.name}
    </Link>
  ),
}
// Other cells get: className='relative z-[1]' via cellClassName
```

This pattern: valid HTML, keyboard-navigable, screen-reader-friendly, compatible
with per-cell action buttons (they sit above the overlay via `z-index`).

### `useTableSort` hook (kept — used by IssuesPage)

```ts
// shared/hooks/use-table-sort.ts
export function useTableSort<Field extends string>(
  defaultField: Field,
  defaultOrder: SortOrder = 'desc',
) {
  const [sortField, setSortField] = useState<Field>(defaultField);
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultOrder);

  // handleSort typed as Field (not string) — makes the generic constraint meaningful
  function handleSort(field: Field): void {
    if (field === sortField) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  }

  return { sortField, sortOrder, handleSort };
}
```

**Research fix:** `handleSort(field: Field)` (not `field: string`) makes the
type parameter meaningful — callers are type-checked against valid field names.
The `field as Field` cast is removed.

---

## Critical Pre-Requisite: Fix `useInfiniteScroll` Observer Churn

**This must be done before or alongside Phase 1.**

The current `useInfiniteScroll` hook recreates `IntersectionObserver` every time
`loadMore` changes. `loadMore` changes on every page load (because `localOffset`
is a dependency). In React 19 concurrent mode, this causes a **double-page-load
bug**: after each successful page append, the observer reconnects and fires
immediately (browser spec: `observe()` always delivers an initial entry),
triggering another `fetchMore` call before `isLoading` has updated.

Fix by using a stable ref-based observer (affects all 5 existing consumers):

```ts
// shared/hooks/use-infinite-scroll.ts — fix for local mode:

const loadMoreRef = useRef(loadMore);
useEffect(() => { loadMoreRef.current = loadMore; }, [loadMore]);

// Replace the observer useEffect with a stable one:
useEffect(() => {
  if (!sentinelRef.current) return;
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) void loadMoreRef.current();
    },
    { rootMargin: '20px' },
  );
  observer.observe(sentinelRef.current);
  return () => observer.disconnect();
}, []); // stable — created once, reads current loadMore via ref

// Also fix catch branch (currently missing setLocalLoading(false)):
} catch {
  setLocalLoading(false); // unconditional — generation guard is on setLocalItems, not here
}
```

---

## Migration Plan

### Phase 0 — Prerequisites (in `useInfiniteScroll` + `SortOrder` consolidation)

1. Fix `useInfiniteScroll`: stable observer pattern + `catch` loading reset
2. Consolidate `SortOrder` to `shared/ui/table/types.ts`; remove duplicate from
   `features/issues/model/types.ts` and from `SortableHeader.tsx` (import from
   `./types`)

### Phase 1 — Core infrastructure

3. Create `shared/ui/table/types.ts` (`TableColumn<T>`, `SortOrder`)
4. Create `shared/ui/table/DataTable.tsx` (`'use client'`)
5. Update `shared/ui/table/SortableHeader.tsx` to import `SortOrder` from
   `./types`
6. Update `shared/ui/table/index.ts` to export `DataTable`, `TableColumn`,
   `SortOrder`
7. Create `shared/hooks/use-table-sort.ts` (with
   `handleSort: (field: Field) => void`)
8. Update `shared/hooks/index.ts` to export `useTableSort`

### Phase 2 — Migrate simple agent lists (no infinite scroll)

9. `features/agents/ui/agent-profiles-list.tsx` → `DataTable` +
   `renderMobileCard` slot
10. `features/agents/ui/agent-task-runs-list.tsx` → `DataTable` +
    `renderMobileCard` slot

### Phase 3 — Migrate agent tasks list (adds infinite scroll)

11. `features/agents/ui/agent-tasks-list.tsx` → `DataTable` +
    `useInfiniteScroll` + `renderMobileCard`

> Backend: `AgentTaskController@index` does NOT support `sort`/`order` params
> (hardcoded `latest('id')`). Column headers for agent tasks will be plain
> strings (no `<SortableHeader>`). Filtering by `enabled` and `schedule_type` is
> already supported by the backend — these can be added as filter UI in the
> `header` slot of the relevant columns (embed an `InputDropdown` or small
> select in `header: ReactNode`).

### Phase 4 — Evaluate IssuesPage (optional, separate decision)

12. After Phases 2–3 are shipped and patterns are validated, evaluate whether
    `issues-page.tsx` should adopt `DataTable`. Key blockers:
    - Inline status/assignee mutations require per-row `useState`
      (`editingStatusIssueId`, `editingAssigneeIssueId`, `updatingIssueId`) —
      these must be closed over inside `renderCell`, which means the column
      definitions cannot be module-level constants; they must be built inside
      the component. React Compiler handles this, but it is less clean than
      stateless columns.
    - `table-fixed` + `<colgroup>` for precise column widths — use `tableFixed`
      prop and pass custom `className` or a custom `<colgroup>` slot if needed.
    - If migrated, the archived section (`archived-section.tsx`) stays as raw
      HTML with load-more button — this is a permanent exclusion, not a later
      phase.

---

## Backend Support Matrix

| Feature                  | Issues                     | Agent Tasks                 | Agent Profiles                             | Decisions        |
| ------------------------ | -------------------------- | --------------------------- | ------------------------------------------ | ---------------- |
| Server-side sort         | ✅ `sort` + `order` params | ❌ hardcoded `latest('id')` | ❌                                         | ❌               |
| Filter: status/enabled   | ✅                         | ✅ `enabled` (bool)         | ❌                                         | ❌               |
| Filter: type             | ✅                         | ✅ `schedule_type`          | ❌                                         | ✅ `source_type` |
| Filter: assignee         | ✅                         | ❌                          | ❌                                         | ❌               |
| Search                   | ✅                         | ❌                          | ❌                                         | ✅               |
| Infinite scroll (offset) | ✅                         | ✅                          | ✅ (backend only; frontend is static list) | ✅               |

Note: Agent Profiles backend supports pagination but the **frontend currently
uses a static prop list** — no `useInfiniteScroll` wiring. Phase 2 migrates the
visual structure only; adding infinite scroll to profiles is a separate feature
decision.

---

## Acceptance Criteria

### Functional

- [ ] `DataTable<T>` renders a responsive table (desktop) + mobile card list
      (when `renderMobileCard` is provided); mobile cards hidden via
      `display:none` (`md:hidden`)
- [ ] Infinite scroll: `sentinelRef` attached at bottom, `isLoading` shows
      spinner, end of list shows `InfiniteScrollStatus`
- [ ] Sort: features embed `<SortableHeader>` in column `header` slot;
      `DataTable` renders `col.header` verbatim — no sort knowledge in
      `DataTable`
- [ ] Column header filter: features embed filter UI (`InputDropdown` or custom)
      in column `header: ReactNode` — no filter knowledge in `DataTable`
- [ ] Sort/filter change resets scroll: consumer updates `initialItems` →
      `useInfiniteScroll` `useEffect([initialItems])` resets automatically
- [ ] No regression in existing agent tasks, agent profiles, issues list
      behaviour
- [ ] `archived-section.tsx` unchanged — load-more button pattern preserved

### TypeScript

- [ ] `DataTable` is fully generic: `TableColumn<AgentTask>[]`,
      `TableColumn<Issue>[]` etc.
- [ ] No `any` in public surface; `renderCell` return type is `React.ReactNode`
- [ ] `keyExtractor` receives `T` (not `any`) — consistent with
      `GenericList.keyExtractor`
- [ ] `useTableSort<Field>` — `handleSort(field: Field)` is type-checked at call
      sites
- [ ] `sentinelRef` typed as `React.RefObject<HTMLDivElement>` (React 19: no
      `| null` in type param)
- [ ] `SortOrder` has exactly one definition: `shared/ui/table/types.ts`
- [ ] `DataTable` is `'use client'` — must not be imported from Server
      Components

### Accessibility (WCAG 2.1 AA)

- [ ] Every `<th>` has `scope="col"`
- [ ] `<caption>` rendered for every `DataTable` instance; `captionSrOnly`
      available for visually redundant captions
- [ ] `aria-rowcount="-1"` on `<table>` when `hasMore` is true (infinite list)
- [ ] `aria-rowindex` on each `<tr>` when `aria-rowcount` is set
- [ ] Loading state uses `role="status" aria-live="polite"` — screen reader
      announces start/end
- [ ] Mobile `display:none` (Tailwind `hidden`) auto-removes hidden layer from
      accessibility tree (no extra `aria-hidden` needed)
- [ ] Row navigation uses stretchy-link pattern (per
      [Adrian Roselli](https://adrianroselli.com/2020/02/block-links-cards-clickable-regions-etc.html))
      — valid HTML, keyboard-navigable
- [ ] Sort buttons have `aria-sort` on `<th>` (only active column); icons have
      `aria-hidden="true"`
- [ ] All interactive elements have visible `:focus-visible` ring (dark theme:
      `ring-violet-500`)

### Design

- [ ] Table header: `bg-accent/30 text-muted-foreground px-4 py-3` — same as
      current
- [ ] Row hover: default `hover:bg-accent/10`; feature-specific override via
      `getRowClassName`
- [ ] Mobile cards preserve
      `rounded-[var(--radius-card)] border border-border p-4`
- [ ] No new color tokens introduced

### Quality

- [ ] `shared/ui/table/` has no imports from `features/` or `entities/`
- [ ] `DataTable` unit tests cover:
  - Renders columns from `columns` prop (verifies `header` and `renderCell`
    called)
  - `keyExtractor` is called for each row
  - `renderMobileCard` is rendered in mobile section when provided
  - `isLoading=true` renders `SpinLoader`
  - `!hasMore && items.length > 0` renders `InfiniteScrollStatus`
  - `hasMore=true` attaches `sentinelRef` to sentinel div
  - `caption` prop renders `<caption>` element in DOM
  - `onRowClick` calls handler on row click and on Enter key
- [ ] `useTableSort` unit tests cover:
  - Calling `handleSort('field_a')` sets `sortField='field_a'`,
    `sortOrder='desc'`
  - Calling `handleSort('field_a')` again toggles to `sortOrder='asc'`
  - Calling `handleSort('field_b')` resets to `sortOrder='desc'` with new field
- [ ] `useInfiniteScroll` observer fix has tests for double-trigger prevention

---

## Performance Considerations

### Columns must be stable references

The React Compiler memoizes based on prop identity. If `columns` is defined
inline:

```tsx
// ❌ Causes React Compiler deopt — new array on every render
<DataTable columns={[{ id: 'name', ... }]} ... />

// ✅ Module-level constant for stateless columns
const COLUMNS: TableColumn<AgentTask>[] = [ ... ];
<DataTable columns={COLUMNS} ... />

// ✅ useMemo for columns that close over component state (issues inline editing)
const columns = useMemo(
  () => buildIssueColumns(sortField, sortOrder, handleSort, editHandlers),
  [sortField, sortOrder, handleSort, editHandlers],
);
```

Do **not** wrap columns in `useMemo` when React Compiler is enabled — the
compiler handles it and manually memoizing causes a deopt. Since the compiler is
enabled in this project, write columns at module scope (stateless) or inline
(let compiler optimize).

### `minWidth` calculation

If auto-computing `tableMinWidth` from column widths: wrap in `useMemo` keyed on
`columns`.

### Observer pre-requisite

The stable observer fix in `useInfiniteScroll` (Phase 0) eliminates observer
churn that fires on every page load. This is a P0 performance and correctness
fix.

---

## File Map

```
New files:
  shared/ui/table/types.ts                        ← TableColumn<T>, SortOrder (consolidated)
  shared/ui/table/DataTable.tsx                   ← 'use client', generic table component
  shared/hooks/use-table-sort.ts                  ← useTableSort<Field> hook

Modified files:
  shared/ui/table/SortableHeader.tsx              ← import SortOrder from ./types
  shared/ui/table/index.ts                        ← add DataTable, TableColumn exports
  shared/hooks/index.ts                           ← add useTableSort export
  shared/hooks/use-infinite-scroll.ts             ← stable observer fix + catch fix
  features/issues/model/types.ts                  ← remove duplicate SortOrder definition

Migrated consumers:
  features/agents/ui/agent-profiles-list.tsx      ← Phase 2
  features/agents/ui/agent-task-runs-list.tsx     ← Phase 2
  features/agents/ui/agent-tasks-list.tsx         ← Phase 3

Not migrated (out of scope):
  features/decisions/ui/decisions-table.tsx       ← different visual style, no duplication gain
  features/decisions/ui/key-points-table.tsx      ← same
  features/issues/ui/archived-section.tsx         ← deliberate load-more pattern, permanently excluded
  features/issues/ui/issues-page.tsx              ← evaluate separately after Phase 3
```

---

## Design Decisions & Trade-offs

### `header: ReactNode` eliminates sort/filter props from DataTable

Moving sort and filter UI into the `header` slot keeps `DataTable` a pure layout
component with no knowledge of sort state, filter state, or backend
capabilities. The feature layer owns all state and embeds pre-wired components.
This is the cleanest FSD separation.

Trade-off: consumers building sortable columns need to close over
`sortField`/`sortOrder`/`handleSort` when constructing column definitions. For
`IssuesPage` this means columns cannot be module-level constants. React Compiler
handles this correctly.

### No `FilterableHeader` in shared/

Column-level filter UI is feature-owned. The `header: ReactNode` slot is the
injection point. If a compact filter trigger for `<th>` becomes common across
multiple features, extract a minimal `ColumnFilterButton` primitive to
`shared/ui/table/` at that time (YAGNI until then).

### `renderMobileCard` stays in scope (for 3 agent tables)

Three of the 4 migration targets have mobile cards. The render-prop callback is
the idiomatic FSD pattern (same as `GenericList.renderItem`). The feature owns
the card markup; `DataTable` provides the responsive wrapper. The mobile cards
are feature-specific and divergent — no shared `MobileCard` sub-component is
worth building.

### IssuesPage is a conditional phase

IssuesPage is the most complex consumer (inline mutations, `table-fixed`,
`filtersVersion` cache busting). Migrating it to `DataTable` is lower priority
than the agent tables and requires a separate evaluation after Phase 3 patterns
are validated. It may remain as raw HTML if the inline-editing patterns cannot
be cleanly expressed through `renderCell`.

### Accessible row navigation — stretchy-link in renderCell

The `getRowHref` prop was removed because the stretchy-link pattern (valid HTML,
keyboard-safe) must be implemented inside `renderCell` of the primary column.
Each feature implements this pattern directly. `DataTable` documents it as the
recommended approach in JSDoc.

---

## References

### Internal References

- `shared/ui/table/SortableHeader.tsx` — existing sort header primitive
- `shared/hooks/use-infinite-scroll.ts` — unified hook, needs observer fix
- `shared/ui/layout/infinite-scroll-status.tsx` — end-of-list message
- `shared/ui/layout/generic-list.tsx` — `GenericList<T>` with `keyExtractor`
  convention
- `features/issues/ui/issues-page.tsx` — most complete table example with sort +
  inline editing
- `features/agents/ui/agent-tasks-list.tsx` — infinite scroll + mobile cards
  reference
- `shared/ui/input/InputDropdown.tsx` — reuse in column `header` filter slots
  (features own this)

### Existing Plan References

- `docs/plans/2026-03-30-feat-issues-table-sorting-and-assignee-me-plan.md` —
  implemented issues sort (merged)
- `docs/plans/2026-05-07-refactor-unified-infinite-scroll-hook-plan.md` —
  unified useInfiniteScroll (merged)

### External References (from research)

- [TanStack Table React Compiler conflict #5567](https://github.com/TanStack/table/issues/5567)
  — hard blocker for TanStack adoption
- [React v19 Release Notes](https://react.dev/blog/2024/12/05/react-19) —
  `forwardRef` deprecated, `ref` as prop, `RefObject<T>` type change
- [React Compiler v1.0](https://react.dev/blog/2025/10/07/react-compiler-1) — do
  not wrap in `React.memo`, do not manually `useMemo` when compiler is enabled
- [Adrian Roselli — Block Links, Cards, Clickable Rows](https://adrianroselli.com/2020/02/block-links-cards-clickable-regions-etc.html)
  — stretchy-link pattern
- [W3C WAI APG — Sortable Table Example](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/)
  — `aria-sort` specification
- [MDN — ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)
  — loading state announcements
- [Deque — Infinite Scrolling & Role=Feed](https://www.deque.com/blog/infinite-scrolling-rolefeed-accessibility-issues/)
  — why NOT to use `role="feed"` for data tables
