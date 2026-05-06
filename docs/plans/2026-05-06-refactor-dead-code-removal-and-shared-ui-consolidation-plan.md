---
title: "refactor: Dead Code Removal & Shared UI Component Consolidation"
type: refactor
status: active
date: 2026-05-06
---

# refactor: Dead Code Removal & Shared UI Component Consolidation

## Overview

A two-phase refactoring initiative:

1. **Dead code removal** — eliminate orphaned files, unused event-bus systems, duplicate feature-local components, and missing `index.ts` public APIs.
2. **Shared UI consolidation** — unify parallel implementations of Modal, Popup/Popover, Collapsible/Expand, Typography, Spinner, Pill/Tag, Avatar, and Status Badges under `shared/ui/` canonical components, then replace all feature-local usages with the shared versions.

All new and updated components must follow project coding rules: `PropsWithChildren`, no `any`, `'use client'` only where required, framer-motion for animations, design tokens (no raw color strings), FSD layer rules, and `index.ts` public APIs.

---

## Phase 1 — Dead Code Removal

### 1.1 Remove `GlobalPopup` event-bus system

`shared/ui/layout/global-popup.tsx` is mounted in `Providers.tsx` but **no feature dispatches `open-global-popup` or `close-global-popup` events**. It is completely dead.

**Files to delete:**
- `shared/ui/layout/global-popup.tsx`

**Files to edit:**
- `app/Providers.tsx` — remove `<GlobalPopup />` import and JSX

### 1.2 Remove `features/dashboard/` orphaned feature

`features/dashboard/` was superseded by `features/main-dashboard/`. Its components are not imported anywhere in `app/`.

**Files to delete:**
- `features/dashboard/` (entire directory)

Verify no imports remain with: `grep -r "features/dashboard" app/ features/ --include="*.ts" --include="*.tsx"`

### 1.3 Remove `features/today-briefing/ui/collapsible-section.tsx` duplicate

`shared/ui/layout/collapsible-section.tsx` is the canonical `CollapsibleSection`. The `today-briefing` copy diverges only in prop name (`defaultExpanded` vs `defaultOpen`) and lacks animation.

**Action:** Migrate callers inside `features/today-briefing/` to the shared component (align prop names), then delete:
- `features/today-briefing/ui/collapsible-section.tsx`

### 1.4 Audit and remove `features/participants/` FSD violation

`features/participants/index.ts` re-exports from `shared/ui/` — a downward layer violation. Determine if this feature has any active callers; if not, delete it. If it does, move participant UI to `shared/ui/participant/` (where it already partially lives) or `entities/participant/`.

**Files to investigate:**
- `features/participants/index.ts`
- `features/participants/api/`, `features/participants/lib/`, `features/participants/model/`, `features/participants/ui/`

### 1.5 Clean up missing `index.ts` in `shared/ui/` subdirectories

These subdirectories lack a public-API barrel file, forcing consumers to use deep import paths and discouraging adoption:

| Directory | Action |
|-----------|--------|
| `shared/ui/modal/` | Create `index.ts` exporting `Modal`, `ModalRoot`, `ModalHeader`, `ModalBody`, `ModalFooter`, `ModalContext` |
| `shared/ui/layout/` | Create `index.ts` exporting `CollapsibleSection`, `Skeleton`, `SkeletonList`, `SpinLoader`, `ComponentHeader`, `InfiniteScrollStatus`, `CollapsedSidePanel`, `GenericList` |
| `shared/ui/typography/` | Create `index.ts` exporting `H1`, `H2`, `H3`, `H4` |
| `shared/ui/card/` | Create `index.ts` exporting `Card`, `CardBody` |
| `shared/ui/feedback/` | Create `index.ts` exporting `EmptyState` |
| `shared/ui/input/` | Create `index.ts` exporting `Input`, `InputPassword`, `InputTextarea`, `InputDropdown`, `Checkbox`, `Error` (as `InputError`), `Textarea` |
| `shared/ui/common/` | Create `index.ts` exporting `Avatar` |
| `shared/ui/table/` | Create `index.ts` exporting `SortableHeader` |
| `shared/ui/error/` | Create `index.ts` exporting `ErrorDisplay` |
| `shared/ui/popup/` | Create `index.ts` exporting `PopupContext`, `PopupContextValue`, `PopupConfig` |
| `shared/ui/participant/` | Create `index.ts` exporting all participant components |
| `shared/ui/animation/` | Create `index.ts` exporting `Hover` |

### 1.6 Remove `shared/lib/buttons.ts`

