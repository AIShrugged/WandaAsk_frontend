---
title: 'feat: Calendar & Dashboard Bot Presence Indicators'
type: feat
status: completed
date: 2026-04-17
---

# feat: Calendar & Dashboard Bot Presence Indicators

## Overview

Add inline bot-presence icons to **every surface** where calendar events are
displayed as pills, rows, or agenda items. A single shared helper
(`getBotPillIndicator`) drives all rendering so colour semantics stay consistent
everywhere.

**Confirmed decisions (from user):**

| Question                               | Decision                                         |
| -------------------------------------- | ------------------------------------------------ |
| `upcoming_no_bot` — show BotOff?       | **Yes** (dimmed `text-primary-foreground/40`)    |
| Remove tooltip bot row in `event.tsx`? | **Keep it**                                      |
| `active` state animation?              | Plain `text-emerald-400`, no pulse               |
| `past_no_bot` — show icon?             | **Yes**, muted `text-muted-foreground/30` BotOff |
| Scope                                  | **All surfaces** where bot info can be shown     |

---

## Problem Statement

Bot presence information is invisible at-a-glance on every calendar/meeting
surface except `MeetingCard` (list view). A user cannot tell whether:

- an upcoming meeting has a bot scheduled or not
- a past meeting was attended by the bot or missed

without hovering a tooltip or opening a detail panel.

### Gap analysis by surface

| Surface                   | File                                                | Has bot indicator?  |
| ------------------------- | --------------------------------------------------- | ------------------- |
| Personal calendar pill    | `features/calendar/ui/event.tsx`                    | Tooltip only (text) |
| Org calendar pill         | `features/meetings/ui/org-calendar-event.tsx`       | None                |
| Mobile agenda row         | `features/calendar/ui/calendar-agenda.tsx`          | None                |
| Dashboard meetings row    | `features/main-dashboard/ui/meetings-block.tsx`     | None                |
| Calendar popover (future) | `features/meetings/ui/meeting-calendar-popover.tsx` | Text only           |
| Meeting card (list)       | `features/meetings/ui/meeting-card.tsx`             | ✅ Full badge       |

All needed data (`required_bot`, `has_summary`, `starts_at`, `ends_at`) is
already in both `EventProps` and `CalendarEventListItem`. **No backend
changes.**

---

## Visual Design

### Colour semantics (all surfaces)

| `MeetingDisplayState` | Icon     | Colour class                 | Label          |
| --------------------- | -------- | ---------------------------- | -------------- |
| `active`              | `Bot`    | `text-emerald-400`           | Bot in meeting |
| `upcoming_with_bot`   | `Bot`    | `text-primary-foreground`    | Bot scheduled  |
| `upcoming_no_bot`     | `BotOff` | `text-primary-foreground/40` | No bot         |
| `past_with_summary`   | `Bot`    | `text-primary`               | Bot attended   |
| `past_missed_bot`     | `BotOff` | `text-destructive`           | Bot missed     |
| `past_no_bot`         | `BotOff` | `text-muted-foreground/30`   | No bot         |

### Surface-specific rendering

**Calendar pill (14px icon, right of title):**

```
[○] Sprint Planning  🤖       ← upcoming_with_bot (white icon on violet bg)
[○] 1-on-1           🤖̶      ← upcoming_no_bot (dimmed BotOff on violet bg)
[✓] Sprint Planning  🤖       ← past_with_summary (violet Bot icon on muted bg)
[⊙] Design Review   🤖̶       ← past_missed_bot (red BotOff)
[⊙] Casual sync     🤖̶       ← past_no_bot (very muted BotOff)
```

**Agenda row / Dashboard row (12px icon, inline after title):**

```
Sprint Planning  🤖           ← upcoming_with_bot
1-on-1 Alex      🤖̶          ← past_no_bot (muted, not intrusive)
Design Review    🤖̶           ← past_missed_bot (red)
```

**Calendar popover (existing text row → upgraded with coloured icon):**

```
🤖 Bot scheduled              ← text-primary
🤖̶ No bot                    ← text-muted-foreground
```

---

## Technical Design

### 1. Shared model: `getBotPillIndicator`

**File to create:** `features/meetings/model/bot-pill-indicator.ts`

