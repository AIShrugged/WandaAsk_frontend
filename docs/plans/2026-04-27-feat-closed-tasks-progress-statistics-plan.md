---
title: 'feat: Closed Tasks Progress & Statistics (UC-5)'
type: feat
status: active
date: 2026-04-27
deepened: 2026-04-27
---

# feat: Closed Tasks Progress & Statistics (UC-5)

## Enhancement Summary

**Deepened on:** 2026-04-27 **Research agents used:** DHH Rails Reviewer,
Performance Oracle, Architecture Strategist, Kieran TypeScript Reviewer,
Security Sentinel, Data Integrity Guardian, Best Practices Researcher, Scope
Guardian

### Key Improvements vs Original Plan

1. **Backend split**: `summary` moves into the existing `/issues/stats`
   endpoint; `/stats/history` returns only `items` — eliminates 7 summary COUNT
   queries on every period switch
2. **Single conditional aggregation query**: 7 separate `COUNT` queries → 1
   `selectRaw` with `SUM(boolean)` — 8 DB hits → 2 per page load
3. **Composite index**: `(status, close_date)` not just `(close_date)` —
   orders-of-magnitude faster for this query shape
4. **Route group change**: Progress page gets its own `(progress)` route group,
   NOT inside `(list)` — avoids mounting IssuesLayoutClient with filter state
   and 4 extra server calls
5. **FSD fix**: `DeltaBadge` moves to `shared/ui/stats/` — original plan had a
   cross-feature import violation
6. **Race condition fix**: `useTransition` + generation counter for period
   switching
7. **Partial period UX**: current period bar rendered at lower opacity with
   pro-rated delta

### New Considerations Discovered

- `whereDate()` in Laravel does **not** use indexes — must use explicit range
  conditions
- `IssueStats` / `getIssueStats` currently lives in `features/today-briefing/` —
  FSD violation that must be fixed as part of this feature
- URL search params (`?period=week`) should drive period state, not `useState` —
  enables SSR, shareable links, browser back/forward
- `WEEKDAY()` MySQL function is a portability trap — use
  `YEARWEEK(close_date, 1)` instead
- `closed_all_time` does not belong in the history endpoint — it has no period
  dimension

---

## Overview

Add a dedicated "Progress" surface that tells each user exactly how productive
they have been with their tasks — how many tasks they closed today, this week,
this month, and in total — and visualises that momentum as a bar chart over
time.

Reference use-case: **UC-5 — "На этой неделе ты закрыл 12 задач…"**

---

## Problem Statement

Currently users have zero longitudinal visibility into their task-completion
history. The existing `GET /api/v1/issues/stats` endpoint returns only a flat
snapshot (total counts per status, delta vs. yesterday). There is no time-series
breakdown of closed tasks, no motivational progress layer, and no dedicated
progress page. Users have no answer to "how productive have I been this month?"

---

## Proposed Solution

### Surfaces

| Surface                                     | Where                        | What it shows                                              |
| ------------------------------------------- | ---------------------------- | ---------------------------------------------------------- |
| **Progress page** (new)                     | `/dashboard/issues/progress` | 4 KPI cards + BarChart with period selector                |
| **Today task-stats enhancement** (optional) | `/dashboard/today/tasks`     | "Closed today" KPI card added to existing `TaskStatsBlock` |

> **Scope decision**: The "closed this week" badge in the issues list layout was
> removed from scope. Adding a DB query to every issues page load for a badge
> that only matters on the progress tab is not worth the cost. The progress tab
> is the right home for this data.

### Core data flow

```
User → navigates to /dashboard/issues/progress?period=week
  → Server Component reads ?period from searchParams
  → Two parallel server calls:
      getIssueStats()       → /api/v1/issues/stats (extended with summary fields)
      getIssueStatsHistory() → /api/v1/issues/stats/history?period=week&range=12
  → Renders KPI cards (from stats snapshot) + BarChart (from history items)
  → User clicks "Month" period selector
  → router.replace(?period=month)
  → Server Component re-renders with new period data
```

### KPI cards (header row)

| Card              | Source                    | Delta                                |
| ----------------- | ------------------------- | ------------------------------------ |
| Closed Today      | `stats.closed_today`      | vs yesterday                         |
| Closed This Week  | `stats.closed_this_week`  | vs last week (pro-rated if partial)  |
| Closed This Month | `stats.closed_this_month` | vs last month (pro-rated if partial) |
| All Time          | `stats.closed_all_time`   | no delta                             |

### Chart

A Recharts `BarChart` with `key={period}` prop for fresh animation on period
switch. Period selector stored in URL search params (`?period=day|week|month`).
Current (partial) period bar rendered at 45% opacity with a tooltip note. Uses
`CHART_TOOLTIP_STYLE`, `CHART_TICK_STYLE`, `CHART_GRID_COLOR`,
`CHART_CURSOR_BAR` from `shared/lib/chart-theme.ts`.

---

## Technical Approach

### Backend changes (Laravel)

