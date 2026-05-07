---
title: 'refactor: Universal Button System'
type: refactor
status: active
date: 2026-05-06
---

# refactor: Universal Button System

## Overview

Extend and standardise the shared `Button` component family so that every
button-like element in the app uses a component from `shared/ui/button/` rather
than raw `<button>` or manually-duplicated Tailwind classes. The current system
covers ~30% of actual button needs; the remaining ~70% (106 raw `<button>`
elements) use ad-hoc inline styles, creating design drift, accessibility gaps,
and duplicated code.

## Problem Statement

### Current State

`shared/ui/button/` exports five components:

| Component     | Purpose                  | Problem                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| `Button`      | Standard CTA button      | Always `w-full`; only 2 sizes (md/sm); missing `ghost` and `xs`; no icon-slot props |
| `ButtonLink`  | CTA rendered as `<Link>` | Exists but is nearly unused (only `LandingHero.tsx`); no loading state              |
| `ButtonIcon`  | Icon-only action         | No `aria-label` prop; no size variants; limited to 28px icon                        |
| `ButtonClose` | Modal close (×)          | No `aria-label`; not accessible                                                     |
| `ButtonBack`  | Back navigation          | Fine as-is                                                                          |

### Key Gaps (10 identified)

1. **`w-full` default** — every non-full-width caller overrides with
   `className='w-auto'`
2. **No `xs` size** — `h-7`/`h-8` compact buttons everywhere in cards, toolbars,
   sidebars
3. **No `ghost` variant** — transparent bg, text-colored, no border; the
   most-duplicated missing variant
4. **No formal icon-slot** — no `leftIcon`/`rightIcon` props; callers embed
   icons in children
5. **`ButtonIcon` has no `aria-label`** — 5 callsites, all inaccessible
   icon-only buttons
6. **`ButtonClose` has no `aria-label`** — modal close button inaccessible
7. **No loading on `ButtonLink` / `ButtonIcon`** — navigation or async icon
   actions have no spinner
8. **No `pill` variant** — `rounded-full` pill buttons duplicated in 3
   components
9. **`ButtonLink` not used** as CTA link replacement in issues, teams, agents
   features
10. **No `icon-only` size** — `ButtonIcon` uses a fixed `size-[28]`, no API for
    different icon sizes

### Scope of Raw `<button>` Misuse

106 raw `<button>` elements found outside the shared system, classified into:

| Pattern                               | Count | Example                                                       |
| ------------------------------------- | ----- | ------------------------------------------------------------- |
| Compact icon-only toolbar buttons     | ~30   | `artifact-panel.tsx`, `chat-window.tsx`, `sidebar-footer.tsx` |
| Ghost/text inline buttons             | ~25   | "Load more", "Clear", "Edit", "Show all"                      |
| Small xs labeled buttons              | ~15   | `focus-block.tsx`, `empty-state.tsx`                          |
| Pill buttons                          | ~8    | `bot-toggle-button.tsx`, `meeting-join-button.tsx`            |
| Tab/segmented controls                | ~10   | `chat-layout.tsx`, `team-dashboard-tabs.tsx`                  |
| Dropdown menu item buttons            | ~10   | `user-menu-popup.tsx`, `organization-dropdown.tsx`            |
| Duplicated primary/secondary gradient | ~8    | `issue-create-button.tsx`, `teams-header.tsx`                 |

## Proposed Solution

### Phase 1 — Extend `Button` Core (non-breaking)

Extend the base `Button` component with new props while keeping all existing
prop defaults:

#### New props

```ts
// shared/types/button.ts additions
export const BUTTON_VARIANT = {
  primary: 'primary',
  secondary: 'secondary',
  danger: 'danger',
  ghostDanger: 'ghost-danger',
  ghost: 'ghost', // NEW: transparent, text-colored, no border
  pill: 'pill', // NEW: rounded-full outline with hover
} as const;

export const BUTTON_SIZE = {
  xs: 'xs', // NEW: h-7 px-2.5 text-xs
  sm: 'sm',
  md: 'md',
} as const;
```

