---
title: "feat: Issues table column sorting and Assignee 'Me' filter"
type: feat
status: completed
date: 2026-03-30
---

# feat: Issues Table Column Sorting and Assignee "Me" Filter

## Overview

Two enhancements to the `/dashboard/issues` page:

1. **Column sorting** — clickable column headers that sort the issues list
   server-side
2. **Assignee "Me" shortcut** — a quick-select option in the Assignee filter
   that pre-selects the currently authenticated user

---

## Current State

### Frontend (`features/issues/`)

- Page: `app/dashboard/issues/page.tsx`
- Main UI: `features/issues/ui/issues-page.tsx` — Client Component with infinite
  scroll
- API layer: `features/issues/api/issues.ts`
- Types: `features/issues/model/types.ts`
- Table columns: Issue, Type, Status, Scope, Assignee, Updated (plain `<th>`
  elements, no sort)
- Filters: organization, team, status, type, assignee (server-side), priority
  (client-side only)

### Backend (`IssueController@index`)

- File: `app/Http/Controllers/API/v1/IssueController.php:23`
- Ordering: **hardcoded** `->latest('id')` — no user-configurable sort
- Accepted query params: `status`, `type`, `assignee`, `organization_id`,
  `team_id`, `offset`, `limit`
- **No `sort` or `order` params accepted** — must be added to both
  `IssueRequest.php` and `IssueController.php`

### Current user

- `GET /users/me` returns raw User model: `{ id, name, email, ... }`
- `GET /persons` always includes the current user (PersonController includes
  `$builder->whereKey($user->id)`)
- `PersonResource` extends `UserResource` → returns `{ id, name, email }`
- The persons list `id` field = `users.id` = `assignee_id` on Issue — same
  namespace ✅
- **No `user_id` cookie** — only `token` and `organization_id` are stored in
  cookies

---

## Feature 1: Column Sorting

### Backend Changes Required

**`app/Http/Requests/API/v1/IssueRequest.php`** — add sort validation to
`issues.index`:

```php
// In rules() → 'issues.index' case, add:
'sort'  => ['nullable', Rule::in(['id', 'name', 'status', 'type', 'updated_at', 'created_at'])],
'order' => ['nullable', Rule::in(['asc', 'desc'])],

// In prepareForValidation() → issues.index block, add:
'sort'  => $this->query('sort'),
'order' => $this->query('order'),

// In getIndexFilters(), add:
'sort'  => $this->input('sort', 'id'),
'order' => $this->input('order', 'desc'),
```

**`app/Http/Controllers/API/v1/IssueController.php`** — replace hardcoded
`latest('id')`:

```php
// Replace: ->latest('id')
// With:
$sort  = $filters['sort'] ?? 'id';
$order = $filters['order'] ?? 'desc';
$query->orderBy($sort, $order);
```

### Sortable Columns

| Column   | Sort param   | Notes                          |
| -------- | ------------ | ------------------------------ |
| Issue    | `name`       | Alphabetical by issue name     |
| Type     | `type`       | task / bug                     |
| Status   | `status`     | Alphabetical (open → done)     |
| Scope    | —            | Not sortable (composite field) |
| Assignee | —            | Not sortable (requires JOIN)   |
| Updated  | `updated_at` | Default sort ↓                 |

> **Note:** Assignee sort requires a JOIN on users table — out of scope for this
> feature. Scope is a composite (org + team) — not sortable either.

### Frontend Changes

**`features/issues/model/types.ts`** — add sort types:

```typescript
// features/issues/model/types.ts
export type IssueSortField =
  | 'id'
  | 'name'
  | 'type'
  | 'status'
  | 'updated_at'
  | 'created_at';
export type SortOrder = 'asc' | 'desc';

// Extend IssueFilters:
export interface IssueFilters {
  // ... existing fields ...
  sort?: IssueSortField;
  order?: SortOrder;
}
```

**`features/issues/api/issues.ts`** — add sort/order to `buildIssuesQuery()`:

```typescript
// In buildIssuesQuery():
if (filters.sort) params.set('sort', filters.sort);
if (filters.order) params.set('order', filters.order);
```

