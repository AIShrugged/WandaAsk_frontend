---
title:
  'fix: Remove inner inset shadow from Input and similar components, keep only
  one outer border'
type: fix
status: completed
date: 2026-05-13
deepened: 2026-05-13
---

# fix: Remove inner inset shadow from Input components — keep only one outer border

## Enhancement Summary

**Deepened on:** 2026-05-13  
**Research agents used:** best-practices-researcher, framework-docs-researcher,
kieran-typescript-reviewer, performance-oracle, code-simplicity-reviewer,
architecture-strategist, pattern-recognition-specialist, security-sentinel,
julik-frontend-races-reviewer, design-lens-reviewer

### Key Improvements Discovered

1. **The proposed `border` replacement may be wrong** — multiple agents
   independently recommend keeping inset `box-shadow` and simply fixing the
   stacked values; switching to `border` introduces layout and label-notch risks
2. **The simplest fix is a ternary collapse** — replace two `&&` branches with
   one ternary; no structural change needed
3. **Critical WCAG failures discovered** — the existing `--border` token has
   ~1.25:1 contrast against background (fails 3:1); the 18% opacity focus ring
   is below WCAG 2.4.11 minimum
4. **`focus-within` should become `has-[:focus-visible]`** — `focus-within` can
   be triggered programmatically; `focus-visible`-based approach is both safer
   and aligns with all other interactive components in the design system
5. **`textarea.tsx` missing `aria-describedby`** — screen reader users don't
   hear error messages; pre-existing bug that should be fixed in this pass
6. **`--border` token needs lightening** — from `oklch(24%)` to ~`oklch(40-46%)`
   to achieve WCAG 1.4.11 non-text contrast

### New Considerations Discovered

- Tailwind v4 `ring-*` generates `box-shadow`, not `outline` — ring-2 is a 2px
  outer shadow, correct for a focus glow
- Tailwind v4 `ring` default changed from 3px (v3) to 1px (v4); use `ring-2`
  explicitly
- `color-mix()` is safe in production (Baseline, 93%+ browser support)
- `ring-offset-*` is de-emphasized in v4; use `inset-ring-*` instead for inset
  rings
- The pattern recognition agent found 6+ raw `<input>` elements in features that
  bypass the shared component — those are a separate cleanup task
- The `isFocused` useState for floating label can be eliminated entirely using
  CSS `peer-focus:` + `peer-[:not(:placeholder-shown)]:` — saves 2 re-renders
  per focus interaction

---

## Problem Statement

Input, Textarea, and similar form components currently render **two visible
borders simultaneously**:

1. **Inset box-shadow** (`inset 0 0 0 1px var(--border)`) — renders as an inner
   border drawn inside the element's box
2. **Outer ring** (`0 0 0 3px color-mix(...)`) — renders as an outer glow on
   focus

On focus the inset shadow is combined with the outer ring, making the component
appear to have a double border: a thick inner outline AND a glowing outer ring.
The screenshot shows this clearly on the Textarea (onboarding description
field): an inner rounded rectangle border and an outer rounded rectangle ring,
with a visible gap between them.

The desired result: one clean outer border only — the inner inset shadow must be
removed entirely. The outer ring/glow on focus is acceptable and should remain
(or be the sole visual indicator).

### Research Insights

**Industry consensus:** No major design system (Material Design 3, shadcn/ui,
Ant Design, Apple HIG) uses a literal double CSS border. Focus rings are always
a single `box-shadow` layer or `outline` — never a second `border` stacked on
the rest-state border.

**The specific artifact:** The issue is the comma-concatenation in the focus
shadow value: `inset_0_0_0_1.5px_var(--primary),0_0_0_3px_color-mix(...)`. Both
layers render simultaneously — the inset layer looks like an inner border, the
outer layer looks like an outer ring. Together they produce the "double border"
appearance at the rounded corners where the gap is most visible.

---

## Root Cause

In `Input.tsx:76` and `textarea.tsx:90`, the normal state uses:

```
shadow-[inset_0_0_0_1px_var(--border)]
```

And the focus state uses:

```
focus-within:shadow-[inset_0_0_0_1.5px_var(--primary),0_0_0_3px_color-mix(in_oklab,var(--ring)_18%,transparent)]
```

