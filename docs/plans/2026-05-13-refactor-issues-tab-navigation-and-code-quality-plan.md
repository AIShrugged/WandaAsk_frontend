---
title: 'refactor: Issues section — tab navigation, code quality, and bug fixes'
type: refactor
status: active
date: 2026-05-13
---

# refactor: Issues section — tab navigation, code quality, and bug fixes

## Enhancement Summary

**Deepened on:** 2026-05-13 **Research agents used:** 12
(architecture-strategist, julik-frontend-races-reviewer,
kieran-typescript-reviewer, performance-oracle, code-simplicity-reviewer,
security-sentinel, spec-flow-analyzer, pattern-recognition-specialist,
best-practices-researcher, adversarial-reviewer, solution-applicability,
maintainability-reviewer)

### Key Improvements Added by Research

1. **Layout scoping is subtler than planned** — a single flat `layout.tsx`
   wrapping ALL issues children would inject the tab nav and filter bar into the
   `create` and `[id]` pages. The restructure must preserve isolation for those
   two pages.
2. **Teams fetch must NOT move to layout** — `TenantScopeFields` already does
   lazy client-side team fetching per selected org; a server-side pre-fetch
   would either be wasted or require refactoring `TenantScopeFields`.
3. **`httpClient` has a security gap on 401** — it calls `redirect()` instead of
   `clearSession()`, leaving the stale Bearer token cookie. Must be fixed before
   migrating the 11 raw-fetch functions.
4. **4 definitions of `VALID_SORT_FIELDS`, not 3** — plus `isIssueSortField` and
   `isSortOrder` are also duplicated.
5. **`(result as Issue).id` cast must be updated** to `result.data.id` after
   ActionResult migration.
6. **FSD violation exists in `issue-form.tsx` too**, not only
   `shared-filters-bar.tsx`.
7. **`revalidatePath` should use `'layout'` type** to cascade to all child
   routes.
8. **Kanban double-filtering risk** — after adding `status` to server dep array,
   the client-side `filteredColumns` in `KanbanBoard` will run a redundant
   second filter pass.
9. **`Suspense` required** around `IssuesLayoutClient` in Next.js 15+ due to
   `useSearchParams()`.
10. **`createIssue` and `deleteIssue` have no `revalidatePath` calls at all**
    (gap in existing code).
11. **`bumpColumnsVersion` ordering** — must be verified to run _after_
    `await updateIssue`.
12. **Recommended split into 3 PRs** by the simplicity reviewer.

---

## Overview

A comprehensive audit of `app/dashboard/issues/` and `features/issues/` has
surfaced:

- **Tab navigation violating CLAUDE.md conventions** — the tab strip lives
  inside a Client Component instead of `layout.tsx`, and the Progress tab is
  unreachable from the tab bar
- **Three real bugs** (kanban status filter silently ignored, stale
  revalidatePath, VALID_SORT_FIELDS divergence)
- **Dead code** (~360 lines of unused `TasksKanbanClient`, plus smaller dead
  constants/assignments)
- **Raw `fetch` calls** instead of `httpClient` (violates project API layer
  convention)
- **FSD boundary violations** in `SharedFiltersBar` and `issue-form.tsx`
- **Inconsistent return types** in `createIssue`/`updateIssue`

The goal: bring the issues section fully in line with project conventions, fix
the bugs, and preserve the existing shared-filter UX across Kanban and
Tasktracker tabs.

---

## Problem Statement

### 1. Tab navigation violates CLAUDE.md rules

**CLAUDE.md mandates:**

- Tab strip lives in `app/dashboard/<section>/layout.tsx` (Server Component)
- Each tab is a sub-route: `app/dashboard/<section>/<tab>/page.tsx`
- Use the `PageTabsNav` via a feature wrapper `XTabsNav` component
- Never use `useState` / Client Component logic for tab state

**What issues does today:**

- `IssuesTabsNav` is rendered inside `IssuesLayoutClient` — a Client Component
- Two separate route groups `(list)` and `(progress)` each have their own
  layout, meaning the tab strip appears in two places with different filter
  context
- The Progress tab (`/dashboard/issues/progress`) is **not listed in
  `IssuesTabsNav`** — users can only reach it via direct URL

**How agents and other pages do it (correct pattern):**

```
app/dashboard/agents/
  layout.tsx                 ← renders <AgentsTabsNav /> in a shrink-0 div above content
  page.tsx                   ← redirect to default tab
  profiles/page.tsx
  tasks/page.tsx
  activity/page.tsx
```

`features/agents/ui/agents-tabs-nav.tsx`:

```tsx
'use client';
const TABS = [
  { href: ROUTES.DASHBOARD.AGENT_PROFILES, label: 'Profiles' },
  ...
] as const;
export function AgentsTabsNav() { return <PageTabsNav tabs={TABS} />; }
```

### 2. Bugs

