---
title: 'feat: Surface User Focus and Task Priority Indicators Across the App'
type: feat
status: active
date: 2026-04-24
---

# feat: Surface User Focus and Task Priority Indicators Across the App

## Overview

`features/user-focus/` is fully built but only integrated in one place
(`/dashboard/today/tasks`) as a readonly block. Meanwhile `Issue.priority`
(numeric, with `PRIORITY_LEVELS` mapping) exists in the type system but has
**zero visual presence** in the list or kanban views — `getPriorityLevel()` is
dead code.

This plan answers two distinct questions:

1. **Where else can we surface the user's active focus text** (non-intrusively)?
2. **Where and how can we show per-task priority/importance** in kanban and list
   views without requiring the user to open a detail page?

---

## Current State

| Location                           | Focus text shown?              | Priority shown?              |
| ---------------------------------- | ------------------------------ | ---------------------------- |
| `/dashboard/today/tasks`           | ✅ Readonly `FocusBlock` (new) | ❌                           |
| `/dashboard/issues/(list)/list`    | ❌                             | ❌ (field exists, no UI)     |
| `/dashboard/issues/(list)/kanban`  | ❌                             | ❌                           |
| Issue detail page                  | ❌                             | ✅ Form dropdown only        |
| Team dashboard (`/teams/[id]`)     | ❌                             | ✅ Colored dot (high/medium) |
| Main dashboard (`/dashboard/main`) | ❌                             | ❌                           |
| Profile page                       | ❌                             | N/A                          |

**Two separate priority systems** exist and must not be conflated:

- `Issue.priority: number` — numeric, 5 levels (500 Critical → −500 Minimal),
  used in the task/issue tracker
- `DashboardTaskCard.priority: 'high' | 'medium' | 'normal' | null` — string
  enum, used in team dashboard task rows

---

## Proposed Surfaces

### Surface A — Editable FocusBlock on Today/Activity or Profile Page

**Where:** `app/dashboard/today/activity/page.tsx` (or a new dedicated route
`/dashboard/today/focus`) — OR the user profile page `/dashboard/profile`.

**Why:** The editable `FocusBlock` is implemented but no page uses it yet. Users
can only read their focus, not set it.

**Implementation:**

- Add `<FocusBlock initialFocus={focus} />` (no `readonly` prop) to the profile
  page sidebar or a "Focus" section in `today/activity`
- Reuse the existing `getUserFocus()` server action — no backend changes

**Intrusiveness:** None — it's opt-in, collapsed when empty.

---

### Surface B — Focus Reminder Banner in Kanban / Issues List Header

**Where:** `app/dashboard/issues/(list)/layout.tsx` — above the
`SharedFiltersBar`

**What:** A slim banner (1 line tall) that shows the active focus text and
deadline when the user has one set. Dismissible per session (localStorage).

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎯  Active focus: "Finish onboarding flow" · 2 days left    [×] │
└─────────────────────────────────────────────────────────────────┘
```

**Why:** The user is likely working issues related to their focus. The reminder
is contextual and non-blocking — it does not change the list or filter anything.

**Component:** `features/user-focus/ui/focus-reminder-banner.tsx`

- Client Component (needs `localStorage` for dismiss state)
- Receives `focus: UserFocus | null` as prop (fetched by parent Server
  Component)
- Returns `null` if no focus or dismissed
- Styled: `border-b border-primary/20 bg-primary/5 px-4 py-2 text-sm`

**Intrusiveness:** Low — single line, has a close button, stays dismissed.

---

### Surface C — Priority Badge on Kanban Cards

**Where:** `features/kanban/ui/kanban-card-item.tsx`

**What:** A small priority indicator in the card's bottom metadata row, next to
the assignee and date. Only rendered for non-Normal priorities (value ≠ 0).

```
┌────────────────────────────────────┐
│ Fix login redirect bug             │
│ Short description truncated…       │
│ [bug]                              │
│ 👤 Alice       ● High   Apr 24    │
└────────────────────────────────────┘
```

**Component:** `features/issues/ui/issue-priority-badge.tsx`

- Wraps the existing `PRIORITY_LEVELS` + `getPriorityLevel()` logic
- Renders a colored dot + label: `<span className={color}>● {label}</span>`
- Returns `null` when `priority === 0` (Normal — no visual noise)
- Exported from `features/issues/index.ts`

**`KanbanCard` type** — currently does NOT have a `priority` field. Two paths:

1. **Add `priority: number` to `KanbanCard`** and include it in the backend API
   response (check `IssueResource` — it already returns `priority`)
2. **Use `Issue` type directly** in the kanban (the kanban already renders
   issues, just maps them to `KanbanCard`). Simpler: include priority in the
   mapping.

**Preferred approach:** Path 1 — add `priority: number` to `KanbanCard` model.
The mapping in `tasks-kanban-client.tsx` or wherever Issues are converted to
KanbanCards should pass through `priority`.

**Intrusiveness:** None for Normal priority (hidden). Minimal for others — one
dot + word in the footer row.

---

### Surface D — Priority Column in Issues List Table

**Where:** `features/issues/ui/issues-page.tsx` (the list table)

**What:** Add a "Priority" column between "Status" and "Scope" (or as last
column before actions). Render `IssuePriorityBadge` inline.

Alternative: **No new column** — instead render a priority dot next to the issue
name (like team dashboard `TeamDashboardTaskRow` already does for
DashboardTaskCard). This avoids widening the table.

**Recommended approach — dot next to the title:**

```
│ ● Fix login redirect  │  bug  │  open  │  ...
  ↑ colored dot (only shown for Critical/High)
