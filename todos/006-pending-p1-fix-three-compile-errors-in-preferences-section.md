---
status: pending
priority: p1
issue_id: '006'
tags: [code-review, typescript, preferences-tab-refactor]
dependencies: []
---

# Fix three compile errors in the PreferencesSection plan

## Problem Statement

The plan's `PreferencesSection.tsx` snippet contains three type errors that will
block `npm run build` if implemented as written. All three are in the imports or
prop types of the new component.

## Findings

### Error 1 — Wrong import path for `UserPreferences`

Plan imports:

```ts
import type { UserPreferences } from '../model/types';
```

`features/user-profile/model/types.ts` contains only the `Identity` interface.
`UserPreferences` lives in `entities/user/model/types.ts` and is re-exported via
`@/entities/user`.

Correct import (already used by both `AppearanceSection.tsx:9` and
`MenuSettingsForm.tsx:31`):

```ts
import type { UserPreferences } from '@/entities/user';
```

### Error 2 — `AppearanceSection` does not accept `null`

The plan passes `preferences: UserPreferences | null` to `AppearanceSection`:

```tsx
<AppearanceSection currentPreferences={preferences} />
```

Actual prop type at `AppearanceSection.tsx:20-24`:

```ts
{
  currentPreferences: UserPreferences;
} // NOT nullable
```

Fix: pass `preferences ?? {}` from both the page and `PreferencesSection`, typed
as `UserPreferences` (not `| null`). This matches the existing pattern in
`appearance/page.tsx` which passes `user.preferences ?? {}`.

### Error 3 — `MenuProps` is not exported from `@/features/menu`

Plan imports:

```ts
import type { MenuProps } from '@/features/menu';
```

`features/menu/index.ts` exports only `MenuSidebar`, `SidebarFooter`,
`getMenuItems`, and `ICONS_MAP`. `MenuProps` is not in the public API.

Current pattern used by `MenuSettingsForm.tsx:32`:

```ts
import type { MenuProps } from '@/features/menu/model/types';
```

Fix options (pick one):

- A) Use the deep path:
  `import type { MenuProps } from '@/features/menu/model/types'`
- B) Add `MenuProps` to `features/menu/index.ts` (preferred long-term; aligns
  with FSD public-API convention)

## Proposed Solutions

### Option A — Fix imports inline (Small, Low risk)

Apply all three corrections directly when writing `PreferencesSection.tsx`:

1. `import type { UserPreferences } from '@/entities/user'`
2. Pass `preferences ?? {}` typed as `UserPreferences` (remove `| null` from
   Props interface)
3. `import type { MenuProps } from '@/features/menu/model/types'`

**Pros:** Minimal change; zero risk of breaking other consumers. **Cons:**
Leaves `MenuProps` out of the feature's public API (minor FSD gap).

### Option B — Fix imports + add MenuProps to public index (Small, Low risk)

Same as A, but also add `export type { MenuProps } from './model/types'` to
`features/menu/index.ts`.

**Pros:** Closes the FSD public-API gap; `PreferencesSection` can import cleanly
from `@/features/menu`. **Cons:** Slightly larger diff (one extra line).

## Recommended Action

Option B — fix all three compile errors and add `MenuProps` to the public index.

## Technical Details

**Affected files (plan artifacts — not yet created):**

- `features/user-profile/ui/PreferencesSection.tsx` (new)
- `features/menu/index.ts` (modify — add type export)

## Acceptance Criteria

- [ ] `PreferencesSection.tsx` imports `UserPreferences` from `@/entities/user`
- [ ] `PreferencesSection` Props interface uses `UserPreferences` (not
      `UserPreferences | null`)
- [ ] Page passes `user.preferences ?? {}` typed as `UserPreferences`
- [ ] `MenuProps` is importable from `@/features/menu` (added to index.ts), OR
      imported from `@/features/menu/model/types`
- [ ] `npm run build` passes with no TypeScript errors

## Work Log

- 2026-05-15: Identified by Kieran TypeScript reviewer during
  `/workflows:review` of the plan.