A small object of generic string constants (`CREATE`, `SAVE`, `ADD`, `CANCEL`, `DELETE`, `BACK`, `INVITE`) with 6 callers. These strings provide no value as a shared abstraction — the labels often need to differ per context. Replace all 6 call sites with inline string literals and delete the file.

**Files to edit (replace `BUTTONS.X` → literal string):**
- Find with: `grep -r "from.*buttons\|BUTTONS\." features/ --include="*.tsx" --include="*.ts" -l`

---

## Phase 2 — Shared UI Consolidation

### 2.1 Modal system: consolidate `Modal` + `ModalRoot`

**Current state:**
- `shared/ui/modal/modal.tsx` — `Modal` component (simple, no portal, framer-motion backdrop, renders inline). Used by: `delete-organization-modal`, `add-decision-modal`, `decision-detail-modal`, `chat-form-modal`, `issue-form`.
- `shared/ui/modal/modal-root.tsx` — `ModalRoot` (portal via `createPortal`, `AnimatePresence`, `useSyncExternalStore`). Used by: `kanban-card-modal`.
- `shared/ui/modal/modal-header.tsx`, `modal-body.tsx`, `modal-footer.tsx` — slot components. Used by: `methodology-delete-modal`, `team-member-add-modal`, `team-notification-settings`, `event-popup`, `deprecated-followup-modal`, `kanban-card-modal`.

**Problem:** Two modal primitives with different portaling behavior. Callers of `Modal` get no portal (may clip inside overflow containers). `ModalRoot` is the correct implementation (portal-based, hydration-safe).

**Action — upgrade `Modal` to be a high-level composition of `ModalRoot`:**

```tsx
// shared/ui/modal/modal.tsx — new version
'use client';

import { type PropsWithChildren } from 'react';
import { ModalRoot } from './modal-root';
import ModalHeader from './modal-header';
import ModalBody from './modal-body';

export type ModalProps = PropsWithChildren<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg'; // max-w-md | max-w-xl | max-w-3xl
}>;

export function Modal({ isOpen, onClose, title, size = 'md', children }: ModalProps) {
  return (
    <ModalRoot open={isOpen} onClose={onClose} size={size}>
      <ModalHeader title={title} onClick={onClose} />
      <ModalBody>{children}</ModalBody>
    </ModalRoot>
  );
}
```

**`ModalRoot` gains `size` prop:**
```tsx
// Add to ModalRoot props:
size?: 'sm' | 'md' | 'lg';
// Map: sm → max-w-md, md → max-w-xl (current default), lg → max-w-3xl
```

**Migrate all `<Modal>` callers** to verify they still work after the composition change (API stays the same). The `methodology-delete-modal`, `kanban-card-modal`, `team-*`, `event-popup`, `deprecated-followup-modal` callers that use `ModalRoot` + separate slots can remain as-is.

**Files to update:**
- `shared/ui/modal/modal.tsx` — rewrite as composition
- `shared/ui/modal/modal-root.tsx` — add `size` prop
- `shared/ui/modal/index.ts` — new barrel

### 2.2 Popup system: unify `usePopup` + positioning logic

**Current state:**
- `shared/ui/popup/popup-context.ts` + `shared/hooks/use-popup.ts` — shared popup hook and context
- `shared/ui/layout/global-popup.tsx` — dead event-bus popup (deleted in Phase 1)
- Feature-local popup implementations:
  - `features/meetings/ui/meeting-calendar-popover.tsx` — custom positioning
  - `features/event/ui/event-popup.tsx` — uses `ModalBody/Header/Footer` but is a popover-style UI, not a modal
  - `features/event/ui/event-popup-all.tsx` — another local popup
  - `features/demo/ui/demo-dropdown.tsx` — local dropdown
  - `features/calendar/ui/event.tsx` — local popup behavior
  - `features/user/ui/user-menu-popup.tsx` — uses `usePopup` correctly ✅

**Action — create `shared/ui/popup/Popup.tsx`:**

A positioned floating container component that uses the existing `PopupContext` and `usePopup` hook. Features:
- Portal-based (`createPortal` to `document.body`)
- Auto-positioning: prefer `bottom`, flip to `top` when no space
- `offset` prop for gap from anchor
- `onClose` called on click-outside and Escape
- Animated with framer-motion `AnimatePresence`

```tsx
// shared/ui/popup/Popup.tsx
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { type PropsWithChildren, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type PopupProps = PropsWithChildren<{
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  width?: number;
  offset?: number;
}>;
```

**Migrate callers** to use `<Popup>` where they currently build custom positioning logic. `event-popup.tsx` should be migrated from modal layout to popup layout.

