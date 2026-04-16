---
title: 'refactor: Unified StatusBadge shared component for issue/task statuses'
type: refactor
status: completed
date: 2026-04-16
---

# ♻️ refactor: Unified StatusBadge shared component for issue/task statuses

## Overview

Status values (issue status, task status, agent run status, etc.) are rendered
in at least **12 files** across `features/` using duplicated local helper
functions, inconsistent variant mappings, and even different base components.
This refactor extracts per-domain `StatusBadge` wrapper components into
`shared/ui/` (for truly shared types) and co-locates domain-specific ones inside
`entities/` or `features/<name>/ui/` so every render site uses one authoritative
source.

---

## Problem Statement / Motivation

The research surfaced three classes of problems:

### 1. Same status → different color in different places

| Status        | `issues-page.tsx`  | `issues-block.tsx`  | `team-dashboard-task-row.tsx` |
| ------------- | ------------------ | ------------------- | ----------------------------- |
| `open`        | `warning` (yellow) | `default` (grey)    | `default` (grey)              |
| `in_progress` | `primary` (violet) | `warning` (yellow)  | `warning` (yellow)            |
| `paused`      | `default` (grey)   | `destructive` (red) | `destructive` (red)           |

This violates the design system's semantic intent. One status must have one
color everywhere.

### 2. Helpers duplicated across files

`getStatusVariant(status: string)` is copy-pasted identically in:

- `features/agents/ui/agent-task-runs-list.tsx`
- `features/agents/ui/agent-task-run-detail.tsx`

And a near-identical variant lives in `agent-tasks-feed.tsx` and
`agent-tasks-block.tsx`.

### 3. `meeting-tasks.tsx` is entirely off-system

It renders a custom `<span>` with hardcoded Tailwind classes instead of
`<Badge>`. It has an icon next to the label but bypasses the design system
entirely.

---

## Proposed Solution

### Canonical variant mapping (agreed once, enforced everywhere)

**IssueStatus** (`open | in_progress | paused | done | review | reopen`):

| Status        | Variant       | Rationale                     |
| ------------- | ------------- | ----------------------------- |
| `open`        | `warning`     | Needs attention               |
| `in_progress` | `primary`     | Active, violet = brand action |
| `paused`      | `default`     | Neutral / waiting             |
| `done`        | `success`     | Completed                     |
| `review`      | `primary`     | Active review                 |
| `reopen`      | `destructive` | Regression                    |

**MeetingTaskStatus** (`open | in_progress | done | cancelled`):

| Status        | Variant       |
| ------------- | ------------- |
| `open`        | `warning`     |
| `in_progress` | `primary`     |
| `done`        | `success`     |
| `cancelled`   | `destructive` |

**TaskStatus (today-briefing)**
(`open | in_progress | paused | review | reopen | done`): Same as IssueStatus
mapping above.

**AgentRunStatus**
(`queued | processing | running | completed | success | failed | error`):

| Status                   | Variant       |
| ------------------------ | ------------- |
| `queued`                 | `default`     |
| `processing` / `running` | `warning`     |
| `completed` / `success`  | `success`     |
| `failed` / `error`       | `destructive` |

### Architecture

Create one **typed wrapper component per domain** that owns the mapping. Render
sites just pass the status value.

```
shared/ui/
  badge/
    Badge.tsx            (unchanged)
    index.ts             (unchanged)

features/issues/ui/
  issue-status-badge.tsx     ← NEW: wraps Badge, owns IssueStatus mapping
  index.ts                   ← re-export IssueStatusBadge

features/meeting/ui/
  meeting-task-status-badge.tsx  ← NEW: replaces custom <span> in meeting-tasks.tsx

features/agents/ui/
  agent-run-status-badge.tsx     ← NEW: replaces 4 duplicated helpers

features/today-briefing/ui/
  task-status-badge.tsx          ← NEW or reuse IssueStatusBadge if types align
```

