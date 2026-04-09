---
title:
  'fix: Profile page cleanup — remove Linked Accounts, fix calendar detach
  cache, move attach to calendar page'
type: fix
status: completed
date: 2026-03-31
---

# fix: Profile page cleanup — remove Linked Accounts, fix calendar detach cache, move attach to calendar page

## Overview

The profile page currently shows more than it should and has a bug:
disconnecting a Google Calendar shows a success toast but the calendar block
doesn't disappear (stale server component state). In addition, the "Linked
accounts" section and "Link a new account" form need to be fully removed from
the profile page. Calendar attachment (OAuth flow) belongs on the calendar
dashboard page, not the profile page.

**Target profile page structure (final state):**

1. Change name form
2. Change password form
3. Disconnect calendar (if connected)

---

## Bug Analysis

### Root cause — calendar detach on profile page shows success but UI doesn't update

`detachCalendarFromProfile` in `features/calendar/api/source.ts` does call:

```ts
revalidatePath(ROUTES.DASHBOARD.CALENDAR, 'layout');
revalidatePath(ROUTES.DASHBOARD.PROFILE, 'layout');
```

However, `CalendarSection.tsx` is a **Client Component** (`'use client'`). It
renders conditionally based on a `source` prop passed from the **Server
Component** (`app/dashboard/profile/page.tsx`). After the Server Action resolves
on the client, Next.js must re-render the Server Component tree to reflect the
deleted source. The `'layout'` scope in `revalidatePath` should trigger that —
but the component currently only shows a success toast and relies on router
re-render, which may not happen correctly without a `router.refresh()` call in
the client after action success.

**Fix:** Call `router.refresh()` from `CalendarSection.tsx` after
`detachCalendarFromProfile` resolves successfully. This forces Next.js to
re-fetch the server component with fresh data (the `getSources()` call uses
`cache: 'no-store'`, so it will return empty).

### Why `revalidatePath` alone is insufficient here

`revalidatePath` marks cached server component HTML stale on the **server**. But
the client still shows the old rendered tree until it navigates or calls
`router.refresh()`. For mutations inside Client Components that need the parent
Server Component to re-render in-place (no navigation), `router.refresh()` is
required.

---

## Scope of Changes

### 1. Fix calendar detach — add `router.refresh()` after success

**File:** `features/user-profile/ui/CalendarSection.tsx`

- Import `useRouter` from `next/navigation`
- After `detachCalendarFromProfile` resolves with no error, call
  `router.refresh()`
- This triggers re-fetch of the parent Server Component, which calls
  `getSources()` again (already `cache: 'no-store'`) and renders the page
  without the calendar block

### 2. Remove "Linked Accounts" section from profile page

**File:** `app/dashboard/profile/page.tsx`

- Remove the `getIdentities()` call (import and usage)
- Remove the `<IdentitiesSection />` render
- Remove the `identities` variable

**File:** `features/user-profile/ui/IdentitiesSection.tsx`

