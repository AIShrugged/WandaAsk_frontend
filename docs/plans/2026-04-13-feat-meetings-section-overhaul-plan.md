---
title:
  'feat: Meetings Section Overhaul — Column View, Detail Tabs, Bot Controls,
  Connect Button'
type: feat
status: completed
date: 2026-04-13
---

# feat: Meetings Section Overhaul — Column View, Detail Tabs, Bot Controls, Connect Button

## Overview

The Meetings section (`/dashboard/meetings`) already has a 3-tab structure
(`list`, `calendar`, `organization`) and a meeting detail page. This plan
describes **incremental improvements** to each area rather than a full rewrite:

1. **Meetings tab** — convert the infinite-scroll list into a 3-column
   "yesterday / today / tomorrow" column view; filter to **bot-only** meetings.
2. **Meeting detail** — add internal route-based tabs (Overview,
   Agenda/Protocol, Tasks, Transcript) so content is split cleanly instead of
   one long scroll.
3. **All tabs (list + both calendars)** — add a "Connect" (join) button on every
   meeting pill/card that has a `url` and is not yet completed; add a
   "Add/Remove Bot" toggle button.
4. **Color visualization** — unify/extend the color coding across all three tabs
   so states (active, upcoming, past+summary, past+no-summary) and
   personal-vs-org meetings are visually distinct.
5. **Personal Calendar** — the existing Google OAuth onboarding flow is already
   in place. The calendar page must display **all** events including those
   without a bot (currently `getEvents()` already fetches `/calendar-events`
   without a bot filter). Keep the existing `OnboardingTrigger` path.

---

## Current State Analysis

### What already works

| Feature                         | File                                              | State                                     |
| ------------------------------- | ------------------------------------------------- | ----------------------------------------- |
| 3 tab navigation                | `features/meetings/ui/meetings-tabs-nav.tsx`      | ✅ done — `PageTabsNav` + route sub-pages |
| Meetings list (infinite scroll) | `features/meetings/ui/meetings-list.tsx`          | ✅ works but needs redesign               |
| Meeting card (bot badge)        | `features/meetings/ui/meeting-card.tsx`           | ✅ correct bot status logic               |
| Personal calendar (month view)  | `app/dashboard/meetings/calendar/page.tsx`        | ✅ month nav + OAuth gate                 |
| Org calendar (month view)       | `features/meetings/ui/org-calendar-view.tsx`      | ✅ works post-April-10 fix                |
| Meeting detail (full page)      | `features/meetings/ui/meeting-detail.tsx`         | ✅ but single long scroll                 |
| Bot toggle                      | `features/event/api/calendar-events.ts#switchBot` | ✅ API exists                             |
| Google OAuth attach             | `features/calendar/api/calendar.ts`               | ✅ working                                |
| Calendar event pill             | `features/calendar/ui/event.tsx`                  | ✅ has tooltip                            |

### Gaps to address

| Gap                         | Details                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Meeting list layout         | Flat infinite scroll; needs yesterday/today/tomorrow columns                                               |
| Meeting list filter         | Currently shows all events; requirement is bot-only meetings                                               |
| Meeting detail tabs         | All sections in one scroll; needs Overview / Agenda or Protocol / Tasks / Transcript tabs                  |
| "Connect to meeting" button | Missing from cards/pills on all three tabs                                                                 |
| Bot toggle in cards         | Bot status is shown but no toggle control in the list view or calendar pills                               |
| Color system completeness   | Organization calendar pill already has past/future colors; personal calendar and list cards need alignment |
| `features/event/api` legacy | `calendar-events.ts` still uses raw `fetch`; new additions should use `httpClient`                         |
| `switchBot` revalidation    | Currently only revalidates `/dashboard/calendar`; should also revalidate meetings paths                    |

---

## Technical Approach

### Architecture: Where does new code live?

All new/changed code stays in **`features/meetings/`** and its app routes.

