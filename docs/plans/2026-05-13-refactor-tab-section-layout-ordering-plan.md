---
title:
  'refactor: Standardize Tab Section Layout Ordering (Tabs → Filters → Content)'
type: refactor
status: completed
date: 2026-05-13
---

# refactor: Standardize Tab Section Layout Ordering (Tabs → Filters → Content)

## Enhancement Summary

**Deepened on:** 2026-05-13 **Research agents used:**
kieran-typescript-reviewer, performance-oracle, julik-frontend-races-reviewer,
architecture-strategist, code-simplicity-reviewer, best-practices-researcher

### Key Improvements Over Original Plan

1. **Single Suspense boundary, not two** — original plan proposed splitting into
   two `<Suspense>` boundaries; research confirmed this causes visible CLS (tab
   strip pops in above an empty area before filters load). Keep both under one
   boundary.
2. **`fallback={null}` is wrong for in-flow content** — use a height-preserving
   skeleton placeholder (`IssuesTabsNavSkeleton`) to prevent layout shift
3. **`flex-1 min-h-0` additions are unnecessary** — `<main>` in the root
   dashboard layout already scrolls (`overflow-y-auto`); the issues Card does
   not participate in a constrained height stack
4. **Remove `pt-4 → pt-2` spacing tweak** — cosmetic change unrelated to the
   ordering fix; keep it separate
5. **Confirmed: `IssuesTabsNav` export already exists** in
   `features/issues/index.ts`
6. **Two performance wins documented** as follow-up: duplicate
   `getPersons`/`getCurrentUserId` calls (worth fixing with React `cache()`)

---

## Overview

Every tab-based section in the dashboard must follow a single, consistent
component ordering:

1. **Tabs** — the `PageTabsNav` strip (always at the top)
2. **Shared Filters** — preserved across tab switches via URL params (if the
   section has filters)
3. **Tab content** — `{children}`

This rule already applies correctly to `today/`, `agents/`, `meetings/`, and
`profile/`. The only violation is the `issues/(tabs)/` section, where
`IssuesLayoutClient` currently renders **Filters → Tabs → Content** instead of
the required **Tabs → Filters → Content**, and additionally renders
`IssuesTabsNav` inside a Client Component instead of the Server Component
`layout.tsx`.

**Reference design** — `app/dashboard/today/layout.tsx`:

```tsx
<div className='flex flex-col h-full overflow-hidden p-2'>
  <div className='shrink-0 mb-4'>
    <TodayTabsNav />
  </div>
  <div className='flex-1 overflow-y-auto'>{children}</div>
</div>
```

---

## Problem Statement

### Current render tree (inside `Card`)

```
IssuesTabsLayout (Server Component — layout.tsx)
  └─ Card
       └─ Suspense
            └─ IssuesLayoutClient ('use client')
                 └─ FiltersContext.Provider
                      ├─ CollapsibleSection (Filters)   ← rendered FIRST  ❌
                      ├─ IssuesTabsNav                  ← rendered SECOND ❌
                      └─ {children}                     ← rendered THIRD  ✓
```

**Two violations:**

1. Filters appear above the tab strip — breaks the Tabs → Filters → Content
   convention
2. `IssuesTabsNav` is inside a Client Component — per CLAUDE.md it must live in
   `layout.tsx` (Server Component), matching `agents/`, `meetings/`, and
   `today/`

---

## Target Render Tree

```
IssuesTabsLayout (Server Component — layout.tsx)
  └─ Card
       └─ Suspense (fallback: IssuesTabsNavSkeleton)
            ├─ IssuesTabsNav ('use client', reads useSearchParams)   ← FIRST  ✓
            └─ IssuesLayoutClient ('use client')
                 └─ FiltersContext.Provider
                      ├─ CollapsibleSection (Filters)                ← SECOND ✓
                      └─ {children}                                  ← THIRD  ✓
```

**Why a single `<Suspense>` boundary (not two):**

`IssuesTabsNav` uses `useSearchParams()` through `PageTabsNav` — it requires a
Suspense boundary when rendered from a Server Component layout (Next.js 15+
build requirement). The temptation is to give it its own boundary with
`fallback={null}`. But:

- Two sibling `<Suspense>` boundaries can resolve independently — the tab strip
  may mount and become interactive _before_ the filter bar has mounted
- If that happens, the user sees the tab strip above an empty area, then the
  filters pop in — a visible layout shift equal to the filter bar height