| #   | Location                                         | Bug                                                                                                                                    |
| --- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | `features/issues/ui/issues-kanban-tab.tsx:84`    | `status` filter not in useEffect dep array → status changes don't trigger kanban refetch                                               |
| B2  | `features/issues/api/issues.ts:362`              | `revalidatePath('/dashboard/kanban')` → wrong path; correct path is `/dashboard/issues/kanban`                                         |
| B3  | `features/issues/ui/issues-layout-client.tsx:32` | Local `VALID_SORT_FIELDS` missing `'priority'` and `'due_date'` → sort state diverges between SSR and client on those sort fields      |
| B4  | `features/issues/api/issues.ts`                  | `createIssue` and `deleteIssue` have no `revalidatePath` calls — list/kanban won't reflect new or deleted issues for server-side cache |

### 3. Dead code

| File                                          | Dead code                                                              |
| --------------------------------------------- | ---------------------------------------------------------------------- |
| `features/issues/ui/tasks-kanban-client.tsx`  | Entire file (~360 lines) — exported but never imported in `app/`       |
| `features/issues/ui/issues-kanban-tab.tsx:19` | `EMPTY_COLUMNS` constant — defined, never used                         |
| `features/issues/ui/issues-page.tsx:378`      | `const items = rawItems;` — identity assignment with no transformation |

### 4. API layer violations (raw `fetch`)

`features/issues/api/issues.ts` functions still using raw `fetch` +
`getAuthHeaders()` instead of `httpClient`/`httpClientList`:

- `getIssues()` (line ~130)
- `loadIssuesChunk()` (line ~165)
- `getArchivedCount()` (line ~205)
- `loadArchivedChunk()` (line ~230)
- `getIssue()` (line ~255)
- `createIssue()` (line ~292)
- `updateIssue()` (line ~330)
- `deleteIssue()` (line ~375)
- `dispatchIssue()` (line ~395)
- `answerAgentFlow()` (line ~415)
- `getEpics()` (line ~440)

**Research insight (from
`docs/solutions/integration-issues/server-action-html-response-json-parse.md`):**
Raw `fetch` + `.json()` on a 5xx Laravel response that returns HTML instead of
JSON throws a `SyntaxError: Unexpected token '<'`. The `httpClient` wrapper
handles this by reading the body as `.text()` before attempting JSON parsing,
centralizing the fix. Note: `httpClient`'s success path also calls `.json()`
directly — a future hardening would add a safe `text()` + `JSON.parse()` on the
success path too.

**Three functions need special migration handling (not a drop-in replacement):**

- `getArchivedCount` — currently swallows errors and returns `0`; needs a
  `try/catch` wrapper around `httpClientList`
- `getEpics` — currently swallows errors and returns `[]`; same pattern needed
- `dispatchIssue`/`answerAgentFlow` — return custom `{ data, error }` shapes;
  callers must be verified

### 5. Inconsistent return types

`createIssue` and `updateIssue` return `Issue | IssueActionError` instead of
`ActionResult<Issue>`. All other mutations in the project use `ActionResult<T>`.
Call sites currently use `'error' in result` guard instead of
`result.error !== null`.

**Critical migration detail:** `features/issues/ui/issue-form.tsx:230` has:

```ts
router.push(`${ROUTES.DASHBOARD.ISSUES}/${(result as Issue).id}`);
```

After migration to `ActionResult<Issue>`, this MUST become:

```ts
router.push(`${ROUTES.DASHBOARD.ISSUES}/${result.data.id}`);
```

### 6. FSD boundary violations

Two violations in `features/issues`, not one:

```ts
// features/issues/ui/shared-filters-bar.tsx:10
import { getTeams } from '@/features/teams/api/team'; // ❌ features → features

// features/issues/ui/issue-form.tsx
import { getTeams } from '@/features/teams/api/team'; // ❌ features → features (not in original plan)
```

**Correct fix:** Move `getTeams` to `entities/team/api/team.ts` (already exists
as an entity). This fixes both violations simultaneously and is FSD-compliant
(`features` may import `entities`). It also fixes identical violations in
`features/agents/ui/agent-task-form.tsx` and
`features/chat/ui/telegram-chats-management.tsx` in one move.

**Do NOT** inject teams as a prop from the layout (see Technical Considerations
§3).

### 7. Import order violation

`features/issues/model/types.ts:141`:

```ts
import type { SortOrder } from '@/shared/ui/table/types'; // mid-file import
```

Should be moved to the top of the file with all other imports.

### 8. Missing `loading.tsx`

`app/dashboard/issues/[id]/` has no `loading.tsx`. The detail page fetches 7
resources in parallel — users see blank/shift while loading.

---

## Proposed Solution

### Phase 1 — Restructure tab navigation (move tab strip to layout)

**Target state — critically: preserve layout isolation for `create` and
`[id`]:**