- New API functions → `features/meetings/api/meetings.ts` (use `httpClient`)
- New UI for meeting detail sub-tabs → `app/dashboard/meetings/[id]/` sub-routes
- Bot toggle in list/calendar → extract `BotToggleButton` into
  `features/meetings/ui/bot-toggle-button.tsx`
- Connect button → extract `MeetingJoinButton` into
  `features/meetings/ui/meeting-join-button.tsx`
- Shared color logic → `features/meetings/model/meeting-state.ts` (util,
  replaces scattered logic)

Do **not** modify `features/calendar/ui/calendar.tsx` or
`features/event/api/calendar-events.ts`. Extend org calendar event via a new
`renderEvent` prop value in `org-calendar-view.tsx`.

---

## Phase 1: Meeting Detail Tabs

**Goal:** Replace the single-scroll meeting detail page with route-based tabs.

### New routes

```
app/dashboard/meetings/[id]/                 → redirect → /overview
app/dashboard/meetings/[id]/layout.tsx       → <MeetingDetailLayout> with tab nav
app/dashboard/meetings/[id]/overview/        → page.tsx + loading.tsx
app/dashboard/meetings/[id]/agenda/          → page.tsx + loading.tsx
app/dashboard/meetings/[id]/tasks/           → page.tsx + loading.tsx
app/dashboard/meetings/[id]/transcript/      → page.tsx + loading.tsx
```

### Tab logic

- **Overview** — header, participants, key takeaways, summary, review, connected
  meeting
- **Agenda** (future/upcoming meetings) OR **Protocol** (past meetings with
  summary) — agenda items
  - Determine "completed" from: `has_summary === true`
  - Tab label: `has_summary ? 'Protocol' : 'Agenda'`
  - The tab label must be dynamic, which requires a `'use client'` layout OR
    passing `has_summary` via a search param / layout data
  - **Simplest approach**: always call it "Agenda / Protocol" and show both
    sections; OR use a single static label "Agenda" but show protocol content
    when available
  - **Recommended**: two separate tabs "Agenda" and "Protocol", where "Protocol"
    only appears if `has_summary === true` (hide via null entry in tab array)
- **Tasks** — meeting tasks list (already `MeetingTasks` component)
- **Transcript** — call `GET /calendar-events/{id}/transcript` and render as
  styled prose

### Detail layout changes

```tsx
// app/dashboard/meetings/[id]/layout.tsx
// Needs to be a Server Component that fetches minimal event data
// (just `has_summary`) to decide if Protocol tab shows.
// Or: fetch in the page and pass via prop. Simplest: fetch in layout.

export default async function MeetingDetailLayout({ params, children }) {
  const { data } = await getCalendarEventDetail(params.id);
  const hasProtocol = data.event.has_summary;
  // Build tabs array, including Protocol tab only if hasProtocol
  return (
    <>
      <MeetingDetailTabsNav meetingId={params.id} hasProtocol={hasProtocol} />
      {children}
    </>
  );
}
```

`MeetingDetailTabsNav` must be `'use client'` and accept `hasProtocol: boolean`
prop (since `PageTabsNav` renders `<a>` tags, this is fine as a Server Component
too, but needs to know `hasProtocol` at render time).

### ROUTES additions

```ts
// shared/lib/routes.ts
MEETING_DETAIL: (id: string | number) => `/dashboard/meetings/${id}`,
MEETING_DETAIL_OVERVIEW: (id: string | number) => `/dashboard/meetings/${id}/overview`,
MEETING_DETAIL_AGENDA: (id: string | number) => `/dashboard/meetings/${id}/agenda`,
MEETING_DETAIL_TASKS: (id: string | number) => `/dashboard/meetings/${id}/tasks`,
MEETING_DETAIL_TRANSCRIPT: (id: string | number) => `/dashboard/meetings/${id}/transcript`,
```

> **Note:** Current routes use `/dashboard/meetings/${meeting.id}` directly in
> card click handlers. Once the detail page has sub-tabs, the root `[id]` route
> should redirect to `overview`.

### Transcript API

