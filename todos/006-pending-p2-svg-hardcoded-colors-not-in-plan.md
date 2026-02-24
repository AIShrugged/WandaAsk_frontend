---
status: pending
priority: p2
issue_id: "006"
tags: [code-review, design-system, migration, svg]
dependencies: []
---

# SVG Hardcoded Hex Colors Outside Token Migration Scope

## Problem Statement

Several files contain hardcoded hex color values inside SVG `fill`/`stroke` attributes and JSX `style` props. CSS custom properties (CSS variables) cannot be used in SVG `fill` attributes without explicit `currentColor` patterns or inline style interpolation. The plan's token migration search-and-replace will not reach these values.

**Files affected:**
- `features/analysis/ui/chart-donut.tsx:39,48` — `stroke='#e0fad8'` and `stroke='#4FB268'` as JSX SVG attributes
- `app/dashboard/statistics/a/page.tsx` — SVG-based static chart, many hardcoded fills
- `app/dashboard/statistics/b/page.tsx` — same
- `app/dashboard/statistics/c/page.tsx` — 200+ instances of `fill='#4FB268'`, `fill='#344137'`, `fill='#0A421E'`, `fill='#F5FFF7'`, `fill='#4F67F4'` across inline SVG elements (these are placeholder/mock SVG charts)

Additionally:
- `features/chat/ui/chat-window.tsx:98-106` — uses `bg-[var(--text-tertiary)]` (arbitrary Tailwind with old CSS var name). After migration, `--text-tertiary` is removed from `:root`, so this renders as `bg-[undefined]` (no background).
- `features/menu/ui/menu-nested-item.tsx:50` — uses `text-primary-600`. In the new token system, `primary` is a flat color (no palette scale), so `text-primary-600` generates nothing.

## Proposed Solutions

### For chart-donut.tsx:
Replace hardcoded SVG attributes with `currentColor` and apply color via CSS class:
```tsx
// Before
<circle stroke='#4FB268' />

// After
<circle stroke='currentColor' className='text-primary' />
```

### For statistics pages (a, b, c):
These pages appear to be static mockup SVGs, not data-driven charts. Two options:

**Option A (Recommended):** Treat statistics pages as out-of-scope for this redesign PR. Add an explicit note in the plan: "Statistics SVG pages use placeholder inline SVGs with hardcoded colors. These will be replaced with real chart components (e.g., recharts) in a separate PR."

**Option B:** Update all SVG fills to use CSS custom properties via `fill={`hsl(var(--primary))`}` or `fill='currentColor'` with className.

### For chat-window.tsx bg-[var(--text-tertiary)]:
Replace with new token: `bg-[hsl(var(--muted-foreground)/0.4)]` or a named utility class.

### For menu-nested-item.tsx text-primary-600:
Replace with `text-primary` (flat color) since no palette scale is defined.

## Acceptance Criteria
- [ ] `chart-donut.tsx` SVG colors use `currentColor` or CSS variable references
- [ ] Statistics pages SVG scope is explicitly documented (in-scope or out-of-scope)
- [ ] `bg-[var(--text-tertiary)]` in chat-window.tsx updated to new token reference
- [ ] `text-primary-600` in menu-nested-item.tsx replaced with `text-primary`

## Work Log
- 2026-02-20: Identified during multi-agent plan review (architecture-strategist + code-simplicity-reviewer)
