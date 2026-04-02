---
title: Refactor — Universal Button Components System
type: refactor
status: completed
date: 2026-04-02
---

# Refactor — Universal Button Components System

## Overview

Establish a complete, universal button component system in `shared/ui/button/`
that covers every button-like use case in the project, then replace all ad-hoc
inline `<button>` and link-styled button patterns with these shared components.
Finally, update the `design-guardian` agent to enforce the new conventions for
all future button work.

## Problem Statement

The codebase already has a solid `Button` component
(`shared/ui/button/Button.tsx`) with 3 variants (primary / secondary / danger)
and 4 specialised companions (`ButtonIcon`, `ButtonClose`, `ButtonBack`,
`ButtonCopy`). However, several recurring patterns are NOT covered and are
therefore re-implemented ad-hoc in feature files:

1. **Link buttons** — `<Link>` rendered with full button styling (landing page
   CTAs, navigation CTAs, auth footer secondary actions). No shared `ButtonLink`
   component exists at all.
2. **Ghost / outline danger button** — a "destructive outline" variant (border
   only, fills on hover). Used in `organization-danger-zone.tsx` with raw
   `<button>` + custom Tailwind classes. The Button component has no `ghost` or
   `outline-danger` variant.
3. **Compact / small-size buttons** — some UI uses `h-9`-height or `px-3`
   compact buttons; no `size` prop exists on the main `Button` component.
4. **Missing `index.ts`** — `shared/ui/button/` has no `index.ts`, breaking the
   FSD public API rule. Every consumer imports from the file path directly
   (e.g., `@/shared/ui/button/Button`).
5. **Inline re-implementations** — at least 22+ `<button>` elements and multiple
   inline-styled `<Link>` elements use custom Tailwind classes instead of the
   shared system.

## Proposed Solution

### Phase 1 — Extend Button variants & add size prop

Add a `ghost-danger` variant to `Button.tsx` (border only, fills on hover —
matching what `organization-danger-zone.tsx` does inline). Add an optional
`size` prop (`'md'` default | `'sm'`) that reduces height to `h-9` and padding
to `px-4` for compact contexts.

```
shared/ui/button/Button.tsx   ← add ghost-danger variant + size prop
shared/types/button.ts        ← add BUTTON_VARIANT.ghostDanger, ButtonSize type
```

### Phase 2 — Create ButtonLink component

A new `ButtonLink` component wraps Next.js `<Link>` and renders it with the same
visual variants as `Button`. Accepts all Button variants plus all Link props
(href, target, rel). This handles:

- Landing page CTAs (`LandingHero.tsx`)
- Auth footer secondary links
- Any place a button navigates rather than mutates

```
shared/ui/button/button-link.tsx   ← NEW component
```

**Props:**

```ts
interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant; // same 4 variants as Button
  size?: ButtonSize;
  className?: string;
  target?: string;
  rel?: string;
  external?: boolean; // auto-sets target="_blank" rel="noopener noreferrer"
}
```

### Phase 3 — Create index.ts public API

```
shared/ui/button/index.ts   ← NEW file, re-exports all 6 button components
```

```ts
export { Button } from './Button';
export { ButtonLink } from './button-link';
export { ButtonIcon } from './button-icon';
export { ButtonClose } from './button-close';
export { ButtonBack } from './button-back';
export { ButtonCopy } from './button-copy';
```

All existing imports like `@/shared/ui/button/Button` stay valid (named export),
but consumers may now also use `@/shared/ui/button`.

### Phase 4 — Replace inline buttons across features

Migrate the following files to use shared button components:

#### 4a. `ghost-danger` variant → Button

| File                                                       | Current pattern                                        | Replace with                      |
| ---------------------------------------------------------- | ------------------------------------------------------ | --------------------------------- |
| `features/organization/ui/organization-danger-zone.tsx:34` | Raw `<button>` with inline destructive outline classes | `<Button variant="ghost-danger">` |

#### 4b. Link-styled buttons → ButtonLink

| File                                         | Current pattern                               | Replace with                                                            |
| -------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| `features/landing/ui/LandingHero.tsx:88-119` | `<Link>` with inline gradient + border styles | `<ButtonLink variant="primary">` and `<ButtonLink variant="secondary">` |

#### 4c. Compact icon-area buttons → Button size="sm" or ButtonIcon

| File                                              | Current pattern                         | Replace with                                                                       |
| ------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------- |
| `features/chat/ui/chat-list.tsx:162`              | Raw text+icon `<button>` for "New Chat" | `<ButtonIcon>`                                                                     |
| `widgets/layout/ui/mobile-sidebar.tsx:78`         | Raw hamburger `<button>`                | `<ButtonIcon>`                                                                     |
| `features/calendar/ui/detach-calendar-button.tsx` | Inline Yes/Cancel confirmation buttons  | `<Button size="sm" variant="danger">` and `<Button size="sm" variant="secondary">` |
| `features/follow-up/ui/export-button.tsx`         | Custom button                           | evaluate and replace                                                               |

