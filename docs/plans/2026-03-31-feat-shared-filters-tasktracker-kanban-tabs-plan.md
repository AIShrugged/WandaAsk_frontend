---
title: 'feat: Shared filters across Tasktracker and Kanban tabs'
type: feat
status: completed
date: 2026-03-31
---

# feat: Shared filters across Tasktracker and Kanban tabs

## Overview

The `dashboard/issues` page now hosts two tabs — **Tasktracker** (issues list)
and **Kanban** (board view) — rendered by `TasktrackerTabs`. Currently each tab
has its own independent filter bar. The goal is to **lift common filters above
the tab bar** so they are shared across both views, and keep only tab-specific
filters inside each tab.

---

## Problem Statement

### Current architecture

```
IssuesListPage (server, page.tsx)
  └── TasktrackerTabs (client, tasktracker-tabs.tsx)
        ├── issuesContent → IssuesPage (client)   — owns: org, team, search, type, status, assignee, priority, sort
        └── kanbanContent → KanbanBoard (client)  — owns: org, team, search, type, assignee_id, priority
```

Both tabs render their own filter bar (org/team scope, search, type, assignee,
priority). Switching tabs resets visual filter state even though the URL params
are shared — users must re-apply filters after switching tabs.

### Parameter name mismatch

| Filter     | Tasktracker param | Kanban param  |
| ---------- | ----------------- | ------------- |
| Assignee   | `assignee`        | `assignee_id` |
| All others | same              | same          |

This mismatch must be resolved: one canonical URL param name for each filter.

---

## Proposed Solution

### Concept: Shared filter bar above the tab strip

```
IssuesListPage (server)
  └── TasktrackerTabs (client)         ← owns shared filter state
        ├── [Shared filter bar]        ← search, org, team, type, assignee, priority
        ├── [Tab strip]                ← Tasktracker | Kanban
        └── Tab panels
              ├── IssuesPage           ← receives filters as props, no own filter UI except sort
              └── KanbanBoard          ← receives filters as props, no own filter UI
```

Filters are held in `TasktrackerTabs` (or a new `SharedFiltersBar` component).
Each tab component **receives** filter values as props and does not own filter
UI except for tab-specific controls (sort order in Tasktracker).

---

## Technical Approach

### Step 1 — Unify URL param names

**Problem:** `assignee` (Tasktracker) vs `assignee_id` (Kanban).

**Decision:** Rename to `assignee_id` everywhere (already used in
`KanbanFilters` backend type). Update:

- `page.tsx` — reads `assignee_id` instead of `assignee`
- `IssuesPage` — remove `assignee` param, use `assignee_id`
- The `getIssues()` API call passes `assignee: Number(assignee_id)`

### Step 2 — Lift shared filters into `TasktrackerTabs`

**File:** `features/issues/ui/tasktracker-tabs.tsx`

The component currently accepts `issuesContent` and `kanbanContent` as rendered
ReactNode. This must change: `TasktrackerTabs` needs to know filter values to
render the shared bar and pass them down.

**New approach — render tabs internally:**

```ts
interface TasktrackerTabsProps {
  // Data props (from server)
  organizations: OrganizationProps[];
  persons: PersonOption[];
  initialIssues: Issue[];
  initialTotalCount: number;
  initialColumns: Record<IssueStatus, KanbanCard[]>;
  currentUserId: number | null;
  // Initial filter values (from URL, parsed in page.tsx)
  initialFilters: SharedFilters;
}
```

`TasktrackerTabs` becomes a heavier client component that:

1. Holds shared filter state (`organization_id`, `team_id`, `search`, `type`,
   `assignee_id`, `priority`)
2. Renders `SharedFiltersBar` above the tab strip
3. Passes filter values down to `IssuesPage` and `KanbanBoard`
4. Owns URL synchronization via `router.replace`

### Step 3 — Define `SharedFilters` type

**File:** `features/issues/model/types.ts` (or new
`features/issues/model/shared-filters.ts`)

```ts
export interface SharedFilters {
  organization_id: string;
  team_id: string;
  search: string;
  type: IssueType | '';
  assignee_id: string; // unified, replaces both 'assignee' and 'assignee_id'
  priority: IssuePriority | '';
}
```

### Step 4 — Extract `SharedFiltersBar` component

**File:** `features/issues/ui/shared-filters-bar.tsx`

A pure presentational component:

- `New issue` button
- Search input
- `TenantScopeFields` (org + team)
- Type, Assignee, Priority dropdowns

Props:

```ts
interface SharedFiltersBarProps {
  filters: SharedFilters;
  organizations: OrganizationProps[];
  persons: PersonOption[];
  onChange: (patch: Partial<SharedFilters>) => void;
  disabled?: boolean;
}
```

### Step 5 — Strip filter UI from `IssuesPage`

`IssuesPage` keeps only:

- The issues table + infinite scroll
- Sort controls (sort field + order — tab-specific)
- Inline status/assignee editing

It no longer owns `organizationId`, `teamId`, `search`, `type`, `assignee`,
`priority` state. These come in as props from `TasktrackerTabs`.

Updated `IssuesPageProps`:

```ts
interface IssuesPageProps {
  // Data
  initialIssues: Issue[];
  initialTotalCount: number;
  persons: PersonOption[];
  organizations: OrganizationProps[];
  // Shared filters (controlled from outside)
  filters: SharedFilters;
  filtersVersion: number; // increments on filter change, replaces resetKey
  // Tab-local
  initialSort: IssueSortField;
  initialOrder: SortOrder;
}
```