```ts
import type { MeetingDisplayState } from './meeting-state';

export type BotPillIndicator = {
  show: true;
  icon: 'bot' | 'bot-off';
  colorClass: string;
  label: string;
};

const INDICATOR_MAP: Record<MeetingDisplayState, BotPillIndicator> = {
  active: {
    show: true,
    icon: 'bot',
    colorClass: 'text-emerald-400',
    label: 'Bot in meeting',
  },
  upcoming_with_bot: {
    show: true,
    icon: 'bot',
    colorClass: 'text-primary-foreground',
    label: 'Bot scheduled',
  },
  upcoming_no_bot: {
    show: true,
    icon: 'bot-off',
    colorClass: 'text-primary-foreground/40',
    label: 'No bot',
  },
  past_with_summary: {
    show: true,
    icon: 'bot',
    colorClass: 'text-primary',
    label: 'Bot attended',
  },
  past_missed_bot: {
    show: true,
    icon: 'bot-off',
    colorClass: 'text-destructive',
    label: 'Bot missed',
  },
  past_no_bot: {
    show: true,
    icon: 'bot-off',
    colorClass: 'text-muted-foreground/30',
    label: 'No bot',
  },
};

export function getBotPillIndicator(
  state: MeetingDisplayState,
): BotPillIndicator {
  return INDICATOR_MAP[state];
}
```

> Note: `show` is now always `true` — all states render an icon (per user
> decision). The `past_no_bot` state renders a very muted `BotOff` instead of
> hiding.

### 2. Shared component: `BotPillIcon`

**File to create:** `features/meetings/ui/bot-pill-icon.tsx`

```tsx
'use client';

import { Bot, BotOff } from 'lucide-react';
import type { BotPillIndicator } from '../model/bot-pill-indicator';

interface BotPillIconProps {
  indicator: BotPillIndicator;
  size?: number;
}

export function BotPillIcon({ indicator, size = 12 }: BotPillIconProps) {
  const Icon = indicator.icon === 'bot' ? Bot : BotOff;

  return (
    <span
      className={`flex-shrink-0 ${indicator.colorClass}`}
      aria-label={indicator.label}
      title={indicator.label}
    >
      <Icon size={size} />
    </span>
  );
}
```

### 3. Compatibility note: `EventProps` vs `CalendarEventListItem`

`getMeetingDisplayState` is typed as:

```ts
Pick<
  CalendarEventListItem,
  'starts_at' | 'ends_at' | 'required_bot' | 'has_summary'
>;
```

`EventProps` has all four fields with identical types — it is structurally
compatible. No type changes required.

---

## Files to Create / Modify

| File                                                | Action     | Notes                                       |
| --------------------------------------------------- | ---------- | ------------------------------------------- |
| `features/meetings/model/bot-pill-indicator.ts`     | **Create** | Pure helper, unit-testable                  |
| `features/meetings/ui/bot-pill-icon.tsx`            | **Create** | Reusable icon component                     |
| `features/meetings/index.ts`                        | **Modify** | Re-export both new symbols                  |
| `features/calendar/ui/event.tsx`                    | **Modify** | Add `BotPillIcon` to pill (right of title)  |
| `features/meetings/ui/org-calendar-event.tsx`       | **Modify** | Add `BotPillIcon` to pill                   |
| `features/calendar/ui/calendar-agenda.tsx`          | **Modify** | Add `BotPillIcon` to agenda row             |
| `features/main-dashboard/ui/meetings-block.tsx`     | **Modify** | Add `BotPillIcon` to `MeetingRow`           |
| `features/meetings/ui/meeting-calendar-popover.tsx` | **Modify** | Replace text row with `BotPillIcon` + label |

### NOT modified (already has adequate bot UI)

- `features/meetings/ui/meeting-card.tsx` — full badge already present
- `features/meetings/ui/meetings-list.tsx` — delegates to `MeetingCard`
- `features/meetings/ui/meetings-day-view.tsx` — delegates to `MeetingCard`
- `features/meetings/ui/meetings-column-view.tsx` — delegates to `MeetingCard`

---

## Implementation Steps

### Step 1 — Create model helper

- [x] Create `features/meetings/model/bot-pill-indicator.ts` with
      `INDICATOR_MAP` and `getBotPillIndicator`
- [x] Write unit tests in
      `features/meetings/model/__tests__/bot-pill-indicator.test.ts`

### Step 2 — Create `BotPillIcon` component

- [x] Create `features/meetings/ui/bot-pill-icon.tsx`
- [x] Export from `features/meetings/index.ts`

### Step 3 — Update `features/calendar/ui/event.tsx`

- [x] Import `getMeetingDisplayState`, `getBotPillIndicator`, `BotPillIcon` from
      `@/features/meetings`
