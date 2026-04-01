---
title: 'refactor: Convert tab navigation to route-based sub-routes'
type: refactor
status: active
date: 2026-04-01
---

# refactor: Convert tab navigation to route-based sub-routes

## Overview

Three dashboard pages use `useState`-based tab switching that loses state on
reload and has no direct URL. Convert `/dashboard/main`, `/dashboard/issues`,
and `/dashboard/agents` to Next.js App Router sub-routes so every tab is
directly linkable, bookmarkable, and browser-history-aware.

## Problem Statement

- Tab state is in-memory only — refreshing the page always resets to the default
  tab
- Cannot share or bookmark a specific tab (e.g. "Statistics" or "Kanban board")
- Browser back/forward does not navigate between tabs
- `/dashboard/agents` already has sub-route stubs (`/tasks`, `/profiles`,
  `/activity`) that immediately redirect back — wasted infra that confirms the
  pattern was planned but never completed

## Decisions (pre-settled before implementation)

| Question                                | Decision                                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------------- |
| Redirect type for parent routes         | `redirect()` in `page.tsx` (307). Back-button trap is acceptable at this scope.             |
| Filter carry-over on Issues tab switch  | **Carry filters over**: tab Link hrefs are dynamically built from current `useSearchParams` |
| `SharedFiltersBar` location             | Moves to `app/dashboard/issues/layout.tsx` — persists across tab sub-routes                 |
| Data fetching for `/main` and `/agents` | Each sub-route page fetches its own data independently; `loading.tsx` per sub-route         |
| Invalid sub-routes                      | 404 (no catch-all redirect)                                                                 |
| `revalidatePath`                        | Update all mutations to target sub-route paths                                              |
| Scroll on tab switch                    | `scroll={false}` on all tab `<Link>` elements                                               |
| Per-tab metadata                        | Yes — each sub-route page exports its own `generateMetadata`                                |

## Proposed Solution

Replace `useState` tab components with `usePathname`-driven `<Link>` tab strips.
Each tab becomes its own `page.tsx` that fetches its own data. Parent routes
redirect to their default tab.

### New file structure

```
app/dashboard/
  main/
    layout.tsx          ← NEW: tab strip (DashboardTabsNav)
    page.tsx            ← CHANGE: redirect('/dashboard/main/overview')
    overview/
      page.tsx          ← NEW: was "main" tab content
      loading.tsx       ← NEW
    statistics/
      page.tsx          ← NEW: was "statistics" tab content
      loading.tsx       ← NEW

  issues/
    layout.tsx          ← NEW: SharedFiltersBar + tab strip (IssuesTabsNav)
    page.tsx            ← CHANGE: redirect('/dashboard/issues/list')
    loading.tsx         ← keep, move or update
    list/
      page.tsx          ← NEW: was "tasktracker" tab content (IssuesPage)
      loading.tsx       ← NEW
    kanban/
      page.tsx          ← NEW: was "kanban" tab content (KanbanBoard)
      loading.tsx       ← NEW
    [id]/               ← unchanged
    create/             ← unchanged

  agents/
    layout.tsx          ← NEW: tab strip (AgentsTabsNav)
    page.tsx            ← CHANGE: redirect('/dashboard/agents/tasks')
    tasks/
      page.tsx          ← CHANGE: remove redirect, real page
      loading.tsx       ← NEW
      [id]/             ← unchanged
      new/              ← unchanged
    profiles/
      page.tsx          ← CHANGE: remove redirect, real page
      loading.tsx       ← NEW
      [id]/             ← unchanged
      new/              ← unchanged
    activity/
      page.tsx          ← CHANGE: remove redirect, real page
      loading.tsx       ← NEW
```

### Tab nav components (new)

Three new lightweight client components, one per section. All follow the same
pattern:

```tsx
// features/main-dashboard/ui/dashboard-tabs-nav.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/dashboard/main/overview', label: 'Main' },
  { href: '/dashboard/main/statistics', label: 'Statistics' },
] as const;

export function DashboardTabsNav() {
  const pathname = usePathname();
  return (
    <div className='flex border-b border-border'>
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          scroll={false}
          className={`px-4 py-2 text-sm font-medium transition-colors
            ${
              pathname === tab.href
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
```

For Issues, the tab Links must carry current filter params:

```tsx
// features/issues/ui/issues-tabs-nav.tsx
'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const TABS = [
  { segment: 'list', label: 'Tasktracker' },
  { segment: 'kanban', label: 'Kanban' },
] as const;

