---
title: 'refactor: Unified Page Layout — PageContainer + loading.tsx Sync'
type: refactor
status: completed
date: 2026-05-08
---

# refactor: Unified Page Layout — PageContainer + loading.tsx Sync

## Enhancement Summary

**Deepened on:** 2026-05-08  
**Research agents used:** best-practices-researcher, performance-oracle,
architecture-strategist, code-simplicity-reviewer, kieran-typescript-reviewer,
pattern-recognition-specialist, framework-docs-researcher

### Key Improvements Over Original Plan

1. **Phase 2 (migrating page.tsx files) dropped** — it is pure churn. Pages
   render correctly today. Only `loading.tsx` files cause the visible jump. Fix
   only those.
2. **`PageContainerSkeleton` hardcoded padding removed** — the `p-6 space-y-4`
   wrapper conflicts with complex structured skeletons (teams, meetings). It is
   now a thin pass-through.
3. **Next.js architecture insight added** — the official recommendation is to
   move the Card shell into `layout.tsx` for tab-grouped pages. This eliminates
   the mismatch problem at the source for new page groups.
4. **TypeScript design tightened** —
   `interface Props extends PropsWithChildren`, named export, JSDoc on
   `className` as additive-only, consistent `{ clsx }` import.
5. **Explicit CLAUDE.md rules added** — four guardrails prevent future
   inconsistency without relying on code review.

### New Considerations Discovered

- **54% of all `<Card className=` usages** already use `h-full flex flex-col` —
  the dominant pattern is confirmed, but 46% have variants that `PageContainer`
  should not absorb
- **`animate-pulse` is compositor-safe** — it animates opacity only, no forced
  reflow, correct to use in skeleton wrappers
- **`overflow-hidden` must NOT be baked into `PageContainer`** — it breaks pages
  that own their own scrolling (`teams/page.tsx` uses `overflow-y-auto` on the
  Card)
- **Deep Card imports are universal** — every consumer imports `Card` from
  `@/shared/ui/card/Card`, bypassing the barrel. Fix in this refactor.
- **`chat/[id]/loading.tsx` already broke consistency** — it hand-rolled
  `rounded-[var(--radius-card)] bg-card border border-border` instead of using
  `Card`

---

## Overview

Dashboard pages are visually inconsistent: some wrap content in `<Card>`, others
use a bare `<div>`, and most `loading.tsx` files omit the Card entirely. This
causes a jarring layout jump ("прыжок") on every route transition — the skeleton
appears without the card frame, then snaps to the full bordered card once data
loads.

**Solution:** introduce a single `PageContainer` Server Component that
encapsulates the canonical card wrapper, then fix the `loading.tsx` files for
pages that use it. Do NOT migrate page.tsx files — they are not the source of
the jump.

---

## Problem Statement

### Root Cause 1 — loading.tsx does not mirror page structure

The most impactful mismatches (active, measurable CLS on navigation):

| Route             | page.tsx wrapper                          | loading.tsx wrapper                                                     | CLS severity                              |
| ----------------- | ----------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------- |
| `agents/profiles` | `<Card>` with header + grid               | `<SkeletonList>` — no Card                                              | **HIGH** — card border/bg appears on load |
| `agents/tasks`    | `<Card>` with EmptyState                  | `<SkeletonList>` — no Card                                              | **HIGH**                                  |
| `today/meetings`  | `<Card className='h-full flex flex-col'>` | `<SkeletonList>` — no Card                                              | **HIGH**                                  |
| `today/tasks`     | `<Card className='flex flex-col'>`        | `<SkeletonList>` — no Card                                              | **HIGH**                                  |
| `meetings/list`   | `<Card className='h-full flex flex-col'>` | bare `<div className='px-6 py-6'>` — no Card                            | **MEDIUM**                                |
| `chat/[id]`       | `<Card>`                                  | hand-rolled `rounded-[var(--radius-card)] bg-card border border-border` | **LOW** — visually OK but CSS drift risk  |

> Official Next.js 16 streaming guide (2026-05-07): "If the fallback and the
> resolved content are different sizes, the surrounding layout shifts. Design
> skeleton fallbacks that match the dimensions of the content they represent."

### Root Cause 2 — Inconsistent Card usage across pages

Pages fall into three incompatible patterns:

| Pattern                                               | Files (examples)                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `<Card className='h-full flex flex-col'>` ← canonical | `teams/page.tsx`, `meetings/list/page.tsx`, `today/meetings/page.tsx`                 |
| Card delegated to parent layout                       | `profile/layout.tsx`, `issues/(list)/layout.tsx`, `agents/tasks/[id]/layout.tsx`      |
| No Card — bare `<div>`                                | `meetings/calendar/page.tsx`, `today/progress/page.tsx`                               |
| Duplicated Card CSS without the component             | `chat/[id]/loading.tsx` → `rounded-[var(--radius-card)] border border-border bg-card` |