- The tab strip has no useful "partial state" without the filter context below
  it
- Keeping both under a single boundary ensures they mount atomically, matching
  the current behavior

**Why the fallback needs a height placeholder, not `null`:**

The entire `IssuesLayoutClient` subtree (filter bar + tab content) is behind the
single Suspense boundary. While the server fetches `getOrganizations()` /
`getPersons()`, the card interior is blank. The `IssuesTabsNavSkeleton` should
reserve the tab strip height to prevent CLS. The filter+content area below it
can be blank (it's variable-height anyway).

---

## Sections Audit — No Changes Needed

| Section          | Layout file                              | Order                            | Status        |
| ---------------- | ---------------------------------------- | -------------------------------- | ------------- |
| `today/`         | `app/dashboard/today/layout.tsx`         | TodayTabsNav → children          | ✅ Correct    |
| `agents/`        | `app/dashboard/agents/layout.tsx`        | AgentsTabsNav → children         | ✅ Correct    |
| `meetings/`      | `app/dashboard/meetings/layout.tsx`      | MeetingsTabsNav → children       | ✅ Correct    |
| `profile/`       | `app/dashboard/profile/layout.tsx`       | ProfileTabsNav → Card → children | ✅ Correct    |
| `issues/(tabs)/` | `app/dashboard/issues/(tabs)/layout.tsx` | Filters → **Tabs** → children    | ❌ Fix needed |

---

## Implementation Plan

### Step 1 — Create `IssuesTabsNavSkeleton` component

Create a height-preserving skeleton for the tab strip fallback. The underline
variant of `PageTabsNav` renders a `border-b border-[var(--divider)]` container
with `py-2 px-4 text-sm` tab items — approximately 40px total height.

**New file:** `features/issues/ui/issues-tabs-nav-skeleton.tsx`

```tsx
export function IssuesTabsNavSkeleton() {
  return (
    <div className='h-10 border-b border-[var(--divider)]' aria-hidden='true' />
  );
}
```

Export it from `features/issues/index.ts`:

```ts
export { IssuesTabsNavSkeleton } from './ui/issues-tabs-nav-skeleton';
```

**Why:** `fallback={null}` would render nothing while the Suspense resolves,
then the tab strip pops into the layout — causing a CLS event equal to the tab
strip height (~40px). The skeleton reserves that space so there's no shift.

### Step 2 — Update `app/dashboard/issues/(tabs)/layout.tsx`

Move `IssuesTabsNav` into this Server Component, _inside the single existing
`<Suspense>` boundary_, above `IssuesLayoutClient`. Use `IssuesTabsNavSkeleton`
as the fallback.

**File:** `app/dashboard/issues/(tabs)/layout.tsx`

```tsx
import { Suspense } from 'react';

import {
  getPersons,
  IssuesLayoutClient,
  IssuesTabsNav,
  IssuesTabsNavSkeleton,
} from '@/features/issues';
import { getOrganizations } from '@/features/organization';
import { getCurrentUserId } from '@/shared/lib/getCurrentUserId';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import { Card } from '@/shared/ui/card';

import type { PropsWithChildren } from 'react';

export default async function IssuesTabsLayout({
  children,
}: PropsWithChildren) {
  const [organizationsResponse, persons, currentUserId, cookieOrgId] =
    await Promise.all([
      getOrganizations(),
      getPersons(),
      getCurrentUserId(),
      getOrganizationId(),
    ]);

  return (
    <Card className='overflow-hidden'>
      <Suspense fallback={<IssuesTabsNavSkeleton />}>
        <IssuesTabsNav />
        <IssuesLayoutClient
          organizations={organizationsResponse.data ?? []}
          persons={persons}
          currentUserId={currentUserId ?? null}
          cookieOrgId={cookieOrgId}
        >
          {children}
        </IssuesLayoutClient>
      </Suspense>
    </Card>
  );
}
```

**Key decisions:**

- Single `<Suspense>` wrapping both `IssuesTabsNav` and `IssuesLayoutClient` —
  they mount atomically, no partial layout state
- `IssuesTabsNav` placed before `IssuesLayoutClient` in the JSX — this is the
  visual ordering fix
- `IssuesTabsNavSkeleton` as the fallback — reserves the tab strip height,
  prevents CLS during server fetch
- `Card` className unchanged (`overflow-hidden` only) — no `flex flex-col`
  needed because `<main>` in the dashboard root layout already provides the
  scroll container (`flex-1 overflow-y-auto p-2 min-h-0`)

### Step 3 — Update `features/issues/ui/issues-layout-client.tsx`

Remove the `<IssuesTabsNav />` line. No other changes to the JSX structure — the
flex/padding props should remain as they are (the `pt-4` spacing tweak is
cosmetic and out of scope).

**File:** `features/issues/ui/issues-layout-client.tsx`

Change the return JSX — remove this single line:

```tsx
// BEFORE (lines 230–234):
      </div>

      <IssuesTabsNav />    {/* ← DELETE THIS LINE */}

      <div>{children}</div>
```

```tsx
// AFTER:
      </div>

      <div>{children}</div>
```

That is the entire change to this file. No flex class changes, no padding
changes.

### Step 4 — Verify `IssuesTabsNav` export in `features/issues/index.ts`

`IssuesTabsNav` is already exported from `features/issues/index.ts` at line 52.
Verify the new `IssuesTabsNavSkeleton` export is added in Step 1.

---

## Acceptance Criteria

- [x] On the Kanban, Tasktracker, and Progress pages: the tab strip appears
      **above** the filter bar in the DOM and visually
- [x] While the page loads (Suspense resolving), a `~40px` height placeholder
      shows where the tab strip will be — no layout jump when it mounts
- [x] Switching between tabs preserves all filter params in the URL (via
      `preserveSearchParams` in `IssuesTabsNav`)
- [x] Changing a filter does not cause the tab strip to unmount or re-render
- [x] `IssuesTabsNav` is rendered in `layout.tsx` JSX, not inside
      `IssuesLayoutClient`'s return
- [x] No TypeScript errors (`npm run build` passes)
- [x] No ESLint errors (`npm run lint` passes)
- [x] The `today/`, `agents/`, `meetings/`, and `profile/` layouts are untouched
- [x] Kanban board scroll and column layout are unaffected

---

## Out of Scope

The following related issues are **not** addressed in this plan and should be
separate tickets:

- **Filter bar on Progress tab**: The filter bar is visible but has no effect on
  Progress stats. Hiding/disabling it conditionally requires its own design
  decision.
- **`IssueCreateButton` placement**: Currently rendered inside
  `CollapsibleSection extraContent`. Could be adjacent to the tab strip, but
  this is a UX change.
- **Filter area Suspense skeleton**: The
  `<Suspense fallback={<IssuesTabsNavSkeleton />}>` only reserves the tab strip
  height. The filter bar + content area shows blank during load. A full skeleton
  for that area is a separate improvement.
- **`sort`/`order` param pollution**: `preserveSearchParams` carries
  Tasktracker-only params to Kanban and Progress URLs. Pre-existing behavior,
  not introduced by this refactor.
- **`pt-4 → pt-2` spacing**: Cosmetic tweak between tab strip and filter bar —
  should be a separate commit.
- **Test coverage**: Adding a rendering test that asserts `IssuesTabsNav`
  appears before `SharedFiltersBar` in the DOM.

---

## Research Insights

### Suspense and `useSearchParams()` (Next.js 16)

The official Next.js docs require any Client Component calling
`useSearchParams()` to be wrapped in `<Suspense>` when rendered from a Server
Component layout. This prevents the "Missing Suspense boundary with
useSearchParams" build error and enables static prerendering of the layout
shell.

**`fallback={null}` vs. height-preserving placeholder:** The streaming guide
explicitly warns against `fallback={null}` for in-flow elements:

> "Design skeleton fallbacks that match the dimensions of the content they
> represent. A skeleton with the same height and width as the final content
> prevents shifts."

For the tab strip specifically: `PageTabsNav` in its `underline` variant renders
a `border-b border-[var(--divider)]` container with `py-2` padding on items,
totalling ~40px. A `<div className='h-10 border-b border-[var(--divider)]'>`
preserves this space exactly.

### Why `IssuesTabsNav` Stays a Client Component

`IssuesTabsNav` calls `useSearchParams()` through `PageTabsNav` to implement
`preserveSearchParams` — building tab `href` strings that include the current
URL filter params. This hook only exists in Client Components. Making it
server-rendered would require passing search params as props from the Server
Component, which would disconnect the reactive update when `IssuesLayoutClient`
calls `router.replace()` to update filter params.

Moving `IssuesTabsNav` _into the Server Component's JSX tree_ (as this plan
does) does not make it server-rendered — it is still a Client Component subtree.
The improvement is strictly structural: the _JSX responsibility_ is moved to
`layout.tsx`, matching the convention that other sections follow, and the visual
order becomes correct.

