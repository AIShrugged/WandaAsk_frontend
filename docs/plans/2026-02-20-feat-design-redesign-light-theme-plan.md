---
title: "feat: Full Design Redesign — Professional Light Theme (shadcn/Vercel/Linear Style)"
type: feat
status: active
date: 2026-02-20
---

# Full Design Redesign — Professional Light Theme

## Overview

Replace the current monochromatic green-washed design with a clean, professional dashboard aesthetic inspired by Vercel, Linear, and shadcn/ui. The new design uses neutral (zinc/gray) backgrounds with the existing green as a focused brand accent — not a background wash. Light theme is implemented first; dark theme is a follow-up built on the same token layer.

The redesign is a **token-first, systematic replacement**. Every component is updated in one pass to avoid a mixed state. The English-only requirement is enforced throughout.

---

## Problem Statement

The current UI has two categories of issues:

### 1. Broken/Invalid Code (must fix regardless of redesign)

| Issue | File | Impact |
|---|---|---|
| `box-shadow-primary` should be `shadow-primary` | `shared/ui/card/Card.tsx` | All cards render with no shadow |
| `gap-[3]` invalid Tailwind (missing unit) | `shared/ui/layout/component-header.tsx` | Page headers have zero gap |
| `text=accent` typo (= instead of -) | `shared/ui/input/InputDropdown.tsx` | Checkmark icon color broken |
| `revalidatePath('/methodology')` wrong path | `features/methodology/api/methodology.ts` | List stale after creation |

### 2. Design Inconsistencies (visual quality)

- H3 renders green (`text-accent`), H1/H2/H4 render dark — broken visual hierarchy
- Input uses `rounded-full`, Textarea uses `rounded-2xl` — mismatched shape language
- Dropdown list uses Tailwind's default `bg-blue-50`/`bg-blue-100` — outside design system
- Modal uses `border-neutral-200`, `hover:bg-neutral-100` — outside design system
- Sidebar has zero visual separation from the main content area
- Dashboard outer background is a green gradient — cheap-looking, not professional
- Logo is a placeholder text string `"logo"`
- Button danger variant has no hover/active states
- Two different Framer Motion import paths (`motion/react-client` vs `framer-motion`)
- H1/H2/H4 hardcode hex `text-[#344137]` instead of using CSS variable
- No dark mode tokens defined anywhere

---

## Proposed Solution

### Philosophy

1. **Neutral canvas, green accent** — White/near-white backgrounds. Green (`#4FB268`) appears only on interactive elements: primary buttons, focus rings, active nav items, selected states. No more green-washed page backgrounds.
2. **shadcn/ui token architecture** — HSL CSS variables mapped into Tailwind v4 `@theme inline`. This enables dark mode with a single `.dark` class addition, and makes all colors composable as Tailwind utilities (`bg-primary`, `text-muted-foreground`, etc.).
3. **Shape language: `rounded-lg` (8px) as the default** — Cards, modals, dropdowns, inputs all use `rounded-lg`. Buttons use `rounded-md` (6px). Only avatars, toggles, and tag pills use `rounded-full`.
4. **No decorative box shadows** — Cards and surfaces use `border` only (Vercel pattern). Shadows reserved for floating UI (tooltips, command palettes, dropdowns).
5. **Dense, readable typography** — 14px body text, 13px table cells, Inter font. Consistent font-weight: bold only for page titles and critical actions.
6. **English only** — All UI text migrated from Russian to English.

---

## Technical Approach

### Phase 1 — Design Token System (globals.css)

Migrate `app/globals.css` from the current custom property pattern to the shadcn/ui HSL architecture with Tailwind v4 `@theme inline`.

**⚠️ Deletion required:** The current `@layer utilities` block (lines 45-91) that manually defines `.bg-primary`, `.text-accent`, `.border-primary`, etc. **must be deleted** in this phase. If it survives, it will fight the Tailwind-generated utilities and produce undefined cascade behavior. See `todos/003-pending-p2-globals-css-deletion-and-chat-html-content.md`.

