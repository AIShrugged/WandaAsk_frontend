---
title: 'refactor: Teams page — single-page layout with dropdown selector'
type: refactor
status: completed
date: 2026-04-13
---

# refactor: Teams page — single-page layout with dropdown selector

## Overview

Refactor `/dashboard/teams` from a redirect-hub + separate detail page into a
**single unified page** that:

1. Shows a **team selector dropdown** (`InputDropdown`) in the page header.
2. Persists the selected team in the URL as `?team_id=1` (bookmarkable,
   shareable, survives reload).
3. Renders all team content (KPIs, tabs, members, notifications) inline — no
   redirect to `/dashboard/teams/[id]`.
4. Provides an **"Add Team"** button in the page header that opens the create
   form.
5. Keeps existing dashboard tabs (Status, Readiness, People, Health, Risks)
   URL-driven via `?tab=status`, merged with `?team_id=`.

---

## Problem Statement / Motivation

**Current model is broken UX:**

- `/dashboard/teams` immediately redirects to `/dashboard/teams/[id]` — the URL
  changes, context is lost.
- Switching teams requires navigating back to the list, which redirects again.
- There is no way to bookmark "teams page" — the URL always becomes
  `/dashboard/teams/{id}`.
- The create-team flow navigates to a full separate page
  (`/dashboard/teams/create`), then redirects back.

**Goal:** One stable URL (`/dashboard/teams?team_id=1&tab=status`), team
switching via a dropdown, and an inline create flow — following the same pattern
used by `features/issues` for filter-based URL state management.

---

## Proposed Solution

### URL design

```
/dashboard/teams                    → redirect to /dashboard/teams?team_id={first}
/dashboard/teams?team_id=1          → shows team 1, default tab
/dashboard/teams?team_id=1&tab=people   → shows team 1, People tab
/dashboard/teams?team_id=2&tab=health   → shows team 2, Health tab
```

**Why `?team_id=` (query param) over `/teams/[id]` (path param):**

- Teams tab-switching already uses `?tab=` query params (pragmatic consistency).
- A query param lets the URL stay at `/dashboard/teams` while switching teams —
  no history stack noise.
- Consistent with the existing `?team_id=` usage in `TeamActions` /
  `TeamMemberAddForm`.
- Server Component can read `searchParams.team_id` directly, no client-side hook
  required.

> ⚠️ **Naming conflict:** `?team_id=` is already used by the add-member modal
> flow in `TeamActions` → `TeamMemberAddForm`. The modal reads
> `searchParams.get('team_id')`. After this refactor the param will also carry
> the "selected team". These two usages are semantically identical (both mean
> "which team are we operating on"), so **the conflict resolves itself** — the
> dropdown sets `?team_id=` and the modal reads the same value. Verify this
> works in all flows.

### Page header anatomy

```
┌────────────────────────────────────────────────────────┐
│  [InputDropdown: Team selector ▼]      [+ Add Team]    │
├────────────────────────────────────────────────────────┤
│  Team KPIs row                                         │
│  Upcoming meeting banner                               │
│  [Status] [Readiness] [People] [Health] [Risks] ← tabs │
│  Tab content panel                                     │
│  Members grid                                          │
│  Notification settings                                 │
└────────────────────────────────────────────────────────┘
```

---

## Technical Approach

### Architecture

**`app/dashboard/teams/page.tsx` — Server Component (becomes the single entry)**

```tsx
// app/dashboard/teams/page.tsx
import { getTeams, getTeam, getTeamDashboard } from '@/features/teams/api/team';
import { TeamsPageClient } from '@/features/teams/ui/teams-page-client';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/shared/lib/routes';

interface Props {
  searchParams: Promise<{ team_id?: string; tab?: string }>;
}

export default async function TeamsPage({ searchParams }: Props) {
  const { team_id, tab } = await searchParams;

  const teams = await getTeams();

  if (teams.length === 0) {
    // No teams yet — show empty state with create button (client)
    return <TeamsEmptyState />;
  }

  // Redirect to first team if no team_id in URL
  const resolvedTeamId = team_id ? Number(team_id) : teams[0].id;
  if (!team_id) {
    redirect(`${ROUTES.DASHBOARD.TEAMS}?team_id=${resolvedTeamId}`);
  }

  // Parallel fetch: team detail + dashboard data
  const [team, dashboard] = await Promise.all([
    getTeam(resolvedTeamId),
    getTeamDashboard(resolvedTeamId),
  ]);

  return (
    <TeamsPageClient
      teams={teams}
      team={team}
      dashboard={dashboard}
      initialTab={tab ?? 'status'}
    />
  );
}
```

**`features/teams/ui/teams-page-client.tsx` — Client Component (selector +
content)**

