---
title:
  'feat: Calendar MonthSwitcher with Month-Picker Popup and Day Detail Panel'
type: feat
status: active
date: 2026-05-15
---

# feat: Calendar MonthSwitcher with Month-Picker Popup and Day Detail Panel

## Enhancement Summary

**Deepened on:** 2026-05-15 **Research agents used:** architecture-strategist,
kieran-typescript-reviewer, performance-oracle, julik-frontend-races-reviewer,
code-simplicity-reviewer, design-guardian, spec-flow-analyzer,
fsd-boundary-guard, best-practices-researcher, framework-docs-researcher,
document-review

### Key Improvements Added

1. **Architecture rethink**: `calendar.tsx` stays Server Component;
   `CalendarPage` widget owns the flex layout with panel. No
   `renderEvent`/`onSelectDay` prop-drilling through `calendar.tsx`.
2. **Client boundary correction**: Use thin `DayButton` Client Component instead
   of converting all of `cells.tsx` to `'use client'`. Grid date-math stays
   server-rendered.
3. **Race condition fixes**: `useTransition` on chevron navigation;
   `document.contains()` guard on popup anchor; popup closes on chevron click to
   prevent stale DayPicker.
4. **Design system alignment**: Chevron buttons need hover states; `gap-[11px]`
   → `gap-3`; panel header padding matches `ComponentHeader`; `CalendarOff` icon
   in empty state.
5. **P0 bug found**: `EventPopupAll` renders `<div />` stubs with no content —
   fix before shipping day panel.
6. **FSD violations found in widget**: `CalendarPage.tsx` uses deep imports from
   features — fix to use public `index.ts` APIs.
7. **Scope clarification**: Day panel justification added; mobile behavior
   specified; `usePathname` dropped (unused).

### Critical Pre-implementation Fixes (P0)

- Fix `features/event/ui/event-popup-all.tsx` — renders empty
  `<div key={event.id} />` stubs with no content. Day panel will show blank
  events otherwise.
- Fix `widgets/calendar-view/ui/CalendarPage.tsx` — deep imports
  `@/features/calendar/ui/calendar` and `@/features/event/ui/event-popup-all`.
  Must use public APIs: `@/features/calendar` and `@/features/event`.

---

## Overview

Replace the plain `MonthSwitcher` component in the calendar page with an
enhanced version that mirrors the `DateNavigator` UX pattern: a clickable
`CalendarDays` icon next to the month `<H2>` label opens a `react-day-picker`
popup. When the user picks a specific date from the popup, the calendar month
updates (via `?month=`) AND a day detail panel slides in on the right side of
the grid showing that day's events. The detail panel uses `?day=YYYY-MM-DD` as a
URL param, making it shareable and back/forward-navigable.

The day panel completes the interaction loop: once we expose a date picker,
users expect to see that day's events. Without the panel, picking a date does
nothing visible beyond the month grid updating.

---

## Problem Statement / Motivation

The current `MonthSwitcher` only has prev/next chevron buttons. It has no way to
jump to an arbitrary month/date directly — the user must click many times to
navigate far. The `DateNavigator` (used in the meetings list views) already has
a polished popup picker with `react-day-picker`. The calendar view should match
that UX quality and add the ability to drill into a day without leaving the
month grid.

---

## Proposed Solution

### Part 1 — Enhanced MonthSwitcher with popup

Rewrite `features/calendar/ui/month-switcher.tsx`:

1. Renders `<H2>` month label + `<CalendarDays>` icon as a single clickable
   trigger (same visual as `DateNavigator` `variant='prominent'`)
2. Opens a `react-day-picker` popup via `usePopup()` on click
3. Picking a **date** in the popup: sets `?month=YYYY-MM-01` AND
   `?day=YYYY-MM-DD` in URL → navigates to that month and opens the day panel
4. Clicking prev/next chevrons: changes month only, clears `?day=` param (no day
   panel), closes popup
5. The popup is lazy-loaded with `next/dynamic` (same as `DateNavigator`)

### Part 2 — Day detail panel in calendar view

Modify `widgets/calendar-view/ui/CalendarPage.tsx` to own the day panel layout:

1. Read `?day=YYYY-MM-DD` from URL in `app/` page (Server Component), pass
   `selectedDay` to widget
2. `CalendarPage` widget composes the desktop flex layout: grid left +
   `DayDetailPanel` right