**Files to create:**
- `shared/ui/popup/Popup.tsx`
- Update `shared/ui/popup/index.ts` to export `Popup`, `PopupContext`, `PopupContextValue`, `PopupConfig`

### 2.3 Collapsible/Expand component: consolidate

**Current state:**
- `shared/ui/layout/collapsible-section.tsx` — canonical, animated, `defaultOpen`, `extraContent` slot ✅
- `features/today-briefing/ui/collapsible-section.tsx` — local duplicate (deleted in Phase 1)
- 6 features with inline `useState` expand/collapse (no animation)

**Action — extend `CollapsibleSection` with a variant:**
Add `variant?: 'section' | 'inline'`:
- `section` (default) — current full behavior with label row and `extraContent`
- `inline` — minimal: just a toggle button + animated content, no label row, for ad-hoc use inside lists

Then migrate inline expand/collapse patterns in:
- `features/agents/ui/today-activity-feed.tsx`
- `features/chat/ui/artifact-panel.tsx`
- `features/chat/ui/chat-list.tsx`
- `features/decisions/ui/decisions-page.tsx`
- `features/issues/ui/issues-page.tsx`
- `features/kanban/ui/kanban-board.tsx`

Also unify the two `archived-section-toggle` / `archived-done-toggle` components in issues and kanban — they are identical. Move to `shared/ui/layout/archived-section-toggle.tsx` and import from there in both features.

**Files to update:**
- `shared/ui/layout/collapsible-section.tsx` — add `variant` prop
- `shared/ui/layout/archived-section-toggle.tsx` — new shared file
- `features/issues/ui/archived-section-toggle.tsx` — replace with import
- `features/kanban/ui/archived-done-toggle.tsx` — replace with import

### 2.4 Typography: add `index.ts` and migrate raw headings

**Current state:**
- `shared/ui/typography/H1.tsx` – `H2.tsx` – `H3.tsx` – `H4.tsx` exist but have no `index.ts`
- 34+ raw `<h1>`–`<h3>` usages in ~25 files bypass the shared components

**Action:**
1. Create `shared/ui/typography/index.ts` exporting `H1`, `H2`, `H3`, `H4`
2. Migrate raw headings to shared components in:

| File | Pattern to replace |
|------|--------------------|
| `features/summary/ui/FollowupStats.tsx` | `<h2 className='text-lg font-semibold text-foreground'>` → `<H3>` |
| `features/summary/ui/MeetingStats.tsx` | same |
| `features/summary/ui/ParticipantStats.tsx` | same |
| `features/summary/ui/TaskStats.tsx` | same |
| `features/summary/ui/TeamStats.tsx` | same |
| `features/meetings/ui/meeting-detail.tsx` | `<h1 className='text-2xl font-semibold...'>` → `<H2>` |
| `app/dashboard/meetings/[id]/overview/page.tsx` | same |
| (remaining ~18 files) | audit and migrate |

**Note:** H3 currently renders `text-lg font-semibold` — verify this matches the raw pattern `text-lg font-semibold text-foreground` used in summary files. Adjust `H3` if needed.

### 2.5 Spinner/Loader: standardize on `SpinLoader`

**Current state:**
- `shared/ui/layout/spin-loader.tsx` — `SpinLoader` exists ✅
- 8+ inline spinner implementations using raw `border-t-transparent animate-spin` divs or `Loader2` from lucide-react

**Action — extend `SpinLoader` with `size` prop:**
```tsx
type SpinLoaderProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
};
// xs → w-3 h-3, sm → w-4 h-4, md → w-6 h-6 (default), lg → w-8 h-8
```

Then replace all inline spinners:

| File | Replace |
|------|---------|
| `features/issues/ui/critical-path-page.tsx` | 3× inline divs → `<SpinLoader size="md" />` and `<SpinLoader size="xs" />` |
| `features/chat/ui/chat-window.tsx` | inline div → `<SpinLoader>` |
| `features/demo/ui/demo-seed-button.tsx` | inline div → `<SpinLoader size="sm">` |
| `features/demo/ui/demo-dropdown.tsx` | inline div → `<SpinLoader size="sm">` |
| `app/dashboard/chat/[id]/loading.tsx` | `Loader2` → `<SpinLoader>` |
| `features/today-briefing/ui/ai-prep-panel.tsx` | `Loader2` x2 → `<SpinLoader>` |
| `features/today-briefing/ui/ai-nudge.tsx` | `Loader2` → `<SpinLoader>` |
| `features/chat/ui/chat-list.tsx` | `Loader2` → `<SpinLoader>` |
| `features/follow-up/ui/deprecated-followup-modal.tsx` | `Loader2` → `<SpinLoader>` |
| `shared/ui/participant/participant-matching.tsx` | `Loader2` → `<SpinLoader>` |
| `entities/artifact/ui/artifact-card.tsx` | `Loader2` → `<SpinLoader>` |