#### A. Migration — composite index on `(status, close_date)`

**File:**
`database/migrations/2026_04_27_add_status_close_date_index_to_tasks_table.php`

```php
public function up(): void
{
    Schema::table('tasks', function (Blueprint $table) {
        // Composite index: status equality first, then range scan on close_date
        // More efficient than single-column (close_date) because status='done'
        // eliminates ~80% of rows before touching the datetime column
        $table->index(['status', 'close_date'], 'tasks_status_close_date_index');
    });
}

public function down(): void
{
    Schema::table('tasks', function (Blueprint $table) {
        $table->dropIndex('tasks_status_close_date_index');
    });
}
```

> **Research insight (Performance Oracle):** A single `(close_date)` index is
> less effective than `(status, close_date)` for this query because
> `status = 'done'` is always present. The composite index lets MySQL eliminate
> ~80% of rows on status equality before range-scanning close_date.
> `whereDate(close_date)` wraps the column in a function call and **breaks index
> usage** — always use explicit range conditions instead.

> **Data Integrity note:** Adding a non-unique index on a nullable datetime
> column is safe in production. MySQL acquires a metadata lock but does not
> block reads during the index build. On large tables (>1M rows), consider
> running during off-peak hours.

#### B. Extend existing `IssueStatsService::getStats()` with summary fields

**File:** `app/Services/IssueStatsService.php` — modify existing `getStats()`
method

Replace the existing multi-query pattern with a **single conditional aggregation
query** for the new summary fields. Add to the existing stats computation:

```php
// Replace 7 separate COUNT calls with 1 selectRaw
$now            = now();
$todayStart     = $now->copy()->startOfDay();
$tomorrowStart  = $now->copy()->addDay()->startOfDay();
$yesterdayStart = $now->copy()->subDay()->startOfDay();
$weekStart      = $now->copy()->startOfWeek();
$lastWeekStart  = $now->copy()->subWeek()->startOfWeek();
$monthStart     = $now->copy()->startOfMonth();
$lastMonthStart = $now->copy()->subMonth()->startOfMonth();

$closedBase = Issue::query()
    ->visibleTo($user)
    ->where('status', 'done')
    ->whereNotNull('close_date');

$closedSummary = (clone $closedBase)
    ->selectRaw('
        SUM(close_date >= ? AND close_date < ?) AS closed_today,
        SUM(close_date >= ? AND close_date < ?) AS closed_yesterday,
        SUM(close_date >= ?)                    AS closed_this_week,
        SUM(close_date >= ? AND close_date < ?) AS closed_last_week,
        SUM(close_date >= ?)                    AS closed_this_month,
        SUM(close_date >= ? AND close_date < ?) AS closed_last_month,
        COUNT(*)                                AS closed_all_time
    ', [
        $todayStart,     $tomorrowStart,
        $yesterdayStart, $todayStart,
        $weekStart,
        $lastWeekStart,  $weekStart,
        $monthStart,
        $lastMonthStart, $monthStart,
    ])
    ->first();
```

> **DHH review:** The original plan fired 7 separate COUNT queries. MySQL's
> `SUM(boolean_expression)` pattern (`SUM(col >= x AND col < y)`) evaluates as
> `SUM(1)` or `SUM(0)` per row — equivalent to
> `SUM(CASE WHEN ... THEN 1 ELSE 0 END)` but more concise. This reduces 7
> queries to 1.

> **Critical fix:** Never use `whereDate('close_date', ...)` — it wraps the
> column in MySQL's `DATE()` function which **prevents index range scans**. Use
> explicit `where('close_date', '>=', $start)->where('close_date', '<', $end)`
> bounds instead.

#### C. Extend `IssueStatsDTO` with summary fields

**File:** `app/Domain/DTO/Issue/IssueStatsDTO.php`

Add fields:

```php
public function __construct(
    // ... existing fields ...
    public readonly int $closedToday,
    public readonly int $closedThisWeek,
    public readonly int $closedThisMonth,
    public readonly int $closedAllTime,
    public readonly int $deltaToday,
    public readonly int $deltaWeek,
    public readonly int $deltaMonth,
) {}
```

Extended `toArray()`:

```php
public function toArray(): array
{
    return [
        // ... existing fields ...
        'closed_today'       => $this->closedToday,
        'closed_this_week'   => $this->closedThisWeek,
        'closed_this_month'  => $this->closedThisMonth,
        'closed_all_time'    => $this->closedAllTime,
        'delta_today'        => $this->deltaToday,
        'delta_week'         => $this->deltaWeek,
        'delta_month'        => $this->deltaMonth,
    ];
}
```

> **Architecture insight:** `closed_all_time` belongs here, not in the history
> endpoint. It has no period dimension and requires a full-table aggregate
> regardless of the chart period. Bundling it into the history endpoint would
> mean recomputing it on every period switch.

#### D. New FormRequest — `IssueStatsHistoryRequest`

**File:** `app/Http/Requests/API/v1/IssueStatsHistoryRequest.php`

