# Issues Progress Feature

## Overview

The Issues Progress feature provides users with a live view of their task
dynamics — closed counts, current status, week-over-week comparison, and
deterministic agent feedback — all derived from a single backend endpoint with
no extra API calls.

Available at: `/dashboard/issues/progress`

---

## Pages & Components

### Page: `/dashboard/issues/progress`

**File:** `app/dashboard/issues/(progress)/progress/page.tsx`

Server Component. Fetches `getIssueStats()` and `getIssueStatsHistory(period)`
in parallel on every request. Accepts a `?period=day|week|month` query param
(defaults to `week`) that controls the time-series chart granularity.

```
Layout (IssuesTabsNav + Card)
└── IssueProgressPage
    ├── IssueProgressKpiCards    — 4 closed-count cards
    └── grid lg:grid-cols-2
        ├── IssueProgressChart   — bar chart with period toggle
        └── IssueWeeklySummary   — status rows + feedback bullets
```

---

## Components

### `IssueProgressKpiCards`

**File:** `features/issues/ui/issue-progress-kpi-cards.tsx`

Shows four stat cards in a `2-col / 4-col` grid:

| Card              | Value               | Delta                         |
| ----------------- | ------------------- | ----------------------------- |
| Closed Today      | `closed_today`      | vs yesterday (`delta_today`)  |
| Closed This Week  | `closed_this_week`  | vs last week (`delta_week`)   |
| Closed This Month | `closed_this_month` | vs last month (`delta_month`) |
| All Time          | `closed_all_time`   | —                             |

Deltas use the shared `DeltaBadge` component (green = positive, red = negative).

---

### `IssueProgressChart`

**File:** `features/issues/ui/issue-progress-chart.tsx`

Client Component. Recharts `BarChart` rendering closed-issue counts over time.

- **Period toggle** (Day / Week / Month) — updates `?period=` search param via
  `router.replace`, triggering a server re-fetch
- **Current period bar** is rendered at 45% opacity to signal incomplete data
- Uses shared chart theme constants from `shared/lib/chart-theme.ts`

---

### `IssueWeeklySummary` _(new)_

**File:** `features/issues/ui/issue-weekly-summary.tsx`

Server-compatible (no `'use client'`). Two panels:

#### Current Status

Row-based list showing the live snapshot of task counts with yesterday deltas:

| Metric      | Polarity                            |
| ----------- | ----------------------------------- |
| Total       | neutral (always 0 delta shown)      |
| In Progress | positive-good (`delta.in_progress`) |
| Completed   | positive-good (`delta.completed`)   |
| Overdue     | negative-good (`delta.overdue`)     |

Trend arrows (TrendingUp / TrendingDown) are colored green/red based on
polarity.

#### Performance Feedback

Generates 1–3 deterministic feedback bullets from the stats — no LLM call, no
extra fetch. Three feedback sources, each producing at most one bullet:

1. **Overdue trend** (`overdueFeedback`) — only fires when `overdue > 0`;
   reports whether overdue count rose, fell, or held since yesterday
2. **Weekly closed delta** (`weeklyClosedFeedback`) — compares
   `closed_this_week` with the previous week via `delta_week`; reports momentum
   or drop
3. **WIP overload** — fires when `in_progress > 8`, recommends limiting
   work-in-progress

Falls back to "All metrics look stable" when none of the above conditions
trigger.

---

### `TaskStatsBlock` _(updated)_

**File:** `features/today-briefing/ui/task-stats-block.tsx`

Used on the **Today / Tasks** page (`/dashboard/today/tasks`). Now includes a
section header "Task Dynamics" with a "View progress →" link that navigates to
`/dashboard/issues/progress`, letting users jump to the detailed view from the
daily briefing.

---

## API Layer

### `getIssueStats()`

**File:** `features/issues/api/issue-stats.ts`

```
GET /api/v1/issues/stats
```

Returns `IssueStats` — a snapshot including counts (`total`, `in_progress`,
`completed`, `overdue`, `open`, `paused`), closed counts (`closed_today`,
`closed_this_week`, `closed_this_month`, `closed_all_time`), top-level period
deltas (`delta_today`, `delta_week`, `delta_month`), and a nested `delta` object
with yesterday-vs-today deltas per status.

Scoped to the authenticated user's visible issues via the backend `visibleTo()`
scope (respects org + team membership).

### `getIssueStatsHistory(period, range?)`

**File:** `features/issues/api/issue-stats-history.ts`

```
GET /api/v1/issues/stats/history?period=week&range=12
```

Returns `IssueStatsHistory` — a time-series of `{ date, closed }` items, with
zero-filled gaps, sorted oldest → newest. Default range: 30 (day), 12
(week/month).

---

## Types

**File:** `features/issues/model/types.ts`

```ts
interface IssueStats {
  total: number;
  in_progress: number;
  completed: number;
  overdue: number;
  open: number;
  paused: number;
  closed_today: number;
  closed_this_week: number;
  closed_this_month: number;
  closed_all_time: number;
  delta_today: number; // closed today vs yesterday
  delta_week: number; // closed this week vs last week
  delta_month: number; // closed this month vs last month
  delta: {
    in_progress: number; // vs yesterday
    completed: number; // vs yesterday
    overdue: number; // vs yesterday
  };
}

interface IssueStatsHistory {
  period: 'day' | 'week' | 'month';
  range: number;
  items: { date: string; closed: number }[];
}
```

All types match the backend `IssueStatsDTO.toArray()` field names exactly.

---

## Backend

| Layer      | File                                                              |
| ---------- | ----------------------------------------------------------------- |
| Routes     | `routes/api.php` — `GET issues/stats`, `GET issues/stats/history` |
| Controller | `app/Http/Controllers/API/v1/IssueStatsController.php`            |
| Service    | `app/Services/IssueStatsService.php`                              |
| DTO        | `app/Domain/DTO/Issue/IssueStatsDTO.php`                          |
| DTO        | `app/Domain/DTO/Issue/IssueStatsHistoryDTO.php`                   |

The service uses a single SQL query with conditional aggregations (`FILTER`
clause) for the snapshot and `DATE_TRUNC` grouping for the time-series. History
gaps (periods with zero closed tasks) are filled in PHP before returning.

---

## What Is Not Implemented (requires backend work)

- **Telegram weekly digest** — requires a backend cron job + Telegram bot
  notification. The frontend has no channel to push to Telegram directly.
  Suggested approach: scheduled Laravel job on Monday morning that calls
  `IssueStatsService::getStats()` and sends a formatted message via the existing
  Telegram bot integration.
- **On-demand agent feedback via chat** — users can already ask Wanda for task
  analysis through the main chat. No additional wiring needed on the frontend.
