---
status: pending
priority: p3
issue_id: '012'
tags: [code-review, quality]
---

# CSS cleanup: unused utilities and misleading breakpoint names in globals.css

## Problem Statement

Three YAGNI issues in `app/globals.css` and breakpoint naming:

**1. `scrollbar-default` is unused** — zero usages in the codebase. Scrollbars
are visible by default. This utility only makes sense if reverting
`scrollbar-hide` on a child element, which doesn't happen anywhere.

**2. `2xl` breakpoint override (1440px) has zero usages** — Tailwind's default
`2xl` is 1536px; this override is never used in any component.

**3. `sm` breakpoint (425px) shadows Tailwind's standard `sm` (640px)** — Three
component files use `sm:` expecting 425px. Anyone writing `sm:` who knows
Tailwind defaults will be surprised. The name should not shadow a standard
Tailwind breakpoint.

## Proposed Solutions

1. Remove `.scrollbar-default` CSS block (4 lines)
2. Remove `--breakpoint-2xl: 1440px` from `@theme` block (1 line)
3. Rename `--breakpoint-sm: 425px` to `--breakpoint-phone: 425px` and update
   usages in:
   - `features/analysis/widgets/linear.tsx`
   - Other files using `sm:grid-cols-2` that intended the 425px breakpoint

## Acceptance Criteria

- [ ] `.scrollbar-default` removed from `globals.css`
- [ ] `--breakpoint-2xl` removed from `@theme`
- [ ] `--breakpoint-sm` renamed to avoid shadowing Tailwind default OR
      documented with a prominent comment

## Affected Files

- `app/globals.css`
- Any files using `sm:` prefix that intended the 425px override
