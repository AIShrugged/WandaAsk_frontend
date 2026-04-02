---
title: 'feat: Redesign /dashboard/main/overview — 4-block layout'
type: feat
status: active
date: 2026-04-02
---

# feat: Redesign `/dashboard/main/overview` — 4-block layout

## Overview

Reduce the overview page from 10+ scattered blocks to 4 focused,
information-dense blocks:

1. **Meetings** — unified full-width list (Today / Tomorrow / Earlier), join
   link for active calls, detail nav for completed
2. **Upcoming Agenda** — keep existing `UpcomingAgendasBlock` as-is, wire
   missing API call
3. **Issues** — open + in_progress issues sorted by `created_at desc`, with
   day/week/month stats
4. **Agent Tasks** — task list with link to detail + "Pending approvals"
   sub-section (agent questions awaiting user action)

## Problem Statement

The current overview page renders 10+ blocks (`GreetingBlock`,
`KpiOverviewBlock`, `ChartsBlock`, `AgentRecommendationsBlock`,
`TopParticipantsBlock`, `AgentActivityStatsBlock`, `NextMeetingPrepBlock`,
`MeetingsTodayBlock`, `MeetingsTomorrowBlock`, `LastMeetingBlock`). This creates
visual noise and makes the page slow due to many parallel API calls. The page
needs to be focused on actionable items only.

## Proposed Solution

Replace all existing blocks with the 4 new blocks. Remove unused
`Promise.allSettled` API calls from `getMainDashboardData()` to cut page load
overhead. Each new block maps to an already-existing data source or a small
addition.

---

## Technical Approach

### Data Model Changes (`features/main-dashboard/model/types.ts`)

**Current `MainDashboardData`:**

```ts
// features/main-dashboard/model/types.ts
interface MainDashboardData {
  user: { id: number; name: string; email: string } | null;
  todayEvents: EventProps[];
  tomorrowEvents: EventProps[];
  lastMeeting: EventProps | null; // ← replace with pastEvents[]
  agentTasks: AgentTask[];
  summary: DashboardApiResponse | null; // ← remove (block deleted)
  agentStats: AgentStats; // ← remove (block deleted)
  recentAgentActivity: AgentActivityItem[]; // ← remove (block deleted)
  agentActivityTotal: number; // ← remove (block deleted)
  canManageAgents: boolean;
  upcomingAgenda: UpcomingAgenda | null; // ← keep for NextMeetingPrepBlock removal; delete
  latestMeetingTasks: LatestMeetingTasksData; // ← remove (block deleted)
}
```

**New `MainDashboardData`:**

```ts
// features/main-dashboard/model/types.ts
interface MainDashboardData {
  user: { id: number; name: string; email: string } | null;
  todayEvents: EventProps[];
  tomorrowEvents: EventProps[];
  pastEvents: EventProps[]; // all past events from fetched batch (replaces lastMeeting)
  agentTasks: AgentTask[];
  canManageAgents: boolean;
  agendas: MeetingAgenda[]; // NEW — from getMyAgendas()
  issues: Issue[]; // NEW — open + in_progress, sorted created_at desc
}
```

### API Changes (`features/main-dashboard/api/main-dashboard.ts`)

**Remove** from `Promise.allSettled`:

- `getSummaryData()` — feeds deleted blocks only
- `getAgentActivity()` — feeds deleted blocks only
- `deriveAgentStats()` — feeds deleted blocks only
- `getUpcomingAgenda()` — feeds deleted `NextMeetingPrepBlock`
- `getLatestMeetingTasks()` — feeds deleted `NextMeetingPrepBlock`

**Add** to `Promise.allSettled`:

- `getMyAgendas()` — already exists in `features/main-dashboard/api/agendas.ts`
- `getIssues({ status: ['open', 'in_progress'], sort: 'created_at', order: 'desc', limit: 20 })`
  — from `features/issues/api/issues.ts`

**Change** event derivation:

```ts
// Inside getMainDashboardData()
// Before: lastMeeting = allEvents.find(...)
// After: pastEvents = allEvents.filter(e => new Date(e.ends_at) < now)
const pastEvents = allEvents
  .filter((e) => new Date(e.ends_at) < now)
  .sort(
    (a, b) => new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime(),
  );
```

> ⚠️ **Issue stats panel**: the backend has no `GET /issues/stats` endpoint and
> `IssueController.index` has no date-range filter. The stats sub-section
> (day/week/month: created/closed/done) is **deferred to a follow-up** pending
> backend work. Block 3 ships as a list-only view in this iteration. A comment
> placeholder can be added to the component.