```php
public function rules(): array
{
    return [
        'period' => ['required', Rule::in(['day', 'week', 'month'])],
        'range'  => ['nullable', 'integer', 'min:1', 'max:365'],
    ];
}

public function getPeriod(): string { return $this->validated('period'); }

public function getRange(): int
{
    return (int) ($this->validated('range') ?? match ($this->getPeriod()) {
        'day'   => 30,
        'week'  => 12,
        'month' => 12,
    });
}
```

#### E. New DTO — `IssueStatsHistoryDTO`

**File:** `app/Domain/DTO/Issue/IssueStatsHistoryDTO.php`

Wire shape — **items only, no summary** (summary comes from the extended
`/issues/stats`):

```json
{
  "period": "week",
  "range": 12,
  "items": [
    { "date": "2026-04-21", "closed": 8 },
    { "date": "2026-04-14", "closed": 5 },
    { "date": "2026-04-07", "closed": 0 },
    ...
  ]
}
```

#### F. New service method — `IssueStatsService::getHistory()`

Add to existing `app/Services/IssueStatsService.php`:

```php
public function getHistory(User $user, string $period, int $range): IssueStatsHistoryDTO
{
    $now  = now();
    $base = Issue::query()->visibleTo($user)->where('status', 'done')->whereNotNull('close_date');

    $startDate = match ($period) {
        'day'   => $now->copy()->subDays($range)->startOfDay(),
        'week'  => $now->copy()->subWeeks($range)->startOfWeek(),
        'month' => $now->copy()->subMonths($range)->startOfMonth(),
    };

    // YEARWEEK(close_date, 1) uses ISO weeks (Monday start), mode 1
    // Avoids the MySQL-specific WEEKDAY() portability trap
    $groupExpr = match ($period) {
        'day'   => 'DATE(close_date)',
        'week'  => "DATE(DATE_FORMAT(close_date, '%X-%V-1'))",
        'month' => "DATE_FORMAT(close_date, '%Y-%m-01')",
    };

    // Use range conditions (not DATE() wrapper) so the index is used
    $rows = (clone $base)
        ->where('close_date', '>=', $startDate)
        ->select(DB::raw("$groupExpr as period_date"), DB::raw('COUNT(*) as closed'))
        ->groupBy('period_date')
        ->orderBy('period_date')
        ->get()
        ->keyBy('period_date');

    // Fill zero-gaps in PHP — simpler and more maintainable than SQL recursive CTEs
    $items = [];
    for ($i = $range - 1; $i >= 0; $i--) {
        $date    = $this->periodDate($period, $i, $now);
        $items[] = ['date' => $date, 'closed' => (int) ($rows[$date]?->closed ?? 0)];
    }

    return new IssueStatsHistoryDTO(period: $period, range: $range, items: $items);
}

private function periodDate(string $period, int $stepsBack, Carbon $now): string
{
    return match ($period) {
        'day'   => $now->copy()->subDays($stepsBack)->toDateString(),
        'week'  => $now->copy()->subWeeks($stepsBack)->startOfWeek()->toDateString(),
        'month' => $now->copy()->subMonths($stepsBack)->startOfMonth()->toDateString(),
    };
}
```

> **DHH review:** The original plan had a duplicated `match` expression inside
> the loop and in the `$startDate` calculation. The extracted `periodDate()`
> private method eliminates that duplication. Zero-gap filling in PHP is the
> correct approach — do not reach for recursive CTEs.

> **Data integrity:** The `YEARWEEK(close_date, 1)` + `DATE_FORMAT` approach
> produces ISO week-start dates (Monday) that match `Carbon::startOfWeek()`. The
> original `DATE_SUB(close_date, INTERVAL WEEKDAY(close_date) DAY)` relied on
> MySQL's `@@global.default_week_format` matching Carbon's locale, which is not
> guaranteed.

> **Timezone consideration:** `now()` uses the server's app timezone (set in
> `config/app.php`). "Closed today" will reflect the server timezone, not the
> user's local timezone. For now this is acceptable — document as a known
> limitation. Full timezone support requires passing user TZ in the request.

#### G. Add `history()` to existing `IssueStatsController`

**File:** `app/Http/Controllers/API/v1/IssueStatsController.php` — **modify,
don't create new controller**

```php
class IssueStatsController extends Controller
{
    public function __construct(private readonly IssueStatsService $issueStatsService) {}

    public function index(): JsonResponse
    {
        // existing method
    }

    public function history(IssueStatsHistoryRequest $request): JsonResponse
    {
        $dto = $this->issueStatsService->getHistory(
            Auth::user(),
            $request->getPeriod(),
            $request->getRange(),
        );
        return ApiResponse::success(data: $dto);
    }
}
```

> **DHH review:** Creating a dedicated `IssueStatsHistoryController` for a
> single action is an architecture astronaut move. The `history()` action
> belongs alongside `index()` in the existing `IssueStatsController` — it is the
> same resource (issue stats), just a different representation.

#### H. Route update