3. Thin `DayButton` Client Component inside `cells.tsx` allows day-click to set
   `?day=`
4. The day cell for the selected day gets a visual highlight (violet ring)
5. A close button on the panel clears `?day=` from URL

### URL scheme (final)

```
/dashboard/meetings/calendar?month=2026-05-01                     # month view, no day panel
/dashboard/meetings/calendar?month=2026-05-01&day=2026-05-15      # month view + day panel open
```

URL state is used (not `useState`) for shareability and browser back/forward
support.

### Mobile behavior

On mobile (`md:hidden`), the agenda list view is shown and the day panel is
**not rendered**. Day cells are still clickable on mobile (sets `?day=`), but
the panel is hidden — the agenda already serves as a day-level view. The `?day=`
param on mobile is silently ignored by the layout.

---

## Technical Approach

### Architecture (corrected)

```
app/dashboard/meetings/calendar/page.tsx               [Server Component]
  ↓ reads ?month, ?day from searchParams
  ↓ passes currentMonth + selectedDay to widget

widgets/calendar-view/ui/CalendarPage.tsx              [Client Component — OWNS layout]
  ↓ composes the desktop flex row:
    ├── Calendar (header + grid, stays Server Component)
    └── DayDetailPanel (conditional, Client Component)
  ↓ handleSelectDay(dateKey) → router.push(?day=...)
  ↓ handleClosePanel() → router.push(?month=...) drops day

features/calendar/ui/calendar.tsx                      [Server Component — stays unchanged]
  ↓ layout shell: ComponentHeader(MonthSwitcher) | mobile agenda | desktop grid

features/calendar/ui/month-switcher.tsx               ← REWRITE
  - usePopup(), DayPicker (lazy), CalendarDays icon, month + day nav
  - uses useTransition() to disable buttons during navigation

features/calendar/ui/cells.tsx                        ← MODIFY (stays Server Component)
  - receives renderDay prop from CalendarPage for clickable day cells
  - no 'use client' directive — grid date-math stays server-rendered

features/calendar/ui/day-button.tsx                   ← NEW (thin Client Component)
  - just the clickable day number button
  - receives isSelected, onSelect from parent

features/calendar/ui/day-detail-panel.tsx             ← NEW (Client Component)
  - receives events: EventProps[], selectedDay: string, renderEvent, onClose
  - filters client-side: events.filter(e => e.starts_at.slice(0, 10) === selectedDay)
  - useMemo for filter result
  - animate-in slide-in-from-right-4 duration-200
```

### Why `calendar.tsx` stays a Server Component

`calendar.tsx` must NOT receive `renderEvent`, `onSelectDay`, or `onClose` as
props — these are functions, which cannot cross the Server→Client component
boundary as serialized props. The `CalendarPage` widget (already `'use client'`)
owns the flex layout with the panel directly, sidestepping this constraint.
`calendar.tsx` continues to own: MonthSwitcher header, mobile agenda layout, and
the `DayOfWeek` + `Cells` desktop grid shell.

### Why `cells.tsx` stays a Server Component

Converting all of `cells.tsx` to `'use client'` moves 42-cell grid date-math
(Map construction, week counting, date formatting) from the server to the
browser. The correct approach is a thin `DayButton` Client Component that
handles only the click interaction. `cells.tsx` receives a `renderDay` prop
(like `renderEvent`) injected by `CalendarPage`, keeping the grid
server-rendered.

### Data flow for day detail panel

`CalendarPage` already receives all month `events: EventProps[]`. The panel
filters `events.filter(e => e.starts_at.slice(0,10) === selectedDay)` — **no
additional API call needed**. Use `useMemo` for the filtered list.

### Shared utilities

`shared/lib/date-nav.ts` already has `parseDateParam`/`toDateParam` which handle
`YYYY-MM-DD` strings. Month params (`YYYY-MM-01`) are valid date strings, so:

- **`parseMonthParam`** = alias of `parseDateParam` (reuse, don't duplicate)
- **`toMonthParam`**: `format(date, 'yyyy-MM-01')` — thin helper justified by
  multiple call sites
- **`formatMonthLabel`**: `format(date, 'MMMM, yyyy')` — replaces current inline
  use in MonthSwitcher

Add only `toMonthParam` and `formatMonthLabel` to `date-nav.ts`. For parsing,
reuse `parseDateParam` with a `isValid()` guard.

### `CALENDAR_CLASS_NAMES` location

Extract from `date-navigator.tsx` to
`shared/ui/navigation/calendar-class-names.ts`. Both `DateNavigator` and the new
`MonthSwitcher` import from there. Do NOT put in `shared/lib/` (wrong layer for
UI constants).

---

## Implementation Phases

### Phase 0 — Pre-implementation bug fixes (P0, must do first)

**Files changed:**

- `features/event/ui/event-popup-all.tsx` — fix empty `<div />` stubs (renders
  nothing)
- `widgets/calendar-view/ui/CalendarPage.tsx` — fix deep feature imports to use
  public APIs
- `widgets/calendar-view/ui/CalendarPage.tsx` — fix `key` placement: move
  `key={event.id}` from inside `renderEvent` callback to the map call site in
  `cells.tsx`

```tsx
// cells.tsx — fix key placement
{
  dayEvents
    .slice(0, 3)
    .map((event) => (
      <React.Fragment key={event.id}>
        {renderEvent ? renderEvent(event) : null}
      </React.Fragment>
    ));
}
```

```ts
// widgets/calendar-view/ui/CalendarPage.tsx — fix deep imports
import { Calendar } from '@/features/calendar'; // was: @/features/calendar/ui/calendar
import { EventPopupAll } from '@/features/event'; // was: @/features/event/ui/event-popup-all
```

---

### Phase 1 — Enhanced MonthSwitcher with popup

**Files changed:**

- `shared/ui/navigation/calendar-class-names.ts` (NEW — extract from
  DateNavigator)
- `shared/ui/navigation/date-navigator.tsx` (update to import from
  calendar-class-names)
- `shared/lib/date-nav.ts` (add `toMonthParam`, `formatMonthLabel`)
- `features/calendar/ui/month-switcher.tsx` (rewrite)
- `next.config.ts` (add `react-day-picker` to `optimizePackageImports`)

**`shared/lib/date-nav.ts` additions:**

```ts
import { addDays, format, isValid, parseISO } from 'date-fns';

/** Date → YYYY-MM-01 string (for ?month= URL param) */
export function toMonthParam(date: Date): string {
  return format(date, 'yyyy-MM-01');
}

/** Format month for display: "May, 2026" */
export function formatMonthLabel(date: Date): string {
  return format(date, 'MMMM, yyyy');
}
```

> Note: For parsing, use the existing `parseDateParam` with a validity guard:
> `const date = parseDateParam(monthStr); return isValid(date) ? date : startOfMonth(new Date());`

**`features/calendar/ui/month-switcher.tsx` rewrite:**

```tsx
'use client';

import { addMonths } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useTransition } from 'react';

import { usePopup } from '@/shared/hooks/use-popup';
import {
  parseDateParam,
  toDateParam,
  toMonthParam,
  formatMonthLabel,
} from '@/shared/lib/date-nav';
import { CALENDAR_CLASS_NAMES } from '@/shared/ui/navigation/calendar-class-names';
import { H2 } from '@/shared/ui/typography/H2';

const DayPicker = dynamic(
  () => import('react-day-picker').then((m) => ({ default: m.DayPicker })),
  {
    ssr: false,
    loading: () => (
      // Fixed-size skeleton prevents layout shift while chunk loads
      <div className='h-[280px] w-[264px] animate-pulse rounded-md bg-muted' />
    ),
  },
);

interface Props {
  currentMonth: string; // YYYY-MM-01
}

export function MonthSwitcher({ currentMonth }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const { isOpen, open, close } = usePopup();
  const labelRef = useRef<HTMLButtonElement>(null);
  const [isPending, startTransition] = useTransition();

  // Use parseDateParam (existing) — YYYY-MM-01 is a valid ISO date string
  const current = parseDateParam(currentMonth);

  const navigateToMonth = (date: Date, selectedDay?: Date) => {
    const next = new URLSearchParams(params);
    next.set('month', toMonthParam(date));
    if (selectedDay) {
      next.set('day', toDateParam(selectedDay));
    } else {
      next.delete('day'); // chevron nav clears day panel
    }
    startTransition(() => {
      router.push(`?${next.toString()}`, { scroll: false });
    });
  };

  const handlePickerOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isOpen) {
      close();
      return;
    }
    const el = labelRef.current;
    if (!el || !document.contains(el)) return; // guard detached DOM node
    const month = current; // capture at open time
    open(el, {
      width: 288,
      maxHeight: 340,
      preferredPosition: 'bottom',
      offset: 8,
      content: () => (
        <div
          role='dialog'
          aria-modal='true'
          aria-label='Pick a date'
          className='rounded-[var(--radius-card)] border border-border bg-card p-3 shadow-[0_4px_24px_rgba(0,0,0,0.6)] ring-1 ring-primary/10'
        >
          <DayPicker
            mode='single'
            defaultMonth={month}
            onSelect={(day) => {
              if (!day) return;
              close();
              navigateToMonth(day, day); // sets ?month= + ?day=
            }}
            weekStartsOn={1}
            showOutsideDays
            classNames={CALENDAR_CLASS_NAMES}
          />
        </div>
      ),
    });
  };

  const handlePrevMonth = () => {
    if (isOpen) close(); // prevent stale DayPicker selected date
    navigateToMonth(addMonths(current, -1));
  };

  const handleNextMonth = () => {
    if (isOpen) close();
    navigateToMonth(addMonths(current, 1));
  };

  const navButtonClass =
    'h-8 w-8 flex items-center justify-center rounded-[var(--radius-button)] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className='flex items-center gap-3'>
      <button
        type='button'
        aria-label='Previous month'
        className={navButtonClass}
        onClick={handlePrevMonth}
        disabled={isPending}
      >
        <ChevronLeft className='h-4 w-4' />
      </button>

      <button
        ref={labelRef}
        type='button'
        onClick={handlePickerOpen}
        className='cursor-pointer rounded-[var(--radius-button)] transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
        aria-label='Pick a date'
        aria-haspopup='dialog'
        aria-expanded={isOpen}
        disabled={isPending}
      >
        <span className='flex items-center gap-2'>
          <H2>{formatMonthLabel(current)}</H2>
          <CalendarDays
            className='h-4 w-4 text-muted-foreground'
            aria-hidden='true'
          />
        </span>
      </button>

      <button
        type='button'
        aria-label='Next month'
        className={navButtonClass}
        onClick={handleNextMonth}
        disabled={isPending}
      >
        <ChevronRight className='h-4 w-4' />
      </button>
    </div>
  );
}
```

**Key corrections vs. original plan:**

- `gap-3` not `gap-[11px]` (design system spacing)
- Chevron buttons have full hover/focus styles (not just `cursor-pointer`)
- `useTransition` + `isPending` guards against double-click race condition
- `document.contains(el)` guards against detached anchor DOM node
- `CalendarDays` has `aria-hidden="true"` (decorative icon)
- `usePathname` removed (not needed for relative URL push)
- Loading skeleton in DayPicker prevents layout shift

**Acceptance criteria:**

- [ ] `CalendarDays` icon appears next to the month `<H2>` label
- [ ] Clicking the label/icon opens a `react-day-picker` popup
- [ ] Clicking the label again when popup is open closes it (toggle)
- [ ] Prev/next chevrons navigate month, close popup, clear `?day=`, disabled
      during navigation
- [ ] Picking a date sets `?month=YYYY-MM-01&day=YYYY-MM-DD`
- [ ] `react-day-picker` is lazy-loaded; skeleton shown while loading
- [ ] Chevrons have hover state: `hover:bg-secondary hover:text-foreground`
- [ ] `gap-3` spacing between elements

---

### Phase 2 — Clickable day cells with highlight

**Files changed:**

- `features/calendar/ui/day-button.tsx` (NEW — thin Client Component)
- `features/calendar/ui/cells.tsx` (add `renderDay` prop, stays Server
  Component)
- `widgets/calendar-view/ui/CalendarPage.tsx` (inject `renderDay`, own
  `handleSelectDay`)
- `app/dashboard/meetings/calendar/page.tsx` (read `?day=` from searchParams)

**`features/calendar/ui/day-button.tsx` (new):**

```tsx
'use client';

import { clsx } from 'clsx';
import { format, isToday } from 'date-fns';

interface Props {
  currentDay: Date;
  isSelected: boolean;
  onSelect: (dateKey: string) => void;
  dateKey: string; // YYYY-MM-DD
}

export function DayButton({
  currentDay,
  isSelected,
  onSelect,
  dateKey,
}: Props) {
  const today = isToday(currentDay);
  return (
    <button
      type='button'
      onClick={() => onSelect(dateKey)}
      className={clsx(
        'flex h-7 w-7 items-center justify-center rounded-full text-[length:var(--fs-sm)] font-medium transition-colors',
        today && 'bg-primary text-primary-foreground',
        isSelected &&
          !today &&
          'ring-2 ring-primary/60 text-primary font-semibold',
        !today &&
          !isSelected &&
          'hover:bg-muted hover:text-foreground cursor-pointer',
      )}
      aria-label={format(currentDay, 'MMMM d, yyyy')}
      aria-pressed={isSelected}
    >
      {format(currentDay, 'd')}
    </button>
  );
}
```

**`cells.tsx` changes (stays Server Component):**

Add `renderDay` prop alongside existing `renderEvent`:

```tsx
interface CellsProps {
  currentMonth: string;
  events?: EventProps[];
  renderEvent?: (event: EventProps) => ReactNode;
  renderDay?: (day: Date, dateKey: string) => ReactNode; // NEW
  onShowAll?: (events: EventProps[]) => void;
}
```

In the grid loop, replace `<Day currentDay={day} />` with
`{renderDay ? renderDay(day, dateKey) : <Day currentDay={day} />}`.

**`CalendarPage` widget changes:**

```tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import { Calendar } from '@/features/calendar'; // use public API
import { DayButton } from '@/features/calendar/ui/day-button';
import { DayDetailPanel } from '@/features/calendar/ui/day-detail-panel';
import { EventPopupAll } from '@/features/event'; // use public API
import { useModal } from '@/shared/hooks/use-modal';
import { toDateParam } from '@/shared/lib/date-nav';
import { CalendarEvent } from '@/widgets/calendar-view/ui/CalendarEvent';

export function CalendarPage({
  events,
  currentMonth,
  selectedDay,
}: {
  events: EventProps[];
  currentMonth: string;
  selectedDay?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const { open, close } = useModal();

  const handleSelectDay = useCallback(
    (dateKey: string) => {
      const next = new URLSearchParams(params);
      next.set('day', dateKey);
      router.push(`?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  const handleClosePanel = useCallback(() => {
    const next = new URLSearchParams(params);
    next.delete('day');
    router.push(`?${next.toString()}`, { scroll: false });
  }, [params, router]);

  const handleShowAll = (dayEvents: EventProps[]) => {
    if (open) open(<EventPopupAll list={dayEvents} close={close} />);
  };

  return (
    <>
      {/* calendar.tsx owns: ComponentHeader(MonthSwitcher) + mobile agenda + DayOfWeek header */}
      <Calendar
        events={events}
        currentMonth={currentMonth}
        renderEvent={(event) => <CalendarEvent event={event} />}
        renderDay={(day, dateKey) => (
          <DayButton
            currentDay={day}
            dateKey={dateKey}
            isSelected={dateKey === selectedDay}
            onSelect={handleSelectDay}
          />
        )}
        onShowAll={handleShowAll}
      />

      {/* Desktop-only day detail panel — outside Calendar, in widget layer */}
      {selectedDay && (
        <div className='hidden md:block'>
          <DayDetailPanel
            selectedDay={selectedDay}
            events={events}
            renderEvent={(event) => <CalendarEvent event={event} />}
            onClose={handleClosePanel}
          />
        </div>
      )}
    </>
  );
}
```

> **Note on layout:** For the panel to appear _beside_ the grid,
> `CalendarPage`'s root must be `flex flex-row`. If `calendar.tsx` uses `<>`
> fragments, the outer layout must set `flex`. Alternatively, pass `selectedDay`
> into `Calendar` and let it manage the horizontal split — but this requires
> `Calendar` to receive `DayDetailPanel` as a prop (same DI pattern), which is
> cleaner.

**`app/dashboard/meetings/calendar/page.tsx` changes:**

```tsx
// Read ?day= from searchParams
const day = params.day; // undefined if not set, YYYY-MM-DD if set

