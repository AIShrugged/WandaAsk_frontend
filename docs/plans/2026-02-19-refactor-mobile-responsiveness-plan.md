---
title: 'refactor: Make interface fully responsive for 320px–1440px'
type: refactor
status: completed
date: 2026-02-19
---

# refactor: Make interface fully responsive for 320px–1440px

## Overview

The WandaAsk frontend is currently desktop-only. Fixed pixel widths on auth
cards, the dashboard sidebar, and a significant number of UI components make the
app unusable on screens narrower than ~800px. This plan covers a systematic,
mobile-first refactoring across the entire component surface — from layout
architecture down to individual input zones — to support screens from 320px to
1440px.

---

## Problem Statement

Codebase research identified the following critical blockers for mobile use:

### 1. Dashboard layout — sidebar always visible, no mobile toggle

`app/dashboard/layout.tsx` — `flex flex-row` with a permanent `w-[238px]`
sidebar (`aside`). On a 375px screen only 137px of main content is usable. No
hamburger button, no drawer, no collapse.

### 2. Auth card containers — hard pixel width breaks on narrow screens

All auth pages use `w-[690px] py-[100px] px-[72px]`:

- `app/auth/login/page.tsx:9`
- `app/auth/register/page.tsx:11`
- `app/auth/organization/page.tsx:15, 25`
- `app/auth/organization/create/page.tsx:9`

### 3. Typography — fixed px sizes unscaled on mobile

- `shared/ui/typography/H1.tsx:11` — `text-[64px]` (huge on phone)
- `shared/ui/typography/H2.tsx:15` — `text-[36px]`
- `shared/ui/typography/H3.tsx:9` — `text-[20px]`
- `shared/ui/typography/H4.tsx:12` — `text-[28px]`
- `features/auth/ui/auth-title.tsx:15` — H1 + `mb-[70px]` margin

### 4. Modal-root — 700px wide, no full-width fallback

`shared/ui/modal/modal-root.tsx:45` — `w-[700px] min-w-[320px]` with no
`max-w-full` or horizontal padding guard.

### 5. Analysis grids — inline `style` bypasses responsive system

`features/analysis/widgets/linear.tsx:18–22` —
`gridTemplateColumns: repeat(N, ...)` via inline `style` prop. Up to 4 columns
on any screen width.

`features/analysis/widgets/summary.tsx:23` — `grid grid-cols-2 gap-4`, never
collapses.

### 6. Calendar — 7-column grid always

`features/calendar/ui/cells.tsx:79` and `features/calendar/ui/day-of-week.tsx:5`
— `grid grid-cols-7` at every breakpoint; unreadable on narrow phones.

### 7. Fixed-width button wrappers

Multiple forms constrain submit buttons to `w-[170px]` / `w-[240px]` /
`w-[250px]`, making them small touch targets:

- `features/organization/ui/organization-form.tsx:84`
- `features/methodology/ui/methodology-form.tsx:114`
- `features/methodology/ui/methodology-create.tsx:14`
- `features/teams/ui/team-create.tsx:11`
- `features/teams/ui/team-create-form.tsx:88`
- `features/event/ui/event-popup.tsx:60`

### 8. Organization dropdown — 260px fixed in header

`features/organization/ui/organization-dropdown.tsx:42` — `w-[260px]` in the
page header alongside the user info block.

### 9. Card padding — over-generous on mobile

`shared/ui/card/CardBody.tsx:4` — `px-8 py-6` consumes most of a phone screen
width.

### 10. Foundation issues

- **Tailwind v4 + v3 config coexistence**: `tailwind.config.js` scans only
  `pages/`, `components/`, `app/`, `widgets/` — missing `features/` and
  `shared/`. If the v3 config is active in production, classes in those
  directories get purged.
- **Font variable not wired up**: `app/layout.tsx` defines `--font-inter-sans`
  via `next/font/google`, but `globals.css:75` hardcodes `font-family: Inter`
  instead of `font-family: var(--font-inter-sans)`.
- **`height: 100%` on html/body**: `globals.css:78–80` — causes iOS Safari
  visible-area issues. Should migrate key containers to `min-h-dvh`.