#### `fullWidth` prop

```ts
interface Props
  extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean; // NEW: default true (keeps backward compat)
  loading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode; // NEW: renders before children
  rightIcon?: ReactNode; // NEW: renders after children
  className?: string;
}
```

> **Backward compatibility:** `fullWidth` defaults to `true` — no existing
> callsite breaks. Callers that currently do `className='w-auto'` switch to
> `fullWidth={false}`.

#### New variant styles

```tsx
// ghost — transparent, text foreground, hover bg-accent
[BUTTON_VARIANT.ghost]: clsx(
  'bg-transparent text-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
  disabledClass, loadingClass,
),

// pill — rounded-full outline pill
[BUTTON_VARIANT.pill]: clsx(
  'rounded-full border border-border bg-background text-muted-foreground',
  'hover:border-primary/40 hover:text-foreground transition-colors',
  disabledClass, loadingClass,
),
```

#### New `xs` size

```tsx
[BUTTON_SIZE.xs]: 'h-7 px-2.5 py-1 text-xs',
```

---

### Phase 2 — Fix Accessibility Gaps

#### `ButtonIcon`

```ts
interface ButtonIconProps {
  icon: ReactNode;
  'aria-label': string; // REQUIRED (was missing)
  href?: string;
  onClickAction?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'ghost'; // add ghost
  size?: 'sm' | 'md' | 'lg'; // NEW: sm=24px, md=28px (default), lg=32px
  loading?: boolean; // NEW
  className?: string;
}
```

#### `ButtonClose`

```ts
// Add aria-label prop with sensible default
interface ButtonCloseProps {
  size?: number;
  close: () => void;
  'aria-label'?: string; // default: 'Close'
}
```

---

### Phase 3 — Migrate Callsites (replace raw `<button>`)

Replace the 106 raw `<button>` elements with the correct shared component.
Priority order:

#### Priority 1 — Duplicated primary/secondary gradient (~8 files)

These copy-paste the exact variant styles. Direct swap to `<Button>` or
`<ButtonLink>`:

| File                                                 | Current                                       | Target                                                       |
| ---------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| `features/issues/ui/issue-create-button.tsx:13`      | `<Link className='...violet gradient...'>`    | `<ButtonLink variant='primary' fullWidth={false}>`           |
| `features/teams/ui/teams-header.tsx:46`              | `<Link className='...'>New</Link>`            | `<ButtonLink variant='primary' size='xs' fullWidth={false}>` |
| `features/teams/ui/teams-empty-state.tsx:23`         | `<Link className='...'>`                      | `<ButtonLink variant='primary' fullWidth={false}>`           |
| `features/chat/ui/telegram-chats-management.tsx:519` | `<button className='...secondary styles...'>` | `<Button variant='secondary' fullWidth={false}>`             |
| `features/demo/ui/demo-dropdown.tsx:212`             | `<button className='...ghost-danger...'>`     | `<Button variant='ghostDanger' fullWidth={false}>`           |

#### Priority 2 — Ghost/text inline buttons (~25 files)

Replace all transparent text-only action buttons with
`<Button variant='ghost' fullWidth={false}>`. Key files:

- `features/today-briefing/ui/archived-section.tsx` — "Load more archived"
- `features/today-briefing/ui/waiting-on-you.tsx` — "Show all"
- `features/today-briefing/ui/stale-items.tsx` — "Show all"
- `features/today-briefing/ui/focus-block.tsx` — "Edit", "Clear"
- `features/teams/ui/team-dashboard-tab-people.tsx` — "Invite"
- `features/agents/ui/today-activity-feed.tsx` — toggle collapse buttons

#### Priority 3 — XS compact labeled buttons (~15 files)

Replace with `<Button size='xs' ...>` or
`<Button size='xs' variant='ghost' fullWidth={false}>`. Key files:

- `features/today-briefing/ui/focus-block.tsx` — "Save", "Cancel" (pair)
- `features/user-profile/ui/CalendarSection.tsx` — settings buttons
- `features/today-briefing/ui/empty-state.tsx` — CTA inside card