// Pass to widget:
<CalendarPage currentMonth={month} events={events} selectedDay={day} />;
```

**Acceptance criteria:**

- [ ] Each day cell number is a clickable `DayButton`
- [ ] `cells.tsx` remains a Server Component (no `'use client'`)
- [ ] Clicking a day sets `?day=YYYY-MM-DD` in URL (preserves `?month=`)
- [ ] Selected day shows violet ring highlight:
      `ring-2 ring-primary/60 text-primary font-semibold`
- [ ] Today pill (`bg-primary`) and selected ring are visually distinct
- [ ] Day cells are keyboard-accessible (`tab`, `Enter`/`Space`)
- [ ] `clsx` used for conditional classes (not template string concatenation)

---

### Phase 3 — Day detail panel

**Files changed:**

- `features/calendar/ui/day-detail-panel.tsx` (NEW)
- `widgets/calendar-view/ui/CalendarPage.tsx` (already updated in Phase 2)

**`features/calendar/ui/day-detail-panel.tsx`:**

```tsx
'use client';

import { format, parseISO } from 'date-fns';
import { CalendarOff, X } from 'lucide-react';
import { useMemo } from 'react';

import type { EventProps } from '@/entities/event';
import type { ReactNode } from 'react';

interface DayDetailPanelProps {
  /** YYYY-MM-DD date string */
  selectedDay: string;
  /** All month events — filtered client-side */
  events: EventProps[];
  /** Required: renders each event card (injected by CalendarPage widget) */
  renderEvent: (event: EventProps) => ReactNode;
  onClose: () => void;
}