**`features/issues/ui/issues-page.tsx`** — add sort state and sortable column
headers:

```typescript
// Add state (lines ~163–177 area):
const [sortField, setSortField] = useState<IssueSortField>('updated_at');
const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

// handleSort function:
const handleSort = (field: IssueSortField) => {
  const newOrder = sortField === field && sortOrder === 'desc' ? 'asc' : 'desc';
  setSortField(field);
  setSortOrder(newOrder);
  applyFilter({ sort: field, order: newOrder });
  updateUrl({ sort: field, order: newOrder });
};
```

**Column header component** (inline or extracted to
`shared/ui/table/SortableHeader.tsx`):

```tsx
// shared/ui/table/SortableHeader.tsx
interface SortableHeaderProps {
  label: string;
  field: IssueSortField;
  currentSort: IssueSortField;
  currentOrder: SortOrder;
  onSort: (field: IssueSortField) => void;
}

// Shows ↑ / ↓ icon when active, neutral icon otherwise
// Uses ChevronUp / ChevronDown from lucide-react
```

**Updated `<thead>` in issues-page.tsx:**

```tsx
<th className='px-4 py-3 cursor-pointer select-none'>
  <SortableHeader field='name' label='Issue' currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
</th>
<th className='px-4 py-3 cursor-pointer select-none'>
  <SortableHeader field='type' label='Type' ... />
</th>
<th className='px-4 py-3 cursor-pointer select-none'>
  <SortableHeader field='status' label='Status' ... />
</th>
<th className='px-4 py-3'>Scope</th>  {/* not sortable */}
<th className='px-4 py-3'>Assignee</th>  {/* not sortable */}
<th className='px-4 py-3 cursor-pointer select-none'>
  <SortableHeader field='updated_at' label='Updated' ... />
</th>
```

**URL sync** — add `sort` and `order` to search params (same pattern as existing
filters in `applyFilter` / `updateUrl`).

**Page server component** (`app/dashboard/issues/page.tsx`) — read sort/order
from searchParams and pass to initial `getIssues()` call.

---

## Feature 2: Assignee "Me" Quick-Select

### Approach

The current user's `id` needs to be available server-side when the page renders,
then passed as a prop to `IssuesPage`.

**Option A (recommended): Fetch current user in page.tsx**

```typescript
// app/dashboard/issues/page.tsx
import { getCurrentUserId } from '@/shared/lib/getCurrentUserId';
// or: call GET /users/me server-side

const [issues, organizationsResponse, persons, currentUserId] = await Promise.all([
  getIssues({ ... }),
  getOrganizations(),
  getPersons(),
  getCurrentUserId(),   // new helper
]);

// Pass to IssuesPage:
<IssuesPage
  ...
  currentUserId={currentUserId}
/>
```

**`shared/lib/getCurrentUserId.ts`** (new file):

```typescript
'use server';
import { cookies } from 'next/headers';
import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';

export async function getCurrentUserId(): Promise<number | null> {
  const authHeaders = await getAuthHeaders().catch(() => null);
  if (!authHeaders) return null;

  const res = await fetch(`${API_URL}/users/me`, {
    headers: authHeaders,
    cache: 'no-store',
  });
  if (!res.ok) return null;

  const json = await res.json();
  return json.id ?? null;
}
```

> **Note:** `GET /users/me` returns raw `$request->user()` (Eloquent User model
> JSON), not wrapped in the `ApiEnvelope`. The `id` is at the top level of the
> response.

**Option B (alternative): Find current user in persons list**

Since `PersonController` always includes the current user in the persons list,
and `GET /users/me` returns the user's `id`, we can avoid the extra API call by
reusing the persons list — but we'd need `GET /users/me` anyway to know which
`id` to highlight. Option A is cleaner.

### Frontend Changes

**`features/issues/ui/issues-page.tsx`** — add `currentUserId` prop and "Me"
option:

```typescript
// Add to IssuesPage props:
currentUserId?: number | null;

// Add "Me" option to personOptions (above the regular list):
const personOptions = useMemo(() => {
  const meOption = currentUserId
    ? [{ value: String(currentUserId), label: 'Me' }]
    : [];
  return [
    ...meOption,
    ...persons.map((p) => ({ value: String(p.id), label: p.name })),
  ];
}, [persons, currentUserId]);
```

