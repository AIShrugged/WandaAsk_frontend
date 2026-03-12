---
status: pending
priority: p2
issue_id: '005'
tags: [code-review, design-system, css, tailwind]
dependencies: ['001']
---

# Radius Token Names Collide with Tailwind Defaults + shadow-card Token Missing from @theme

## Problem Statement

Two token definition errors in the Phase 1 CSS that will cause silent visual
regressions:

### Issue A: --radius-sm and --radius-md override Tailwind built-in defaults

The plan defines:

```css
@theme inline {
  --radius-sm: calc(var(--radius) - 0.125rem); /* 6px */
  --radius-md: var(--radius); /* 8px */
}
```

Tailwind v4 ships with `--radius-sm` (default 4px → `rounded-sm`) and
`--radius-md` (default 6px → `rounded-md`). By redefining these in
`@theme inline`, the project silently overrides the defaults:

- `rounded-sm` → 6px (was 4px in Tailwind default)
- `rounded-md` → 8px (was 6px in Tailwind default)

Any existing code using `rounded-sm` or `rounded-md` expecting Tailwind's
default values will silently produce different border radii. The plan's own
Phase 3 spec says "Change rounded-full → rounded-md (6px)" — but after this
token definition, `rounded-md` is 8px, not 6px.

### Issue B: shadow-card utility is not defined in @theme

The plan's Phase 1 CSS block defines `.shadow-card` in `@layer utilities`:

```css
@layer utilities {
  .shadow-card {
    box-shadow:
      0 1px 3px 0 rgba(0, 0, 0, 0.08),
      ...;
  }
}
```

But Card.tsx (Phase 3) is told to use `shadow-card` as a Tailwind utility. In
Tailwind v4, `shadow-*` utilities must be registered in `@theme` as `--shadow-*`
tokens to work as first-class utilities. A manually defined `@layer utilities`
class will work for the class itself, but `hover:shadow-card`,
`dark:shadow-card`, and similar variants will NOT work without `@theme`
registration.

## Proposed Solutions

### For Issue A (radius naming):

**Option A1 (Recommended):** Use non-colliding token names:

```css
@theme inline {
  --radius-button: 0.375rem; /* 6px — for buttons, inputs */
  --radius-card: 0.5rem; /* 8px — for cards, modals  */
  --radius-panel: 0.75rem; /* 12px — for large panels  */
}
/* Component usage: rounded-[var(--radius-button)] or a named utility class */
```

**Option A2:** Use `--radius` only (the base shadcn convention) and derive from
it in components using Tailwind's calc-based classes. Don't define
`--radius-sm`/`--radius-md` at all. Just use:

- `rounded-md` for 6px (Tailwind default, not overridden)
- `rounded-lg` for 8px (Tailwind default = 0.5rem)
- `rounded-xl` for 12px (Tailwind default = 0.75rem)

This avoids all token conflicts entirely and aligns with how shadcn/ui
components actually use the radius scale.

### For Issue B (shadow-card):

Add shadow token to `@theme inline`:

```css
@theme inline {
  --shadow-card:
    0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.06);
}
```

This enables `shadow-card`, `hover:shadow-card`, `dark:shadow-card` as proper
Tailwind utilities.

## Acceptance Criteria

- [ ] No `--radius-sm` or `--radius-md` defined in @theme that override Tailwind
      defaults
- [ ] Component specs in the plan reference radius utilities that exist and have
      expected px values
- [ ] `shadow-card` registered in `@theme inline` as `--shadow-card`
- [ ] `hover:shadow-card` and `dark:shadow-card` work without additional CSS

## Work Log

- 2026-02-20: Identified during multi-agent plan review
  (kieran-typescript-reviewer + code-simplicity-reviewer)
