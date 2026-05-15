---
title:
  "refactor: Merge 'Menu' and 'Appearance' profile tabs into single
  'Preferences' tab"
type: refactor
status: completed
date: 2026-05-15
---

# refactor: Merge 'Menu' and 'Appearance' profile tabs into single 'Preferences' tab

## Enhancement Summary

**Deepened on:** 2026-05-15 **Research agents used:** best-practices-researcher,
architecture-strategist, code-simplicity-reviewer,
pattern-recognition-specialist, learnings-researcher **Sections enhanced:**
Files Affected, Implementation Plan, Acceptance Criteria

### Key Improvements Discovered

1. **Skip `Promise.all`** — `getMenuItems()` is synchronous; calling it with
   `Promise.all` is misleading.
2. **`PreferencesSection.tsx` is the correct pattern** — every profile tab page
   delegates to a named feature component; the page itself does not own layout.
   Both `AppearanceSection` and `MenuSettingsForm` should be wrapped in a new
   `PreferencesSection.tsx`.
3. **Add sub-headings inside `PreferencesSection`** — the codebase pattern uses
   `<h2>` + `<p className="text-muted-foreground">` at the top of each section
   inside the card.
4. **Two additional files need updating** — `sidebar-footer.tsx` and
   `mobile-sidebar.tsx` both hard-link to `PROFILE_MENU` and must be updated to
   `PROFILE_PREFERENCES`.
5. **Prop name mismatch** — `MenuSettingsForm` uses `initialPrefs`, not
   `currentMenuPreferences`; verify before writing.
6. **`metadata` export required** — all meaningful profile tab pages export
   `export const metadata = { title: '...' }`.

---

## Overview

The profile page currently has two separate tabs — **Menu** and **Appearance** —
that both control the visual/layout experience of the application. Users should
not need to jump between two tabs to configure how the app looks. Merging them
into a single **"Preferences"** tab makes the intent clear and reduces
navigation clutter.

After the merge, unused routes, files, and directories must be deleted.

---

## Problem Statement

- `Menu` tab (`/dashboard/profile/menu`) — lets users reorder and show/hide
  sidebar items via drag-and-drop.
- `Appearance` tab (`/dashboard/profile/appearance`) — lets users switch between
  Dark and Light themes.

Both control **how the app looks**. Having them as separate tabs forces users to
discover two locations for what is logically one concern. A unified
**"Preferences"** tab communicates the intent immediately.

---

## Proposed Solution

### Unified tab name

**"Preferences"** — neutral, broadly understood, covers both visual layout and
theme selection. Alternatives considered:

| Candidate          | Notes                                                                |
| ------------------ | -------------------------------------------------------------------- |
| **Preferences** ✅ | Covers theme + layout. Standard in most apps (VS Code, macOS, etc.). |
| Display            | Too narrow — implies only visual display, not menu ordering.         |
| Appearance         | Already used; doesn't convey menu/layout customization.              |
| Customize          | Informal; less standard.                                             |

Tab label follows the single-word convention used by all other profile tabs
(`Account`, `Calendar`, `Telegram`).

### New route

`/dashboard/profile/preferences` replaces both `/dashboard/profile/menu` and
`/dashboard/profile/appearance`.

Old routes redirect via `next.config.ts` permanent redirects (HTTP 308) —
browser-cached, zero React render overhead, fires before middleware:

- `/dashboard/profile/menu` → `/dashboard/profile/preferences`
- `/dashboard/profile/appearance` → `/dashboard/profile/preferences`

---

## Files Affected

### Add / Create

| File                                              | Action     | Notes                                                                                                          |
| ------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `app/dashboard/profile/preferences/page.tsx`      | **Create** | Thin async Server Component — fetches `getUser()`, calls `getMenuItems()`, delegates to `PreferencesSection`   |
| `app/dashboard/profile/preferences/loading.tsx`   | **Create** | `SkeletonList rows={6}` — required by CLAUDE.md tab convention                                                 |
| `features/user-profile/ui/PreferencesSection.tsx` | **Create** | `'use client'` wrapper — renders both `AppearanceSection` and `MenuSettingsForm` with sub-headings and divider |