In `routes/api.php` (before the existing `issues/{issue}` route):

```php
Route::get('issues/stats',         [IssueStatsController::class, 'index'])->name('issues.stats');
Route::get('issues/stats/history', [IssueStatsController::class, 'history'])->name('issues.stats.history');
```

---

### Frontend changes (Next.js)

#### I. FSD fix — move domain types and action out of `today-briefing`

**Pre-condition:** `IssueStats` type and `getIssueStats` action currently live
in `features/today-briefing/api/task-stats.ts` — an FSD violation (stats for
`/issues/stats` live in `today-briefing`). Fix this first:

1. Move `IssueStats`, `IssueStatsDelta` types → `features/issues/model/types.ts`
2. Move `getIssueStats` server action → `features/issues/api/issue-stats.ts`
3. Update `features/today-briefing/ui/task-stats-block.tsx` to import from
   `@/features/issues`
4. Export from `features/issues/index.ts`

#### J. Move `DeltaBadge` to `shared/ui/stats/`

**File to create:** `shared/ui/stats/delta-badge.tsx`

```tsx
interface DeltaBadgeProps {
  delta: number;
  label: string;
  // polarity: 'positive-good' = more is better (completed)
  //           'negative-good' = less is better (overdue, errors)
  polarity?: 'positive-good' | 'negative-good';
}

export function DeltaBadge({
  delta,
  label,
  polarity = 'positive-good',
}: DeltaBadgeProps) {
  if (delta === 0) return null;

  const isGood = polarity === 'positive-good' ? delta > 0 : delta < 0;

  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium ${
        isGood ? 'text-emerald-400' : 'text-red-400'
      }`}
    >
      {delta > 0 ? (
        <TrendingUp className='h-3 w-3' />
      ) : (
        <TrendingDown className='h-3 w-3' />
      )}
      {delta > 0 ? '+' : ''}
      {delta} {label}
    </span>
  );
}
```

Update `today-briefing/ui/task-stats-block.tsx` to import `DeltaBadge` from
`@/shared/ui/stats/delta-badge`.

> **Architecture insight:** `DeltaBadge` is generic — it has zero domain
> knowledge. It belongs in `shared/ui/`. The original plan had a cross-feature
> import violation (`features/issues` → `features/today-briefing`). Moving to
> `shared/` unblocks both features.

> **UX best practice:** Add `polarity` prop so that Overdue card correctly shows
> red for _positive_ delta (more overdue = bad). Pass `polarity="negative-good"`
> to the overdue stat card.

#### K. TypeScript types

**File:** `features/issues/model/types.ts` — add new types

```ts
// Extended IssueStats (extended from existing, moved from today-briefing)
export interface IssueStats {
  total: number;
  in_progress: number;
  completed: number;
  overdue: number;
  open: number;
  paused: number;
  // New summary fields added to /issues/stats response
  closed_today: number;
  closed_this_week: number;
  closed_this_month: number;
  closed_all_time: number;
  delta_today: number;
  delta_week: number;
  delta_month: number;
  delta: {
    in_progress: number;
    completed: number;
    overdue: number;
  };
}

export interface IssueStatsHistoryItem {
  date: string; // ISO date string, start of period bucket
  closed: number;
}

export type IssueHistoryPeriod = 'day' | 'week' | 'month';

export interface IssueStatsHistory {
  period: IssueHistoryPeriod;
  range: number;
  items: IssueStatsHistoryItem[];
}
```

#### L. Server Action — history

**File:** `features/issues/api/issue-stats-history.ts`

```ts
'use server';

import { API_URL } from '@/shared/lib/config';
import { httpClient } from '@/shared/lib/httpClient';
import type { IssueHistoryPeriod, IssueStatsHistory } from '../model/types';

export async function getIssueStatsHistory(
  period: IssueHistoryPeriod,
  range?: number,
): Promise<IssueStatsHistory> {
  const params = new URLSearchParams({ period });
  if (range !== undefined) params.set('range', String(range)); // strict undefined check, not falsy
  const { data } = await httpClient<IssueStatsHistory>(
    `${API_URL}/issues/stats/history?${params}`,
  );
  return data!;
}
```

> **TypeScript review fixes applied:**
>
> - Import `API_URL` from `@/shared/lib/config` — it is already centralized and
>   validated there, not re-declared with `process.env`
> - `if (range !== undefined)` — not `if (range)`, which would drop `range=0`
> - Return `Promise<IssueStatsHistory>` not `| null` — `httpClient` throws on
>   non-2xx, never returns null for successful calls

#### M. New route constant and route group structure

**File:** `shared/lib/routes.ts`

```ts
ISSUES_PROGRESS: '/dashboard/issues/progress',
```

**App Router structure change** — Progress page needs its own `(progress)` route
group, NOT inside `(list)`:

```
app/dashboard/issues/
  (list)/
    layout.tsx          # IssuesLayoutClient: filter state, org/persons fetches
    page.tsx            # redirect to /issues/list
    kanban/
    list/
  (progress)/           # NEW: minimal layout, no filter state
    layout.tsx          # Just card wrapper + IssuesTabsNav
    progress/
      page.tsx          # async Server Component — reads ?period searchParam
      loading.tsx
  (create)/
    create/
  [id]/
