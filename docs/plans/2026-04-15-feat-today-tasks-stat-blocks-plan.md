---
title:
  'feat: Today Tasks — Stat Blocks (Total / In Progress / Completed / Overdue)'
type: feat
status: active
date: 2026-04-15
---

# feat: Today Tasks — Stat Blocks (Total / In Progress / Completed / Overdue)

## Overview

Add four horizontal stat cards under the **Tasks** heading on
`app/dashboard/today/tasks/page.tsx`. Each card shows a labelled count with a
colour-coded icon. Below the count an optional **delta** line shows the change
vs. the previous day when that data is available.

The feature reuses data already returned by `GET /api/v1/me/today` — no new
backend endpoint is required. All four values are derived server-side from the
`TodayBriefing` DTO.

---

## Problem Statement / Motivation

The Tasks page shows detailed task lists but gives no at-a-glance summary of the
user's workload. Adding stat blocks answers "how many tasks do I have right
now?" instantly, without reading the lists, and highlights overdue items that
need attention.

---

## Proposed Solution

### Data derivation (from existing `TodayBriefing`)

All computations happen in a pure helper function — no extra fetch, no state.

| Stat             | Source fields                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| **Total active** | `carried_tasks.length` + `waiting_on_you.length` + non-done `MeetingTask` across all events                     |
| **In progress**  | `carried_tasks` where `status === 'in_progress'` + `MeetingTask` across events where `status === 'in_progress'` |
| **Completed**    | `events[].done_tasks_count` summed across all events                                                            |
| **Overdue**      | `MeetingTask` across all events where `is_overdue === true`                                                     |

> **Note on `waiting_on_you`:** `WaitingTask` has no `status` field, so it
> contributes only to the Total count, not to In Progress.

> **Note on delta:** `TodayBriefing` has no prior-day data. The delta row is
> rendered only if a `delta` prop is supplied; otherwise it is omitted. A future
> enhancement can persist yesterday's counts in `sessionStorage` client-side (or
> via a backend endpoint) to populate the delta. For the MVP the delta slots are
> omitted — the design preserves the space for a later iteration.

---

## Technical Approach

### Architecture

This is a **pure Server Component** — it accepts `data: TodayBriefing`, derives
counts, and renders four stat cards. No `'use client'`, no state, no side
effects.

```
features/today-briefing/
  model/
    task-stats.ts          ← pure helper: computeTaskStats(data: TodayBriefing) → TaskStats
  ui/
    task-stats-block.tsx   ← Server Component: grid of 4 stat cards
  index.ts                 ← re-export TaskStatsBlock
```

The inner `StatCard` component is kept **private** inside `task-stats-block.tsx`
(same pattern as `DashboardStats.tsx` — no need to extract to `shared/ui/` for a
single use case).

### File-by-file plan

#### 1. `features/today-briefing/model/task-stats.ts` ← new

Pure computation helper. No React, no imports from `shared/`.

```ts
import type { TodayBriefing } from './types';

export interface TaskStats {
  totalActive: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export function computeTaskStats(data: TodayBriefing): TaskStats {
  // carried tasks
  const carriedInProgress = data.carried_tasks.filter(
    (t) => t.status === 'in_progress',
  ).length;

  // meeting tasks (flat across all events)
  const allMeetingTasks = data.events.flatMap((e) => e.tasks);
  const meetingInProgress = allMeetingTasks.filter(
    (t) => t.status === 'in_progress',
  ).length;
  const overdue = allMeetingTasks.filter((t) => t.is_overdue).length;

  // completed: sum of done_tasks_count from each event
  const completed = data.events.reduce((sum, e) => sum + e.done_tasks_count, 0);

  // total active = carried + waiting_on_you + non-done meeting tasks
  const activeMeetingTasks = allMeetingTasks.filter(
    (t) => t.status !== 'done',
  ).length;
  const totalActive =
    data.carried_tasks.length + data.waiting_on_you.length + activeMeetingTasks;

  return {
    totalActive,
    inProgress: carriedInProgress + meetingInProgress,
    completed,
    overdue,
  };
}
```

#### 2. `features/today-briefing/ui/task-stats-block.tsx` ← new

Server Component. Renders four cards in a responsive 2×2 → 4×1 grid.

```tsx
import { ListChecks, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { computeTaskStats } from '../model/task-stats';
import type { TodayBriefing } from '../model/types';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClassName: string;
}

function StatCard({ label, value, icon, iconClassName }: StatCardProps) {
  return (
    <div className='flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-card'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium text-muted-foreground'>
          {label}
        </span>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-md ${iconClassName}`}
        >
          {icon}
        </div>
      </div>
      <p className='text-3xl font-bold text-foreground tabular-nums'>{value}</p>
    </div>
  );
}

interface TaskStatsBlockProps {
  data: TodayBriefing;
}

