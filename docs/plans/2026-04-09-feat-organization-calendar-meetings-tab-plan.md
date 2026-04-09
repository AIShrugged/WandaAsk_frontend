---
title: feat: Add Organization Calendar Tab to Meetings Page
type: feat
status: completed
date: 2026-04-09
---

# feat: Add Organization Calendar Tab to Meetings Page

## Overview

Add a new **"Organization Calendar"** tab to `/dashboard/meetings` that shows
all meetings across the organization where the bot was added
(`required_bot = true`), regardless of who owns the meeting. The view uses a
card list layout with infinite scroll and a date range filter.

Currently, all `/api/v1/calendar-events` endpoints are scoped to the current
user via `CalendarEvent::owned(Auth::id())`. This feature requires a new backend
endpoint with org-wide scoping.

---

## Problem Statement / Motivation

The existing "Meetings" tab only shows meetings for the current user. Managers
and team leads need visibility into all organization meetings where Wanda bot
was present — to review coverage, find summaries across teams, and understand
overall bot usage without switching between individual accounts.

---

## Proposed Solution

### Frontend

1. Add
   `ROUTES.DASHBOARD.MEETINGS_ORGANIZATION = '/dashboard/meetings/organization'`
   to `shared/lib/routes.ts`
2. Add the new tab to `features/meetings/ui/meetings-tabs-nav.tsx`
3. Create `app/dashboard/meetings/organization/page.tsx` — SSR first page
4. Create `app/dashboard/meetings/organization/loading.tsx` — skeleton
5. Create `features/meetings/api/org-calendar.ts` — Server Action + fetch proxy
6. Create `app/api/org-meetings/route.ts` — Next.js Route Handler (for
   client-side `fetchMore`)
7. Create `features/meetings/ui/org-meetings-list.tsx` — Client Component with
   infinite scroll + date filter
8. Reuse `MeetingCard` from `features/meetings/ui/meeting-card.tsx` (no changes
   needed)

### Backend

9. Add `GET /api/v1/calendar-events/organization` endpoint:
   - Controller:
     `app/Http/Controllers/API/v1/OrganizationCalendarController.php`
   - FormRequest:
     `app/Http/Requests/API/v1/OrganizationCalendarIndexRequest.php`
   - Resource: reuse existing `CalendarEventResource`
   - Scope: meetings where `required_bot = true` AND at least one source user
     belongs to the same organization as the authenticated user
   - Pagination: `offset` + `limit`, responds with `Items-Count` header
   - Date filter: `date_from=YYYY-MM-DD` and `date_to=YYYY-MM-DD` query params

---

## Technical Approach

### Architecture

```
app/dashboard/meetings/
  organization/
    page.tsx          ← SSR: fetches page 1, passes to OrgMeetingsList
    loading.tsx       ← Skeleton while SSR loads

features/meetings/
  api/
    org-calendar.ts   ← 'use server'; getOrgCalendarEvents(offset, limit, dateFrom, dateTo)
  ui/
    org-meetings-list.tsx    ← 'use client'; infinite scroll + date picker
    meetings-tabs-nav.tsx    ← add MEETINGS_ORGANIZATION tab (modified)

app/api/org-meetings/
  route.ts            ← GET handler, proxies to backend, used by client fetchMore

shared/lib/routes.ts  ← add MEETINGS_ORGANIZATION constant (modified)
```

### Backend endpoint design

**Route** (`routes/api.php`, inside `auth` middleware group):

```php
Route::get('/calendar-events/organization', [OrganizationCalendarController::class, 'index']);
```

**FormRequest** (`OrganizationCalendarIndexRequest.php`):

```php
public function rules(): array
{
    return [
        'date_from' => ['nullable', 'date_format:Y-m-d'],
        'date_to'   => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
        'offset'    => ['nullable', 'integer', 'min:0'],
        'limit'     => ['nullable', 'integer', 'min:1', 'max:100'],
    ];
}
```

**Controller** (`OrganizationCalendarController.php`):

```php
public function index(OrganizationCalendarIndexRequest $request): JsonResponse
{
    $user = Auth::user();
    $orgIds = $user->organizations()->pluck('id');

    $query = CalendarEvent::query()
        ->whereHas('sources.user.organizations', fn($q) => $q->whereIn('organizations.id', $orgIds))
        ->where('required_bot', true)              // only bot-required
        ->when($request->date_from, fn($q, $v) => $q->whereDate('starts_at', '>=', $v))
        ->when($request->date_to,   fn($q, $v) => $q->whereDate('starts_at', '<=', $v))
        ->orderBy('starts_at', 'desc');

    $total = $query->count();
    $events = $query
        ->offset($request->integer('offset', 0))
        ->limit($request->integer('limit', 20))
        ->get();

    return CalendarEventResource::collection($events)
        ->response()
        ->header('Items-Count', $total);
}
```

