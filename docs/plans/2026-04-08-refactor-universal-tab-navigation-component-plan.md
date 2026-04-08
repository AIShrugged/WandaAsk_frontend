---
title: 'refactor: Universal tab navigation component and standardization'
type: refactor
status: completed
date: 2026-04-08
---

# refactor: Universal tab navigation component and standardization

## Overview

The project currently has **4–5 independent tab implementations** with
inconsistent styling, activation logic, and accessibility. This plan introduces
a single shared `PageTabsNav` component in `shared/ui/`, migrates all existing
tab strips to use it, converts the remaining query-param–based tabs (Meetings,
Follow-up Analysis) to route-based sub-pages, and updates all agent system
prompts to enforce the pattern going forward.

## Problem Statement

### Current state

| Feature            | Component                          | Strategy                      | Non-standard issues                                        |
| ------------------ | ---------------------------------- | ----------------------------- | ---------------------------------------------------------- |
| Agents main        | `AgentsTabsNav`                    | Route-based (`usePathname`)   | One-off impl, duplicates styling                           |
| Issues             | `IssuesTabsNav`                    | Route-based (`usePathname`)   | Slightly different padding                                 |
| Main Dashboard     | `DashboardTabsNav`                 | Route-based (`usePathname`)   | Same pattern, 3rd copy                                     |
| Agent task detail  | `AgentPageTabs`                    | Query param (`?tab=`)         | Different visual style (button group), no `scroll={false}` |
| Meetings           | `MeetingsTabsNav` (inline in page) | Query param (`?tab=`)         | Plain `<a>` tags, server component, no `usePathname`       |
| Follow-up Analysis | `ButtonsRow` + `TabLink`           | Query param, `router.replace` | Two files, unnecessary indirection                         |

**Problems:**

1. **No shared component** — styling drift between 5 implementations
2. **Query-param tabs** don't get their own URL (not bookmarkable, no
   back-button)
3. **Meetings page** should be split into route-based sub-pages
   (`/meetings/list`, `/meetings/calendar`)
4. **Follow-up analysis** should use route-based sub-routes too
   (`/analysis/[id]/summary`, etc.)
5. **Agent task detail tabs** use a visually different "button group" style —
   this is acceptable for in-page detail views (not main page sections), but
   should be standardised to a reusable component
6. **Agent instructions** (`.claude/agents/*.md`) do not enforce any tab pattern

---

## Proposed Solution

### 1. Create `shared/ui/navigation/PageTabsNav`

A single reusable component covering the route-based (primary) use case:

```tsx
// shared/ui/navigation/page-tabs-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export interface PageTab {
  /** Canonical href for this tab (full path, no query string) */
  href: string;
  label: string;
  /** Match strategy. Default: 'startsWith'. Use 'exact' for sibling routes that share a prefix. */
  match?: 'startsWith' | 'exact';
}

interface Props {
  tabs: readonly PageTab[];
  /** If true, carry current URL search params onto every tab href (useful for shared filters). */
  preserveSearchParams?: boolean;
  className?: string;
}

export function PageTabsNav({
  tabs,
  preserveSearchParams = false,
  className,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = searchParams.toString();

  return (
    <div
      className={['flex gap-1 border-b border-border', className]
        .filter(Boolean)
        .join(' ')}
    >
      {tabs.map((tab) => {
        const isActive =
          tab.match === 'exact'
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
        const href =
          preserveSearchParams && params ? `${tab.href}?${params}` : tab.href;

        return (
          <Link
            key={tab.href}
            href={href}
            scroll={false}
            className={[
              'cursor-pointer px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
```

**Export from `shared/ui/index.ts`** so features import from `@/shared/ui`.

### 2. Migrate existing tabs to `PageTabsNav`

Replace the three feature-specific tab nav components with thin wrappers that
pass `tabs` to `PageTabsNav`:

```tsx
// features/agents/ui/agents-tabs-nav.tsx — after
'use client';
import { PageTabsNav } from '@/shared/ui';
import { ROUTES } from '@/shared/lib/routes';

const TABS = [
  { href: ROUTES.DASHBOARD.AGENT_TASKS, label: 'Tasks' },
  { href: ROUTES.DASHBOARD.AGENT_PROFILES, label: 'Profiles' },
  { href: ROUTES.DASHBOARD.AGENT_ACTIVITY, label: 'Activity' },
] as const;

export function AgentsTabsNav() {
  return <PageTabsNav tabs={TABS} />;
}
```

