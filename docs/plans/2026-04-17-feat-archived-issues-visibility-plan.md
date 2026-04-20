---
title: 'feat: Archived Issues Visibility (done 14+ days)'
type: feat
status: completed
date: 2026-04-17
---

# feat: Archived Issues Visibility (done for 14+ days)

## Overview

Issues/tasks that have been in `done` status for 14+ days are considered
"archived." They are hidden by default from both the List and Kanban views to
reduce noise. A **"Show archived (N)"** button at the bottom of each view lets
users reveal them on demand without adding a new navigation tab.

`close_date` already exists in the backend (`Issue` model, `IssueResource`) and
is set automatically when status transitions to `done`. No new DB column is
needed. The implementation requires a small backend filter param addition and
targeted frontend changes.

---

## Design Decisions Made

| Decision                              | Choice                                   | Rationale                                                        |
| ------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| Filter change while archived expanded | Auto-collapse archived section           | Simplest; avoids stale data from old filter context              |
| Counter (N) fetch                     | Separate count-only request at page load | User sees count before clicking; `+1` API call is acceptable     |
| Kanban DnD on archived cards          | Yes, draggable                           | Drag resets `close_date` on backend → card un-archives naturally |
| URL state                             | `?show_archived=1` synced to URL         | Consistent with existing full-URL filter-sync pattern            |

---

## Background

### Why archived?

Issues stay in `done` indefinitely. After two+ weeks they become historical
noise on both the list and kanban board. Hiding them by default keeps the UI
focused on active work, while the rare need to find an old closed issue is
satisfied by the "show archived" toggle.

### Why not a new tab?

The feature is rarely needed. Adding a tab would give it equal visual weight to
"List" and "Kanban" — unwarranted for an occasional lookup. A contextual
collapse panel is the right affordance.

### Existing infrastructure

- `close_date` (`datetime`) column: set by `Issue::saving()` hook when
  `status → done`, reset when status leaves `done`. Already in
  `IssueResource::toArray()` line 46.
- `exclude_archived` / `archived` are new query params that map to
  `WHERE status='done' AND close_date <= NOW()-14 days`.
- No migration needed.

---

## Proposed Solution

### Core Semantic

```
isArchived(issue) = issue.status === 'done'
                 && issue.close_date !== null
                 && differenceInDays(now, parseISO(issue.close_date)) >= 14
```

The backend computes this with a SQL condition. The frontend computes it locally
only for Kanban optimistic updates.

### Default Behavior (no change to existing experience)

Both list and kanban calls implicitly exclude archived items unless
`show_archived=1` is in the URL. This is controlled by passing
`exclude_archived=true` in API calls by default.

### List View — "Show archived" section

```
┌─────────────────────────────────────────────────┐
│  Issue A                           open          │
│  Issue B                           in_progress   │
│  Issue C                           done          │  ← non-archived done
│  ...                                             │
│                                                  │
│  ──────────────── Show archived (12) ────────── │  ← button at bottom
│                                                  │
│  [after click, section expands:]                 │
│                                                  │
│  ┄┄┄┄┄┄ Archived ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│  Issue D                           done (32d)    │
│  Issue E                           done (22d)    │
│  ...                                             │
│  [ Load more archived ]                          │  ← button, NOT infinite scroll
│                                                  │
│  ──────────────── Hide archived ──────────────── │
└─────────────────────────────────────────────────┘
```

Key details:

- The "Show archived (N)" count is fetched at page load as a separate
  `GET /issues?archived=true&limit=1` call (reads `Items-Count` header).
- Expanding loads archived items with the same `PAGE_SIZE=20` limit, using a
  "Load more" button (not a second infinite scroll sentinel) to avoid collision
  with the existing `sentinelRef` div.
- Changing any filter auto-collapses the archived section.
- State is synced to URL as `show_archived=1`.

### Kanban View — archived sub-section inside Done column