> **Note on `required_bot` scoping:** `CalendarEventResource` derives
> `required_bot` from the pivot — it may vary per user. For the org view, filter
> by the model-level `required_bot` column or by existence of any pivot row with
> `required_bot = true`. Confirm with backend team.

### Frontend key files

**`shared/lib/routes.ts`** — add constant:

```ts
MEETINGS_ORGANIZATION: '/dashboard/meetings/organization',
```

**`features/meetings/ui/meetings-tabs-nav.tsx`** — add third tab:

```ts
const TABS = [
  { href: ROUTES.DASHBOARD.MEETINGS_LIST, label: 'Meetings' },
  { href: ROUTES.DASHBOARD.MEETINGS_CALENDAR, label: 'Calendar' },
  {
    href: ROUTES.DASHBOARD.MEETINGS_ORGANIZATION,
    label: 'Organization Calendar',
  },
] as const;
```

**`features/meetings/api/org-calendar.ts`**:

```ts
'use server';
import { httpClientList } from '@/shared/lib/httpClient';
import type { CalendarEventListItem } from '@/features/meetings/model/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getOrgCalendarEvents(
  offset: number,
  limit: number,
  dateFrom?: string,
  dateTo?: string,
) {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo && { date_to: dateTo }),
  });
  return httpClientList<CalendarEventListItem>(
    `${API_URL}/calendar-events/organization?${params}`,
  );
}
```

**`app/api/org-meetings/route.ts`** — Route Handler proxy for client-side
fetchMore:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getOrgCalendarEvents } from '@/features/meetings/api/org-calendar';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const result = await getOrgCalendarEvents(
    Number(searchParams.get('offset') ?? 0),
    Number(searchParams.get('limit') ?? 20),
    searchParams.get('date_from') ?? undefined,
    searchParams.get('date_to') ?? undefined,
  );
  return NextResponse.json(result);
}
```

**`app/dashboard/meetings/organization/page.tsx`**:

```tsx
import { getOrgCalendarEvents } from '@/features/meetings/api/org-calendar';
import { OrgMeetingsList } from '@/features/meetings/ui/org-meetings-list';
import { getDefaultDateRange } from '@/features/meetings/model/utils';

