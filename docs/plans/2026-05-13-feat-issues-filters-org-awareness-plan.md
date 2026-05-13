---
title: 'feat: Issues Filters — Org-Awareness and Reset on Org Switch'
type: feat
status: completed
date: 2026-05-13
deepened: 2026-05-13
---

# feat: Issues Filters — Org-Awareness and Reset on Org Switch

## Enhancement Summary

**Deepened on:** 2026-05-13 **Research agents used:**
kieran-typescript-reviewer, performance-oracle, architecture-strategist,
julik-frontend-races-reviewer, code-simplicity-reviewer,
best-practices-researcher, spec-flow-analyzer, learnings-researcher

### Key Improvements Over Original Plan

1. **Simpler primary mechanism** — a single `router.push` after org switch is
   the lowest-complexity correct solution; the prop+useEffect chain is only
   needed if stay-on-page is a hard requirement
2. **FSD boundary fix** — `features/organization` must NOT enumerate
   `features/issues` route paths; use `revalidatePath('/dashboard', 'layout')`
   instead
3. **Critical timing fix** — `router.refresh()` must fire from `useEffect`
   watching `pending` state (action result), not inline in the form action
   callback
4. **`revalidatePath` scope fix** — pass `'layout'` as the second argument to
   revalidate the layout Server Component, not just a page
5. **Double-fetch eliminated** — the `revalidatePath` + client-side
   `filtersVersion` chain causes two backend calls; either approach alone is
   sufficient
6. **6 edge cases identified** — fresh nav UI/data mismatch, rapid double-switch
   flash, search input desync, persons not org-scoped, kanban ignores status
   filter, `searchParams` staleness in `updateUrl`

### New Considerations Discovered

- The lazy `useState` initializer in `IssuesLayoutClient` runs only once — it
  cannot react to a cookie change after mount; prop-threading is required if
  stay-on-page behavior is needed
- `getOrganizationId()` never returns `null` — it redirects to login;
  `cookieOrgId` prop must be typed `string`, not `string | null`
- The React team's preferred pattern for prop-change detection is mid-render
  `setState` comparison (not `useEffect + useRef`) when the side effect is a
  state reset

---

## Overview

The issues page (`/dashboard/issues/list` and `/dashboard/issues/kanban`) shares
a filter bar managed by `IssuesLayoutClient`. One of the filter fields is
`organization_id`. Currently this filter is initialised from the URL on first
render and **never synced** with the active organization cookie
(`organization_id`). When a user switches the active org via the header
dropdown, the issues page continues showing data filtered to the previous org —
the cookie changes but the URL and React state do not.

This plan covers two related sub-problems:

1. **Initial load without a URL param** — if the user navigates to
   `/dashboard/issues/list` with no `organization_id` search param, the filter
   bar shows "No organization" even though SSR loaded org-scoped data from the
   cookie. The filter UI and data are out of sync.
2. **Org switch while on the issues page** — when `setActiveOrganization` is
   called, the issues filter state must reset the `organization_id` (and
   `team_id`, since teams are org-scoped) to match the new active org.

---

## Problem Statement

### Current behaviour

- `IssuesLayoutClient` initialises `organization_id` filter from
  `searchParams.get('organization_id') ?? ''` — no cookie fallback on the
  client. The lazy `useState` initializer runs once on mount only.
- `app/dashboard/issues/(list)/layout.tsx` does NOT read the cookie and does NOT
  pass `cookieOrgId` to `IssuesLayoutClient`.
- `setActiveOrganization` Server Action only calls
  `revalidatePath(ROUTES.DASHBOARD.ORGANIZATION)` — issues pages are NOT
  revalidated, so the Server Component layout does not re-render after an org
  switch.
- The SSR pages (`list/page.tsx`, `kanban/page.tsx`) do have a cookie fallback
  (`cookieOrgId`) but only for the **initial** server fetch, not for the
  client-side filter state.

### UI/Data Desync Table

| Scenario                | URL has org param | Cookie org   | Filter bar shows  | SSR data for      | Mismatch? |
| ----------------------- | ----------------- | ------------ | ----------------- | ----------------- | --------- |
| Fresh nav               | No                | 5            | "No organization" | org 5             | **YES**   |
| Bookmarked URL          | Yes (3)           | 5            | org 3             | org 3             | No        |
| After header org switch | Yes (3, stale)    | 5 (new)      | org 3 (stale)     | org 3 (stale URL) | **YES**   |
| Rapid switch A→B→A      | Yes (stale)       | last settled | stale             | per stale URL     | **YES**   |