#### Priority 4 — Compact icon-only toolbar buttons (~30 files)

Replace with `<ButtonIcon>` with proper `aria-label`. Key files:

- `entities/artifact/ui/artifact-panel.tsx:121,131` — refresh/copy icons
- `features/chat/ui/chat-window.tsx:324,344` — action icons
- `widgets/sidebar/ui/sidebar-footer.tsx:43` — icon action
- `features/meetings/ui/meeting-calendar-popover.tsx:99` — meeting action icon
- `features/issues/ui/critical-path-node-detail.tsx:160` — detail panel icon

#### Priority 5 — Pill buttons (~8 files)

Replace with `<Button variant='pill' fullWidth={false}>`. Key files:

- `features/meetings/ui/bot-toggle-button.tsx:40`
- `features/meetings/ui/meeting-calendar-popover.tsx:134`
- `features/meetings/ui/meeting-join-button.tsx:28`

#### Priority 6 — Dropdown menu item buttons (~10 files)

These are `w-full text-left` menu items. Add a `menuItem` variant or use `ghost`
variant with `text-left justify-start`:

- `widgets/user-menu/ui/user-menu-popup.tsx`
- `features/organizations/ui/organization-dropdown.tsx`
- `features/organizations/ui/organization-list.tsx`

> **Decision needed:** Should `ghost` justify-start be a standalone `menuItem`
> variant, or should `Button` support a `justify` prop
> (`'center' | 'start' | 'end'`)?

---

### Phase 4 — Tab/Segmented Controls (separate concern)

The 10 raw `<button>` elements acting as tab strips should NOT be replaced with
`Button` — they belong to the navigation system. They should use `PageTabsNav`
from `shared/ui/navigation/page-tabs-nav` per the CLAUDE.md tab convention. This
phase is out of scope for the Button refactor but should be tracked separately.

Files to fix separately:

- `features/chat/ui/chat-layout.tsx` — mobile tab strip
- `features/teams/ui/team-dashboard-tabs.tsx` — tab strip
- `features/statistics/ui/issue-progress-chart.tsx` — period filter tabs

---

## Acceptance Criteria

### Functional Requirements

- [ ] `Button` accepts `variant: 'ghost'` — transparent bg, text-colored, hover
      bg-accent
- [ ] `Button` accepts `variant: 'pill'` — rounded-full, outline,
      muted-foreground text
- [ ] `Button` accepts `size: 'xs'` — h-7, px-2.5, text-xs
- [ ] `Button` accepts `fullWidth?: boolean` (default `true`) — `false` makes
      width `w-auto`
- [ ] `Button` accepts `leftIcon?: ReactNode` and `rightIcon?: ReactNode`
- [ ] All existing Button callsites still render identically (no visual
      regression)
- [ ] `ButtonIcon` requires `aria-label` prop (TypeScript compile error if
      missing)
- [ ] `ButtonIcon` supports `loading` prop with spinner
- [ ] `ButtonIcon` supports 3 sizes: `sm` (24px), `md` (28px), `lg` (32px)
- [ ] `ButtonClose` has `aria-label` defaulting to `'Close'`
- [ ] No new raw `<button>` elements in any `features/`, `entities/`, `widgets/`
      file (ESLint rule)

### Migration Requirements

- [ ] All 8 duplicated gradient/style callsites replaced with `Button` or
      `ButtonLink`
- [ ] All ~25 ghost/text inline buttons replaced with `Button variant='ghost'`
- [ ] All ~15 xs compact labeled buttons replaced with `Button size='xs'`
- [ ] All ~30 compact icon toolbar buttons replaced with `ButtonIcon` +
      `aria-label`
- [ ] All 3 pill buttons replaced with `Button variant='pill'`
- [ ] `ButtonLink` used in `issue-create-button.tsx`, `teams-header.tsx`,
      `teams-empty-state.tsx`

### Quality Gates

- [ ] `npm run lint` passes with zero errors
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] Visual regression: no UI changes except the intended ones
- [ ] `shared/ui/button/index.ts` exports all components and updated type
      constants

