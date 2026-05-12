---
title: 'feat: Migrate to TRIBES Design System'
type: feat
status: active
date: 2026-05-12
---

# feat: Migrate to TRIBES Design System

## Enhancement Summary

**Deepened on:** 2026-05-12 **Research agents used:** OKLCH best practices, font
loading, React/a11y patterns, architecture review, performance, TypeScript, code
simplicity, pattern recognition, design guardian, security-sentinel,
adversarial/feasibility analyst, spec-flow analyzer

### Key Improvements Discovered

1. **Phase 0 (new, mandatory):** Three silent blockers will break the app on
   Phase 1 day-one if not fixed first — `chart-theme.ts` hardcoded HSL constants
   (4 chart components affected), `hsl(var(...))` SVG attributes in
   `critical-path-graph.tsx` (20+ occurrences), and the `@theme inline` wrapper
   pattern that turns `hsl(oklch(...))` into invalid CSS.
2. **Phase ordering fixed:** Fonts must move before components (Phase 2); the
   `react-day-picker` `.rdp-root` override breaks in Phase 1, not Phase 10;
   `--sidebar-width` → `--sidebar-w` rename is a silent layout-collapse bug.
3. **YAGNI cuts:** Toggle, AvatarStack, ProgressBar, CardHeader/CardFooter, and
   the `link` Button variant have zero current call sites — defer them. Do not
   ship new component API alongside token migration in the same PR.
4. **Security — Critical:** `chat-message-content.tsx` deliberately re-executes
   `<script>` tags from AI HTML. DOMPurify must be added before Phase 1 ships.
5. **Accessibility — High (5 items):** Button has no `focus-visible` ring;
   Checkbox removes native ring without replacement; Modal missing
   `role="dialog"` + focus trap; Toggle missing `role="switch"` +
   `aria-checked`; no `prefers-reduced-motion` guard on any animation.
6. **Contrast verification required:** `oklch(56%)` primary against white text
   is ~3.8:1, below WCAG AA 4.5:1. Must lower lightness to `oklch(44%)` or
   verify computed hex before shipping.
7. **Naming convention fixes:** `CardHead`/`CardFoot` →
   `CardHeader`/`CardFooter`; Card `elevation` prop → `variant`; Badge
   `destructive`→`danger` is a breaking API change touching ~90 lines — plan
   carefully.

### New Considerations Discovered

- The landing feature (20 files, 29+ hardcoded `rgba(124,58,237...)` usages) is
  not in the migration scope at all — must be explicitly declared out-of-scope
  or added as a phase.
- `Badge.success` in light mode collapses to ~2.1:1 contrast ratio — fails WCAG
  AA in a light theme world.
- `ghost-danger` Button variant becomes invisible in light mode — needs
  `danger-bg` background color.
- Phase 11 (test updates) must be dissolved into each component phase PR.
  Batching test updates creates a multi-week CI failure window.

---

## Overview

Replace the current "cosmic dark" WandaAsk design with the TRIBES design system
defined in `/Users/slavapopov/Documents/TRIBES_DESIGN/`. The new system is a
clean, professional light/dark theme built on OKLCH color space with
Inter/Instrument Serif/JetBrains Mono font stack, structured spacing scale, and
a complete set of refined component styles.

**Scope:** `tokens.css` (colors, typography, spacing, radii, shadows, motion) +
`components.css` (buttons, inputs, badges, cards, tabs, tables, modals, avatars,
navitems, skeletons) + `screens.css` (layout patterns for dashboard, kanban,
calendar, chat screens).

**Explicitly out of scope (defer):** `features/landing/` (20 files with
hardcoded rgba), new components with zero call sites (Toggle, AvatarStack,
ProgressBar, CardHeader/CardFooter).

**Key delta from current design:**

| Aspect        | Current (cosmic dark)             | New (TRIBES)                                                         |
| ------------- | --------------------------------- | -------------------------------------------------------------------- |
| Color model   | HSL variables                     | OKLCH variables                                                      |
| Default theme | Dark only                         | Light **first**, dark equal-quality                                  |
| Primary color | Violet `hsl(263 79% 70%)`         | Indigo-violet `oklch(56% 0.205 271)` (verify contrast — see Phase 0) |
| Accent color  | Terminal green `hsl(142 76% 45%)` | Removed (success green remains as semantic only)                     |
| Background    | `#030308` deep space              | `oklch(98% 0.004 260)` warm-cool zinc                                |
| Typography    | Inter only                        | Inter + Instrument Serif (display) + JetBrains Mono                  |
| Spacing       | Tailwind defaults                 | Custom 4pt scale (`--sp-1` 2px … `--sp-13` 96px)                     |
| Shadows       | Minimal                           | Layered `xs/sm/md/lg/xl` + focus ring                                |
| Motion tokens | None                              | `--dur-fast/norm/slow`, `--ease-out/in-out`                          |
| Border radius | 3 values via Tailwind             | 8 values (`r-xs` … `r-full`)                                         |

---

## Revised Complexity Estimate

**Overall: HIGH (10–14 engineering days)**

The original "Low — additive CSS change" estimate for Phase 1 was wrong. Three
Phase 0 blockers add 1–1.5 days. The adversarial analysis confirmed several
underestimates:

| Work area                               | Effort           | Risk               | Change from original                                                |
| --------------------------------------- | ---------------- | ------------------ | ------------------------------------------------------------------- |
| **Phase 0: Prerequisite fixes**         | **1–1.5 days**   | **Critical**       | **New phase — mandatory**                                           |
| Phase 1: Tokens + CSS migration         | 1.5 days         | Medium (was "Low") | +0.5d for `@theme inline` bridge + `.rdp-root`                      |
| Phase 2: Fonts (moved earlier)          | 0.5 day          | Low                | Reordered before components                                         |
| Phase 3: Button system                  | 0.5 day          | Low                | Scope reduced (no `link` variant)                                   |
| Phase 4: Input / Checkbox               | 1 day            | Medium             | Toggle deferred                                                     |
| Phase 5: Badge / Avatar / Pill          | 0.5 day          | Medium (was "Low") | 90 `destructive` string usages to update                            |
| Phase 6: Card / Modal / Popover         | 1 day            | Medium             | CardHeader/Footer deferred                                          |
| Phase 7: Navigation (tabs, sidebar)     | 1.5 days         | Medium             | No change                                                           |
| Phase 8: Tables, Kanban, DataTable      | 1.5 days         | Medium             | No change                                                           |
| Phase 9: Skeleton / Empty state / Toast | 0.5 day          | Low                | No change                                                           |
| Phase 10: Screen-level layouts          | 3–4 days (was 2) | High               | Landing excluded; critical-path SVG cluster is a separate work item |
| **Total**                               | **~13 days**     | —                  | +3d from original                                                   |

---

## Implementation Approach

**Token-first, then component-by-component**, keeping the app functional at all
times.

1. **Phase 0 first** — fix all silent blockers before touching tokens, or Phase
   1 will ship a broken app.
2. **One PR per phase**, merged to master. Each PR ships with its own test
   updates — never defer test fixes to a later phase.
3. **Keep dark as default** (current UX) until explicit product decision.
   Light-first migration is a product change, not just technical. Do not change
   `DEFAULT_THEME` in Phase 1 without stakeholder sign-off.
4. **Tailwind utility name preservation** — keep `bg-background`,
   `text-foreground`, `border-border` intact in `@theme inline`. This avoids
   mass component rewrites in Phase 1.
5. **Screenshot baseline before Phase 1** — take Playwright screenshots of all
   major routes in both themes before any CSS changes. Store as baseline
   artifacts. Diff after each phase.

---

## Phase 0: Prerequisites (Mandatory — Do Before Phase 1)

**This phase does not change any visible design. It fixes technical blockers
that will silently break the app when tokens change to OKLCH.**

### 0a: Fix `chart-theme.ts` hardcoded HSL constants

**File:** `shared/lib/chart-theme.ts`

Four constants use hardcoded HSL strings that bypass the CSS variable system:

```ts
// Current — will render dark-on-dark in light theme, wrong in dark after OKLCH migration
background: 'hsl(240 30% 7%)';
fill: 'hsl(240 20% 13%)';
stroke: 'hsl(240 15% 16%)';
```

**Fix:** Replace with CSS variable references. Since Recharts accepts style
strings, use a pattern that reads computed CSS variables at render time, or
define token-aware constants:

```ts
// Use CSS custom properties that will resolve correctly in both themes
export const CHART_TOOLTIP_STYLE = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  color: 'var(--text)',
};
```

**Affected files:** `features/summary/`, `features/statistics/`,
`features/main-dashboard/`, and any other Recharts consumers importing from
`chart-theme.ts`.

### 0b: Fix `hsl(var(...))` SVG attribute strings in critical-path cluster

**Files:** `features/issues/ui/critical-path-graph.tsx`,
`critical-path-node-detail.tsx`, `critical-path-page.tsx`

These files contain 20+ occurrences of patterns like:

```tsx
stroke={`hsl(var(--destructive))`}  // becomes hsl(oklch(...)) = invalid CSS
fill={`hsl(var(--primary))`}
```

Once `--destructive` becomes an OKLCH value, `hsl(oklch(...))` is invalid CSS —
the SVG silently renders black or transparent.

**Fix:** Remove the `hsl()` wrapper. OKLCH values are valid as direct
`stroke`/`fill` attributes:

```tsx
stroke = 'var(--destructive)'; // valid — CSS custom properties work in SVG presentation attributes
fill = 'var(--primary)';
```

**Note:** SVG presentation attributes accept CSS color values including `var()`.
The `hsl()` wrapper was only needed when the variable stored bare HSL channels.
After TRIBES migration, the variable stores a complete color — the wrapper must
be removed.

### 0c: Audit and remove all `hsl(var(--token))` patterns in CSS and JS

**Files:** `app/globals.css` (the `@theme inline` block), any `.tsx` files using
inline `style={{ color: 'hsl(var(--primary))' }}`

**The critical issue:** Current `@theme inline` maps:

```css
--color-primary: hsl(var(--primary));
```

This works today because `--primary: 263 79% 70%` stores bare HSL channels.
After Phase 1, `--primary: oklch(56% 0.205 271)` stores a complete color, making
`hsl(oklch(...))` invalid.

**Fix required in Phase 0:** Audit every `hsl(var(--...))` occurrence and
categorize:

- In `@theme inline`: remove `hsl()` wrapper → `--color-primary: var(--primary)`
- In `.rdp-root` overrides in `globals.css`: same removal
- In `globals.css` line 287 (`chat-html-content` table row): same removal

**Run:** `grep -rn 'hsl(var(' app/ shared/ features/ entities/ widgets/` to get
the full list. Each occurrence must be changed in either Phase 0 or atomically
within Phase 1.

### 0d: Fix token variable name renames

**The `--sidebar-width` → `--sidebar-w` rename is a silent layout-collapse
bug.**

The TRIBES `tokens.css` uses `--sidebar-w` and `--topbar-h`. The current
codebase uses `--sidebar-width` (consumed via `.sidebar-width` Tailwind utility)
and `--topbar-height`.

**Fix:** Either keep the existing variable names in the globals.css token layer
(add `--sidebar-width: var(--sidebar-w)` aliases), or update the 2 files that
use `.sidebar-width` and 4 files that use `h-[var(--topbar-height)]` in the same
PR as Phase 1. Do not let this mismatch exist across a PR boundary.

### 0e: Security — DOMPurify for AI HTML (Critical)

**File:** `features/chat/ui/chat-message-content.tsx`

**This is unrelated to the design migration but must be fixed before the next
deploy.** The file deliberately re-executes `<script>` tags from AI-generated
HTML:

```ts
ref.current.innerHTML = content; // raw AI HTML injected
// then re-executes every <script> found
```

This is a stored XSS vector. If any AI response contains script-influenced by
user data (meeting transcripts, task titles, user names), attackers can execute
arbitrary JavaScript with full session access.

**Fix:**

```bash
npm install isomorphic-dompurify
```

```ts
import DOMPurify from 'isomorphic-dompurify';
// ...
ref.current.innerHTML = DOMPurify.sanitize(content, { FORCE_BODY: true });
// Remove the entire script re-execution block
```

**This is a P0 security fix. It should ship before Phase 1.**

### 0f: Verify WCAG AA contrast for primary button

**File:** Analysis only — result feeds into Phase 3.

`oklch(56% 0.205 271)` maps to approximately `#5a2cd9`, which yields ~3.8:1
contrast against white text — below WCAG AA (4.5:1 required for normal text).