> ⚠️ **Pending approvals**: the backend has no approval concept on
> `AgentTaskRun`. The `handoff` field is `unknown` and not surfaced in
> `AgentTaskRunResource`. Block 4 ships with an unconditional "No pending
> approvals" empty state. The UI shell is wired up so it can be activated once
> the backend contract is defined.

---

## Block Specifications

### Block 1 — Unified Meetings List

**Component:** `features/main-dashboard/ui/meetings-block.tsx` (new, replaces
`meetings-today-block.tsx`, `last-meeting-block.tsx`)

**Props:**

```ts
interface MeetingsBlockProps {
  todayEvents: EventProps[];
  tomorrowEvents: EventProps[];
  pastEvents: EventProps[];
}
```

**Meeting classification** (computed inside component, not server-side):

```ts
// Active: meeting is happening right now
const isActive = (e: EventProps) => {
  const now = new Date();
  return new Date(e.starts_at) <= now && new Date(e.ends_at) >= now;
};
// Upcoming: starts in the future
const isUpcoming = (e: EventProps) => new Date(e.starts_at) > new Date();
// Completed: ended in the past
const isCompleted = (e: EventProps) => new Date(e.ends_at) < new Date();
```

**Row behavior:** | Meeting state | Row click | Action button | |---|---|---| |
Active (now in-progress) | Navigate to `/dashboard/meeting/[id]` | "Join" →
opens `event.url` in new tab (only if `event.url` is non-empty) | | Upcoming
(future) | No navigation | None | | Completed (past) | Navigate to
`/dashboard/meeting/[id]` | None |

**Grouping:**

- "Today" → `todayEvents`
- "Tomorrow" → `tomorrowEvents`
- "Earlier" → `pastEvents`
- Each group is hidden if its array is empty
- If all three arrays are empty → show "No meetings scheduled" empty state

**`has_summary` treatment:** show a subtle "Summary available" badge on
completed meeting rows where `event.has_summary === true`. Completed rows
without a summary show no badge.

**Item cap:** show all items in Today and Tomorrow groups. Cap "Earlier" at 5
items with a "View all in Calendar →" link to `/dashboard/calendar`.

**Timezone note:** day grouping runs on the server using `new Date()` (server
timezone). This is acceptable for now. If user timezone support is needed, add
`user.timezone` to `getUser()` response — deferred.

---

### Block 2 — Upcoming Agenda

**Component:** `features/main-dashboard/ui/upcoming-agendas-block.tsx`
(existing, no changes)

**Props:** `{ agendas: MeetingAgenda[] }`

**Change required:** Add `getMyAgendas()` call to `getMainDashboardData()` and
add `agendas: MeetingAgenda[]` to `MainDashboardData`. No component changes.

**Empty state:** already handled by `UpcomingAgendasBlock`.

---

### Block 3 — Issues List

**Component:** `features/main-dashboard/ui/issues-block.tsx` (new)

**Props:**

```ts
interface IssuesBlockProps {
  issues: Issue[];
}
```

**Display:**

- Header label: `"Open & In Progress Issues"` (subtitle:
  `"Sorted by newest first"`)
- Issue row fields: issue title, status badge (`open` → blue, `in_progress` →
  amber), `created_at` formatted as relative time (e.g. "2h ago")
- Each row links to `${ROUTES.DASHBOARD.ISSUES}/${issue.id}`
- Cap: show first 10 items; if `issues.length > 10` show "View all issues →"
  link to `/dashboard/issues`
- Empty state: `"No open or in-progress issues"`

**Stats panel (deferred):**

```tsx
{
  /* TODO: Issue stats — deferred pending GET /api/v1/issues/stats backend endpoint */
}
{
  /* Will show: Created / Closed / Done counts for Today / This Week / This Month */
}
```

**Data fetch:**
`getIssues({ status: ['open', 'in_progress'], sort: 'created_at', order: 'desc', limit: 20 })`
— note: verify whether `features/issues/api/issues.ts` `getIssues()` accepts an
array for `status` or requires separate calls (read the function signature
before implementing; make two calls and merge if needed).

---

### Block 4 — Agent Tasks + Pending Approvals

**Component:** `features/main-dashboard/ui/agent-tasks-block.tsx` (update
existing)

**Props:**

```ts
interface AgentTasksBlockProps {
  tasks: AgentTask[];
  canManageAgents: boolean;
  // pendingApprovals: AgentApproval[]; — deferred
}
```

**Sections:**

**4a — Pending Approvals (new sub-section, shown first):**

```tsx
<section>
  <h3>Pending Approvals</h3>
  {/* TODO: Wire to backend approval API once contract is defined */}
  {/* Backend gap: AgentTaskRun has no "awaiting_approval" status; handoff field is unknown */}
  <EmptyState message='No pending approvals' />
</section>
```