### 2.6 Create `Pill` / `Tag` shared component

**Current state:** A recurring `rounded-full border border-border bg-background px-3 py-1.5 text-sm` pill pattern appears 10+ times in `features/meetings/ui/meeting-detail.tsx`, `app/dashboard/meetings/[id]/overview/page.tsx`, `features/meetings/ui/bot-toggle-button.tsx`, `features/meetings/ui/meeting-calendar-popover.tsx` — no shared component exists.

**Action — create `shared/ui/common/pill.tsx`:**
```tsx
// shared/ui/common/pill.tsx
import type { PropsWithChildren } from 'react';
import clsx from 'clsx';

type PillProps = PropsWithChildren<{
  className?: string;
  onClick?: () => void;
}>;

export function Pill({ children, className, onClick }: PillProps) {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      onClick={onClick}
      className={clsx(
        'inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground',
        onClick && 'cursor-pointer hover:bg-accent transition-colors',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
```

Then migrate all 10+ inline pill usages to `<Pill>`.

### 2.7 Avatar: support colored initials

**Current state:**
- `shared/ui/common/avatar.tsx` — `Avatar` exists but uses a fixed `bg-primary` background, no color function support.
- 2 files use `avatarColor(name)` utility manually: `features/teams/ui/dashboard/team-dashboard-tab-people.tsx` and `entities/artifact/ui/people-list.tsx`.

**Action — extend `Avatar` with `colorFn` prop:**
```tsx
type AvatarProps = {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  colorFn?: (name: string) => string; // returns a Tailwind bg class
  className?: string;
};
```

Update the two callers to use `<Avatar name={...} colorFn={avatarColor}>`.

### 2.8 Status Badge: merge `IssueStatusBadge` and `TaskStatusBadge`

**Current state:**
- `features/issues/ui/issue-status-badge.tsx` — `IssueStatusBadge` with 6 status variants
- `features/today-briefing/ui/task-status-badge.tsx` — `TaskStatusBadge` with identical 6 status variants + `isOverdue` prop

These two map the same domain concept (issue/task status) with identical variant→label→Badge-variant mappings.

**Action — create `entities/issue/ui/issue-status-badge.tsx`:**
Merge into one component with optional `isOverdue` prop. Export from `entities/issue/index.ts`. Update callers in both features to import from the entity.

The `MeetingTaskStatusBadge` (4 statuses, icons) and `AgentRunStatusBadge` (string normalization) are distinct enough to remain feature-local for now.

### 2.9 `decision-source-badge`: use design tokens

`features/decisions/ui/decision-source-badge.tsx` uses raw Tailwind color strings (`bg-blue-500/10 text-blue-400`, `bg-violet-500/10 text-violet-400`, etc.) instead of `Badge` variants and CSS design tokens.

**Action:** Rewrite to use `Badge` with `className` overrides using `var(--color-primary)` and design-system palette, or extend `Badge` variants if these are recurring patterns.

---

## Acceptance Criteria

### Phase 1 — Dead Code

- [ ] `GlobalPopup` removed from `shared/ui/layout/` and `Providers.tsx`
- [ ] `features/dashboard/` directory deleted, no remaining imports
- [ ] `features/today-briefing/ui/collapsible-section.tsx` deleted, all callers migrated to shared
- [ ] `features/participants/` audited and either cleaned or removed
- [ ] All `shared/ui/*/index.ts` barrel files created for the 12 listed directories
- [ ] `shared/lib/buttons.ts` deleted, 6 callers use inline strings

### Phase 2 — UI Consolidation

