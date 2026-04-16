---
title: 'feat: Calendar Meeting Bot Presence Indicators & Visual Differentiation'
type: feat
status: active
date: 2026-04-16
---

# feat: Calendar Meeting Bot Presence Indicators & Visual Differentiation

## Overview

Improve visual clarity of calendar event pills across all calendar surfaces
(`features/calendar/ui/event.tsx`,
`features/meetings/ui/org-calendar-event.tsx`) by adding inline bot-presence
indicators. For **upcoming** meetings: show whether the bot is scheduled (or
not). For **past** meetings: show whether the bot attended or was missed,
integrated with the existing summary-status icon.

The feature touches two rendering surfaces (personal calendar pill and
org-calendar pill), but must be driven by a single shared state machine —
`getMeetingDisplayState` — so visual semantics stay consistent everywhere.

---

## Problem Statement

Currently, bot presence information is only visible on:

- The hover tooltip inside `features/calendar/ui/event.tsx` (small text, easy to
  miss)
- The `MeetingCard` badges in the list/day view

**Calendar pills** — the primary at-a-glance view — carry **no bot indicator**.
A user cannot distinguish "upcoming with bot" from "upcoming without bot"
without hovering. Similarly, past meetings only show summary status (✓ or dashed
circle) but give no signal about whether a bot was present.

### Gap analysis per surface

| Surface                       | Upcoming bot signal | Past bot signal             |
| ----------------------------- | ------------------- | --------------------------- |
| `event.tsx` pill              | ❌ tooltip only     | ❌ none (only summary icon) |
| `org-calendar-event.tsx` pill | ❌ none             | ❌ none                     |
| `MeetingCard` (list)          | ✅ badge            | ✅ badge                    |
| `EventProps` type             | ✅ `required_bot`   | ✅ `has_summary`            |
| `CalendarEventListItem` type  | ✅ `required_bot`   | ✅ `has_summary`            |

All required data is already available client-side — this is purely a
**rendering change**.

---

## Proposed Solution

### Option A — Bot icon appended to pill (Recommended ✅)

Append a small `Bot` / `BotOff` icon to the right side of every event pill.
Color semantics driven by `MeetingDisplayState`:

| Display state       | Icon            | Color                                    |
| ------------------- | --------------- | ---------------------------------------- |
| `upcoming_with_bot` | `Bot`           | `text-primary-foreground` (on violet bg) |
| `upcoming_no_bot`   | `BotOff`        | `text-primary-foreground/50` (dimmed)    |
| `past_with_summary` | `Bot`           | `text-primary`                           |
| `past_missed_bot`   | `BotOff`        | `text-destructive`                       |
| `past_no_bot`       | —               | hidden (no icon, saves space)            |
| `active`            | `Bot` (pulsing) | `text-emerald-400`                       |

**Pros:** Glanceable, no extra space needed, consistent with lucide-react usage
throughout **Cons:** Pill gets slightly wider (manageable since pills already
show title text)

### Option B — Pill border color (Alternative)

Apply a colored left-border or ring to the pill itself:

- Upcoming with bot → violet ring
- Upcoming no bot → muted/no ring
- Past missed bot → red ring
- Past with summary → green ring

**Pros:** Does not change pill content **Cons:** Borders on round pills look
odd; border color alone is not accessible; duplicates what `MeetingCard` already
does with cards (fine for cards, harder on pills)

### Option C — Dot indicator (Alternative)

A 6px colored dot overlaid on the top-right corner of the pill.

**Pros:** Zero horizontal space, looks clean **Cons:** Hard to parse without a
legend; inconsistent with other icon-based patterns in codebase

### Decision

**Option A** is recommended because:

1. Aligns with existing icon vocabulary (`Bot`/`BotOff` from lucide-react are
   already used in `MeetingCard` and `BotToggleButton`)
2. Color semantics are already established (`destructive` = missed, `primary` =
   scheduled/attended)
3. Accessible (icon + color together)
4. Works on both `event.tsx` and `org-calendar-event.tsx` with the same helper

---

## Technical Design

### 1. Extend `getMeetingDisplayState` to `EventProps`

`getMeetingDisplayState` currently accepts `CalendarEventListItem` fields.
`EventProps` has the same fields (`required_bot`, `has_summary`, `starts_at`,
`ends_at`). The utility already uses `Pick<CalendarEventListItem, ...>` — so
`EventProps` is already compatible.

No type change needed. Both components can call `getMeetingDisplayState`
directly.

### 2. Shared helper: `getBotPillIndicator`

Create `features/meetings/model/bot-pill-indicator.ts`:

```ts
// features/meetings/model/bot-pill-indicator.ts
import type { MeetingDisplayState } from './meeting-state';

export type BotPillIndicator =
  | { show: false }
  | {
      show: true;
      icon: 'bot' | 'bot-off';
      colorClass: string;
      label: string; // accessible aria-label
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
  past_no_bot: { show: false },
};

export function getBotPillIndicator(
  state: MeetingDisplayState,
): BotPillIndicator {
  return INDICATOR_MAP[state];
}
```

### 3. Shared component: `BotPillIcon`

Create `features/meetings/ui/bot-pill-icon.tsx`:

```tsx
// features/meetings/ui/bot-pill-icon.tsx
'use client';

import { Bot, BotOff } from 'lucide-react';
import type { BotPillIndicator } from '../model/bot-pill-indicator';

interface BotPillIconProps {
  indicator: BotPillIndicator;
  size?: number;
}

export function BotPillIcon({ indicator, size = 12 }: BotPillIconProps) {
  if (!indicator.show) return null;

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

### 4. Update `features/calendar/ui/event.tsx`

The `event.tsx` pill uses `EventProps` (not `CalendarEventListItem`), which is
missing `ends_at` for active-state detection. `EventProps` does have `ends_at`,
so `getMeetingDisplayState` can be called directly.

Changes:

- Import `getMeetingDisplayState` from `@/features/meetings/model/meeting-state`
- Import `getBotPillIndicator` from
  `@/features/meetings/model/bot-pill-indicator`
- Import `BotPillIcon` from `@/features/meetings/ui/bot-pill-icon`
- Compute `displayState = getMeetingDisplayState(event)` (replaces `isPast`
  logic where used for bot)
- Append `<BotPillIcon indicator={getBotPillIndicator(displayState)} />` inside
  the pill div

The existing `isPast` variable can remain for the text / strikethrough logic
that isn't bot-related.

**Before (pill JSX excerpt):**

```tsx
<div className={clsx('flex flex-row items-center gap-2 rounded-full p-[6px] ...', ...)}>
  <div className='flex flex-row items-center gap-2 flex-shrink-0'>
    {/* summary icon */}
  </div>
  <p className='text-xs font-bold truncate min-w-0'>{event.title}</p>
</div>
```

**After:**

```tsx
<div className={clsx('flex flex-row items-center gap-2 rounded-full p-[6px] ...', ...)}>
  <div className='flex flex-row items-center gap-2 flex-shrink-0'>
    {/* summary icon — unchanged */}
  </div>
  <p className='text-xs font-bold truncate min-w-0'>{event.title}</p>
  <BotPillIcon indicator={getBotPillIndicator(displayState)} size={12} />
</div>
```

Also remove the redundant "Bot added / No bot" row from the **tooltip** (line
157–163 of current file) — this information is now always visible on the pill
itself.

### 5. Update `features/meetings/ui/org-calendar-event.tsx`

`OrgCalendarEvent` uses `CalendarEventListItem` which is already fully
compatible with `getMeetingDisplayState`. Changes are identical in structure to
`event.tsx`.

Additionally, add bot info to the **hover tooltip** already present for past
events (currently only shows title). For future events the
`MeetingCalendarPopover` already shows bot status.

**Tooltip enhancement (past events):**

```tsx
<div className='px-3 pt-3 pb-2 border-b border-border/60'>
  <p className='text-xs font-semibold text-foreground'>{event.title}</p>
</div>
<div className='px-3 py-2'>
  <BotPillIcon indicator={getBotPillIndicator(displayState)} size={11} />
  <span className='text-xs text-muted-foreground ml-1'>{indicator.label}</span>
