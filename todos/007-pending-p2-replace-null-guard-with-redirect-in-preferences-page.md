---
status: pending
priority: p2
issue_id: '007'
tags: [code-review, architecture, auth, preferences-tab-refactor]
dependencies: ['006']
---

# Replace `!user` null guard with `redirect()` in preferences page

## Problem Statement

Both source pages (`menu/page.tsx` and `appearance/page.tsx`) render an inline
error paragraph when `getUser()` returns null. The new `preferences/page.tsx`
must not repeat this pattern — it leaves expired-session users stuck on a dead-
end error screen instead of redirecting them to login.

## Findings

When a user's session token expires mid-session:

1. `httpClient` gets a 401 from the backend
2. `httpClient` calls `clearSession()` (deletes the token cookie) and returns
   `{ data: null }`
3. The dashboard layout has already rendered (no redirect happened from the
   layout's own `getUser()` call in this code path)
4. The page component receives `user === null` and renders the fallback
   paragraph

The current fallback in the source pages:

```tsx
if (!user) {
  return (
    <p className='text-sm text-muted-foreground'>
      Unable to load preferences. Please try again later.
    </p>
  );
}
```

This shows a vague error with no recovery path. After `clearSession()`, the
user's next navigation will redirect to login (the token cookie is gone), but
only after they manually navigate away from this dead-end screen.

## Proposed Solutions

### Option A — Add redirect in the null guard (Recommended, Small, Low risk)

```tsx
import { redirect } from 'next/navigation';
import { ROUTES } from '@/shared/lib/routes';

export default async function ProfilePreferencesPage() {
  const { data: user } = await getUser();
  const allItems = getMenuItems();

  if (!user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  return (
    <PreferencesSection
      preferences={user.preferences ?? {}}
      allMenuItems={allItems}
    />
  );
}
```

**Pros:** User lands on login page immediately; matches the recovery intent.
**Cons:** One-way — the user loses whatever they were doing (but their session
is already gone anyway).

### Option B — Keep error paragraph (status quo, not recommended)

Copy the same `if (!user) return <p>...</p>` pattern from the source pages.

**Pros:** Zero friction to implement. **Cons:** Dead-end UX for expired
sessions; inconsistent with what the rest of the dashboard does when the API
returns 401.

## Recommended Action

Option A — use `redirect(ROUTES.AUTH.LOGIN)` in the null guard.

## Technical Details

**Affected file (plan artifact — not yet created):**

- `app/dashboard/profile/preferences/page.tsx`

## Acceptance Criteria

- [ ] When `getUser()` returns `null`, `preferences/page.tsx` calls
      `redirect(ROUTES.AUTH.LOGIN)`
- [ ] No inline error paragraph rendered for unauthenticated state
- [ ] `npm run build` passes

## Work Log

- 2026-05-15: Identified by security-sentinel during `/workflows:review`.
