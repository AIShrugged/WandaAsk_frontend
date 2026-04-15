---
title:
  'feat: Replace card list with calendar grid on Organization Meetings page'
type: feat
status: completed
date: 2026-04-10
---

# feat: Replace card list with calendar grid on Organization Meetings page

## Overview

The `dashboard/meetings/organization` page currently renders a date-filtered
list of `MeetingCard` components grouped by day with infinite scroll. The goal
is to replace this view with a **monthly calendar grid** identical in structure
to the personal Calendar tab — but populated with org-wide bot meeting data.

The existing `features/calendar/` grid infrastructure (`Calendar`, `Cells`,
`DayOfWeek`, `MonthSwitcher`) is reused as-is. The org calendar page gets a new
`'use client'` wrapper widget, a new event-pill component, and a "show all"
modal — mirroring the widget pattern used in `widgets/calendar-view/`.

---

## Problem Statement

The list view is functional but does not give a clear temporal overview of
meetings distribution across the month. A calendar grid makes it immediately
obvious which days have heavy meeting load and allows navigation by month rather
than by manual date-range inputs.

---

## Proposed Solution

1. **Add a `?month=YYYY-MM-01` search param** to
   `app/dashboard/meetings/organization/page.tsx` (replace `date_from` /
   `date_to` with month-derived range).
2. **Compute `date_from` / `date_to` from the month** using `startOfMonth` /
   `endOfMonth` (date-fns) in the page Server Component.
3. **Fetch all events for the month** (no infinite scroll — a month has at most
   ~30 days × a few events per day, so a single `limit=200` request is
   practical).
4. **Create `OrgCalendarView`** — a new `'use client'` widget that receives
   `CalendarEventListItem[]` + `currentMonth` and renders the existing
   `Calendar` shell with custom event pills.
5. **Create `OrgCalendarEvent`** — a narrow event pill adapted from
   `features/calendar/ui/event.tsx` but typed to `CalendarEventListItem`
   (includes bot-status coloring).
6. **Remove** the existing `OrgMeetingsList` component, the `/api/org-meetings`
   proxy route, and the `useInfiniteScroll` wiring on this page (they are only
   used by this page).

---

## Technical Approach

### Month param convention

Follow the identical pattern used by `MonthSwitcher` and the personal Calendar
tab:

```
?month=2026-04-01   ← always the 1st of the target month
```

Default: `format(startOfMonth(new Date()), 'yyyy-MM-01')` (current month).

### Server Component — `app/dashboard/meetings/organization/page.tsx`

```ts
// app/dashboard/meetings/organization/page.tsx
import { format, endOfMonth, startOfMonth } from 'date-fns';
import { getOrgCalendarEvents } from '@/features/meetings/api/org-calendar';
import { OrgCalendarView } from '@/features/meetings/ui/org-calendar-view';

export default async function OrgMeetingsPage({ searchParams }) {
  const monthParam = searchParams.month ?? format(new Date(), 'yyyy-MM') + '-01';
  const monthStart = startOfMonth(monthParam);
  const dateFrom = format(monthStart, 'yyyy-MM-dd');
  const dateTo = format(endOfMonth(monthStart), 'yyyy-MM-dd');

  const { items } = await getOrgCalendarEvents(0, 200, dateFrom, dateTo);

  return (
    <OrgCalendarView
      events={items}
      currentMonth={monthParam}
    />
  );
}
```

### API — `features/meetings/api/org-calendar.ts`

No change required — `getOrgCalendarEvents(offset, limit, dateFrom, dateTo)`
already exists. Just call it with `limit=200` and skip the "has more" logic.

### New component — `features/meetings/ui/org-calendar-event.tsx`

Typed to `CalendarEventListItem`. Visual rules:

- **Past + has_summary**: primary pill (violet) — summary available
- **Past + no_summary + required_bot**: muted + `CircleDashed` — bot attended
  but no summary yet
- **Past + required_bot=false**: muted — no bot
- **Future**: primary pill with outline style (meeting not happened yet)

Click navigates to `/dashboard/meetings/[id]` (same as `MeetingCard`).

Includes a hover tooltip showing time range, platform, bot status (reuse tooltip
structure from `features/calendar/ui/event.tsx`).

### New component — `features/meetings/ui/org-calendar-view.tsx`

`'use client'` wrapper. Accepts `events: CalendarEventListItem[]` and
`currentMonth: string`.

- Renders the existing `Calendar` shell from `features/calendar/ui/calendar.tsx`
- Passes `renderEvent` prop → returns `<OrgCalendarEvent>`
- Handles `onShowAll` → opens `EventPopupAll`-style modal listing all events for
  that day

The `Calendar` shell already handles mobile (agenda) vs desktop (grid)
switching. For the org view the mobile agenda pane will show `OrgCalendarEvent`
pills in a list grouping.