Holds the `InputDropdown` for team selection and drives the URL update. Does NOT
own async data — all data comes from the Server Component as props.

```tsx
'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { InputDropdown } from '@/shared/ui/input/InputDropdown';

// Props
interface TeamsPageClientProps {
  teams: TeamProps[];
  team: TeamProps;
  dashboard: TeamDashboardData;
  initialTab: string;
}
```

On dropdown `onChange`:

```ts
const params = new URLSearchParams(searchParams.toString());
params.set('team_id', newTeamId);
params.delete('tab'); // reset tab on team switch
router.replace(`${pathname}?${params.toString()}`);
```

**Tab switching in `TeamDashboardTabs`** — fix the current URL-blowing bug:

```ts
// ❌ Current (blows away team_id)
router.push(`${pathname}?tab=${key}`);

// ✅ Fixed (merges params)
const params = new URLSearchParams(searchParams.toString());
params.set('tab', key);
router.push(`${pathname}?${params.toString()}`);
```

**"Add Team" button** — opens a modal (new `TeamCreateModal`) instead of
navigating to `/dashboard/teams/create`. On success, replaces URL to
`?team_id={newId}` and invalidates teams list.

### New files

| File                                      | Purpose                                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `features/teams/ui/teams-page-client.tsx` | Client wrapper: dropdown selector + layout                                         |
| `features/teams/ui/team-create-modal.tsx` | Modal wrapping `TeamCreateForm` (replace navigation with modal close + URL update) |
| `features/teams/ui/teams-header.tsx`      | Header bar: InputDropdown + "+ Add Team" button                                    |
| `features/teams/ui/teams-empty-state.tsx` | Empty state when `teams.length === 0`                                              |

### Modified files

| File                                        | Change                                                                       |
| ------------------------------------------- | ---------------------------------------------------------------------------- |
| `app/dashboard/teams/page.tsx`              | Full rewrite — becomes single page described above                           |
| `features/teams/ui/team-dashboard-tabs.tsx` | Fix `router.push` to merge `?tab=` with existing params                      |
| `features/teams/ui/team-create-form.tsx`    | Add `onSuccess?: (teamId: number) => void` callback prop for modal mode      |
| `shared/lib/routes.ts`                      | Add `TEAMS_CREATE: '/dashboard/teams/create'` constant (for backward compat) |

### Preserved / unchanged

| File                                               | Reason                                                                             |
| -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `app/dashboard/teams/[id]/page.tsx`                | Keep alive for direct-link backward compat; optionally redirect to `?team_id={id}` |
| `app/dashboard/teams/create/page.tsx`              | Keep alive for direct-link backward compat                                         |
| `features/teams/ui/team-members.tsx`               | Used as-is inside `TeamsPageClient`                                                |
| `features/teams/ui/team-notification-settings.tsx` | Used as-is inside `TeamsPageClient`                                                |
| `features/teams/api/team.ts`                       | No API changes needed                                                              |

---

## Implementation Phases

### Phase 1 — Fix `TeamDashboardTabs` URL merging (smallest change, needed by all phases)

1. Open `features/teams/ui/team-dashboard-tabs.tsx`
2. Import `useSearchParams`
3. Replace `router.push(\`${pathname}?tab=${key}\`)` with params-merge pattern
4. Add `scroll={false}` to tab links if using `<Link>` or use `router.replace`

**Files:** `features/teams/ui/team-dashboard-tabs.tsx`

---

### Phase 2 — Extract `TeamsHeader` and `TeamsPageClient`

1. Create `features/teams/ui/teams-header.tsx`:
   - Receives `teams: TeamProps[]`, `selectedTeamId: number`,
     `onTeamChange: (id: number) => void`
   - Renders `InputDropdown` with
     `options = teams.map(t => ({ value: String(t.id), label: t.name }))`
   - Renders "+ Add Team" button (just a placeholder for now, wires up in
     Phase 3)

2. Create `features/teams/ui/teams-page-client.tsx`:
   - Client Component
   - Receives `teams`, `team`, `dashboard`, `initialTab` from server
   - Renders `TeamsHeader` + the full detail content (KPIs, tabs, members,
     notifications)
   - On dropdown change → `router.replace` with new `?team_id=`
   - On tab change → delegate to `TeamDashboardTabs` (already fixed in Phase 1)

3. Create `features/teams/ui/teams-empty-state.tsx`:
   - Shows "No teams yet" + "+ Create your first team" button

**Files:** New `teams-header.tsx`, `teams-page-client.tsx`,
`teams-empty-state.tsx`

---

### Phase 3 — Rewrite `app/dashboard/teams/page.tsx`