### Impact

- User sees issues for the wrong org after switching.
- The filter bar `organization_id` dropdown still shows the old org selected.
- Team dropdown may show teams from the old org.
- The filter bar shows "No organization" on fresh navigation, but data is scoped
  to the cookie org — a confusing silent divergence.

---

## Proposed Solution

### Product Decision Required First

Before implementing, settle the product behavior for two scenarios:

**Decision A: What wins when URL org ≠ cookie org?** (e.g., user opens a
bookmarked URL from org 3 but their active org cookie is 5)

- Option 1: URL wins — current behavior, no change needed
- Option 2: Cookie wins — redirect to strip `organization_id` from URL
- Option 3: Show disambiguation UI

**Decision B: Should the org switch stay on the issues page or navigate to it?**

- Option 1 (simplest): Navigate to `/dashboard/issues` after org switch — SSR
  handles everything automatically
- Option 2: Stay on page and update the filter bar in-place

The architecture below covers both; **Option 1/Option 1 (navigate) is strongly
recommended** by the simplicity analysis.

---

### Recommended Approach: Navigate After Org Switch (Option 2 + Option 1)

This is the lowest-complexity correct solution. It requires changing **1 file**
with **~5 lines**.

**Mechanism:** After `setActiveOrganization` succeeds, call
`router.push(ROUTES.DASHBOARD.ISSUES)`. This triggers a full Server Component
render:

- `IssuesListPage` SSR reads the new cookie and fetches org-scoped data
- `IssuesLayoutClient` lazy `useState` re-initializes from a clean URL (no
  `organization_id` param)
- Part A fix (initial load mismatch) is solved simultaneously by also passing
  `cookieOrgId` from the layout

**Why this is correct:** `IssuesListPage` and `IssuesKanbanPage` already
implement:

```ts
const cookieOrgId = await getOrganizationId();
const orgId =
  typeof params.organization_id === 'string'
    ? params.organization_id
    : cookieOrgId; // ← cookie fallback already exists
```

Navigating to `/dashboard/issues` without `?organization_id=` lets this existing
fallback do the right thing with zero new logic.

**Also add `revalidatePath('/dashboard', 'layout')` to `setActiveOrganization`**
to bust the RSC cache so the next navigation serves fresh data, not a stale
cache hit.

---

### Alternative Approach: Stay On Page (if navigation is not acceptable)

If the product requirement is to stay on the issues page after an org switch, 4
files need to change. This approach is more complex and has known edge cases
(documented in the Edge Cases section).

**Step 1 — Layout: pass `cookieOrgId` prop**

`app/dashboard/issues/(list)/layout.tsx` calls `getOrganizationId()` (which
always returns `string` or redirects — never returns `null`) and passes it to
`IssuesLayoutClient`.

```tsx
// app/dashboard/issues/(list)/layout.tsx
import { getOrganizationId } from '@/shared/lib/getOrganizationId';

export default async function IssuesLayout({ children }: PropsWithChildren) {
  const [organizationsResponse, persons, currentUserId, cookieOrgId] =
    await Promise.all([
      getOrganizations(),
      getPersons(),
      getCurrentUserId(),
      getOrganizationId(), // always string, redirects if absent
    ]);

  return (
    <Card className='overflow-hidden'>
      <IssuesLayoutClient
        organizations={organizationsResponse.data ?? []}
        persons={persons}
        currentUserId={currentUserId ?? null}
        cookieOrgId={cookieOrgId} // string, never null
      >
        {children}
      </IssuesLayoutClient>
    </Card>
  );
}
```

**Step 2 — Client: use `cookieOrgId` as default and react to prop changes**

```tsx
// features/issues/ui/issues-layout-client.tsx

// Correct prop type — string, NOT string | null
type IssuesLayoutClientProps = React.PropsWithChildren<{
  organizations: OrganizationProps[];
  persons: PersonOption[];
  currentUserId: number | null;
  cookieOrgId: string; // always present — layout redirects to login if absent
}>;
```

Update the lazy `useState` initializer (fixes the fresh-navigation mismatch):

```ts
organization_id: searchParams.get('organization_id') ?? cookieOrgId,
```

Add org-change detection using mid-render comparison (React's official preferred
pattern over `useEffect + useRef`):