The backend endpoint `GET /calendar-events/{id}/transcript` already exists
(route confirmed in `routes/api.php`). Add to
`features/meetings/api/meetings.ts`:

```ts
'use server';
import { httpClient } from '@/shared/lib/httpClient';

export async function getMeetingTranscript(id: string) {
  const { data } = await httpClient<TranscriptResponse>(
    `${API_URL}/calendar-events/${id}/transcript`,
  );
  return data;
}
```

Read `TranscriptController` in backend to type the response before writing.

---

## Phase 2: Meetings Tab — Column View (Yesterday / Today / Tomorrow)

**Goal:** Replace infinite-scroll with a 3-column layout showing only bot
meetings.

### Layout

```
┌─────────────────┬─────────────────┬─────────────────┐
│  Yesterday      │  Today          │  Tomorrow       │
│  Apr 12         │  Apr 13         │  Apr 14         │
├─────────────────┼─────────────────┼─────────────────┤
│ [MeetingCard]   │ [MeetingCard]   │ [MeetingCard]   │
│ [MeetingCard]   │ [MeetingCard]   │                 │
└─────────────────┴─────────────────┴─────────────────┘
```

- Desktop: 3 equal columns (`grid-cols-3`)
- Mobile: single column with date section headers (stack vertically)

### Filter logic

The existing `GET /calendar-events` endpoint accepts date filters. Backend
`CalendarEventResource` returns `required_bot: boolean`. **Filter on the
frontend**: fetch yesterday + today + tomorrow range, then partition by date.
OR: pass `date_from`/`date_to` params to limit the fetch window.

**Fetch strategy:**

```
date_from = yesterday 00:00:00
date_to   = tomorrow  23:59:59
limit     = 100 (no pagination needed for 3 days)
```

The existing Route Handler at `/api/meetings/route.ts` proxies
`/calendar-events`. Add date range params support OR bypass the route handler
and call directly from a Server Component (preferred — no infinite scroll
needed).

**Bot-only filter:** Either pass a `required_bot=true` query param (check if
backend supports it) or fetch all and filter
`meetings.filter(m => m.required_bot)` on the frontend.

> **Check backend `CalendarEventController@index`** before assuming
> `required_bot` filter param exists.

### New component: `MeetingsColumnView`

```
features/meetings/ui/meetings-column-view.tsx  ('use client', receives pre-fetched data)
```

Sections: `yesterday`, `today`, `tomorrow` — each is a `<MeetingsColumn>`
subcomponent. Each column renders a list of `<MeetingCard>` items (keep existing
card component).

### SSR page change

`app/dashboard/meetings/list/page.tsx` currently uses `<MeetingsList>` (infinite
scroll client component). Replace with:

```tsx
// app/dashboard/meetings/list/page.tsx
export default async function MeetingsListPage() {
  const data = await getMeetingsForDateRange(yesterday, tomorrow, {
    botOnly: false,
  });
  const botMeetings = data.filter((m) => m.required_bot);
  return <MeetingsColumnView meetings={botMeetings} />;
}
```

---

## Phase 3: Connect Button + Bot Toggle

**Goal:** Every meeting card and calendar event pill that has a `url` should
show a "Connect" (join meeting) button. All meetings should show an Add/Remove
Bot toggle.

### `MeetingJoinButton` component

```tsx
// features/meetings/ui/meeting-join-button.tsx
'use client';
interface Props {
  url: string | null | undefined;
  isCompleted: boolean;
}
export function MeetingJoinButton({ url, isCompleted }: Props) {
  if (!url || isCompleted) return null;
  return (
    <a
      href={url}
      target='_blank'
      rel='noreferrer'
      className='inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5
                  text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors'
    >
      <Video className='h-3 w-3' />
      Connect
    </a>
  );
}
```

### `BotToggleButton` component