1. Remove the current redirect-to-`[id]` logic
2. Fetch all teams + selected team + dashboard in parallel
3. If no teams → render `TeamsEmptyState`
4. If no `?team_id=` → `redirect()` to first team
5. Render `TeamsPageClient` with fetched data

**Files:** `app/dashboard/teams/page.tsx`

---

### Phase 4 — Create Team modal

1. Add `onSuccess?: (teamId: number) => void` prop to `TeamCreateForm`
2. Create `features/teams/ui/team-create-modal.tsx`:
   - Uses existing modal pattern (see `team-member-add-modal.tsx`)
   - On form `onSuccess` → close modal, call
     `revalidatePath('/dashboard/teams')`, update URL to new team
3. Wire "+ Add Team" button in `TeamsHeader` to open this modal

**Files:** New `team-create-modal.tsx`; modified `team-create-form.tsx`,
`teams-header.tsx`

---

### Phase 5 — Backward compat cleanup

1. `app/dashboard/teams/[id]/page.tsx` → add redirect:
   `redirect(\`${ROUTES.DASHBOARD.TEAMS}?team_id=${id}\`)`
2. `app/dashboard/teams/create/page.tsx` → add redirect:
   `redirect(ROUTES.DASHBOARD.TEAMS)`
3. Update `app/dashboard/teams/loading.tsx` to match new single-page skeleton

---

## Acceptance Criteria

- [x] `/dashboard/teams` without params redirects to `?team_id={firstTeamId}`
      automatically
- [x] Selecting a different team in the dropdown updates the URL to
      `?team_id={newId}` and re-renders content
- [x] Switching tabs preserves `?team_id=` in the URL (no param loss)
- [x] Switching teams resets `?tab=` to default (`status`)
- [x] "+ Add Team" button opens a modal (no full-page navigation)
- [x] After creating a team via modal, URL updates to `?team_id={newTeamId}`
- [x] If no teams exist, empty state is shown with a create button
- [x] Old URLs `/dashboard/teams/{id}` still work (redirect to single page)
- [x] `?team_id=` in the add-member modal flow still works correctly
- [x] `loading.tsx` provides meaningful skeleton for the new single-page layout
- [x] All TypeScript strict-mode, no `any`, no ESLint violations

---

## Dependencies & Risks

### Dependencies

- `InputDropdown` from `shared/ui/input/InputDropdown.tsx` — ready to use
- `TeamCreateForm` — needs minor modification (add `onSuccess` callback)
- `TeamDashboardTabs` — needs URL merge fix (Phase 1)
- `getTeams` action — currently uses raw `fetch`. Consider migrating to
  `httpClient` before Phase 3 (or accept tech debt)

### Risks

| Risk                                                                | Mitigation                                                                                                                                                 |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `?team_id=` naming collision with add-member modal                  | Semantics are identical — same team. Verify modal only renders when team is already selected. If collision found, rename modal param to `?invite_team_id=` |
| `getTeams` is raw fetch (not `httpClient`)                          | Either migrate in this PR or isolate risk by wrapping the call                                                                                             |
| Server Component re-renders on URL change                           | Next.js SSR re-runs on each navigation to `?team_id=`. This is correct behavior. Add `loading.tsx` to handle suspense.                                     |
| `TeamDashboardTabs` uses `router.push` (adds history entry per tab) | Fix in Phase 1 to use `router.replace` with merged params                                                                                                  |
| `[id]/page.tsx` had deep internal tab state                         | All that logic moves to `TeamsPageClient`. Ensure `initialTab` prop is correctly seeded from `searchParams.tab`                                            |

---

## References

### Internal

- `app/dashboard/teams/page.tsx` — current redirect hub (replace entirely)
- `app/dashboard/teams/[id]/page.tsx` — current detail page (source of truth for
  content to migrate)
- `features/teams/ui/team-dashboard-tabs.tsx` — tab component to fix (URL merge
  bug)
- `features/teams/ui/team-actions.tsx` — existing `?team_id=` write pattern
  (reference)
- `features/teams/ui/team-member-add-form.tsx` — existing `?team_id=` read
  pattern (verify no conflict)
- `features/issues/ui/issues-layout-client.tsx` — best reference for URL-driven
  filter state
- `shared/ui/input/InputDropdown.tsx` — dropdown component to use for team
  selector
- `features/organization/ui/organization-dropdown.tsx` — reference for "active
  item + create button" dropdown pattern
- `shared/lib/routes.ts` — add `TEAMS_CREATE` constant

### Plans

- `docs/plans/2026-04-01-refactor-tab-navigation-route-based-plan.md` — tab
  routing conventions
- `docs/plans/2026-03-31-feat-shared-filters-tasktracker-kanban-tabs-plan.md` —
  filter-above-tabs pattern