### Modify

| File                                            | Change                                                                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `shared/lib/routes.ts`                          | Add `PROFILE_PREFERENCES: '/dashboard/profile/preferences'`, remove `PROFILE_MENU` and `PROFILE_APPEARANCE`          |
| `features/user-profile/ui/profile-tabs-nav.tsx` | Replace Menu + Appearance entries with single `{ href: ROUTES.DASHBOARD.PROFILE_PREFERENCES, label: 'Preferences' }` |
| `features/user-profile/index.ts`                | Add export for `PreferencesSection`                                                                                  |
| `features/menu/ui/sidebar-footer.tsx`           | Update href from `ROUTES.DASHBOARD.PROFILE_MENU` to `ROUTES.DASHBOARD.PROFILE_PREFERENCES`                           |
| `widgets/layout/ui/mobile-sidebar.tsx`          | Update href from `ROUTES.DASHBOARD.PROFILE_MENU` to `ROUTES.DASHBOARD.PROFILE_PREFERENCES`                           |
| `next.config.ts`                                | Add `redirects()` array with two permanent entries                                                                   |

### Delete

| File / Directory                                       | Reason                                                         |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `app/dashboard/profile/menu/` (entire directory)       | Route replaced by `/preferences`; 308 redirect handles old URL |
| `app/dashboard/profile/appearance/` (entire directory) | Route replaced by `/preferences`; 308 redirect handles old URL |

> **Note:** The underlying components `MenuSettingsForm.tsx`,
> `AppearanceSection.tsx`, `model/menu-settings.ts`, and `api/preferences.ts`
> are **not deleted** — they are reused inside `PreferencesSection.tsx`.

---

## Implementation Plan

### Step 1 — Update navigation constants + tab strip

In `shared/lib/routes.ts`:

```ts
// Remove:
PROFILE_MENU:       '/dashboard/profile/menu',
PROFILE_APPEARANCE: '/dashboard/profile/appearance',

// Add:
PROFILE_PREFERENCES: '/dashboard/profile/preferences',
```

In `features/user-profile/ui/profile-tabs-nav.tsx`:

```ts
// Before:
{ href: ROUTES.DASHBOARD.PROFILE_MENU, label: 'Menu' },
{ href: ROUTES.DASHBOARD.PROFILE_APPEARANCE, label: 'Appearance' },

// After:
{ href: ROUTES.DASHBOARD.PROFILE_PREFERENCES, label: 'Preferences' },
```

### Step 2 — New composite component + feature index export

**`features/user-profile/ui/PreferencesSection.tsx`**

This must be a `'use client'` component because it wraps two Client Components
(`AppearanceSection` uses `useTheme`, `MenuSettingsForm` uses `useState` +
dnd-kit sensors). The sub-headings follow the exact `<h2>` +
`<p className="text-muted-foreground">` pattern used in
`ProfileAccountSection.tsx`.

> ⚠️ **Three type corrections required vs. the original plan sketch** — see
> `todos/006`. Specifically: import `UserPreferences` from `@/entities/user`
> (not `../model/types`), import `MenuProps` from `@/features/menu/model/types`
> (not `@/features/menu`), and type `preferences` as `UserPreferences` (not
> `| null`) since `AppearanceSection` does not accept null.