**⚠️ Atomicity required:** Phase 1 changes the semantic meaning of all tokens. Merging Phase 1 alone (without Phase 3 component fixes) will break the app. See `todos/001-pending-p1-phase1-atomicity-breaks-app.md` for the recommended approach.

**New globals.css structure:**

```css
/* app/globals.css */
@import "tailwindcss";

@theme inline {
  /* Color utilities from HSL CSS vars */
  --color-background:             hsl(var(--background));
  --color-foreground:             hsl(var(--foreground));
  --color-card:                   hsl(var(--card));
  --color-card-foreground:        hsl(var(--card-foreground));
  --color-popover:                hsl(var(--popover));
  --color-popover-foreground:     hsl(var(--popover-foreground));
  --color-primary:                hsl(var(--primary));
  --color-primary-foreground:     hsl(var(--primary-foreground));
  --color-secondary:              hsl(var(--secondary));
  --color-secondary-foreground:   hsl(var(--secondary-foreground));
  --color-muted:                  hsl(var(--muted));
  --color-muted-foreground:       hsl(var(--muted-foreground));
  --color-accent:                 hsl(var(--accent));
  --color-accent-foreground:      hsl(var(--accent-foreground));
  --color-destructive:            hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border:                 hsl(var(--border));
  --color-input:                  hsl(var(--input));
  --color-ring:                   hsl(var(--ring));
  --color-sidebar:                hsl(var(--sidebar));
  --color-sidebar-foreground:     hsl(var(--sidebar-foreground));
  --color-sidebar-border:         hsl(var(--sidebar-border));
  --color-sidebar-accent:         hsl(var(--sidebar-accent));
  --color-sidebar-accent-foreground: hsl(var(--sidebar-accent-foreground));

  /* Shadow — registered here for variant support (hover:shadow-card, dark:shadow-card) */
  --shadow-card: 0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06);

  /* Radius — use non-colliding names to avoid overriding Tailwind's built-in rounded-sm/md */
  --radius-button: 0.375rem;   /* 6px  — buttons, inputs  */
  --radius-card:   0.5rem;     /* 8px  — cards, modals    */
  --radius-panel:  0.75rem;    /* 12px — large panels      */

  /* Layout constants */
  --sidebar-width:            16rem;    /* 256px */
  --sidebar-width-collapsed:  3rem;     /* 48px  */
  --topbar-height:            3.5rem;   /* 56px  */

  /* Custom breakpoints (preserved) */
  --breakpoint-xs:    375px;
  --breakpoint-phone: 425px;
  --breakpoint-md:    768px;
  --breakpoint-lg:    1024px;
  --breakpoint-xl:    1280px;
}

@layer base {
  :root {
    /* --- Backgrounds --- */
    --background:   0 0% 100%;          /* #ffffff — page canvas */
    --foreground:   240 10% 3.9%;       /* #0a0a0f — primary text */

    /* --- Card / Popover --- */
    --card:         0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover:      0 0% 100%;
    --popover-foreground: 240 10% 3.9%;

    /* --- Brand green as primary action color --- */
    --primary:      142 47% 45%;        /* #4FB268 — brand green */
    --primary-foreground: 0 0% 100%;   /* white text on green */

    /* --- Neutral secondary --- */
    --secondary:    240 4.8% 95.9%;    /* #f2f2f4 — chips, subtle bg */
    --secondary-foreground: 240 5.9% 10%;

    /* --- Muted surfaces --- */
    --muted:        240 4.8% 95.9%;    /* same as secondary */
    --muted-foreground: 240 3.8% 46.1%; /* #6e6e77 — secondary text */

    /* --- Accent (hover highlight, selected state) --- */
    --accent:       142 47% 96%;       /* very light green tint */
    --accent-foreground: 142 47% 30%;  /* dark green text on accent bg */

    /* --- Destructive (errors, delete) --- */
    --destructive:  0 84.2% 60.2%;    /* #f87171 — red */
    --destructive-foreground: 0 0% 98%;

    /* --- Borders & inputs --- */
    --border:       240 5.9% 90%;      /* #e4e4e7 — default border */
    --input:        240 5.9% 90%;      /* same for input borders */
    --ring:         142 47% 45%;       /* #4FB268 — green focus ring */

    /* --- Sidebar --- */
    --sidebar:             240 4.8% 97%;   /* #f5f5f7 — slightly off-white */
    --sidebar-foreground:  240 10% 3.9%;
    --sidebar-border:      240 5.9% 90%;
    --sidebar-accent:      142 47% 96%;    /* light green for active items */
    --sidebar-accent-foreground: 142 47% 30%;

    /* --- Radius base --- */
    --radius: 0.5rem;  /* 8px — base value, see @theme for named scale */
  }

  /* Dark theme tokens — to be added in the dark theme PR (Phase 6).
     Derive from :root values above using the shadcn/ui dark palette pattern.
     Do NOT add .dark block here prematurely — values may shift during light theme implementation. */

  * {
    border-color: hsl(var(--border));
  }

  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
    font-family: var(--font-inter-sans), system-ui, sans-serif;
    font-size: 0.875rem;   /* 14px default body */
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

@layer utilities {
  /* Layout helpers using the CSS variables defined above */
  .sidebar-width  { width: var(--sidebar-width); }
  .topbar-height  { height: var(--topbar-height); }
}
```