```

This matches the existing team dashboard pattern, requires minimal table layout
change, and is already proven in `team-dashboard-task-row.tsx`.

**Intrusiveness:** None for Normal/Low/Minimal (dot hidden). One colored dot for
Critical/High.

---

### Surface E — Focus-Linked Issue Highlight

**Where:** `features/kanban/ui/kanban-card-item.tsx` and
`features/issues/ui/issues-page.tsx`

**Concept:** If the issue `name` or `description` contains a keyword from the
user's `focus_text`, subtly highlight the card with a left border accent.

**Assessment:** This is the highest complexity surface. It requires:

1. Passing `focus_text` down to every card (prop drilling or context)
2. Client-side keyword matching
3. Risk of false positives / confusing UX

**Recommendation: Defer or skip.** The simpler surfaces (B, C, D) provide clear
value. This one adds complexity without proportional benefit.

---

### Surface F — Focus Block in Main Dashboard

**Where:** `features/main-dashboard/` — as a block in the dashboard block system
(alongside upcoming-agendas, task-stats, etc.)

**What:** A compact readonly `FocusBlock` in the sidebar area of the main
dashboard. If no focus is set, show a "Set your focus →" CTA linking to the
profile/today page.

**Component:** `features/main-dashboard/ui/focus-dashboard-block.tsx` — wraps
`FocusBlock` from `features/user-focus`, adds the CTA fallback.

**Intrusiveness:** None — it's one block in a block grid.

---

## Recommended Implementation Order

| Priority | Surface                                        | Effort                              | Value                                 |
| -------- | ---------------------------------------------- | ----------------------------------- | ------------------------------------- |
| 1        | **C — Priority badge on kanban cards**         | Small (add field + badge component) | High — closes dead-code gap           |
| 2        | **D — Priority dot in issues list**            | Small (3-line change)               | High — consistent with team dashboard |
| 3        | **A — Editable FocusBlock on profile**         | Tiny (one import + render)          | Medium — unblocks user setting focus  |
| 4        | **B — Focus reminder banner in issues layout** | Small (new component)               | Medium — contextual reminder          |
| 5        | **F — Focus block in main dashboard**          | Small (new block)                   | Medium — ambient awareness            |
| 6        | **E — Focus-linked card highlight**            | Large                               | Low — complex, risky UX               |

---

## Technical Plan

### Step 1: `IssuePriorityBadge` component

**File:** `features/issues/ui/issue-priority-badge.tsx`

```tsx
// features/issues/ui/issue-priority-badge.tsx
import { getPriorityLevel } from '../model/types';