Audit of all 35 `<Card className=` occurrences in `app/dashboard/**`:

| className variant                                  | Count  | Notes                                              |
| -------------------------------------------------- | ------ | -------------------------------------------------- |
| `h-full flex flex-col`                             | **19** | Target for `PageContainer`                         |
| `h-full flex flex-col overflow-hidden`             | 1      | Keep as-is or pass via `className`                 |
| `h-full flex flex-col items-center justify-center` | 1      | Spinner loading states                             |
| `min-h-full flex flex-col`                         | 2      | Allow card to grow beyond parent                   |
| `min-h-full flex flex-col overflow-y-auto`         | 1      | `teams/page.tsx` self-scroll                       |
| `overflow-hidden` only                             | 2      | `issues/(list)/layout`, `issues/(progress)/layout` |
| `flex flex-col` only                               | 3      | Nested sub-cards, not page-level                   |

### Root Cause 3 — No shared abstraction for the pattern

The de facto page container pattern (`<Card className='h-full flex flex-col'>`)
is repeated inline across 19 files with no single source of truth. When Card's
visual design changes (e.g. `--radius-card` or border color), 19 files need
updating.

---

## Proposed Solution

### Approach A — `PageContainer` wrapper (chosen)

Create `shared/ui/layout/page-container.tsx` that encapsulates
`<Card className='h-full flex flex-col'>`. Update `loading.tsx` files to use it;
pages are **not** touched.

### Approach B — `layout.tsx` owns the Card (recommended for NEW page groups)

For any new section that has multiple tab sub-routes, put the Card in the parent
`layout.tsx` instead of each sub-page. This is the pattern Next.js officially
recommends: the container renders immediately outside the Suspense boundary, so
both `loading.tsx` and `page.tsx` only need to provide inner content.

```
app/dashboard/new-section/
  layout.tsx       ← <Card className='h-full flex flex-col'>{children}</Card>
  page.tsx         ← redirect to default tab (no Card needed)
  list/
    page.tsx       ← bare content fragment (no Card)
    loading.tsx    ← bare skeleton fragment (no Card needed!)
```

**Existing pages** that already own their Card in `page.tsx` are migrated to
`PageContainer` for consistency (Approach A). **New pages** should follow
Approach B.

---

## Implementation

### Phase 1 — Create `PageContainer` (no breaking changes)

**`shared/ui/layout/page-container.tsx`**

```tsx
import type { PropsWithChildren } from 'react';
import { clsx } from 'clsx';
import Card from '@/shared/ui/card/Card';

/**
 * Standard full-height page container for standalone dashboard pages.
 *
 * Use in page.tsx files that own their own Card wrapper (not in sub-pages
 * whose parent layout already provides a Card).
 *
 * The `className` prop is ADDITIVE — do not pass layout overrides
 * (flex-row, h-auto, items-*) as they conflict with the enforced flex-col layout.
 * For overflow control, passing `overflow-y-auto` or `overflow-hidden` is valid.
 */
interface Props extends PropsWithChildren {
  className?: string;
}

export function PageContainer({ children, className }: Props) {
  return (
    <Card className={clsx('h-full flex flex-col', className)}>{children}</Card>
  );
}
```

Key design decisions (from TypeScript review):

- `interface Props extends PropsWithChildren` — matches `Card.tsx` pattern,
  satisfies `prefer-props-with-children` ESLint rule
- Named export — consistent with all other `shared/ui/layout/` exports
- `{ clsx }` named import — consistent with `skeleton.tsx` (not default import
  as in `Card.tsx`)
- JSDoc documents the `className` additive-only constraint to prevent silent
  class conflicts

> **Why not `card/PageCard.tsx`?** The architecture review and best-practices
> research both suggested `shared/ui/card/PageCard.tsx` as an alternative
> location. `shared/ui/layout/` is chosen because it already hosts structural
> compositions (`ComponentHeader`, `GenericList`, `Skeleton`) while
> `shared/ui/card/` hosts primitive visual components. The import direction
> `layout/ → card/` is within the same layer and does not violate FSD rules.

> **Why not `variant='page'` on Card?** Adding a variant requires modifying
> `Card.tsx` and breaks the single-responsibility principle of the primitive.
> `PageContainer` is explicit about its purpose without changing the base
> component.

**`shared/ui/layout/index.ts`** — add exports:

```ts
export { PageContainer } from './page-container';
```

> Do NOT create a separate `PageContainerSkeleton` file. Research showed its
> hardcoded `p-6 space-y-4` wrapper conflicts with every structured skeleton
> (teams, meetings, kanban). Instead, `loading.tsx` files compose
> `<PageContainer>` directly with their own skeleton content.