- **No custom breakpoints for 320/375/425px**: Tailwind v4 defaults start at
  `sm: 640px`. The target breakpoints require `xs` and possibly `xxs`
  definitions.

---

## Proposed Solution

A phased mobile-first refactoring with **six phases**:

1. **Foundation** — Tailwind config, custom breakpoints, font wiring, globals
2. **Auth pages** — responsive cards and layouts
3. **Dashboard layout** — collapsible sidebar drawer for mobile
4. **Shared UI components** — Typography, Modal, Card, Button
5. **Feature components** — Analysis, Calendar, Organization, forms
6. **Accessibility & performance** — touch targets, lazy images, critical CSS

All changes follow **mobile-first CSS**: base styles target 320px, then scale up
with `sm:`, `md:`, `lg:`, `xl:` modifiers.

---

## Technical Approach

### Breakpoints to define (Tailwind v4 CSS-first in `globals.css`)

```css
/* app/globals.css — add inside @theme inline block */
@theme inline {
  --breakpoint-xs: 375px; /* iPhone SE / standard phone */
  --breakpoint-sm: 425px; /* large phone */
  --breakpoint-md: 768px; /* tablet */
  --breakpoint-lg: 1024px; /* laptop */
  --breakpoint-xl: 1280px; /* desktop */
  --breakpoint-2xl: 1440px; /* wide desktop */
}
```

> Note: Tailwind v4 uses CSS-based config only. No `tailwind.config.ts`. Custom
> breakpoints go in `globals.css` under `@theme inline`.

---

### Implementation Phases

#### Phase 1: Foundation — `app/globals.css`, `tailwind.config.js`, `app/layout.tsx`

**Tasks:**

- [x] Add `@theme inline` block with custom breakpoints (`xs: 375px`,
      `sm: 425px`, etc.) in `globals.css`
- [x] Fix font variable: change `globals.css:75` to
      `font-family: var(--font-inter-sans), system-ui, sans-serif`
- [x] Replace `html, body { height: 100% }` with `min-height: 100dvh` on key
      layout containers
- [x] Verify / remove or update `tailwind.config.js` — ensure it doesn't
      conflict with v4 PostCSS setup; add `features/**`, `shared/**` to content
      paths if needed
- [x] Add `<meta name="viewport" content="width=device-width, initial-scale=1">`
      to `app/layout.tsx` if missing (Next.js App Router adds it automatically)

**Files:**

- `app/globals.css`
- `app/layout.tsx`
- `tailwind.config.js`

---

#### Phase 2: Auth Pages

**Tasks:**

- [x] **Auth layout** (`app/auth/layout.tsx`): Add `px-4` padding guard, keep
      `justify-center` centering
- [x] **Auth cards** (all 4 auth pages): Replace
      `w-[690px] py-[100px] px-[72px]` with
      `w-full max-w-[690px] py-8 px-4 md:py-[100px] md:px-[72px]`
- [x] **Auth title** (`features/auth/ui/auth-title.tsx`): Reduce `mb-[70px]` to
      `mb-8 md:mb-[70px]`
- [ ] Verify form inputs are `w-full` (they appear to be already)
- [ ] Ensure error messages display inline, not in modal overlays

**Files:**

- `app/auth/layout.tsx`
- `app/auth/login/page.tsx`
- `app/auth/register/page.tsx`
- `app/auth/organization/page.tsx`
- `app/auth/organization/create/page.tsx`
- `features/auth/ui/auth-title.tsx`

---

#### Phase 3: Dashboard Layout — Sidebar Drawer

This is the most architecturally significant change.

**Strategy:**

- Below `md` (768px): sidebar is hidden by default, shown as a full-height
  overlay drawer triggered by a hamburger button in the page header
- Above `md`: sidebar is always visible in the current `flex-row` layout
- Use a Zustand store (or simple `useState` in the layout) to track
  `sidebarOpen` state on mobile
- The drawer should close on nav link click and on outside tap

**Tasks:**

