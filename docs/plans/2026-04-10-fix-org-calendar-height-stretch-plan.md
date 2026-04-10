---
title: 'fix: Org meetings calendar page does not stretch to full height'
type: fix
status: active
date: 2026-04-10
---

# fix: Org meetings calendar page does not stretch to full height

## Problem

`/dashboard/meetings/organization` does not fill the available vertical space.
The calendar grid renders at content-height instead of stretching to fill the
card.

`/dashboard/meetings/calendar` works correctly because its `page.tsx` wraps the
calendar widget in:

```tsx
<div className='h-full flex flex-col overflow-hidden'>
```

This gives the inner `Calendar` shell's `flex-1` a height context to stretch
against.

`/dashboard/meetings/organization/page.tsx` renders `<OrgCalendarView>` directly
with no wrapper, so the `flex-1` inside `Calendar` cannot stretch.

## Layout chain (both pages share this from the top down)

```
app/dashboard/layout.tsx        → main: flex-1 overflow-y-auto min-h-0
app/dashboard/meetings/layout.tsx → Card: h-full flex flex-col overflow-hidden
                                    content: flex-1 min-h-0 overflow-y-auto
app/dashboard/meetings/calendar/page.tsx  → div: h-full flex flex-col overflow-hidden  ✅
app/dashboard/meetings/organization/page.tsx → [no wrapper]                            ❌
  OrgCalendarView → Calendar (features/calendar/ui/calendar.tsx)
    → flex-1 flex-col (the grid) — no height to grow into
```

## Fix

**File:** `app/dashboard/meetings/organization/page.tsx`

Wrap `<OrgCalendarView>` in the same `h-full flex flex-col overflow-hidden` div
that the calendar page uses:

```tsx
return (
  <div className='h-full flex flex-col overflow-hidden'>
    <OrgCalendarView events={allMeetings} currentMonth={currentMonth} />
  </div>
);
```

No other files need to change. `OrgCalendarView` already delegates to `Calendar`
which uses `flex-1 flex-col` for the grid — it just needs a height-constrained
parent to stretch into.

## Acceptance Criteria

- [ ] `/dashboard/meetings/organization` calendar grid stretches to fill the
      card height
- [ ] Visual appearance matches `/dashboard/meetings/calendar` (same height,
      grid fills card)
- [ ] No layout regression on the calendar page or other meetings tabs

## References

- `app/dashboard/meetings/calendar/page.tsx` — the working wrapper pattern to
  copy
- `app/dashboard/meetings/organization/page.tsx` — the file to fix
- `features/calendar/ui/calendar.tsx` — uses `hidden md:flex flex-1 flex-col`
  for the grid