- Keep the file (don't delete) — it may be used elsewhere or reused in the
  future, but it is simply no longer imported on the profile page. If it's only
  used on the profile page, it can be deleted to avoid dead code. Verify with
  grep first.

### 3. Remove "Link a new account" form from profile page

This is part of `IdentitiesSection` (the form at the bottom of
`IdentitiesSection.tsx`). Removing `IdentitiesSection` from the page (step 2)
handles this automatically.

### 4. Move calendar attachment (OAuth) to `dashboard/calendar` page

The calendar page (`app/dashboard/calendar/page.tsx`) already has an
`UnattachedView` that renders `OnboardingTrigger` when no source is connected.
This is already the correct place — nothing needs to move. The issue is only
that the profile page currently also renders attachment UI (via
`IdentitiesSection` which has a `google_calendar` channel option).

After removing `IdentitiesSection` from the profile page, calendar attachment
will only exist on the calendar page — which is the correct behavior.

### 5. Remove `getIdentities()` server action call from profile page

**File:** `app/dashboard/profile/page.tsx` (currently imports and calls
`getIdentities`)

- Remove import of `getIdentities` from `features/user-profile/api/identities`
- Remove `const identities = await getIdentities()` (or similar)
- Remove the `identities` prop passed to `IdentitiesSection`

### 6. Verify cache correctness for calendar section

After the fix, the data flow for the profile page calendar block:

```
page.tsx (Server Component)
  └─ getSources() — cache: 'no-store' ✅ always fresh on server re-render
       └─ sources passed as prop to CalendarSection (Client Component)
            └─ on detach success → router.refresh() → re-runs getSources() ✅
```

`revalidatePath(ROUTES.DASHBOARD.PROFILE, 'layout')` in
`detachCalendarFromProfile` is still correct and ensures any navigations back to
profile also get fresh data. Keep it.

---

## Files to Change

| File                                             | Change                                                           |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| `app/dashboard/profile/page.tsx`                 | Remove `getIdentities()` call, remove `IdentitiesSection` render |
| `features/user-profile/ui/CalendarSection.tsx`   | Add `router.refresh()` after successful detach                   |
| `features/user-profile/ui/IdentitiesSection.tsx` | Delete if only used on profile page (verify with grep)           |
| `features/user-profile/api/identities.ts`        | Delete if no longer imported anywhere (verify with grep)         |

> **Grep before deleting:** Run
> `grep -r "IdentitiesSection\|getIdentities\|linkIdentity\|unlinkIdentity" --include="*.ts" --include="*.tsx"`
> to confirm no other consumers.

---

## Acceptance Criteria

- [ ] Clicking "Disconnect" on the calendar section in profile page shows
      success toast **and** the calendar block disappears immediately (no page
      reload needed)
- [ ] The profile page shows exactly 3 sections: change name, change password,
      disconnect calendar (only if calendar is connected)
- [ ] The "Linked Accounts" block is completely gone from the profile page
- [ ] The "Link a new account" form is completely gone from the profile page
- [ ] Calendar attachment (Connect Google Calendar button) remains functional on
      `dashboard/calendar`
- [ ] After OAuth redirect back to calendar page (`?attached=1`), the calendar
      is shown and the "Connect" state is gone
- [ ] No TypeScript errors, no ESLint errors
- [ ] `getSources()` is not called on the profile page if there is no calendar
      connected (it can still be called to check — but the result should reflect
      actual state)

---

## Cache Correctness Checklist

| Operation                       | Cache mechanism                                                            | Correct?                                                                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Load profile page (sources)     | `getSources()` uses `cache: 'no-store'`                                    | ✅ Always fresh                                                                                                                                  |
| Detach calendar (server action) | `revalidatePath(PROFILE, 'layout')` + `revalidatePath(CALENDAR, 'layout')` | ✅ Marks stale                                                                                                                                   |
| Client re-render after detach   | `router.refresh()` (to add)                                                | ❌ Missing — this is the bug                                                                                                                     |
| Attach calendar (OAuth)         | No revalidatePath in `attachCalendar`                                      | ⚠️ OK in practice because redirect back adds `?attached=1`, but `revalidatePath(CALENDAR, 'layout')` after backend confirms would be more robust |
| Calendar page load              | `getSources()` `cache: 'no-store'`                                         | ✅ Always fresh                                                                                                                                  |

---

## References

- `app/dashboard/profile/page.tsx` — profile page server component
- `features/user-profile/ui/CalendarSection.tsx` — disconnect button UI
- `features/calendar/api/source.ts:87` — `detachCalendarFromProfile` (has
  revalidatePath, missing client refresh)
- `features/user-profile/ui/IdentitiesSection.tsx` — linked accounts + link form
  (to remove)
- `app/dashboard/calendar/page.tsx:89` — `UnattachedView` / `OnboardingTrigger`
  (attach flow already here)
- `features/calendar/ui/onboarding-trigger.tsx` — attach button on calendar page