- [x] **Dashboard layout** (`app/dashboard/layout.tsx`):
  - Wrap sidebar in `hidden md:flex` (hidden by default, shown on desktop)
  - Add mobile overlay sidebar: `fixed inset-0 z-40 flex` when `sidebarOpen` +
    backdrop `div`
  - `main` becomes `w-full` on mobile (sidebar takes no space)
- [x] **Hamburger button**: Add to page header (visible on `< md`), toggles
      sidebar drawer
- [x] **Page header** (`widgets/layout/ui/page-header`): Add hamburger icon on
      left for mobile; ensure `UserInfo` and `OrganizationDropdown` are
      accessible on small screens
- [x] **Organization dropdown**
      (`features/organization/ui/organization-dropdown.tsx`): Change `w-[260px]`
      → `w-full max-w-[260px]` with text truncation
- [x] **Sidebar nav links**: Ensure each link is `min-h-[44px]` touch target

**New component:** `shared/ui/layout/sidebar-drawer.tsx` or similar (or inline
in layout)

**Files:**

- `app/dashboard/layout.tsx`
- `widgets/layout/ui/page-header/`
- `features/organization/ui/organization-dropdown.tsx`
- `shared/ui/layout/` (possibly new sidebar-drawer component)

---

#### Phase 4: Shared UI Components

##### Typography

Convert from fixed px to responsive fluid scale:

| Component | Current       | Mobile-first                          |
| --------- | ------------- | ------------------------------------- |
| H1        | `text-[64px]` | `text-3xl md:text-5xl lg:text-[64px]` |
| H2        | `text-[36px]` | `text-2xl md:text-3xl lg:text-[36px]` |
| H3        | `text-[20px]` | `text-base md:text-lg lg:text-[20px]` |
| H4        | `text-[28px]` | `text-xl md:text-2xl lg:text-[28px]`  |

**Files:**

- `shared/ui/typography/H1.tsx`
- `shared/ui/typography/H2.tsx`
- `shared/ui/typography/H3.tsx`
- `shared/ui/typography/H4.tsx`

##### Modal

- [x] `shared/ui/modal/modal-root.tsx:45`: `w-[700px]` → `w-full max-w-[700px]`
- [x] Wrap modal content in `mx-4` horizontal padding on mobile
- [x] `shared/ui/modal/modal.tsx`: Verify `max-h-[90vh]` and that content
      scrolls correctly on mobile

##### Card

- [x] `shared/ui/card/CardBody.tsx:4`: `px-8 py-6` → `px-4 py-4 md:px-8 md:py-6`
- [x] `shared/ui/card/Card.tsx:12`: `rounded-[40px]` →
      `rounded-2xl md:rounded-[40px]` (softens on small screens)

##### Button

- The `Button.tsx` `h-[56px] w-full` is already good. No changes needed.

**Files:**

- `shared/ui/modal/modal-root.tsx`
- `shared/ui/modal/modal.tsx`
- `shared/ui/card/Card.tsx`
- `shared/ui/card/CardBody.tsx`

---

#### Phase 5: Feature Components

##### Form button wrappers — all occurrences

Replace fixed `w-[170px]` / `w-[240px]` / `w-[250px]` → `w-full md:w-[170px]`
(or appropriate fixed width).

**Files:**

- `features/organization/ui/organization-form.tsx:84`
- `features/methodology/ui/methodology-form.tsx:114`
- `features/methodology/ui/methodology-create.tsx:14`
- `features/teams/ui/team-create.tsx:11`
- `features/teams/ui/team-create-form.tsx:88`
- `features/event/ui/event-popup.tsx:60`

##### Analysis widgets