export default async function OrganizationCalendarPage() {
  const { from, to } = getDefaultDateRange(); // current week: Mon–Sun
  const initialData = await getOrgCalendarEvents(0, 20, from, to);
  return (
    <OrgMeetingsList
      initialItems={initialData.items}
      totalCount={initialData.total}
      defaultDateFrom={from}
      defaultDateTo={to}
    />
  );
}
```

**`features/meetings/ui/org-meetings-list.tsx`** — Client Component:

```tsx
'use client';
// infinite scroll list reusing MeetingCard
// date picker state stored in URL search params (date_from, date_to)
// on date change: router.replace with new params → page re-SSRs with new range
// fetchMore: calls /api/org-meetings?offset=N&limit=20&date_from=X&date_to=Y
```

### Default date range

Default = **current ISO week (Monday–Sunday)** of the visit date. Computed in
`features/meetings/model/utils.ts`:

```ts
export function getDefaultDateRange(): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(mon), to: fmt(sun) };
}
```

### Date filter state — URL search params

Date range is stored in URL:
`/dashboard/meetings/organization?date_from=2026-04-06&date_to=2026-04-12`

- On initial SSR: read from `searchParams` prop, fall back to
  `getDefaultDateRange()`
- On date picker change: `router.replace(...)` with new params → page re-SSRs
- `preserveSearchParams` NOT needed on `PageTabsNav` (date range is
  tab-specific, should not bleed into other tabs)

---

## Open Questions (resolve before implementation)

### Critical — blocks backend

1. **Org scoping logic:** Is org membership determined via
   `users → organization_user → organizations`? Confirm the exact join path. If
   `CalendarEvent` does not have a direct org relationship, the query may need
   to go:
   `CalendarEvent → calendar_event_source → sources → users → organization_user → organizations`.

2. **`required_bot` at model level vs pivot level:**
   `CalendarEventResource::isRequiredBot()` checks the pivot per user. For
   org-wide filtering, should we check if ANY source row has
   `required_bot = true`, or is there a model-level `required_bot` column?

3. **Authorization:** Can any org member see all org bot-meetings, or only
   managers? Recommend: any org member (same as seeing the org in general). Add
   `OrganizationCalendarPolicy` if role-gating is needed.

### Important — affects UX

4. **Card clickability for non-participants:** The detail page
   `/dashboard/meetings/[id]` is user-scoped. A user clicking a meeting they did
   not attend will get a 404. Recommended options:
   - Make the detail endpoint org-scoped too (backend change)
   - Show non-participant cards as non-clickable (with tooltip "You're not a
     participant")
   - Show a simplified org-only detail view

5. **Show meeting owner/organizer on card?** In an org-wide view, the card
   currently shows only title, date, and bot status. Showing `creator_user_id`
   resolved to a name would add context. Not in scope unless confirmed.

---

## Acceptance Criteria

### Functional

- [x] A new "Organization Calendar" tab appears in the meetings tab bar, after
      "Calendar"
- [x] Clicking the tab navigates to `/dashboard/meetings/organization`
- [x] The page shows meetings with `required_bot = true` from the whole
      organization (not scoped to current user)
- [x] Cards display: title, date/time range, bot status badge (attended /
      scheduled / missed), has_summary indicator
- [x] Default date range is the current ISO week (Monday–Sunday)
- [x] Date picker allows selecting a custom date range; list re-fetches on
      change
- [x] Selected date range is stored in URL params and survives page refresh
- [x] Infinite scroll loads additional pages without replacing existing items
- [x] Loading skeleton shown during SSR and during `fetchMore`
- [x] Empty state shown when no bot meetings exist for the selected range
- [x] Meetings without a summary ARE shown (unlike the existing list tab which
      hides them)

### Technical

- [x] New route `MEETINGS_ORGANIZATION` added to `shared/lib/routes.ts`
- [x] `loading.tsx` exists for the new sub-route
- [x] `features/meetings/api/org-calendar.ts` uses `httpClientList`, not raw
      `fetch`
- [x] No FSD boundary violations (no cross-feature imports)
- [x] TypeScript strict mode: no `any`, all response fields typed against
      `CalendarEventResource`
- [x] `npm run lint` passes with no new errors

### Quality Gates

- [x] Unit tests for `getDefaultDateRange()` utility
- [x] Unit test for `OrgMeetingsList` — renders cards, empty state, and date
      picker
- [ ] Backend: `OrganizationCalendarIndexRequest` validates date format and
      `after_or_equal` rule

---

## Dependencies

- **Backend:** New endpoint must be implemented before SSR page can be tested
  end-to-end. Frontend can be scaffolded with mock data first.
- **Existing `CalendarEventResource`:** Reused as-is — no changes needed to the
  resource shape.
- **Existing `MeetingCard`:** Reused as-is.
- **`httpClient`:** The existing `features/event/api/calendar-events.ts` uses
  raw `fetch` in violation of the shared `httpClient` convention. The new
  `org-calendar.ts` must use `httpClientList`. The legacy file should be
  refactored separately.

---

## References

### Internal

- Existing tab nav: `features/meetings/ui/meetings-tabs-nav.tsx`
- Existing meetings list: `features/meetings/ui/meetings-list.tsx`
- MeetingCard + BotStatus logic: `features/meetings/ui/meeting-card.tsx:82–106`
- PageTabsNav component: `shared/ui/navigation/page-tabs-nav.tsx`
- Routes constants: `shared/lib/routes.ts` (lines 30–43)
- httpClientList: `shared/lib/httpClient.ts`
- CalendarEvent model: `app/Models/CalendarEvent.php` (backend)
- CalendarEventResource: `app/Http/Resources/API/v1/CalendarEventResource.php`
  (backend)
- Backend routes: `/Users/slavapopov/Documents/WandaAsk_backend/routes/api.php`
- Tab navigation convention:
  `docs/plans/2026-04-08-refactor-universal-tab-navigation-component-plan.md`
- Shared filters pattern:
  `docs/plans/2026-03-31-feat-shared-filters-tasktracker-kanban-tabs-plan.md`

### Related patterns

- Agents tabs (3-tab example): `features/agents/ui/agents-tabs-nav.tsx`
- Infinite scroll hook: `shared/hooks/use-infinite-scroll.ts` (if exists)