export function TaskStatsBlock({ data }: TaskStatsBlockProps) {
  const stats = computeTaskStats(data);

  return (
    <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
      <StatCard
        label='Total Active'
        value={stats.totalActive}
        icon={<ListChecks className='h-4 w-4' />}
        iconClassName='bg-primary/10 text-primary'
      />
      <StatCard
        label='In Progress'
        value={stats.inProgress}
        icon={<Loader2 className='h-4 w-4' />}
        iconClassName='bg-yellow-500/15 text-yellow-300'
      />
      <StatCard
        label='Completed'
        value={stats.completed}
        icon={<CheckCircle2 className='h-4 w-4' />}
        iconClassName='bg-accent/15 text-emerald-400'
      />
      <StatCard
        label='Overdue'
        value={stats.overdue}
        icon={<AlertCircle className='h-4 w-4' />}
        iconClassName='bg-destructive/10 text-red-400'
      />
    </div>
  );
}
```

> Icon colour mapping follows the existing `Badge` variant convention: `primary`
> (violet) → total, `warning` (yellow) → in-progress, `success` (green) →
> completed, `destructive` (red) → overdue.

#### 3. `features/today-briefing/index.ts` ← update

Add export:

```ts
export { TaskStatsBlock } from './ui/task-stats-block';
```

#### 4. `app/dashboard/today/tasks/page.tsx` ← update

Insert `<TaskStatsBlock data={data} />` **between**
`<PageHeader title='Tasks' />` and `<CardBody>`:

```tsx
import {
  TaskStatsBlock /* ...existing imports */,
} from '@/features/today-briefing';

// ...
return (
  <Card className='h-full flex flex-col'>
    <PageHeader title='Tasks' />
    <div className='px-6 pt-4'>
      <TaskStatsBlock data={data} />
    </div>
    <CardBody>{/* existing content unchanged */}</CardBody>
  </Card>
);
```

> Placing the block **outside** `CardBody` with its own horizontal padding keeps
> it visually attached to the header, while the scrollable task lists remain in
> `CardBody`. Alternatively, it can be the **first child inside `CardBody`** —
> decide after seeing it rendered.

---

## Delta indicator (future enhancement)

The MVP skips per-day deltas because `TodayBriefing` has no prior-day data.

**Two viable approaches for a future iteration:**

1. **Client-side persistence**: On mount (client component wrapper), read
   yesterday's counts from `localStorage` keyed by date, compute delta, then
   persist today's counts for tomorrow. Zero backend work, works offline.
2. **Backend endpoint**: `GET /api/v1/me/task-stats?date=YYYY-MM-DD` returning
   counts for that day — enables persistent history. More accurate across
   devices.

When implemented, add an optional `delta?: number` prop to `StatCard` and
render:

```tsx
{
  delta !== undefined && delta !== 0 && (
    <span
      className={
        delta > 0 ? 'text-xs text-red-400' : 'text-xs text-emerald-400'
      }
    >
      {delta > 0 ? `+${delta}` : delta} vs yesterday
    </span>
  );
}
```

---

## Acceptance Criteria

- [ ] Four stat cards render horizontally (2-col on mobile, 4-col on ≥lg
      screens) under the Tasks heading
- [ ] Each card: colour-coded icon badge, numeric count (`tabular-nums`), label
- [ ] Icon colours: violet (total), yellow (in-progress), green (completed), red
      (overdue)
- [ ] Cards use existing
      `bg-card border border-border shadow-card rounded-[var(--radius-card)]`
      design tokens — visually consistent with `DashboardStats`
- [ ] Values are derived from `data` prop — no extra API call
- [ ] Component is a pure Server Component (no `'use client'`)
- [ ] `computeTaskStats` is a pure function with unit tests
- [ ] No TypeScript errors, ESLint passes

---

## Files to Create / Modify

| File                                                         | Action                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `features/today-briefing/model/task-stats.ts`                | **Create** — pure stat computation helper                                 |
| `features/today-briefing/ui/task-stats-block.tsx`            | **Create** — stat grid Server Component                                   |
| `features/today-briefing/index.ts`                           | **Update** — add `TaskStatsBlock` export                                  |
| `app/dashboard/today/tasks/page.tsx`                         | **Update** — insert `<TaskStatsBlock data={data} />`                      |
| `features/today-briefing/model/__tests__/task-stats.test.ts` | **Create** (optional but recommended) — unit tests for `computeTaskStats` |

**Files NOT touched:** No new routes, no `shared/ui/` changes, no backend
changes, no additional API calls.

---

## Dependencies & Risks

| Risk                                                                      | Mitigation                                                                                                                               |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `waiting_on_you` has no `status` — can't split between in-progress / open | Accepted: `WaitingTask` counted only in Total Active. Add note in code comment.                                                          |
| `stale` tasks have no `status` or `is_overdue` — excluded from all counts | Accepted: stale items are a separate UX concept, displayed below as their own section.                                                   |
| Double-counting: a `MeetingTask` might also appear in `carried_tasks`     | Low risk — backend is the source of truth; if it sends duplicates, stats will be wrong regardless. No de-duplication needed at frontend. |
| Overdue count may be 0 for dates with no events                           | Normal: renders `0`, which is correct. No empty state needed.                                                                            |

---

## References

### Internal

- `features/dashboard/ui/DashboardStats.tsx` — canonical `StatCard` pattern
  (lines 9–37)
- `features/today-briefing/model/types.ts` — `TodayBriefing`, `MeetingTask`,
  `CarriedTask`, `WaitingTask`
- `app/dashboard/today/tasks/page.tsx` — insertion point
- `app/globals.css` — design tokens (`--primary`, `--accent`, `--destructive`,
  `--radius-card`, `shadow-card`)
- `shared/ui/badge/Badge.tsx` — colour semantics reference
  (default/primary/success/warning/destructive)