```
app/dashboard/issues/
  layout.tsx                ← MINIMAL Server Component: only outer chrome (no filter state, no IssuesLayoutClient)
  page.tsx                  ← redirect to ROUTES.DASHBOARD.ISSUES_KANBAN
  (tabs)/                   ← route group: scopes IssuesLayoutClient to kanban + list + progress only
    layout.tsx              ← Server Component: fetches orgs/persons/userId/orgId → <IssuesLayoutClient>
    kanban/
      page.tsx              ← move from (list)/kanban/page.tsx
      loading.tsx           ← keep
    list/
      page.tsx              ← move from (list)/list/page.tsx
      loading.tsx           ← keep
    progress/
      page.tsx              ← move from (progress)/progress/page.tsx
      loading.tsx           ← keep
  create/
    page.tsx                ← stays at root level (no IssuesLayoutClient wrapping)
    loading.tsx             ← keep
  [id]/
    page.tsx                ← stays
    loading.tsx             ← NEW (Phase 8)
```

**Why preserve `(tabs)/` as an inner route group:**

- The `[id]` and `create` pages must NOT inherit `IssuesLayoutClient` — they'd
  get the filter bar and tab strip injected above their forms (visual
  regression)
- The `[id]` page already calls `getOrganizations()` and `getPersons()` itself —
  putting it under `IssuesLayoutClient` would double-fetch those
- Route groups are transparent to URLs, so `(tabs)/kanban/` is still at
  `/dashboard/issues/kanban`

**`IssuesTabsNav` update** — add Progress tab:

```tsx
// features/issues/ui/issues-tabs-nav.tsx
'use client';
import { PageTabsNav } from '@/shared/ui/navigation/page-tabs-nav';
import { ROUTES } from '@/shared/lib/routes';

const TABS = [
  { href: ROUTES.DASHBOARD.ISSUES_KANBAN, label: 'Kanban' },
  { href: ROUTES.DASHBOARD.ISSUES_LIST, label: 'Tasktracker' },
  { href: ROUTES.DASHBOARD.ISSUES_PROGRESS, label: 'Progress' },
] as const;

export function IssuesTabsNav() {
  return <PageTabsNav tabs={TABS} preserveSearchParams />;
}
```

**`app/dashboard/issues/(tabs)/layout.tsx`** (the new filter-aware layout):

```tsx
// Server Component
import { Suspense } from 'react';
import { IssuesLayoutClient } from '@/features/issues';
import { getOrganizations } from '@/features/organization/api/organizations';
import { getPersons } from '@/features/issues/api/issues';
import { getCurrentUserId, getOrganizationId } from '@/shared/lib/session';

export default async function IssuesTabsLayout({
  children,
}: React.PropsWithChildren) {
  const [organizations, persons, currentUserId, cookieOrgId] =
    await Promise.all([
      getOrganizations(),
      getPersons(),
      getCurrentUserId(),
      getOrganizationId(),
    ]);

  return (
    // Suspense required: IssuesLayoutClient uses useSearchParams() internally
    <Suspense fallback={<IssuesLayoutSkeleton />}>
      <IssuesLayoutClient
        organizations={organizations}
        persons={persons}
        currentUserId={currentUserId}
        cookieOrgId={cookieOrgId}
      >
        {children}
      </IssuesLayoutClient>
    </Suspense>
  );
}
```

**`app/dashboard/issues/layout.tsx`** (minimal outer layout, no state):

```tsx
// Server Component
import { Card } from '@/shared/ui';

export default function IssuesLayout({ children }: React.PropsWithChildren) {
  return <Card className='flex h-full flex-col'>{children}</Card>;
}
```

**ROUTES** — ensure constants point to flat paths (without inner route groups):

```ts
ISSUES_KANBAN:   '/dashboard/issues/kanban',
ISSUES_LIST:     '/dashboard/issues/list',
ISSUES_PROGRESS: '/dashboard/issues/progress',
```

**`IssuesLayoutClient` update:**

- Move `<IssuesTabsNav />` to render at the top of the JSX (above filter bar)
- Remove local `VALID_SORT_FIELDS`, `isIssueSortField`, `isSortOrder` — import
  from `@/features/issues/model/types`
- If Option 3 (filter bar in child tabs) is chosen: expose `handleFiltersChange`
  through `FiltersContext` value (currently not in the context interface — this
  is a blocking gap if moving the filter bar to tabs)

### Phase 2 — Fix bugs

**B1 — Kanban status filter:**

Add `filters.status` to the `useEffect` dep array in `issues-kanban-tab.tsx`:

```ts
// BEFORE
}, [filters.organization_id, filters.team_id, filters.type, filters.assignee_id, filters.search, columnsVersion]);

// AFTER
}, [filtersVersion, columnsVersion]);
// Use filtersVersion (incremented on ANY filter change) rather than individual fields
// to avoid double-firing when multiple filter fields change atomically
```

Also extend `buildKanbanQuery` in `features/kanban/api/kanban.ts` to pass
`status` to the backend. Without this extension, the server refetch returns all
statuses and the client-side `filteredColumns` in `KanbanBoard` does a second
redundant pass — remove the client-side status filter from
`KanbanBoard.filteredColumns` once the server filter is active.

Add `status` to `KanbanFilters` type in `features/kanban/model/types.ts`.

**Verify `bumpColumnsVersion` ordering:** In all call sites
(`kanban-card-modal.tsx`, etc.), confirm that `bumpColumnsVersion()` is called
**after** `await updateIssue(...)`, never before. A fire-and-forget call before
the await fetches stale data.