```tsx
// Store previous cookieOrgId to detect changes — runs during render, not after
const [prevCookieOrgId, setPrevCookieOrgId] = useState(cookieOrgId);

if (cookieOrgId !== prevCookieOrgId) {
  setPrevCookieOrgId(cookieOrgId);
  // Directly reset the relevant filter fields — React re-renders immediately
  setFilters((prev) => ({
    ...prev,
    organization_id: cookieOrgId,
    team_id: '',
  }));
  setFiltersVersion((v) => v + 1);
  columnsVersionRef.current += 1;
  setColumnsVersion(columnsVersionRef.current);
}
```

> **Why mid-render instead of `useEffect + useRef`?** The React team's
> documented recommendation (in "You Might Not Need an Effect") is to use this
> pattern for state resets triggered by prop changes. It avoids the extra render
> cycle that `useEffect` causes (effect runs after paint), is safer with the
> React Compiler, and does not require a ref guard to suppress the initial run.

**Step 3 — Server Action: revalidate at the correct scope**

```ts
// features/organization/api/organization.ts — setActiveOrganization

// ❌ FSD violation: features/organization must NOT know features/issues route paths
revalidatePath(ROUTES.DASHBOARD.ISSUES);

// ✅ Correct: revalidate the shared ancestor layout, not individual feature routes
revalidatePath('/dashboard', 'layout'); // second arg 'layout' is required to revalidate the layout SC
```

> **Why `'layout'`?** Without the second argument, `revalidatePath` only clears
> the page cache for that exact URL. The `cookieOrgId` prop lives in the layout
> Server Component. The layout must be the thing that re-renders, so `'layout'`
> is required. Without it, the layout re-uses its cached RSC payload and
> `IssuesLayoutClient` never receives the new `cookieOrgId` prop.
>
> **Why `/dashboard` not `ROUTES.DASHBOARD.ISSUES`?** This feature is org-scoped
> across all dashboard sections. `features/organization` revalidating
> `features/issues` paths specifically violates FSD — features cannot know about
> each other. Use the shared ancestor `/dashboard` to cover all org-scoped
> sections without cross-feature coupling.

**Step 4 — Org dropdown: trigger `router.refresh()` after action settles**

```tsx
// features/organization/ui/organization-dropdown.tsx

const [state, action, pending] = useActionState(setActiveOrganization, {
  ok: false,
});

// ⚠️ WRONG — fires before Server Action completes (action is async)
// action={(formData) => { action(formData); router.refresh(); }}

// ✅ CORRECT — fires after action resolves and React re-renders
const prevPendingRef = useRef(false);
useEffect(() => {
  if (prevPendingRef.current && !pending && state.ok) {
    router.refresh();
  }
  prevPendingRef.current = pending;
}, [pending, state.ok, router]);
```

> **Why `useEffect` here?** `useActionState`'s `action` callback dispatches
> asynchronously. Calling `router.refresh()` inline in the form `action` prop
> fires it before the Server Action has completed writing the cookie. The cookie
> is not yet set when `router.refresh()` runs, so the layout re-renders with the
> old cookie value — the entire mechanism silently does nothing.

---

## Technical Considerations

### Critical: `revalidatePath` + `router.refresh()` ≠ always necessary together

- **`revalidatePath('/dashboard', 'layout')`** in the Server Action: busts the
  **server-side** RSC cache so the next navigation or refresh gets fresh data.
- **`router.refresh()`** in the dropdown: forces the client to **immediately**
  re-fetch the current route's Server Components.

If only `revalidatePath` is added (without `router.refresh()`): the cache is
cleared, but the currently-mounted page doesn't update. The next navigation to
the issues page will be correct, but the current view stays stale.

If only `router.refresh()` is added (without `revalidatePath`): the current page
updates immediately, but the server cache may still serve stale data to other
tabs or subsequent navigations.

Both together = immediate update of the current page + correct cache state for
future navigations. **However, they also cause a double-fetch** (the
`router.refresh()` fetches new issues SSR data, then the `useEffect` on
`filtersVersion` triggers a second client-side fetch). The navigate approach
avoids this entirely.

### httpOnly cookie — cannot be read by client-side JS

All detection of org changes must go through Server Component re-render. There
is no `document.cookie` option. The entire mechanism (`revalidatePath` →
`router.refresh()` → new Server Component render → new prop) is necessary
precisely because the cookie is httpOnly.

### `team_id` must reset with `organization_id`

Teams are org-scoped. Keeping a `team_id` from org A when switching to org B
will either return no results or return results from the wrong org if the ID
exists in both. Always reset `team_id: ''` together with `organization_id`.