```tsx
// features/issues/ui/issues-tabs-nav.tsx — after
'use client';
import { PageTabsNav } from '@/shared/ui';
import { ROUTES } from '@/shared/lib/routes';

const TABS = [
  { href: ROUTES.DASHBOARD.ISSUES_LIST, label: 'Tasktracker' },
  { href: ROUTES.DASHBOARD.ISSUES_KANBAN, label: 'Kanban' },
] as const;

export function IssuesTabsNav() {
  return <PageTabsNav tabs={TABS} preserveSearchParams />;
}
```

```tsx
// features/main-dashboard/ui/dashboard-tabs-nav.tsx — after
'use client';
import { PageTabsNav } from '@/shared/ui';
import { ROUTES } from '@/shared/lib/routes';

const TABS = [
  {
    href: ROUTES.DASHBOARD.MAIN_OVERVIEW,
    label: 'Main',
    match: 'exact' as const,
  },
  {
    href: ROUTES.DASHBOARD.MAIN_STATISTICS,
    label: 'Statistics',
    match: 'exact' as const,
  },
] as const;

export function DashboardTabsNav() {
  return <PageTabsNav tabs={TABS} />;
}
```

### 3. Meetings page → route-based sub-pages

Convert `/dashboard/meetings` from query-param tabs to nested routes:

```
app/dashboard/meetings/
  layout.tsx        ← NEW: MeetingsTabsNav rendered here
  page.tsx          ← CHANGE: redirect('/dashboard/meetings/list')
  list/
    page.tsx        ← NEW: current "Meetings" tab content (MeetingsList)
    loading.tsx     ← NEW
  calendar/
    page.tsx        ← NEW: current "Calendar" tab content (CalendarPage)
    loading.tsx     ← NEW
  [id]/             ← unchanged
```

Create a new `features/meetings/ui/meetings-tabs-nav.tsx`:

```tsx
'use client';
import { PageTabsNav } from '@/shared/ui';
import { ROUTES } from '@/shared/lib/routes';

const TABS = [
  { href: ROUTES.DASHBOARD.MEETINGS_LIST, label: 'Meetings' },
  { href: ROUTES.DASHBOARD.MEETINGS_CALENDAR, label: 'Calendar' },
] as const;

export function MeetingsTabsNav() {
  return <PageTabsNav tabs={TABS} />;
}
```

Remove `MeetingsTabsNav` inline function from `app/dashboard/meetings/page.tsx`.
Remove `TABS`, `TabId`, and query-param reading from that file.

Add new routes:

```ts
// shared/lib/routes.ts
MEETINGS_LIST:     '/dashboard/meetings/list',
MEETINGS_CALENDAR: '/dashboard/meetings/calendar',
```

### 4. Follow-up Analysis detail → route-based sub-pages

Convert `/dashboard/follow-ups/analysis/[id]` to route-based sub-pages:

```
app/dashboard/follow-ups/analysis/[id]/
  layout.tsx       ← NEW: ButtonsRow (renamed) rendered here
  page.tsx         ← CHANGE: redirect to `.../summary`
  summary/
    page.tsx       ← NEW
    loading.tsx    ← NEW
  analysis/
    page.tsx       ← NEW
    loading.tsx    ← NEW
  transcript/
    page.tsx       ← NEW
    loading.tsx    ← NEW
  tasks/
    page.tsx       ← NEW
    loading.tsx    ← NEW
```

Replace `ButtonsRow` + `TabLink` with a new `FollowUpTabsNav` using
`PageTabsNav`:

```tsx
// features/meeting/ui/follow-up-tabs-nav.tsx
'use client';
import { useParams } from 'next/navigation';
import { PageTabsNav } from '@/shared/ui';

export function FollowUpTabsNav() {
  const { id } = useParams<{ id: string }>();
  const base = `/dashboard/follow-ups/analysis/${id}`;

  const TABS = [
    { href: `${base}/summary`, label: 'Overview' },
    { href: `${base}/analysis`, label: 'Follow-up' },
    { href: `${base}/transcript`, label: 'Transcript' },
    { href: `${base}/tasks`, label: 'Tasks' },
  ];

  return <PageTabsNav tabs={TABS} />;
}
```

Delete `features/meeting/ui/ButtonsRow.tsx`, `features/meeting/ui/TabLink.tsx`,
and `features/meeting/lib/options.ts` (if only used for tab keys).

### 5. Agent task detail — `AgentPageTabs` standardization

`AgentPageTabs` uses a visually distinct "segmented button group" style — this
is appropriate for in-detail-page views (not section navigation) and should be
kept as a separate component. However it must be moved from query-param approach
to route-based sub-routes.

