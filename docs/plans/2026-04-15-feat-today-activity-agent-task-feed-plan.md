---
title: 'feat: Today Activity Tab — Agent Task Activity Feed'
type: feat
status: completed
date: 2026-04-15
---

# ✨ Today Activity Tab — Agent Task Activity Feed

## Overview

The `/dashboard/today/activity` page is currently a stub ("Coming soon"). It
needs to display the `latest_run.activity` log for a specific agent task — a
chronological list of tool calls made during the most recent run, each showing
the tool name, description, success/failure badge, optional JSON result, and
timestamp.

Data comes exclusively from `GET /api/v1/agent-tasks/{id}` (embedded in
`latest_run.activity`). There is **no separate paginated activity endpoint** —
activity is always bounded by one run, so infinite scroll is not needed.

---

## Problem Statement / Motivation

The Activity tab exists in the Today section nav but shows nothing useful. Users
need visibility into what their AI agent actually did during a task run — which
tools it called, what succeeded, what failed, and what data was returned.

---

## Proposed Solution

Replace the stub with an async Server Component that:

1. Reads `?taskId=` from `searchParams`
2. Calls `getAgentTask(taskId)` (existing `features/agents/api/agents.ts`)
3. Extracts `task.latest_run.activity`
4. Renders a scrollable, SSR-first activity feed component

The page will show a graceful empty/idle state when `taskId` is absent from the
URL, `latest_run` is null, or `activity` is empty.

---

## Critical Pre-implementation Questions

### 🔴 CRITICAL: How does the page receive `taskId`?

The URL `/dashboard/today/activity` has no `{id}` segment. The current
`TodayBriefing` API (`GET /me/today`) returns meetings and tasks but **no agent
task reference**.

**Options to discuss with team:**

| Option | Description                                                       | Pros             | Cons                                  |
| ------ | ----------------------------------------------------------------- | ---------------- | ------------------------------------- |
| A      | `?taskId=X` searchParam set by the caller                         | Simple, explicit | Who sets it? From where?              |
| B      | `TodayBriefing` adds `agent_task_id` field                        | Clean            | Requires backend change               |
| C      | Page fetches agent tasks list and picks the most recently run one | No caller needed | Extra request, ambiguous "which task" |
| D      | Activity tab is hidden until a task context is available          | Best UX          | Requires conditional tab rendering    |

**Default assumption for this plan:** Use `?taskId=` searchParam. The Activity
tab will show an idle state ("Select an agent task to view its activity") when
no `taskId` is present. The `TodayTabsNav` already uses `preserveSearchParams`,
so `?taskId=X` will persist when switching between Today tabs.

**Caller for `taskId`:** A meeting or task card in the Today section that has an
associated agent run could set `?taskId=X` via a link. This requires
coordination with the `today-briefing` feature — out of scope for this plan, but
the Activity page should be ready to receive the param.

---

## Data Contract

### Backend endpoint

```
GET /api/v1/agent-tasks/{id}
Authorization: Bearer <token>
```

Returns `AgentTaskResource` with `latestRun.activityLogs` eagerly loaded (only
in `show()`, never in `index()` or `store()`).

### Activity item shape (from `AgentTaskResource.php`)

```ts
// features/agents/model/types.ts — ADD this interface
export interface AgentTaskActivityItem {
  id: number;
  tool_name: string; // free-form string, ~60+ known values
  description: string;
  tool_result: Record<string, unknown> | null; // null | array (max 20) | { raw: string }
  success: boolean;
  created_at: string; // ISO 8601
}
```

### Updated `AgentTaskLatestRun` shape

```ts
// features/agents/model/types.ts — ADD or update AgentTask.latest_run
export interface AgentTaskLatestRun {
  id: number;
  paperclip_issue_id: number | null;
  status: 'queued' | 'processing' | 'completed' | 'failed' | null;
  attempt: number;
  scheduled_for: string | null;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  metadata: {
    sandbox_result: unknown;
    sandbox: unknown;
    tool_calls: unknown[];
    llm_calls: unknown[];
  };
  activity: AgentTaskActivityItem[] | null; // null in index(), populated in show()
}
```