**4b — Agent Tasks list:**

- Keep existing rendering: task name, enabled badge, `latest_run_status`, links
  to `${ROUTES.DASHBOARD.AGENT_TASKS}/${task.id}`
- Cap: 6 items (existing behavior)
- "View all tasks →" link to `/dashboard/agents/tasks`
- Empty state: "No agent tasks configured"

---

## Page Layout (`app/dashboard/main/overview/page.tsx`)

```tsx
// app/dashboard/main/overview/page.tsx
export const metadata = { title: 'Overview' };

export default async function OverviewPage() {
  const data = await getMainDashboardData();

  return (
    <div className='flex flex-col gap-5 p-2'>
      {/* Block 1 — Meetings */}
      <MeetingsBlock
        todayEvents={data.todayEvents}
        tomorrowEvents={data.tomorrowEvents}
        pastEvents={data.pastEvents}
      />

      {/* Block 2 — Upcoming Agenda */}
      <UpcomingAgendasBlock agendas={data.agendas} />

      {/* Block 3 — Issues */}
      <IssuesBlock issues={data.issues} />

      {/* Block 4 — Agent Tasks + Approvals */}
      <AgentTasksBlock
        tasks={data.agentTasks}
        canManageAgents={data.canManageAgents}
      />
    </div>
  );
}
```

---

## Acceptance Criteria

### Functional Requirements

- [ ] Page renders exactly 4 blocks; all other blocks removed
- [ ] **Block 1**: Today / Tomorrow / Earlier groups, each hidden when empty;
      global empty state when all empty
- [ ] **Block 1**: Active meeting rows show "Join" button only when `event.url`
      is non-empty; button opens URL in new tab
- [ ] **Block 1**: Completed meeting rows navigate to `/dashboard/meeting/[id]`
      on click
- [ ] **Block 1**: Upcoming meeting rows show time but no navigation or action
      button
- [ ] **Block 1**: `has_summary` badge shown on completed meeting rows
- [ ] **Block 1**: "Earlier" group capped at 5 items with "View all in Calendar"
      link
- [ ] **Block 2**: `UpcomingAgendasBlock` renders correctly with
      `MeetingAgenda[]` from `getMyAgendas()`
- [ ] **Block 3**: Shows only `status=open` and `status=in_progress` issues
- [ ] **Block 3**: Sorted by `created_at` descending (newest first)
- [ ] **Block 3**: Header clearly labels which issues are shown
- [ ] **Block 3**: Issue rows link to `/dashboard/issues/[id]`
- [ ] **Block 3**: Capped at 10 items with "View all issues" link
- [ ] **Block 3**: Stats panel shows TODO comment (deferred)
- [ ] **Block 4**: Agent task list renders (up to 6), each links to
      `/dashboard/agents/tasks/[id]`
- [ ] **Block 4**: "Pending approvals" sub-section shown with "No pending
      approvals" empty state
- [ ] Removed blocks leave no dead code (unused imports, unused API calls in
      `getMainDashboardData`)
- [ ] Page server load time improves (fewer `Promise.allSettled` calls)

### Non-Functional Requirements

- [ ] All UI text in English
- [ ] Server Component by default; `'use client'` only for interactive sub-parts
- [ ] No raw `fetch` — use `httpClient` / `httpClientList` from
      `shared/lib/httpClient`
- [ ] TypeScript strict — no `any`
- [ ] FSD boundaries respected: new `IssuesBlock` in
      `features/main-dashboard/ui/`, imports `Issue` type from
      `features/issues/` public API via `index.ts`
- [ ] `getIssues` imported from `features/issues` public API (not deep path)

---

## Implementation Plan

### Phase 1 — Data Layer Cleanup

1. **`features/main-dashboard/model/types.ts`** — update `MainDashboardData`:
   - Replace `lastMeeting: EventProps | null` with `pastEvents: EventProps[]`
   - Remove: `summary`, `agentStats`, `recentAgentActivity`,
     `agentActivityTotal`, `upcomingAgenda`, `latestMeetingTasks`
   - Add: `agendas: MeetingAgenda[]`, `issues: Issue[]`

2. **`features/main-dashboard/api/main-dashboard.ts`** — update
   `getMainDashboardData()`:
   - Remove: `getSummaryData()`, `getAgentActivity()`, `getUpcomingAgenda()`,
     `getLatestMeetingTasks()`
   - Add: `getMyAgendas()`,
     `getIssues({ status: ['open', 'in_progress'], sort: 'created_at', order: 'desc', limit: 20 })`
   - Change: `lastMeeting` derivation → `pastEvents` (filter + sort by ends_at
     desc)
   - Verify: `getIssues` parameter shape for multi-status (may need two calls +
     merge)

