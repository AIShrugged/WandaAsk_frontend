---
title: 'feat: Task Stats Block — real cross-org data with delta'
type: feat
status: completed
date: 2026-04-16
---

# feat: Task Stats Block — real cross-org data with delta

## Overview

The `TaskStatsBlock` on `/dashboard/today/tasks` currently shows wrong numbers
because it derives stats from `TodayBriefing` — which only covers the current
user's meetings for today. **Total: 68, In Progress: 2, Completed: 0, Overdue: 0
are all wrong.**

The fix replaces the data source with a new dedicated backend endpoint
`GET /api/v1/issues/stats` that queries the `issues` table using the same
`visibleTo` scope as `IssueController`, returning accurate counts plus delta
data (today vs yesterday by `updated_at` for `in_progress` status).

The `StatCard` component gains a delta row at the bottom (current card layout
and style are preserved).

---

## Problem Statement

### Root cause

`computeTaskStats(data: TodayBriefing)` counts tasks from:

- `data.carried_tasks` — only carried meeting tasks
- `data.events[].tasks` — only tasks from today's calendar events
- `data.waiting_on_you` — issues assigned to current user (correct scope, but
  limited to 20 items hardcoded in the backend)

This misses: manual issues, issues from past meetings, issues assigned to
colleagues. It also has no delta support.

### What "all tasks" means (confirmed)

All issues visible via `Issue::scopeVisibleTo(user)`:

- Issues in any organization the user belongs to
- Issues in any team the user belongs to
- Personal manual issues created by the user (no org/team)
- Issues where `assignee_id = user->id` regardless of org

This is the same scope used by `IssueController@index`.

### Delta definition (confirmed)

- **In Progress delta**: count of issues with `status = in_progress` whose
  `updated_at` is today vs count whose `updated_at` was yesterday.
- **Completed delta**: count of issues with `status = done` whose `updated_at`
  is today vs count whose `updated_at` was yesterday.
- **Overdue delta**: count of issues that became overdue today vs yesterday
  (due_date < today but status != done, using `updated_at` as proxy).
- **Total**: no delta shown (just the raw total count).

---

## Solution Design

### Backend: new `GET /api/v1/issues/stats` endpoint

**New files in `WandaAsk_backend`:**

```
app/Http/Controllers/API/v1/IssueStatsController.php
app/Domain/DTO/Issue/IssueStatsDTO.php
app/Services/Issue/IssueStatsService.php
```

**Route** (add to `routes/api.php` inside `v1` group):

```php
Route::get('/issues/stats', [IssueStatsController::class, 'index']);
// Must be registered BEFORE Route::apiResource('issues', ...) to avoid
// the {task_id} wildcard capturing "stats" as an ID.
```

**Response shape:**

```json
{
  "success": true,
  "data": {
    "total": 68,
    "in_progress": 5,
    "completed": 14,
    "overdue": 3,
    "open": 10,
    "paused": 1,
    "delta": {
      "in_progress": 2,
      "completed": -1,
      "overdue": 0
    }
  },
  "message": "Success",
  "status": 200,
  "meta": {}
}
```

**`IssueStatsService` logic:**

```php
// app/Services/Issue/IssueStatsService.php

public function getStats(User $user): IssueStatsDTO
{
    $base = Issue::query()->visibleTo($user);

    // Current counts by status
    $byStatus = (clone $base)
        ->select('status', DB::raw('COUNT(*) as count'))
        ->groupBy('status')
        ->pluck('count', 'status');

    $total     = (clone $base)->count();
    $overdue   = (clone $base)
        ->where('status', '!=', 'done')
        ->whereNotNull('due_date')
        ->whereDate('due_date', '<', now())
        ->count();

    // Delta: updated_at today vs yesterday
    $todayStart     = now()->startOfDay();
    $yesterdayStart = now()->subDay()->startOfDay();
    $yesterdayEnd   = now()->subDay()->endOfDay();

    $deltaInProgress = $this->countDelta($base, 'in_progress', $todayStart, $yesterdayStart, $yesterdayEnd);
    $deltaCompleted  = $this->countDelta($base, 'done',        $todayStart, $yesterdayStart, $yesterdayEnd);
    $deltaOverdue    = $this->countOverdueDelta($base, $todayStart, $yesterdayStart, $yesterdayEnd);

    return new IssueStatsDTO(
        total:           $total,
        inProgress:      (int) ($byStatus['in_progress'] ?? 0),
        completed:       (int) ($byStatus['done'] ?? 0),
        overdue:         $overdue,
        open:            (int) ($byStatus['open'] ?? 0),
        paused:          (int) ($byStatus['paused'] ?? 0),
        deltaInProgress: $deltaInProgress,
        deltaCompleted:  $deltaCompleted,
        deltaOverdue:    $deltaOverdue,
    );
}

private function countDelta(Builder $base, string $status, Carbon $todayStart, Carbon $yesterdayStart, Carbon $yesterdayEnd): int
{
    $today     = (clone $base)->where('status', $status)->where('updated_at', '>=', $todayStart)->count();
    $yesterday = (clone $base)->where('status', $status)->whereBetween('updated_at', [$yesterdayStart, $yesterdayEnd])->count();
    return $today - $yesterday;
}
```