> **Why not `shared/ui/`?** Status values are domain-specific (different unions
> per domain). Putting them in `shared/` would leak domain knowledge into the
> shared layer. Each feature owns its own status component. For `IssueStatus` —
> which is used in both `features/issues/` and `features/teams/` — the canonical
> component lives in `features/issues/ui/` and is imported from its `index.ts`.

---

## Technical Approach

### Phase 1 — Create wrapper components

#### `features/issues/ui/issue-status-badge.tsx`

```tsx
// features/issues/ui/issue-status-badge.tsx
import { Badge } from '@/shared/ui/badge';
import type { IssueStatus } from '../model/types';

const VARIANT: Record<
  IssueStatus,
  React.ComponentProps<typeof Badge>['variant']
> = {
  open: 'warning',
  in_progress: 'primary',
  paused: 'default',
  done: 'success',
  review: 'primary',
  reopen: 'destructive',
};

const LABEL: Record<IssueStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  paused: 'Paused',
  done: 'Done',
  review: 'Review',
  reopen: 'Reopened',
};

interface Props {
  status: IssueStatus;
  className?: string;
}

export function IssueStatusBadge({ status, className }: Props) {
  return (
    <Badge variant={VARIANT[status]} className={className}>
      {LABEL[status]}
    </Badge>
  );
}
```

> Note: The extended `IssueStatus` in `features/teams/model/dashboard-types.ts`
> adds `review` and `reopen`. These are already included in the mapping above.
> Check whether `features/teams` should import the canonical `IssueStatus` from
> `features/issues/model/types.ts` (allowed via `index.ts`) or keep its own
> extended type. Prefer consolidating into one type.

#### `features/meeting/ui/meeting-task-status-badge.tsx`

```tsx
// features/meeting/ui/meeting-task-status-badge.tsx
import { Badge } from '@/shared/ui/badge';
import type { MeetingTaskStatus } from '../model/types';

// Preserve icon support from meeting-tasks.tsx
import { CircleDot, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const CONFIG: Record<
  MeetingTaskStatus,
  {
    variant: React.ComponentProps<typeof Badge>['variant'];
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  open: { variant: 'default', label: 'Open', Icon: CircleDot },
  in_progress: { variant: 'primary', label: 'In Progress', Icon: Loader2 },
  done: { variant: 'success', label: 'Done', Icon: CheckCircle2 },
  cancelled: { variant: 'destructive', label: 'Cancelled', Icon: XCircle },
};

interface Props {
  status: MeetingTaskStatus;
  className?: string;
}

export function MeetingTaskStatusBadge({ status, className }: Props) {
  const { variant, label, Icon } = CONFIG[status];
  return (
    <Badge variant={variant} className={className}>
      <Icon className='mr-1 h-3 w-3' />
      {label}
    </Badge>
  );
}
```

> `meeting-tasks.tsx` currently renders a `<span>` not a `<Badge>`. The `Badge`
> component does not natively support an icon slot. Two options:
>
> - **Option A**: Add an optional `icon` slot to `Badge` (minimal change: just
>   add flex layout inside).
> - **Option B**: The `MeetingTaskStatusBadge` composes `<Badge>` and adds the
>   icon inside children (as shown above). Prefer Option B — no change to
>   `Badge.tsx` needed.

#### `features/agents/ui/agent-run-status-badge.tsx`

```tsx
// features/agents/ui/agent-run-status-badge.tsx
import { Badge } from '@/shared/ui/badge';

type AgentRunStatus =
  | 'queued'
  | 'processing'
  | 'running'
  | 'completed'
  | 'success'
  | 'failed'
  | 'error';

function getVariant(
  status: AgentRunStatus,
): React.ComponentProps<typeof Badge>['variant'] {
  switch (status) {
    case 'completed':
    case 'success':
      return 'success';
    case 'failed':
    case 'error':
      return 'destructive';
    case 'processing':
    case 'running':
      return 'warning';
    default:
      return 'default';
  }
}

const LABEL: Partial<Record<AgentRunStatus, string>> = {
  queued: 'Queued',
  processing: 'Processing',
  running: 'Running',
  completed: 'Completed',
  success: 'Success',
  failed: 'Failed',
  error: 'Error',
};

interface Props {
  status: AgentRunStatus;
  className?: string;
}

export function AgentRunStatusBadge({ status, className }: Props) {
  return (
    <Badge variant={getVariant(status)} className={className}>
      {LABEL[status] ?? status}
    </Badge>
  );
}
```