### Step 6 — Strip filter UI from `KanbanBoard`

`KanbanBoard` keeps only:

- The board columns + drag-drop
- Card preview panel

Filters come in as props, search filtering applied locally (client-side) as
before.

Updated `KanbanBoardProps`:

```ts
interface KanbanBoardProps {
  initialColumns: Record<IssueStatus, KanbanCard[]>;
  organizations: OrganizationProps[];
  persons: PersonOption[];
  filters: SharedFilters; // replaces initialFilters
  columnsVersion: number; // replaces searchParamsString dependency
}
```

### Step 7 — Simplify `page.tsx`

The server page no longer needs to render `issuesContent` / `kanbanContent` JSX.
It passes raw data to `TasktrackerTabs`:

```tsx
return (
  <Card className='h-full flex flex-col'>
    <PageHeader title='Tasktracker' />
    <div className='flex-1 overflow-hidden'>
      <TasktrackerTabs
        organizations={organizationsResponse.data ?? []}
        persons={persons}
        initialIssues={issues.data}
        initialTotalCount={issues.totalCount}
        initialColumns={groupedCards}
        currentUserId={currentUserId ?? null}
        initialFilters={initialFilters}
      />
    </div>
  </Card>
);
```

---

## Filter Overlap Analysis

| Filter       | Tasktracker | Kanban | Shared?                                                    |
| ------------ | ----------- | ------ | ---------------------------------------------------------- |
| organization | ✅          | ✅     | ✅ yes                                                     |
| team         | ✅          | ✅     | ✅ yes                                                     |
| search       | ✅          | ✅     | ✅ yes                                                     |
| type         | ✅          | ✅     | ✅ yes                                                     |
| assignee     | ✅          | ✅     | ✅ yes                                                     |
| priority     | ✅          | ✅     | ✅ yes                                                     |
| status       | ✅          | ❌     | ❌ Tasktracker-only (Kanban shows all statuses as columns) |
| sort / order | ✅          | ❌     | ❌ Tasktracker-only                                        |

**Status** remains inside `IssuesPage` as a tab-specific filter. It does not
affect Kanban.

---

## Tab re-render on filter change

When the user changes a shared filter in `TasktrackerTabs`:

1. Shared filter state updates in `TasktrackerTabs`
2. URL updates via `router.replace` (preserves browser history, no full reload)
3. Next.js server re-fetches `page.tsx` (SSR) with new params
4. New `initialIssues`, `initialColumns` flow into `TasktrackerTabs`
5. `IssuesPage` resets its infinite scroll via `filtersVersion` (replaces
   current `resetKey`)
6. `KanbanBoard` syncs columns via `columnsVersion` (replaces current
   `searchParamsString` dep)

**Important:** the current Kanban `updateUrl` points to `/dashboard/kanban?...`.
This must be updated to `/dashboard/issues?...` (the new unified page).

---

## Files to Change

| File                                        | Change                                                                                                                                        |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/dashboard/issues/page.tsx`             | Pass raw data to `TasktrackerTabs`; rename `assignee` → `assignee_id` in URL parsing; remove `kanbanContent`/`issuesContent` JSX construction |
| `features/issues/ui/tasktracker-tabs.tsx`   | Add shared filter state, `SharedFiltersBar`, URL sync; accept data props instead of ReactNode                                                 |
| `features/issues/ui/shared-filters-bar.tsx` | **New file** — extracted filter UI (search, org/team, type, assignee, priority, New Issue button)                                             |
| `features/issues/ui/issues-page.tsx`        | Remove own filter UI; accept `filters: SharedFilters` + `filtersVersion` props                                                                |
| `features/kanban/ui/kanban-board.tsx`       | Remove own filter UI; accept `filters: SharedFilters` + `columnsVersion` props; fix `updateUrl` path                                          |
| `features/issues/model/types.ts`            | Add `SharedFilters` interface; remove duplicate filter type fragments                                                                         |

**Files NOT to change:**

- `features/issues/api/issues.ts` — API shape unchanged
- `features/kanban/api/kanban.ts` — unchanged
- `shared/ui/input/tenant-scope-fields.tsx` — unchanged
- `features/menu/` — unchanged (sidebar already done)

---

## Acceptance Criteria

- [x] A single filter bar appears **above** the tab strip, visible on both tabs
- [x] Changing any shared filter (search, org/team, type, assignee, priority)
      while on Tasktracker tab → switching to Kanban tab shows the same filter
      applied
- [x] Changing a filter while on Kanban → switching to Tasktracker shows the
      same filter applied
- [x] `status` filter only appears inside the Tasktracker tab (not on Kanban)
- [x] Sort controls remain inside Tasktracker tab only
- [x] URL reflects all shared filters — page reload preserves all filter state
- [x] No separate filter bar visible inside either tab (filters removed from
      `IssuesPage` and `KanbanBoard`)
- [x] `New issue` button appears once in the shared bar (not duplicated in each
      tab)
- [x] `npm run lint` passes with no new errors
- [x] `npm run build` completes without TypeScript errors

---

## Migration Notes

- The `assignee` URL param (Tasktracker) is renamed to `assignee_id`. Any
  bookmarks using `?assignee=...` will silently fall back to default (current
  user). This is acceptable — the param is not documented or linked externally.
- The Kanban board previously used `/dashboard/kanban` as its URL; it now lives
  at `/dashboard/issues?tab=kanban`. No redirect needed because the previous
  plan already removed the separate Kanban page from the sidebar; the old URL
  simply 404s or can be left as a standalone page for deep links (out of scope).