```
┌─────────────────┐
│ ✓ Done          │
│─────────────────│
│  Card C         │  ← non-archived done card
│  Card D         │  ← non-archived done card
│─────────────────│
│ Show archived(5)│  ← small link/button in Done column header area
│─────────────────│
│  [after click]  │
│ ┄ Archived ┄┄┄  │
│  Card X  (done) │  ← archived, draggable
│  Card Y  (done) │  ← archived, draggable
└─────────────────┘
```

Key details:

- Archived cards are in a separate state variable (`archivedDoneCards`) — NOT
  mixed into `columns.done`.
- Archived cards are draggable. Successful drag to another column triggers
  `moveKanbanCard` → backend resets `close_date` → card un-archives. The
  archived card is removed from `archivedDoneCards` on optimistic update.
- The archived sub-section fetch is a separate call:
  `fetchArchivedKanbanCards(filters)` returning `KanbanCard[]`.
- `show_archived=1` in URL also controls Kanban expansion.

---

## Technical Approach

### Backend Changes

**File: `app/Http/Requests/API/v1/IssueRequest.php`**

Add `archived` to the `getIndexFilters` rules (after line 22):

```php
'archived' => ['nullable', 'boolean'],
'exclude_archived' => ['nullable', 'boolean'],
```

Add to `getIndexFilters()` return array:

```php
'archived'         => $this->boolean('archived', false),
'exclude_archived' => $this->boolean('exclude_archived', false),
```

**File: `app/Http/Controllers/API/v1/IssueController.php`**

In `index()`, after the existing status filter block (~line 35), add:

```php
// Archived = done AND close_date is 14+ days ago
if ($filters['archived']) {
    $query->where('status', 'done')
          ->whereNotNull('close_date')
          ->where('close_date', '<=', now()->subDays(14));
} elseif ($filters['exclude_archived']) {
    $query->where(function ($q) {
        $q->where('status', '!=', 'done')
          ->orWhereNull('close_date')
          ->orWhere('close_date', '>', now()->subDays(14));
    });
}
```

> ⚠️ When `archived=true` is passed, the existing `status` filter is overridden
> (the two are mutually exclusive). Document this in the FormRequest or add a
> validation rule that forbids passing both.

**No migration needed** — `close_date` already exists.

### Frontend Type Changes

**File: `features/issues/model/types.ts`**

```ts
// Add to Issue interface:
close_date: string | null;

// Expand IssueStatus union (fixes pre-existing mismatch):
type IssueStatus = 'open' | 'in_progress' | 'paused' | 'review' | 'reopen' | 'done';

// Add to IssueFilters:
archived?: boolean;
exclude_archived?: boolean;
show_archived?: boolean; // UI state: controls section expansion

// Add to SharedFilters:
show_archived?: boolean;
```

**File: `features/kanban/model/types.ts`**

```ts
// Add to KanbanCard:
close_date: string | null;

// Add to KanbanFilters:
archived?: boolean;
exclude_archived?: boolean;
```

### Backend API Layer Changes

**File: `features/issues/api/issues.ts`**

`buildIssuesQuery`:

- Add `exclude_archived: true` to all default calls (so archived is hidden by
  default).
- When `filters.archived === true`, pass `archived=true` instead and omit
  `exclude_archived`.

`getArchivedCount(filters: IssueFilters): Promise<number>`:

- New server action, calls `GET /issues?archived=true&limit=1`, reads
  `Items-Count` header, returns the count.

`loadArchivedChunk(filters: IssueFilters, offset: number): Promise<{ items: Issue[], hasMore: boolean }>`:

- New server action, calls `GET /issues?archived=true&limit=20&offset=N`.

**File: `features/kanban/api/kanban.ts`**

`buildKanbanQuery`:

- Add `exclude_archived: true` to the default query.

`fetchArchivedKanbanCards(filters: KanbanFilters): Promise<ActionResult<KanbanCard[]>>`:

- New server action, calls
  `GET /issues?archived=true&limit=100&sort=close_date&order=desc`, returns flat
  `KanbanCard[]`.

### Filter State Changes

**File: `features/issues/ui/issues-layout-client.tsx`**

- Add `show_archived: boolean` to `SharedFilters` state, initialized from
  `searchParams.show_archived`.
- Sync `show_archived` to URL the same way other filter params are synced.
- When `filtersVersion` changes (any filter changes), set
  `show_archived = false` (auto-collapse).
- Pass `show_archived` down via `FiltersContext`.

**File: `features/issues/ui/shared-filters-bar.tsx`**

No changes — the archived toggle is NOT a global filter control. It lives inside
each view.

### List View Component Changes

**File: `features/issues/ui/issues-list.tsx`** (or equivalent client component)

New state:

```ts
const { show_archived, setShowArchived } = useFiltersContext();
const [archivedItems, setArchivedItems] = useState<Issue[]>([]);
const [archivedOffset, setArchivedOffset] = useState(0);
const [archivedHasMore, setArchivedHasMore] = useState(false);
const [archivedCount, setArchivedCount] = useState<number | null>(null);
const [archivedLoading, setArchivedLoading] = useState(false);
```

On mount / filter change: fetch `getArchivedCount(filters)`, set
`archivedCount`. On `show_archived` URL param change: if `true`, load first
archived page. On filter change: reset `archivedItems`, `archivedOffset`,
`archivedHasMore`.

New UI section (rendered after the existing list and `sentinelRef`):

```tsx
{
  /* Archived toggle */
}
{
  archivedCount !== null && archivedCount > 0 && (
    <ArchivedSectionToggle
      count={archivedCount}
      expanded={show_archived}
      onToggle={() => setShowArchived(!show_archived)}
    />
  );
}

{
  /* Archived items */
}
{
  show_archived && (
    <ArchivedSection
      items={archivedItems}
      loading={archivedLoading}
      hasMore={archivedHasMore}
      onLoadMore={handleLoadMoreArchived}
    />
  );
}
```

### Kanban View Component Changes

**File: `features/kanban/ui/kanban-board.tsx`**

New state:

```ts
const [archivedDoneCards, setArchivedDoneCards] = useState<KanbanCard[]>([]);
const [archivedDoneLoading, setArchivedDoneLoading] = useState(false);
const { show_archived, setShowArchived } = useFiltersContext();
```

Changes to `applyOptimisticMove`:

- When a card is moved FROM archived (i.e., found in `archivedDoneCards`),
  remove it from `archivedDoneCards` in optimistic state.
- When a card is moved TO done from another column, it goes into `columns.done`
  (non-archived) as today's `close_date` is < 14 days.

Done column rendering:

```tsx
<KanbanColumn status='done' cards={columns.done}>
  {/* Show archived toggle inside Done column footer */}
  <ArchivedDoneToggle
    count={archivedDoneCount}
    expanded={show_archived}
    onToggle={handleToggleArchivedDone}
    loading={archivedDoneLoading}
  />
  {show_archived && <ArchivedDoneSection cards={archivedDoneCards} />}
</KanbanColumn>
```

---

## New Components

| Component               | Location                                         | Purpose                                                          |
| ----------------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| `ArchivedSectionToggle` | `features/issues/ui/archived-section-toggle.tsx` | "Show archived (N)" / "Hide archived" button with count badge    |
| `ArchivedSection`       | `features/issues/ui/archived-section.tsx`        | Archived items section with header, list, and "Load more" button |
| `ArchivedDoneToggle`    | `features/kanban/ui/archived-done-toggle.tsx`    | Compact toggle for inside the Done column                        |
| `ArchivedDoneSection`   | `features/kanban/ui/archived-done-section.tsx`   | Sub-section of archived cards inside Done column                 |

---

## Acceptance Criteria

### Functional