The `,` in the focus shadow value stacks both the inset inner border AND the
outer glow simultaneously. The existing `box-shadow` approach is actually the
correct architectural choice (no layout shift, no box-model impact) — the fix is
not to replace it with `border`, but to remove the `inset` component from the
focus state so only the outer ring remains on focus.

**Root cause is simpler than the original plan stated:** keep `box-shadow`
approach, just don't stack `inset` + outer in the focus state.

---

## Affected Files

| File                                | Lines            | Issue                                                                               |
| ----------------------------------- | ---------------- | ----------------------------------------------------------------------------------- |
| `shared/ui/input/Input.tsx`         | 76–78            | Inset shadow stacked with outer ring on focus                                       |
| `shared/ui/input/textarea.tsx`      | 90–92            | Same pattern                                                                        |
| `shared/ui/input/InputDropdown.tsx` | 307–308, 380     | Inconsistent: uses `border border-input` + `focus:ring-2` vs `focus-visible:ring-2` |
| `app/globals.css`                   | `--border` token | `oklch(24%)` fails WCAG 1.4.11 contrast                                             |

`InputPassword.tsx` and `InputTextarea.tsx` are thin wrappers — they inherit the
fix automatically.  
`Checkbox.tsx` uses `border border-border` with `focus-visible:ring-2` — already
clean, no change needed.

---

## Proposed Solution (Revised Based on Research)

### Option A — Minimal fix (Recommended by code-simplicity-reviewer)

Do not switch to `border`. Keep the inset-shadow approach. Simply **remove the
inset component from the focus state** so only the outer glow remains on focus.
Also collapse the two `&&` branches into one ternary.

**Input.tsx wrapper div (lines 71–79):**

```tsx
<div
  className={cn(
    'px-4 flex items-center rounded-[var(--radius-button)] h-9 w-full relative',
    'bg-[var(--background)] transition-shadow',
    error
      ? 'shadow-[inset_0_0_0_1px_var(--destructive)] focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--destructive)_18%,transparent)]'
      : 'shadow-[inset_0_0_0_1px_var(--border)] focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--ring)_35%,transparent)]',
  )}
>
```

Key changes from the original:

- Focus state: removed `inset_0_0_0_1.5px_var(--primary),` — now only the outer
  glow remains
- Ring opacity increased from `18%` to `35%` for WCAG 2.4.11 compliance
- Two `&&` expressions collapsed into one ternary
- `transition-shadow` kept (not changed to
  `transition-[box-shadow,border-color]`)

**textarea.tsx wrapper div (lines 84–93):** Same pattern.

### Option B — `border` + `ring` (Original plan approach, higher risk)

Replace inset-shadow with `border border-border` + `focus-within:ring-2`. Higher
risk due to:

- Floating label notch interaction: with `border`, the background-fill trick on
  the label must cover the 1px border line precisely — hairline artifact risk at
  zoom levels > 100% and on non-retina displays
- 1px real border affects content-box sizing (shrinks inner area by 2px vs pure
  shadow)
- `isFocused` useState vs CSS `focus-within` mismatch becomes more visible
  because `border-color` transition duration is separate from ring appearance
- `InputPassword` eye-button click creates a frame where `focus-within` is lost
  but the label drops via JS state — more visible with border-color transition

**This option is NOT recommended.** See Architecture and Race Condition sections
below.

---

## Additional Fixes (Discovered During Research)

### 1. Focus ring opacity: 18% → 35%

The current `color-mix(in_oklab,var(--ring)_18%,transparent)` produces an 18%
opacity ring. The security agent found this fails WCAG 2.4.11 — the focus
indicator does not achieve sufficient contrast. Increase to at least 35%:

```
color-mix(in_oklab,var(--ring)_35%,transparent)
```

Or using Tailwind v4 idiomatic opacity modifier: `ring-ring/35`.

### 2. `focus-within` → `has-[:focus-visible]` (Medium priority)

Current `focus-within:` fires on any programmatic `.focus()` call, including
from browser extensions or compromised scripts (UI redressing risk). Replace
with `:has(:focus-visible)` using Tailwind v4 arbitrary variant:

```tsx
// Before
'focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--ring)_35%,transparent)]';

// After
'has-[:focus-visible]:shadow-[0_0_0_3px_color-mix(in_oklab,var(--ring)_35%,transparent)]';
```

Browser support: Chrome 105+, Firefox 121+, Safari 15.4+ — safe for 2026.

### 3. Fix `textarea.tsx` missing `aria-describedby` (Accessibility bug)

`Input.tsx` correctly links to the error message via `aria-describedby`.
`textarea.tsx` does not — screen reader users will not hear the error message.

Add to `textarea.tsx`:

```tsx
// Add errorId
const errorId = `${textareaId}-error`;

// Add to <textarea>
aria-invalid={!!error}
aria-describedby={error ? errorId : undefined}

// Add id to the error display element
<Error id={errorId}>{error}</Error>
```

### 4. `InputDropdown.tsx` token and pseudo-class unification

- Change `border border-input` → `border border-border` (unify to `--border`
  token; `--input` and `--border` resolve identically today, but coupling
  prevents future divergence)
- Change `focus:ring-2` → `focus-visible:ring-2` (InputDropdown is the only
  interactive control in `shared/ui/` using plain `focus:` instead of
  `focus-visible:`)
- Add `outline-none` to the internal search `<input>` (line 380) — it lacks
  this, which causes the browser default outline to show

### 5. `--border` token contrast (Separate task, tracked here)

The existing `--border` value `oklch(24% 0.01 260)` has ~1.25:1 contrast against
`--background` (`oklch(10% 0.007 260)`). WCAG 1.4.11 requires 3:1. This is a
pre-existing token-level issue, not introduced by this fix.

Recommended values:

- Dark theme: `oklch(40% 0.015 260)` — achieves ~3.1:1 vs background
- Light theme: already passes with `var(--neutral-200)` on white background

**This is a separate token change** — do not bundle it into this fix, as it
affects the entire design system. Create a follow-up task.

---

## Acceptance Criteria

- [x] `Input` in normal state shows the inset shadow border (unchanged)
- [x] `Input` on focus shows ONLY the outer ring glow — no inner inset stroke
      simultaneously
- [x] `Input` in error state shows a red inset border; on focus, only the red
      outer ring (no inner red stroke)
- [x] `Textarea` has identical single-ring-on-focus behavior
- [x] Ring opacity is ≥ 35% (not 18%) for WCAG 2.4.11 compliance
- [x] Floating label (translate-up animation on focus) still works correctly —
      no label shift or border artifact
- [x] `InputDropdown` uses `focus-visible:ring-2` (not `focus:ring-2`) and
      `border-border` (not `border-input`)
- [x] `textarea.tsx` has `aria-describedby` pointing to error message (matches
      Input.tsx pattern)
- [x] `InputPassword` and `InputTextarea` inherit the fix without code changes
- [x] No box-shadow value contains BOTH an inset AND non-inset component
      simultaneously
- [x] No layout shift or size change on any input wrapper div
- [x] No `transition-shadow` changes needed — existing `transition-shadow` is
      correct as-is

---

## Implementation Notes

### Why inset-shadow is the right technique here (not `border`)

From performance-oracle and code-simplicity-reviewer:

- Inset `box-shadow` does not affect the box model — no layout shift when
  toggling focus, no shrinkage of inner content area
- A `border` approach introduces 1px width/height into the content box even with
  `border-box` sizing (content shrinks, not outer dimensions)
- The floating label's absolute positioning (`top: -9px`) is anchored to the
  wrapper's padding box; switching to `border` changes the reference box subtly
- Transitioning a single `box-shadow` is atomic (one property); `border` +
  `box-shadow` requires transitioning two properties simultaneously, which can
  desync at ~16ms granularity on fast focus/blur cycles
- Inset shadows don't clip to `border-radius` on older Safari — but this is a
  rendering concern for the inset layer only; the outer (non-inset) ring is
  unaffected

### Tailwind v4 specifics

From framework-docs-researcher:

- `ring-2` generates `box-shadow: 0 0 0 2px var(--tw-ring-color)` — it is outer,
  not inset. Correct for focus ring.