export function DayDetailPanel({
  selectedDay,
  events,
  renderEvent,
  onClose,
}: DayDetailPanelProps) {
  const dayEvents = useMemo(
    () => events.filter((e) => e.starts_at.slice(0, 10) === selectedDay),
    [events, selectedDay],
  );
  const day = parseISO(selectedDay);

  return (
    <div
      className='w-72 shrink-0 border-l border-border bg-card flex flex-col animate-in slide-in-from-right-4 duration-200'
      role='complementary'
      aria-label={`Events for ${format(day, 'MMMM d')}`}
    >
      {/* Header — matches ComponentHeader padding */}
      <div className='flex items-center justify-between px-4 py-2 border-b border-border'>
        <span className='text-sm font-semibold'>
          {format(day, 'EEEE, MMMM d')}
        </span>
        <button
          type='button'
          aria-label='Close day panel'
          onClick={onClose}
          className='flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
        >
          <X className='h-4 w-4' aria-hidden='true' />
        </button>
      </div>

      {/* Events list */}
      <div className='flex-1 overflow-y-auto px-3 py-3 space-y-2'>
        {dayEvents.length > 0 ? (
          dayEvents.map((ev) => (
            <React.Fragment key={ev.id}>{renderEvent(ev)}</React.Fragment>
          ))
        ) : (
          <div className='flex flex-col items-center justify-center py-6'>
            <CalendarOff
              className='h-8 w-8 text-muted-foreground/30 mb-2'
              aria-hidden='true'
            />
            <p className='text-xs text-muted-foreground text-center'>
              No events for this day
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Key corrections vs. original plan:**

- `renderEvent` is **required** (not `?`) — optional with no fallback is dead
  code
- `useMemo` on filter (correctness, not just performance)
- `e.starts_at.slice(0, 10) === selectedDay` (not `startsWith`) — consistent
  with `cells.tsx` Map build
- `py-2` header padding (matches `ComponentHeader`, not `py-3`)
- `animate-in slide-in-from-right-4 duration-200` slide-in animation
- `role="complementary"` on panel with `aria-label`
- `CalendarOff` icon in empty state
- `React.Fragment` with `key` at map call site (not inside `renderEvent`
  callback)

**Acceptance criteria:**

- [ ] Panel slides in from right with 200ms animation
- [ ] Panel header shows "EEEE, MMMM d" format (e.g. "Thursday, May 15")
- [ ] Panel header padding `py-2` matches `ComponentHeader`
- [ ] Events rendered via `renderEvent` (same CalendarEvent cards as grid)
- [ ] Empty state: CalendarOff icon + "No events for this day" text
- [ ] Close button clears `?day=` and collapses panel
- [ ] `role="complementary"` on panel root
- [ ] `React.Fragment` with `key` at map call site
- [ ] Panel is `hidden` on mobile (handled by wrapping div in CalendarPage)

---

## Acceptance Criteria

### Functional

- [ ] MonthSwitcher shows `CalendarDays` icon (decorative, `aria-hidden`) next
      to month H2
- [ ] Clicking label/icon opens react-day-picker popup
      (`aria-haspopup="dialog"`, `aria-expanded`)
- [ ] Picking a date in popup → `?month=YYYY-MM-01&day=YYYY-MM-DD` set in URL
- [ ] Prev/next chevrons change month, close popup, clear `?day=`, disabled
      during navigation
- [ ] Calendar grid day cells clickable → set `?day=` in URL
- [ ] Selected day cell shows violet ring:
      `ring-2 ring-primary/60 text-primary font-semibold`
- [ ] Today and selected states are visually distinct
- [ ] Day detail panel renders on right when `?day=` is present (desktop only)
- [ ] Panel close button clears `?day=`
- [ ] Browser back/forward correctly opens/closes panel (URL is source of truth)
- [ ] Deep-linking `?month=...&day=...` in URL works correctly
- [ ] All existing behavior preserved: today highlight, show-all modal, event
      cards

### Non-Functional

- [ ] No additional API calls — panel filters already-loaded events with
      `useMemo`
- [ ] `react-day-picker` is lazy-loaded; DayPicker skeleton prevents layout
      shift
- [ ] `cells.tsx` stays Server Component (only `DayButton` is `'use client'`)
- [ ] `calendar.tsx` stays Server Component
- [ ] Mobile layout unchanged — panel hidden on `md:` breakpoint
- [ ] No TypeScript errors (`strict: true`)
- [ ] All new interactive elements keyboard-accessible, focus-visible rings
- [ ] `clsx` used for all conditional class names

---

## Dependencies & Risks

| Risk                                   | Severity | Mitigation                                                                                 |
| -------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `EventPopupAll` renders empty stubs    | **P0**   | Fix before implementing day panel (see Phase 0)                                            |
| `CalendarPage` deep feature imports    | **P0**   | Fix to use public `index.ts` APIs (see Phase 0)                                            |
| `key` inside `renderEvent` callback    | **P1**   | Move `key` to map call site in `cells.tsx` (see Phase 0)                                   |
| Double-click drops search params       | Medium   | `useTransition` + `isPending` disable buttons while navigating                             |
| Popup closes without exit animation    | Low-UX   | Accepted — `PopupProvider` has no exit animation; hard-cut is acceptable                   |
| DayPicker flash on first open          | Low      | Fixed: loading skeleton with fixed dimensions                                              |
| Anchor ref on detached DOM node        | Low      | Fixed: `document.contains(el)` guard before `open()`                                       |
| Layout of grid + panel                 | Medium   | `CalendarPage` owns `flex flex-row` layout; grid: `flex-1 min-w-0`, panel: `w-72 shrink-0` |
| `attached=1` param lost on chevron nav | Low      | `new URLSearchParams(params)` preserves all existing params except `day`                   |

---

## Key Files & Line References

| File                                           | Role             | Action                                                     |
| ---------------------------------------------- | ---------------- | ---------------------------------------------------------- |
| `features/event/ui/event-popup-all.tsx`        | Event list modal | **P0 fix**: fill in empty `<div />` stubs                  |
| `widgets/calendar-view/ui/CalendarPage.tsx`    | Widget           | **P0 fix**: deep import → public API; P1: add panel layout |
| `features/calendar/ui/cells.tsx:83`            | Month grid       | Fix `key` placement; add `renderDay` prop                  |
| `shared/ui/navigation/calendar-class-names.ts` | DayPicker theme  | NEW — extract from `date-navigator.tsx`                    |
| `shared/ui/navigation/date-navigator.tsx`      | DateNavigator    | Update to import from `calendar-class-names`               |
| `shared/lib/date-nav.ts`                       | Date utils       | Add `toMonthParam`, `formatMonthLabel` only                |
| `features/calendar/ui/month-switcher.tsx`      | MonthSwitcher    | Rewrite                                                    |
| `features/calendar/ui/day-button.tsx`          | Day cell click   | NEW — thin Client Component                                |
| `features/calendar/ui/day-detail-panel.tsx`    | Day panel        | NEW                                                        |
| `app/dashboard/meetings/calendar/page.tsx`     | Page             | Read `?day=` from searchParams                             |
| `next.config.ts`                               | Build config     | Add `react-day-picker` to `optimizePackageImports`         |

---

## Edge Cases & Spec Gaps (from SpecFlow analysis)

| Scenario                                                      | Behavior                                                                                                                                                                 |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Picker selects date in different month from current `?month=` | Correct — `?month=` updates to match the picked date's month                                                                                                             |
| `?day=` doesn't match `?month=` (e.g. stale deep link)        | Panel shows the day from `?day=` regardless; grid shows `?month=`. Events are filtered by `?day=`. No validation needed — user sees 0 events for a day outside the grid. |
| Mobile: day cell click sets `?day=`                           | `?day=` is set in URL; panel is `hidden` on mobile — silently ignored. Agenda view remains.                                                                              |
| Popup opens, user clicks outside                              | `usePopup` handles click-outside dismiss (existing behavior).                                                                                                            |
| Invalid `?day=` format in URL                                 | `parseISO(selectedDay)` returns `Invalid Date`. Guard: `if (!isValid(day)) return null` in `DayDetailPanel`.                                                             |
| Selected day has 0 events                                     | Panel shows `CalendarOff` + "No events for this day" empty state.                                                                                                        |
| `EventPopupAll` ("show all") and day panel: do they conflict? | No — "show all" modal opens for cells with >3 events (existing behavior). Day panel is a persistent sidebar. Both can be open simultaneously.                            |
| `?day=` is in a future month not currently displayed          | Events are `[]`, empty state shown. Correct behavior.                                                                                                                    |

---

## Design System Reference

| Element                  | Class                                                                                                                                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MonthSwitcher trigger    | `cursor-pointer rounded-[var(--radius-button)] transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50`                                                                                             |
| Chevron buttons          | `h-8 w-8 flex items-center justify-center rounded-[var(--radius-button)] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-40` |
| CalendarDays icon        | `h-4 w-4 text-muted-foreground aria-hidden="true"` (prominent variant)                                                                                                                                                                                    |
| Gap between elements     | `gap-3` (12px — design system token, not `gap-[11px]`)                                                                                                                                                                                                    |
| Selected day (non-today) | `ring-2 ring-primary/60 text-primary font-semibold`                                                                                                                                                                                                       |
| Today day                | `bg-primary text-primary-foreground` (unchanged)                                                                                                                                                                                                          |
| Panel width              | `w-72` (288px)                                                                                                                                                                                                                                            |
| Panel animation          | `animate-in slide-in-from-right-4 duration-200`                                                                                                                                                                                                           |
| Panel header padding     | `px-4 py-2` (matches `ComponentHeader`)                                                                                                                                                                                                                   |
| Panel role               | `role="complementary"` with `aria-label`                                                                                                                                                                                                                  |
| Empty state              | `CalendarOff h-8 w-8 text-muted-foreground/30` + `text-xs text-muted-foreground`                                                                                                                                                                          |
| Popup container          | `rounded-[var(--radius-card)] border border-border bg-card p-3 shadow-[0_4px_24px_rgba(0,0,0,0.6)] ring-1 ring-primary/10`                                                                                                                                |

---

## References & Research

### Internal

- `shared/ui/navigation/date-navigator.tsx` — popup picker pattern
  (CALENDAR_CLASS_NAMES, DayPicker lazy load, usePopup, prominent variant)
- `shared/hooks/use-popup.ts` + `shared/ui/popup/popup-context.ts` — popup
  system (`isOpen`, `maxHeight`, render-function content — all already
  implemented)
- `features/calendar/ui/cells.tsx` — grid rendering, Map build pattern
- `widgets/calendar-view/ui/CalendarPage.tsx` — DI pattern for `renderEvent`

### Completed Plans (context)

- `docs/plans/2026-05-04-feat-date-picker-popup-navigator-plan.md` — full popup
  picker implementation; CALENDAR_CLASS_NAMES v9 keys; PopupProvider bugs fixed;
  React 19 ref patterns
- `docs/plans/2026-04-22-refactor-universal-date-navigator-shared-component-plan.md`
  — DateNavigator extraction history

### Gotchas from prior art (2026-05-04 plan)

- Popup must close when chevron navigation fires (prevents stale DayPicker
  selected date)
- `react-day-picker/style.css` must be in `globals.css` (not component),
  prevents FOUC on lazy load
- `CALENDAR_CLASS_NAMES` at module level (not inline JSX) for React Compiler
  stability
- `defaultMonth={selected}` always required — otherwise picker opens on current
  month, not navigated month
- `useCallback` on navigation functions for React Compiler optimization
- `pointerdown` (not `click`) for outside-close — iOS compatibility (handled by
  existing PopupProvider)