### `router.replace()` vs. `window.history.replaceState`

The existing `IssuesLayoutClient` uses `router.replace()` (Next.js router) to
update filter params in the URL. Research shows that
`window.history.replaceState()` — which Next.js monkey-patches — updates
`useSearchParams()` subscribers **instantly** without a server round-trip, while
`router.replace()` triggers a full RSC fetch cycle:

```ts
// Instant URL + hook update (no server round-trip):
window.history.replaceState(null, '', `?${params.toString()}`);
// Then trigger server component re-fetch if needed:
router.refresh();
```

This is a pre-existing optimization opportunity in `IssuesLayoutClient`'s
`updateUrl` function — not introduced by this refactor, but worth addressing
separately. The library `nuqs` encapsulates this pattern with batching and
debouncing.

### `flex-1 min-h-0` — Not Needed Here

`min-h-0` is required when a `flex-1` item in a `flex-col` container has content
taller than available space and its `overflow` is still `visible`. Per CSS
Flexbox spec §4.5, the automatic minimum size for a flex item defaults to its
content size — `min-h-0` overrides this to 0, allowing the item to shrink and
internal scroll to engage.

In this layout, `<main className='flex-1 overflow-y-auto p-2 min-h-0'>` in
`app/dashboard/layout.tsx` is the scroll container. The `Card` component is a
direct child of `<main>` — it grows to its natural content height and `<main>`
scrolls the page. No constrained height stack exists at the Card level. Adding
`flex flex-col` to `Card` and `flex-1 min-h-0` to `IssuesLayoutClient` would be
inert (no parent height constraint). Leave the flex chain unchanged.

