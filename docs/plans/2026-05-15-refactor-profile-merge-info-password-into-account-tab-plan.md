---
title: Merge Info and Password tabs into single Account tab
type: refactor
status: completed
date: 2026-05-15
---

# Merge Info and Password tabs into single Account tab

## Enhancement Summary

**Deepened on:** 2026-05-15  
**Research agents used:** code-simplicity-reviewer, security-sentinel,
kieran-typescript-reviewer, scope-guardian + feasibility-reviewer,
best-practices-researcher, learnings-researcher, codebase grep

### Key Improvements Over Initial Plan

1. **Step 4 (button width) is a no-op** — `fullWidth={false}` is already in
   `ChangePasswordForm.tsx:105`. Removed from plan.
2. **Replace delete with redirect** — keep `password/page.tsx` as a `redirect()`
   to `/account` rather than deleting it; prevents 404 for bookmarks/history.
3. **Use `<hr>` + section headings**, not just `gap` — industry standard
   (GitHub, Notion) for co-located independent forms.
4. **Add `loading.tsx`** to `account/` — CLAUDE.md mandates it per sub-route;
   currently missing.
5. **Toast deduplication** with stable `id` per form — prevents stacked toasts
   on rapid submissions.
6. **`PROFILE_PASSWORD` deletion is unconditional** — grep confirms only 2
   consumers, both removed.
7. **`metadata.title`** update to `'Account'` — currently says `'Info'`.
8. **Use existing wrapper div**, not a fragment — `account/page.tsx` already has
   `flex flex-col gap-6`.

---

## Overview

The Profile page currently has two separate tabs: **Info** (name editing) and
**Password** (password change). The goal is to merge them into a single
**Account** tab that renders both forms one after another, and to ensure the
"Change password" button is not full-width.

> **Note on button width:** `ChangePasswordForm.tsx` already has
> `fullWidth={false}` at line 105, which resolves to `w-auto` via the Button
> component. This issue is **already fixed** in the codebase — no code change is
> needed for it.

---

## Changes Required

### 1. Redirect `/password` sub-route → `/account`

Do **not** delete `app/dashboard/profile/password/page.tsx`. Instead, replace
its contents with a redirect. This handles users with bookmarks, browser
history, or any cached links without serving a 404.

```tsx
// app/dashboard/profile/password/page.tsx
import { redirect } from 'next/navigation';
import { ROUTES } from '@/shared/lib/routes';

export default function PasswordRedirect() {
  redirect(ROUTES.DASHBOARD.PROFILE_ACCOUNT);
}
```

> **Security note:** Next.js Server Actions are CSRF-protected by Origin header
> verification regardless of how many forms are on a page. Co-locating two
> independent `<form>` elements creates no security risk — each has its own
> `onSubmit` handler and Server Action target.

### 2. Update `features/user-profile/ui/profile-tabs-nav.tsx`

Rename the "Info" tab label to **"Account"** and remove the "Password" tab entry
entirely.

```ts
// Before
const BASE_TABS = [
  { href: ROUTES.DASHBOARD.PROFILE_ACCOUNT, label: 'Info' },
  { href: ROUTES.DASHBOARD.PROFILE_PASSWORD, label: 'Password' },
  { href: ROUTES.DASHBOARD.PROFILE_CALENDAR, label: 'Calendar' },
  // ...
] as const;

// After
const BASE_TABS = [
  { href: ROUTES.DASHBOARD.PROFILE_ACCOUNT, label: 'Account' },
  { href: ROUTES.DASHBOARD.PROFILE_CALENDAR, label: 'Calendar' },
  // ...
] as const;
```

### 3. Update `app/dashboard/profile/account/page.tsx`

Add `<ChangePasswordForm />` below `<ProfileForm />` inside the **existing**
`flex flex-col gap-6` wrapper div (do not add a fragment or a new wrapper). Add
section headings and an `<hr>` divider between the two forms.

Also update `metadata.title` from `'Info'` to `'Account'`.

```tsx
// app/dashboard/profile/account/page.tsx
import type { Metadata } from 'next';
import { ProfileForm, ChangePasswordForm } from '@/features/user-profile';
import { getUser } from '@/features/user-profile/api/profile';

export const metadata: Metadata = { title: 'Account' };

export default async function ProfileAccountPage() {
  const { data: user } = await getUser();

  return (
    <div className='flex flex-col gap-6'>
      <section>
        <div className='mb-6'>
          <h2 className='text-base font-semibold'>Profile Information</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Update your display name.
          </p>
        </div>
        {user ? (
          <ProfileForm user={user} />
        ) : (
          <p className='text-sm text-muted-foreground'>
            Unable to load profile.
          </p>
        )}
      </section>

      <hr className='border-border' />

      <section>
        <div className='mb-6'>
          <h2 className='text-base font-semibold'>Change Password</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Changing your password will sign out all other active sessions.
          </p>
        </div>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
```

**Key decisions:**

- `<hr className="border-border" />` provides a hard visual break between
  sections — industry standard (GitHub, Notion, Stripe) for co-located
  independent forms. Gap spacing alone is insufficient.
- `<section>` with `<h2>` heading is important for accessibility — screen
  readers announce the section heading when the user navigates to it.
- `<ChangePasswordForm />` is rendered **outside** the `user` null guard — it
  has no dependency on `user` and should always be available.
- Do **not** disable one form while the other is submitting. Each form manages
  its own `isPending` via `useTransition()` independently. Cross-disabling
  creates confusion and accessibility issues (disabled elements are removed from
  tab order).

### 4. Add `loading.tsx` for the account sub-route

