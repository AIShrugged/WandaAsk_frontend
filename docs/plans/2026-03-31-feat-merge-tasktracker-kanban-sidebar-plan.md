---
title: 'feat: Merge Tasktracker and Kanban into one sidebar group'
type: feat
status: completed
date: 2026-03-31
---

# feat: Merge Tasktracker and Kanban into one sidebar group

## Overview

Currently the sidebar has two separate top-level items:

- **Tasktracker** (position 30) → `/dashboard/issues`
- **Kanban** (position 40) → `/dashboard/kanban`

The goal is to collapse them into a single collapsible parent item called
**"Tasktracker"** with two children:

- **Tasktracker** → `/dashboard/issues`
- **Kanban** → `/dashboard/kanban`

Page logic, API layer, and visual design of the individual pages stay unchanged.

---

## Current State

### Sidebar (`features/menu/lib/options.ts`)

```ts
// Two separate flat items:
{ id: 'issues',  label: 'Tasktracker', icon: 'bug',    href: ROUTES.DASHBOARD.ISSUES,  position: 30 },
{ id: 'kanban',  label: 'Kanban',      icon: 'kanban', href: ROUTES.DASHBOARD.KANBAN,  position: 40 },
```

### MenuProps type (`features/menu/model/types.ts`)

```ts
export interface MenuProps {
  id: string;
  label: string;
  icon?: keyof typeof ICONS_MAP;
  href?: string;
  activeHref?: string;
  children?: MenuProps[]; // ✅ Already supports nested items
  position: number;
}
```

### NestedMenuItem (`features/menu/ui/menu-nested-item.tsx`)

Already supports `children` — renders a collapsible `motion.div` with child
`NestedMenuItem` items. When a parent has children:

- It is **not** a `<Link>` (click toggles open/close)
- Children are rendered at `level + 1` with increased left padding

### activeHref behaviour

`isActive` is `true` when
`pathname === activeHref || pathname.startsWith(`${activeHref}/`)`.  
The parent group should highlight when either child route is active.

---

## Proposed Change

### Only file to modify: `features/menu/lib/options.ts`

Replace the two separate items with one parent entry that has `children`:

```ts
{
  id: 'tasktracker-group',
  label: 'Tasktracker',
  icon: 'bug',
  // No href — parent is a toggle, not a link
  activeHref: ROUTES.DASHBOARD.ISSUES,   // highlights when on /issues or /kanban
  position: 30,
  children: [
    {
      id: 'issues',
      label: 'Tasktracker',
      icon: 'bug',
      href: ROUTES.DASHBOARD.ISSUES,
      position: 10,
    },
    {
      id: 'kanban',
      label: 'Kanban',
      icon: 'kanban',
      href: ROUTES.DASHBOARD.KANBAN,
      position: 20,
    },
  ],
},
// Remove the standalone 'kanban' item at position 40
```

> **Note on `activeHref` for the parent:** the current `isActive` check uses
> `startsWith`, so setting `activeHref: ROUTES.DASHBOARD.ISSUES`
> (`/dashboard/issues`) will only light up the parent when on the Issues page.  
> For Kanban `/dashboard/kanban` the parent won't auto-highlight unless we
> extend the active detection.
>
> **Two options:**
>
> - **Option A (simple):** Accept that only `/dashboard/issues` highlights the
>   parent. Low effort, minor UX gap.
> - **Option B (correct):** Add an `activeHrefs?: string[]` field to `MenuProps`
>   and check any of them. Requires small type + component update.
>
> **Recommendation: Option B** — keep UX consistent. Small change.

---

## Implementation Steps

### Step 1 — Extend `MenuProps` type (if Option B)

**File:** `features/menu/model/types.ts`

```ts
export interface MenuProps {
  id: string;
  label: string;
  icon?: keyof typeof ICONS_MAP;
  href?: string;
  activeHref?: string;
  activeHrefs?: string[]; // NEW: multiple active matchers
  children?: MenuProps[];
  position: number;
}
```

### Step 2 — Update `NestedMenuItem` active check (if Option B)

**File:** `features/menu/ui/menu-nested-item.tsx`