```tsx
// features/meetings/ui/bot-toggle-button.tsx
'use client';
import { useTransition } from 'react';
import { switchBot } from '@/features/event/api/calendar-events';

interface Props { eventId: number; isBotAdded: boolean; }
export function BotToggleButton({ eventId, isBotAdded }: Props) {
  const [isPending, startTransition] = useTransition();
  const handleToggle = () => {
    startTransition(async () => {
      await switchBot(eventId, !isBotAdded);
    });
  };
  return (
    <button onClick={handleToggle} disabled={isPending} ...>
      {isBotAdded ? <BotOff /> : <Bot />}
      {isBotAdded ? 'Remove bot' : 'Add bot'}
    </button>
  );
}
```

> After `switchBot` is called, the page should revalidate. Update `switchBot` in
> `features/event/api/calendar-events.ts` to also call:
>
> ```ts
> revalidatePath(ROUTES.DASHBOARD.MEETINGS_LIST);
> revalidatePath(ROUTES.DASHBOARD.MEETINGS_ORGANIZATION);
> ```

### Integrate into `MeetingCard`

Add `<MeetingJoinButton>` and `<BotToggleButton>` to the card footer row. The
"isCompleted" flag: `has_summary === true` OR `starts_at` in the past (use the
same `isEventPast` utility).

### Integrate into calendar event pills

Both `features/calendar/ui/event.tsx` and
`features/meetings/ui/org-calendar-event.tsx` currently show a hover tooltip.
Adding buttons inside a tooltip that can't receive pointer events is awkward.
**Recommended approach**: on click of a future event pill, open a **popover**
(not just tooltip) that contains the Connect button and Bot toggle. The existing
`features/event/ui/event-popup.tsx` already does this pattern for the personal
calendar — extend it.

For the org calendar, create a new `OrgMeetingPopover` component following the
same modal pattern.

---

## Phase 4: Color Visualization Unification

**Goal:** All three tabs use consistent visual states for meetings.

### Canonical color mapping (extend existing `BOT_BADGE_CONFIG` logic)

| State                   | Meeting type  | Visual                                                         |
| ----------------------- | ------------- | -------------------------------------------------------------- |
| Active (in progress)    | Any           | Emerald pill `bg-emerald-500/10 text-emerald-400`, pulsing dot |
| Upcoming (future)       | Bot scheduled | Violet primary `bg-primary text-primary-foreground`            |
| Upcoming (future)       | No bot        | Outlined `border border-primary/50 text-primary/70`            |
| Past + summary          | Any           | Violet `bg-primary/10 text-violet-300` + CircleCheckBig        |
| Past + no summary + bot | Any           | Red `bg-destructive/10 text-red-400` + CircleDashed            |
| Past + no bot           | Any           | Muted `bg-muted text-muted-foreground` + CircleDashed          |

### `getMeetingDisplayState` utility

Extract to `features/meetings/model/meeting-state.ts`:

```ts
export type MeetingDisplayState =
  | 'active'
  | 'upcoming_with_bot'
  | 'upcoming_no_bot'
  | 'past_with_summary'
  | 'past_missed_bot'
  | 'past_no_bot';

export function getMeetingDisplayState(
  meeting: Pick<CalendarEventListItem, 'starts_at' | 'ends_at' | 'required_bot' | 'has_summary'>,
  now: Date
): MeetingDisplayState { ... }
```

Use this in `MeetingCard`, `OrgCalendarEvent`, and the personal calendar `Event`
component.

---

## Phase 5: Personal Calendar — Show All Google Events

**Current state:** `getEvents()` fetches `GET /calendar-events?limit=50`. This
returns the user's personal calendar events already synced from Google Calendar.
The OAuth gate (`OnboardingTrigger`) works correctly.

**Gap identified:** `getEvents()` uses a fixed `limit=50`. For a month view, all
events in that month are needed. Need to add month-based date filtering.

### Change

In `app/dashboard/meetings/calendar/page.tsx`, replace:

```ts
const { data: events } = await getEvents();
```

with:

```ts
const { data: events } = await getCalendarEventsForMonth(month);
```

Add `getCalendarEventsForMonth(month: string)` to
`features/meetings/api/meetings.ts` using `httpClientList<EventProps>`:

```ts
export async function getCalendarEventsForMonth(month: string) {
  const date = new Date(month);
  const dateFrom = startOfMonth(date).toISOString();
  const dateTo = endOfMonth(date).toISOString();
  return httpClientList<EventProps>(
    `${API_URL}/calendar-events?date_from=${dateFrom}&date_to=${dateTo}&limit=200`,
  );
}
```

> **Check backend** `CalendarEventController@index` to confirm
> `date_from`/`date_to` filter params exist.

---

## Acceptance Criteria

### Meetings tab (Phase 2)

- [ ] Shows 3 columns: Yesterday, Today, Tomorrow with formatted date labels
- [ ] Only shows meetings where `required_bot === true`
- [ ] Each meeting is clickable and navigates to meeting detail
- [ ] Mobile: columns stack vertically as date-grouped sections
- [ ] Empty column shows a "No meetings" placeholder
- [ ] `loading.tsx` shows skeleton columns

### Meeting detail (Phase 1)

- [ ] URL `/dashboard/meetings/[id]` redirects to
      `/dashboard/meetings/[id]/overview`
- [ ] Tab strip shows: Overview, Agenda (or Protocol), Tasks, Transcript
- [ ] "Agenda" tab label changes to "Protocol" when `has_summary === true`
- [ ] Overview tab: header meta, participants, key takeaways, summary, review
- [ ] Agenda/Protocol tab: agenda items list
- [ ] Tasks tab: meeting tasks with status
- [ ] Transcript tab: renders transcript text; shows "Transcript not available"
      when empty/404
- [ ] Each sub-tab has `loading.tsx`
- [ ] Back button leads to `ROUTES.DASHBOARD.MEETINGS_LIST`

### Connect button (Phase 3)

- [ ] Appears on every meeting card/pill that has a non-null `url` AND is not
      completed
- [ ] Opens the URL in a new tab
- [ ] Does NOT appear on completed meetings (past + has_summary)

### Bot toggle (Phase 3)

- [ ] "Add bot" button on meetings without `required_bot`
- [ ] "Remove bot" button on meetings with `required_bot === true`
- [ ] Pending state during async transition
- [ ] After toggle: meetings list and org calendar both revalidate

### Color visualization (Phase 4)

- [ ] Active meetings (in progress) use emerald color
- [ ] Upcoming bot meetings use violet primary
- [ ] Upcoming non-bot meetings use outlined/muted style
- [ ] Past + summary: violet pill with CircleCheckBig
- [ ] Past + missed bot: red/destructive tint with CircleDashed
- [ ] Past + no bot: muted with CircleDashed
- [ ] Consistent colors across list, personal calendar, org calendar

### Personal calendar (Phase 5)

- [ ] Shows all meetings for the selected month (not just latest 50)
- [ ] Month navigation works (existing `?month=` param)
- [ ] Google OAuth gate still works (OnboardingTrigger shown when not connected)

---

## Files to Create / Modify

### New files

```
app/dashboard/meetings/[id]/layout.tsx                  — detail layout with tab nav
app/dashboard/meetings/[id]/overview/page.tsx           — overview tab
app/dashboard/meetings/[id]/overview/loading.tsx
app/dashboard/meetings/[id]/agenda/page.tsx             — agenda/protocol tab
app/dashboard/meetings/[id]/agenda/loading.tsx
app/dashboard/meetings/[id]/tasks/page.tsx              — tasks tab
app/dashboard/meetings/[id]/tasks/loading.tsx
app/dashboard/meetings/[id]/transcript/page.tsx         — transcript tab
app/dashboard/meetings/[id]/transcript/loading.tsx
features/meetings/api/meetings.ts                       — new httpClient-based API functions
features/meetings/model/meeting-state.ts                — getMeetingDisplayState utility
features/meetings/ui/meeting-detail-tabs-nav.tsx        — detail sub-tab nav
features/meetings/ui/meetings-column-view.tsx           — 3-column layout component
features/meetings/ui/meeting-join-button.tsx            — connect button
features/meetings/ui/bot-toggle-button.tsx              — add/remove bot toggle
features/meetings/index.ts                              — FSD public API (currently missing)
```