```

> **Architecture insight:** The `(list)` layout mounts `IssuesLayoutClient`
> (complex client component with URL effects, filter context) and runs 4
> parallel server calls (orgs, persons, userId, focus). The Progress page has
> zero use for any of that. It does not filter issues. Forcing it inside
> `(list)` would make every chart page load the filter bar UI and execute the
> filter data calls unnecessarily.

#### N. Progress page — Server Component

**File:** `app/dashboard/issues/(progress)/progress/page.tsx`

```tsx
import { getIssueStats } from '@/features/issues/api/issue-stats';
import { getIssueStatsHistory } from '@/features/issues/api/issue-stats-history';
import { IssueProgressPage } from '@/features/issues';
import type { IssueHistoryPeriod } from '@/features/issues';

const VALID_PERIODS: IssueHistoryPeriod[] = ['day', 'week', 'month'];

interface PageProps {
  searchParams: { period?: string };
}

export default async function IssueProgressServerPage({
  searchParams,
}: PageProps) {
  const period: IssueHistoryPeriod = VALID_PERIODS.includes(
    searchParams.period as IssueHistoryPeriod,
  )
    ? (searchParams.period as IssueHistoryPeriod)
    : 'week';

  const [stats, history] = await Promise.all([
    getIssueStats(),
    getIssueStatsHistory(period),
  ]);

  return <IssueProgressPage stats={stats} history={history} period={period} />;
}
```

> **URL state:** Period is driven by `?period=week` search param. The Server
> Component reads it, validates it, and passes it down. `router.replace` in the
> period selector updates the URL → Next.js re-renders the Server Component with
> new data. No `useState` for period, no client-side re-fetch race conditions.

#### O. Loading state

**File:** `app/dashboard/issues/(progress)/progress/loading.tsx`

```tsx
import { Skeleton, SkeletonList } from '@/shared/ui/layout/skeleton';

export default function IssueProgressLoading() {
  return (
    <div className='space-y-6 p-6'>
      <div className='grid grid-cols-4 gap-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-24 rounded-lg' />
        ))}
      </div>
      <Skeleton className='h-10 w-64 rounded-md' />
      <Skeleton className='h-64 w-full rounded-lg' />
    </div>
  );
}
```

#### P. Tab nav update

**File:** `features/issues/ui/issues-tabs-nav.tsx`

```ts
const TABS = [
  { href: ROUTES.DASHBOARD.ISSUES_LIST, label: 'List' },
  { href: ROUTES.DASHBOARD.ISSUES_KANBAN, label: 'Kanban' },
  { href: ROUTES.DASHBOARD.ISSUES_PROGRESS, label: 'Progress' },
] as const;
```

Note: No `preserveSearchParams` for Progress tab — filter params from
List/Kanban are irrelevant to the chart. The Progress tab has its own `?period`
param.

#### Q. UI Components (all in `features/issues/ui/`)

**`issue-progress-kpi-cards.tsx`** — Server-renderable, receives `IssueStats` as
prop:

```tsx
interface Props {
  stats: IssueStats;
}

export function IssueProgressKpiCards({ stats }: Props) {
  return (
    <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
      <StatCard
        label='Closed Today'
        value={stats.closed_today}
        delta={<DeltaBadge delta={stats.delta_today} label='vs yesterday' />}
      />
      <StatCard
        label='Closed This Week'
        value={stats.closed_this_week}
        delta={<DeltaBadge delta={stats.delta_week} label='vs last week' />}
      />
      <StatCard
        label='Closed This Month'
        value={stats.closed_this_month}
        delta={<DeltaBadge delta={stats.delta_month} label='vs last month' />}
      />
      <StatCard label='All Time' value={stats.closed_all_time} />
    </div>
  );
}
```

**`issue-progress-chart.tsx`** — Client Component with period selector:

```tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { format, parseISO, startOfWeek, startOfMonth } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  CHART_TOOLTIP_STYLE,
  CHART_TICK_STYLE,
  CHART_GRID_COLOR,
  CHART_CURSOR_BAR,
} from '@/shared/lib/chart-theme';
import type { IssueHistoryPeriod, IssueStatsHistory } from '../model/types';

