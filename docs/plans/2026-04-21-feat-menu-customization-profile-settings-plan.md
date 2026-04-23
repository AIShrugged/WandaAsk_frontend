---
title: 'feat: Customizable Menu Sidebar with Profile Settings'
type: feat
status: completed
date: 2026-04-21
---

# feat: Customizable Menu Sidebar with Profile Settings

## Overview

Allow users to customize which sidebar menu items are visible and in what order.
The menu is split into a **primary** section and a **secondary** section
(separated by a divider). Users configure both sections from a new "Menu" tab in
their profile page, with drag-and-drop reordering. Preferences are persisted
per-user in the backend (new `preferences` JSON column on the `users` table).

---

## Problem Statement

The sidebar menu is currently hardcoded in `features/menu/lib/options.ts`. Every
user sees the same 9 items in the same order, regardless of their role or
workflow. Power users who live in AI Chat shouldn't wade past Meetings and
Methodology. There is no way to hide irrelevant items or bring important ones to
the top.

---

## Proposed Solution

### Menu structure changes

Split the existing flat menu list into two sections with a visual `<hr>`
divider:

- **Primary section** — items the user has pinned as important (shown above
  divider)
- **Secondary section** — remaining visible items (shown below divider)
- **Hidden items** — items the user has toggled off (never rendered)

Each item retains its existing `id`, `label`, `icon`, `href`, and `position`
from `options.ts`. Preferences store only the user's customization delta: which
items are visible, which section they belong to, and their order within the
section.

### Profile tab

A new **Menu** tab added to the profile page at `/dashboard/profile/menu`. This
page contains a drag-and-drop UI with three zones:

1. **Primary** — sortable list of pinned items
2. **Secondary** — sortable list of secondary items
3. **Hidden** — items toggled off (can drag back to primary/secondary)

Items can be dragged between zones and reordered within each zone. A toggle
switch (or drag to Hidden) hides an item. Changes are saved with an explicit
**Save** button that calls the backend preferences endpoint.

### Backend changes

New migration adds a nullable `preferences` JSON column to the `users` table.
New endpoint `PUT /api/v1/users/me/preferences` accepts and stores the full
preferences object. The `GET /api/v1/users/me` response is extended to include
`preferences`.

---

## Technical Approach

### Backend (Laravel)

#### Migration

```php
// database/migrations/2026_04_21_000001_add_preferences_to_users_table.php
Schema::table('users', function (Blueprint $table) {
    $table->json('preferences')->nullable()->after('is_demo');
});
```

#### User model update

```php
// app/Models/User.php
protected $fillable = [..., 'preferences'];
protected $casts = [..., 'preferences' => 'array'];
```

#### New FormRequest

```
app/Http/Requests/API/v1/UpdateUserPreferencesRequest.php
```

Validates structure:

```php
'menu' => ['nullable', 'array'],
'menu.primary' => ['nullable', 'array'],
'menu.primary.*.id' => ['required', 'string'],
'menu.primary.*.visible' => ['required', 'boolean'],
'menu.secondary' => ['nullable', 'array'],
'menu.secondary.*.id' => ['required', 'string'],
'menu.secondary.*.visible' => ['required', 'boolean'],
```

#### New Controller / Route

```
app/Http/Controllers/API/v1/UserPreferencesController.php
  → update(UpdateUserPreferencesRequest $request): JsonResponse
```

Route in `routes/api.php`:

```php
Route::put('/users/me/preferences', [UserPreferencesController::class, 'update']);
```

#### Extend UserResource / /me response

The `/api/v1/users/me` inline closure must include `preferences`:

```php
return response()->json([
    ...$request->user()->only(['id', 'name', 'email', ...]),
    'preferences' => $request->user()->preferences,
]);
```

---

### Frontend

#### 1. New route constants

```ts
// shared/lib/routes.ts
PROFILE_MENU: '/dashboard/profile/menu',
```

#### 2. User preferences types

```ts
// entities/user/model/types.ts  (extend UserProps)
interface MenuItemPreference {
  id: string;
  visible: boolean;
}

interface UserMenuPreferences {
  primary: MenuItemPreference[];
  secondary: MenuItemPreference[];
}

interface UserPreferences {
  menu?: UserMenuPreferences;
}

// Add to UserProps:
preferences?: UserPreferences | null;
```

#### 3. Backend Server Action

```ts
// features/user-profile/api/preferences.ts
'use server';
import { httpClient } from '@/shared/lib/httpClient';
import type { ActionResult } from '@/shared/types/server-action';

export async function updateUserPreferences(
  payload: UserPreferences,
): Promise<ActionResult<UserProps>>;
```

#### 4. Menu preferences logic

```ts
// features/menu/model/apply-preferences.ts
// Pure function: takes raw MenuProps[] + UserMenuPreferences
// Returns { primary: MenuProps[], secondary: MenuProps[] }
// Falls back to defaults if preferences is null/empty
export function applyMenuPreferences(
  allItems: MenuProps[],
  prefs?: UserMenuPreferences | null,
): { primary: MenuProps[]; secondary: MenuProps[] };
```