**B2 — Stale revalidatePath:**

```ts
// BEFORE (wrong)
revalidatePath('/dashboard/issues');
revalidatePath('/dashboard/kanban');

// AFTER (correct — 'layout' type cascades to all child pages)
revalidatePath('/dashboard/issues', 'layout');
```

Apply to `updateIssue`. Also add to `createIssue` and `deleteIssue` (currently
missing entirely):

```ts
// In createIssue (currently has zero revalidatePath calls)
revalidatePath('/dashboard/issues', 'layout');

// In deleteIssue (currently has zero revalidatePath calls)
revalidatePath('/dashboard/issues', 'layout');
```

**B3 — VALID_SORT_FIELDS divergence:**

Delete all local definitions of `VALID_SORT_FIELDS`, `isIssueSortField`, and
`isSortOrder` from:

1. `features/issues/ui/issues-layout-client.tsx:32` — import from
   `@/features/issues/model/types` instead
2. `app/dashboard/issues/(list)/list/page.tsx:15` — import from
   `@/features/issues` instead

Both should use the canonical 8-field set that includes `'priority'` and
`'due_date'`.

Add a comment to `model/types.ts` at the canonical definition:

```ts
// Single source of truth for sort-field validation.
// Import from '@/features/issues' — do NOT redefine locally in consumers.
export const VALID_SORT_FIELDS = new Set<IssueSortField>([...]);
```

### Phase 3 — Remove dead code

- [ ] Delete `features/issues/ui/tasks-kanban-client.tsx` (full file ~360 lines)
- [ ] Remove `TasksKanbanClient` export from `features/issues/index.ts:44`
- [ ] Delete `EMPTY_COLUMNS` constant in `issues-kanban-tab.tsx:19`
- [ ] Delete `const items = rawItems;` in `issues-page.tsx:378`, rename
      `rawItems` → `items` at declaration site

### Phase 4 — Fix httpClient security gap before migration

**Before migrating the 11 raw-fetch functions, fix `shared/lib/httpClient.ts`:**

```ts
// BEFORE (leaves stale Bearer token cookie on 401)
if (res.status === 401) {
  redirect(ROUTES.AUTH.LOGIN);
}

// AFTER (clears auth cookies before redirect)
if (res.status === 401) {
  await clearSession(); // deletes token + organization_id cookies
  redirect(ROUTES.AUTH.LOGIN);
}
```

Without this fix, migrated functions will redirect on token expiry but leave the
stale `token` cookie in place — causing an infinite redirect loop or broken auth
state.

### Phase 5 — Migrate raw `fetch` to `httpClient`

Migrate all remaining raw-fetch functions in `features/issues/api/issues.ts` to
use `httpClient` / `httpClientList`. Migration complexity varies by function:

**Straightforward (direct replacement):**

- `getIssue()` → `httpClient<Issue>`
- `getIssues()` and `loadIssuesChunk()` → `httpClientList<Issue>`
- `loadArchivedChunk()` → `httpClientList<Issue>`
- `deleteIssue()` → `httpClient<void>`

**Need try/catch wrapper (currently swallow errors):**

- `getArchivedCount` — currently returns `0` on failure; wrap in try/catch
  around `httpClientList`, catch `ServerError` and return `0`
- `getEpics` — currently returns `[]` on failure; same pattern
- `dispatchIssue`/`answerAgentFlow` — verify caller expectations before
  migrating; may return custom shapes

**Combine with Phase 6 (return type change):**

- `createIssue()` and `updateIssue()` → migrate to `httpClient<Issue>` AND
  change return type (see Phase 6)

Remove all manual `clearSession()` calls from the functions being migrated —
`httpClient` handles 401 automatically (after the Phase 4 fix above).

### Phase 6 — Normalize return types

Change `createIssue` and `updateIssue` to return `ActionResult<Issue>`:

```ts
export async function createIssue(
  payload: IssueCreatePayload,
): Promise<ActionResult<Issue>> {
  try {
    const { data } = await httpClient<Issue>(`${API_URL}/issues`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!data)
      throw new ServerError('Empty response', 0, `${API_URL}/issues`, '');
    revalidatePath('/dashboard/issues', 'layout');
    return { data, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to create issue',
      );
      return {
        data: null,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      };
    }
    throw error;
  }
}
```

**Required call-site updates:**

`features/issues/ui/issue-form.tsx:230` — update the cast:

```ts
// BEFORE
router.push(`${ROUTES.DASHBOARD.ISSUES}/${(result as Issue).id}`);

// AFTER
router.push(`${ROUTES.DASHBOARD.ISSUES}/${result.data.id}`);
```

`features/issues/ui/issues-page.tsx:436` — update the guard:

```ts
// BEFORE
if ('error' in result) { ... }

// AFTER
if (result.error !== null) { ... }
```

Delete the local `IssueActionError` type from `features/issues/api/issues.ts`
once unused.

**Fix `data!` non-null assertions** (unsafe, pre-existing):

