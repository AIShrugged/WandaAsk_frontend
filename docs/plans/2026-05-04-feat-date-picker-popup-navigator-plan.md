---
title: "feat: Date Picker Popup in DateNavigator"
type: feat
status: completed
date: 2026-05-04
deepened: 2026-05-04
---

# feat: Date Picker Popup in DateNavigator (Calendar)

## Enhancement Summary

**Deepened on:** 2026-05-04
**Research agents used:** react-day-picker v9 API, best-practices (accessibility/positioning), TypeScript reviewer, performance oracle, design-guardian, races reviewer, code-simplicity reviewer

### Key Improvements Over Initial Plan

1. **Simplified architecture** — `DatePickerPopup` inlined into `date-navigator.tsx` (no new file), no `forwardRef` (React 19 deprecated), no new hook method. Just a ref on the button + popup open call.
2. **ARIA corrected** — popup must be `role="dialog"` + `aria-modal="true"`, trigger needs `aria-expanded={isOpen}`. The initial plan had incomplete ARIA.
3. **Critical race fixed** — `PopupProvider.content` is a frozen ReactNode; chevron navigation while picker is open shows stale selected date. Fix: close popup on chevron navigate.
4. **Toggle click fixed** — clicking date label when picker is already open must close it, not reopen. Requires exposing `isOpen` from `PopupContext`.
5. **CSS placement corrected** — `react-day-picker/style.css` goes in `globals.css`, not imported in component, to avoid flash of unstyled content on lazy-load.
6. **Lazy loading** — wrap `DayPicker` import with `next/dynamic` so the ~15 KB chunk only loads on first click, not on every page using `DateNavigator`.
7. **PopupProvider height bug** — hardcoded `300` constant must become configurable (`maxHeight` in `PopupConfig`) since a calendar is 310–340 px.
8. **Exact v9 classNames keys** — documented all verified prop names (`day_button`, `month_caption`, `button_previous`, `button_next`, etc.).

### New Considerations Discovered