- [x] Compute `displayState = getMeetingDisplayState(event)`
- [x] Append `<BotPillIcon indicator={botIndicator} size={12} />` right of title
      `<p>`
- [x] Keep existing tooltip bot text row (user decision: keep it)

### Step 4 — Update `features/meetings/ui/org-calendar-event.tsx`

- [x] Same imports as Step 3
- [x] Compute `displayState = getMeetingDisplayState(event)`
- [x] Append `<BotPillIcon>` right of title in pill
- [x] Add `BotPillIcon` + label text to hover tooltip

### Step 5 — Update `features/calendar/ui/calendar-agenda.tsx`

- [x] Import `getMeetingDisplayState`, `getBotPillIndicator`, `BotPillIcon`
- [x] Compute `displayState` per event in the map
- [x] Replace "No summary" text label with `BotPillIcon` (12px) inline after
      title

### Step 6 — Update `features/main-dashboard/ui/meetings-block.tsx`

- [x] Import `getMeetingDisplayState`, `getBotPillIndicator`, `BotPillIcon`
- [x] In `MeetingRow`, compute
      `displayState = getMeetingDisplayState(event, now)`
- [x] Add `<BotPillIcon indicator={botIndicator} size={12} />` in the title row
      flex

### Step 7 — Update `features/meetings/ui/meeting-calendar-popover.tsx`

- [x] Import `getBotPillIndicator`, `BotPillIcon`
- [x] Replace the existing text-only bot row with `<BotPillIcon>` + coloured
      label text
- [x] `displayState` already computed — added `botIndicator` from it

### Step 8 — Tests & QA

- [x] Unit tests for `getBotPillIndicator` (7 tests, all pass)
- [x] Full test suite: 163 suites, 1156 tests — all pass
- [x] Lint: no new errors (only pre-existing warnings)
- [x] `aria-label` / `title` present on all `BotPillIcon` instances via `<span>`
      wrapper

---

## Acceptance Criteria

### Functional

- [ ] All 6 `MeetingDisplayState` values render the correct icon and colour
- [ ] `past_no_bot` shows a very muted BotOff (not hidden)
- [ ] Personal calendar pill (`event.tsx`) shows bot icon on right of title
- [ ] Org calendar pill (`org-calendar-event.tsx`) shows bot icon on right of
      title
- [ ] Mobile agenda row (`calendar-agenda.tsx`) shows bot icon inline
- [ ] Dashboard meetings row (`meetings-block.tsx`) shows bot icon inline
- [ ] Calendar popover bot row uses coloured `BotPillIcon` instead of plain text
- [ ] Tooltip bot row in `event.tsx` is retained (user decision)

### Code Quality

- [ ] `getBotPillIndicator` lives in `features/meetings/model/` (no JSX)
- [ ] `BotPillIcon` exported via `features/meetings/index.ts`
- [ ] No cross-feature deep-path imports
- [ ] No hardcoded colour strings outside `bot-pill-indicator.ts`
- [ ] No duplicated state logic across surfaces

### Visual

- [ ] Icon is `flex-shrink-0` on all surfaces — never pushes title off-screen
- [ ] 12px in pills and rows; 11px in tooltip/popover text rows
- [ ] Colour contrast is sufficient: white on violet bg (upcoming), coloured on
      dark card bg (past)

---

## Risks

- **No backend risk** — purely frontend rendering
- **FSD boundary safe** — `features/meetings/model/` is consumed by
  `features/calendar/` (already the case today with `getMeetingDisplayState`)
- **Regression risk: LOW** — additive change; only inserts new elements into
  existing flex rows
- **Layout risk: VERY LOW** — `flex-shrink-0` on the icon guarantees title
  truncates first

---

## References

- `features/calendar/ui/event.tsx` — personal calendar pill
- `features/meetings/ui/org-calendar-event.tsx` — org calendar pill
- `features/calendar/ui/calendar-agenda.tsx` — mobile agenda list
- `features/main-dashboard/ui/meetings-block.tsx` — dashboard meetings rows
- `features/meetings/ui/meeting-calendar-popover.tsx` — popover bot row
- `features/meetings/model/meeting-state.ts` — `getMeetingDisplayState`
  (existing)
- `features/meetings/ui/meeting-card.tsx` — `BOT_BADGE_CONFIG` pattern to mirror
- `entities/event/model/types.ts` — `EventProps`
- `features/meetings/model/types.ts` — `CalendarEventListItem`
