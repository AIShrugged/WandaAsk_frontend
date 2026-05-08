---
title: 'fix: Issue form assignee/author fields show empty list'
type: fix
status: completed
date: 2026-05-07
---

# fix: Issue form assignee/author fields show empty list

## Problem Statement

On `app/dashboard/issues/(create)/create/page.tsx`, the **Assignee** and
**Author** dropdowns in the issue creation form are empty. The `getPersons()`
server action is called at the page level and its result is passed as `persons`
into `IssueCreatePageClient` → `IssueForm`, but the list arrives empty.

## Root Cause Analysis

### 1. Wrong HTTP client (Rule 2 violation)

`getPersons()` in `features/issues/api/issues.ts:482` uses a raw `fetch` call
with manual `getAuthHeaders()` instead of the project-standard
`httpClientList<T>()`. This means:

- Auth, 401 redirect, and error logging are handled inconsistently
- The `Items-Count` header is never read (paginated endpoint)

### 2. Endpoint is paginated but code treats it as flat array

The backend route `GET /api/v1/persons` → `PersonController::index()` uses
`ApiResponse::list()`, which:

- Paginates results by `offset` / `limit` (default values from
  `PaginatedRequestTrait`)
- Sets `Items-Count` response header with total count
- Returns data as a resource collection (an array of objects in `json.data`)

The frontend type annotation `ApiResponse<PersonOption[]>` matches the shape,
**but** `httpClientList` is the correct client for this because it also reads
the `Items-Count` header. Without it, the data may still be accessible — but the
default `limit` in `PaginatedRequestTrait` may be small and truncate the list
silently.

### 3. `PersonOption` type has phantom fields

`PersonOption` in `features/issues/model/types.ts:49` declares `organization_id`
and `team_id`, but `UserResource` (which `PersonResource` extends) only returns
`{ id, name, email }`. These extra fields will always be `undefined`. This is a
contract mismatch — low severity (unused fields), but worth fixing.

## Affected Files

| File                                    | Change                                                     |
| --------------------------------------- | ---------------------------------------------------------- |
| `features/issues/api/issues.ts:482–499` | Replace raw `fetch` with `httpClientList<PersonOption>`    |
| `features/issues/model/types.ts:49–55`  | Remove `organization_id` and `team_id` from `PersonOption` |

## Fix Plan

### Step 1 — Fix `getPersons()` (primary fix)

Replace the entire `getPersons` function body:

```ts
// features/issues/api/issues.ts

// BEFORE (lines 482–499):
export async function getPersons(): Promise<PersonOption[]> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/persons`, {
    headers: { ...authHeaders },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/api/auth/clear-session');
    const text = await res.text();
    throw new Error(parseApiError(text, 'Failed to load persons').message);
  }

  const json: ApiResponse<PersonOption[]> = await res.json();
  return json.data ?? [];
}

// AFTER:
export async function getPersons(): Promise<PersonOption[]> {
  const result = await httpClientList<PersonOption>(`${API_URL}/persons`);
  return result.data;
}
```

### Step 2 — Fix `PersonOption` type contract

```ts
// features/issues/model/types.ts

// BEFORE:
export interface PersonOption {
  id: number;
  name: string;
  email?: string | null;
  organization_id?: number | null;
  team_id?: number | null;
}

// AFTER (matches UserResource exactly):
export interface PersonOption {
  id: number;
  name: string;
  email?: string | null;
}
```

### Step 3 — Cleanup unused imports in issues.ts

After the fix, verify whether `parseApiError` and `getAuthHeaders` are still
used elsewhere in `issues.ts`. If `getPersons` was the **only** raw-fetch caller
using these, remove those imports (if unused). Run `npm run lint:fix` to
confirm.

## Acceptance Criteria

- [x] Assignee dropdown on the issue create form shows the list of persons from
      the backend
- [x] Author dropdown on the issue create form shows the list of persons from
      the backend
- [x] `getPersons()` uses `httpClientList` (no raw `fetch`, no manual auth
      headers)
- [x] `PersonOption` interface matches `UserResource` fields exactly (`id`,
      `name`, `email`)
- [x] `npm run lint:fix && npm run format` passes with no new errors
- [x] The page renders without console errors

## References

- Backend route: `routes/api.php:204` — `Route::get('persons', ...)`
- Backend controller: `app/Http/Controllers/API/v1/PersonController.php`
- Backend resource: `app/Http/Resources/API/v1/PersonResource.php` → extends
  `UserResource` → `{ id, name, email }`
- Frontend function: `features/issues/api/issues.ts:482`
- Frontend type: `features/issues/model/types.ts:49`
- Frontend client: `shared/lib/httpClient.ts` — `httpClientList<T>()`
- Page: `app/dashboard/issues/(create)/create/page.tsx`
- CLAUDE.md Rule 2: Use shared HTTP clients, never raw `fetch`