**Phase 1 checklist (before merging):**
- [ ] Delete the old `@layer utilities` color block (lines 45-91 in current globals.css)
- [ ] Delete the old `:root` color block (lines 15-42 in current globals.css)
- [ ] Update `chat-html-content` CSS block to use new `hsl(var(--*))` variable names
- [ ] Verify no `var(--bg-*)`, `var(--text-*)`, `var(--border-*)` old variable references remain

> **Migration note:** Every existing component that uses the old color utilities (`bg-primary`, `text-accent`, `border-primary`, `bg-selected`, `bg-hover`, etc.) will need to be mapped to the new token names. A global search-and-replace map is provided in Phase 3. Run the audit grep from `todos/002-pending-p1-token-semantic-change-audit.md` before starting.

---

### Phase 2 — Dashboard Layout + Logo Component

**Files:** `app/dashboard/layout.tsx`, `shared/ui/brand/WandaLogo.tsx`

**Current issues:**
- Outer background is `bg-gradient-primary` (green gradient) — change to `bg-background`
- Sidebar is `238px` wide, sits directly on gradient with no own background
- No visible border separating sidebar from main content
- Logo is a text string `"logo"` — replaced with `<WandaLogo />` in this phase (not Phase 6, since the sidebar is already being rewritten here)

**Create `shared/ui/brand/WandaLogo.tsx` in this phase:**

```tsx
import clsx from 'clsx';  // clsx is installed; no separate cn util needed

export function WandaLogo({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      {/* Green "W" placeholder — swap for real SVG when asset is available */}
      <div className="w-7 h-7 rounded-[var(--radius-button)] bg-primary flex items-center justify-center">
        <span className="text-primary-foreground text-xs font-bold">W</span>
      </div>
      <span className="font-semibold text-sm text-foreground">WandaAsk</span>
    </div>
  );
}
```

Also create `shared/ui/brand/index.ts` exporting `WandaLogo`.

**New layout structure:**

