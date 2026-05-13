---
title: 'feat: Profile onboarding tab + password button width fix'
type: feat
status: completed
date: 2026-05-13
---

# Profile: Onboarding Tab + Password Button Width Fix

## Overview

Two small changes to the profile section:

1. **Onboarding tab** — add a 6th route-based tab "Onboarding" under
   `/dashboard/profile/onboarding` that surfaces the `OnboardingWizard` inline
   so org admins can redo the onboarding flow. The tab is only shown when
   `org.onboarded_at` is null (org not yet onboarded).
2. **Button width fix** — the "Change password" button in `ChangePasswordForm`
   fills the entire card width because `Button` defaults to `fullWidth={true}`.
   Fix it by passing `fullWidth={false}`.

---

## Problem Statement

### 1. No way to redo onboarding from the profile

Once a user reaches the dashboard (even via "skip"), the only path to the
onboarding wizard is via the redirect in `app/dashboard/layout.tsx` which fires
only if `org_onboarded` cookie is unset **and** `org.onboarded_at` is null.
There is no UI entry point to revisit the wizard for users who skipped or want
to reconfigure their org structure.

### 2. Password button is full width

`Button` defaults to `fullWidth={true}` (see `shared/ui/button/Button.tsx`).
`ChangePasswordForm` wraps it in `<div className="w-full md:w-auto">` to
constrain it on desktop, but the button still fills the card's full content area
on all viewport sizes because the `div` itself uses `w-full` on mobile and the
`md:w-auto` only kicks in at ≥768px breakpoint. On any viewport, this looks
wrong — a submit button in a narrow form should never span the full card.

---

## Proposed Solution

### 1. New "Onboarding" tab (conditional)

Follow the project's mandatory route-based tab pattern:

- New page: `app/dashboard/profile/onboarding/page.tsx` — async Server Component
  that reads the org and passes `orgId` / initial data to `OnboardingWizard`.
- New route constant:
  `ROUTES.DASHBOARD.PROFILE_ONBOARDING = '/dashboard/profile/onboarding'`
- New `loading.tsx` for the tab (required by convention).
- `ProfileTabsNav` becomes a **Client Component** that conditionally renders the
  6th tab only if `onboarded_at` is null. Because `ProfileTabsNav` is already
  `'use client'`, it needs the onboarding state passed as a prop from the Server
  Component layout.
- Profile layout (`app/dashboard/profile/layout.tsx`) becomes async, fetches
  org, and passes `isOnboarded` prop to `ProfileTabsNav`.

### 2. Button fix

In `features/user-profile/ui/ChangePasswordForm.tsx`:

- Remove the wrapping `<div className="w-full md:w-auto">`.
- Add `fullWidth={false}` to `<Button>`.

This is a one-line change — the wrapper div was a workaround for the missing
prop.

---

## Technical Considerations

### Onboarding tab — conditional visibility

**Challenge:** `ProfileTabsNav` is `'use client'` and `PageTabsNav` accepts a
static `tabs` array. The tab must only appear when `org.onboarded_at` is null.

**Approach:** Make `ProfileTabsNav` accept an optional
`showOnboarding?: boolean` prop. The profile layout (async Server Component)
fetches the org via `getOrganization()` and passes
`showOnboarding={!org?.onboarded_at}`.

```tsx
// features/user-profile/ui/profile-tabs-nav.tsx
'use client';
const BASE_TABS = [...] as const;
const ONBOARDING_TAB = { href: ROUTES.DASHBOARD.PROFILE_ONBOARDING, label: 'Onboarding' };

export function ProfileTabsNav({ showOnboarding }: { showOnboarding?: boolean }) {
  const tabs = showOnboarding ? [...BASE_TABS, ONBOARDING_TAB] : BASE_TABS;
  return <PageTabsNav tabs={tabs} />;
}
```

```tsx
// app/dashboard/profile/layout.tsx  (becomes async)
export default async function ProfileLayout({ children }: PropsWithChildren) {
  const cookieStore = await cookies();
  const orgId = cookieStore.get('organization_id')?.value;
  const { data: org } = orgId ? await getOrganization(orgId) : { data: null };
  return (
    <div className='flex flex-col h-full overflow-hidden p-2'>
      <div className='shrink-0 mb-4'>
        <ProfileTabsNav showOnboarding={!org?.onboarded_at} />
      </div>
      <Card className='h-full flex flex-col'>
        <div className='flex-1 overflow-y-auto p-4'>{children}</div>
      </Card>
    </div>
  );
}
```

### Onboarding tab — page content