export function IssuesTabsNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = searchParams.toString();

  return (
    <div className="flex border-b border-border">
      {TABS.map(tab => {
        const href = `/dashboard/issues/${tab.segment}${params ? `?${params}` : ''}`;
        const isActive = pathname.startsWith(`/dashboard/issues/${tab.segment}`);
        return (
          <Link key={tab.segment} href={href} scroll={false} className={...}>
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
```

### Issues layout (SharedFiltersBar + tab strip)

```tsx
// app/dashboard/issues/layout.tsx
import { SharedFiltersBar } from '@/features/issues';
import { IssuesTabsNav } from '@/features/issues';

export default function IssuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='h-full flex flex-col'>
      <SharedFiltersBar />
      <IssuesTabsNav />
      <div className='flex-1 min-h-0'>{children}</div>
    </div>
  );
}
```

`SharedFiltersBar` must be refactored to be a Server Component wrapper or use
`useSearchParams` directly (it currently lives inside `TasktrackerTabs` as a
rendered JSX node — needs extraction into its own exported component).

## Technical Approach

### Phase 1 — /dashboard/agents (lowest risk, infra already exists)

1. Delete redirect logic from `app/dashboard/agents/tasks/page.tsx`,
   `profiles/page.tsx`, `activity/page.tsx`
2. Move data-fetching from `app/dashboard/agents/page.tsx` into each sub-route
   page:
   - `tasks/page.tsx` → fetches agent tasks, renders `AgentTasksList`
   - `profiles/page.tsx` → fetches agent profiles, renders `AgentProfilesList`
   - `activity/page.tsx` → fetches activity feed, renders `AgentActivityFeed`
3. Create `app/dashboard/agents/layout.tsx` with `AgentsTabsNav`
4. Change `app/dashboard/agents/page.tsx` to
   `redirect('/dashboard/agents/tasks')`
5. Create `features/agents/ui/agents-tabs-nav.tsx` (replaces `AgentsTabs`)
6. Delete `features/agents/ui/agents-tabs.tsx`
7. Add `loading.tsx` to each sub-route
8. Update `revalidatePath` in `features/agents/api/` files

### Phase 2 — /dashboard/main (simple, no filters)

1. Create `app/dashboard/main/overview/page.tsx` — move "main" tab content here
2. Create `app/dashboard/main/statistics/page.tsx` — move "statistics" tab
   content here
3. Create `app/dashboard/main/layout.tsx` with `DashboardTabsNav`
4. Change `app/dashboard/main/page.tsx` to
   `redirect('/dashboard/main/overview')`
5. Create `features/main-dashboard/ui/dashboard-tabs-nav.tsx` (replaces
   `DashboardTabs`)
6. Delete `features/main-dashboard/ui/dashboard-tabs.tsx`
7. Add `loading.tsx` to each sub-route

### Phase 3 — /dashboard/issues (most complex: filters)

1. Refactor `SharedFiltersBar` into a standalone exportable component (currently
   embedded in `TasktrackerTabs`)
2. Create `app/dashboard/issues/layout.tsx` with `SharedFiltersBar` +
   `IssuesTabsNav`
3. Create `app/dashboard/issues/list/page.tsx` — fetches issues, passes to
   `IssuesPage`
4. Create `app/dashboard/issues/kanban/page.tsx` — fetches columns, passes to
   `KanbanBoard`
5. Change `app/dashboard/issues/page.tsx` to
   `redirect('/dashboard/issues/list')`
6. Create `features/issues/ui/issues-tabs-nav.tsx` with filter-aware Link hrefs
7. Delete `features/issues/ui/tasktracker-tabs.tsx`
8. Add `loading.tsx` to each sub-route
9. Update `revalidatePath` in `features/issues/api/` files
10. Move `filtersVersion`/`columnsVersion` logic — version counters must live in
    the layout since they coordinate between the filter bar and the content
    pages

### Route constants update

```ts
// shared/lib/routes.ts — additions/changes
AGENTS: '/dashboard/agents',                    // keep (redirect target)
AGENT_TASKS: '/dashboard/agents/tasks',         // keep, now real page
AGENT_PROFILES: '/dashboard/agents/profiles',   // keep, now real page
AGENT_ACTIVITY: '/dashboard/agents/activity',   // keep, now real page
MAIN: '/dashboard/main',                        // keep (redirect target)
MAIN_OVERVIEW: '/dashboard/main/overview',      // NEW
MAIN_STATISTICS: '/dashboard/main/statistics',  // NEW
ISSUES: '/dashboard/issues',                    // keep (redirect target)
ISSUES_LIST: '/dashboard/issues/list',          // NEW
ISSUES_KANBAN: '/dashboard/issues/kanban',      // NEW
KANBAN: '/dashboard/kanban',                    // REMOVE (now ISSUES_KANBAN)
```

## Acceptance Criteria

### Functional

- [ ] `/dashboard/main` redirects to `/dashboard/main/overview`
- [ ] `/dashboard/main/overview` and `/dashboard/main/statistics` render correct
      content directly
- [ ] `/dashboard/issues` redirects to `/dashboard/issues/list`
- [ ] `/dashboard/issues/list` and `/dashboard/issues/kanban` render correct
      content directly
- [ ] `/dashboard/agents` redirects to `/dashboard/agents/tasks`
- [ ] `/dashboard/agents/tasks`, `/agents/profiles`, `/agents/activity` render
      correct content directly (no more redirect stubs)
- [ ] Active tab is highlighted based on current pathname (not useState)
- [ ] Clicking a tab changes the URL
- [ ] Refreshing the page keeps the same tab
- [ ] Browser back/forward navigates between tabs
- [ ] Filters are preserved when switching between Issues tabs (list ↔ kanban)
- [ ] SharedFiltersBar persists visually across Issues tab switches (no
      remount/flicker)
- [ ] After a mutation (create/update issue), the list refreshes correctly

### Non-functional

- [ ] Each sub-route has a `loading.tsx` — tab strip remains visible during data
      load
- [ ] No `useState` in new tab nav components — active state from `usePathname`
      only
- [ ] `scroll={false}` on all tab Links
- [ ] All `revalidatePath` calls updated to sub-route paths
- [ ] No TypeScript errors (`npm run build` passes)
- [ ] No ESLint errors (`npm run lint` passes)

## Dependencies & Risks

**Risk: filtersVersion coordination in Issues** The current `filtersVersion`
counter increments inside `TasktrackerTabs` and is passed to both `IssuesPage`
and `KanbanBoard` as a prop. With sub-routes, this counter must live in the
layout. Next.js layouts cannot pass props to `children`. Options:

- Use a Zustand store or React Context to share `filtersVersion` between layout
  and sub-route pages
- Eliminate `filtersVersion` and rely on URL search params as the single source
  of truth for triggering re-fetches (preferred — simpler)

**Risk: SharedFiltersBar is currently not a standalone component** It is
rendered as a JSX node inside `TasktrackerTabs`. It will need to be extracted
and possibly converted to a Client Component that reads `useSearchParams`
directly.

**Risk: `AgentPageTabs` on task detail page is unrelated**
`app/dashboard/agents/tasks/[id]/page.tsx` uses `AgentPageTabs` for its own
intra-detail tabs (overview/runs/config/json). This component and its tabs are
unrelated to the main agents tab strip and must not be changed.

## References

### Internal — files to change

| File                                            | Change                                       |
| ----------------------------------------------- | -------------------------------------------- |
| `app/dashboard/agents/page.tsx`                 | Add `redirect('/dashboard/agents/tasks')`    |
| `app/dashboard/agents/tasks/page.tsx`           | Remove redirect, add real content            |
| `app/dashboard/agents/profiles/page.tsx`        | Remove redirect, add real content            |
| `app/dashboard/agents/activity/page.tsx`        | Remove redirect, add real content            |
| `app/dashboard/main/page.tsx`                   | Add `redirect('/dashboard/main/overview')`   |
| `app/dashboard/issues/page.tsx`                 | Add `redirect('/dashboard/issues/list')`     |
| `features/agents/ui/agents-tabs.tsx`            | Delete                                       |
| `features/main-dashboard/ui/dashboard-tabs.tsx` | Delete                                       |
| `features/issues/ui/tasktracker-tabs.tsx`       | Delete or gut                                |
| `features/agents/api/*.ts`                      | Update `revalidatePath`                      |
| `features/issues/api/*.ts`                      | Update `revalidatePath`                      |
| `shared/lib/routes.ts`                          | Add new constants, mark KANBAN as deprecated |

### Internal — files to create

| File                                                | Purpose                                 |
| --------------------------------------------------- | --------------------------------------- |
| `app/dashboard/agents/layout.tsx`                   | AgentsTabsNav                           |
| `app/dashboard/main/layout.tsx`                     | DashboardTabsNav                        |
| `app/dashboard/main/overview/page.tsx`              | Overview tab page                       |
| `app/dashboard/main/statistics/page.tsx`            | Statistics tab page                     |
| `app/dashboard/issues/layout.tsx`                   | SharedFiltersBar + IssuesTabsNav        |
| `app/dashboard/issues/list/page.tsx`                | Issues list tab page                    |
| `app/dashboard/issues/kanban/page.tsx`              | Kanban tab page                         |
| `features/agents/ui/agents-tabs-nav.tsx`            | New Link-based tab strip                |
| `features/main-dashboard/ui/dashboard-tabs-nav.tsx` | New Link-based tab strip                |
| `features/issues/ui/issues-tabs-nav.tsx`            | New Link-based tab strip (filter-aware) |
| `app/dashboard/agents/tasks/loading.tsx`            | Loading skeleton                        |
| `app/dashboard/agents/profiles/loading.tsx`         | Loading skeleton                        |
| `app/dashboard/agents/activity/loading.tsx`         | Loading skeleton                        |
| `app/dashboard/main/overview/loading.tsx`           | Loading skeleton                        |
| `app/dashboard/main/statistics/loading.tsx`         | Loading skeleton                        |
| `app/dashboard/issues/list/loading.tsx`             | Loading skeleton                        |
| `app/dashboard/issues/kanban/loading.tsx`           | Loading skeleton                        |