The "Me" option uses the current user's `id` as the value — same format as other
assignee options. No special backend handling needed.

**Visual:** The "Me" entry appears at the top of the Assignee dropdown with
label "Me". When selected, it filters by the current user's ID just like any
other person filter.

---

## Acceptance Criteria

### Sorting

- [ ] Clicking a sortable column header sorts the issues list by that field
- [ ] Clicking the same header again toggles sort direction (desc → asc → desc)
- [ ] Active sort column shows a directional chevron icon; inactive columns show
      a neutral indicator
- [ ] Sort state is persisted in the URL (`?sort=updated_at&order=desc`) and
      survives page refresh
- [ ] Initial sort defaults to `updated_at desc` (most recently updated first)
- [ ] Scope and Assignee columns are non-sortable (no clickable behavior, no
      icon)
- [ ] Infinite scroll works correctly when sort changes (resets to first page)
- [ ] Backend: `sort` and `order` query params validated and applied in
      `IssueController@index`

### Assignee "Me"

- [ ] Assignee dropdown shows "Me" as the first option (above alphabetical list)
- [ ] Selecting "Me" filters issues to those assigned to the current user
- [ ] "Me" selection persists in URL as the current user's numeric ID (e.g.
      `?assignee=42`)
- [ ] Clearing the Assignee filter removes the "Me" selection
- [ ] Works correctly for users who appear in the persons list (always true per
      PersonController logic)

---

## Dependencies & Risks

| Risk                                                                                                                                                  | Mitigation                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Backend `sort` param adds SQL `ORDER BY` — ensure `updated_at`, `created_at`, `name`, `type`, `status` are indexed or acceptable for the dataset size | Existing `id` ordering already unindexed beyond PK; these fields are low-cardinality |
| `GET /users/me` returns raw Eloquent model (not wrapped in ApiEnvelope) — be careful parsing                                                          | Confirmed: `return $request->user()` → top-level JSON object, `id` at root           |
| Infinite scroll reset on sort change must clear current items                                                                                         | Existing `resetKey` mechanism handles this — increment resetKey when sort changes    |
| Priority filter is client-side — sorting interacts with it. Client-side priority filter post-processes the sorted server results, which is correct    | No change needed                                                                     |

---

## Files to Modify

### Backend

- `app/Http/Requests/API/v1/IssueRequest.php` — add `sort`, `order` validation +
  extraction
- `app/Http/Controllers/API/v1/IssueController.php` — replace `latest('id')`
  with dynamic sort

### Frontend

- `features/issues/model/types.ts` — add `IssueSortField`, `SortOrder`, extend
  `IssueFilters`
- `features/issues/api/issues.ts` — add sort/order to `buildIssuesQuery()`
- `features/issues/ui/issues-page.tsx` — sort state, handleSort, "Me" option,
  updated column headers
- `app/dashboard/issues/page.tsx` — read sort/order from searchParams, fetch
  currentUserId, pass props
- `shared/lib/getCurrentUserId.ts` _(new)_ — server-side helper to fetch current
  user ID
- `shared/ui/table/SortableHeader.tsx` _(new, optional)_ — reusable sortable
  column header component

---

## References

### Internal

- Issues page: `app/dashboard/issues/page.tsx`
- Issues UI: `features/issues/ui/issues-page.tsx:429–438` (table headers)
- API layer: `features/issues/api/issues.ts:85–102` (buildIssuesQuery)
- Issue types: `features/issues/model/types.ts:68–76` (IssueFilters)
- Filter state + URL sync: `features/issues/ui/issues-page.tsx:212–273`
- Persons fetch: `features/issues/api/issues.ts:382–406`
- Backend controller: `app/Http/Controllers/API/v1/IssueController.php:23–57`
- Backend request: `app/Http/Requests/API/v1/IssueRequest.php:19–76`
- Auth cookies: `features/auth/api/auth.ts:106–168` (only `token` +
  `organization_id` stored)
- Current user endpoint: `routes/api.php:86` — `GET /users/me` returns raw user,
  no envelope