**`IssueStatsDTO::toArray()`:**

```php
return [
    'total'       => $this->total,
    'in_progress' => $this->inProgress,
    'completed'   => $this->completed,
    'overdue'     => $this->overdue,
    'open'        => $this->open,
    'paused'      => $this->paused,
    'delta'       => [
        'in_progress' => $this->deltaInProgress,
        'completed'   => $this->deltaCompleted,
        'overdue'     => $this->deltaOverdue,
    ],
];
```

---

### Frontend changes

#### 1. New Server Action: `features/today-briefing/api/task-stats.ts`

```ts
'use server';

import { httpClient } from '@/shared/lib/httpClient';
import { API_URL } from '@/shared/lib/config';

export interface IssueStatsDelta {
  in_progress: number;
  completed: number;
  overdue: number;
}

export interface IssueStats {
  total: number;
  in_progress: number;
  completed: number;
  overdue: number;
  open: number;
  paused: number;
  delta: IssueStatsDelta;
}

export async function getIssueStats(): Promise<IssueStats> {
  const { data } = await httpClient<IssueStats>(`${API_URL}/issues/stats`);
  return data!;
}
```

#### 2. Update `features/today-briefing/ui/task-stats-block.tsx`

**Key changes:**

- Remove `data: TodayBriefing` prop — the block fetches its own data
- Make it an `async` Server Component — calls `getIssueStats()` directly
- Add `delta` sub-row to `StatCard` component

**Updated `StatCard` with delta:**

```tsx
interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  iconClassName: string;
  delta?: number; // undefined = no delta row shown
  deltaLabel?: string; // e.g. "vs yesterday"
}

function StatCard({
  label,
  value,
  icon,
  iconClassName,
  delta,
  deltaLabel,
}: StatCardProps) {
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
      {delta !== undefined && (
        <DeltaBadge delta={delta} label={deltaLabel ?? 'vs yesterday'} />
      )}
    </div>
  );
}
```

**`DeltaBadge` component (inline in the file):**

```tsx
function DeltaBadge({ delta, label }: { delta: number; label: string }) {
  if (delta === 0) {
    return (
      <span className='text-xs text-muted-foreground'>No change {label}</span>
    );
  }

  const positive = delta > 0;
  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium ${positive ? 'text-emerald-400' : 'text-red-400'}`}
    >
      {positive ? (
        <TrendingUp className='h-3 w-3' />
      ) : (
        <TrendingDown className='h-3 w-3' />
      )}
      {positive ? '+' : ''}
      {delta} {label}
    </span>
  );
}
```

**Updated async component:**

```tsx
export async function TaskStatsBlock() {
  const stats = await getIssueStats();

  return (
    <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
      <StatCard
        label='Total'
        value={stats.total}
        icon={<ListChecks className='h-4 w-4' />}
        iconClassName='bg-primary/10 text-primary'
      />
      <StatCard
        label='In Progress'
        value={stats.in_progress}
        icon={<Loader2 className='h-4 w-4' />}
        iconClassName='bg-yellow-500/15 text-yellow-300'
        delta={stats.delta.in_progress}
        deltaLabel='vs yesterday'
      />
      <StatCard
        label='Completed'
        value={stats.completed}
        icon={<CheckCircle2 className='h-4 w-4' />}
        iconClassName='bg-accent/15 text-emerald-400'
        delta={stats.delta.completed}
        deltaLabel='vs yesterday'
      />
      <StatCard
        label='Overdue'
        value={stats.overdue}
        icon={<AlertCircle className='h-4 w-4' />}
        iconClassName='bg-destructive/10 text-red-400'
        delta={stats.delta.overdue}
        deltaLabel='vs yesterday'
      />
    </div>
  );
}
```

#### 3. Update page `app/dashboard/today/tasks/page.tsx`

Remove `<TaskStatsBlock data={data} />` prop — the component is now
self-contained:

```tsx
// Before:
<TaskStatsBlock data={data} />