### Phase 2 — Update call sites

Replace local helpers with the new components. For each file:

#### `features/issues/ui/issues-page.tsx`

- Remove local `statusVariant()` and `formatIssueStatus()` functions (lines
  64–80 approx.)
- Import `IssueStatusBadge` from `../` (via index.ts)
- Replace
  `<Badge variant={statusVariant(issue.status)}>{formatIssueStatus(issue.status)}</Badge>`
  with `<IssueStatusBadge status={issue.status} className='w-fit' />`

#### `features/main-dashboard/ui/issues-block.tsx`

- Remove local `STATUS_VARIANT` and `STATUS_LABEL` records
- Import `IssueStatusBadge` from `@/features/issues`
- Replace render with `<IssueStatusBadge status={issue.status} />`

#### `features/teams/ui/dashboard/team-dashboard-task-row.tsx`

- Remove local `STATUS_VARIANT` and `STATUS_LABEL`
- Import `IssueStatusBadge` from `@/features/issues`
- Replace render with `<IssueStatusBadge status={task.status} />`
- Verify `task.status` type matches the extended IssueStatus (review, reopen) —
  adjust type definition if needed

#### `features/meeting/ui/meeting-tasks.tsx`

- Remove the file-private `StatusBadge` function component and `STATUS_CONFIG`
- Import `MeetingTaskStatusBadge` from `./meeting-task-status-badge`
- Replace `<StatusBadge status={task.status} />` with
  `<MeetingTaskStatusBadge status={task.status} />`

#### `features/today-briefing/ui/agenda-list.tsx`

- Remove local `STATUS_VARIANT` and `STATUS_LABEL`
- Import `IssueStatusBadge` (if `TaskStatus` aligns with `IssueStatus`) **or**
  create `features/today-briefing/ui/task-status-badge.tsx` mirroring the issue
  badge with overdue override logic
- The overdue override (`is_overdue → destructive + 'Overdue' label`) must be
  handled at the call site or via an `isOverdue?: boolean` prop on
  `TaskStatusBadge`

#### `features/agents/ui/agent-task-runs-list.tsx`

- Remove local `getStatusVariant()` function
- Import `AgentRunStatusBadge`
- Replace render

#### `features/agents/ui/agent-task-run-detail.tsx`

- Same as above — remove the duplicate `getStatusVariant()`

#### `features/agents/ui/agent-tasks-feed.tsx`

- Remove `getTaskStatusVariant()`
- Import `AgentRunStatusBadge`

#### `features/agents/ui/agent-tasks-block.tsx` (main-dashboard)

- Remove `RUN_STATUS_VARIANT`
- Import `AgentRunStatusBadge`

### Phase 3 — Consolidate IssueStatus type (optional but recommended)

Check whether `features/teams/model/dashboard-types.ts` duplicates
`IssueStatus`. If the extended type (`review | reopen` additions) is needed,
either:

- Export a `ExtendedIssueStatus` from `features/issues/model/types.ts` and
  re-export from its `index.ts`
- Or confirm the teams feature can import `IssueStatus` from `@/features/issues`

This prevents two `IssueStatus` types diverging silently.

---

## Acceptance Criteria

### Functional

- [ ] All 12 render sites use the new wrapper components, not local helpers
- [ ] `open` status renders identically (same color) across `issues-page`,
      `issues-block`, and `team-dashboard-task-row`
- [ ] `in_progress` and `paused` render identically across all issue/task
      contexts
