---
title: 'feat: Sidebar Footer — Theme Toggle + Settings Link'
type: feat
status: completed
date: 2026-04-23
---

# feat: Sidebar Footer — Theme Toggle + Settings Link

## Overview

Move the **Settings gear icon** from the sidebar header to the sidebar footer
and add a compact **dark/light theme toggle** button next to it. The toggle
reuses the already-implemented `useTheme()` context, `updateThemePreference`
Server Action, and CSS variable system — no new backend work is required.

This is a pure frontend/UI task. All infrastructure from the previous theme
toggle plan (`2026-04-22-feat-light-dark-theme-toggle-plan.md`) is already in
place.

---

## Problem Statement

The sidebar footer (`app/dashboard/layout.tsx` lines 57–61) is currently an
empty `<div>` with only a top border. The Settings gear icon lives in the
sidebar header (line 45–51), which is an unusual placement — settings
conventionally belong in the footer of a sidebar.

Additionally, the theme can only be changed by navigating to
`/dashboard/profile/appearance` — there is no quick access from the sidebar.

---

## Current State

```tsx
// app/dashboard/layout.tsx

// Header: has Settings link — needs to MOVE to footer
<div className='flex justify-between items-center h-[var(--topbar-height)] px-6 flex-shrink-0' ...>
  <TribesLogo />
  <Link href={ROUTES.DASHBOARD.PROFILE_MENU} ...>  {/* ← MOVE this */}
    <Settings className='w-4 h-4' />
  </Link>
</div>

// Footer: currently empty — needs Settings + ThemeToggle
<div className='flex-shrink-0 px-3 py-3' style={{ borderTop: '1px solid var(--chrome-border)' }}>
  {/* empty */}
</div>
```

**Existing infrastructure (already implemented, do not recreate):**

| What                      | File                                                     |
| ------------------------- | -------------------------------------------------------- |
| `useTheme()` hook         | `app/providers/ThemeProvider.tsx`                        |
| `updateThemePreference()` | `features/user-profile/api/preferences.ts`               |
| `Theme` type              | `entities/user/model/types.ts`                           |
| Light/dark CSS variables  | `app/globals.css` (`:root` + `html[data-theme='light']`) |
| Cookie SSR init           | `app/dashboard/layout.tsx` line 22–23                    |
| Full appearance page      | `app/dashboard/profile/appearance/page.tsx`              |
| `UserPreferences` type    | `entities/user/model/types.ts`                           |

---

## Proposed Solution

### 1. New component: `SidebarFooter`

Create `features/menu/ui/sidebar-footer.tsx` — a Client Component that renders:

- Left side: theme toggle button (Sun / Moon icon, toggles on click)
- Right side: Settings gear icon link (moved from header)

Both are icon-only buttons with the same visual style as the existing Settings
link:
`w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors`.

The toggle calls `useTheme()` for current state + optimistic update, and fires
`updateThemePreference` in a `startTransition` for backend persistence (same
pattern as `AppearanceSection`).

The component needs `currentPreferences: UserPreferences` as a prop because
`updateThemePreference` requires the full current preferences object to avoid
data loss (backend replaces entire preferences JSON on write).

### 2. Update `app/dashboard/layout.tsx`

- Remove the Settings `<Link>` from the header (logo row stays, just remove the
  link — the header becomes logo-only)
- Pass `user.preferences` to `<SidebarFooter>` (user is already fetched by
  `MenuSidebar` via a shared call — verify or read from cookies/session)
- Render `<SidebarFooter>` inside the footer `<div>`

> **Note on `currentPreferences`:** The layout already reads the `wanda-theme`
> cookie. However, `updateThemePreference` requires the full `UserPreferences`
> object to merge. Check if the user is already fetched in the layout or
> `MenuSidebar` so we can reuse it without an extra API call. If not, read
> preferences from the user session/cookie, or accept that the toggle only
> persists `theme` and sends `{ theme: next }` directly (see alternatives
> below).

---

## Technical Approach

### Component: `features/menu/ui/sidebar-footer.tsx`

```tsx
'use client';

import { Moon, Settings, Sun } from 'lucide-react';
import Link from 'next/link';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { useTheme } from '@/app/providers/ThemeProvider';
import { updateThemePreference } from '@/features/user-profile/api/preferences';
import { ROUTES } from '@/shared/lib/routes';

import type { Theme, UserPreferences } from '@/entities/user';

interface Props {
  currentPreferences: UserPreferences;
}

export function SidebarFooter({ currentPreferences }: Props) {
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    const previous = theme;
    setTheme(next); // optimistic

    startTransition(async () => {
      const result = await updateThemePreference(currentPreferences, next);
      if (result.error) {
        setTheme(previous); // revert
        toast.error('Failed to save theme preference');
      }
    });
  };

  return (
    <div className='flex items-center justify-between'>
      <button
        onClick={toggleTheme}
        disabled={isPending}
        aria-label={
          theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
        }
        className='flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors disabled:opacity-50'
      >
        {theme === 'dark' ? (
          <Sun className='w-4 h-4' />
        ) : (
          <Moon className='w-4 h-4' />
        )}
      </button>

      <Link
        href={ROUTES.DASHBOARD.PROFILE_MENU}
        className='flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors'
        aria-label='Settings'
      >
        <Settings className='w-4 h-4' />
      </Link>
    </div>
  );
}
```