- [ ] `GET /issues` without `archived` or `exclude_archived` returns all items
      (unchanged behavior — backward compatible with other API consumers
      including MCP tools)
- [ ] `GET /issues?exclude_archived=true` excludes `done` items where
      `close_date <= NOW()-14days`
- [ ] `GET /issues?archived=true` returns only `done` items where
      `close_date <= NOW()-14days`
- [ ] List view: archived items are hidden by default
- [ ] List view: "Show archived (N)" button appears when `archivedCount > 0`;
      button is hidden when count is 0
- [ ] List view: clicking the button expands the archived section and sets
      `show_archived=1` in URL
- [ ] List view: "Load more archived" loads the next page of archived items
      (offset-based)
- [ ] List view: changing any filter collapses the archived section and removes
      `show_archived` from URL
- [ ] Kanban view: Done column excludes archived cards by default
- [ ] Kanban view: "Show archived (N)" link appears in Done column footer
- [ ] Kanban view: clicking it fetches and renders archived cards as a
      sub-section inside Done column
- [ ] Kanban view: dragging an archived card to another column triggers status
      change; card disappears from archived sub-section (optimistic update);
      `close_date` is reset by backend
- [ ] `show_archived=1` in URL: page load with this param pre-expands the
      archived section on both list and kanban
- [ ] Issue detail page: shows "Archived" badge when
      `status === done && close_date <= NOW()-14d`
- [ ] `close_date` added to `Issue` and `KanbanCard` TypeScript interfaces
- [ ] `IssueStatus` union extended with `'review' | 'reopen'`

### Non-Functional

- [ ] No extra API calls when user never interacts with archived toggle
- [ ] Archived count fetch is non-blocking (page renders before count resolves,
      button shows loading state)
- [ ] Archived section "Load more" does not conflict with the normal list's
      `IntersectionObserver` sentinel
- [ ] All text labels in English (no Russian in JSX)

### Quality Gates

- [ ] `npm run lint` passes with no new warnings
- [ ] `backend-contract-validator` agent confirms no type mismatches for `Issue`
      and `KanbanCard`
- [ ] `fsd-boundary-guard` passes (no cross-feature imports, no missing
      index.ts)
- [ ] Unit tests for `getArchivedCount`, `loadArchivedChunk`,
      `fetchArchivedKanbanCards` server actions
- [ ] Unit tests for `ArchivedSectionToggle` and `ArchivedSection` components

---

## Edge Cases Addressed

| Edge case                                         | Handling                                                                                                                                                       |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status filter `done` active while archived hidden | `exclude_archived=true` still applies; archived are hidden even with `status=done` filter                                                                      |
| Card moved from archived to done again            | `moveKanbanCard` resets `close_date`; card reappears in `columns.done` (non-archived); archived sub-section count becomes stale — no auto-refresh (acceptable) |
| All items are archived (empty normal list)        | Normal empty state renders; "Show archived (N)" button still appears; message: "No active issues"                                                              |
| Zero archived items                               | Button is hidden entirely                                                                                                                                      |
| User on issue detail page for an archived issue   | Detail page renders normally + shows "Archived" status badge                                                                                                   |
| Large archived set (150+ items)                   | "Load more" button pattern for archived items avoids loading all at once                                                                                       |
| Filters change while archived expanded            | Section auto-collapses; `show_archived` removed from URL                                                                                                       |
| Backward compatibility (other API consumers)      | Default `GET /issues` behavior unchanged — `exclude_archived` must be explicitly passed                                                                        |

---

## Implementation Phases

### Phase 1 — Backend (no migration, small change)

1. `IssueRequest.php`: add `archived` and `exclude_archived` boolean params
2. `IssueController@index`: add filter branch for `archived` /
   `exclude_archived`
3. Manual test: `curl GET /api/v1/issues?archived=true` returns only done+14d
   items

### Phase 2 — Frontend types & API layer