#### 4d. Demo & special cases — evaluate, replace where possible

- `features/demo/ui/demo-seed-button.tsx` — complex multi-state component; may
  keep its own implementation but should wrap `Button` internally where
  possible.
- `features/chat/ui/chat-input.tsx:66` — small send icon button; replace with
  `ButtonIcon` or keep as-is if visually unique.
- `features/chat/ui/chat-suggestions.tsx:63` — suggestion chip buttons;
  intentionally card-like (not a standard button variant) — keep as-is but
  document as an exception.

### Phase 5 — Update design-guardian agent

Add a "Button System" section to `.claude/agents/design-guardian.md` that:

1. Lists all 6 shared button components and their intended use cases
2. States the rule: **never create new `<button>` or button-like `<Link>`
   elements inline — always use a component from `shared/ui/button/`**
3. Documents all 4 variants (primary, secondary, danger, ghost-danger) and 2
   sizes (md, sm)
4. Lists the known exceptions (chat suggestions, landing hero badge)

## Acceptance Criteria

- [x] `shared/types/button.ts` exports `BUTTON_VARIANT.ghostDanger` and
      `ButtonSize` (`'md' | 'sm'`)
- [x] `Button.tsx` supports `variant="ghost-danger"` and `size="sm"` props with
      correct visual output and all states (default / hover / active / disabled
      / loading)
- [x] `shared/ui/button/button-link.tsx` exists and renders `<Link>` with
      correct variant styling; supports `external` prop
- [x] `shared/ui/button/index.ts` re-exports all 6 components
- [x] `organization-danger-zone.tsx` uses `<Button variant="ghost-danger">` (no
      raw inline button classes)
- [x] `LandingHero.tsx` uses `<ButtonLink>` for both CTAs (no inline style
      objects)
- [x] All other files from Phase 4 migrated or explicitly documented as
      exceptions
- [x] `npm run lint` passes on all changed files (only pre-existing complexity
      warning)
- [x] Existing tests for button components still pass
- [x] `design-guardian.md` agent updated with button system section

## Files Changed

### New files

```
shared/ui/button/button-link.tsx
shared/ui/button/index.ts
```

### Modified files

```
shared/types/button.ts
shared/ui/button/Button.tsx
features/organization/ui/organization-danger-zone.tsx
features/landing/ui/LandingHero.tsx
features/chat/ui/chat-list.tsx
widgets/layout/ui/mobile-sidebar.tsx
features/calendar/ui/detach-calendar-button.tsx
features/follow-up/ui/export-button.tsx
.claude/agents/design-guardian.md
```

### Potentially modified (evaluate during implementation)

```
features/chat/ui/chat-input.tsx
features/demo/ui/demo-seed-button.tsx
features/organization/ui/organization-settings-tabs.tsx
```

## Technical Considerations

### ButtonLink and React Compiler

`button-link.tsx` should be a **Server Component** (no `'use client'`) since it
only renders markup. `<Link>` from `next/link` works in Server Components. Add
`'use client'` only if click handlers or `useRouter` are needed.

### Testing

- Extend `shared/ui/button/__tests__/Button.test.tsx` with tests for the new
  `ghost-danger` variant and `size="sm"` prop
- Add `shared/ui/button/__tests__/button-link.test.tsx` with snapshot +
  accessibility tests
- Run `npm run test -- --ci --passWithNoTests` to ensure no regressions

### FSD compliance

`shared/ui/button/` is in the `shared` layer — correct. `ButtonLink` wrapping
Next.js `<Link>` is acceptable in `shared/ui/` since Next.js is a framework
dependency, not a feature.

### Landing page special case

`LandingHero.tsx` currently uses inline `style={}` objects (not Tailwind) for
its layout. When migrating CTAs to `ButtonLink`, preserve the surrounding div
structure. Only replace the `<Link>` elements themselves. The `tribes-glow-btn`
CSS class on the primary CTA can be kept as a `className` prop.

## Design System Alignment

**New variant — ghost-danger:**

```
default:  border border-destructive/50 bg-background text-destructive
hover:    bg-destructive text-destructive-foreground
active:   bg-destructive/90
disabled: opacity-50 cursor-not-allowed
```

**New size — sm:**

```
h-9 px-4 py-1.5 text-sm   (vs default h-10 px-6 py-2)
```

Both must use `rounded-[var(--radius-button)]` and
`transition-all duration-200`.

## References

- Existing Button: `shared/ui/button/Button.tsx`
- Existing ButtonIcon: `shared/ui/button/button-icon.tsx`
- Inline button to replace:
  `features/organization/ui/organization-danger-zone.tsx:34`
- Inline Link-as-button: `features/landing/ui/LandingHero.tsx:88-119`
- Variant types: `shared/types/button.ts`
- FSD rules: `CLAUDE.md` → "FSD Layer Rules"
- design-guardian agent: `.claude/agents/design-guardian.md`
