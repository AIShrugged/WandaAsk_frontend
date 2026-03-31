---
title: 'fix: Misleading getMethodologies error on follow-ups analysis page 404'
type: fix
status: completed
date: 2026-03-31
---

# fix: Misleading `getMethodologies` error on follow-ups analysis page 404

## Overview

Opening `/dashboard/follow-ups/analysis/:id` throws an error logged as
`getMethodologies failed: 404 Not Found — {"message":"No query results for model [App\\Models\\CalendarEvent] 11", ...}`.
The error message is misleading — the failing function is `getAttendees` (or
`getGuests`), not `getMethodologies`. This is a copy-paste bug compounded by a
real 404 from the backend.

## Problem Statement

### Issue 1 — Wrong error prefix (copy-paste bug)

`features/participants/api/participants.ts` has two functions:

- `getAttendees` — calls `GET /calendar-events/${id}/participants`
- `getGuests` — calls `GET /calendar-events/${id}/profiles`

Both throw `Error("getMethodologies failed: ...")` on non-OK responses (lines 29
and 59). The string `getMethodologies` was copied from a different file and
never updated. This makes log triage extremely confusing.

### Issue 2 — Real 404 on CalendarEvent

The route `/calendar-events/{id}/participants` uses Laravel route model binding
on `CalendarEvent`. When no record with that ID exists (or is inaccessible to
the current user), Laravel returns a 404 `NotFoundHttpException`.

The follow-ups analysis page at
`app/dashboard/follow-ups/analysis/[id]/page.tsx` successfully fetches the
follow-up via `getTeamFollowUp(id)` → `GET /calendar-events/${id}/followup`. But
then `EventOverview` calls `getAttendees(id)` + `getGuests(id)` which hit
different controller methods that may apply different authorization scoping — so
the CalendarEvent can be found for the followup endpoint but not for the
participants/profiles endpoints.

**Call chain:**

```
/dashboard/follow-ups/analysis/11?tab=summary
  page.tsx
    → getTeamFollowUp("11")  ✅ 200 OK
    → renders <EventOverview id="11" />
      → Promise.all([getAttendees("11"), getGuests("11")])
        → GET /calendar-events/11/participants  ❌ 404
          → throws Error("getMethodologies failed: 404 Not Found — {...}")
```

## Proposed Solution

### Part 1 — Fix misleading error messages (quick win, no risk)

In `features/participants/api/participants.ts`:

- Line 29: change `getMethodologies failed` → `getAttendees failed`
- Line 59: change `getMethodologies failed` → `getGuests failed`

### Part 2 — Investigate why `/participants` returns 404 when `/followup` succeeds

Two hypotheses:

**A. Backend authorization difference** — `FollowupController::eventShow()` uses
an `owned()` scope that matches on calendar source (not strictly on
CalendarEvent ID), while the participants controller binds `CalendarEvent`
directly. If the CalendarEvent was soft-deleted or belongs to a different
organization, the participants endpoint will 404 while the followup endpoint
finds it via the scope.

**B. Stale ID** — the `id` in the URL is actually a `followup.id`, not a
`calendar_event.id`. The `getTeamFollowUp` function uses it as a
`calendarEventId` parameter, but this needs verification against the route
definition and the URL parameter semantics.

**Investigation steps:**

1. Read `FollowupController.php` — compare `eventShow()` auth/binding with the
   participants controller to understand why one 404s and the other doesn't
2. Read `routes/api.php` lines around calendar-events to confirm parameter types
3. Check if the `id` on the page URL is `calendar_event.id` or `followup.id`
4. Check if CalendarEvent 11 exists in the database and is accessible

### Part 3 — Frontend resilience (if backend 404 is expected)

If a CalendarEvent can legitimately be missing (e.g. event deleted after
follow-up was generated), `EventOverview` should handle the 404 gracefully
rather than crashing. Options:

- Wrap `getAttendees`/`getGuests` calls in try/catch returning empty arrays
- Wrap `<EventOverview>` in an error boundary that renders a fallback message
- Add a null guard: if participants 404, render the `EventSummary` without the
  participant table

## Acceptance Criteria

- [x] `getAttendees` throws `"getAttendees failed: ..."` on error
- [x] `getGuests` throws `"getGuests failed: ..."` on error
- [x] Root cause of the 404 on `/participants` is identified (backend
      authorization difference: `ParticipantController` applies
      `CalendarEvent::owned()` scope, `FollowupController` uses implicit route
      model binding without that scope)
- [x] `/dashboard/follow-ups/analysis/:id` does not crash with an unhandled
      error when CalendarEvent participants are unavailable
- [x] If participants are unavailable, the summary tab shows event info with an
      appropriate empty state for participants

## Files to Change

### Definite changes

| File                                           | Change                              |
| ---------------------------------------------- | ----------------------------------- |
| `features/participants/api/participants.ts:29` | `getMethodologies` → `getAttendees` |
| `features/participants/api/participants.ts:59` | `getMethodologies` → `getGuests`    |

### Conditional changes (after investigation)

| File                                                        | Potential Change                            |
| ----------------------------------------------------------- | ------------------------------------------- |
| `widgets/meeting/ui/event-overview.tsx`                     | Add error handling for missing participants |
| `app/dashboard/follow-ups/analysis/[id]/page.tsx`           | Guard or boundary around EventOverview      |
| Backend `FollowupController.php` or participants controller | Fix authorization scoping                   |

## References

- Failing file: `features/participants/api/participants.ts:13-70`
- Call site: `widgets/meeting/ui/event-overview.tsx:26-29`
- Page entry point: `app/dashboard/follow-ups/analysis/[id]/page.tsx:77-80`
- Backend followup endpoint:
  `/Users/slavapopov/Documents/WandaAsk_backend/app/Http/Controllers/API/v1/FollowupController.php`
- Backend routes: `/Users/slavapopov/Documents/WandaAsk_backend/routes/api.php`