```
app/dashboard/agents/tasks/[id]/
  layout.tsx       ← NEW: AgentPageTabs (as route-based nav)
  page.tsx         ← CHANGE: redirect to `.../overview`
  overview/
    page.tsx       ← NEW
  runs/
    page.tsx       ← NEW
  config/
    page.tsx       ← NEW
  json/
    page.tsx       ← NEW
```

`AgentPageTabs` will become a `PageTabsNav` variant with a `variant="segmented"`
prop (different visual style — button group instead of underline):

```tsx
// shared/ui/navigation/page-tabs-nav.tsx (extended)
interface Props {
  tabs: readonly PageTab[];
  preserveSearchParams?: boolean;
  className?: string;
  /** 'underline' (default): border-b active indicator; 'segmented': pill/button group */
  variant?: 'underline' | 'segmented';
}
```

Delete `features/agents/ui/agent-page-tabs.tsx`.

### 6. Update ROUTES constants

```ts
// shared/lib/routes.ts additions
MEETINGS_LIST:              '/dashboard/meetings/list',
MEETINGS_CALENDAR:          '/dashboard/meetings/calendar',
FOLLOW_UP_ANALYSIS_SUMMARY:     '/dashboard/follow-ups/analysis/:id/summary',
FOLLOW_UP_ANALYSIS_ANALYSIS:    '/dashboard/follow-ups/analysis/:id/analysis',
FOLLOW_UP_ANALYSIS_TRANSCRIPT:  '/dashboard/follow-ups/analysis/:id/transcript',
FOLLOW_UP_ANALYSIS_TASKS:       '/dashboard/follow-ups/analysis/:id/tasks',
```

> Note: dynamic ID routes cannot be static constants — use template literals at
> call sites or a builder function:
>
> ```ts
> ROUTES.DASHBOARD.followUpAnalysis = (id: string) =>
>   `/dashboard/follow-ups/analysis/${id}`;
> ```

### 7. Update agent system prompts

Add a **Tab Navigation** section to all relevant `.claude/agents/*.md` files:

````markdown
## Tab Navigation Convention

All tab switching in this project must follow the route-based pattern:

- Every tab is a **Next.js sub-route** (`/parent/tab-name/page.tsx`), NOT a
  `?tab=` query parameter or `useState` toggle
- The parent route redirects to the default tab with
  `redirect('/parent/default-tab')`
- The shared tab strip lives in `app/dashboard/<section>/layout.tsx`
- Use `PageTabsNav` from `@/shared/ui` for all tab strips — do NOT create
  feature-specific tab components unless wrapping `PageTabsNav`
- Feature wrapper pattern:
  ```tsx
  // features/<name>/ui/<name>-tabs-nav.tsx
  'use client';
  import { PageTabsNav } from '@/shared/ui';
  const TABS = [{ href: '...', label: '...' }, ...] as const;
  export function MyTabsNav() { return <PageTabsNav tabs={TABS} />; }
  ```
````

- `preserveSearchParams` on `PageTabsNav` only when filter params must survive
  tab switches (Issues-style)
- Each sub-route gets its own `loading.tsx` so the tab strip stays visible
  during data load
- `scroll={false}` is handled internally by `PageTabsNav` — do not add it
  manually
- Never use `<a href="?tab=...">`, `router.replace('?tab=...')`, or inline tab
  state in a page component