```ts
// Before
const activeHref = item.activeHref ?? item.href;
const isActive = activeHref
  ? pathname === activeHref || pathname.startsWith(`${activeHref}/`)
  : false;

// After
const activeHrefs =
  item.activeHrefs ??
  (item.activeHref ? [item.activeHref] : item.href ? [item.href] : []);
const isActive = activeHrefs.some(
  (href) => pathname === href || pathname.startsWith(`${href}/`),
);
```

### Step 3 — Update `getMenuItems` in `options.ts`

**File:** `features/menu/lib/options.ts`

- Remove the `'kanban'` top-level item
- Change `'issues'` item to a parent group with `children`:

```ts
{
  id: 'tasktracker-group',
  label: 'Tasktracker',
  icon: 'bug',
  activeHrefs: [ROUTES.DASHBOARD.ISSUES, ROUTES.DASHBOARD.KANBAN],
  position: 30,
  children: [
    {
      id: 'issues',
      label: 'Tasktracker',
      icon: 'bug',
      href: ROUTES.DASHBOARD.ISSUES,
      position: 10,
    },
    {
      id: 'kanban',
      label: 'Kanban',
      icon: 'kanban',
      href: ROUTES.DASHBOARD.KANBAN,
      position: 20,
    },
  ],
},
```

### Step 4 — Auto-open parent when child is active (UX polish)

**File:** `features/menu/ui/menu-nested-item.tsx`

The `useState(false)` initialises the group as closed. If the user navigates
directly to `/dashboard/kanban` (e.g. via bookmark), the parent will be closed
and the child won't be visible.

Fix: initialise `isOpen` from `isActive`:

```ts
const [isOpen, setIsOpen] = useState(isActive);
```

> This also means the group will be open on first render if the current page is
> inside the group.

### Step 5 — Verify no other references to `ROUTES.DASHBOARD.KANBAN` in navigation

Search for any hardcoded navigation references to `/dashboard/kanban` outside of
`options.ts` (e.g. redirect links, breadcrumbs, quick-links in the home
dashboard). Update labels where needed but do **not** change the route constant
or page files.

---

## Files to Change

| File                                    | Change                                                            |
| --------------------------------------- | ----------------------------------------------------------------- |
| `features/menu/model/types.ts`          | Add `activeHrefs?: string[]`                                      |
| `features/menu/ui/menu-nested-item.tsx` | Use `activeHrefs` for active check; init `isOpen` from `isActive` |
| `features/menu/lib/options.ts`          | Replace two flat items with one parent+children group             |

**Files NOT to change:**

- `shared/lib/routes.ts` — `ROUTES.DASHBOARD.KANBAN` and
  `ROUTES.DASHBOARD.ISSUES` remain as-is
- `app/dashboard/kanban/page.tsx` — page unchanged
- `app/dashboard/issues/page.tsx` — page unchanged
- Any `features/issues/` or `features/kanban/` API/UI files

---

## API Check

Both pages use the same backend `/issues` endpoint:

- Issues page: `GET /api/v1/issues` with list filters
- Kanban page: `GET /api/v1/issues` grouped by status +
  `PATCH /api/v1/issues/:id` for drag-drop moves

No API changes needed. Verify the existing calls still work after the sidebar
change by loading both pages after implementation.

---

## Acceptance Criteria

- [x] Sidebar shows a single **"Tasktracker"** item at position 30 (no separate
      Kanban item)
- [x] Clicking **"Tasktracker"** in the sidebar expands/collapses a nested list
      with two children: "Tasktracker" and "Kanban"
- [x] Navigating to `/dashboard/issues` activates both the parent and the
      "Tasktracker" child
- [x] Navigating to `/dashboard/kanban` activates both the parent and the
      "Kanban" child
- [x] On direct navigation to either child route, the parent group is auto-open
      (not collapsed)
- [x] Both pages load correctly and all API calls succeed (no regressions)
- [x] `npm run lint` passes with no new errors
- [x] `npm run build` completes without TypeScript errors

---

## Post-Implementation Verification

```bash
# Lint
npm run lint

# Type check
npx tsc --noEmit

# Build
npm run build
```

Manually test:

1. Navigate to `/dashboard/issues` → Tasktracker group is open, Issues child is
   highlighted
2. Navigate to `/dashboard/kanban` → Tasktracker group is open, Kanban child is
   highlighted
3. Navigate to a different page → Tasktracker group collapses (or stays open per
   UX preference)
4. Drag a kanban card between columns → PATCH request succeeds
5. Create/edit an issue → API calls succeed