export function IssuePriorityBadge({ priority }: { priority: number }) {
  const level = getPriorityLevel(priority);
  if (priority === 0) return null;
  return (
    <span className={`text-xs font-medium ${level.color}`}>
      ● {level.label}
    </span>
  );
}
```

Export from `features/issues/index.ts`.

### Step 2: Add `priority` to `KanbanCard`

**File:** `features/kanban/model/types.ts` — add `priority: number` to
`KanbanCard` interface.

**File:** wherever Issues are mapped to KanbanCards (likely
`features/issues/ui/tasks-kanban-client.tsx` or `features/issues/api/issues.ts`)
— pass `priority: issue.priority ?? 0`.

Verify `IssueResource` returns `priority` (it does per the plan from Apr 23).

### Step 3: Add badge to `KanbanCardItem`

**File:** `features/kanban/ui/kanban-card-item.tsx`

In the bottom metadata row, add:

```tsx
import { IssuePriorityBadge } from '@/features/issues';
// ...
<IssuePriorityBadge priority={card.priority} />;
```

### Step 4: Priority dot in Issues list

**File:** `features/issues/ui/issues-page.tsx`

In the issue name cell, prepend
`<IssuePriorityBadge priority={issue.priority} />`.

### Step 5: Editable FocusBlock on profile

**File:** `app/dashboard/profile/page.tsx`

```tsx
import { FocusBlock } from '@/features/user-focus';
import { getUserFocus } from '@/features/user-focus/api/focus';
// ...
const focus = await getUserFocus();
// Render <FocusBlock initialFocus={focus} /> in a sidebar or section
```

### Step 6: `FocusReminderBanner` component

**File:** `features/user-focus/ui/focus-reminder-banner.tsx`

- `'use client'` — needs `localStorage`
- Props: `focus: UserFocus | null`
- State: `dismissed` from `localStorage.getItem('focus-banner-dismissed')`
- Renders slim single-line bar with focus text, deadline, close button

**File:** `app/dashboard/issues/(list)/layout.tsx` — fetch focus in a Server
Component wrapper, pass to banner:

```tsx
const focus = await getUserFocus();
<FocusReminderBanner focus={focus} />;
```

Export `FocusReminderBanner` from `features/user-focus/index.ts`.

---

## Acceptance Criteria

- [ ] `IssuePriorityBadge` renders correctly for all 5 priority levels; returns
      `null` for Normal (0)
- [ ] `KanbanCard` type includes `priority: number`; badge is visible on kanban
      cards with non-zero priority
- [ ] Issues list table shows priority dot next to issue name for Critical/High
      issues
- [ ] Editable `FocusBlock` is accessible on the profile page (user can
      set/clear focus without going to today/tasks)
- [ ] `FocusReminderBanner` appears in the issues layout when focus is active;
      dismisses and stays dismissed (session)
- [ ] No FSD boundary violations (no cross-feature imports; `IssuePriorityBadge`
      is exported via `features/issues/index.ts`)
- [ ] All new components pass `npm run lint` and `npm run build` cleanly
- [ ] `getPriorityLevel()` is no longer dead code — used by `IssuePriorityBadge`

## Non-Goals

- No per-task `is_focus` boolean flag (the focus concept is user-level, not
  per-task)
- No focus-linked card highlight (Surface E — deferred)
- No changes to the backend API for this plan (all data already exists)
- No changes to the team dashboard (it already has its own priority dot pattern)

## Files to Change

| File                                               | Change                                 |
| -------------------------------------------------- | -------------------------------------- |
| `features/issues/ui/issue-priority-badge.tsx`      | Create                                 |
| `features/issues/index.ts`                         | Export `IssuePriorityBadge`            |
| `features/kanban/model/types.ts`                   | Add `priority: number` to `KanbanCard` |
| `features/kanban/ui/kanban-card-item.tsx`          | Render `IssuePriorityBadge`            |
| `features/issues/ui/issues-page.tsx`               | Add priority dot to name cell          |
| `features/issues/ui/tasks-kanban-client.tsx`       | Pass `priority` in card mapping        |
| `features/user-focus/ui/focus-reminder-banner.tsx` | Create                                 |
| `features/user-focus/index.ts`                     | Export `FocusReminderBanner`           |
| `app/dashboard/issues/(list)/layout.tsx`           | Fetch focus, render banner             |
| `app/dashboard/profile/page.tsx`                   | Add editable `FocusBlock`              |

## References

- `features/user-focus/` — fully built feature, `FocusBlock` has both modes
- `features/issues/model/types.ts:222` — `PRIORITY_LEVELS` + `getPriorityLevel`
- `features/kanban/ui/kanban-card-item.tsx` — current card layout (no priority)
- `features/teams/ui/dashboard/team-dashboard-task-row.tsx` — existing priority
  dot pattern (string enum)
- `docs/plans/2026-04-23-feat-issue-form-author-priority-deadline-plan.md` —
  prior priority work
- `docs/plans/2026-04-16-refactor-unified-status-badge-component-plan.md` —
  badge pattern conventions