- [ ] `Modal` is a portal-based composition (wraps `ModalRoot`); all 5 callers still work
- [ ] `ModalRoot` accepts `size` prop; kanban modal uses `size='lg'` if needed
- [ ] `shared/ui/modal/index.ts` exports all modal pieces
- [ ] `shared/ui/popup/Popup.tsx` created; `event-popup` and `meeting-calendar-popover` migrated
- [ ] `CollapsibleSection` has `variant` prop; 6 inline expand patterns migrated
- [ ] `archived-section-toggle` shared across issues and kanban
- [ ] `shared/ui/typography/index.ts` created; raw `<h*>` tags in 25+ files replaced
- [ ] `SpinLoader` has `size` prop; 11 inline spinner implementations replaced
- [ ] `shared/ui/common/Pill.tsx` created; 10+ inline pill usages replaced
- [ ] `Avatar` accepts `colorFn`; 2 callers updated
- [ ] `IssueStatusBadge` / `TaskStatusBadge` merged into `entities/issue/`
- [ ] `decision-source-badge` uses design tokens / `Badge` variants
- [ ] `shared/lib/buttons.ts` removed (Phase 1), inline strings used instead
- [ ] All migrated files pass `npm run lint` and `npm run build` with no errors
- [ ] Existing test suites pass (no regressions in ~1107 tests)

---

## Implementation Order

To minimize merge conflicts, work in this sequence:

1. **Phase 1 only** (delete dead code, add `index.ts` barrels) — smallest blast radius, easy to review
2. **Modal consolidation** (2.1) — foundational; many other components depend on it
3. **Spinner** (2.5) — widespread, mechanical, low risk
4. **Typography** (2.4) — widespread, mechanical, low risk
5. **Pill** (2.6) — new component + migration, low risk
6. **CollapsibleSection** (2.3) — requires API extension + migration
7. **Popup** (2.2) — requires new component + positioning logic
8. **Avatar** (2.7), **StatusBadge merge** (2.8), **DecisionBadge** (2.9) — isolated changes

---

## Files at a Glance

### Delete
- `shared/ui/layout/global-popup.tsx`
- `features/dashboard/` (entire)
- `features/today-briefing/ui/collapsible-section.tsx`
- `shared/lib/buttons.ts`

### Create
- `shared/ui/modal/index.ts`
- `shared/ui/layout/index.ts`
- `shared/ui/typography/index.ts`
- `shared/ui/card/index.ts`
- `shared/ui/feedback/index.ts`
- `shared/ui/input/index.ts`
- `shared/ui/common/index.ts`
- `shared/ui/table/index.ts`
- `shared/ui/error/index.ts`
- `shared/ui/popup/index.ts`
- `shared/ui/participant/index.ts`
- `shared/ui/animation/index.ts`
- `shared/ui/popup/Popup.tsx`
- `shared/ui/common/pill.tsx`
- `shared/ui/layout/archived-section-toggle.tsx`
- `entities/issue/ui/issue-status-badge.tsx`
- `entities/issue/index.ts` (or update existing)

### Modify
- `app/Providers.tsx` — remove `GlobalPopup`
- `shared/ui/modal/modal.tsx` — rewrite as `ModalRoot` composition
- `shared/ui/modal/modal-root.tsx` — add `size` prop
- `shared/ui/layout/collapsible-section.tsx` — add `variant` prop
- `shared/ui/layout/spin-loader.tsx` — add `size` prop
- `shared/ui/common/avatar.tsx` — add `colorFn` prop
- ~25 files with raw `<h*>` headings
- ~11 files with inline spinners
- ~10 files with inline pill patterns
- 5 callers of old `Modal` component
- 6 callers of `BUTTONS.*` constants
- 2 callers of `archived-section-toggle` / `archived-done-toggle`
- 2 callers using manual `avatarColor` without `Avatar`
- 2 callers of `IssueStatusBadge`/`TaskStatusBadge` (post-merge)

---

## References

### Internal
- `shared/ui/modal/modal-root.tsx` — canonical portal modal (correct base)
- `shared/ui/modal/modal.tsx` — to be rewritten as composition
- `shared/ui/layout/collapsible-section.tsx` — canonical collapsible
- `shared/ui/layout/spin-loader.tsx` — canonical spinner
- `shared/ui/badge/Badge.tsx` — base badge primitive
- `shared/hooks/use-modal.ts`, `shared/hooks/use-popup.ts` — existing hooks
- `shared/ui/popup/popup-context.ts` — popup context
- `app/Providers.tsx` — root providers (remove `GlobalPopup`)
- `features/issues/ui/archived-section-toggle.tsx` — to be moved to shared
- `features/kanban/ui/archived-done-toggle.tsx` — to be replaced by shared

### Coding rules to follow
- `PropsWithChildren` for components accepting children (custom ESLint rule)
- `>3 inline props` must be extracted to `interface Props`
- `'use client'` only for interactive components
- framer-motion `AnimatePresence` + `motion.div` for all show/hide animations
- Design tokens: `bg-card`, `text-foreground`, `border-border`, `var(--radius-card)` — never raw color hex
- `clsx` for conditional class composition
- No `any` — explicit types everywhere