### `getOrganizationId()` redirects, never returns null

```ts
export async function getOrganizationId(): Promise<string> {
  const cookieStore = await cookies();
  const organizationId = cookieStore.get('organization_id')?.value;
  if (!organizationId) redirect(ROUTES.AUTH.LOGIN); // ← throws redirect
  return organizationId;
}
```

The return type is `string`. Type the `cookieOrgId` prop as `string`, never
`string | null`. An implementer typing it as `string | null` and adding
null-check branches would introduce dead code and obscure the actual invariant.

### `IssuesLayoutClient` lazy `useState` runs only once

The lazy initializer `() => ({ organization_id: ... })` inside `useState` runs
exactly on first mount. After mount, it never re-runs, even if `cookieOrgId`
prop changes. The mid-render comparison pattern (Step 2) addresses this.

### URL remains the single source of truth for filter state

The URL is the canonical store. The `cookieOrgId` prop is only the _default
value_ source for initial load and the _trigger signal_ for org-switch
detection. After detecting an org switch, `handleFiltersChange` → `updateUrl`
writes the new org into the URL, and from that point forward the URL drives
everything.

---

## Edge Cases and Known Limitations

### Edge Case 1: Search input local state desync

`SharedFiltersBar` maintains a local `searchValue` state initialized from
`filters.search` **on mount only**. If filters are reset externally (org
switch), the search text input will not clear visually even if `filters.search`
is reset to `''`.

**Mitigation:** Pass `key={filters.organization_id}` to `SharedFiltersBar` to
force unmount+remount on org change, which resets all local state:

```tsx
<SharedFiltersBar
  key={filters.organization_id}
  filters={filters}
  organizations={organizations}
  persons={persons}
  onChange={handleFiltersChange}
/>
```

### Edge Case 2: Rapid org switching — flash of wrong-org data

If the user switches org A→B→A rapidly, there is a window where `cookieOrgId`
shows B while the cookie has already been written to A (second switch). The
issues list briefly shows org B data.

**Mitigation:** `useActionState`'s `pending` flag disables the dropdown while
one switch is in-flight. This is already implemented. No additional code needed
— accept the window is small.

### Edge Case 3: `updateUrl` closes over stale `searchParams`

```ts
const updateUrl = useCallback((patch) => {
  const params = new URLSearchParams(searchParams.toString()); // ← snapshot at memo time
  ...
}, [router, pathname, searchParams]);
```

If two state updates happen in the same render cycle, the second `updateUrl`
call may snapshot a `searchParams` that doesn't reflect the first call's
`router.replace` (Next.js `useSearchParams` lags behind programmatic
navigation).

**Mitigation (optional, not blocking for this feature):**

```ts
const updateUrl = useCallback((patch: Record<string, string>) => {
  const params = new URLSearchParams(window.location.search); // always current
  ...
}, [router, pathname]); // searchParams removed from deps
```

### Edge Case 4: Persons list is not org-scoped

`getPersons()` in the layout fetches all persons visible to the user, with no
org filter. After an org switch, the assignee dropdown may show people not in
the new org, and filtering by them yields zero results.

**This is a pre-existing limitation, not introduced by this feature.** Track
separately.

### Edge Case 5: Kanban tab ignores `status` filter

`fetchKanbanIssues` in `IssuesKanbanTab` does not pass `filters.status`. The
filter bar's status dropdown has no effect on the kanban view. **Pre-existing
bug, track separately.**

### Edge Case 6: `router.refresh()` re-renders entire page tree

`router.refresh()` triggers a re-render of all Server Components at the current
URL, not just the issues layout. This means `getOrganizations()` and
`getPersons()` in the layout are re-fetched from the backend on every org
switch.

**Mitigation (future optimization):** Wrap `getOrganizations` and `getPersons`
in `unstable_cache` with user-scoped tags. Call `revalidateTag` for those tags
only when the org list or persons list actually changes. This reduces the
re-fetch cost from 2 backend calls to 0 on a cache hit.

---

## Acceptance Criteria

- [x] Navigating to `/dashboard/issues/list` with no `?organization_id=` param
      pre-selects the active org in the filter bar (UI and SSR data in sync).
- [x] Switching the active org via the header dropdown causes the issues filter
      bar to update `organization_id` to the new org.
- [x] `team_id` filter is reset to empty when the org changes.
- [x] All other filters (status, type, assignee, sort) are preserved when the
      org changes.