```ts
// Replace all three instances of `return data!` with a guard:
if (!data) throw new ServerError('Empty response from server', 0, url, '');
return data;
```

### Phase 7 — FSD boundary fix

**Move `getTeams` to `entities/team/api/team.ts`** (the architecturally correct
fix):

```ts
// NEW: entities/team/api/team.ts
'use server';
export async function getTeams(
  organizationId: string,
): Promise<{ data: TeamProps[] | null }> {
  // move the implementation from features/teams/api/team.ts
}
```

This fixes both FSD violations in `features/issues` simultaneously:

- `features/issues/ui/shared-filters-bar.tsx:10` — import from
  `@/entities/team/api/team` instead
- `features/issues/ui/issue-form.tsx` — import from `@/entities/team/api/team`
  instead

Also fixes violations in `features/agents/ui/agent-task-form.tsx` and
`features/chat/ui/telegram-chats-management.tsx` (same `getTeams` cross-feature
import).

**Do NOT use the "teams as prop" approach** — that would require either:

- Fetching teams in the layout for ALL issues sub-pages (including `[id]` and
  progress, which don't need teams), adding unnecessary server-side cost
- Or refactoring `TenantScopeFields` to accept `initialTeams` prop and suppress
  its internal fetch, which is more work than moving the function

The `entities/team/` directory already exists with `TeamProps` defined there.
`features/teams/api/team.ts` can re-export from entities.

### Phase 8 — Fix import order in `model/types.ts`

Move `import type { SortOrder } from '@/shared/ui/table/types'` from line 141 to
the top of the file with all other imports.

### Phase 9 — Add missing `loading.tsx` for `[id]` route

Create `app/dashboard/issues/[id]/loading.tsx` with a skeleton that matches the
detail page layout:

- `PageHeader` skeleton (back button, title, action buttons)
- Metadata strip skeleton (status badge, assignee, dates, priority)
- Description area skeleton (3-4 text blocks)
- Comments area skeleton (2-3 comment stubs)

### Phase 10 — Add maintainability guards

**Version counter documentation** — add JSDoc above the counters in
`IssuesLayoutClient`:

```ts
/** Incremented on every shared-filter change. Use as effect dep instead of individual filter fields. */
const [filtersVersion, setFiltersVersion] = useState(0);

/** Incremented on kanban column mutations (drag/drop, inline edit). Triggers board reload without filter change. */
const [columnsVersion, setColumnsVersion] = useState(0);
```

**IssueForm defaultValues warning** — the `useMemo` on `defaultValues` is
misleading; `react-hook-form` only reads it on mount:

```ts
// WARNING: react-hook-form reads defaultValues once on mount.
// If 'issue' prop changes without unmounting, call form.reset() explicitly.
// This useMemo avoids object churn; it does NOT make the form reactive to prop changes.
const defaultValues = useMemo(() => { ... }, [issue]);
```

**Mid-render state update comment** in `IssuesLayoutClient` lines 107-115:

```ts
// Mid-render derived-state update — see React docs "You may set state right during rendering".
// This avoids a one-frame flicker vs. a useEffect approach.
if (cookieOrgId !== prevCookieOrgId) {
```

---

## Technical Considerations

### 1. Why the inner `(tabs)` route group is needed

Without it, `app/dashboard/issues/layout.tsx` would wrap ALL children including
`create/` and `[id]/`. These pages:

- Should not show the filter bar or tab strip (visual regression)
- `[id]/page.tsx` already fetches `organizations` and `persons` itself — adding
  `IssuesLayoutClient` would double-fetch them
- `create/page.tsx` already fetches `organizations`, `persons`, `epics` — same
  double-fetch problem

The `(tabs)/` route group is semantically meaningful: it scopes
`IssuesLayoutClient` to exactly the three tabs that need shared filter state.

### 2. Filter state on the Progress tab

The Progress tab will be wrapped by `IssuesLayoutClient` (it's inside
`(tabs)/`). `IssueProgressPage` does not call `useFiltersContext()` — it ignores
the context entirely. This is intentional:

- Progress stats are org-wide aggregates, unaffected by task/team filters
- The filter bar will still render above Progress (it's in `IssuesLayoutClient`)
  — but the data doesn't respond to it
- `IssueProgressPage` already shows a "filters active" banner
  (`hasActiveFilters` prop) when URL filter params are present, so users have a
  visual cue

If hiding the filter bar on Progress is desired in the future, it can be done by
checking `pathname` inside `IssuesLayoutClient` or using
`useSelectedLayoutSegment()`.

### 3. Why NOT to move teams fetch to layout

The current `SharedFiltersBar` → `TenantScopeFields` chain fetches teams
**lazily client-side** when the user selects an organization. This is
intentional:

- Teams depend on the selected org (a runtime filter value)
- A server-side pre-fetch would be for the _initial_ org only; switching orgs
  would still trigger a client-side re-fetch (duplicate work)
- The detail page and progress page don't need teams at all — adding a
  layout-level teams fetch would load them unnecessarily for every navigation
- Moving `getTeams` to `entities/team/` is the correct fix (see Phase 7)

### 4. `Suspense` requirement for `useSearchParams`

`IssuesLayoutClient` calls `useSearchParams()` at line 63. In Next.js 15+, any
Client Component using `useSearchParams` that is rendered in a Server Component
tree must be wrapped in `<Suspense>` or the entire route segment is forced into
dynamic rendering with no static shell.

Wrap the `IssuesLayoutClient` render in `(tabs)/layout.tsx`:

```tsx
<Suspense fallback={<IssuesTabsSkeleton />}>
  <IssuesLayoutClient ...>
    {children}
  </IssuesLayoutClient>
</Suspense>
```

### 5. `revalidatePath` cascade behavior

In Next.js 15+:

- `revalidatePath('/dashboard/issues')` — invalidates ONLY that exact page, does
  NOT cascade
- `revalidatePath('/dashboard/issues', 'layout')` — invalidates the layout AND
  all pages beneath it (cascades to list, kanban, progress)
- `revalidateTag('issues')` — alternative when route groups are involved
  (community-reported: route group notation in `revalidatePath` sometimes fails
  on Vercel deployments)

Use `revalidatePath('/dashboard/issues', 'layout')` for all issue mutations.

### 6. `updateUrl` stale closure (concurrent filter changes)

The `updateUrl` callback in `IssuesLayoutClient` builds a new URL from
`searchParams` in its closure. On slow connections, if a user changes org and
then immediately types in the search box before the URL update from the first
change resolves, the second `updateUrl` call reads stale `searchParams` (from
before the first change) and overwrites the org param.

**Recommended fix** (add to Phase 10 or a separate PR):

```ts
const updateUrl = useCallback(
  (nextFilters: SharedFilters & { show_archived: boolean }) => {
    const params = new URLSearchParams(); // build from scratch, not from stale searchParams
    if (nextFilters.organization_id)
      params.set('organization_id', nextFilters.organization_id);
    // ... etc
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  },
  [router, pathname], // no longer depends on searchParams
);
```

### 7. Kanban dep array unification

The plan recommends unifying the kanban `useEffect` dep array from individual
filter fields to `[filtersVersion, columnsVersion]`:

**Before:**

```ts
[
  filters.organization_id,
  filters.team_id,
  filters.type,
  filters.assignee_id,
  filters.search,
  filters.status,
  columnsVersion,
];
```

**After (recommended):**

```ts
[filtersVersion, columnsVersion];
```

`filtersVersion` is incremented on every filter change in the same
`handleFiltersChange` call that updates `filters`. By the time the effect fires,
`filters` state is current. This eliminates the risk of double-firing when
multiple filter fields change atomically, and makes it impossible to forget to
add a new filter field to the dep array.

---

## Acceptance Criteria

### Navigation

- [ ] All three tabs (Kanban, Tasktracker, Progress) appear in `IssuesTabsNav`
- [ ] Active tab is highlighted correctly on all three routes
- [ ] Tab strip renders from `app/dashboard/issues/(tabs)/layout.tsx` (not
      inside a Client Component)
- [ ] Filter params are preserved when switching between Kanban ↔ Tasktracker
      ↔ Progress tabs
- [ ] `create/` and `[id]/` pages do NOT show the filter bar or tab strip
- [ ] `/dashboard/issues` redirects to `/dashboard/issues/kanban`

### Bugs fixed

- [ ] Changing the Status filter on the Kanban tab triggers a kanban data
      refetch (server-side, not just client-side column hiding)
- [ ] `revalidatePath` calls use `('...', 'layout')` type to cascade to all
      child pages
- [ ] `createIssue` and `deleteIssue` both call `revalidatePath`
- [ ] Sorting by `priority` or `due_date` on the list tab correctly initializes
      client-side sort state

### Code quality

- [ ] `tasks-kanban-client.tsx` deleted; `TasksKanbanClient` removed from
      `index.ts:44`
- [ ] `EMPTY_COLUMNS` dead constant removed from `issues-kanban-tab.tsx`
- [ ] `const items = rawItems` dead assignment removed from `issues-page.tsx`
- [ ] All API functions in `issues.ts` use `httpClient`/`httpClientList` (no raw
      `fetch`)
- [ ] `httpClient` calls `clearSession()` on 401 before redirecting
- [ ] `createIssue` and `updateIssue` return `ActionResult<Issue>`
- [ ] `(result as Issue).id` cast updated to `result.data.id` in
      `issue-form.tsx:230`
- [ ] `data!` non-null assertions replaced with guarded checks
- [ ] `SharedFiltersBar` and `issue-form.tsx` have no cross-feature import from
      `features/teams/`
- [ ] `getTeams` moved to `entities/team/api/team.ts`
- [ ] `VALID_SORT_FIELDS`, `isIssueSortField`, `isSortOrder` have exactly one
      definition (in `model/types.ts`)
- [ ] Import at top of `model/types.ts` moved to correct position

### Loading states

- [ ] `app/dashboard/issues/[id]/loading.tsx` exists and shows a skeleton

### Tests pass

- [ ] `npm test -- --passWithNoTests` passes
- [ ] `npm run lint` passes (no new errors)
- [ ] `npm run build` passes (no TypeScript errors)

---

## Dependencies & Risks

| Risk                                                                          | Mitigation                                                                                                             |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `(tabs)/` route group changes layout scoping for kanban/list/progress         | Intentional — URLs unchanged; verify loading.tsx files survive the move                                                |
| `create/` and `[id]/` pages remain outside `IssuesLayoutClient`               | Correct — they should not have filter context                                                                          |
| `httpClient` 401 fix (`clearSession`) affects ALL features using httpClient   | Safe fix — currently httpClient leaves stale auth cookies, which is worse                                              |
| Kanban double-filtering after B1 fix                                          | Remove client-side `filteredColumns` status check after adding server-side status filter                               |
| `bumpColumnsVersion` ordered incorrectly at some call site                    | Grep all call sites and verify each is after `await`                                                                   |
| Migrating `getEpics` to httpClient changes its error-swallowing behavior      | Wrap in try/catch to preserve `catch(() => [])` semantics                                                              |
| Moving `getTeams` to `entities/team/` affects imports in agents/chat features | Cascade update: also fix `features/agents/ui/agent-task-form.tsx` and `features/chat/ui/telegram-chats-management.tsx` |
| `Suspense` boundary for `IssuesLayoutClient` may change streaming behavior    | The route segment is already dynamic due to `useSearchParams` — no regression for current behavior                     |

---

## Recommended Split into 3 PRs

The code-simplicity reviewer strongly recommended splitting this into 3 PRs:

### PR 1 — High-value, low-risk (bugs + dead code + quick fixes)

Estimated: ~8 files, ~400 lines net reduction

- Phase 3: delete dead code (`tasks-kanban-client.tsx`, `EMPTY_COLUMNS`,
  `const items = rawItems`)
- Phase 2 B2+B3: fix revalidatePath (use `'layout'` type) + add to
  createIssue/deleteIssue + deduplicate VALID_SORT_FIELDS
- Phase 2 B1: fix kanban status dep array (unified to
  `[filtersVersion, columnsVersion]`)
- Add Progress tab to `IssuesTabsNav` (3-line change)
- Phase 8: fix import order in `model/types.ts`
- Phase 9: add `[id]/loading.tsx`
- Phase 10: add maintainability comments

### PR 2 — API migration (medium effort, self-contained)

Estimated: ~1 major file, ~200 lines changed

- Phase 4: fix `httpClient` 401 handling
- Phase 5: migrate 11 raw-fetch functions to httpClient
- Phase 6: normalize createIssue/updateIssue to ActionResult<Issue>
- Fix `data!` non-null assertions

### PR 3 — Structural restructure (largest change, cosmetic)

Estimated: ~15 files, file moves

- Phase 1: route group restructure with inner `(tabs)/` group
- Phase 7: move `getTeams` to `entities/team/` (do after PR1 removes the dead
  TasksKanbanClient which also has this violation)

**PR 3 is optional** — the tab navigation improvement (Progress tab visible in
nav) is already delivered in PR 1. PR 3 is purely about aligning the file
structure with CLAUDE.md conventions.

---

## Implementation Order (within each PR)

**PR 1:**

1. Delete `tasks-kanban-client.tsx` + remove from `index.ts` (safest, reduces
   noise)
2. Remove `EMPTY_COLUMNS` + dead assignment
3. Fix import order in `model/types.ts`
4. Fix `VALID_SORT_FIELDS` deduplication (import from model in layout client and
   list page)
5. Add Progress tab to `IssuesTabsNav`
6. Fix revalidatePath to use `'layout'` type; add to createIssue/deleteIssue
7. Fix kanban dep array to `[filtersVersion, columnsVersion]`; verify
   bumpColumnsVersion ordering
8. Add `[id]/loading.tsx`
9. Add maintainability comments

**PR 2:**

1. Fix `httpClient` 401 → clearSession (must be first)
2. Migrate straightforward functions (getIssue, getIssues, loadIssuesChunk,
   loadArchivedChunk, deleteIssue)
3. Migrate error-swallowing functions with wrappers (getArchivedCount, getEpics)
4. Migrate with return-type change (createIssue, updateIssue →
   ActionResult<Issue>)
5. Update call sites in issue-form.tsx and issues-page.tsx
6. Fix `data!` assertions
7. Migrate remaining (dispatchIssue, answerAgentFlow) — verify callers

**PR 3:**

1. Move `getTeams` to `entities/team/api/team.ts`; update all imports (issues +
   agents + chat)
2. Create new `(tabs)/` route group and layout
3. Move kanban, list, progress pages into `(tabs)/`
4. Create outer `issues/layout.tsx` (minimal)
5. Delete old `(list)/`, `(progress)/` layouts and route groups
6. Add `<Suspense>` wrapper in `(tabs)/layout.tsx`
7. Verify all loading.tsx files survived the move

---

## File Change Map

```
PR 1:
DELETE  features/issues/ui/tasks-kanban-client.tsx
MODIFY  features/issues/index.ts                        — remove TasksKanbanClient export (line 44)
MODIFY  features/issues/ui/issues-kanban-tab.tsx        — remove EMPTY_COLUMNS; fix dep array to [filtersVersion, columnsVersion]
MODIFY  features/issues/ui/issues-page.tsx              — remove dead assignment
MODIFY  features/issues/model/types.ts                  — fix import order; add canonical comment
MODIFY  features/issues/ui/issues-tabs-nav.tsx          — add Progress tab
MODIFY  features/issues/ui/issues-layout-client.tsx     — remove local VALID_SORT_FIELDS/isIssueSortField/isSortOrder; import from model
MODIFY  app/dashboard/issues/(list)/list/page.tsx       — remove local VALID_SORT_FIELDS; import from @/features/issues
MODIFY  features/issues/api/issues.ts                   — fix revalidatePath; add to createIssue/deleteIssue
CREATE  app/dashboard/issues/[id]/loading.tsx

PR 2:
MODIFY  shared/lib/httpClient.ts                        — fix 401 to call clearSession()
MODIFY  features/issues/api/issues.ts                   — migrate all raw fetch to httpClient; ActionResult return types; fix data!
MODIFY  features/issues/ui/issue-form.tsx               — update call sites; fix (result as Issue).id → result.data.id
MODIFY  features/issues/ui/issues-page.tsx              — update call sites

PR 3:
CREATE  entities/team/api/team.ts                       — move getTeams here
MODIFY  features/teams/api/team.ts                      — re-export getTeams from entities
MODIFY  features/issues/ui/shared-filters-bar.tsx       — import getTeams from @/entities/team/api/team
MODIFY  features/issues/ui/issue-form.tsx               — import getTeams from @/entities/team/api/team
MODIFY  features/agents/ui/agent-task-form.tsx          — import getTeams from @/entities/team/api/team
MODIFY  features/chat/ui/telegram-chats-management.tsx  — import getTeams from @/entities/team/api/team
CREATE  app/dashboard/issues/(tabs)/layout.tsx          — new filter-aware layout with Suspense + IssuesLayoutClient
CREATE  app/dashboard/issues/layout.tsx                 — new minimal outer layout (Card only)
MOVE    app/dashboard/issues/(list)/kanban/page.tsx     → app/dashboard/issues/(tabs)/kanban/page.tsx
MOVE    app/dashboard/issues/(list)/list/page.tsx       → app/dashboard/issues/(tabs)/list/page.tsx
MOVE    app/dashboard/issues/(progress)/progress/page.tsx → app/dashboard/issues/(tabs)/progress/page.tsx
KEEP    loading.tsx files in their sub-routes
DELETE  app/dashboard/issues/(list)/layout.tsx
DELETE  app/dashboard/issues/(progress)/layout.tsx
DELETE  app/dashboard/issues/(list)/ (empty dirs)
DELETE  app/dashboard/issues/(progress)/ (empty dirs)
MODIFY  features/issues/ui/issues-layout-client.tsx     — move IssuesTabsNav to render at top; add Suspense note
MODIFY  features/kanban/model/types.ts                  — add status field to KanbanFilters
MODIFY  features/kanban/api/kanban.ts                   — extend buildKanbanQuery to pass status
MODIFY  features/issues/ui/issues-kanban-tab.tsx        — remove client-side filteredColumns status filter (server-side now handles it)
```

---

## References

- CLAUDE.md — Tab Navigation Convention section
- `app/dashboard/agents/layout.tsx` — canonical tab layout pattern
- `features/agents/ui/agents-tabs-nav.tsx` — canonical tab nav component pattern
- `shared/ui/navigation/page-tabs-nav.tsx` — `PageTabsNav` component API
  (`preserveSearchParams`, `match`)
- `features/issues/ui/issues-layout-client.tsx:32` — duplicate VALID_SORT_FIELDS
  (to delete)
- `app/dashboard/issues/(list)/list/page.tsx:15` — duplicate VALID_SORT_FIELDS
  (to delete)
- `features/issues/ui/tasks-kanban-client.tsx` — dead code (to delete, ~360
  lines)
- `features/issues/ui/issues-kanban-tab.tsx:84` — status filter bug
- `features/issues/api/issues.ts:362` — stale revalidatePath bug
- `features/issues/ui/shared-filters-bar.tsx:10` — FSD boundary violation
- `features/issues/ui/issue-form.tsx` — FSD boundary violation (getTeams import)
- `features/issues/ui/issue-form.tsx:230` — `(result as Issue).id` cast
  requiring update
- `shared/types/server-action.ts` — `ActionResult<T>` type
- `shared/lib/httpClient.ts` — `httpClient`, `httpClientList`; fix needed for
  401 handling
- `docs/solutions/integration-issues/server-action-html-response-json-parse.md`
  — why raw fetch is dangerous in Server Actions
- Next.js docs: `revalidatePath` with `'layout'` type for cascade invalidation
- Next.js docs: `useSearchParams` requires `<Suspense>` boundary in App Router
  layouts