- [x] `features/analysis/widgets/linear.tsx`: Replace inline
      `style={{ gridTemplateColumns }}` with
      `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- [x] `features/analysis/widgets/summary.tsx:23`: `grid-cols-2` →
      `grid-cols-1 xs:grid-cols-2`
- [ ] `features/analysis/ui/chart-donut.tsx`: Accept `size` as responsive — on
      mobile use `size={160}` (or render via container aspect-ratio)

**Files:**

- `features/analysis/widgets/linear.tsx`
- `features/analysis/widgets/summary.tsx`
- `features/analysis/ui/chart-donut.tsx`

##### Calendar — mobile-friendly layout

A 7-column grid at 320px is unusable. Two options:

- **Option A (recommended)**: On `< md`, switch to a stacked weekly list view
  (agenda). Above `md`, keep the full monthly grid.
- **Option B**: Shrink cell sizes, keep grid, add horizontal scroll as fallback.

- [x] `features/calendar/ui/cells.tsx:79`: Wrap 7-col grid in `hidden md:grid`
      and add a mobile `<CalendarAgenda>` sibling visible on `< md`
- [x] `features/calendar/ui/day-of-week.tsx:5`: Same responsive pattern

**New component:** `features/calendar/ui/calendar-agenda.tsx` (mobile agenda
view)

**Files:**

- `features/calendar/ui/cells.tsx`
- `features/calendar/ui/day-of-week.tsx`
- `features/calendar/ui/` (new: calendar-agenda.tsx)

##### User info in header

`features/user/ui/user-info.tsx:34` — `flex gap-2 items-center justify-end`. On
very narrow screens, hide the name/email text, show only avatar:

- [x] Wrap name+email block in `hidden xs:flex` (visible ≥375px)

**Files:**

- `features/user/ui/user-info.tsx`

##### Follow-up list items

`features/follow-up/ui/follow-up-item.tsx:15` — Verify
`flex items-center justify-between` wraps correctly on narrow screens.
ChevronRight icon at 36px is fine.

---

#### Phase 6: Accessibility & Performance

##### Touch targets (WCAG 2.5.5 — min 44×44px)

- [x] Audit all interactive elements (`button`, `a`, `[role=button]`): ensure
      `min-h-[44px] min-w-[44px]`
- [x] Sidebar nav links, header buttons, calendar cells — add `min-h-[44px]`
- [x] Pop-up trigger buttons (`UserInfo`, `OrganizationDropdown`): UserInfo
      button gets `min-w-[44px] min-h-[44px]`

##### Images — lazy loading

- [x] `features/calendar/lib/options.ts:3–8` (`onboardingImageOptions`): 50×50
      icon only — fixed size is correct, no responsive sizing needed
- [x] `app/error.tsx:25–30`: Fixed 320×320 image — add
      `sizes="(max-width: 640px) 240px, 320px"` to enable responsive source
      selection

##### Validation & error states

- [x] Confirm all form error messages use inline display (below field), not
      toast popups or modals (verified: Login/Register use inline Error
      component)
- [x] On mobile, ensure validation messages don't overflow form containers
      (Input component uses w-full containers)

##### Critical CSS / performance

- [x] Next.js handles critical CSS automatically via App Router. No manual
      inlining required.
- [x] Verify no large blocking stylesheets are imported outside `globals.css`

---

## Alternative Approaches Considered

| Approach                                                           | Why Rejected                                                                                         |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| CSS viewport units (`vw`) for font sizing                          | `clamp()` or breakpoint-based scaling is more predictable and aligns with existing Tailwind patterns |
| React-based viewport detection (e.g., `useMediaQuery`) for sidebar | Creates SSR hydration mismatch. CSS-only `hidden md:flex` is safer given SSR-first architecture      |
| Separate mobile routes/pages                                       | Too invasive; unnecessary given CSS-based responsive design is achievable                            |
| Radix UI / Headless UI drawer component                            | Adds a new dependency. A lightweight `position: fixed` drawer with Tailwind classes is sufficient    |

---

## Acceptance Criteria

### Functional Requirements

- [ ] App is usable and visually correct at 320px, 375px, 425px, 768px, 1024px,
      1440px viewport widths
- [ ] No horizontal scrollbar appears at any breakpoint (except intentional
      scroll containers)
- [ ] Dashboard sidebar collapses to a drawer at `< 768px`, triggered by a
      visible hamburger button
- [ ] Auth pages display full-width card on mobile with appropriate padding
- [ ] All heading text scales down gracefully on small screens (no overflow or
      clip)
- [ ] Modal dialogs are full-width with horizontal padding on screens `< 700px`
- [ ] Analysis grids collapse to 1 column on mobile, expand at `md`/`lg`
- [ ] Calendar has a usable alternative view on `< 768px`
- [ ] All button/link touch targets are minimum 44×44px
- [ ] Form submit buttons are full-width on mobile

### Non-Functional Requirements

- [ ] No JavaScript-based viewport detection for layout toggling (CSS-only where
      possible)
- [ ] No new `any` TypeScript types introduced
- [ ] SSR pages remain Server Components; mobile sidebar toggle is a Client
      Component only where needed
- [ ] All responsive classes use mobile-first Tailwind modifiers (`md:`, `lg:`,
      not inverted `max-md:`)
- [ ] Tailwind v4 CSS config is the authoritative config; v3
      `tailwind.config.js` either removed or updated

### Quality Gates

- [x] `npm run lint` passes with zero errors (1 pre-existing warning in
      linear.tsx)
- [x] `npm run build` completes successfully (all 24 routes)
- [ ] Manual visual test on Chrome DevTools device presets: iPhone SE (375px),
      iPad (768px), Laptop (1024px), Desktop (1440px)

---

## Success Metrics

- Zero horizontal overflow at 375px on all app pages (measurable in DevTools)
- Dashboard layout switch (drawer ↔ sidebar) works without JavaScript errors
- All form inputs reachable without zoom on iOS Safari

---

## Dependencies & Prerequisites

- Tailwind CSS v4 is already installed and configured via PostCSS
  (`postcss.config.mjs`)
- No new packages required
- Should be done on a feature branch to allow incremental PR review by
  page/layer

---

## Risk Analysis & Mitigation

| Risk                                                                 | Probability | Mitigation                                                                                        |
| -------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `tailwind.config.js` v3 content paths cause production class purging | Medium      | Verify with `npm run build`; update or remove the file                                            |
| iOS Safari `height: 100%` causes blank space under address bar       | High        | Migrate to `min-h-dvh` on layout containers                                                       |
| Sidebar drawer creates SSR hydration mismatch                        | Low         | Initialize drawer state to `false` (closed) server-side; use `'use client'` on drawer toggle only |
| Calendar agenda view scope creep                                     | Medium      | Phase 5 only replaces the grid on mobile; full agenda feature deferred                            |
| GlobalPopup anchor positioning breaks on mobile                      | Low         | Popup Provider already has viewport clamping (`PopupProvider.tsx:57–71`); verify on mobile        |

---

## References & Research

### Internal References — Key Files

| File                                         | Issue                                        |
| -------------------------------------------- | -------------------------------------------- |
| `app/dashboard/layout.tsx`                   | Permanent sidebar — needs drawer on mobile   |
| `app/auth/login/page.tsx:9`                  | `w-[690px]` fixed card                       |
| `app/auth/register/page.tsx:11`              | Same                                         |
| `app/auth/organization/page.tsx:15`          | Same                                         |
| `app/auth/organization/create/page.tsx:9`    | Same                                         |
| `shared/ui/typography/H1.tsx:11`             | `text-[64px]`                                |
| `shared/ui/modal/modal-root.tsx:45`          | `w-[700px]`                                  |
| `features/analysis/widgets/linear.tsx:18–22` | Inline style grid                            |
| `features/calendar/ui/cells.tsx:79`          | `grid-cols-7` always                         |
| `app/globals.css:75`                         | Font variable not wired                      |
| `app/globals.css:78–80`                      | `height: 100%` on html/body                  |
| `tailwind.config.js:3–8`                     | Missing `features/`, `shared/` content paths |

### Conventions Confirmed

- Tailwind v4: CSS-first config via `@theme inline` in `globals.css` — all
  breakpoints go here
- Mobile-first: base CSS targets 320px, breakpoint prefixes extend upward
  (`md:`, `lg:`)
- SSR-first: layout hiding via CSS classes (`hidden md:flex`), not JS
  `window.innerWidth`
- `'use client'` only for drawer toggle interactivity
- No new packages required