### Performance: Duplicate Server Fetches (Follow-up Opportunity)

Research identified that both `(tabs)/layout.tsx` and individual tab pages call
`getPersons()` and `getCurrentUserId()` independently within the same RSC
request cycle — each resolves to a separate HTTP call to the backend. Wrapping
these functions with React's `cache()` would deduplicate them at zero
implementation cost:

```ts
// shared/lib/getCurrentUserId.ts
import { cache } from 'react';
export const getCurrentUserId = cache(async () => { ... });

// features/issues/api/issues.ts
import { cache } from 'react';
export const getPersons = cache(async () => { ... });
```

This is **not part of this refactor** — document as a follow-up ticket.

---

## Files Changed

| File                                              | Change                                                                                                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `features/issues/ui/issues-tabs-nav-skeleton.tsx` | **New file** — height-preserving Suspense fallback (one `div`)                                                                                                                 |
| `app/dashboard/issues/(tabs)/layout.tsx`          | Add `IssuesTabsNav` + `IssuesTabsNavSkeleton` imports; place `<IssuesTabsNav />` before `<IssuesLayoutClient>` inside single `<Suspense fallback={<IssuesTabsNavSkeleton />}>` |
| `features/issues/ui/issues-layout-client.tsx`     | Remove one line: `<IssuesTabsNav />` from the return JSX                                                                                                                       |
| `features/issues/index.ts`                        | Add export for `IssuesTabsNavSkeleton`                                                                                                                                         |

**4 files total. Core logic change is a single line deletion in
`issues-layout-client.tsx`.**

---

## References

- Canonical layout pattern: `app/dashboard/today/layout.tsx`
- `PageTabsNav` component: `shared/ui/navigation/page-tabs-nav.tsx`
- `IssuesLayoutClient`: `features/issues/ui/issues-layout-client.tsx`
- `IssuesTabsNav`: `features/issues/ui/issues-tabs-nav.tsx`
- Dashboard root scroll container: `app/dashboard/layout.tsx:103`
  (`<main className='flex-1 overflow-y-auto p-2 min-h-0'>`)
- Related refactor plan (broader issues quality):
  `docs/plans/2026-05-13-refactor-issues-tab-navigation-and-code-quality-plan.md`
- Universal tab navigation convention:
  `docs/plans/2026-04-08-refactor-universal-tab-navigation-component-plan.md`
- Next.js `useSearchParams` docs:
  https://nextjs.org/docs/app/api-reference/functions/use-search-params
- Next.js streaming guide (sibling Suspense):
  https://nextjs.org/docs/app/guides/streaming
- CSS Flexbox `min-height: auto` spec:
  https://www.w3.org/TR/css-flexbox-1/#min-size-auto
