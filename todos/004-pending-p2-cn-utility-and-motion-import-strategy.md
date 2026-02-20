---
status: pending
priority: p2
issue_id: "004"
tags: [code-review, typescript, architecture]
dependencies: []
---

# Two Implementation Blockers: Missing `cn` Utility + Incorrect motion Import Strategy

## Problem Statement

Two issues in the plan's code snippets will cause TypeScript build errors or runtime failures if implemented as written:

### Issue A: `cn` used in WandaLogo without import or definition
The proposed `WandaLogo` component uses `cn('flex items-center gap-2', className)` but `cn` is not a shared utility in this project. TypeScript strict mode will error: `Cannot find name 'cn'`. The project has `clsx` installed (`"clsx": "^2.1.1"`) but no shared `cn` wrapper.

### Issue B: Plan says "use `motion/react-client` everywhere" but `LazyMotion`/`domAnimation` are not exported from that subpath
`motion/react-client` is a valid package subpath that re-exports `framer-motion/client`. However:
- `LazyMotion` and `domAnimation` are NOT available from `motion/react-client`
- The existing `AnimationProvider.tsx` uses `LazyMotion` from `framer-motion`
- The plan's instruction to "standardize to `motion/react-client`" will break the AnimationProvider if applied universally

## Findings

- `shared/lib/` — no `cn.ts` or `utils.ts` exists
- `tailwind-merge` is NOT installed (not in package.json) — no class deduplication available
- `"clsx": "^2.1.1"` IS installed — can be used directly
- `AnimationProvider.tsx` imports `LazyMotion, domAnimation` from `framer-motion`
- Components inside the `LazyMotion` tree should use `m` (not `motion`) for bundle efficiency

Correct motion import mapping:
- `LazyMotion`, `domAnimation` → stay as `framer-motion`
- `AnimatePresence` → `framer-motion` or `motion/react-client` (both export it)
- `motion` component → inside LazyMotion tree: use `m` from `framer-motion`; outside tree: `motion` from `motion/react-client` is fine

## Proposed Solutions

### For Issue A:

**Option A1 (Recommended):** Create `shared/lib/cn.ts`:
```ts
import clsx from 'clsx';
export const cn = clsx;
```
Then import in WandaLogo: `import { cn } from '@/shared/lib/cn'`

**Option A2:** Use `clsx` directly in components that need class merging, without a wrapper:
```tsx
import clsx from 'clsx';
// ...
<div className={clsx('flex items-center gap-2', className)}>
```

Note: Without `tailwind-merge`, conflicting Tailwind classes are not deduplicated. This is acceptable for simple use cases like WandaLogo.

### For Issue B:

Update the plan's motion standardization rule to:
- Components using `motion` or `m` inside `<LazyMotion>` wrapper → use `import { m } from 'framer-motion'`
- Components using `AnimatePresence` → use `import { AnimatePresence } from 'framer-motion'`
- `motion/react-client` should only be used if NOT inside the LazyMotion tree (i.e., standalone animated components outside providers)

## Acceptance Criteria
- [ ] `cn` is available as a named import in `shared/lib/cn.ts`
- [ ] WandaLogo imports `cn` from `@/shared/lib/cn`
- [ ] `AnimationProvider.tsx` continues to work after motion import changes
- [ ] No TypeScript errors related to `cn` or motion imports after Phase 3

## Work Log
- 2026-02-20: Identified during multi-agent plan review (kieran-typescript-reviewer + architecture-strategist)