// After:
<TaskStatsBlock />
```

#### 4. Update `features/today-briefing/model/task-stats.ts`

The `computeTaskStats` function and `TaskStats` interface can be **deleted**
since they are no longer used anywhere. The computation moves to the backend.

#### 5. Update `features/today-briefing/index.ts`

Remove export of `computeTaskStats` / `TaskStats` if they were re-exported.

---

## Acceptance Criteria

### Functional

- [x] `GET /api/v1/issues/stats` returns `total`, `in_progress`, `completed`,
      `overdue`, `open`, `paused`, `delta.{in_progress,completed,overdue}`
- [x] `total` matches the count returned by `GET /api/v1/issues` (same
      `visibleTo` scope, no filters)
- [x] `in_progress` equals `GET /api/v1/issues?status=in_progress` total count
- [x] `delta.in_progress` = count of `in_progress` issues with
      `updated_at >= today 00:00` minus count with `updated_at` yesterday
- [x] `TaskStatsBlock` no longer accepts a `data` prop
- [x] Cards display the correct numbers (not derived from TodayBriefing)
- [x] In Progress, Completed, Overdue cards each show a delta sub-row
- [x] Delta row: positive = emerald `TrendingUp`, negative = red `TrendingDown`,
      zero = muted "No change vs yesterday"
- [x] Total card has **no delta row**
- [x] Page still loads without errors after removing `data` prop

### Non-functional

- [x] No `any` types in new TypeScript code
- [x] `'use server'` at top of `features/today-briefing/api/task-stats.ts`
- [x] No raw `fetch` — use `httpClient`
- [x] Backend endpoint registered before `apiResource('issues', ...)` in
      `routes/api.php` to avoid route collision

---

## Implementation Order

1. **Backend** — `IssueStatsDTO`, `IssueStatsService`, `IssueStatsController`,
   route registration
2. **Frontend types** — `IssueStats` interface in `api/task-stats.ts`
3. **Frontend Server Action** — `getIssueStats()` in `api/task-stats.ts`
4. **Frontend component** — update `task-stats-block.tsx` (new props, delta
   badge, async fetch)
5. **Page update** — remove `data` prop from `<TaskStatsBlock />` in
   `app/dashboard/today/tasks/page.tsx`
6. **Cleanup** — delete `model/task-stats.ts`, remove from `index.ts`

---

## Files Touched

### Backend (`WandaAsk_backend`)

| File                                                   | Action                                                   |
| ------------------------------------------------------ | -------------------------------------------------------- |
| `app/Domain/DTO/Issue/IssueStatsDTO.php`               | **Create**                                               |
| `app/Services/Issue/IssueStatsService.php`             | **Create**                                               |
| `app/Http/Controllers/API/v1/IssueStatsController.php` | **Create**                                               |
| `routes/api.php`                                       | **Edit** — add route before `apiResource('issues', ...)` |

### Frontend (`WandaAsk_frontend`)

| File                                              | Action                                     |
| ------------------------------------------------- | ------------------------------------------ |
| `features/today-briefing/api/task-stats.ts`       | **Create**                                 |
| `features/today-briefing/ui/task-stats-block.tsx` | **Edit** — remove prop, async, delta badge |
| `features/today-briefing/model/task-stats.ts`     | **Delete**                                 |
| `features/today-briefing/index.ts`                | **Edit** — remove deleted exports          |
| `app/dashboard/today/tasks/page.tsx`              | **Edit** — remove `data` prop              |

---

## Risks & Notes

- **Route collision**: `GET /api/v1/issues/{task_id}` already exists.
  `GET /api/v1/issues/stats` must be registered first (static route before
  resource route), otherwise Laravel will try to find issue with id = "stats".
- **`updated_at` as delta proxy**: tasks that had their status changed and then
  reverted today still count. This is acceptable for a dashboard tile.
- **`model/task-stats.ts` deletion**: verify it is not imported anywhere else
  (grep before deleting).
- **`TodayBriefing` is still used** by other components in the same page — only
  `TaskStatsBlock` stops using it. The `getTodayBriefing()` call in the page
  stays.