**Fix:** Use `oklch(44% 0.220 271)` for the primary button background, or verify
the hex at [oklch.com](https://oklch.com) and confirm with a WCAG contrast
checker. The current button uses `violet-600` (~`#7c3aed`) at ~4.55:1 — the
migration must not regress below AA.

Similarly, `oklch(66% 0.175 273)` (dark theme primary) against white is ~3.4:1 —
also fails AA for normal text unless buttons use large/bold text qualifying for
the 3:1 large-text threshold.

---

## Phase 1: Design Tokens Migration

**Files:** `app/globals.css`

**What changes:**

Replace the current `@layer base { :root { ... } }` block with TRIBES tokens.
**Must be done atomically with the `@theme inline` bridge update** (see Phase
0c) — these cannot ship as separate PRs.

**Exact sequence within this PR:**

1. Replace `:root` token block with TRIBES OKLCH tokens
2. In `[data-theme='dark']`, add TRIBES dark overrides
3. In `@theme inline`, remove all `hsl(var(...))` wrappers → bare `var(--token)`
   references
4. Verify Tailwind opacity modifiers (`bg-primary/30`) still work — Tailwind v4
   uses `color-mix()` with OKLCH; test on `bg-primary/20`, `bg-destructive/15`
   visually
5. Update `.rdp-root` override block (drop `hsl()` wrappers)
6. Update `--chrome-bg`/`--chrome-border` raw `rgba()` values — add conditional
   for light theme or replace with token-based approach
7. Remove `cosmic-twinkle`, `cosmic-float`, `cosmic-glow-pulse` keyframes (no
   longer used after design reset)
8. Add `@media (prefers-reduced-motion: reduce)` block

**`prefers-reduced-motion` addition (mandatory):**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Tailwind `@theme inline` bridge — after migration:**

```css
@theme inline {
  /* Remove hsl() wrappers — tokens now store complete OKLCH colors */
  --color-background: var(--bg);
  --color-foreground: var(--text);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--text-on-primary);
  --color-border: var(--border);
  /* ... keep same utility names ... */
}
```

**Token → utility name mapping (preserve backward compat):**

| TRIBES token                    | Tailwind utility name | Utility class                       |
| ------------------------------- | --------------------- | ----------------------------------- |
| `--bg`                          | `--color-background`  | `bg-background`                     |
| `--text`                        | `--color-foreground`  | `text-foreground`                   |
| `--primary` (= `--primary-500`) | `--color-primary`     | `bg-primary`                        |
| `--border`                      | `--color-border`      | `border-border`                     |
| `--surface`                     | `--color-card`        | `bg-card`                           |
| `--danger-500`                  | `--color-destructive` | `bg-destructive` (keep for now)     |
| `--success-500`                 | `--color-accent`      | `bg-accent` (maps to success green) |

**Default theme decision:** Keep `dark` as the default (cookie fallback). The
TRIBES `:root` defines light tokens — the app should apply `[data-theme='dark']`
on `<html>` as before. This requires the `ThemeProvider` and cookie logic to
continue setting `data-theme='dark'` as the default. Do not change
`DEFAULT_THEME` without product approval.

**Complexity:** Medium (was "Low"). The `@theme inline` bridge update is
required in the same PR.

**Research insights:**

- Tailwind v4 with `@theme inline` treats values as opaque CSS expressions —
  bare OKLCH values like `oklch(56% 0.205 271)` are valid. The opacity modifier
  (`/30`) works via `color-mix(in oklab, ...)` at the browser level.
- `font-feature-settings` in `body {}` should be scoped to `--font-sans` usage
  only. Currently `'cv02', 'cv03', 'cv04', 'cv11', 'ss01'` are Inter-specific
  features that produce no-op or wrong rendering on fallback system fonts.
- Test immediately after merge: all screens in dark theme (default), then toggle
  to light.

---

## Phase 2: Fonts (Moved Before Components)

**File:** `app/layout.tsx`, optionally `app/fonts.ts`

**Rationale for early placement:** Any component in Phase 3+ that references
`var(--font-display)` or `var(--font-mono)` needs the fonts loaded. Loading
fonts in Phase 8 creates a two-week period where the font tokens exist but fonts
don't render.

**Implementation:**

```ts
// app/fonts.ts (new file — centralizes font config)
import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google';

export const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const instrumentSerif = Instrument_Serif({
  variable: '--font-display',
  subsets: ['latin'],
  weight: '400',
  // Load italic-only — this font is only used for decorative display text
  // in italic style (dashboard greeting, auth quote). Loading both styles
  // doubles the font weight for no benefit.
  style: ['italic'],
  display: 'swap',
});

export const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  // Non-critical path — system mono (Menlo, Consolas) is an acceptable
  // fallback for timestamps and code spans. 'optional' avoids layout shift.
  display: 'optional',
});
```

```tsx
// app/layout.tsx
import { inter, instrumentSerif, jetbrainsMono } from './fonts';

export default function RootLayout({ children }) {
  return (
    <html
      className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      ...
    </html>
  );
}
```

**Note:** `Instrument_Serif` is not a variable font — it only supports weight
`400`. Do not attempt to load other weights.

**Typography scale:** Add `--fs-*` tokens to `globals.css` token block in Phase
1, but `@theme inline` mapping (`text-xxs`, `text-xs`, etc.) is optional — use
`text-[var(--fs-3xl)]` directly where needed, or define Tailwind utilities
lazily as components need them.

---

## Phase 3: Button System

**File:** `shared/ui/button/Button.tsx`, `shared/types/button.ts`

**YAGNI note:** Do NOT add the `link` variant. `ButtonLink` component already
exists and serves that purpose. Adding `link` to `BUTTON_VARIANT` creates
semantic confusion (a button that looks like a link — is it a `<button>` or
`<a>`?). The original plan listed it but no current code uses it.

**What changes:**

The current Button uses Tailwind gradient classes for primary variant. TRIBES
uses flat solid primary with `inset box-shadow` depth effect.

Size mapping:

| TRIBES    | Current           | New height      | Change |
| --------- | ----------------- | --------------- | ------ |
| `btn--xs` | `xs` (h-7, 28px)  | 24px → h-6      | -4px   |
| `btn--sm` | `sm` (h-9, 36px)  | 30px → h-[30px] | -6px   |
| `btn--md` | `md` (h-10, 40px) | 36px → h-9      | -4px   |
| `btn--lg` | _(none)_          | 42px → h-[42px] | new    |

**Primary variant after TRIBES (use oklch(44%) not 56% — see Phase 0f):**

```tsx
[BUTTON_VARIANT.primary]: clsx(
  'bg-[oklch(44%_0.220_271)] text-white cursor-pointer',
  'shadow-[inset_0_0_0_1px_oklch(54%_0.200_271),inset_0_-2px_0_oklch(36%_0.180_268)]',
  'hover:bg-[oklch(40%_0.220_271)]',
  'active:bg-[oklch(36%_0.220_271)] active:translate-y-px',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2',
  disabledClass, loadingClass,
),
```

**Focus ring — mandatory addition to ALL variants:**

```tsx
// Add to base class (applies to all variants)
'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]';
```

**`ghost-danger` in light mode:** The current variant has no background, making
it nearly invisible against light surfaces. Add `hover:bg-[var(--danger-bg)]` as
the hover background so there's a visible hit area in light theme.

**CVA consideration:** The current clsx-based approach works and has no bugs —
do not add CVA unless there is a concrete maintainability problem. Introducing a
new dependency in the same PR as a visual migration adds risk with no benefit.
Keep the existing pattern.

**TypeScript — add `lg` size:**

```ts
export const BUTTON_SIZE = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg', // new
} as const;
```

**Tests:** Update `Button.test.tsx` in the same PR — height class assertions for
`md` and `sm` will fail after size changes.

---

## Phase 4: Input / Checkbox

**Files:** `shared/ui/input/Input.tsx`, `shared/ui/input/Checkbox.tsx`,
`shared/ui/input/InputTextarea.tsx`

**YAGNI note:** Toggle has zero current call sites. Defer `Toggle.tsx` until a
feature actually needs it. Creating unused components adds test surface with no
return.

**Input changes:**

TRIBES input uses `box-shadow: inset 0 0 0 1px var(--border-strong)` instead of
a border for the default state. Inset shadows have zero box-model impact — no
layout shift when toggling focus.

```tsx
// Current
'border border-input focus-within:ring-2 focus-within:ring-ring/30';

// New
'shadow-[inset_0_0_0_1px_var(--border-strong)] focus-within:shadow-[inset_0_0_0_1.5px_var(--primary),0_0_0_3px_var(--ring)/18]';
```

The floating label stays but height adjusts to 36px (h-9) to match the TRIBES
36px input height.

**Checkbox — fix the focus ring regression (currently missing):**

The current `Checkbox.tsx` applies `appearance-none` (removing the native
browser focus ring) but adds no replacement:

```tsx
// Add to Checkbox className:
'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2';
```

Also update the checked state to use `bg-[var(--primary)]` instead of hardcoded
violet class.

---

## Phase 5: Badge, Avatar, Pill

**Files:** `shared/ui/badge/Badge.tsx`, `shared/ui/common/avatar.tsx`,
`shared/ui/common/pill.tsx`

**YAGNI note:** AvatarStack has zero current call sites — defer
`avatar-stack.tsx`.

### Badge — naming and contrast audit

**The `destructive` → `danger` rename is a breaking change.** Before
implementing, confirm:

- Run
  `grep -rn "variant=['\"]destructive" features/ shared/ entities/ widgets/ app/`
  — expected ~90 matches
- The TypeScript compiler will catch all consumers after the type changes — but
  every active branch that touches `<Badge variant='destructive'>` will need to
  rebase
- Consider keeping `destructive` as a deprecated alias for one release cycle:
  `destructive: clsx(dangerStyles)` in the variants map

**Contrast fix for success badge in light mode:**

```tsx
// Current — text-emerald-400 on light bg = ~2.9:1 (fail)
[BADGE_VARIANT.success]: 'bg-[var(--success-bg)] text-[var(--success)]'
// --success = oklch(58% 0.155 155) — verify against --success-100 bg
```

**New variant set:** `neutral | primary | success | warning | danger | info`

Defer `solid` and `outline` meta-variants — they have no current call sites.

Add `dot` prop: renders a 6px `rounded-full` before the badge text in the same
color.

**Badge color semantics (WCAG SC 1.4.1):** Since the terminal green `--accent`
is being removed, confirm that success and danger badges retain a
distinguishable visual difference beyond color alone — add an icon option or
ensure label text is always sufficient context.

### Avatar size recalibration

| Size | Current (px) | TRIBES (px) | New class |
| ---- | ------------ | ----------- | --------- |
| xs   | 24px (w-6)   | 20px        | w-5 h-5   |
| sm   | 32px (w-8)   | 24px        | w-6 h-6   |
| md   | 40px (w-10)  | 28px        | w-7 h-7   |
| lg   | 48px (w-12)  | 36px        | w-9 h-9   |
| xl   | 64px (w-16)  | 48px        | w-12 h-12 |

**Tests:** `avatar.test.tsx` has 5 assertions on exact size classes — all will
fail. Update in the same PR.

---

## Phase 6: Card and Modal

**Files:** `shared/ui/card/Card.tsx`, `shared/ui/modal/modal-root.tsx`,
`shared/ui/modal/modal-header.tsx`, `shared/ui/modal/modal-footer.tsx`

**YAGNI note:** `CardHeader` and `CardFooter` have zero current call sites.
Defer. Existing consumers use `Card` directly with their own padding. Do not
create sub-components that nobody will use.

**Card — naming fix:** If/when elevation variants are added, use `variant` not
`elevation` (every other component in this codebase uses `variant`).

**Card changes:**

```tsx
// Add inset border + xs shadow
'shadow-[inset_0_0_0_1px_var(--border),var(--shadow-xs)]';
// Variant prop for future use (default/elevated/flush) — but only implement
// what is needed now; 'default' with the above shadow is sufficient for Phase 6
```

**Modal — critical accessibility fix (must ship in this phase):**

Current `modal-root.tsx` is missing:

1. `role="dialog"` on the modal container
2. `aria-modal="true"`
3. `aria-labelledby` pointing to modal title
4. Focus trap (Tab currently escapes the modal)

The Escape key closes the modal (correct). Add focus trap via a small utility or
`focus-trap-react`:

```bash
npm install focus-trap-react
```

Or implement a minimal trap: on mount, move focus to the first focusable element
inside the modal; on Tab, cycle within modal children.

**Modal visual changes:**

- Backdrop: `bg-black/40` → `bg-black/50`
- Width: 480px default (`w-[480px] max-w-[calc(100vw-32px)]`)
- Shadow: `shadow-xl` + inset border
- Padding alignment: head `sp-5/sp-6` (20px/24px), body `sp-5`, foot `sp-5` with
  `justify-end gap-3`

---

## Phase 7: Navigation

**Files:** `shared/ui/navigation/page-tabs-nav.tsx`, sidebar in `features/menu/`

**Tabs — underline variant:**

TRIBES uses a `::after` pseudo-element for the active indicator instead of a
`border-b-2` directly on the link. This avoids layout shift (the border takes
layout space; `::after` with `position: absolute` does not).

Current: `border-b-2 border-primary` New:
`relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full`

**Tabs — segmented variant:**

Wrap the button group in a `bg-surface-3 rounded-[var(--r-lg)] p-[3px]`
container. Current implementation uses outer borders on buttons — replace with
the TRIBES pill container.

**Sidebar:**

Current sidebar uses `chrome-bg` glassmorphic style. In light theme, replace
with `bg-[var(--sidebar-bg)]` (= `var(--neutral-100)`).

TRIBES nav-item active state uses `box-shadow: inset 0 0 0 1px var(--border)` —
subtle border, not fill. Current active state uses filled background — align.

**Layout constants (fix from Phase 0d):**

| Token         | Current                          | TRIBES                           |
| ------------- | -------------------------------- | -------------------------------- |
| sidebar width | `--sidebar-width: 16rem` (256px) | 240px → `--sidebar-width: 240px` |
| topbar height | `--topbar-height: 3.5rem` (56px) | 52px → `--topbar-height: 52px`   |

Keep existing variable names (`--sidebar-width`, `--topbar-height`) but update
the values. Do not adopt TRIBES shorthand names (`--sidebar-w`, `--topbar-h`) —
they would silently break 6 consuming files.

---

## Phase 8: Tables, Kanban, DataTable

**File:** `shared/ui/table/DataTable.tsx`, `features/kanban/`

**TRIBES table style:**

- Header: `text-[length:var(--fs-xs)]` (11px), uppercase,
  `letter-spacing: 0.04em`, `bg-[var(--surface-2)]`
- Row hover: `hover:bg-[var(--surface-2)]`
- Cell padding: `px-[var(--sp-5)] py-[var(--sp-4)]` (16px / 12px)
- Replace `bg-accent/30` table header background with `bg-[var(--surface-2)]` —
  the current accent-green header is a non-semantic usage (generic surface, not
  success state)

**Kanban:** Cards get inset border shadow, hover lifts with `shadow-sm`. Column
background: `bg-[var(--surface-2)]`. Column width: 280px per TRIBES spec.

---

## Phase 9: Skeleton, Empty State, Toast

**Files:** `shared/ui/layout/skeleton.tsx`, `shared/ui/feedback/empty-state.tsx`

**Skeleton:** Replace `animate-pulse bg-muted` with TRIBES shimmer animation:

```css
@keyframes tribes-shimmer {
  from {
    opacity: 0.4;
  }
  50% {
    opacity: 0.7;
  }
  to {
    opacity: 0.4;
  }
}
```

Use `bg-[var(--surface-3)]` as skeleton background.

**Note:** `skeleton.test.tsx` asserts `.animate-pulse` class count — update test
in same PR.

**Empty state:** Change icon container from `rounded-full bg-primary/10` to
`bg-[var(--surface-2)] text-[var(--text-subtle)] rounded-[var(--r-lg)]` 56×56px
square.

**Toast:** Sonner dark toast style already close to TRIBES. Verify
`<Toaster theme="system" />` in `Providers.tsx` — or explicitly set
`theme="dark"` if dark remains the default. No substantial changes expected.

---

## Phase 10: Screen-Level Layouts

**Files:** `app/dashboard/layout.tsx`, `widgets/dashboard-chat/`,
`features/calendar/`, `features/main-dashboard/`

**Dashboard "Today" grid:**

TRIBES `today-grid` = `grid-cols-[2fr_1fr]`. Align `features/main-dashboard/`
padding/gap to TRIBES spec.

**Chat frame:**

TRIBES `chat-frame` = 260px sidebar | 1fr main. Check `widgets/dashboard-chat`
column width and update `bg-[var(--surface)]` / divider usage.

**Calendar:**

The `.rdp-root` theme override block should have been fixed in Phase 0c/Phase 1.
In this phase, align event color coding (primary/success/warning/danger tokens)
and `cal-now-line` to use `var(--danger-500)`.

**Critical path graph cluster (separate work item):**

`features/issues/ui/critical-path-graph.tsx` + related files need manual SVG
color attribute updates. This was fixed in Phase 0b (removing `hsl()` wrappers)
but the visual color values themselves should now be reviewed against the new
token palette — e.g., replacing hardcoded violet `hsl(var(--primary))` with
`var(--primary)` which is now a different shade.

**Auth page:**

TRIBES `auth-stage` is a 2-column grid with display font quote on left and auth
card on right. Currently centered layout — high visual impact but optional. If
implemented, use `font-[family-name:var(--font-display)] italic` for the quote
text.

**Explicitly out of scope for this phase:**

`features/landing/` (20 files, 29 hardcoded `rgba(124,58,237...)` values) is not
included in any phase. This should be tracked as a follow-up issue.

---

## Accessibility Checklist (Must Be Complete Before Merging Any Phase)

These items are not phase-specific — they can be fixed in the relevant component
phases:

- [ ] **Button:** `focus-visible:ring-2` on all variants (Phase 3)
- [ ] **Checkbox:** Replace `appearance-none` with custom styled +
      `focus-visible:ring-2` (Phase 4)
- [ ] **Modal:** Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby`,
      focus trap (Phase 6)
- [ ] **Toggle (when created):** Use `role="switch"` + `aria-checked={boolean}`
      — not `aria-pressed`, not `aria-label` changing on state
- [ ] **`prefers-reduced-motion`:** Add global rule to `globals.css` (Phase 1)
- [ ] **Framer-motion components:** Add `useReducedMotion()` hook to
      `modal-root.tsx`, `collapsible-section.tsx`, `Popup.tsx`
- [ ] **Chat bouncing dots:** `animate-bounce` in `chat-message.tsx` — wrap with
      reduced-motion guard
- [ ] **Primary button contrast:** Verify `oklch(44% 0.220 271)` achieves ≥4.5:1
      against white (Phase 0f / Phase 3)
- [ ] **Success badge in light mode:** Verify `var(--success-500)` on
      `var(--success-100)` achieves ≥4.5:1 (Phase 5)
- [ ] **Color + non-color distinction:** Success/danger badges must differ by
      more than color alone (icon or label text) per WCAG SC 1.4.1

---

## Migration Strategy Options

### Option A: Big Bang (1 PR)

Migrate everything in one branch. Fast but high merge-conflict and regression
risk. Not recommended given active development.

### Option B: Token-First Incremental (Recommended)

1. PR 0: Phase 0 prerequisites (no visual change)
2. PR 1: Phase 1 + Phase 2 tokens + fonts (foundational)
3. PR 2–N: One PR per component group
4. Each PR updates its own tests before merge — no "test cleanup" phase

### Option C: Parallel Feature Flag

Wrap theme in `data-tribes` attribute, toggled by cookie. Allows A/B preview but
adds complexity for removal. Suitable if stakeholder sign-off is needed.

---

## Files to Create / Edit

### Phase 0 (prerequisites)

- `shared/lib/chart-theme.ts` — replace hardcoded HSL strings with
  `var(--token)` references
- `features/issues/ui/critical-path-graph.tsx` — remove `hsl()` wrappers from
  SVG attributes
- `features/issues/ui/critical-path-node-detail.tsx` — same
- `features/issues/ui/critical-path-page.tsx` — same
- `features/chat/ui/chat-message-content.tsx` — DOMPurify sanitization, remove
  script re-execution

### Phase 1 (tokens)

- `app/globals.css` — full token block replacement + `@theme inline` bridge +
  `.rdp-root` fix

### Phase 2 (fonts)

- `app/fonts.ts` — **new**, centralizes font config
- `app/layout.tsx` — import and apply font variables

### Phase 3 (button)

- `shared/ui/button/Button.tsx` — variant/size updates, focus ring, ghost-danger
  light mode fix
- `shared/types/button.ts` — add `lg` size
- `shared/ui/button/__tests__/Button.test.tsx` — update size class assertions

### Phase 4 (input/checkbox)

- `shared/ui/input/Input.tsx` — box-shadow border style, height adjustment
- `shared/ui/input/Checkbox.tsx` — focus ring, primary fill when checked

### Phase 5 (badge/avatar/pill)

- `shared/ui/badge/Badge.tsx` — add `info` variant; rename
  `destructive`→`danger` (or deprecate); add `dot` prop; fix light-mode success
  contrast
- `shared/ui/badge/__tests__/Badge.test.tsx` — update variant and class
  assertions
- `shared/ui/common/avatar.tsx` — size recalibration
- `shared/ui/common/avatar.test.tsx` — update size class assertions
- `shared/ui/common/pill.tsx` — TRIBES height/shadow alignment

### Phase 6 (card/modal)

- `shared/ui/card/Card.tsx` — inset border shadow; `variant` prop (not
  `elevation`)
- `shared/ui/modal/modal-root.tsx` — `role="dialog"`, `aria-modal`, focus trap,
  shadow update
- `shared/ui/modal/modal-header.tsx` — padding alignment
- `shared/ui/modal/modal-footer.tsx` — padding alignment

### Phase 7 (navigation)

- `shared/ui/navigation/page-tabs-nav.tsx` — underline pseudo-element, segmented
  container
- `features/menu/ui/` — sidebar nav-item active state, bg token update

### Phase 8 (tables/kanban)

- `shared/ui/table/DataTable.tsx` — header/row padding, bg-surface-2 header
- `features/kanban/` — card shadow, column width, surface token

### Phase 9 (skeleton/empty state)

- `shared/ui/layout/skeleton.tsx` — shimmer animation, bg-surface-3
- `shared/ui/layout/skeleton.test.tsx` — update animate-pulse assertions
- `shared/ui/feedback/empty-state.tsx` — icon container shape

### Phase 10 (screens)

- `app/dashboard/layout.tsx` — sidebar bg token in light theme
- `widgets/dashboard-chat/` — column width, surface tokens
- `features/calendar/` — event colors, now-line token
- `app/(auth)/` — auth layout (optional, high impact)

---

## Acceptance Criteria

**Phase 0:**

- [ ] `chart-theme.ts` uses CSS variable references, not hardcoded HSL strings
- [ ] No `hsl(var(...))` patterns remain in any `.tsx` or `.css` file
- [ ] `critical-path-graph.tsx` cluster uses bare `var(--token)` in SVG
      attributes
- [ ] DOMPurify installed and applied to `chat-message-content.tsx`
- [ ] Script re-execution block removed from `chat-message-content.tsx`
- [ ] Primary button contrast verified ≥4.5:1 at chosen OKLCH lightness

**Phase 1:**

- [ ] All TRIBES token primitives defined in `globals.css`
- [ ] Light theme and dark theme both render correctly; `data-theme='dark'`
      still works
- [ ] `@theme inline` maps new tokens to old utility names with no `hsl()`
      wrappers
- [ ] `prefers-reduced-motion` media query added
- [ ] `cosmic-*` keyframes removed
- [ ] `npm run build` clean with zero TypeScript errors

**Components (phases 3–9):**

- [ ] Button: all variants have `focus-visible:ring-2`; `active:translate-y-px`
      micro-translate; no gradient
- [ ] Checkbox: native focus ring replaced with custom `focus-visible:ring-2`
- [ ] Modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap
      implemented
- [ ] Badge: 6 variants (neutral/primary/success/warning/danger/info); `dot`
      prop; light-mode contrast verified
- [ ] Avatar: TRIBES sizes applied; test assertions updated
- [ ] Card: inset border shadow; `variant` prop named correctly
- [ ] Tabs: underline uses pseudo-element; segmented uses `bg-surface-3`
      container
- [ ] Skeleton: shimmer uses TRIBES animation; `bg-surface-3`
- [ ] EmptyState: 56×56 `rounded-lg` icon container

**All phases:**

- [ ] All unit tests pass in the same PR that changes the component
      (`npm test -- --ci --passWithNoTests`)
- [ ] No ESLint errors (`npm run lint` clean)
- [ ] No TypeScript errors (`npm run build` clean)

---

## Risks

| Risk                                                                     | Severity     | Mitigation                                                                |
| ------------------------------------------------------------------------ | ------------ | ------------------------------------------------------------------------- |
| `hsl(var(...))` wrappers in `@theme inline` break all Tailwind utilities | **Critical** | Phase 0c audit + atomic Phase 1 fix                                       |
| `chart-theme.ts` hardcoded HSL — dark-on-dark in light theme             | **High**     | Phase 0a fix before Phase 1                                               |
| SVG inline `hsl(var(--destructive))` in critical-path cluster            | **High**     | Phase 0b fix before Phase 1                                               |
| `--sidebar-width` → `--sidebar-w` rename collapses sidebar               | **High**     | Phase 0d: keep existing names, update values only                         |
| `.rdp-root` uses `hsl(var(--primary))` — breaks in Phase 1               | **Medium**   | Fix in Phase 1 (not Phase 10)                                             |
| Primary button contrast regression                                       | **Medium**   | Use `oklch(44%)` not `oklch(56%)`                                         |
| `Badge.success` fails WCAG AA in light mode                              | **Medium**   | Verify token contrast ratio in Phase 5                                    |
| `ghost-danger` invisible in light mode                                   | **Medium**   | Add `hover:bg-[var(--danger-bg)]` in Phase 3                              |
| `destructive`→`danger` rename in Badge (~90 usages)                      | **Medium**   | Grep full list; consider deprecation alias                                |
| Dark theme default must be preserved                                     | **Medium**   | Do not change `DEFAULT_THEME` without product sign-off                    |
| Merge conflicts across 73 active branches                                | **Medium**   | Phase 0 + 1 should be small/focused; announce before merging              |
| OKLCH not supported in older Safari                                      | **Low**      | Safari 15.4+ (2022). Add `@supports` fallback if needed.                  |
| Test failures batched instead of fixed per-phase                         | **Medium**   | Policy: tests updated in same PR as component change                      |
| Landing feature not in scope                                             | **Low**      | Track as follow-up issue explicitly                                       |
| Theme cookie missing `secure` flag                                       | **Low**      | Add `secure: process.env.NODE_ENV === 'production'` in next cookie update |
| Cookie value not validated before `as Theme` cast                        | **Low**      | Add explicit union check in `app/layout.tsx`                              |
| Wildcard `hostname: '**'` in Next.js image config                        | **Medium**   | Restrict to known hostnames when bandwidth allows                         |
| No Content-Security-Policy header                                        | **High**     | Add to `next.config.ts` after DOMPurify fix removes XSS surface           |

---

## References

### Design System Files

- `tokens.css` — full token definitions, primitives + semantic aliases, light +
  dark
- `components.css` — all component CSS classes with exact dimensions
- `screens.css` — application layout patterns and screen-level styles

### Frontend Files

- `app/globals.css:1` — current token definitions and Tailwind theme
- `app/layout.tsx:16` — font setup (currently Inter only)
- `shared/lib/chart-theme.ts` — **Phase 0a target** — hardcoded HSL chart
  constants
- `features/issues/ui/critical-path-graph.tsx` — **Phase 0b target** — inline
  `hsl(var(...))` SVG attrs
- `features/chat/ui/chat-message-content.tsx` — **Phase 0e target** — XSS via
  innerHTML + script re-exec
- `shared/ui/button/Button.tsx:1` — button component
- `shared/ui/input/Input.tsx:1` — input component
- `shared/ui/input/Checkbox.tsx` — missing focus ring
- `shared/ui/badge/Badge.tsx:1` — badge component
- `shared/ui/card/Card.tsx:1` — card component
- `shared/ui/modal/modal-root.tsx:1` — modal root, missing dialog ARIA
- `shared/ui/navigation/page-tabs-nav.tsx:1` — tabs navigation
- `shared/ui/common/avatar.tsx:1` — avatar component
- `shared/ui/common/pill.tsx:1` — pill / chip component
- `shared/ui/layout/skeleton.tsx:1` — skeleton loaders
- `shared/ui/feedback/empty-state.tsx:1` — empty state component
- `shared/types/button.ts:1` — button type constants