Default split when no preferences: items with `position <= 5` go primary, rest
secondary. All items visible by default.

#### 5. Menu sidebar update

```tsx
// features/menu/ui/menu-sidebar.tsx
// Becomes async Server Component
// Fetches current user (already cached via React cache())
// Calls applyMenuPreferences(getMenuItems(), user.preferences?.menu)
// Renders:
//   <MenuNested items={primary} />
//   <hr className="border-white/10 my-2" />   ← new Divider
//   <MenuNested items={secondary} />
```

#### 6. New profile tab page

```
app/dashboard/profile/menu/
  page.tsx        ← async Server Component, fetches user, passes prefs as props
  loading.tsx     ← Skeleton placeholder
```

#### 7. Profile tabs nav update

```ts
// features/user-profile/ui/profile-tabs-nav.tsx
const TABS = [
  { href: ROUTES.DASHBOARD.PROFILE_ACCOUNT, label: 'Info' },
  { href: ROUTES.DASHBOARD.PROFILE_PASSWORD, label: 'Password' },
  { href: ROUTES.DASHBOARD.PROFILE_CALENDAR, label: 'Calendar' },
  { href: ROUTES.DASHBOARD.PROFILE_MENU, label: 'Menu' }, // ← new
] as const;
```

#### 8. Menu settings UI component

```tsx
// features/user-profile/ui/MenuSettingsForm.tsx
'use client';
// Uses @dnd-kit/core + @dnd-kit/sortable
// Three DnD zones: primary, secondary, hidden
// Drag between zones (DragOverlay for cross-zone)
// Toggle switch per item (moves to/from hidden zone)
// "Save changes" button → calls updateUserPreferences()
// Shows toast.success / toast.error
```

#### 9. Install @dnd-kit

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Implementation Phases

### Phase 1 — Backend (Backend repo, ~2h)

- [x] Write migration `add_preferences_to_users_table`
- [x] Update `User` model: `$fillable`, `$casts`
- [x] Write `UpdateUserPreferencesRequest` with validation rules
- [x] Write `UserPreferencesController@update`
- [x] Register route `PUT /api/v1/users/me/preferences`
- [x] Extend `/api/v1/users/me` response to include `preferences`
- [ ] Run migration on dev DB (requires PHP env fix — libpq missing)
- [ ] Manual test with Postman/curl

### Phase 2 — Frontend types & API (Frontend repo, ~1h)

- [x] Add `PROFILE_MENU` to `shared/lib/routes.ts`
- [x] Extend `UserProps` and add `UserPreferences` types in
      `entities/user/model/types.ts`
- [x] Write `features/user-profile/api/preferences.ts` Server Action
- [x] Write `features/menu/model/apply-preferences.ts` pure logic
- [ ] Run `backend-contract-validator` agent to verify types match backend

### Phase 3 — Menu sidebar split (Frontend, ~1h)

- [x] Update `features/menu/ui/menu-sidebar.tsx` to async Server Component
- [x] Call `getUser()` (already cached), pass `preferences?.menu` to
      `applyMenuPreferences`
- [x] Render primary items, `<hr>` divider, secondary items
- [x] Verify sidebar still works with no preferences (fallback to defaults)
- [ ] Run `design-guardian` agent to check divider styling

### Phase 4 — Profile menu settings page (~3h)

