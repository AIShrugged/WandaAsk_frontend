---
status: pending
priority: p1
issue_id: '003'
tags: [code-review, quality, accessibility]
---

# `H3` component renders `<h1>` tag — semantic bug

## Problem Statement

`shared/ui/typography/H3.tsx` renders an `<h1>` HTML element instead of `<h3>`.
This breaks document heading hierarchy across every page that uses `H3`, causing
accessibility failures (screen readers read it as a top-level heading) and poor
SEO.

## Findings

From `shared/ui/typography/H3.tsx`:

```tsx
export function H3({ children, className }: Props) {
  return (
    <h1 className={...}>  {/* BUG: should be <h3> */}
      {children}
    </h1>
  );
}
```

`H3` is used in `features/analysis/widgets/total.tsx` and potentially other
places. The document outline is broken wherever `H3` is used.

## Proposed Solution

Change `<h1>` to `<h3>` in `shared/ui/typography/H3.tsx`.

While there: apply `cn()` for className merging (same as other typography
components) and verify the responsive classes are consistent with H1/H2/H4.

**Effort:** Trivial. **Risk:** None.

## Acceptance Criteria

- [ ] `H3.tsx` renders `<h3>` not `<h1>`
- [ ] `className` uses `cn()` to avoid `undefined` in class string when no
      className passed
- [ ] Visual appearance unchanged (same Tailwind classes)

## Affected Files

- `shared/ui/typography/H3.tsx`