### Update `features/menu/index.ts`

Export `SidebarFooter` from the feature public API.

### Update `app/dashboard/layout.tsx`

```tsx
// 1. Remove Settings <Link> from the logo header row — keep only TribesLogo
<div className='flex justify-between items-center h-[var(--topbar-height)] px-6 flex-shrink-0' ...>
  <TribesLogo />
  {/* Settings link removed — moved to footer */}
</div>

// 2. Add SidebarFooter to the footer div
<div
  className='flex-shrink-0 px-3 py-3'
  style={{ borderTop: '1px solid var(--chrome-border)' }}
>
  <SidebarFooter currentPreferences={user?.preferences ?? {}} />
</div>
```

### How to get `currentPreferences` in the layout

The layout is a Server Component. Check `features/menu/api/` for how
`MenuSidebar` fetches the current user — it likely already calls
`GET /api/v1/users/me`. If so:

1. Extract the user fetch to a shared call in the layout
2. Pass `user.preferences ?? {}` as a prop to `SidebarFooter`

If the user is fetched deep inside `MenuSidebar` only, two options:

- **Option A (preferred)**: Lift the user fetch to `layout.tsx` and pass down
- **Option B (fallback)**: Read the theme from context only (no backend sync on
  toggle), and redirect to `/dashboard/profile/appearance` for full save. This
  degrades UX but avoids a prop-threading problem.

---

## Alternative: Skip `currentPreferences` Prop

If lifting the user fetch is complex, `updateThemePreference` could be changed
to fetch current preferences itself before merging. However, this adds an extra
network call per toggle. **Preferred approach is Option A** (lift fetch to
layout).

---

## Acceptance Criteria

- [x] Settings link is **no longer** in the sidebar header (logo row is
      logo-only)
- [x] Sidebar footer shows two icon buttons: theme toggle (left) and settings
      gear (right)
- [x] Clicking theme toggle immediately switches the visual theme (optimistic)
- [x] Theme preference is persisted to backend
      (`PUT /api/v1/users/me/preferences`)
- [x] On failed persistence, theme reverts to previous value + `toast.error`
      shown
- [x] Both icons match the existing icon button style (same size, hover states)
- [x] `aria-label` on toggle changes with current theme ("Switch to light theme"
      / "Switch to dark theme")
- [x] Button is disabled (with opacity) while persistence is in flight
- [x] `SidebarFooter` exported from `features/menu/index.ts`
- [x] No FSD violations: `features/menu` does not import from
      `features/user-profile` UI — `onThemeChange` callback is passed from
      `app/dashboard/layout.tsx`, keeping the Server Action import in `app/`

---

## Files to Change

| File                                  | Change                                                                                               |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `features/menu/ui/sidebar-footer.tsx` | **Create** — new Client Component                                                                    |
| `features/menu/index.ts`              | **Update** — export `SidebarFooter`                                                                  |
| `app/dashboard/layout.tsx`            | **Update** — remove Settings from header, add `<SidebarFooter>` to footer, pass `currentPreferences` |

**Note:** If user fetch needs to be lifted, also check:

- `features/menu/ui/menu-sidebar.tsx` — to understand how it currently gets the
  user

---

## Risks & Gotchas

1. **`currentPreferences` sourcing** — The biggest implementation decision.
   `MenuSidebar` is an async Server Component that fetches the user inside it.
   To avoid duplicating the fetch, extract the user call to `layout.tsx` and
   thread it as a prop. `React.cache()` or `unstable_cache` may help if the same
   fetch happens in multiple places.

2. **FSD import boundary** — `SidebarFooter` in `features/menu/` imports
   `updateThemePreference` from `features/user-profile/api/preferences.ts`. This
   is a cross-feature import of a Server Action from `api/`. Per CLAUDE.md,
   Server Actions may be imported directly by `app/` layer — but not across
   features. **Resolution**: Move `updateThemePreference` to a shared location
   (e.g., `shared/lib/theme-actions.ts`) OR keep it in `user-profile/api/` and
   import only from the `app/dashboard/layout.tsx` via a wrapper, passing the
   action as a prop. Alternatively, re-export it through a shared
   `entities/user/api/` layer.

   **Simplest fix**: Since `SidebarFooter` is rendered inside
   `app/dashboard/layout.tsx`, keep the action call inside `layout.tsx` and pass
   `onThemeChange` as a callback prop to `SidebarFooter`. This keeps the Server
   Action import in `app/` only.

3. **`isPending` UX** — A 200–500ms backend call while the toggle is "frozen"
   may feel laggy. Since the optimistic update is instant (CSS variable change),
   the `disabled` state during `isPending` can be omitted — let users click
   again and the transition will queue. Alternatively, keep disabled state with
   a subtle spinner on the icon.

---

## References

- `app/dashboard/layout.tsx:44–51` — current Settings link location to remove
- `app/dashboard/layout.tsx:57–61` — footer div to populate
- `app/providers/ThemeProvider.tsx` — `useTheme()` hook
- `features/user-profile/api/preferences.ts` — `updateThemePreference` Server
  Action
- `features/user-profile/ui/AppearanceSection.tsx` — reference implementation of
  same toggle pattern
- `entities/user/model/types.ts:11–16` — `Theme`, `UserPreferences` types
- `features/menu/ui/menu-sidebar.tsx` — check how user is fetched for lift
  decision