---

## Technical Approach

### Files to Modify

| File                                | Change                                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------- |
| `shared/types/button.ts`            | Add `ghost`, `pill` to `BUTTON_VARIANT`; add `xs` to `BUTTON_SIZE`                           |
| `shared/ui/button/Button.tsx`       | Add `ghost`/`pill` variant styles, `xs` size, `fullWidth` prop, `leftIcon`/`rightIcon` props |
| `shared/ui/button/button-icon.tsx`  | Require `aria-label`, add `loading`, add `size` prop                                         |
| `shared/ui/button/button-close.tsx` | Add optional `aria-label` with default `'Close'`                                             |
| `shared/ui/button/index.ts`         | Re-export updated type constants                                                             |

### Files to Migrate (~50 files across features/ entities/ widgets/)

See Phase 3 priority lists above.

### Non-breaking Change Strategy

1. Add new props with **safe defaults** (`fullWidth={true}`,
   `leftIcon={undefined}`)
2. New `ghost` and `pill` variants are additions — no existing variant is
   removed or renamed
3. New `xs` size is an addition — `sm` and `md` unchanged
4. `ButtonIcon` `aria-label` is a **required** prop change — this is a breaking
   change but affects only 5 callsites that currently have an accessibility bug;
   fix all 5 in the same PR

---

## Implementation Order (Phases)

```
Phase 1: Extend Button.tsx + button.ts types (1 PR)
  ├── Add ghost, pill variants
  ├── Add xs size
  ├── Add fullWidth prop
  └── Add leftIcon / rightIcon props

Phase 2: Fix ButtonIcon + ButtonClose accessibility (1 PR)
  ├── ButtonIcon: require aria-label, add loading + size
  └── ButtonClose: add aria-label default

Phase 3a: Migrate P1 (duplicated styles) + P2 (ghost inline) (1 PR)
Phase 3b: Migrate P3 (xs labeled) + P4 (icon toolbar) (1 PR)
Phase 3c: Migrate P5 (pills) + P6 (dropdown items) (1 PR)
```

---

## Risks & Mitigations

| Risk                                                                    | Likelihood | Mitigation                                                                               |
| ----------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| Visual regression from `w-full → w-auto` swap                           | Medium     | Only change when caller already has `className='w-auto'`; screenshot each                |
| `ButtonIcon` `aria-label` required breaks build                         | Low        | Only 5 callsites; fix all in same PR as ButtonIcon change                                |
| Ghost variant looking different from raw `<button>` inline styles       | Medium     | Match colors precisely using CSS vars (`text-muted-foreground`, `hover:text-foreground`) |
| Pill variant conflicting with Button's `rounded-[var(--radius-button)]` | Low        | Pill variant overrides radius with `rounded-full` in variant class (higher specificity)  |
| Tab strip `<button>` migration discovered to need PageTabsNav refactor  | High       | Explicitly out of scope; tracked separately                                              |

---

## References

### Internal

- `shared/ui/button/Button.tsx` — current implementation
- `shared/ui/button/button-icon.tsx` — icon button
- `shared/ui/button/button-close.tsx` — close button
- `shared/types/button.ts` — variant/size constants
- `features/issues/ui/issue-create-button.tsx:13` — P1 migration target
- `features/teams/ui/teams-header.tsx:46` — P1 migration target
- `features/meetings/ui/bot-toggle-button.tsx:40` — P5 pill migration target
- `features/today-briefing/ui/focus-block.tsx` — P2 ghost + P3 xs targets
- `entities/artifact/ui/artifact-panel.tsx:121` — P4 icon toolbar target

### Design System

- Cosmic dark theme uses CSS vars: `--radius-button`, `bg-accent`,
  `text-muted-foreground`, `text-foreground`
- Primary: violet gradient `from-violet-500 to-violet-700`
- Ghost: no background, `text-foreground`, `hover:bg-accent`
- Pill: `rounded-full`, `border-border`, `text-muted-foreground`,
  `hover:border-primary/40`
