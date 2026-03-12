---
status: pending
priority: p2
issue_id: '007'
tags: [code-review, architecture]
---

# `MobileSidebar` placed in `shared/ui/` — should be in `widgets/`

## Problem Statement

`shared/ui/layout/mobile-sidebar.tsx` is a stateful component that renders a
fixed-position overlay, backdrop, drawer, and contains layout-specific markup
(logo placeholder). It is not a generic UI primitive — it is a structural shell,
which belongs in `widgets/` per FSD rules.

`shared/ui/` should contain stateless, reusable UI kit primitives (Button,
Input, Card). `MobileSidebar` manages drawer state, renders semantic `<aside>`,
and has domain-specific layout concerns.

Additional issue: `app/dashboard/layout.tsx` imports `MenuSidebar` from the
internal path `@/features/menu/ui/menu-sidebar` instead of through the public
API `@/features/menu`.

## Proposed Solution

1. Move `shared/ui/layout/mobile-sidebar.tsx` →
   `widgets/layout/ui/mobile-sidebar.tsx`
2. Update import in `app/dashboard/layout.tsx`:
   - From: `import MobileSidebar from '@/shared/ui/layout/mobile-sidebar'`
   - To: `import MobileSidebar from '@/widgets/layout/ui/mobile-sidebar'`
3. Fix `MenuSidebar` import to use public API:
   - From: `import MenuSidebar from '@/features/menu/ui/menu-sidebar'`
   - To: `import { MenuSidebar } from '@/features/menu'`

**Effort:** Small (move file + update 2 imports). **Risk:** Low.

## Acceptance Criteria

- [ ] `mobile-sidebar.tsx` lives in `widgets/layout/ui/`
- [ ] `shared/ui/layout/` contains no stateful components
- [ ] `layout.tsx` imports through feature public API
- [ ] Build passes after move

## Affected Files

- `shared/ui/layout/mobile-sidebar.tsx` (move to `widgets/layout/ui/`)
- `app/dashboard/layout.tsx`
- `features/menu/index.ts` (verify MenuSidebar is exported)