> **Note:** The existing `AgentActivityItem` (used by the global
> `/agent-activity` feed) has `agent_run_uuid` but **no `tool_result`**. Do NOT
> merge these two types — they are different shapes from different endpoints.

### `tool_result` shapes

| Condition     | Shape                                                         |
| ------------- | ------------------------------------------------------------- |
| No result     | `null`                                                        |
| Array result  | `Record<string, unknown>[]` (max 20 items, sliced on backend) |
| Scalar result | `{ raw: string }` (max 1000 chars)                            |

---

## Technical Approach

### Architecture

```
app/dashboard/today/activity/page.tsx       ← async Server Component (replace stub)
  └── features/agents/
        ├── model/types.ts                  ← ADD AgentTaskActivityItem, AgentTaskLatestRun
        ├── api/agents.ts                   ← verify getAgentTask() returns activity
        └── ui/
              ├── today-activity-feed.tsx   ← NEW client component
              └── agent-json-preview.tsx    ← REUSE existing
```

### No infinite scroll needed

Activity is embedded in a single `show()` response — the array is bounded by one
run and not paginated. Use a simple scrollable list, consistent with how
`AgentTaskRunDetail` renders run data.

### Run status header

Display a small run metadata header above the activity list showing:

- Run status badge (`queued` / `processing` / `completed` / `failed`)
- `started_at` and `finished_at` (duration)
- `error_message` when `status === 'failed'`

### Three empty/idle states

| Condition                         | Message                                     |
| --------------------------------- | ------------------------------------------- |
| No `taskId` in URL                | "Select an agent task to view its activity" |
| `latest_run === null`             | "This task has not run yet"                 |
| `activity` is null or empty array | Differentiate by status (see below)         |

| `latest_run.status` | Message                                                         |
| ------------------- | --------------------------------------------------------------- |
| `'queued'`          | "Run is queued — activity will appear once it starts"           |
| `'processing'`      | "Run is in progress — activity will appear here"                |
| `'completed'`       | "This run completed with no recorded tool calls"                |
| `'failed'`          | "Run failed with no recorded activity" (+ show `error_message`) |
| `null`              | "No activity recorded for this run"                             |

### No auto-refresh in v1

The page is static SSR — a snapshot at fetch time. When
`status === 'processing'`, show a note: "Refresh the page to see new activity."
Auto-polling can be added in a follow-up.

### Access control

Reuse the `getAgentAccessContext()` pattern from `features/agents/` — show
`AccessDeniedState` on 403 rather than letting the generic error boundary handle
it.

---

## Implementation Plan

### Phase 1 — Types (non-breaking)

**File:** `features/agents/model/types.ts`

- [x] Add `AgentTaskActivityItem` interface (with
      `tool_result: Record<string, unknown> | null`)
- [x] Add `AgentTaskLatestRun` interface (with
      `activity: AgentTaskActivityItem[] | null`)
- [x] Update `AgentTask.latest_run` to use `AgentTaskLatestRun | null` instead
      of `unknown`
- [x] Export new types from `features/agents/index.ts`

### Phase 2 — API verification

**File:** `features/agents/api/agents.ts`

- [x] Verify `getAgentTask(id)` response is cast to `AgentTask` (which now has
      typed `latest_run.activity`)
- [x] No new API function needed — `getAgentTask` already calls
      `GET /agent-tasks/{id}` which returns activity
- [x] Ensure `'use server'` is at top and `httpClient` is used (not raw `fetch`)

### Phase 3 — Activity Feed Component (new)

**File:** `features/agents/ui/today-activity-feed.tsx`