```
┌─────────────────────────────────────────────────────────────┐
│  bg-background (white/near-white)                           │
│ ┌───────────────┬─────────────────────────────────────────┐ │
│ │ Sidebar       │ Main area                               │ │
│ │ 256px         │                                         │ │
│ │ bg-sidebar    │ ┌──────────────────────────────────┐    │ │
│ │ border-r      │ │ Top bar (56px, border-b)         │    │ │
│ │               │ └──────────────────────────────────┘    │ │
│ │ [Logo]        │ ┌──────────────────────────────────┐    │ │
│ │               │ │ Content (scroll)    px-6 py-6    │    │ │
│ │ [Nav items]   │ │                                  │    │ │
│ │               │ └──────────────────────────────────┘    │ │
│ └───────────────┴─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

```tsx
// app/dashboard/layout.tsx — new structure
<div className="flex h-screen bg-background overflow-hidden">
  {/* Desktop sidebar — use the .sidebar-width utility defined in @layer utilities */}
  <aside className="hidden lg:flex flex-col sidebar-width flex-shrink-0 bg-sidebar border-r border-sidebar-border">
    {/* Logo slot */}
    <div className="flex items-center h-[var(--topbar-height)] px-6 border-b border-sidebar-border">
      <WandaLogo />
    </div>
    {/* Navigation */}
    <MenuSidebar />
  </aside>

  {/* Main */}
  <div className="flex flex-col flex-1 min-w-0">
    {/* Top bar */}
    <header className="flex items-center justify-between h-[var(--topbar-height)] px-6 border-b border-border bg-background flex-shrink-0">
      <MobileSidebarTrigger className="lg:hidden" />
      <OrganizationSelector />
      <UserInfo />
    </header>

    {/* Scrollable content */}
    <main className="flex-1 overflow-y-auto p-6">
      {children}
    </main>
  </div>

  {/* Mobile sidebar drawer */}
  <MobileSidebar />