```tsx
'use client';

import { AppearanceSection } from './AppearanceSection';
import { MenuSettingsForm } from './MenuSettingsForm';
import type { UserPreferences } from '@/entities/user'; // correct path
import type { MenuProps } from '@/features/menu/model/types'; // correct path

interface Props {
  preferences: UserPreferences; // NOT nullable — AppearanceSection requires non-null
  allMenuItems: MenuProps[];
}

export function PreferencesSection({ preferences, allMenuItems }: Props) {
  return (
    <div className='flex flex-col gap-8'>
      <div>
        {' '}
        {/* div, not section — AppearanceSection already renders <section> internally */}
        <div className='mb-6'>
          <h2 className='text-base font-semibold'>Theme</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Choose your preferred color scheme.
          </p>
        </div>
        <AppearanceSection currentPreferences={preferences} />
      </div>

      <hr className='border-border' />

      <section>
        <div className='mb-6'>
          <h2 className='text-base font-semibold'>Navigation</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Reorder and show or hide items in the sidebar.
          </p>
        </div>
        <MenuSettingsForm
          allItems={allMenuItems}
          initialPrefs={preferences?.menu}
          currentPreferences={preferences}
        />
      </section>
    </div>
  );
}
```

Then add the export to `features/user-profile/index.ts`:

```ts
export { PreferencesSection } from './ui/PreferencesSection';
```

### Step 3 — New page

**`app/dashboard/profile/preferences/page.tsx`**

Follows the thin-page pattern established by every other profile tab (delegates
all layout to the feature component):

```tsx
import { redirect } from 'next/navigation';
import { getUser } from '@/features/user-profile/api/profile';
import { getMenuItems } from '@/features/menu';
import { PreferencesSection } from '@/features/user-profile';
import { ROUTES } from '@/shared/lib/routes';

export const metadata = { title: 'Preferences' };

export default async function ProfilePreferencesPage() {
  const { data: user } = await getUser();
  const allItems = getMenuItems(); // synchronous — no await

  if (!user) {
    redirect(ROUTES.AUTH.LOGIN); // see todos/007 — use redirect, not error paragraph
  }

  return (
    <PreferencesSection
      preferences={user.preferences ?? {}} // ?? {} because AppearanceSection requires non-null
      allMenuItems={allItems}
    />
  );
}
```

> **Do not use `Promise.all`** — `getMenuItems()` is synchronous and returns a
> plain array. Wrapping it with `Promise.all` alongside `getUser()` is
> misleading and unnecessary.
>
> **`getUser()` is memoized** via React `cache()`. If any other component in the
> same request already called it (e.g., the layout), the result is deduplicated
> automatically.

### Step 4 — Loading skeleton

**`app/dashboard/profile/preferences/loading.tsx`**

Required by CLAUDE.md: "Each sub-route must have `loading.tsx`." This covers the
implicit `<Suspense>` boundary wrapping `page.tsx` during initial navigation.

```tsx
import { SkeletonList } from '@/shared/ui/layout/skeleton';

export default function Loading() {
  return <SkeletonList rows={6} />;
}
```

`rows={6}` accounts for the merged content (theme cards + drag-drop list),
consistent with the richest existing tab (`account/loading.tsx` uses
`rows={6}`).

### Step 5 — Permanent redirects + delete old route directories

In `next.config.ts`, add a `redirects()` export. These fire at the network edge
before any React rendering — zero overhead and browser-cached after the first
visit.

```ts
async redirects() {
  return [
    {
      source: '/dashboard/profile/menu',
      destination: '/dashboard/profile/preferences',
      permanent: true, // HTTP 308 — browser caches this
    },
    {
      source: '/dashboard/profile/appearance',
      destination: '/dashboard/profile/preferences',
      permanent: true,
    },
  ];
},
```

> **Note on 308 caching:** permanent redirects are cached by browsers. If this
> is ever rolled back, users who visited the old URL will continue to be
> redirected by their browser cache until they clear it. This is the correct
> trade-off for an intentional URL consolidation.
>
> **Add `redirects()` as a sibling to the existing `headers()` method** —
> `next.config.ts` already has a `headers()` async function. Add `redirects()`
> at the same level; do not nest it or replace `headers()`.

Then delete the old route directories (redirects must exist first):

```bash
rm -rf app/dashboard/profile/menu/
rm -rf app/dashboard/profile/appearance/
```

### Step 6 — Update sidebar links