- `ring` default in v4 is 1px (changed from 3px in v3) — always specify `ring-2`
  explicitly
- `ring-ring/35` is idiomatic for `--ring` token at 35% opacity (maps via
  `--color-ring: var(--ring)` in `globals.css`)
- `has-[:focus-visible]` is a valid Tailwind v4 arbitrary variant
- `color-mix(in_oklab,var(--ring)_35%,transparent)` in arbitrary shadow values:
  underscores become spaces, safe to use

### Transition: no change needed

`transition-shadow` (current) correctly covers `box-shadow`. Since the proposed
fix keeps everything in `box-shadow`, no transition change is needed. The
`transition-[box-shadow,border-color]` in the original plan was only needed for
the `border`-based approach (Option B) — irrelevant for Option A.

### `focus-within` vs `has-[:focus-visible]` tradeoff

`focus-within` is acceptable for text inputs (showing focus state on mouse click
is expected UX for text fields). However, `has-[:focus-visible]` is more correct
architecturally and matches what `Checkbox.tsx`, `Button.tsx`, and `pill.tsx`
all use. If the team prefers consistency, use `has-[:focus-visible]`. If
click-to-focus ring is desired UX for text inputs specifically, keep
`focus-within`.

### Global `:focus-visible` rule interaction

`app/globals.css` applies `box-shadow: var(--shadow-focus)` to all focusable
elements via a global `:focus-visible` rule. The inner `<input>` already has
`outline-none` in both `Input.tsx` and `textarea.tsx`, but the global
`box-shadow` rule still fires on keyboard focus. This creates a secondary shadow
on the inner `<input>` while the wrapper shows its ring — a double-ring scenario
on keyboard navigation.

Suppress this by adding to the wrapper:

```tsx
'[&_input]:focus-visible:shadow-none'; // on Input.tsx wrapper
'[&_textarea]:focus-visible:shadow-none'; // on textarea.tsx wrapper
```

---

## Affected Files (Complete List)

| File                                            | Change                                                                                                        | Priority |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------- |
| `shared/ui/input/Input.tsx:76-78`               | Remove inset from focus shadow; ternary; increase ring opacity; suppress global focus-visible shadow          | P0       |
| `shared/ui/input/textarea.tsx:90-92`            | Same as Input.tsx                                                                                             | P0       |
| `shared/ui/input/textarea.tsx`                  | Add `errorId` + `aria-describedby`                                                                            | P1       |
| `shared/ui/input/InputDropdown.tsx:307-308,380` | `border-input` → `border-border`; `focus:ring-2` → `focus-visible:ring-2`; add `outline-none` to search input | P1       |
| `app/globals.css`                               | `--border` token lightening (separate task)                                                                   | P2       |

---

## Out of Scope (Separate Tasks)

- Raw `<input>` elements in features that bypass the shared component
  (`features/teams/`, `features/organization/`, `features/decisions/`,
  `features/issues/`, `features/chat/`) — pattern recognition found 6+
  instances. These should use the `<Input>` shared component instead.
- Eliminating `useState(isFocused)` in `Input.tsx` and `textarea.tsx` in favor
  of pure CSS `peer-focus:` floating label — valid performance improvement
  (saves 2 re-renders per focus interaction) but is a separate refactor.
- `--border` token contrast fix — token-level change affecting the entire design
  system, separate PR.

---

## References

- `shared/ui/input/Input.tsx:70–100` — current implementation
- `shared/ui/input/textarea.tsx:84–117` — current implementation
- `shared/ui/input/InputDropdown.tsx:307–312,380` — reference pattern
  (border-input + focus:ring approach)
- `shared/ui/input/Checkbox.tsx:58–68` — reference `focus-visible:ring-2`
  pattern
- `app/globals.css` — `--border`, `--ring`, `--primary`, `--destructive`,
  `--shadow-focus` token definitions
- [WCAG 2.4.11 Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance-minimum.html)
- [Tailwind v4 Ring Width docs](https://tailwindcss.com/docs/ring-width)
- [Tailwind v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Sara Soueidan — Accessible focus indicators](https://www.sarasoueidan.com/blog/focus-indicators/)