```tsx
'use client';

interface TodayActivityFeedProps {
  items: AgentTaskActivityItem[];
  run: AgentTaskLatestRun;
}

export function TodayActivityFeed({ items, run }: TodayActivityFeedProps);
```

- [x] Render run metadata header: status badge, `started_at` → `finished_at`
      duration, `error_message` on failure
- [x] For each activity item render an `<article>` card:
  - Success/failure `<Badge>` + `<span>` for `tool_name` (uppercase, muted)
  - `<p>` for `description`
  - `<AgentJsonPreview>` for `tool_result` when non-null (collapsible with a
    toggle button — click to expand/collapse)
  - Timestamp (`created_at`) in muted footer
- [x] Empty state within the component when `items.length === 0`

**File:** `features/agents/ui/today-activity-empty-state.tsx` (or inline in
feed)

- [x] Status-aware empty state text (per table above)

**Export:** Add to `features/agents/index.ts`

### Phase 4 — Page replacement

**File:** `app/dashboard/today/activity/page.tsx`

```tsx
// Pattern follows app/dashboard/today/meetings/page.tsx
import type { SearchParams } from 'next/dist/server/request/search-params';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ taskId?: string }>;
}

export default async function TodayActivityPage({ searchParams }: Props) {
  const { taskId } = await searchParams;

  // No taskId → idle state
  if (!taskId) {
    return <TodayActivityIdleState />;
  }

  // Check agent access
  const access = await getAgentAccessContext();
  if (!access.hasAccess) return <AccessDeniedState />;

  // Fetch task with activity
  const task = await getAgentTask(Number(taskId));

  // Render
  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title='Activity' />
      <CardBody>
        <TodayActivityFeed
          run={task.latest_run}
          items={task.latest_run?.activity ?? []}
        />
      </CardBody>
    </Card>
  );
}
```

- [x] Handle `latest_run === null` case (pass to `TodayActivityFeed` which shows
      status-aware empty state)
- [x] Error boundary from `app/dashboard/today/activity/error.tsx` already
      handles unexpected throws

### Phase 5 — Export / index

**File:** `features/agents/index.ts`

- [x] Export `TodayActivityFeed`
- [x] Export `AgentTaskActivityItem`, `AgentTaskLatestRun`

---

## File List

| File                                         | Action | Description                                                                           |
| -------------------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| `features/agents/model/types.ts`             | Modify | Add `AgentTaskActivityItem`, `AgentTaskLatestRun`; update `AgentTask.latest_run` type |
| `features/agents/api/agents.ts`              | Verify | Ensure `getAgentTask` uses `httpClient`, confirm `'use server'`                       |
| `features/agents/ui/today-activity-feed.tsx` | Create | New activity feed component with run header and item cards                            |
| `features/agents/index.ts`                   | Modify | Export new types and component                                                        |
| `app/dashboard/today/activity/page.tsx`      | Modify | Replace stub with real async Server Component                                         |

**Existing files reused (no changes):**

| File                                        | Reuse                                    |
| ------------------------------------------- | ---------------------------------------- |
| `features/agents/ui/agent-json-preview.tsx` | Render `tool_result` JSON                |
| `shared/ui/layout/skeleton.tsx`             | Loading state (already in `loading.tsx`) |
| `shared/ui/navigation/page-tabs-nav.tsx`    | Tab nav (already set up)                 |
| `shared/ui/layout/page-header.tsx`          | Page header                              |
| `shared/ui/layout/card-body.tsx`            | Card body                                |

---

## Acceptance Criteria

### Functional