**Files to create/edit in Phase 1:**

```
shared/ui/layout/page-container.tsx    [NEW]
shared/ui/layout/index.ts              [EDIT — add export]
```

### Phase 2 — Fix loading.tsx files (the actual CLS source)

Each broken `loading.tsx` wraps its skeleton in `<PageContainer>` to match the
card frame.

**Simple case (replace bare `<SkeletonList>` with Card-wrapped version):**

```tsx
// app/dashboard/agents/tasks/loading.tsx — BEFORE
import { SkeletonList } from '@/shared/ui/layout/skeleton';
export default function Loading() {
  return <SkeletonList rows={5} />;
}

// AFTER
import { PageContainer } from '@/shared/ui/layout/page-container';
import { SkeletonList } from '@/shared/ui/layout/skeleton';
export default function Loading() {
  return (
    <PageContainer>
      <SkeletonList rows={5} />
    </PageContainer>
  );
}
```

**Structured case (match page section layout):**

For pages with a visible `PageHeader` (title bar with border-b), the skeleton
must include a matching header placeholder — otherwise the header appears on
load and pushes content down:

```tsx
// app/dashboard/today/tasks/loading.tsx — structural skeleton
import { PageContainer } from '@/shared/ui/layout/page-container';
import { Skeleton, SkeletonList } from '@/shared/ui/layout/skeleton';
export default function Loading() {
  return (
    <PageContainer>
      {/* matches PageHeader height (~h-14) with border-b */}
      <div className='flex items-center gap-3 px-4 py-2 border-b border-border'>
        <Skeleton className='h-5 w-32' />
      </div>
      <SkeletonList rows={4} />
    </PageContainer>
  );
}
```

**Files to fix:**

| File                                        | Current state                      | Action                                                                        |
| ------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| `app/dashboard/agents/tasks/loading.tsx`    | bare `<SkeletonList rows={5}>`     | wrap in `<PageContainer>`                                                     |
| `app/dashboard/agents/profiles/loading.tsx` | bare `<SkeletonList rows={5}>`     | wrap in `<PageContainer>`                                                     |
| `app/dashboard/today/meetings/loading.tsx`  | bare `<SkeletonList rows={4}>`     | wrap in `<PageContainer>`                                                     |
| `app/dashboard/today/tasks/loading.tsx`     | bare `<SkeletonList rows={4}>`     | wrap + add header skeleton                                                    |
| `app/dashboard/meetings/list/loading.tsx`   | bare `<div className='px-6 py-6'>` | replace with `<PageContainer>`                                                |
| `app/dashboard/chat/[id]/loading.tsx`       | hand-rolled CSS vars               | replace with `<Card className='h-full flex flex-col'>` (or `<PageContainer>`) |

**Do NOT modify** (parent layout provides the Card — skeleton files are
correctly bare):

- `app/dashboard/profile/loading.tsx` — `profile/layout.tsx` owns the Card
- `app/dashboard/issues/(list)/list/loading.tsx` — `issues/(list)/layout.tsx`
  owns the Card
- `app/dashboard/agents/tasks/[id]/*/loading.tsx` —
  `agents/tasks/[id]/layout.tsx` owns the Card

**Do NOT modify** (existing structured skeletons that are already correct):

- `app/dashboard/teams/loading.tsx` — gold standard, preserves full layout
  structure
- `app/dashboard/teams/[id]/loading.tsx` — same pattern
- `app/dashboard/organization/[id]/loading.tsx` — already uses `Card`

### Phase 3 — Fix deep Card imports (maintenance debt)

Every consumer currently imports Card via deep path, bypassing the barrel:

```ts
import Card from '@/shared/ui/card/Card'; // deep — used in every file
```

Update all dashboard `page.tsx` and `layout.tsx` files to use the barrel:

```ts
import { Card } from '@/shared/ui/card'; // correct barrel import
```

This is a low-risk mechanical change (no behavior changes) that enforces FSD's
"import from index" rule and makes future Card API changes easier.

### Phase 4 — Remove duplicated Card CSS

- [ ] `app/dashboard/meetings/[id]/overview/page.tsx` — local `SectionCard`
      component duplicates
      `rounded-[var(--radius-card)] border border-border bg-card`. Replace with
      `import { Card } from '@/shared/ui/card'`.

---

## Acceptance Criteria

- [ ] `PageContainer` exists in `shared/ui/layout/page-container.tsx` with JSDoc
      and is exported from `shared/ui/layout/index.ts`
- [ ] Every `loading.tsx` that corresponds to a `PageContainer`-wrapped page
      wraps its skeleton in `<PageContainer>`
- [ ] No `loading.tsx` renders the card border/background when its `page.tsx`
      does not (and vice versa)