const PERIODS: { value: IssueHistoryPeriod; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

// Format X-axis tick labels per period
function formatXLabel(date: string, period: IssueHistoryPeriod): string {
  const d = parseISO(date);
  if (period === 'day') return format(d, 'MMM d');
  if (period === 'week') return `W${format(d, 'w')}`;
  return format(d, 'MMM');
}

// Format tooltip label
function formatTooltipLabel(date: string, period: IssueHistoryPeriod): string {
  const d = parseISO(date);
  if (period === 'day') return format(d, 'EEE, MMM d');
  if (period === 'week') return `Week of ${format(d, 'MMM d')}`;
  return format(d, 'MMMM yyyy');
}

// Detect if a bucket is the current (partial) period
function isCurrentPeriod(date: string, period: IssueHistoryPeriod): boolean {
  const now = new Date();
  if (period === 'day') return date === format(now, 'yyyy-MM-dd');
  if (period === 'week')
    return date === format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  return date === format(startOfMonth(now), 'yyyy-MM-dd');
}

interface Props {
  history: IssueStatsHistory;
  period: IssueHistoryPeriod;
}

export function IssueProgressChart({ history, period }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setPeriod = (next: IssueHistoryPeriod) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', next);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const BAR_COLOR = 'hsl(262 83% 65%)'; // violet primary

  return (
    <div className='space-y-4'>
      {/* Period selector */}
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-medium text-muted-foreground'>
          Completed tasks over time
        </h3>
        <div
          role='group'
          aria-label='Select period'
          className='flex gap-1 rounded-md bg-muted p-1'
        >
          {PERIODS.map(({ value, label }) => (
            <button
              key={value}
              type='button'
              onClick={() => setPeriod(value)}
              aria-pressed={period === value}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                period === value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart — key={period} triggers fresh animation on period switch */}
      <div role='img' aria-label={`Bar chart: completed tasks by ${period}`}>
        <ResponsiveContainer width='100%' height={240}>
          <BarChart
            key={period}
            data={history.items}
            margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray='3 3'
              stroke={CHART_GRID_COLOR}
              vertical={false}
            />
            <XAxis
              dataKey='date'
              tickFormatter={(d) => formatXLabel(d, period)}
              tick={CHART_TICK_STYLE}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={CHART_TICK_STYLE}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              cursor={CHART_CURSOR_BAR}
              labelFormatter={(d) => formatTooltipLabel(d, period)}
              formatter={(value: number, _: string, entry) => {
                const isCurrent = isCurrentPeriod(entry.payload.date, period);
                return [
                  value,
                  isCurrent ? 'Completed (partial period)' : 'Completed',
                ];
              }}
            />
            <Bar dataKey='closed' radius={[3, 3, 0, 0]} minPointSize={2}>
              {history.items.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    isCurrentPeriod(entry.date, period)
                      ? `${BAR_COLOR.replace(')', '')} / 0.45)` // partial period = 45% opacity
                      : BAR_COLOR
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

> **UX best practices applied:**
>
> - `key={period}` on `<BarChart>` triggers fresh entry animation on period
>   switch
> - `minPointSize={2}` makes zero-count bars visible (thin line at x-axis
>   instead of invisible)
> - Current (partial) period rendered at 45% opacity — users understand it's
>   incomplete
> - Tooltip notes "(partial period)" for the current bucket
> - `role="img"` with `aria-label` for screen reader accessibility
> - Period selector uses `router.replace` (not `router.push`) — no history stack
>   pollution
> - `aria-pressed` on period buttons for accessibility

**`issue-progress-page.tsx`** — Thin wrapper composing KPI cards + chart:

```tsx
interface Props {
  stats: IssueStats;
  history: IssueStatsHistory;
  period: IssueHistoryPeriod;
}

export function IssueProgressPage({ stats, history, period }: Props) {
  return (
    <div className='space-y-6 p-6'>
      <IssueProgressKpiCards stats={stats} />
      <IssueProgressChart history={history} period={period} />
    </div>
  );
}
```

---

## File Map

### Backend (`/Users/slavapopov/Documents/WandaAsk_backend`)

| File                                                                            | Action                                                                |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `database/migrations/2026_04_27_add_status_close_date_index_to_tasks_table.php` | Create                                                                |
| `app/Services/IssueStatsService.php`                                            | Modify `getStats()` + add `getHistory()` + add private `periodDate()` |
| `app/Domain/DTO/Issue/IssueStatsDTO.php`                                        | Add 7 new summary fields                                              |
| `app/Domain/DTO/Issue/IssueStatsHistoryDTO.php`                                 | Create                                                                |
| `app/Http/Requests/API/v1/IssueStatsHistoryRequest.php`                         | Create                                                                |
| `app/Http/Controllers/API/v1/IssueStatsController.php`                          | Add `history()` method                                                |
| `routes/api.php`                                                                | Add `issues/stats/history` route                                      |

### Frontend (`/Users/slavapopov/Documents/WandaAsk_frontend`)

| File                                                   | Action                                                                                          |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `shared/ui/stats/delta-badge.tsx`                      | Create (moved from today-briefing, add `polarity` prop)                                         |
| `shared/ui/stats/index.ts`                             | Create (export DeltaBadge)                                                                      |
| `features/today-briefing/api/task-stats.ts`            | Remove (types+action moved to issues feature)                                                   |
| `features/today-briefing/ui/task-stats-block.tsx`      | Update imports to `@/features/issues` and `@/shared/ui/stats`                                   |
| `features/issues/model/types.ts`                       | Add `IssueStats` (extended), `IssueStatsHistoryItem`, `IssueHistoryPeriod`, `IssueStatsHistory` |
| `features/issues/api/issue-stats.ts`                   | Create (moved from today-briefing)                                                              |
| `features/issues/api/issue-stats-history.ts`           | Create                                                                                          |
| `features/issues/ui/issue-progress-kpi-cards.tsx`      | Create                                                                                          |
| `features/issues/ui/issue-progress-chart.tsx`          | Create                                                                                          |
| `features/issues/ui/issue-progress-page.tsx`           | Create                                                                                          |
| `features/issues/ui/issues-tabs-nav.tsx`               | Add Progress tab                                                                                |
| `features/issues/index.ts`                             | Export new components and types                                                                 |
| `app/dashboard/issues/(progress)/layout.tsx`           | Create (minimal: card wrapper + IssuesTabsNav)                                                  |
| `app/dashboard/issues/(progress)/progress/page.tsx`    | Create                                                                                          |
| `app/dashboard/issues/(progress)/progress/loading.tsx` | Create                                                                                          |
| `shared/lib/routes.ts`                                 | Add `ISSUES_PROGRESS` constant                                                                  |

---

## Acceptance Criteria

### Functional

- [ ] `GET /api/v1/issues/stats` returns extended response with `closed_today`,
      `closed_this_week`, `closed_this_month`, `closed_all_time`, `delta_today`,
      `delta_week`, `delta_month`
- [ ] `GET /api/v1/issues/stats/history?period=day&range=30` returns exactly 30
      date buckets with zero-fills
- [ ] `GET /api/v1/issues/stats/history?period=week&range=12` returns 12
      Monday-anchored week buckets
- [ ] `GET /api/v1/issues/stats/history?period=month&range=12` returns 12 month
      buckets
- [ ] `/dashboard/issues/progress` renders 4 KPI cards with correct values and
      delta arrows
- [ ] Period selector (Day / Week / Month) updates `?period=` URL param and
      re-renders via Server Component — no client-side state flicker
- [ ] Current (partial) period bar renders at reduced opacity
- [ ] X-axis labels are human-readable ("Apr 14", "W16", "Apr")
- [ ] Tooltip correctly labels the current period as "(partial period)"
- [ ] All text in English (no Russian in JSX)
- [ ] Loading skeleton shown while Server Component fetches
- [ ] `visibleTo($user)` scope applied — users only see their own org's data
- [ ] Today Tasks page retains existing functionality (no regression)
- [ ] `DeltaBadge` with `polarity="negative-good"` renders red for positive
      delta (overdue card)

### Technical

- [ ] Single conditional aggregation query for summary (not 7 separate COUNTs)
- [ ] Composite index `(status, close_date)` migration has reversible `down()`
      method
- [ ] No `whereDate()` usage — all date comparisons use explicit range
      conditions
- [ ] `IssueStatsHistoryRequest` validates `period` as enum and `range` as 1–365
- [ ] Frontend imports `API_URL` from `@/shared/lib/config`, not `process.env`
- [ ] `getIssueStatsHistory` uses strict `!== undefined` check for optional
      `range`
- [ ] `'use server'` at top of `issue-stats-history.ts` and `issue-stats.ts`
- [ ] Chart uses all 4 chart-theme constants from `shared/lib/chart-theme.ts`
- [ ] `ISSUES_PROGRESS` route constant added to `shared/lib/routes.ts`
- [ ] Progress page is in `(progress)` route group, NOT in `(list)`
- [ ] `loading.tsx` exists for the progress sub-route
- [ ] No `any` types; all interfaces defined and matching backend contract
- [ ] `DeltaBadge` lives in `shared/ui/stats/`, not in any feature

### Non-functional

- [ ] History query with `range=365, period=day` completes in < 300ms (composite
      index + single GROUP BY)
- [ ] No regression on existing Issues List, Kanban pages (they are in `(list)`
      group, unaffected)
- [ ] `backend-contract-validator` agent confirms all TypeScript types match
      backend DTO/Resource field names

---

## Implementation Phases

### Phase 1 — Backend (estimated: 2–3h)

1. Write & run migration for `(status, close_date)` composite index
2. Extend `IssueStatsDTO` with 7 new summary fields
3. Modify `IssueStatsService::getStats()` — add single conditional aggregation
   query for new summary fields
4. Create `IssueStatsHistoryDTO`
5. Create `IssueStatsHistoryRequest`
6. Add `getHistory()` + private `periodDate()` to `IssueStatsService`
7. Add `history()` method to existing `IssueStatsController`
8. Register `issues/stats/history` route
9. Manual test: `curl /api/v1/issues/stats` (verify new fields),
   `curl /api/v1/issues/stats/history?period=week`

### Phase 2 — FSD cleanup (estimated: 1h, required before Phase 3)

1. Create `shared/ui/stats/delta-badge.tsx` with `polarity` prop
2. Move `IssueStats` type + `getIssueStats` from `today-briefing` →
   `features/issues`
3. Update `task-stats-block.tsx` imports
4. Export from `features/issues/index.ts`
5. Run `fsd-boundary-guard` to verify no violations

### Phase 3 — Frontend progress page (estimated: 3–4h)

1. Add `IssueStatsHistory*` types to `features/issues/model/types.ts`
2. Create `features/issues/api/issue-stats-history.ts`
3. Add `ISSUES_PROGRESS` to `shared/lib/routes.ts`
4. Create `app/dashboard/issues/(progress)/layout.tsx` (minimal)
5. Create `app/dashboard/issues/(progress)/progress/page.tsx`
6. Create `app/dashboard/issues/(progress)/progress/loading.tsx`
7. Create `issue-progress-kpi-cards.tsx`
8. Create `issue-progress-chart.tsx`
9. Create `issue-progress-page.tsx`
10. Add Progress tab to `issues-tabs-nav.tsx`
11. Export from `features/issues/index.ts`
12. Run `backend-contract-validator` to verify all types match backend

### Phase 4 — QA and agents (estimated: 1h)

1. Run `mr-reviewer` before push
2. Run `design-guardian` on the new progress page
3. Manual test: verify period switching, partial period opacity, tooltip labels,
   loading state

---

## Alternative Approaches Considered

**Alt 1 — Bundle summary inside history endpoint** Rejected: summary requires 7
DB queries regardless of period, and would re-run on every period switch.
Extending the existing `/issues/stats` snapshot separates concerns correctly —
summary is fetched once on page load, history changes with period.

**Alt 2 — Client-side period state with Server Action fetch** Rejected: leads to
race conditions (two concurrent requests resolving out-of-order). URL search
param + Server Component re-render is simpler, eliminates all client state for
period, and enables shareable/bookmarkable links.

**Alt 3 — Progress tab inside `(list)` route group** Rejected: forces Progress
page to mount `IssuesLayoutClient` (expensive client component with filter
context) and execute 4 parallel server calls for org/persons data that the chart
doesn't need.

**Alt 4 — New top-level page `/dashboard/progress`** Possible but adds sidebar
nav weight. Progress is intrinsically linked to issues. Tab under issues is more
discoverable.

---

## Dependencies & Risks

| Risk                                                                      | Mitigation                                                                                                                                                         |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `close_date` NULL for old issues closed before the observer was installed | Query filters `whereNotNull('close_date')` — old data is cleanly excluded. Document as data quality caveat: `closed_all_time` may undercount pre-observer closures |
| `whereDate()` usage in existing `getStats()` (due_date query)             | Fix the `whereDate('due_date', '<', now())` bug in `getStats()` as part of this work — same performance fix                                                        |
| Timezone mismatch (server TZ vs user TZ)                                  | Document as known limitation. "Closed today" uses server timezone. Full TZ support is a Phase 2+ concern                                                           |
| Week boundary edge case — YEARWEEK vs Carbon                              | `periodDate()` and the SQL GROUP BY both use ISO week (Monday start). Tested on both MySQL 8.x and MariaDB                                                         |
| `tasks` table name vs `Issue` model mental model                          | Confirmed: migration targets `tasks` table, not `issues`                                                                                                           |
| `IssueStats` type currently in `today-briefing`                           | Must fix in Phase 2 before implementing the progress page, otherwise import paths are wrong                                                                        |
| `DeltaBadge` currently private in `task-stats-block.tsx`                  | Must extract to `shared/ui/stats/` in Phase 2 before the progress components can use it                                                                            |

---

## References

### Internal

- Existing stats snapshot: `features/today-briefing/api/task-stats.ts` (to be
  moved)
- Stats block component: `features/today-briefing/ui/task-stats-block.tsx`
- Chart template: `features/summary/ui/MeetingStats.tsx` (`MeetingMonthlyChart`)
- Chart theme constants: `shared/lib/chart-theme.ts`
- KPI card primitive: `features/summary/ui/kpi-card.tsx`
- Issues tab nav: `features/issues/ui/issues-tabs-nav.tsx`
- Period URL param pattern: `month-switcher.tsx` in calendar feature
- Backend stats service:
  `/Users/slavapopov/Documents/WandaAsk_backend/app/Services/IssueStatsService.php`
- Backend stats DTO:
  `/Users/slavapopov/Documents/WandaAsk_backend/app/Domain/DTO/Issue/IssueStatsDTO.php`
- Issue model:
  `/Users/slavapopov/Documents/WandaAsk_backend/app/Models/Issue.php`
  (close_date, visibleTo scope)
- Route registration:
  `/Users/slavapopov/Documents/WandaAsk_backend/routes/api.php` (lines 199–213)

### Patterns to follow

- Tab navigation: `CLAUDE.md` → "Tab Navigation Convention"
- API layer: `CLAUDE.md` → "API Layer Conventions" (httpClient, 'use server', no
  raw fetch)
- Types live in `model/`, not in `api/`
- `API_URL` from `@/shared/lib/config`, not `process.env` directly