1. Add `close_date` to `Issue` and `KanbanCard` interfaces
2. Fix `IssueStatus` union (`+ 'review' | 'reopen'`)
3. Update `buildIssuesQuery` to pass `exclude_archived=true` by default
4. Add `getArchivedCount`, `loadArchivedChunk` server actions to
   `features/issues/api/issues.ts`
5. Update `buildKanbanQuery` to pass `exclude_archived=true` by default
6. Add `fetchArchivedKanbanCards` server action to
   `features/kanban/api/kanban.ts`
7. Run `backend-contract-validator` agent

### Phase 3 — Filter state & URL sync

1. Add `show_archived` to `SharedFilters` in `features/issues/model/types.ts`
2. Update `IssuesLayoutClient` to read/write `show_archived` from URL params
3. Auto-collapse on `filtersVersion` change

### Phase 4 — List view UI

1. Fetch `archivedCount` on mount (deferred, non-blocking)
2. Create `ArchivedSectionToggle` component
3. Create `ArchivedSection` component with "Load more" button
4. Wire into `IssuesPage` or `IssuesListTab`
5. Move `sentinelRef` to after the archived section

### Phase 5 — Kanban view UI

1. Add `archivedDoneCards` state to `KanbanBoard`
2. Fetch archived done cards when `show_archived` is true
3. Create `ArchivedDoneToggle` and `ArchivedDoneSection` components
4. Update `applyOptimisticMove` to handle removal from `archivedDoneCards`
5. Wire into Done column rendering

### Phase 6 — Issue detail page badge

1. Read `close_date` from issue data
2. Show `<Badge>Archived</Badge>` when `isArchived(issue)` is true

### Phase 7 — Tests & review

1. Unit tests for new server actions
2. Unit tests for new UI components
3. `mr-reviewer` agent pre-push check
4. `fsd-boundary-guard` agent check

---

## ERD — No Schema Changes

```
issues table (existing, no migration needed)
┌─────────────────────┐
│ id                  │
│ status              │  ← 'done' is the anchor status
│ close_date (datetime│  ← set when status→done, reset otherwise ✓
│ organization_id     │
│ team_id             │
│ assignee_id         │
│ type                │
│ name                │
│ ...                 │
└─────────────────────┘

Archived query: WHERE status='done' AND close_date <= NOW()-14days
```

---

## References

### Internal

- `features/issues/model/types.ts` — `Issue`, `IssueStatus`, `IssueFilters`
- `features/issues/api/issues.ts:115` — `getIssues`, `buildIssuesQuery`
- `features/issues/api/issues.ts:157` — `loadIssuesChunk`
- `features/issues/ui/issues-layout-client.tsx` — filter state owner,
  `FiltersContext`
- `features/issues/ui/shared-filters-bar.tsx` — shared filter controls
- `features/kanban/model/types.ts` — `KanbanCard`, `KanbanFilters`
- `features/kanban/api/kanban.ts:52` — `getKanbanIssues`, `buildKanbanQuery`
- `features/kanban/api/kanban.ts:156` — `fetchKanbanIssues`
- `features/kanban/ui/kanban-board.tsx:84` — column grouping, optimistic move
- Backend: `app/Http/Controllers/API/v1/IssueController.php:23` — `index()`
  filter logic
- Backend: `app/Http/Requests/API/v1/IssueRequest.php:15` — `VALID_STATUSES`,
  filter rules
- Backend: `app/Http/Resources/API/v1/IssueResource.php:46` — `close_date`
  already exposed
- Backend: `app/Models/Issue.php:71` — `saving()` hook that sets/resets
  `close_date`

### Agents to Run

| When          | Agent                        |
| ------------- | ---------------------------- |
| After Phase 2 | `backend-contract-validator` |
| After Phase 5 | `fsd-boundary-guard`         |
| After Phase 7 | `mr-reviewer`                |
| After Phase 7 | `design-guardian`            |