Two files hard-link to `PROFILE_MENU` and bypass the route redirect. Update them
to point directly to `PROFILE_PREFERENCES` (avoids the extra round-trip):

- `features/menu/ui/sidebar-footer.tsx` — Settings icon button href
- `widgets/layout/ui/mobile-sidebar.tsx` — Settings link href

Change `ROUTES.DASHBOARD.PROFILE_MENU` → `ROUTES.DASHBOARD.PROFILE_PREFERENCES`
in both.

### Step 7 — Sweep for stale references

After deleting the old constants, find and fix any remaining references:

```bash
grep -r "PROFILE_MENU\|PROFILE_APPEARANCE\|profile/menu\|profile/appearance" \
  --include="*.ts" --include="*.tsx" .
```

Expected: zero results after completing all steps above.

---

## Acceptance Criteria

### Functional

- [x] Profile tab strip shows: Account · Calendar · Preferences · Telegram (·
      Onboarding if applicable)
- [x] Clicking "Preferences" navigates to `/dashboard/profile/preferences`
- [x] **Theme section** with "Theme" heading is visible on the Preferences page
- [x] Theme switcher (dark/light radio cards) is functional — selection persists
      on reload
- [x] **Navigation section** with "Navigation" heading is visible below the
      divider
- [x] Menu drag-and-drop reorder is functional — changes persist on reload
- [x] Menu eye-icon show/hide toggle is functional
- [x] Visiting `/dashboard/profile/menu` redirects (308) to
      `/dashboard/profile/preferences`
- [x] Visiting `/dashboard/profile/appearance` redirects (308) to
      `/dashboard/profile/preferences`
- [x] Settings icon in sidebar and mobile sidebar link to
      `/dashboard/profile/preferences` directly

### Structural

- [x] `PROFILE_MENU` and `PROFILE_APPEARANCE` constants no longer exist anywhere
      in the codebase
- [x] `app/dashboard/profile/menu/` directory is deleted
- [x] `app/dashboard/profile/appearance/` directory is deleted
- [x] `AppearanceSection.tsx` and `MenuSettingsForm.tsx` are **not** deleted —
      still used via `PreferencesSection`

### Quality

- [x] `npm run build` passes with no TypeScript errors
- [x] `npm run lint` passes with no ESLint errors
- [x] No stale references to `PROFILE_MENU` or `PROFILE_APPEARANCE` remain
      (`grep` returns empty)

---

## Components Reused

The following remain unchanged (still referenced by `PreferencesSection`):

- `features/user-profile/ui/AppearanceSection.tsx`
- `features/user-profile/ui/MenuSettingsForm.tsx`
- `features/user-profile/model/menu-settings.ts`
- `features/user-profile/api/preferences.ts`

---

## Known Pre-existing Issue (Out of Scope)

`features/user-profile/model/menu-settings.ts` imports `MenuProps` from
`@/features/menu` — a cross-feature import that violates FSD layer rules. This
pre-dates this refactor and is **not introduced by this plan**. Do not fix it
here; track separately.

---

## References

- Profile layout: `app/dashboard/profile/layout.tsx`
- Tab nav component: `features/user-profile/ui/profile-tabs-nav.tsx`
- Menu page (to be deleted): `app/dashboard/profile/menu/page.tsx`
- Appearance page (to be deleted): `app/dashboard/profile/appearance/page.tsx`
- Menu form component: `features/user-profile/ui/MenuSettingsForm.tsx`
- Appearance component: `features/user-profile/ui/AppearanceSection.tsx`
- Account section (pattern reference):
  `features/user-profile/ui/ProfileAccountSection.tsx`
- Shared server actions: `features/user-profile/api/preferences.ts`
- Sidebar footer with settings link: `features/menu/ui/sidebar-footer.tsx`
- Mobile sidebar with settings link: `widgets/layout/ui/mobile-sidebar.tsx`
- Routes: `shared/lib/routes.ts` (lines 31–37)
- Tab navigation convention: CLAUDE.md § "Tab Navigation Convention"