- [ ] `meeting-tasks.tsx` still shows icon next to status label (via
      `MeetingTaskStatusBadge`)
- [ ] Agent run statuses render with one canonical mapping across 4 agent UI
      files
- [ ] The overdue override in `today-briefing/agenda-list.tsx` still works

### Code quality

- [ ] No `statusVariant`, `getStatusVariant`, `STATUS_VARIANT`, `STATUS_LABEL`,
      `formatIssueStatus` locals remain in any UI file
- [ ] No raw `fetch` or direct Badge usage for statuses remains in any call site
      — always via wrapper
- [ ] `IssueStatusBadge` is exported from `features/issues/index.ts`
- [ ] `MeetingTaskStatusBadge` is exported from `features/meeting/index.ts`
- [ ] `AgentRunStatusBadge` is exported from `features/agents/index.ts`

### TypeScript

- [ ] All wrappers are fully typed — no `string` fallback for status values
- [ ] No `any` in wrapper components
- [ ] `tsc --noEmit` passes with no new errors

### Testing

- [ ] `IssueStatusBadge` unit test: each of 6 statuses renders with correct
      variant class
- [ ] `MeetingTaskStatusBadge` unit test: each of 4 statuses; icon rendered
- [ ] `AgentRunStatusBadge` unit test: `completed`, `failed`, `processing`,
      `queued` cases

---

## Files to Create

| File                                                | Purpose                              |
| --------------------------------------------------- | ------------------------------------ |
| `features/issues/ui/issue-status-badge.tsx`         | Canonical IssueStatus badge          |
| `features/meeting/ui/meeting-task-status-badge.tsx` | MeetingTaskStatus badge with icon    |
| `features/agents/ui/agent-run-status-badge.tsx`     | AgentRunStatus badge                 |
| `features/today-briefing/ui/task-status-badge.tsx`  | TaskStatus badge (with overdue prop) |

## Files to Modify

| File                                                      | Change                                                          |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| `features/issues/ui/issues-page.tsx`                      | Remove local helpers; use `IssueStatusBadge`                    |
| `features/issues/index.ts`                                | Export `IssueStatusBadge`                                       |
| `features/main-dashboard/ui/issues-block.tsx`             | Remove local records; use `IssueStatusBadge`                    |
| `features/teams/ui/dashboard/team-dashboard-task-row.tsx` | Remove local records; use `IssueStatusBadge`                    |
| `features/meeting/ui/meeting-tasks.tsx`                   | Remove file-private `StatusBadge`; use `MeetingTaskStatusBadge` |
| `features/meeting/index.ts`                               | Export `MeetingTaskStatusBadge`                                 |
| `features/today-briefing/ui/agenda-list.tsx`              | Remove local records; use `TaskStatusBadge`                     |
| `features/agents/ui/agent-task-runs-list.tsx`             | Remove `getStatusVariant`; use `AgentRunStatusBadge`            |
| `features/agents/ui/agent-task-run-detail.tsx`            | Remove duplicate `getStatusVariant`; use `AgentRunStatusBadge`  |
| `features/agents/ui/agent-tasks-feed.tsx`                 | Remove `getTaskStatusVariant`; use `AgentRunStatusBadge`        |
| `features/agents/ui/agent-tasks-block.tsx`                | Remove `RUN_STATUS_VARIANT`; use `AgentRunStatusBadge`          |
| `features/agents/index.ts`                                | Export `AgentRunStatusBadge`                                    |

## Files Not Changed

| File                                                           | Reason                                                            |
| -------------------------------------------------------------- | ----------------------------------------------------------------- |
| `features/main-dashboard/ui/agenda-status-badge.tsx`           | Already a dedicated component — the right pattern                 |
| `features/teams/ui/dashboard/team-dashboard-tab-readiness.tsx` | Domain-specific readiness type; already isolated                  |
| `features/teams/ui/dashboard/team-dashboard-tab-health.tsx`    | Domain-specific health type; already isolated                     |
| `features/agents/ui/agent-tasks-list.tsx`                      | Boolean enabled/disabled badge — not a "status" in the same sense |
| `features/agents/ui/agent-activity-feed.tsx`                   | Boolean success badge — not run status                            |
| `shared/ui/badge/Badge.tsx`                                    | No change needed                                                  |