- [ ] No `loading.tsx` is updated for pages where the parent layout already
      provides the Card
- [ ] `teams/loading.tsx` and other structured skeletons are preserved as-is
- [ ] `chat/[id]/loading.tsx` no longer hand-rolls Card CSS
- [ ] `meetings/[id]/overview/page.tsx` local `SectionCard` replaced with shared
      `Card`
- [ ] All deep `@/shared/ui/card/Card` imports updated to `@/shared/ui/card`
- [ ] `npm run lint` and `npm run build` pass with zero new errors
- [ ] Visual smoke-test: navigating to `agents/tasks`, `agents/profiles`,
      `today/meetings`, `today/tasks`, `meetings/list` no longer shows a
      Card-frame pop-in

## Non-Goals

- Migrating `page.tsx` files from `<Card>` to `<PageContainer>` — pages render
  correctly today, this is pure churn
- Redesigning or restyling pages
- Changing `CardBody`, `ComponentHeader`, or `PageHeader` internals
- Adding `PageContainerSkeleton` — it conflicts with structured skeletons and
  adds no value over composing `<PageContainer>` directly
- Adding animations or transitions to loading states

---

## New Conventions (add to CLAUDE.md)

Four rules to prevent future inconsistency without relying on code review:

**Rule 1 — `loading.tsx` must mirror its `page.tsx` outer container.** If
`page.tsx` renders `<PageContainer>` (or
`<Card className='h-full flex flex-col'>`), `loading.tsx` must start with the
same outer element. This is checked on every PR that touches a page or its
loading state.

**Rule 2 — `PageContainer` is for standalone pages only.** Pages inside a layout
that already provides a Card (e.g. `profile/layout.tsx`,
`issues/(list)/layout.tsx`) must NOT use `PageContainer` in their sub-pages. The
Card is already provided by the layout — adding it in the page would
double-wrap.

**Rule 3 — New tab-grouped page sections must put the Card in `layout.tsx`.**
For any new section with multiple tab sub-routes, the parent `layout.tsx` owns
`<Card className='h-full flex flex-col'>`. Child `page.tsx` and `loading.tsx`
files are bare content fragments. This eliminates the loading.tsx sync problem
by design.

**Rule 4 — `className` on `PageContainer` is additive only.** Never pass
layout-overriding classes (`flex-row`, `h-auto`, `items-*`) via `className`.
Valid uses: `overflow-hidden`, `overflow-y-auto`, `min-h-full`. Invalid uses:
anything that changes the flex direction or height behavior.

---

## Dependencies & Risks

| Risk                                                                                                                                | Mitigation                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Updating `agents/tasks/loading.tsx` which is inside `AgentsLayout` — if layout provides Card, adding it in loading.tsx double-wraps | Confirm: agents/layout.tsx does NOT provide Card (it uses bare `div` with `flex-col h-full overflow-hidden p-2`). Safe to add. |
| Pages that intentionally omit Card (calendar, kanban, progress pages)                                                               | Do not touch these — they are correctly Card-free                                                                              |
| `overflow-hidden` not in `PageContainer` by default                                                                                 | Pass via `className` prop when needed; document in JSDoc                                                                       |
| `min-h-full` vs `h-full` variants not covered by `PageContainer`                                                                    | Use `Card` directly for `teams/page.tsx` (self-scrolling page); `PageContainer` is not a universal replacement                 |
| Phase 3 (barrel imports) is broad                                                                                                   | Mechanical change; lint will catch any missed import paths                                                                     |

---

## References

### Internal

- `shared/ui/card/Card.tsx` — base Card component (named export needed in
  barrel)
- `shared/ui/card/CardBody.tsx` — content area with `p-6`
- `shared/ui/layout/skeleton.tsx` — `Skeleton`, `SkeletonList`
- `app/dashboard/teams/loading.tsx` — gold standard loading skeleton
  (structured, Card-wrapped)
- `app/dashboard/loading.tsx` — simplest valid `<Card> + <SkeletonList>` pattern
  (canonical for `PageContainerSkeleton` use case)
- `widgets/layout/ui/page-header.tsx` — `PageHeader` used inside cards

### External

- [Next.js 16 — loading.js API Reference](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
- [Next.js 16 — Streaming Guide (CLS section)](https://nextjs.org/docs/app/guides/streaming)
- [Next.js 16 — Caching / Partial Prerendering](https://nextjs.org/docs/app/getting-started/caching)
- [Feature-Sliced Design — Page Layouts](https://feature-sliced.design/docs/guides/examples/page-layout)

### Conventions

- CLAUDE.md — Tab Navigation Convention (each sub-route must have `loading.tsx`)
- CLAUDE.md — FSD Layer Rules (`shared/ui/` for reusable UI primitives; import
  from barrel `index.ts` not deep paths)