</div>
```

### 6. Export from `features/meetings/index.ts`

Add new exports:

```ts
export { getBotPillIndicator } from './model/bot-pill-indicator';
export type { BotPillIndicator } from './model/bot-pill-indicator';
export { BotPillIcon } from './ui/bot-pill-icon';
```

---

## Files to Create / Modify

| File                                            | Action     | Notes                                  |
| ----------------------------------------------- | ---------- | -------------------------------------- |
| `features/meetings/model/bot-pill-indicator.ts` | **Create** | Helper: state → icon config            |
| `features/meetings/ui/bot-pill-icon.tsx`        | **Create** | Reusable icon component                |
| `features/calendar/ui/event.tsx`                | **Modify** | Add bot icon to personal calendar pill |
| `features/meetings/ui/org-calendar-event.tsx`   | **Modify** | Add bot icon to org calendar pill      |
| `features/meetings/index.ts`                    | **Modify** | Re-export new model and UI             |

No backend changes needed. No new API calls. No type changes needed — all data
already present in `EventProps` and `CalendarEventListItem`.

---

## Visual Before / After

### Before — personal calendar pill (future, bot scheduled)

```
[○] Sprint Planning
```

No bot indication until hover.

### After — personal calendar pill (future, bot scheduled)

```
[○] Sprint Planning  🤖
```

Bot icon on right in `text-primary-foreground` color.

### After — personal calendar pill (future, no bot)

```
[○] Sprint Planning  🤖̶
```

BotOff icon in dimmed `text-primary-foreground/40`.

### After — past pill (bot attended)

```
[✓] Sprint Planning  🤖
```

CheckBig icon (summary) + Bot icon in `text-primary` (violet).

### After — past pill (bot missed)

```
[⊙] Sprint Planning  🤖̶
```

CircleDashed (no summary) + BotOff icon in `text-destructive` (red).

---

## Acceptance Criteria

### Functional

- [ ] Personal calendar pills show bot icon for ALL `MeetingDisplayState` values
      except `past_no_bot`
- [ ] Org-calendar pills show bot icon with identical visual logic
- [ ] Upcoming meetings: `Bot` icon when `required_bot=true`, `BotOff` when
      `required_bot=false`
- [ ] Past meetings: `Bot` icon when `has_summary=true` AND `required_bot=true`;
      `BotOff` in red when `required_bot=true` but `has_summary=false`
- [ ] Redundant "Bot added / No bot" tooltip row removed from `event.tsx`
- [ ] Bot icon tooltip/aria-label is human-readable ("Bot scheduled", "Bot
      missed", etc.)

### Code Quality

- [ ] `getBotPillIndicator` lives in `features/meetings/model/` (model layer, no
      JSX)
- [ ] `BotPillIcon` lives in `features/meetings/ui/` and is exported via
      `index.ts`
- [ ] No cross-feature deep-path imports
- [ ] No hardcoded color strings outside `bot-pill-indicator.ts`
- [ ] `event.tsx` and `org-calendar-event.tsx` do not duplicate the indicator
      config

### Visual

- [ ] Bot icon does not break pill layout (use `flex-shrink-0`)
- [ ] Icon is 12px in pills (small, non-intrusive)
- [ ] Color contrast is sufficient on both violet bg (future) and muted bg
      (past)
- [ ] `active` state (currently in progress) shows pulsing or `text-emerald-400`
      bot icon

---

## Questions Before Implementation

Before coding, the following should be confirmed:

1. **`upcoming_no_bot` — show or hide the BotOff icon?**
   - Option: Always show BotOff (dimmed) so user can see bot is NOT added →
     encourages action
   - Option: Only show for upcoming_with_bot (Bot icon); no icon for no-bot →
     cleaner pills
   - _Recommendation:_ Show dimmed BotOff to make the absence explicit (matches
     the pill's action purpose)

2. **Pill width concern — short meeting names vs. long titles?**
   - The pill already has `truncate min-w-0` on the title. The bot icon is
     `flex-shrink-0` so it will always show.
   - Is this acceptable, or should the bot icon be hidden when title is long?
   - _Recommendation:_ Keep it always visible — 12px icon adds ~20px max.

3. **Remove tooltip bot row from `event.tsx`?**
   - Currently the hover tooltip shows "Bot added" / "No bot" text.
   - Once the icon is on the pill itself, this row is redundant.
   - _Recommendation:_ Remove it — the pill icon + aria-label is sufficient.

4. **`active` state (ongoing meeting) — pulsing animation?**
   - Active meetings already have a special card treatment (emerald bar +
     border).
   - Should the bot icon on an active meeting's pill pulse to draw attention?
   - _Recommendation:_ Simple `text-emerald-400` without animation; animation
     can come later.

5. **`past_no_bot` — no icon (current recommendation) or show muted BotOff?**
   - Meeting had no bot and no summary — show nothing (cleanest) or show muted
     BotOff?
   - _Recommendation:_ No icon. These meetings are "background noise" and
     showing BotOff would add visual noise for benign cases (e.g., 1-on-1s that
     never needed a bot).

---

## Risks & Dependencies

- **No backend risk** — purely frontend rendering, no API changes
- **FSD boundary safe** — `features/meetings/` → consumed by
  `features/calendar/` (allowed: calendar uses meetings types already)
- **Regression risk: LOW** — only adds elements to existing pill, doesn't remove
  structure
- **Test coverage** — `features/meetings/model/bot-pill-indicator.ts` is a pure
  function and should get unit tests

---

## References

- `features/calendar/ui/event.tsx` — personal calendar pill (current)
- `features/meetings/ui/org-calendar-event.tsx` — org calendar pill (current)
- `features/meetings/model/meeting-state.ts` — `getMeetingDisplayState`
  (existing state machine)
- `features/meetings/ui/meeting-card.tsx` — `BOT_BADGE_CONFIG` pattern to mirror
- `features/meetings/ui/bot-toggle-button.tsx` — existing `Bot`/`BotOff` usage
- `entities/event/model/types.ts` — `EventProps`
- `features/meetings/model/types.ts` — `CalendarEventListItem`
