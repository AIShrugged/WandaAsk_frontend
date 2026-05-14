---
title:
  'feat: Bold primary-colored text for active/filled Input, Textarea, Dropdown'
type: feat
status: active
date: 2026-05-14
---

# feat: Bold primary-colored text for active/filled Input, Textarea, Dropdown

## Overview

When a user has typed a value into an Input or Textarea, or selected an option
in a Dropdown, the displayed text (the actual value, not the placeholder) should
visually stand out with **bold weight** (`font-bold` = 700 or `font-black`
= 900) and the **primary color** (`var(--primary)` = `oklch(44% 0.22 271)` — the
existing violet/indigo brand color).

All other states — placeholder, floating label, borders, focus ring, error
states, option list items — remain **unchanged**.

## Problem Statement / Motivation

Currently all three components render typed/selected text in the same
`text-foreground` color at `font-weight: 400` (normal). This makes it hard to
distinguish at a glance whether a field has a value or is empty, and the
selected value does not visually feel "committed" or prominent compared to
helper text around it.

## Proposed Solution

In each of the three component files, find the CSS class(es) that style **the
value text element** and add:

- `text-[var(--primary)]` for the primary violet color
- `font-bold` (700) — or `font-black` (900) if the team prefers heavier weight

Only modify the element that renders the user's actual typed/selected text. Do
**not** touch placeholder styles, label styles, border/ring styles, error
styles, option-list styles, or any other visual aspect.

## Scope — Exactly What Changes

### `shared/ui/input/Input.tsx`

**Element:** the `<input>` HTML element (approximately line 92–95).

**Current classes:**

```
peer bg-transparent outline-none w-full placeholder-[var(--muted-foreground)]/70 py-2 text-[var(--foreground)]
```

**Change:** Replace `text-[var(--foreground)]` with
`text-[var(--primary)] font-bold`.

```tsx
// Before
className =
  'peer bg-transparent outline-none w-full placeholder-[var(--muted-foreground)]/70 py-2 text-[var(--foreground)]';

// After
className =
  'peer bg-transparent outline-none w-full placeholder-[var(--muted-foreground)]/70 py-2 text-[var(--primary)] font-bold';
```

**Note:** Placeholder text is controlled by the `placeholder-*` utility and is
NOT affected by `text-[var(--primary)]` — placeholder color stays
`var(--muted-foreground)/70` as-is.

---

### `shared/ui/input/textarea.tsx`

**Element:** the `<textarea>` HTML element (approximately lines 106–112).

**Current classes:**

```
peer w-full bg-transparent outline-none placeholder-muted-foreground/70
scrollbar-thin scrollbar-thumb-gray-300
```

**Change:** Add `text-[var(--primary)] font-bold`.

```tsx
// Before
className =
  'peer w-full bg-transparent outline-none placeholder-muted-foreground/70 scrollbar-thin scrollbar-thumb-gray-300 ...';

// After
className =
  'peer w-full bg-transparent outline-none text-[var(--primary)] font-bold placeholder-muted-foreground/70 scrollbar-thin scrollbar-thumb-gray-300 ...';
```

**Note:** `InputTextarea.tsx` is a thin re-export wrapper over `textarea.tsx` —
no changes needed there.

---

### `shared/ui/input/InputDropdown.tsx`

**Element:** the display `<span>` that shows the currently selected value
(approximately lines 315–319).

**Current conditional classes:**

```tsx
// has value
'flex-1 truncate py-2 text-sm text-foreground';

// no value (placeholder)
'flex-1 truncate py-2 text-sm text-muted-foreground/70';
```

**Change:** Only the has-value branch gets the new styles:

```tsx
// Before
hasValue ? 'text-foreground' : 'text-muted-foreground/70';

// After
hasValue ? 'text-[var(--primary)] font-bold' : 'text-muted-foreground/70';
```

**Do NOT change:**

- Option list items in the portal dropdown (the `font-medium` on selected option
  stays as-is)
- Placeholder span color
- Any border, ring, focus, or error styles

---

## Acceptance Criteria

- [ ] Input with a typed value shows the text in violet/primary color and bold
      weight
- [ ] Input placeholder text remains `var(--muted-foreground)/70` (unchanged)
- [ ] Input floating label color and animation remain unchanged
- [ ] Input border, focus ring, and error styles remain unchanged
- [ ] Textarea with a typed value shows the text in violet/primary color and
      bold weight
- [ ] Textarea placeholder text remains `muted-foreground/70` (unchanged)
- [ ] Textarea floating label, border, ring, and error styles remain unchanged
- [ ] Dropdown trigger shows selected value in violet/primary color and bold
      weight
- [ ] Dropdown trigger shows placeholder in `muted-foreground/70` (unchanged)
- [ ] Dropdown option list items remain unchanged (selected option keeps
      `font-medium text-foreground`)
- [ ] Disabled state appearance is not degraded (opacity still applies over bold
      text)
- [ ] `InputPassword` component (wraps Input) inherits the change automatically
      — no separate file needed

## Files to Modify

| File                                | Element to change               | What changes                                                                        |
| ----------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------- |
| `shared/ui/input/Input.tsx`         | `<input>` element               | add `text-[var(--primary)] font-bold`, remove `text-[var(--foreground)]`            |
| `shared/ui/input/textarea.tsx`      | `<textarea>` element            | add `text-[var(--primary)] font-bold`                                               |
| `shared/ui/input/InputDropdown.tsx` | display `<span>` (value branch) | replace `text-foreground` with `text-[var(--primary)] font-bold` in the conditional |

## Files NOT to Modify

- `shared/ui/input/InputTextarea.tsx` — re-export only, inherits from
  textarea.tsx
- `shared/ui/input/InputPassword.tsx` — wraps Input, inherits automatically
- `shared/ui/input/Checkbox.tsx` — unrelated component
- `shared/ui/input/Error.tsx` — unrelated component
- `shared/ui/input/index.ts` — public API barrel, no styling
- `app/globals.css` — no new tokens needed; `var(--primary)` already exists
- Any other component that uses these inputs — they should pick up the change
  automatically

## Font Weight Choice

The request mentions `700` or `900`. Tailwind mappings:

- `font-bold` → `font-weight: 700`
- `font-black` → `font-weight: 900`

**Recommendation:** Start with `font-bold` (700). The primary violet color
already provides strong visual differentiation; `font-black` (900) may feel
heavy on single-line inputs at 14px. If 700 feels insufficient after visual
review, switch to `font-black`.

## Design Rationale

- `var(--primary)` = `oklch(44% 0.22 271)` — the existing brand violet used for
  focus rings and selected states throughout the app. Using it for value text
  aligns with the already-established meaning of "primary" = "active/engaged".
- Bold weight creates a clear visual hierarchy: **placeholder (light gray,
  normal weight) → value (primary violet, bold)**, making filled vs empty
  scannable at a glance.
- Scope is deliberately minimal: no new design tokens, no new variables, no new
  components.

## References

- `shared/ui/input/Input.tsx` — `<input>` element styling at ~line 92
- `shared/ui/input/textarea.tsx` — `<textarea>` element styling at ~line 106
- `shared/ui/input/InputDropdown.tsx` — display span conditional at ~line 315
- `app/globals.css` — `--primary` token definition at line 193 (dark) / 241
  (light)