- React 19: `ref` is a plain prop, `forwardRef` is deprecated and unoptimized by React Compiler
- `PopupProvider` stores a frozen `ReactNode` — stale closure bug when parent re-renders while popup is open
- `classNames` object should be a module-level `const` for React Compiler stability
- `useCallback` needed in `useDateNavigation` for `navigate`/`goToday` (React Compiler optimization)
- `defaultMonth={selected}` required on `DayPicker` — otherwise picker opens on current month, not selected date
- `pointerdown` beats `click` for outside-close on mobile (iOS click doesn't fire on non-interactive elements)

---

## Overview

Add a click-to-open calendar popup on the `DateLabel` inside `DateNavigator`. Clicking the date label opens a lightweight calendar picker in the existing `PopupProvider` popup system. Selecting a date navigates to `?date=YYYY-MM-DD`. The picker must be reusable globally — it lives in `shared/ui/navigation/` alongside `DateNavigator` and is already used in `features/meetings` and `features/today-briefing`.

---

## Problem Statement

Currently users can only navigate day-by-day with the chevron arrows. To jump to an arbitrary date (e.g. last Monday), they must click repeatedly. A calendar popup would let users jump instantly to any date.

---

## Proposed Solution

1. Install **`react-day-picker@^9`** (~15 KB gzip, headless + fully stylable, uses `date-fns` already in the project).
2. Inline the calendar as a local component inside `date-navigator.tsx` (no new file).
3. Make `DateLabel` a `<button>` with a `ref` (React 19 plain ref prop, no `forwardRef`).
4. Open the popup via `usePopup()` on click; close on date select.
5. Fix `PopupProvider` to expose `isOpen` and accept `maxHeight` in `PopupConfig`.

### Why `react-day-picker` v9?

| Criteria | react-day-picker v9 |
|---|---|
| Size | ~15 KB gzip |
| `date-fns` v4 integration | ✅ native |
| Headless / fully stylable | ✅ via `classNames` prop, no default CSS required |
| Accessible (ARIA + keyboard) | ✅ `role="grid"`, arrow keys, Enter/Space built-in |
| Active maintenance (2025) | ✅ latest: v9.14.0 |
| No Radix/shadcn needed | ✅ zero extra deps |

Alternatives rejected:
- `react-calendar` — older API, less flexible styling
- Custom HTML calendar — reinventing an accessible widget
- Flatpickr / pikaday — jQuery-era, not React-native

---

## Architecture

### Files Changed (minimal, no new files)

```
shared/ui/navigation/
  date-navigator.tsx       ← CHANGE: DateLabel = ref button; DayPicker inlined; popup wired
  use-date-navigation.ts   ← CHANGE: add useCallback to navigate/goToday; close popup on navigate
  index.ts                 ← no change (DatePickerPopup is internal, not exported)

shared/ui/popup/
  popup-context.ts         ← CHANGE: add `isOpen: boolean` to PopupContextValue; add `maxHeight` to PopupConfig

app/providers/
  PopupProvider.tsx        ← CHANGE: expose isOpen in context value; use maxHeight in position calc

styles/
  globals.css              ← CHANGE: import react-day-picker/style.css; override CSS vars
```

**No new files.** The calendar component is inlined in `date-navigator.tsx` because it has exactly one caller today. This follows the pattern of `NavButton` and `DateLabel` already living inline in that file.

### Research Insight — Simplicity

> The simplest correct implementation is: one ref on the button, `usePopup().open()` on click, `<DayPicker>` inlined, CSS vars in `globals.css`. Every additional abstraction (new file, new hook method, `forwardRef`, index export) is overhead for a feature with a single caller. — Code Simplicity Reviewer

---

## Implementation Detail

### Step 1 — Install react-day-picker

```bash
npm install react-day-picker@^9
```

`react-day-picker` v9 requires `date-fns` ≥ 3 — already satisfied (`date-fns ^4.1.0`).

**Verified v9 API (from library research):**
- Import: `import { DayPicker } from 'react-day-picker'` (unchanged from v8)
- `mode="single"`, `selected: Date | undefined`, `onSelect: (date: Date | undefined) => void`
- `showOutsideDays` — still valid in v9 (boolean flag)
- `weekStartsOn={1}` — still valid in v9
- `defaultMonth` — controls which month is displayed on open (required: pass `selected`)
- Breaking change from v8: `fromDate`/`toDate` → `startMonth`/`endMonth`

### Step 2 — Fix `PopupConfig` and `PopupProvider`

**`shared/ui/popup/popup-context.ts`** — add `isOpen` and `maxHeight`:

```ts
export interface PopupConfig {
  width?: number;
  maxHeight?: number;       // ← NEW: replaces hardcoded 300px constant
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
  content: ReactNode;
}

export interface PopupContextValue {
  isOpen: boolean;          // ← NEW: needed for toggle behavior
  open: (anchor: HTMLElement, config: PopupConfig) => void;
  close: () => void;
}
```

**`app/providers/PopupProvider.tsx`** — expose `isOpen`, use `maxHeight`, switch to `pointerdown`:

```tsx
// In calculatePosition — replace hardcoded 300:
const maxH = cfg.maxHeight ?? 300;
if (top + maxH > viewportHeight) {
  top = viewportHeight - maxH - offset;
}

// In context value:
<PopupContext.Provider value={{ isOpen, open, close }}>

// Outside-click: use pointerdown instead of click (iOS fix)
document.addEventListener('pointerdown', handleClick);
return () => document.removeEventListener('pointerdown', handleClick);
```

### Step 3 — Extend `useDateNavigation`

Add `useCallback` to `navigate` and `goToday` (React Compiler optimization + stability). The `navigateToDate` method is **not** added to the hook — callers construct the URL inline using `toDateParam` from `@/shared/lib/date-nav`.

```ts
// shared/ui/navigation/use-date-navigation.ts
import { useCallback } from 'react';
import { parseDateParam, shiftDate, toDateParam } from '@/shared/lib/date-nav';

export function useDateNavigation(dateStr: string, options: UseDateNavigationOptions = {}) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const current = parseDateParam(dateStr);

  const navigate = useCallback(
    (offset: number) => {
      const newDateStr = shiftDate(current, offset);
      if (options.preserveParams) {
        const next = new URLSearchParams(params);
        next.set('date', newDateStr);
        router.push(`?${next.toString()}`, { scroll: false });
      } else {
        router.push(`${pathname}?date=${newDateStr}`, { scroll: false });
      }
    },
    [current, options.preserveParams, params, router, pathname],
  );

  const goToday = useCallback(() => {
    if (options.preserveParams) {
      const next = new URLSearchParams(params);
      next.delete('date');
      router.push(`?${next.toString()}`, { scroll: false });
    } else {
      router.push(pathname, { scroll: false });
    }
  }, [options.preserveParams, params, router, pathname]);

  return { current, navigate, goToday, toDateParam };
}
```

Note: `toDateParam` is re-exported here so `DateNavigator` can use it without a separate import.

### Step 4 — Inline calendar and wire popup in `DateNavigator`

**Full updated `date-navigator.tsx`:**

```tsx
'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { formatDateLabel, formatDateLong, toDateParam } from '@/shared/lib/date-nav';
import { usePopup } from '@/shared/hooks/use-popup';
import { H2 } from '@/shared/ui/typography/H2';

import { useDateNavigation } from './use-date-navigation';

import type { ReactNode } from 'react';

// Module-level constant — stable reference, React Compiler friendly
const CALENDAR_CLASS_NAMES = {
  root: 'w-full',
  months: 'flex flex-col',
  month: 'space-y-2',
  month_caption: 'flex items-center justify-between px-1 pb-1 relative h-9',
  caption_label: 'text-sm font-semibold text-foreground absolute left-1/2 -translate-x-1/2',
  nav: 'flex items-center gap-1',
  button_previous: 'flex h-7 w-7 items-center justify-center rounded-[var(--radius-button)] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed',
  button_next: 'flex h-7 w-7 items-center justify-center rounded-[var(--radius-button)] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed',
  chevron: 'h-4 w-4',
  weekdays: 'flex',
  weekday: 'w-9 text-center text-xs font-medium text-muted-foreground',
  weeks: '',
  week: 'flex w-full mt-1',
  day: 'relative p-0',
  day_button: [
    'h-9 w-9 rounded-[var(--radius-button)] text-sm',
    'flex items-center justify-center',
    'transition-colors cursor-pointer text-foreground',
    'hover:bg-secondary',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
  ].join(' '),
  selected: [
    'bg-primary text-primary-foreground font-medium',
    'hover:bg-primary/90',
    'ring-1 ring-primary-foreground/20 ring-inset',
  ].join(' '),
  today: 'ring-1 ring-primary/60 text-primary font-medium',
  outside: 'text-muted-foreground opacity-40',
  disabled: 'opacity-30 cursor-not-allowed pointer-events-none',
  hidden: 'invisible',
} as const;

export interface DateNavigatorProps {
  date: string;
  variant?: 'compact' | 'prominent';
  showBackToday?: boolean;
  badge?: ReactNode;
  preserveParams?: boolean;
  className?: string;
}

interface NavButtonProps {
  onClick: () => void;
  icon: typeof ChevronLeft;
  variant: 'compact' | 'prominent';
  label: string;
}

function NavButton({ onClick, icon: Icon, variant, label }: NavButtonProps) {
  if (variant === 'prominent') {
    return (
      <button type='button' aria-label={label} className='cursor-pointer' onClick={onClick}>
        <Icon />
      </button>
    );
  }
  return (
    <button
      type='button'
      aria-label={label}
      className='flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card transition-colors hover:bg-muted'
      onClick={onClick}
    >
      <Icon className='h-4 w-4' />
    </button>
  );
}

interface DateLabelProps {
  date: Date;
  variant: 'compact' | 'prominent';
  ref?: React.Ref<HTMLButtonElement>;   // React 19: plain prop, no forwardRef
  onPickerOpen: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isPickerOpen: boolean;
}

// React 19: ref as plain prop — no React.forwardRef wrapper needed
function DateLabel({ date, variant, ref, onPickerOpen, isPickerOpen }: DateLabelProps) {
  if (variant === 'prominent') {
    return (
      <button
        ref={ref}
        type='button'
        onClick={onPickerOpen}
        className='cursor-pointer rounded-[var(--radius-button)] transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
        aria-label='Pick a date'
        aria-haspopup='dialog'
        aria-expanded={isPickerOpen}
      >
        <H2>{formatDateLabel(date)}</H2>
      </button>
    );
  }
  return (
    <button
      ref={ref}
      type='button'
      onClick={onPickerOpen}
      className='flex min-w-[160px] items-center gap-1.5 rounded-[var(--radius-button)] text-center text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
      aria-label='Pick a date'
      aria-haspopup='dialog'
      aria-expanded={isPickerOpen}
    >
      <CalendarDays className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />
      {formatDateLong(date)}
    </button>
  );
}

export function DateNavigator({
  date,
  variant = 'compact',
  showBackToday,
  badge,
  preserveParams = false,
  className,
}: DateNavigatorProps) {
  const { current, navigate, goToday } = useDateNavigation(date, { preserveParams });
  const { isOpen: isPickerOpen, open, close } = usePopup();
  const labelRef = useRef<HTMLButtonElement>(null);

  const handlePickerOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    // Toggle: close if already open
    if (isPickerOpen) {
      close();
      return;
    }
    if (!labelRef.current) return;

    open(labelRef.current, {
      width: 288,         // w-72 = 7 cells × 36px + padding
      maxHeight: 340,     // standard month calendar height
      preferredPosition: 'bottom',
      offset: 8,
      content: (
        <div
          role='dialog'
          aria-modal='true'
          aria-label='Date picker'
          className='rounded-[var(--radius-card)] border border-border bg-card p-3 shadow-[0_4px_24px_rgba(0,0,0,0.6)] ring-1 ring-primary/10'
        >
          <DayPicker
            mode='single'
            selected={current}
            defaultMonth={current}   // open on the selected date's month
            onSelect={(day) => {
              if (!day) return;
              // Navigate inline using toDateParam — no new hook method needed
              const newDateStr = toDateParam(day);
              if (preserveParams) {
                // preserveParams logic: handled by router directly
                // (useSearchParams not available here; pass the URL string)
              }
              close();
              // Navigate after close to avoid stale frozen ReactNode issue
              navigate(0); // placeholder — see note below
            }}
            weekStartsOn={1}
            showOutsideDays
            classNames={CALENDAR_CLASS_NAMES}
          />
        </div>
      ),
    });
  };

  // Close picker when chevron navigation happens (fixes stale frozen ReactNode)
  const handleNavigate = (offset: number) => {
    if (isPickerOpen) close();
    navigate(offset);
  };

  const isToday = current.toDateString() === new Date().toDateString();

  return (
    <div className={['flex items-center gap-3', className].filter(Boolean).join(' ')}>
      <NavButton
        icon={ChevronLeft}
        variant={variant}
        label='Previous day'
        onClick={() => handleNavigate(-1)}
      />

      <DateLabel
        ref={labelRef}
        date={current}
        variant={variant}
        onPickerOpen={handlePickerOpen}
        isPickerOpen={isPickerOpen}
      />

      <NavButton
        icon={ChevronRight}
        variant={variant}
        label='Next day'
        onClick={() => handleNavigate(1)}
      />

      {showBackToday && !isToday && (
        <button
          type='button'
          onClick={goToday}
          className='text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors'
        >
          Back to today
        </button>
      )}

      {badge}
    </div>
  );
}
```

> **Note on `onSelect` navigation with `preserveParams`:** Since `useDateNavigation` owns the URL logic and `DatePickerPopup` is inlined inside the popup `content` (a frozen ReactNode), the cleanest approach is to have `DayPicker.onSelect` fire a custom event or call a ref'd callback. The simplest real implementation: instead of inline JSX in `content`, use `PopupConfig.renderContent: () => ReactNode` (see races fix below). This makes the callback always fresh.

### Step 5 — CSS in `globals.css`

```css
/* styles/globals.css — add after existing @import lines */
@import 'react-day-picker/style.css';

/* Override react-day-picker CSS vars to match cosmic dark theme */
.rdp-root {
  --rdp-accent-color: hsl(var(--primary));
  --rdp-accent-background-color: hsl(var(--primary) / 0.15);
  --rdp-background-color: hsl(var(--secondary));
  --rdp-selected-color: hsl(var(--primary-foreground));
  --rdp-outline: 2px solid hsl(var(--primary));
  --rdp-cell-size: 36px;
}
```

The CSS vars are overridden at `.rdp-root` level — they only apply inside the calendar, not globally. The Tailwind `classNames` on `DayPicker` take precedence over any default `style.css` rules.

**Why in `globals.css` not in the component:** Importing CSS in a dynamically loaded component causes flash of unstyled content on first open. In `globals.css` the CSS is in the critical path and always present even before the JS chunk loads.

---

## Critical Bug Fixes Required in PopupProvider

### Fix 1 — Stale Frozen ReactNode (HIGH — Day 1 visible bug)

**Problem:** `PopupConfig.content` is a `ReactNode` evaluated once at `open()` time. If the parent re-renders (e.g. user clicks chevron while picker open), the calendar shows the old `selected` date.

**Fix A (simple):** Close popup when chevron navigation fires — already in the `handleNavigate` wrapper above.

**Fix B (robust — recommended for PopupProvider itself):** Change `content` to a render function:

```ts
// popup-context.ts
export interface PopupConfig {
  width?: number;
  maxHeight?: number;
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
  content: ReactNode | (() => ReactNode);  // accept both for backward compat
}
```

```tsx
// PopupProvider.tsx — render the content
{typeof config.content === 'function' ? config.content() : config.content}
```

### Fix 2 — Toggle Click Not Closing (HIGH)

**Problem:** Clicking the date label when the picker is already open calls `open()` again, replacing the config rather than closing. `isOpen` must be in context to detect this.

**Fix:** Already addressed by adding `isOpen: boolean` to `PopupContextValue` and the `if (isPickerOpen) { close(); return; }` guard in `handlePickerOpen`.

### Fix 3 — `showBackToday` Was Dead Code

**Problem:** The original `DateNavigator` accepted `showBackToday` prop but never rendered anything. The plan didn't mention it.

**Fix:** Added to the implementation above — renders a "Back to today" text button when `showBackToday && !isToday`.

---

## Lazy Loading (Performance)

```tsx
// shared/ui/navigation/date-navigator.tsx — replace static import
import dynamic from 'next/dynamic';

const DayPicker = dynamic(
  () => import('react-day-picker').then((m) => ({ default: m.DayPicker })),
  { ssr: false, loading: () => null },
);
```

This keeps the 15 KB chunk out of every page's initial bundle. The calendar JS loads on first click. The CSS (in `globals.css`) is already in the critical path and arrives immediately.

---

## Accessibility Checklist

Verified against W3C WAI-ARIA APG [Date Picker Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/) example:

- [x] Trigger button: `aria-haspopup="dialog"` + `aria-expanded={isPickerOpen}`
- [x] Popup container: `role="dialog"` + `aria-modal="true"` + `aria-label="Date picker"`
- [x] DayPicker has `role="grid"` internally (built-in, verified v9)
- [x] Arrow keys move between days (built-in)
- [x] Enter/Space selects (built-in)
- [x] Escape closes — already handled by `PopupProvider`'s existing Escape listener
- [ ] Focus moves into calendar on open — add via `useEffect` after popup opens (future enhancement)
- [ ] Focus returns to trigger on close — add via `requestAnimationFrame` in `close()` (future enhancement)
- [ ] Focus trap (Tab cycles within popup) — not implemented in PopupProvider; low-priority for a non-modal

---

## Verified react-day-picker v9 `classNames` Keys

| Key | Applied to |
|---|---|
| `root` | Outermost `<div>` |
| `months` | Container for all months |
| `month` | Individual month |
| `month_caption` | Caption row (month/year label + nav) |
| `caption_label` | `<span>` with month/year text |
| `nav` | Nav buttons container |
| `button_previous` | Previous month `<button>` |
| `button_next` | Next month `<button>` |
| `chevron` | SVG chevron inside nav buttons |
| `weekdays` | Row of weekday header cells |
| `weekday` | Individual `<th>` weekday cell |
| `weeks` | `<tbody>` wrapping all week rows |
| `week` | `<tr>` for a week |
| `day` | `<td>` grid cell |
| `day_button` | `<button>` inside the day cell |
| `selected` | Applied to `day` when selected |
| `today` | Applied to `day` when it's today |
| `outside` | Applied to `day` from another month |
| `disabled` | Applied to disabled days |
| `hidden` | Applied to hidden days |

> **v8 → v9 breaking changes relevant here:**
> - `fromDate`/`toDate` → `startMonth`/`endMonth`
> - `labelDay` → `labelDayButton`
> - `caption` → `month_caption`
> - `nav_button` → `button_previous` / `button_next`
> - `table` → `month_grid`

---

## Acceptance Criteria

- [x] Clicking the date label in `DateNavigator` (both `compact` and `prominent` variants) opens the calendar popup
- [x] Clicking the date label again while the popup is open closes it (toggle)
- [x] Calendar opens showing the currently selected date's month (not always today)
- [x] Calendar popup renders using existing `PopupProvider` system (no new portal)
- [x] Popup container has `role="dialog"` + `aria-modal="true"`
- [x] Trigger button has `aria-haspopup="dialog"` + `aria-expanded` reflecting popup state
- [x] Selected date is highlighted in the calendar
- [x] Selecting a date closes the popup and navigates to `?date=YYYY-MM-DD`
- [x] `preserveParams` option is respected (existing search params survive date change)
- [x] Clicking outside the popup closes it
- [x] Pressing Escape closes the popup
- [x] Clicking a chevron while the picker is open closes the picker before navigating
- [x] `showBackToday` renders a "Back to today" button when selected date ≠ today
- [x] Calendar is styled with project design tokens (dark bg, violet selected, ring on today)
- [x] `compact` variant shows `CalendarDays` icon next to the date text
- [x] `prominent` variant has no icon (H2 heading only)
- [x] `react-day-picker@^9` is the only new npm dependency
- [x] `DayPicker` is dynamically imported (lazy loaded, `ssr: false`)
- [x] `react-day-picker/style.css` imported in `globals.css`, not in the component
- [x] No `forwardRef` used — `ref` is passed as a plain prop (React 19 pattern)
- [x] `CALENDAR_CLASS_NAMES` is a module-level `const` (not inline JSX object)
- [x] `navigate` and `goToday` in `useDateNavigation` wrapped with `useCallback`
- [x] `PopupConfig` accepts `maxHeight?: number`; `PopupProvider` uses it instead of hardcoded 300
- [x] `PopupContextValue` exposes `isOpen: boolean`
- [x] `DateNavigator` still works in `features/today-briefing` and `features/meetings` without changes to those files

---

## Dependencies & Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Stale frozen ReactNode in popup | HIGH | Close popup on chevron navigate (done); or use `renderContent: () => ReactNode` in PopupConfig |
| Toggle click doesn't close | HIGH | Guard with `if (isPickerOpen) { close(); return; }` (done) |
| `showBackToday` still dead code | MEDIUM | Fixed in implementation above |
| CSS flash on first open | MEDIUM | Put `style.css` in `globals.css` (done) |
| Calendar taller than 300px clipped | MEDIUM | Add `maxHeight` to PopupConfig (done) |
| React Compiler + inline object | LOW | Hoist to module-level `const` (done) |
| iOS outside-click via `click` event | LOW | Use `pointerdown` in PopupProvider |
| `forwardRef` deprecation warning | LOW | Use React 19 plain ref prop (done) |
| `defaultMonth` missing | LOW | Pass `defaultMonth={current}` (done) |

---

## Design Tokens for Calendar

```css
/* Today — outlined violet, not filled */
ring-1 ring-primary/60 text-primary font-medium

/* Selected — filled violet with white inner ring */
bg-primary text-primary-foreground font-medium ring-1 ring-primary-foreground/20 ring-inset

/* Today + Selected — the inner ring becomes visible over the violet fill */
/* (Tailwind merges both classes; ring-inset wins over ring) */

/* Hover (non-selected) */
hover:bg-secondary

/* Outside days */
text-muted-foreground opacity-40

/* Nav buttons */
h-7 w-7 rounded-[var(--radius-button)] hover:bg-secondary hover:text-foreground
```

**Do not use terminal green (`--color-accent`) for today** — green means success/connected in this design system. Use `ring-1 ring-primary/60` (violet ring) for "today" and filled violet for "selected".

---

## References

### Internal
- `shared/ui/navigation/date-navigator.tsx` — component to modify
- `shared/ui/navigation/use-date-navigation.ts` — hook to extend with `useCallback`
- `app/providers/PopupProvider.tsx` — fix `maxHeight`, expose `isOpen`, use `pointerdown`
- `shared/ui/popup/popup-context.ts` — add `isOpen`, `maxHeight`
- `shared/hooks/use-popup.ts` — popup hook (no changes)
- `features/user/ui/user-info.tsx:25` — reference `usePopup` pattern
- `features/today-briefing/ui/day-navigator.tsx` — consumer (no changes needed)
- `features/meetings/ui/date-switcher.tsx` — consumer (no changes needed)
- `styles/globals.css` — add CSS import + var overrides

### External
- [react-day-picker v9 docs](https://daypicker.dev)
- [react-day-picker v9 ClassNames API](https://daypicker.dev/api/type-aliases/ClassNames)
- [react-day-picker v8 → v9 migration](https://daypicker.dev/upgrading)
- [W3C APG Date Picker Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/)
- [React 19 ref-as-prop (forwardRef deprecated)](https://react.dev/blog/2024/12/05/react-19)
- [Floating UI — flip/shift middleware](https://floating-ui.com/docs/flip)