### Modified files

```
app/dashboard/meetings/[id]/page.tsx                    — redirect to /overview
app/dashboard/meetings/list/page.tsx                    — use MeetingsColumnView
app/dashboard/meetings/calendar/page.tsx                — use month-ranged fetch
shared/lib/routes.ts                                    — add MEETING_DETAIL_* helper fns
features/meetings/ui/meeting-card.tsx                   — add join + bot buttons
features/meetings/ui/org-calendar-event.tsx             — add connect + bot popup
features/calendar/ui/event.tsx                          — add connect button in popup
features/event/api/calendar-events.ts                   — update switchBot revalidation
```

---

## Pre-Implementation Checklist

Before writing any code:

1. **Read** `app/Http/Controllers/API/v1/CalendarEventController.php` — confirm
   `date_from`/`date_to` and `required_bot` filter support
2. **Read** `app/Http/Controllers/API/v1/TranscriptController.php` — type the
   transcript response
3. **Read** `app/Http/Controllers/API/v1/CalendarEventDetailController.php` —
   confirm what the detail endpoint returns (some fields may differ from
   `CalendarEventResource`)
4. Run `backend-contract-validator` after writing new TypeScript types
5. Run `fsd-boundary-guard` after restructuring `features/meetings/`
6. Run `mr-reviewer` before committing

---

## Risks & Edge Cases

| Risk                                                             | Mitigation                                                                                                                          |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `url` field absent in org calendar events                        | `CalendarEventResource` already returns `url`; `CalendarEventListItem` types it as `string \| null \| undefined`; handle gracefully |
| Transcript endpoint returns 404 for meetings without transcript  | Catch 404 specifically; show "Transcript not available" state                                                                       |
| `has_summary` used for tab label → requires data in layout       | Fetch minimal event data in `[id]/layout.tsx`; accept slight double-fetch until RSC caching helps                                   |
| Bot toggle in calendar pill requires pointer-events              | Use popover/modal pattern (click opens popover); not tooltip                                                                        |
| Personal calendar `date_from`/`date_to` filter not supported     | Fall back to `limit=200` without date filter (check backend first)                                                                  |
| Column view for yesterday/today/tomorrow fetches across midnight | Use local timezone dates; `new Date()` on the server uses UTC — convert correctly                                                   |

---

## Dependencies & Prerequisites

- No new npm packages needed
- All patterns (PageTabsNav, httpClient, ActionResult, switchBot) already exist
- Google Calendar OAuth is already working — no backend changes needed

---

## References

### Internal

- Tab nav pattern: `features/meetings/ui/meetings-tabs-nav.tsx`
- Bot badge logic: `features/meetings/ui/meeting-card.tsx:52-75`
- Bot toggle API: `features/event/api/calendar-events.ts:155-177`
- Calendar color logic: `features/calendar/ui/event.tsx:57-112`
- Org calendar color logic: `features/meetings/ui/org-calendar-event.tsx:47-127`
- Meeting detail (current monolithic): `features/meetings/ui/meeting-detail.tsx`
- Detail modal pattern (Framer Motion panel):
  `features/main-dashboard/ui/meeting-detail-panel.tsx`
- Event popup pattern (bot toggle in calendar):
  `features/event/ui/event-popup.tsx`
- Backend calendar routes:
  `/Users/slavapopov/Documents/WandaAsk_backend/routes/api.php` (lines matching
  `calendar-events`)
- Backend resource:
  `/Users/slavapopov/Documents/WandaAsk_backend/app/Http/Resources/API/v1/CalendarEventResource.php`

### Completed related plans

- `docs/plans/2026-04-10-feat-org-meetings-calendar-view-plan.md` — org calendar
  tab (done)
- `docs/plans/2026-04-09-feat-organization-calendar-meetings-tab-plan.md` — tab
  setup (done)
- `docs/plans/2026-04-08-refactor-universal-tab-navigation-component-plan.md` —
  tab nav convention (done)
