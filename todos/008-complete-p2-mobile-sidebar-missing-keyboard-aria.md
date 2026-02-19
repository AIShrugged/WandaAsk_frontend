---
status: pending
priority: p2
issue_id: "008"
tags: [code-review, accessibility]
---

# `MobileSidebar` missing keyboard accessibility and ARIA dialog role

## Problem Statement

`shared/ui/layout/mobile-sidebar.tsx` (or `widgets/layout/ui/mobile-sidebar.tsx` after #007) has these accessibility gaps:

1. **No Escape key handler** — keyboard users cannot close the drawer without clicking. This is WCAG 2.1 SC 2.1.2 failure.
2. **No `role="dialog"` + `aria-modal="true"`** on the `<aside>` when open — screen readers continue reading background content behind the open drawer.
3. **`<aside>` always in DOM without `aria-hidden`** — when closed, the sidebar navigation is still discoverable in the accessibility tree on mobile.
4. **Logo hardcoded as "logo" text** — placeholder text is rendering in production UI.

## Proposed Solutions

### Escape key handler
```typescript
useEffect(() => {
  if (!isOpen) return;
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsOpen(false);
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [isOpen]);
```

### ARIA dialog role
```tsx
<aside
  id='mobile-sidebar'
  role='dialog'
  aria-modal={isOpen}
  aria-hidden={!isOpen}
  aria-label='Navigation'
  ...
>
```

### Logo placeholder
Either accept a `logo` prop or create `shared/ui/common/Logo.tsx` and import it.

## Acceptance Criteria
- [ ] Pressing Escape when drawer is open closes it
- [ ] `role="dialog"` and `aria-modal="true"` set on `<aside>` when open
- [ ] `aria-hidden={!isOpen}` on `<aside>` so background nav not accessible when closed
- [ ] Logo placeholder replaced with real component or prop

## Affected Files
- `shared/ui/layout/mobile-sidebar.tsx` (or new widgets location)