> **Note**: `Calendar` currently expects `EventProps[]`. To avoid modifying
> shared code, `OrgCalendarView` maps `CalendarEventListItem` → `EventProps` via
> a thin adapter (all fields are present; just drop `required_bot` differences).
> Alternatively, make `Cells` generic — evaluate during implementation.

### Remove / clean up

| File                                                   | Action                                      |
| ------------------------------------------------------ | ------------------------------------------- |
| `features/meetings/ui/org-meetings-list.tsx`           | Delete                                      |
| `app/api/org-meetings/route.ts`                        | Delete (only consumer is `OrgMeetingsList`) |
| Import of `OrgMeetingsList` in `organization/page.tsx` | Remove                                      |

---

## Acceptance Criteria

- [ ] `/dashboard/meetings/organization` renders a full-month calendar grid
      (Mon–Sun columns)
- [ ] Month navigation (prev/next) updates the `?month=` param and re-fetches
      via Server Component re-render
- [ ] Each day cell shows event pills for org bot meetings on that day
- [ ] Days with > 3 events show "+N more" button that opens a list modal
- [ ] Clicking an event pill navigates to `/dashboard/meetings/[id]`
- [ ] Hover tooltip shows: title, time range, platform, bot status
- [ ] Past meetings with summary: distinct visual treatment (violet)
- [ ] Future meetings: distinct visual treatment
- [ ] Mobile: renders agenda list (via existing `CalendarAgenda` component)
- [ ] Empty month: `EmptyState` shown ("No bot meetings this month")
- [ ] `loading.tsx` shows `<SpinLoader>` (already exists, no change needed)
- [ ] `OrgMeetingsList` component and `/api/org-meetings` route are deleted
- [ ] No TypeScript errors, no ESLint errors

---

## Dependencies & Risks

| Item                                                    | Notes                                                                                                                   |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `features/calendar/ui/cells.tsx` expects `EventProps[]` | Need adapter or generics refactor                                                                                       |
| `CalendarAgenda` also typed to `EventProps`             | Same adapter needed                                                                                                     |
| `MonthSwitcher` writes `?month=` param                  | Already compatible — no change needed                                                                                   |
| `limit=200` assumption                                  | If an org has > 200 meetings/month, pagination is needed. Validate with backend; if needed, fetch all pages server-side |

### Adapter shape

`CalendarEventListItem` has all fields `EventProps` needs:

```ts
// features/meetings/model/utils.ts (new helper)
export function toEventProps(item: CalendarEventListItem): EventProps {
  return {
    id: item.id,
    title: item.title,
    starts_at: item.starts_at,
    ends_at: item.ends_at,
    platform: item.platform,
    url: item.url ?? '',
    description: item.description ?? '',
    creator_user_id: 0, // not used by calendar grid
    required_bot: item.required_bot,
    has_summary: item.has_summary,
  };
}
```

---

## Implementation Steps

### Phase 1 — Scaffold

1. Add `toEventProps()` adapter in `features/meetings/model/utils.ts`
2. Create `features/meetings/ui/org-calendar-event.tsx` (event pill + tooltip,
   typed to `CalendarEventListItem`)
3. Create `features/meetings/ui/org-calendar-view.tsx` (`'use client'` — uses
   `Calendar` shell, passes mapped events, handles `onShowAll`)

### Phase 2 — Wire the page

4. Update `app/dashboard/meetings/organization/page.tsx`:
   - Switch `date_from`/`date_to` params to `month` param
   - Derive date range from month
   - Call `getOrgCalendarEvents(0, 200, dateFrom, dateTo)`
   - Render `<OrgCalendarView>` instead of `<OrgMeetingsList>`

### Phase 3 — Clean up

5. Delete `features/meetings/ui/org-meetings-list.tsx`
6. Delete `app/api/org-meetings/route.ts`
7. Run `npm run lint:fix && npm run format`
8. Run `mr-reviewer` agent for final check

---

## References

### Internal

- Existing calendar shell: `features/calendar/ui/calendar.tsx`
- Grid cells: `features/calendar/ui/cells.tsx` (lines 35–99)
- Personal event pill: `features/calendar/ui/event.tsx`
- Personal calendar widget: `widgets/calendar-view/ui/CalendarPage.tsx`
- Org list (to be replaced): `features/meetings/ui/org-meetings-list.tsx`
- Org API: `features/meetings/api/org-calendar.ts`
- Meeting types: `features/meetings/model/types.ts`
- Date utils: `features/meetings/model/utils.ts`
- MonthSwitcher: `features/calendar/ui/month-switcher.tsx`
- EventExtraButton: `features/calendar/ui/event-extra-button.tsx`
- EventProps entity: `entities/event/model/types.ts`