</div>
```

---

### Phase 3 — Component Updates

#### 3.1 Color Token Migration Map

| Old class | New class | Note |
|---|---|---|
| `bg-primary` | `bg-primary` | Same name, new HSL value |
| `text-accent` | `text-primary` | Green is now `primary` |
| `border-primary` | `border` | Use default border |
| `border-secondary` | `border` | Use default border |
| `bg-secondary` | `bg-muted` | Subtle surface |
| `bg-layout` | `bg-background` | Remove gradient |
| `bg-gradient-primary` | `bg-background` | Remove gradient |
| `text-primary` (text color) | `text-foreground` | Primary text |
| `text-secondary` (text) | `text-muted-foreground` | Secondary text |
| `text-tertiary` | `text-muted-foreground/60` | De-emphasized text |
| `bg-hover` | `hover:bg-accent` | Hover state |
| `bg-hover-light` | `hover:bg-accent/50` | Subtle hover |
| `bg-selected` | `bg-accent` | Selected/active state |
| `bg-error` | `bg-destructive` | Error background |
| `text-error` | `text-destructive` | Error text |
| `shadow-primary` | `shadow-card` | Fixed name |
| `border-table` | `border` | Simplify |

#### 3.2 Shared UI Components — Changes Required

**`shared/ui/card/Card.tsx`**
- Fix `box-shadow-primary` → `shadow-card`
- Change `bg-white` → `bg-card`
- Change `border-primary` → `border`
- `rounded-2xl` on mobile, `md:rounded-[40px]` → standardize to `rounded-md` (8px = `rounded-lg`)
- Add `border border-border` (Vercel style — border replaces shadow)

**`shared/ui/card/CardBody.tsx`**
- Update padding from `md:px-8 md:py-6` → `p-6` (standard 24px internal padding)

**`shared/ui/layout/component-header.tsx`**
- Fix `gap-[3]` → `gap-3`
- Add `border-b border-border` for section separation

**`shared/ui/button/Button.tsx`**
- Change `rounded-full` → `rounded-[var(--radius-button)]` (6px — avoids overriding Tailwind's `rounded-md` default)
- Change `h-[56px]` → `h-10` (40px, standard SaaS height)
- Primary: `bg-primary text-primary-foreground hover:bg-primary/90`
- Secondary: `border border-input bg-background hover:bg-accent hover:text-accent-foreground`
- Danger: `bg-destructive text-destructive-foreground hover:bg-destructive/90` (add hover state)
- Remove all hardcoded hex values (`bg-[#4FB268]`, `hover:bg-[#45a05a]`, etc.)

**`shared/ui/input/Input.tsx`**
- Change `rounded-full` → `rounded-[var(--radius-button)]`
- Change `h-[54px]` → `h-10` (40px)
- Focus ring: `focus-visible:ring-2 focus-visible:ring-ring`
- Border: `border border-input` (two classes — color + width, since `border-input` only sets color)

**`shared/ui/input/textarea.tsx`**
- Align with Input: `rounded-[var(--radius-button)]`, same border/focus tokens

**`shared/ui/input/InputDropdown.tsx`**
- Fix `text=accent` typo → `text-primary`
- Replace `bg-blue-50` → `bg-accent`
- Replace `bg-blue-100` → `bg-accent`
- Dropdown panel: `rounded-[var(--radius-card)] border border-border shadow-card`

**`shared/ui/modal/modal.tsx`**
- Replace `border-neutral-200` → `border-border`
- Replace `hover:bg-neutral-100` → `hover:bg-accent`
- Panel: `rounded-lg` (consistent with card)

**`shared/ui/typography/H1.tsx` — `H4.tsx`**
- Replace hardcoded `text-[#344137]` → `text-foreground`
- H3: change `text-accent` → `text-foreground` (headings should be dark, not green)
- H3: change `font-bold` → `font-semibold`
- All: use semantic font-weight (`font-bold` for H1, `font-semibold` for H2/H3, `font-medium` for H4)
- New typography scale:
  - H1: `text-3xl font-bold tracking-tight`
  - H2: `text-2xl font-semibold tracking-tight`
  - H3: `text-xl font-semibold`
  - H4: `text-lg font-medium`

**`shared/ui/animation/Border.tsx` and `Opacity.tsx`**
- Standardize import to `motion/react-client` (matching `Hover.tsx`)

**`shared/ui/layout/global-popup.tsx`**
- Change `rounded-full` outer wrapper → `rounded-lg`

#### 3.3 Navigation Sidebar — `features/navigation/ui/MenuSidebar`

New nav item styling:
```tsx
// Active nav item
className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
           bg-sidebar-accent text-sidebar-accent-foreground"

// Inactive nav item
className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
           text-sidebar-foreground hover:bg-sidebar-accent/50
           hover:text-sidebar-accent-foreground transition-colors"
```

Icon size: `w-4 h-4` (16px, standard for compact nav).

#### 3.4 Auth Pages

**`app/auth/layout.tsx`**
- Replace `bg-gradient-primary` outer → `bg-muted` (subtle gray, not green)
- Center card uses `bg-card rounded-lg border border-border shadow-card`

---

### Phase 4 — Page-Level Updates + English Content

Each dashboard page needs:
1. **Russian strings → English strings** (all user-facing text: labels, placeholders, empty states, button text, error messages, toast messages) — use natural SaaS phrasing, not literal translation
2. Green-washed section headers → neutral `bg-muted/50` or plain white
3. Table components: header row `bg-muted`, body rows separated by `border-b border-border`
4. Status badges: use the new `<Badge />` component from `shared/ui/badge/`
5. Replace `bg-[var(--text-tertiary)]` in `chat-window.tsx` with `bg-muted-foreground/40`
6. Replace `text-primary-600` in `menu-nested-item.tsx` with `text-primary`

**Page inventory:**

| Page | Key changes |
|---|---|
| `/auth/login` | Form layout, input styling, button |
| `/auth/register` | Same as login |
| `/auth/organization` | Org selection cards |
| `/dashboard/calendar` | Event cards, week grid borders |
| `/dashboard/chat` | Empty state, chat bubble style |
| `/dashboard/chat/[id]` | Message bubbles, input bar |
| `/dashboard/follow-ups` | Team list, status badges |
| `/dashboard/follow-ups/[id]` | Follow-up detail layout |
| `/dashboard/follow-ups/analysis/[id]` | Analysis view |
| `/dashboard/meeting/[id]` | Tabbed layout, transcript |
| `/dashboard/methodology` | List, create/edit forms |
| `/dashboard/organization/[id]` | Org settings |
| `/dashboard/teams` | Team list cards |
| `/dashboard/teams/[id]` | Team detail, member list |
| `/dashboard/statistics` | Stat cards, charts |

#### Chat Bubbles (`features/chat/ui/ChatMessage.tsx`)

```tsx
// User message — right-aligned, brand primary bg
<div className="ml-auto max-w-[75%] rounded-lg rounded-br-sm
                bg-primary text-primary-foreground px-4 py-3 text-sm">

// Assistant message — left-aligned, card bg with border
<div className="mr-auto max-w-[75%] rounded-lg rounded-bl-sm
                bg-card border border-border px-4 py-3 text-sm">
```

Avatar for AI: `w-8 h-8 rounded-full bg-secondary flex items-center justify-center`

#### Status Badges (reusable)

```tsx
// shared/ui/badge/Badge.tsx — new component
const variants = {
  default:   'bg-secondary text-secondary-foreground',
  primary:   'bg-primary/10 text-primary',
  success:   'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  warning:   'bg-yellow-50 text-yellow-700',
  destructive: 'bg-destructive/10 text-destructive',
}
// Usage: <Badge variant="success">Completed</Badge>
// Shape: rounded-full px-2.5 py-0.5 text-xs font-medium
```

---

### Phase 5 — Dark Theme (follow-up, separate PR)

Dark theme is enabled by adding `class="dark"` to `<html>`. The `.dark` token block is NOT defined in Phase 1 — light theme values often shift during implementation, so dark tokens should be written after the light theme is finalized.

Implementation:
1. Add `.dark { ... }` token block to `globals.css` (derive from the finalized light theme values)
2. Add `next-themes` for theme persistence + system preference detection
3. Add a `ThemeToggle` button to the top bar
4. Verify every component renders correctly in dark mode
5. Adjust any hardcoded color values found during verification

---

## Acceptance Criteria

### Critical Bug Fixes
- [ ] `Card` renders with correct shadow (`shadow-card`, not broken `box-shadow-primary`)
- [ ] `ComponentHeader` has correct gap between children (`gap-3`, not invalid `gap-[3]`)
- [ ] `InputDropdown` checkmark icon is green (fix `text=accent` → `text-primary`)

### Design Token System
- [ ] `globals.css` uses HSL CSS variables with `@theme inline` mapping
- [ ] No hardcoded hex values (`#4FB268`, `#344137`, etc.) in any component
- [ ] No Tailwind default palette leaking (`bg-blue-50`, `bg-gray-50`, `border-neutral-200`, etc.)
- [ ] Dark mode `.dark` class tokens defined and complete

### Layout
- [ ] Dashboard outer background is white/near-white (`bg-background`), not a green gradient
- [ ] Sidebar is `256px` wide with its own background (`bg-sidebar`) and right border
- [ ] Top bar is `56px` tall with bottom border
- [ ] Content area has `24px` horizontal padding on desktop, `16px` on mobile
- [ ] Logo area shows `<WandaLogo />` component, not text `"logo"`
- [ ] Mobile sidebar works as a slide-over drawer

### Components
- [ ] All form inputs use `rounded-md` (8px) — no more `rounded-full`
- [ ] Textarea border-radius matches Input (`rounded-md`)
- [ ] Typography hierarchy is consistent: H1 bold, H2/H3 semibold, H4 medium, all `text-foreground`
- [ ] Button hover/active states defined for all three variants (primary, secondary, danger)
- [ ] Dropdown panel uses design system colors (no blue palette)
- [ ] Modal uses design system colors (no neutral gray palette)
- [ ] Framer Motion imported consistently from `motion/react-client` everywhere

### Content
- [ ] All user-facing text is in English (no Russian strings in UI)
- [ ] Empty states have natural English copy

### Quality
- [ ] TypeScript compiles with zero errors (`npx tsc --noEmit`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Application runs without console errors

---

## Implementation Order

Execute phases in sequence — each phase leaves the app in a working state:

> **⚠️ Phases 1+3 should be a single atomic PR** — Phase 1 changes token semantics; Phase 3 fixes the shared components that consume them. Merging Phase 1 without Phase 3 breaks the app. See `todos/001-pending-p1-phase1-atomicity-breaks-app.md`.

```
Phase 1+3 (atomic PR): globals.css token migration + all shared/ui component updates
    ↓
Phase 2: Dashboard layout shell + WandaLogo placeholder (layout rewrite)
    ↓
Phase 4: Page-level updates — styling + English strings + Badge component
    ↓
QA pass: TypeScript (npx tsc --noEmit) + ESLint (npm run lint) + visual review
    ↓
Phase 5: Dark theme (separate PR, after light theme is finalized)
```

---

## Files to Create / Modify

### New files
- `shared/ui/badge/Badge.tsx` — reusable status badge component
- `shared/ui/badge/index.ts` — export
- `shared/ui/brand/WandaLogo.tsx` — logo component
- `shared/ui/brand/index.ts` — export

### Files to modify (grouped by phase)

**Phase 1 (tokens):**
- `app/globals.css`

**Phase 2 (layout):**
- `app/dashboard/layout.tsx`
- `features/navigation/ui/MenuSidebar.tsx` (or equivalent)
- `features/navigation/ui/MobileSidebar.tsx` (or equivalent)

**Phase 3 (shared UI components):**
- `shared/ui/card/Card.tsx`
- `shared/ui/card/CardBody.tsx`
- `shared/ui/button/Button.tsx`
- `shared/ui/button/button-icon.tsx`
- `shared/ui/button/button-back.tsx`
- `shared/ui/button/button-close.tsx`
- `shared/ui/input/Input.tsx`
- `shared/ui/input/textarea.tsx`
- `shared/ui/input/InputDropdown.tsx`
- `shared/ui/input/InputPassword.tsx`
- `shared/ui/input/Checkbox.tsx`
- `shared/ui/modal/modal.tsx`
- `shared/ui/typography/H1.tsx`
- `shared/ui/typography/H2.tsx`
- `shared/ui/typography/H3.tsx`
- `shared/ui/typography/H4.tsx`
- `shared/ui/layout/component-header.tsx`
- `shared/ui/layout/global-popup.tsx`
- `shared/ui/animation/Border.tsx`
- `shared/ui/animation/Opacity.tsx`

**Phase 4 (pages — English + page-level styling + Badge):**
- `app/auth/layout.tsx`
- `app/auth/login/page.tsx`
- `app/auth/register/page.tsx`
- `app/auth/organization/page.tsx`
- `app/dashboard/chat/page.tsx`
- `features/chat/ui/chat-window.tsx` — also fix `bg-[var(--text-tertiary)]` → `bg-muted-foreground/40`
- `features/chat/ui/chat-message.tsx`
- `features/chat/ui/chat-input.tsx`
- `features/chat/ui/chat-list.tsx`
- `features/menu/ui/menu-nested-item.tsx` — fix `text-primary-600` → `text-primary`
- All other feature UI components with Russian strings
- `features/methodology/api/methodology.ts` — fix `revalidatePath` path

**SVG / inline colors (see `todos/006-pending-p2-svg-hardcoded-colors-not-in-plan.md`):**
- `features/analysis/ui/chart-donut.tsx` — SVG stroke hex values need `currentColor` conversion
- `app/dashboard/statistics/` — static placeholder SVGs with 200+ hardcoded fills (explicitly decide: in-scope or defer to chart library PR)

---

## References

### Internal
- `app/globals.css` — current token definitions (reference for migration mapping)
- `shared/ui/` — all components being updated
- `app/dashboard/layout.tsx` — layout shell to replace
- `features/chat/ui/` — chat components

### Design References
- shadcn/ui CSS variables: HSL token architecture (see Phase 1 CSS above)
- Linear: 220px sidebar, 13px body, 4px grid spacing
- Vercel/Geist: border-only cards, neutral grays, 48px top nav
- shadcn/ui sidebar example: 256px default, 48px collapsed

### Tailwind v4 Notes
- No `tailwind.config.ts` — all config lives in `globals.css` via `@theme inline`
- Colors must be mapped through `--color-*` naming convention in `@theme` to be available as utilities
- `border-color` default override: `* { border-color: hsl(var(--border)); }` in `@layer base`