---

## Key Design Decision: Canonical Color Mapping

The **chosen canonical mapping for IssueStatus** (supersedes any local
inconsistency):

| Status        | Variant       | Color (design system)          |
| ------------- | ------------- | ------------------------------ |
| `open`        | `warning`     | Amber/yellow — needs attention |
| `in_progress` | `primary`     | Violet — brand active state    |
| `paused`      | `default`     | Grey — neutral waiting         |
| `done`        | `success`     | Green — completed              |
| `review`      | `primary`     | Violet — active review         |
| `reopen`      | `destructive` | Red — regressed                |

This resolves the 3-way inconsistency (the `issues-page.tsx` mapping was the
most semantically correct and is adopted as canonical).

---

## Dependencies & Risks

| Risk                                                              | Mitigation                                                                                                                  |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Two `IssueStatus` types (narrow vs extended) diverging            | Consolidate in Phase 3; `team-dashboard-task-row.tsx` uses the extended type — verify imports resolve                       |
| `meeting-tasks.tsx` icon rendering — `Badge` has no icon slot     | Use Option B: icon in children inside `MeetingTaskStatusBadge`                                                              |
| `today-briefing` overdue override needs special handling          | Add `isOverdue?: boolean` prop to `TaskStatusBadge`; if true, force `destructive` + `'Overdue'` label                       |
| FSD boundary: `features/teams/` importing from `features/issues/` | Check FSD rules — cross-feature import is a violation. **If blocked**: move `IssueStatus` type + badge to `entities/issue/` |

### FSD Cross-Feature Import Note

`features/main-dashboard/ui/issues-block.tsx` and
`features/teams/ui/dashboard/team-dashboard-task-row.tsx` would need to import
from `@/features/issues`. This is a cross-feature import, which violates FSD
rules.

**Resolution options (pick one):**

1. Move `IssueStatusBadge` + `IssueStatus` type to `entities/issue/ui/` and
   `entities/issue/model/types.ts` — cleanest FSD compliance
2. Accept the cross-feature import if the project's FSD enforcement is lenient
   on this (check `fsd-boundary-guard` output)

**Recommended:** Move to `entities/issue/` since `IssueStatus` is a shared
domain concept used across multiple features. This is what `entities/` is for.

---

## References & Research

### Internal — key files

- `shared/ui/badge/Badge.tsx` — Badge component, 5 variants:
  `default | primary | success | warning | destructive`
- `features/issues/model/types.ts` — `IssueStatus` (4 values) +
  `ISSUE_STATUS_OPTIONS` + `isIssueStatus` guard
- `features/issues/ui/issues-page.tsx:64–95` — current status rendering (local
  helpers)
- `features/main-dashboard/ui/issues-block.tsx:15–30` — inconsistent variant for
  `open` and `in_progress`
- `features/teams/ui/dashboard/team-dashboard-task-row.tsx:12–31` — extended
  IssueStatus with `review|reopen`
- `features/meeting/ui/meeting-tasks.tsx:8–50` — off-system custom span
  StatusBadge
- `features/today-briefing/ui/agenda-list.tsx:15–31` — overdue override pattern
- `features/agents/ui/agent-task-runs-list.tsx:12–19` — duplicated
  `getStatusVariant`
- `features/agents/ui/agent-task-run-detail.tsx:17–24` — exact copy of above
- `features/main-dashboard/ui/agenda-status-badge.tsx` — **reference pattern**
  to follow

### Pattern to follow

`features/main-dashboard/ui/agenda-status-badge.tsx` is the only file that
already extracts a dedicated typed wrapper component. It is the exact pattern
this refactor should replicate for the other domains.
