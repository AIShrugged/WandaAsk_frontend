---
status: pending
priority: p2
issue_id: '003'
tags: [code-review, performance, profile, nextjs, react]
dependencies: [001]
---

# Use Suspense boundary so ChangePasswordForm renders without blocking on getUser()

## Problem Statement

The plan proposes an `async` page component that `await getUser()` before
returning any JSX. This means `ChangePasswordForm` — which has zero data
dependencies — is blocked from rendering until the `getUser()` network call
completes. On a slow connection (~150ms API latency), the password form is
invisible for that entire duration even though it doesn't need any data.

## Findings

- `app/dashboard/profile/account/page.tsx` current pattern: `async function` →
  `await getUser()` → return JSX with both forms
- `ChangePasswordForm` has no props, no server data dependency — it can render
  immediately
- `getUser()` is wrapped in React `cache()` so it deduplicates within a render
  pass, but it still blocks the entire page shell until resolved
- If the plan adds `loading.tsx` at the account route level, the **entire page**
  (including ChangePasswordForm) shows a skeleton, even though
  ChangePasswordForm needs no loading state
- Performance reviewer recommends: make the page a non-async Server Component,
  extract an async `ProfileFormServer` wrapper, wrap it in `<Suspense>` so
  ChangePasswordForm renders immediately
- This is the correct React 19 + Next.js 16 streaming pattern: non-blocking page
  shell, per-section async boundaries

## Proposed Solutions

### Option 1: Extract async ProfileFormServer + Suspense (Recommended)

**Approach:** Make `ProfileAccountPage` a sync (non-async) Server Component.
Extract async data fetching into a dedicated `ProfileFormServer` async
component. Wrap it in `<Suspense>`. `ChangePasswordForm` renders immediately
without blocking.

```tsx
// features/user-profile/ui/ProfileFormServer.tsx (new async Server Component)
import { getUser } from '@/features/user-profile/api/profile';
import { ProfileForm } from './ProfileForm';

export async function ProfileFormServer() {
  const { data: user } = await getUser();
  if (!user)
    return (
      <p className='text-sm text-muted-foreground'>Unable to load profile.</p>
    );
  return <ProfileForm user={user} />;
}
```

```tsx
// app/dashboard/profile/account/page.tsx — non-async, no await
import { Suspense } from 'react';
import { SkeletonList } from '@/shared/ui/layout/skeleton';
import { ProfileFormServer, ChangePasswordForm } from '@/features/user-profile';

export default function ProfileAccountPage() {
  return (
    <div className='flex flex-col gap-6'>
      <section>
        <h2 className='text-base font-semibold mb-6'>Profile Information</h2>
        <Suspense fallback={<SkeletonList rows={2} />}>
          <ProfileFormServer />
        </Suspense>
      </section>
      <hr className='border-border' />
      <section>
        <h2 className='text-base font-semibold mb-6'>Change Password</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
```

**Pros:**

- ChangePasswordForm renders immediately — user can start typing current
  password while profile section loads
- Correct Next.js 16 streaming pattern
- No segment-level `loading.tsx` needed (inline Suspense handles it)
- Visually: ChangePasswordForm appears instantly; only the profile name section
  skeletons

**Cons:**

- One new `ProfileFormServer` async component
- Slightly more complex than the `await` pattern

**Effort:** 45 minutes  
**Risk:** Low

---

### Option 2: Keep async page + segment-level loading.tsx (Plan as written)

**Approach:** Keep `async function ProfileAccountPage()` with `await getUser()`.
Add `loading.tsx` with full-page skeleton per CLAUDE.md requirement.

**Pros:**

- Simpler — no new component
- CLAUDE.md mandates `loading.tsx` per sub-route regardless

**Cons:**

- ChangePasswordForm blocked on getUser() unnecessarily
- loading.tsx shows skeleton for the entire page including the no-data
  ChangePasswordForm section

**Effort:** 15 minutes  
**Risk:** None

## Recommended Action

To be filled during triage. For a profile page, the difference is ~50–150ms.
Option 2 is acceptable and simpler; Option 1 is better UX. Performance reviewer
rates this as "High — implement before shipping" but the actual perceived
difference is small for a settings page.

## Technical Details

**Affected files:**

- `app/dashboard/profile/account/page.tsx` — change from async to sync, use
  Suspense
- `features/user-profile/ui/ProfileFormServer.tsx` — new async Server Component
  (Option 1 only)
- `features/user-profile/index.ts` — export `ProfileFormServer`
- `app/dashboard/profile/account/loading.tsx` — may be skipped if Option 1 is
  chosen

**Note:** If Option 1 is chosen, `loading.tsx` is no longer needed at the
account route level (inline Suspense replaces it). CLAUDE.md mandates
`loading.tsx` per sub-route, but the rule's intent is to prevent blank screens —
Suspense fulfills that intent.

## Resources

- Plan:
  `docs/plans/2026-05-15-refactor-profile-merge-info-password-into-account-tab-plan.md`
- Performance reviewer finding: "Make ProfileAccountPage a non-async Server
  Component"
- Next.js streaming docs:
  https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming

## Acceptance Criteria

- [ ] `ChangePasswordForm` is visible to the user without waiting for getUser()
      to resolve
- [ ] Profile information section shows a skeleton while loading (either via
      loading.tsx or Suspense fallback)
- [ ] No TypeScript errors

## Work Log

### 2026-05-15 — Discovered during plan review

**By:** Claude Code  
**Actions:**

- Performance reviewer identified getUser() blocking ChangePasswordForm as the
  main UX concern
- Recommended Suspense-based streaming as the correct Next.js 16 pattern