CLAUDE.md mandates: "Each sub-route must have `loading.tsx`." The `account/`
sub-route currently has no `loading.tsx`. After the merge, the page fetches
`getUser()` (async Server Component), making a loading state meaningful.

```tsx
// app/dashboard/profile/account/loading.tsx
import { Skeleton, SkeletonList } from '@/shared/ui/layout/skeleton';

export default function ProfileAccountLoading() {
  return (
    <div className='flex flex-col gap-6'>
      <SkeletonList count={3} />
      <Skeleton className='h-px w-full' />
      <SkeletonList count={4} />
    </div>
  );
}
```

### 5. Remove `PROFILE_PASSWORD` constant from `shared/lib/routes.ts`

Grep confirms `PROFILE_PASSWORD` is referenced in exactly **2 files**:
`routes.ts` (definition) and `profile-tabs-nav.tsx` (consumed). After step 2
removes the tab entry, the constant has zero consumers. Delete it
unconditionally — no redirect alias needed.

Also remove the accompanying
`// eslint-disable-line sonarjs/no-hardcoded-passwords` comment on the same
line.

```ts
// Remove this line from shared/lib/routes.ts:
PROFILE_PASSWORD: '/dashboard/profile/password', // eslint-disable-line sonarjs/no-hardcoded-passwords
```

### 6. Add toast deduplication in both forms

When two independent forms share a page, rapid successive submissions can stack
toasts that are hard to attribute. Sonner supports deduplication via a stable
`id` — passing the same `id` updates the existing toast in place instead of
creating a new one.

In `features/user-profile/ui/ProfileForm.tsx`, add `id: 'profile-update'` to
every `toast.*` call:

```ts
toast.success('Profile updated successfully', { id: 'profile-update' });
toast.error(result.error, { id: 'profile-update' });
```

In `features/user-profile/ui/ChangePasswordForm.tsx`, add
`id: 'password-change'`:

```ts
toast.success('Password changed. Other sessions have been signed out.', {
  id: 'password-change',
});
toast.error(result.error, { id: 'password-change' });
```

---

## Files to Touch

| File                                              | Action                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `app/dashboard/profile/password/page.tsx`         | Replace content with `redirect(ROUTES.DASHBOARD.PROFILE_ACCOUNT)`               |
| `app/dashboard/profile/account/page.tsx`          | Add `<ChangePasswordForm />`, section headings, `<hr>`, update `metadata.title` |
| `app/dashboard/profile/account/loading.tsx`       | **Create** — skeleton loading state (required by CLAUDE.md)                     |
| `features/user-profile/ui/profile-tabs-nav.tsx`   | Rename "Info"→"Account", remove Password tab entry                              |
| `features/user-profile/ui/ProfileForm.tsx`        | Add `id: 'profile-update'` to toast calls                                       |
| `features/user-profile/ui/ChangePasswordForm.tsx` | Add `id: 'password-change'` to toast calls                                      |
| `shared/lib/routes.ts`                            | Remove `PROFILE_PASSWORD` constant (+ its eslint-disable comment)               |

**Not needed (already handled in current codebase):**

- `ChangePasswordForm` button width — already `fullWidth={false}` at line 105,
  resolves to `w-auto`
- Root `app/dashboard/profile/page.tsx` redirect — already redirects to
  `PROFILE_ACCOUNT`, no change needed

---

## Acceptance Criteria

- [x] Profile tabs show: **Account**, Calendar, Menu, Appearance, Telegram (+
      Onboarding when applicable)
- [x] The **Account** tab renders both forms stacked with an `<hr>` divider and
      section headings between them
- [x] `<ChangePasswordForm />` renders regardless of whether `getUser()` returns
      null
- [x] `/dashboard/profile/password` redirects to `/dashboard/profile/account`
      (no 404)
- [x] `PROFILE_PASSWORD` constant is removed from `routes.ts`
- [x] "Change password" button is not full-width (already true — no code change
      needed)
- [x] `app/dashboard/profile/account/loading.tsx` exists with a skeleton
      matching the form count
- [x] `metadata.title` on the account page is `'Account'`
- [x] Toast IDs skipped — buttons self-disable, stacking not a real issue
- [x] All other tab routes (Calendar, Menu, Appearance, Telegram) work unchanged
- [x] No TypeScript errors, no ESLint errors

---

## UX Design Notes

Based on patterns from GitHub, Notion, Linear, and Stripe:

**Visual separation:** A full-width `<hr>` with `my-8` (or handled by the
`gap-6` wrapper) is the industry standard for co-located independent forms. Gap
spacing alone is insufficient — users need a hard cognitive break between "edit
name" and "change password" sections.

**Button placement:** Settings page submit buttons must not be full-width
(full-width is for login/signup). The current `ProfileForm` button uses
`w-full md:w-[170px]` (left-aligned, constrained on desktop) — this is correct.
`ChangePasswordForm` already has `fullWidth={false}`.

**Toast behavior:** Independent `id` values per form prevent stacked/duplicate
toasts. No cross-form disabling — disabled elements are removed from tab order
and confuse screen readers.

---

## References

- Tab nav: `features/user-profile/ui/profile-tabs-nav.tsx`
- Account page: `app/dashboard/profile/account/page.tsx`
- Password page (to redirect): `app/dashboard/profile/password/page.tsx`
- ProfileForm: `features/user-profile/ui/ProfileForm.tsx`
- ChangePasswordForm: `features/user-profile/ui/ChangePasswordForm.tsx` —
  `fullWidth={false}` already at line 105
- Routes: `shared/lib/routes.ts` lines 31–38
- PageTabsNav API: `shared/ui/navigation/page-tabs-nav.tsx`
- Skeleton components: `shared/ui/layout/skeleton.tsx`
- Sonner toast deduplication: `id` option on `toast.*` calls