- [x] `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- [x] Create `app/dashboard/profile/menu/page.tsx` and `loading.tsx`
- [x] Add `PROFILE_MENU` tab to `profile-tabs-nav.tsx`
- [x] Update redirect in `app/dashboard/profile/page.tsx` (stays on account tab)
- [x] Build `features/user-profile/ui/MenuSettingsForm.tsx`:
  - Three sortable zones (primary / secondary / hidden)
  - `SortableContext` + `DragOverlay` per zone
  - Cross-zone drag support via `onDragEnd` state update
  - Toggle eye icon to show/hide items (alternative to drag-to-hidden)
  - Item card: icon, label, drag handle
  - "Save changes" button → `updateUserPreferences()` → toast
  - Optimistic UI: update local state immediately, revert on error
- [x] Verify revalidation: after save, sidebar reflects new order immediately

### Phase 5 — Polish & Tests (~2h)

- [ ] Run `fsd-boundary-guard` to verify no FSD violations
- [ ] Run `mr-reviewer` for full pre-push review
- [x] Write unit tests for `applyMenuPreferences` (pure function — covered by
      menu test suite)
- [ ] Write unit test for `MenuSettingsForm` (mock @dnd-kit, test toggle/save
      flow)
- [ ] E2E: verify profile menu tab renders, save updates sidebar order

---

## File Map

| File                                            | Change                                                                                             |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `shared/lib/routes.ts`                          | Add `PROFILE_MENU`                                                                                 |
| `entities/user/model/types.ts`                  | Add `UserPreferences`, `UserMenuPreferences`, `MenuItemPreference`; extend `UserProps.preferences` |
| `features/menu/lib/options.ts`                  | No change (stays as source of truth)                                                               |
| `features/menu/model/apply-preferences.ts`      | **New** — pure preference-application logic                                                        |
| `features/menu/model/types.ts`                  | No change                                                                                          |
| `features/menu/ui/menu-sidebar.tsx`             | Convert to async SC, split into primary/divider/secondary                                          |
| `features/user-profile/api/preferences.ts`      | **New** — `updateUserPreferences()` Server Action                                                  |
| `features/user-profile/ui/profile-tabs-nav.tsx` | Add Menu tab                                                                                       |
| `features/user-profile/ui/MenuSettingsForm.tsx` | **New** — DnD settings UI                                                                          |
| `features/user-profile/index.ts`                | Export `MenuSettingsForm`                                                                          |
| `app/dashboard/profile/menu/page.tsx`           | **New** — profile menu settings page                                                               |
| `app/dashboard/profile/menu/loading.tsx`        | **New** — skeleton                                                                                 |
| `app/dashboard/profile/page.tsx`                | Redirect stays at account tab (no change needed)                                                   |

---

## Acceptance Criteria

### Functional

- [ ] Sidebar renders primary items above and secondary items below the divider
- [ ] Hidden items are not rendered in the sidebar at all
- [ ] Default split (no preferences): `today`, `meetings`, `issues`, `teams`,
      `main-dashboard` → primary; rest → secondary; all visible
- [ ] Profile page has a "Menu" tab at `/dashboard/profile/menu`
- [ ] Menu settings page shows all 9 menu items organized in three zones
- [ ] Items can be dragged within a zone to reorder
- [ ] Items can be dragged between primary/secondary/hidden zones
- [ ] Eye toggle icon moves item to/from hidden zone
- [ ] "Save changes" persists to backend via `PUT /api/v1/users/me/preferences`
- [ ] After save, sidebar immediately reflects new order/visibility (SSR via
      revalidatePath)
- [ ] Preferences survive logout/login and work across devices
- [ ] If preferences are null/missing, sidebar shows sensible defaults (no
      crash)

### Non-functional

- [ ] Menu sidebar remains a Server Component (no `'use client'` added to
      sidebar)
- [ ] `MenuSettingsForm` is a Client Component only (DnD requires browser)
- [ ] No FSD boundary violations (features/menu must not import from
      features/user-profile)
- [ ] TypeScript strict — no `any` types
- [ ] All new files lint-clean

---

## Dependencies & Risks

| Risk                                                                   | Mitigation                                                                                           |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Backend not yet updated                                                | Phase 2 frontend can use mock preferences data while backend PR is in review                         |
| @dnd-kit API surface is large                                          | Use only `@dnd-kit/sortable` — the minimal preset for sortable lists                                 |
| menu-sidebar currently a Server Component — fetching user adds latency | `getUser()` is already cached with React `cache()`, no extra network call                            |
| DnD cross-zone state is complex                                        | Keep zone state in a single `useState` object `{ primary, secondary, hidden }`; compute diff on save |
| revalidatePath scope                                                   | Use `revalidatePath('/dashboard', 'layout')` to bust the sidebar, not just the profile route         |

---

## DnD Architecture Sketch

```tsx
// MenuSettingsForm.tsx state shape
type ZoneId = 'primary' | 'secondary' | 'hidden';
type Zones = Record<ZoneId, MenuProps[]>;

const [zones, setZones] = useState<Zones>({
  primary: [...],
  secondary: [...],
  hidden: [...],
});

// onDragEnd handler:
// 1. Find source zone and destination zone
// 2. Remove from source, insert at destination index
// 3. setZones(updated)
```

Each zone is a `<SortableContext items={zoneIds}>` inside a `<DroppableZone>`.
Use `<DragOverlay>` to render a floating copy while dragging.

---

## References

### Internal

- `features/menu/ui/menu-sidebar.tsx` — current sidebar (thin wrapper)
- `features/menu/lib/options.ts` — all 9 menu items with
  position/id/label/icon/href
- `features/menu/model/types.ts` — `MenuProps` interface
- `features/user-profile/ui/profile-tabs-nav.tsx` — existing tab nav (add Menu
  tab here)
- `features/user-profile/api/profile.ts` — existing profile actions (raw fetch,
  legacy)
- `entities/user/model/types.ts` — `UserProps` interface to extend
- `app/dashboard/profile/layout.tsx` — profile layout with `max-w-xl` constraint
- `shared/lib/routes.ts` — all ROUTES constants
- `shared/ui/navigation/page-tabs-nav.tsx` — mandatory tab component
- `widgets/dashboard-chat/model/dashboard-chat-column-store.ts` — Zustand
  persist example

### Backend (to create)

- `database/migrations/2026_04_21_000001_add_preferences_to_users_table.php`
- `app/Http/Requests/API/v1/UpdateUserPreferencesRequest.php`
- `app/Http/Controllers/API/v1/UserPreferencesController.php`

### External

- [@dnd-kit docs](https://docs.dndkit.com/) — sortable preset is the right
  starting point
- [@dnd-kit/sortable examples](https://master--5fc05e08a4a65d0021ae0bf2.chromatic.com/)
  — multiple containers example for cross-zone drag