- [x] The SSR data fetch on the issues pages uses the correct (new) org after
      switching.
- [x] No infinite re-render loops — the mid-render comparison pattern fires only
      when `cookieOrgId` actually changes.
- [x] The search text input visually clears when org changes (via
      `key={filters.organization_id}` on `SharedFiltersBar`).
- [x] `router.refresh()` fires only after `setActiveOrganization` has fully
      resolved (not before the cookie is written).
- [x] The `features/organization` server action does not reference
      `features/issues` route paths directly.

---

## Implementation Plan

### Recommended: Navigate approach (1 file, minimal risk)

**File:** `features/organization/ui/organization-dropdown.tsx`

```ts
// Also add to setActiveOrganization Server Action:
revalidatePath('/dashboard', 'layout');

// In organization-dropdown.tsx — add after action resolves:
// Option A: navigate away (simplest, recommended)
router.push(ROUTES.DASHBOARD.ISSUES);

// Option B: stay on page (see Step 4 above for the useEffect approach)
```

**File:** `features/organization/api/organization.ts` — `setActiveOrganization`

```ts
revalidatePath(ROUTES.DASHBOARD.ORGANIZATION);
revalidatePath('/dashboard', 'layout'); // ← add: covers all org-scoped pages, no FSD violation
```

---

### Stay-on-page approach (4 files)

**If navigation is not acceptable**, implement Steps 1–4 from the Proposed
Solution section above.

| File                                                 | Change                                                                                                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `app/dashboard/issues/(list)/layout.tsx`             | Add `getOrganizationId()` to `Promise.all`; pass `cookieOrgId: string` prop                                            |
| `features/issues/ui/issues-layout-client.tsx`        | Add `cookieOrgId: string` prop; update filter init; add mid-render comparison pattern; add `key` to `SharedFiltersBar` |
| `features/organization/api/organization.ts`          | Replace `revalidatePath(ROUTES.DASHBOARD.ISSUES)` with `revalidatePath('/dashboard', 'layout')`                        |
| `features/organization/ui/organization-dropdown.tsx` | Add `useEffect` watching `pending` state to call `router.refresh()` after action settles                               |

**Order of implementation:** Step 3 (server action) → Step 1 (layout) → Step 2
(client) → Step 4 (dropdown). This order ensures you can test each step in
isolation before wiring up the full flow.

---

## Testing Checklist

### Manual test scenarios

- [ ] Navigate fresh to `/dashboard/issues/list` with no URL params — filter bar
      shows active org, not "No organization"
- [ ] Navigate to `/dashboard/issues/list` with `?organization_id=X` where X is
      a different org — verify URL org takes precedence for both filter bar and
      data
- [ ] While on issues page, switch org via header dropdown — verify filter bar
      updates to new org, team dropdown clears
- [ ] While on issues page, verify search, status, type, and assignee filters
      are preserved after org switch
- [ ] Switch org rapidly (click twice before first completes) — verify no
      console errors, final state is correct
- [ ] Open issues page in two tabs, switch org in one — verify the other tab is
      not affected (correct, each tab manages its own state)
- [ ] Verify both `/list` and `/kanban` sub-tabs both update correctly after org
      switch

### Automated tests to add

- Unit test: `IssuesLayoutClient` renders with `cookieOrgId` prop and
  initializes filter correctly
- Unit test: mid-render comparison fires `setFiltersVersion` when `cookieOrgId`
  prop changes
- Unit test: `SharedFiltersBar` resets search input when remounted via `key`
  prop change

---

## References

- Active org cookie read helper: `shared/lib/getOrganizationId.ts:10`
- Filter state init (lazy useState):
  `features/issues/ui/issues-layout-client.tsx:65-81`
- `handleFiltersChange` and `filtersVersion`:
  `features/issues/ui/issues-layout-client.tsx:144-153`
- `setActiveOrganization` Server Action:
  `features/organization/api/organization.ts:179`
- SSR cookie fallback (list page):
  `app/dashboard/issues/(list)/list/page.tsx:43-47`
- SSR cookie fallback (kanban page):
  `app/dashboard/issues/(list)/kanban/page.tsx:19-23`
- `SharedFilters` type: `entities/issue/model/types.ts:15`
- Route constants: `shared/lib/routes.ts` — `ISSUES`, `ISSUES_LIST`,
  `ISSUES_KANBAN`
- React "You Might Not Need an Effect" — mid-render state comparison pattern
- Next.js `revalidatePath` API — `'layout'` type argument required for layout
  revalidation