- [ ] When `?taskId=` is absent from URL → idle state rendered ("Select an agent
      task to view its activity")
- [ ] When task has no `latest_run` → empty state rendered
- [ ] When `latest_run.activity` is null or `[]` → status-aware empty state
      rendered based on `latest_run.status`
- [ ] When `activity` has items → each item shows success/failure badge,
      `tool_name`, `description`, timestamp
- [ ] When `tool_result` is non-null → collapsible JSON preview rendered
- [ ] When `status === 'failed'` → `error_message` shown in run header
- [ ] When user is not an org member (403 from backend) → `AccessDeniedState`
      rendered, not error boundary
- [ ] Loading skeleton (`SkeletonList`) shown during page navigation (already in
      `loading.tsx`)

### Non-functional

- [ ] Page is a Server Component (SSR-first) — no unnecessary `'use client'`
- [ ] TypeScript: no `any`, no `unknown` casts on activity items
- [ ] `httpClient` used (not raw `fetch`) in all API calls
- [ ] `'use server'` at top of all files in `features/agents/api/`
- [ ] All UI text in English (no Russian strings in JSX)

### Quality Gates

- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` passes (TypeScript strict mode)
- [ ] No FSD boundary violations (cross-feature imports)

---

## Edge Cases

| Case                                                            | Handling                                                                     |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `?taskId=abc` (non-numeric)                                     | `Number('abc') === NaN` → `getAgentTask(NaN)` → backend 404 → error boundary |
| `?taskId=999999` (not found / not owned)                        | Backend 404 → error boundary                                                 |
| `tool_result` is `{ raw: "..." }` scalar                        | Render same as object — `AgentJsonPreview` handles any JSON                  |
| `tool_result` is a very large array (max 20 items from backend) | Display all 20 — no truncation needed                                        |
| `description` is very long                                      | CSS `break-words` / `line-clamp` for card readability                        |
| Activity during active run (`status === 'processing'`)          | Show partial list + "refresh to see new activity" note                       |
| Tab switch from Meetings with `preserveSearchParams=true`       | `?date=` preserved, `?taskId=` also preserved if set                         |

---

## Dependencies & Risks

| Dependency                                     | Risk                                       | Mitigation                                                                   |
| ---------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| Who sets `?taskId=` in the Today context       | High — page is useless without it          | Implement idle state; coordinate with `today-briefing` feature for follow-up |
| `getAgentTask()` may not be using `httpClient` | Medium — violates project conventions      | Verify and fix in Phase 2                                                    |
| `AgentTaskLatestRun` type change               | Low — `AgentTask.latest_run` was `unknown` | Non-breaking — only adds type safety                                         |
| Auto-refresh for live runs                     | Low — deferred to v2                       | Document limitation in empty state copy                                      |

---

## Out of Scope (Follow-up)

- Auto-polling when `status === 'processing'`
- Showing activity for historical runs (not just `latest_run`)
- Cross-linking activity items to artifacts/meetings/tasks in the system
- Run selection UI (picking from `GET /agent-tasks/{id}/runs`)
- Adding `agent_task_id` field to the `TodayBriefing` backend response
- Backend change to expose a dedicated `GET /agent-tasks/{id}/activity`
  paginated endpoint

---

## References

### Internal

- Stub page: `app/dashboard/today/activity/page.tsx`
- Loading skeleton: `app/dashboard/today/activity/loading.tsx`
- Tab nav: `features/today-briefing/ui/today-tabs-nav.tsx`
- Existing activity feed (global endpoint):
  `features/agents/ui/agent-activity-feed.tsx`
- JSON preview component: `features/agents/ui/agent-json-preview.tsx`
- Agent types: `features/agents/model/types.ts`
- Agent task API: `features/agents/api/agents.ts`
- Global activity API: `features/agents/api/activity.ts`
- Agents page (access control pattern): `app/dashboard/agents/activity/page.tsx`
- Meetings Today page (structural pattern):
  `app/dashboard/today/meetings/page.tsx`
- Infinite scroll hook: `shared/hooks/use-infinite-scroll.ts`
- Backend resource: `AgentTaskResource.php` (lines 94–103, `activity` mapping)
- Backend model: `AgentActivityLog.php` (tool_result normalization, line
  177–182)
- Backend enum: `AgentTaskRunStatus.php` (queued / processing / completed /
  failed)
