---
status: pending
priority: p1
issue_id: '004'
tags: [code-review, quality]
---

# `linear.tsx` grid regression — always 4 columns even with 1-2 submetrics

## Problem Statement

The mobile responsiveness refactor changed
`features/analysis/widgets/linear.tsx` from a data-adaptive grid to a fixed
4-column layout. On desktop, if the API returns fewer than 4 submetrics, cards
are now left-aligned in a partial grid with empty cells instead of filling the
row proportionally.

## Findings

**Before:**

```tsx
<div
  className='grid gap-4'
  style={{ gridTemplateColumns: `repeat(${Math.min(submetrics.length, 4)}, minmax(0, 1fr))` }}
>
```

With 2 submetrics → 2 equal columns filling the row.

**After:**

```tsx
<div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
```

With 2 submetrics → 2 cards in a 4-column grid, leaving 2 empty slots.

`MetricItem[]` has no length constraint at the type level. The backend controls
submetric count.

## Proposed Solutions

### Option A: Data-adaptive Tailwind classes (Recommended if count is 1/2/4)

```tsx
const colClass =
  submetrics.length <= 1 ? 'grid-cols-1' :
  submetrics.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
  submetrics.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
  'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

<div className={`grid gap-4 ${colClass}`}>
```

**Pros:** Pure Tailwind, responsive, data-driven. **Effort:** Small.

### Option B: Hybrid — inline style for desktop, Tailwind for mobile

```tsx
<div
  className='grid gap-4 grid-cols-1 sm:grid-cols-2'
  style={{ '--lg-cols': Math.min(submetrics.length, 4) } as React.CSSProperties}
>
```

More complex, only worth it if column count is truly unbounded.

### Option C: Restore original inline style + add mobile classes

```tsx
<div
  className='grid gap-4 grid-cols-1 sm:grid-cols-2'
  style={{ gridTemplateColumns: `repeat(${Math.min(submetrics.length, 4)}, minmax(0, 1fr))` }}
>
```

The style overrides the sm breakpoint on desktop, keeping mobile responsive.
**Pros:** Restores original desktop behavior, adds mobile. **Effort:** Minimal.

## Acceptance Criteria

- [ ] Desktop shows correct number of columns matching submetric count (max 4)
- [ ] Mobile shows 1 column, tablet shows 2 columns
- [ ] No empty grid cells when fewer than 4 submetrics

## Affected Files

- `features/analysis/widgets/linear.tsx`