3. **`features/main-dashboard/index.ts`** — update exports to remove deleted
   block exports, add new ones

### Phase 2 — New Components

4. **`features/main-dashboard/ui/meetings-block.tsx`** (new) — unified meetings
   list (replaces `meetings-today-block.tsx`, `last-meeting-block.tsx`)

5. **`features/main-dashboard/ui/issues-block.tsx`** (new) — issues list with
   empty stats placeholder

6. **`features/main-dashboard/ui/agent-tasks-block.tsx`** (update) — add
   "Pending Approvals" sub-section above task list

### Phase 3 — Page Assembly

7. **`app/dashboard/main/overview/page.tsx`** — replace all 10 blocks with 4 new
   ones

### Phase 4 — Cleanup

8. Delete unused block files:
   - `features/main-dashboard/ui/meetings-today-block.tsx`
   - `features/main-dashboard/ui/last-meeting-block.tsx`
   - `features/main-dashboard/ui/kpi-overview-block.tsx`
   - `features/main-dashboard/ui/charts-block.tsx`
   - `features/main-dashboard/ui/charts-block-loader.tsx`
   - `features/main-dashboard/ui/agent-recommendations-block.tsx`
   - `features/main-dashboard/ui/agent-activity-stats-block.tsx`
   - `features/main-dashboard/ui/top-participants-block.tsx`
   - `features/main-dashboard/ui/next-meeting-prep-block.tsx`
   - `features/main-dashboard/ui/greeting-block.tsx`

9. Check `features/main-dashboard/lib/derive-agent-stats.ts` — remove if only
   used by deleted blocks

---

## Dependencies & Risks

| Dependency                          | Status                                                       | Risk                               |
| ----------------------------------- | ------------------------------------------------------------ | ---------------------------------- |
| `EventProps` types                  | Exists (`entities/event/model/types.ts`)                     | Low                                |
| `AgentTask` types                   | Exists (`features/agents/model/types.ts`)                    | Low                                |
| `MeetingAgenda` types               | Exists (`features/main-dashboard/model/agenda-types.ts`)     | Low                                |
| `Issue` types                       | Exists (`features/issues/model/types.ts`)                    | Low                                |
| `getMyAgendas()`                    | Exists, not wired                                            | Low                                |
| `getIssues()` multi-status support  | Needs verification — `status` param may be single value only | Medium — may need 2 calls          |
| Issue stats panel                   | **No backend endpoint**                                      | Deferred to follow-up sprint       |
| Agent approval API                  | **No backend concept exists**                                | Deferred — placeholder UI only     |
| Issues `getIssues` uses raw `fetch` | Violates `httpClient` convention                             | Medium — fix during implementation |
| Timezone in day grouping            | Server-side, not user-aware                                  | Low — acceptable for now           |

---

## Follow-up Work (Out of Scope)

- **Issue stats endpoint**: Request backend to add
  `GET /api/v1/issues/stats?period=day|week|month` returning
  `{ created: number, closed: number, done: number }`. Once available, add
  `IssueStatsBlock` inside `IssuesBlock`.
- **Agent approval contract**: Define `AgentApproval` interface with backend
  team. Once backend surfaces `handoff` data in `AgentTaskRunResource`, wire up
  `pendingApprovals: AgentApproval[]` in `getMainDashboardData()` and remove the
  hardcoded empty state.
- **Timezone-aware day grouping**: Add `timezone: string` to user profile
  response and pass to `getMainDashboardData()` for correct Today/Tomorrow
  computation.

---

## References

### Internal

- `app/dashboard/main/overview/page.tsx` — current page (10+ blocks)
- `features/main-dashboard/api/main-dashboard.ts` — `getMainDashboardData()`
- `features/main-dashboard/model/types.ts` — `MainDashboardData`
- `features/main-dashboard/ui/meetings-today-block.tsx` — reference for meeting
  row UI
- `features/main-dashboard/ui/last-meeting-block.tsx` — reference for completed
  meeting row + detail link
- `features/main-dashboard/ui/agent-tasks-block.tsx` — existing agent tasks
  block
- `features/main-dashboard/ui/upcoming-agendas-block.tsx` — keep as-is
- `features/main-dashboard/api/agendas.ts` — `getMyAgendas()`
- `features/issues/api/issues.ts` — `getIssues()` (verify multi-status param
  shape)
- `features/issues/model/types.ts` — `Issue`, `IssueStatus`
- `features/agents/model/types.ts` — `AgentTask`, `AgentTaskRun`
- `entities/event/model/types.ts` — `EventProps`
- `shared/lib/routes.ts` — `ROUTES.DASHBOARD.*`