The `OnboardingWizard` is a fully self-contained Client Component that handles
its own state via `useReducer`. The page just needs to pass `orgId` (and
optionally `orgName`/`orgDescription` for the skip flow). The wizard already
calls `acceptStructure` which sets the `org_onboarded` cookie and calls
`revalidatePath('/dashboard', 'layout')` — so after completion, the tab
automatically disappears on next navigation.

```tsx
// app/dashboard/profile/onboarding/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getOrganization } from '@/features/organization';
import { OnboardingWizard } from '@/features/onboarding';
import { ROUTES } from '@/shared/lib/routes';

export const metadata = { title: 'Onboarding' };

export default async function ProfileOnboardingPage() {
  const cookieStore = await cookies();
  const orgId = cookieStore.get('organization_id')?.value;
  if (!orgId) redirect(ROUTES.DASHBOARD.PROFILE_ACCOUNT);

  const { data: org } = await getOrganization(orgId);
  if (org?.onboarded_at) redirect(ROUTES.DASHBOARD.PROFILE_ACCOUNT);

  return <OnboardingWizard orgId={Number(orgId)} orgName={org?.name ?? ''} />;
}
```

> **Note:** Check `OnboardingWizard` props — currently it reads org data itself
> or accepts props. Verify the component's public interface before implementing.

### Button fix — exact change

```tsx
// features/user-profile/ui/ChangePasswordForm.tsx  line 103–111

// Before:
<div className='w-full md:w-auto'>
  <Button type='submit' loading={isPending} disabled={isPending || !isDirty}>
    Change password
  </Button>
</div>

// After:
<Button type='submit' fullWidth={false} loading={isPending} disabled={isPending || !isDirty}>
  Change password
</Button>
```

---

## Acceptance Criteria

- [x] New route `/dashboard/profile/onboarding` exists and renders
      `OnboardingWizard`
- [x] The "Onboarding" tab appears in `ProfileTabsNav` only when
      `org.onboarded_at` is null
- [x] After completing onboarding via the tab, the tab disappears (cookie +
      revalidation handles this)
- [x] If org is already onboarded, navigating to `/dashboard/profile/onboarding`
      redirects to `/dashboard/profile/account`
- [x] `ROUTES.DASHBOARD.PROFILE_ONBOARDING` constant added to
      `shared/lib/routes.ts`
- [x] New `loading.tsx` exists at `app/dashboard/profile/onboarding/loading.tsx`
- [x] "Change password" button does NOT fill the full card width
- [x] Button renders at its natural content-fit width (`fullWidth={false}`)
- [ ] No regressions on other profile tabs

---

## Files to Touch

| File                                              | Change                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| `shared/lib/routes.ts`                            | Add `PROFILE_ONBOARDING: '/dashboard/profile/onboarding'`            |
| `features/user-profile/ui/profile-tabs-nav.tsx`   | Accept `showOnboarding` prop, conditionally add tab                  |
| `features/user-profile/index.ts`                  | Re-export `ProfileTabsNav` with updated signature (already exported) |
| `app/dashboard/profile/layout.tsx`                | Make async, fetch org, pass `showOnboarding` to nav                  |
| `app/dashboard/profile/onboarding/page.tsx`       | **New** — fetch org, guard redirect, render `OnboardingWizard`       |
| `app/dashboard/profile/onboarding/loading.tsx`    | **New** — skeleton or spinner                                        |
| `features/user-profile/ui/ChangePasswordForm.tsx` | Remove wrapper `div`, add `fullWidth={false}` to Button              |

---

## Pre-implementation Check

Before implementing the onboarding page, verify `OnboardingWizard`'s public
interface:

```bash
grep -n 'export function OnboardingWizard\|interface.*Props\|orgId\|orgName' \
  features/onboarding/ui/onboarding-wizard.tsx
```

Confirm what props it accepts and whether it fetches org data itself or expects
it as props.

Also verify `features/onboarding/index.ts` exports `OnboardingWizard`.

---

## References

- `features/user-profile/ui/profile-tabs-nav.tsx` — current tabs (5 tabs, static
  array)
- `app/dashboard/profile/layout.tsx` — layout to make async
- `features/onboarding/api/onboarding.ts:71–114` — `acceptStructure` sets
  `org_onboarded` cookie
- `app/dashboard/layout.tsx:26–38` — onboarding gate logic (reads cookie +
  `org.onboarded_at`)
- `shared/ui/button/Button.tsx` — `fullWidth` defaults to `true`
- `features/user-profile/ui/ChangePasswordForm.tsx:103–111` — button wrapper to
  remove
- `shared/lib/routes.ts:32–37` — profile route constants
- CLAUDE.md — Tab Navigation Convention (mandatory route-based tabs,
  `loading.tsx` required, `PageTabsNav` only)
