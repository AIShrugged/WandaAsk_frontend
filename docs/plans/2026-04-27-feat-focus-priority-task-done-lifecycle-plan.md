---
title:
  'feat: Focus and Priority Task Done Lifecycle — Auto-Clear and User
  Notification'
type: feat
status: completed
date: 2026-04-27
---

# feat: Focus and Priority Task Done Lifecycle — Auto-Clear and User Notification

## Overview

When a user has set their personal focus (a text goal + optional deadline stored
in `InsightShortTerm`) or a high-priority issue transitions to `status: 'done'`,
the UI currently has no awareness of that event. Focus banners stay up, priority
badges keep pulsing, and the "top" pinned area — if we add one — would show
completed work indefinitely.

This plan covers:

1. **Auto-dismissing / hiding** focus-related UI when the referenced task moves
   to `done`
2. **Notifying the user** (toast + optional in-page alert) that a tracked task
   is now done
3. **Expiration-aware re-show** of the focus banner (today-only, next-session
   reset)
4. **Ideas for extended lifecycle UX** that the team can prioritize after the
   core is done

---

## Problem Statement / Motivation

After the `feat(user-focus)` PR (#72), the app surfaces:

- `FocusReminderBanner` — shown at the top of the Issues layout (persists until
  explicitly dismissed via localStorage)
- Priority badges on every issue row and kanban card
- A focus edit block on the profile/account page

**Gaps identified:**

| Gap                                                                                   | Impact                                                                                 |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Focus banner stays visible after the referenced task is closed                        | User re-reads a stale "Focus" they already completed                                   |
| High/Critical priority badge stays on a `done` issue in list and kanban (done column) | Misleading visual — "Critical" label on a closed item looks like an unresolved problem |
| User gets no positive feedback when their focus work is done                          | Missed opportunity for motivation / satisfaction moment                                |
| `FocusReminderBanner` dismiss is permanent (localStorage key never cleared)           | If user opens a new browser or device, the banner is stuck open forever                |

---

## Scope

### In scope

- Hide/auto-clear focus banner when `focus.deadline` has passed AND backend
  `expires_at` is in the past
- Suppress priority badge rendering for issues with `status === 'done'`
  (configurable)
- Toast notification when any mutation sets an issue to `done` and that issue
  had a non-normal priority or was mentioned in the user's focus text
- "Congratulations" in-page state in the FocusBlock when focus expires naturally
- Reset localStorage dismiss key when a new focus is set
- Refine focus banner dismiss to be session-scoped instead of permanent (use
  `sessionStorage`)

### Out of scope (for this plan)

- Polling / real-time updates — triggering notifications from other users'
  mutations
- Email or push notifications
- A dedicated "completed focus history" view

---

## Current Architecture Reference

```
features/user-focus/
  types.ts                         → UserFocus { focus_text, deadline, expires_at }
  api/focus.ts                     → getUserFocus / setUserFocus / clearUserFocus
  ui/focus-block.tsx               → FocusBlock (editable + readonly modes)
  ui/focus-reminder-banner.tsx     → FocusReminderBanner (dismissible strip)
  index.ts                         → public API

features/issues/
  model/types.ts                   → Issue { status: IssueStatus, priority: number }
                                      IssueStatus = 'open'|'in_progress'|'paused'|'review'|'reopen'|'done'
  ui/issue-priority-badge.tsx      → IssuePriorityBadge (returns null for priority=0)
  ui/issues-page.tsx               → inline status updates → toast.success('Issue updated')
  api/issues.ts                    → updateIssue → revalidatePath('/dashboard/issues')

features/kanban/
  ui/kanban-card-item.tsx          → renders IssuePriorityBadge
  api/kanban.ts                    → moveKanbanCard → PATCH /issues/{id}
```

**Key invariant:** `focus` is a **user-level goal string**, not a foreign key to
an issue. There is no `focus_task_id` — the system has no direct linkage between
the focus text and a specific Issue row.

---

## Proposed Solution

### A. Session-scoped banner dismiss (quick win)

**Problem:** `localStorage` dismiss is permanent and survives browser restarts
and new devices.  
**Fix:** Switch to `sessionStorage` so the banner re-appears each session, but
still stays out of the way for the current one.

Also: **clear the dismiss key when `setUserFocus` succeeds** so new focus always
starts fresh.

```
features/user-focus/ui/focus-reminder-banner.tsx   ← change localStorage → sessionStorage
features/user-focus/api/focus.ts                   ← after setUserFocus success, call
                                                      sessionStorage.removeItem(DISMISS_KEY)
                                                      (can't do server-side; do in client hook)
features/user-focus/ui/focus-block.tsx             ← in useFocusActions().handleSave, after
                                                      toast.success, call session clear helper
```

### B. Expired focus — "You did it!" state

**Problem:** When `expires_at` < now and `focus_text` is not null, the user is
still shown an editable focus with no feedback that it's expired.

**Fix:**

- In `FocusBlock` readonly view: detect
  `isExpired = expires_at && new Date(expires_at) < new Date()`
- If expired, show a green celebration variant with a "Clear & set new focus"
  CTA instead of normal edit
- `FocusReminderBanner`: hide automatically when `isExpired` (no need for
  localStorage dismiss at all when expired)

```
features/user-focus/ui/focus-block.tsx
  → add isExpired check in FocusText / FocusBlock
  → render <ExpiredFocusView> with CheckCircle icon, green accent, "Nice work!" text

features/user-focus/ui/focus-reminder-banner.tsx
  → add early return: if (isExpired(focus)) return null;
```

### C. Suppress priority badge on done issues

**Problem:** A "Critical" badge on a `status: 'done'` issue looks like an
unresolved problem.  
**Fix:** `IssuePriorityBadge` accepts an optional `status` prop; returns `null`
when status is `'done'`.

```
features/issues/ui/issue-priority-badge.tsx
  → add optional prop: status?: IssueStatus
  → if (status === 'done') return null;

features/issues/ui/issues-page.tsx  (line ~493)
  → pass status={issue.status} to IssuePriorityBadge

features/kanban/ui/kanban-card-item.tsx  (line ~72)
  → pass status={card.status} to IssuePriorityBadge
  → done column cards lose priority badge automatically
```

### D. Toast notification when a prioritized issue moves to done

**Problem:** No user feedback that their "High priority" or "Critical" work is
done.  
**Fix:** In the two places where status changes happen, detect the transition to
`done` and show a richer toast.

**Places to update:**

1. `features/issues/ui/issues-page.tsx` — `updateIssueInline()` handler
2. `features/kanban/api/kanban.ts` +
   `features/kanban/ui/tasks-kanban-client.tsx` — `moveKanbanCard` handler

**Logic:**

```ts
// After a successful update where newStatus === 'done'
const level = getPriorityLevel(issue.priority);
if (level && level.label !== 'Normal') {
  toast.success(`✓ ${issue.name}`, {
    description: `${level.label} issue marked as done`,
    duration: 5000,
  });
} else {
  toast.success('Issue updated');
}
```

**Files:**

```
features/issues/ui/issues-page.tsx         ← updateIssueInline, add done-check toast
features/kanban/ui/tasks-kanban-client.tsx ← handleDrop / onDrop, add done-check toast
```

### E. "Focus task done?" prompt

Since focus is free text (not linked to an issue ID), we can't auto-detect that
the issue the user was thinking about is done. However:

- When ANY issue transitions to `done` AND the user currently has an active
  focus, show a secondary action in the toast: **"Clear your focus?"** with a
  button that fires `clearUserFocus()`.

```ts
toast.success('Issue marked as done', {
  description: focus?.focus_text
    ? `Still working on: "${focus.focus_text.slice(0, 60)}..."`
    : undefined,
  action: focus
    ? { label: 'Clear focus', onClick: () => clearFocusClient() }
    : undefined,
});
```

This requires the focus state to be accessible in the component. Since
issues-page is a Client Component already, it can receive `initialFocus` as a
prop from the Server Component layout.

**Files:**

```
app/dashboard/issues/(list)/layout.tsx           ← already fetches focus; pass it as prop
features/issues/ui/issues-list-tab.tsx           ← add focusText prop, thread to issues-page
features/issues/ui/issues-page.tsx               ← receive focus prop, use in updateIssueInline
```

---

## Additional Ideas to Consider

These extend the feature further and are left for prioritization:

### Idea 1: "Top Pinned" section for active focus-relevant issues

Surface issues that match the focus text via keyword search as a pinned section
above the main list. Requires backend support (a `/issues/search?q=<focus_text>`
or a new `/issues?focus_match=1` filter). No backend route exists yet.

### Idea 2: Priority filter — "Hide done" toggle

Add a toggle in the issues filter bar: "Hide done issues" (default: on). This
already might partially exist via status filter but could be a quick toggle
shortcut.

### Idea 3: Focus completion streak / history

Store cleared focus items (before DELETE) in a separate table or soft-delete
pattern. Surface a simple "Focus history" in the profile account page. Requires
backend migration.

### Idea 4: Sound / visual confetti on "done" for Critical issues

When a Critical (500) issue moves to done, trigger a brief confetti or
color-pulse animation. Use `canvas-confetti` library. Pure frontend.

### Idea 5: Focus expiry push notification (if app is PWA)

Register a service worker and schedule a browser push notification 1 day before
focus deadline. Requires PWA manifest + SW setup.

### Idea 6: Daily digest email (backend feature)

Send a daily summary email listing any focus items that are expiring today. Pure
backend work.

---

## Technical Considerations

- `IssuePriorityBadge` change is backward-compatible — `status` is optional,
  existing callers unaffected
- `sessionStorage` switch is non-breaking — on first session, key won't exist,
  so banner shows normally
- Focus prop threading (Idea D) adds a `focus?: UserFocus | null` prop to
  `IssueListPage` — clean but requires one extra prop drill from layout through
  tab wrapper
- The toast action for "Clear focus" calls a Server Action inside an onClick —
  this needs to be wrapped in `startTransition` since it triggers revalidation

---

## Acceptance Criteria

- [x] **C1:** `IssuePriorityBadge` returns `null` when `status === 'done'`;
      verified in issues list and kanban done column
- [x] **C2:** `FocusReminderBanner` uses `sessionStorage` instead of
      `localStorage` for dismiss
- [x] **C3:** `FocusReminderBanner` auto-hides (returns null) when
      `focus.expires_at` is in the past
- [x] **C4:** `FocusBlock` shows an "expired / done" variant when `expires_at` <
      now (green + CheckCircle icon)
- [x] **C5:** Setting a new focus via `setUserFocus` clears the session dismiss
      key so the banner reappears
- [x] **C6:** When an issue with High or Critical priority moves to `done` (via
      inline edit or kanban drag), the toast message includes the priority level
      label
- [x] **C7 (optional):** Done toast includes a "Clear focus" action button when
      user has active focus

---

## Dependencies & Risks

| Dependency                                 | Risk                                                                                      | Mitigation                               |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------- |
| Focus prop threading through issues layout | Low — layout already fetches it                                                           | Straightforward prop addition            |
| `sessionStorage` access in SSR             | Low — already handled by `globalThis.window === undefined` check in focus-reminder-banner | Keep existing guard                      |
| `clearFocus` in onClick inside toast       | Medium — must use `startTransition`                                                       | Wrap in transition, add optimistic state |
| Priority badge status prop                 | None — backward-compatible optional prop                                                  | No breaking changes                      |

---

## Implementation Order

**Phase 1 — Quick wins (no prop changes, no backend):**

1. `IssuePriorityBadge` status prop + hide on done (C1)
2. `FocusReminderBanner` sessionStorage switch + expired auto-hide (C2, C3)
3. `FocusBlock` expired variant (C4)
4. Clear session key on `setUserFocus` (C5)

**Phase 2 — Toast enhancements:** 5. Enhanced done toast with priority level
label in `issues-page.tsx` (C6) 6. Enhanced done toast in
`tasks-kanban-client.tsx` (C6)

**Phase 3 — Focus-task linkage (optional):** 7. Thread focus prop from layout →
issues-page 8. "Clear focus?" action in toast (C7)

---

## Files to Modify

```
features/issues/ui/issue-priority-badge.tsx          ← add status prop; hide on done
features/issues/ui/issues-page.tsx                   ← pass status to badge; enhanced toast
features/kanban/ui/kanban-card-item.tsx              ← pass status to badge
features/kanban/ui/tasks-kanban-client.tsx           ← enhanced done toast
features/user-focus/ui/focus-reminder-banner.tsx     ← sessionStorage; expired auto-hide
features/user-focus/ui/focus-block.tsx               ← expired variant; session key clear
features/user-focus/api/focus.ts                     ← (no changes needed; clear key client-side)

Optional (Phase 3):
app/dashboard/issues/(list)/layout.tsx               ← pass focus to IssueListTab
features/issues/ui/issues-list-tab.tsx               ← thread focus prop
features/issues/ui/issues-page.tsx                   ← receive focus; action in toast
```

---

## References

### Internal

- `features/user-focus/ui/focus-reminder-banner.tsx` — current banner
  implementation (localStorage, lines 9-27)
- `features/user-focus/ui/focus-block.tsx` — useFocusActions hook (lines
  121-164)
- `features/issues/ui/issue-priority-badge.tsx` — current badge (lines 1-19, no
  status check)
- `features/issues/ui/issues-page.tsx:363-405` — updateIssueInline with current
  toast
- `features/kanban/ui/tasks-kanban-client.tsx:200-243` — drag-drop handler
- `features/issues/model/types.ts:222-243` — PRIORITY_LEVELS and
  getPriorityLevel

### External

- [Sonner toast action docs](https://sonner.emilkowal.ski/toast#action) — for
  "Clear focus?" CTA in toast
- [sessionStorage MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