```

Agents to update: `mr-reviewer.md`, `frontend-architect.md`, `fsd-boundary-guard.md`.

---

## Implementation Phases

### Phase 1 — `shared/ui/navigation/PageTabsNav` (no regressions)

1. Create `shared/ui/navigation/page-tabs-nav.tsx` with `underline` + `segmented` variants
2. Export from `shared/ui/index.ts`
3. Migrate `AgentsTabsNav`, `IssuesTabsNav`, `DashboardTabsNav` to use `PageTabsNav`
4. Run `npm run build` + `npm run lint` — must pass

**Files:**
- CREATE: `shared/ui/navigation/page-tabs-nav.tsx`
- CHANGE: `shared/ui/index.ts` (add export)
- CHANGE: `features/agents/ui/agents-tabs-nav.tsx`
- CHANGE: `features/issues/ui/issues-tabs-nav.tsx`
- CHANGE: `features/main-dashboard/ui/dashboard-tabs-nav.tsx`

### Phase 2 — Meetings → route-based

1. Create `app/dashboard/meetings/layout.tsx` (renders `MeetingsTabsNav`)
2. Create `app/dashboard/meetings/list/page.tsx` + `loading.tsx`
3. Create `app/dashboard/meetings/calendar/page.tsx` + `loading.tsx`
4. Change `app/dashboard/meetings/page.tsx` to `redirect('/dashboard/meetings/list')`
5. Create `features/meetings/ui/meetings-tabs-nav.tsx`
6. Remove inline `MeetingsTabsNav` + tab code from page
7. Add `MEETINGS_LIST`, `MEETINGS_CALENDAR` to ROUTES

**Files:**
- CREATE: `app/dashboard/meetings/layout.tsx`
- CREATE: `app/dashboard/meetings/list/page.tsx`
- CREATE: `app/dashboard/meetings/list/loading.tsx`
- CREATE: `app/dashboard/meetings/calendar/page.tsx`
- CREATE: `app/dashboard/meetings/calendar/loading.tsx`
- CHANGE: `app/dashboard/meetings/page.tsx` (redirect)
- CREATE: `features/meetings/ui/meetings-tabs-nav.tsx`
- CHANGE: `shared/lib/routes.ts`

### Phase 3 — Follow-up Analysis → route-based

1. Create `app/dashboard/follow-ups/analysis/[id]/layout.tsx` (renders `FollowUpTabsNav`)
2. Create sub-route pages: `summary/`, `analysis/`, `transcript/`, `tasks/`
3. Change `app/dashboard/follow-ups/analysis/[id]/page.tsx` to redirect
4. Create `features/meeting/ui/follow-up-tabs-nav.tsx`
5. Delete `features/meeting/ui/ButtonsRow.tsx`
6. Delete `features/meeting/ui/TabLink.tsx`
7. Check `features/meeting/lib/options.ts` — delete if only used for tab keys

**Files:**
- CREATE: `app/dashboard/follow-ups/analysis/[id]/layout.tsx`
- CREATE: `app/dashboard/follow-ups/analysis/[id]/summary/page.tsx`
- CREATE: `app/dashboard/follow-ups/analysis/[id]/summary/loading.tsx`
- CREATE: `app/dashboard/follow-ups/analysis/[id]/analysis/page.tsx`
- CREATE: `app/dashboard/follow-ups/analysis/[id]/analysis/loading.tsx`
- CREATE: `app/dashboard/follow-ups/analysis/[id]/transcript/page.tsx`
- CREATE: `app/dashboard/follow-ups/analysis/[id]/transcript/loading.tsx`
- CREATE: `app/dashboard/follow-ups/analysis/[id]/tasks/page.tsx`
- CREATE: `app/dashboard/follow-ups/analysis/[id]/tasks/loading.tsx`
- CHANGE: `app/dashboard/follow-ups/analysis/[id]/page.tsx` (redirect)
- CREATE: `features/meeting/ui/follow-up-tabs-nav.tsx`
- DELETE: `features/meeting/ui/buttons-row.tsx`
- DELETE: `features/meeting/ui/TabLink.tsx`
- REVIEW+DELETE: `features/meeting/lib/options.ts`

### Phase 4 — Agent Task Detail → route-based

1. Create `app/dashboard/agents/tasks/[id]/layout.tsx`
2. Create sub-routes: `overview/`, `runs/`, `config/`, `json/`
3. Change `app/dashboard/agents/tasks/[id]/page.tsx` to redirect to `overview/`
4. Delete `features/agents/ui/agent-page-tabs.tsx`
5. Update `PageTabsNav` with `variant="segmented"` styling if needed

**Files:**
- CREATE: `app/dashboard/agents/tasks/[id]/layout.tsx`
- CREATE: `app/dashboard/agents/tasks/[id]/overview/page.tsx`
- CREATE: `app/dashboard/agents/tasks/[id]/runs/page.tsx`
- CREATE: `app/dashboard/agents/tasks/[id]/config/page.tsx`
- CREATE: `app/dashboard/agents/tasks/[id]/json/page.tsx`
- CHANGE: `app/dashboard/agents/tasks/[id]/page.tsx` (redirect)
- DELETE: `features/agents/ui/agent-page-tabs.tsx`

### Phase 5 — Update agent system prompts + cleanup

1. Add "Tab Navigation Convention" section to `.claude/agents/mr-reviewer.md`
2. Add same section to `.claude/agents/frontend-architect.md`
3. Add same section to `.claude/agents/fsd-boundary-guard.md`
4. Update CLAUDE.md conventions section with tab navigation rule
5. Verify no `ButtonsRow`, `TabLink`, `AgentPageTabs`, `MeetingsTabsNav` references remain
6. Run full `npm run build` + `npm run lint`

---

## Acceptance Criteria

### Functional

- [ ] `PageTabsNav` renders identically to the current `AgentsTabsNav`, `IssuesTabsNav`, `DashboardTabsNav`
- [ ] Meetings: `/dashboard/meetings` redirects to `/dashboard/meetings/list`
- [ ] Meetings: each tab has its own URL, is bookmarkable, browser back/forward works
- [ ] Follow-up Analysis: `/analysis/[id]` redirects to `/analysis/[id]/summary`
- [ ] Follow-up Analysis: each tab has its own URL
- [ ] Agent task detail: `/tasks/[id]` redirects to `/tasks/[id]/overview`
- [ ] Filter search params are preserved across Issues tab switches
- [ ] Active tab highlights correctly on page load (no flash of wrong active tab)

### Non-functional

- [ ] `PageTabsNav` is the ONLY tab strip component — no feature-specific styling duplicates
- [ ] All tab navigation is route-based — zero `?tab=` query params for tab switching
- [ ] No `useState` used for tab active state anywhere
- [ ] `ButtonsRow`, `TabLink`, `AgentPageTabs`, inline `MeetingsTabsNav` are deleted
- [ ] Each new sub-route has a `loading.tsx`
- [ ] `npm run build` passes with zero errors
- [ ] `npm run lint` passes with zero errors
- [ ] Agent prompts (`mr-reviewer`, `frontend-architect`, `fsd-boundary-guard`) contain tab convention

### Quality Gates

- [ ] No TypeScript `any` introduced
- [ ] No FSD boundary violations (cross-feature imports)
- [ ] `PageTabsNav` exported from `shared/ui/index.ts`

---

## Risk Analysis

**Risk: Meetings calendar preserves context** — The calendar tab on Meetings page
reads calendar events from the server. Moving to sub-route means the event fetch
moves to `calendar/page.tsx`. The `CalendarAttachedToast` and
`OnboardingTrigger` logic may need to stay in the layout or be re-evaluated.

**Risk: Follow-up `searchParams.tab` references** — Any code that reads
`searchParams.tab` to determine current tab in the follow-up analysis page must
be removed. Data fetching moves to each sub-route's own `page.tsx`.

**Risk: `options.ts` in meeting feature** — `features/meeting/lib/options.ts`
defines `available_tabs` constants. If these are used elsewhere (not just
`ButtonsRow`), they must be kept or their consumers migrated first.

**Risk: Agent task detail data** — The current `[id]/page.tsx` fetches all data
and passes props to tab components. Sub-routes must each fetch their own data
independently, or a shared layout must fetch shared data (e.g. agent task header)
while individual sub-pages fetch tab-specific data.

---

## References

### Internal files (key)

| File | Role |
|------|------|
| `features/agents/ui/agents-tabs-nav.tsx` | Migration target → wraps PageTabsNav |
| `features/issues/ui/issues-tabs-nav.tsx` | Migration target → wraps PageTabsNav |
| `features/main-dashboard/ui/dashboard-tabs-nav.tsx` | Migration target → wraps PageTabsNav |
| `features/agents/ui/agent-page-tabs.tsx` | Delete after Phase 4 |
| `features/meeting/ui/buttons-row.tsx` | Delete after Phase 3 |
| `features/meeting/ui/TabLink.tsx` | Delete after Phase 3 |
| `app/dashboard/meetings/page.tsx` | Inline `MeetingsTabsNav` — extract & convert |
| `app/dashboard/follow-ups/analysis/[id]/page.tsx` | Refactor to redirect |
| `app/dashboard/agents/tasks/[id]/page.tsx` | Refactor to redirect |
| `shared/lib/routes.ts` | Add new constants |
| `.claude/agents/mr-reviewer.md` | Add tab convention |
| `.claude/agents/frontend-architect.md` | Add tab convention |
| `.claude/agents/fsd-boundary-guard.md` | Add tab convention |

### Prior plans

- `docs/plans/2026-04-01-refactor-tab-navigation-route-based-plan.md` — previous
  refactor (agents/issues/main now complete). This plan extends that work to
  meetings, follow-ups, and agent detail pages.
- `docs/plans/2026-03-31-feat-shared-filters-tasktracker-kanban-tabs-plan.md` —
  filter sharing pattern that `preserveSearchParams` on `PageTabsNav` supports
```
