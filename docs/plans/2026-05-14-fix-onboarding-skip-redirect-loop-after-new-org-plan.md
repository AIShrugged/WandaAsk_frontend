---
title: 'fix: Onboarding skip redirect loop on fresh organization'
type: fix
status: completed
date: 2026-05-14
---

# fix: Onboarding skip redirect loop on fresh organization

## Overview

After creating a brand-new organization and landing on `/onboarding`, clicking
"Skip for now" causes a visible flash: the browser briefly reaches
`/dashboard/today`, then immediately bounces back to `/onboarding`. The user is
stuck.

This is a **regression from the `fix/onboarding-redirect-loop` fix** — the
primary fix introduced a `skipOnboarding(orgId)` Server Action that sets an
`onboarding_skipped` cookie, and the dashboard layout checks this cookie before
redirecting. The logic is correct, but the router cache is not invalidated, so
the layout serves a cached (pre-skip) response that still fires the redirect.

---

## Problem Statement

### Root Cause

`skipOnboarding()` sets the `onboarding_skipped` cookie but does **not** call
`revalidatePath('/dashboard', 'layout')`.

```ts
// features/onboarding/api/onboarding.ts:70-81 — current state
export async function skipOnboarding(orgId: number): Promise<void> {
  const store = await cookies();
  store.set({
    name: 'onboarding_skipped',
    value: String(orgId),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  // ❌ Missing: revalidatePath('/dashboard', 'layout')
}
```

When `router.push('/dashboard/today')` fires after the Server Action, Next.js
App Router uses the **client-side Router Cache** (RSC payload cache). This cache
may hold a previously-rendered version of `app/dashboard/layout.tsx` that was
computed **before** the `onboarding_skipped` cookie existed. The cached layout
still reaches the `if (!isOnboarded && !hasSkipped)` branch and calls
`redirect(ROUTES.ONBOARDING)`.

### Why This Hits on Fresh Org Creation

For an existing session where the user already navigated to `/dashboard` once,
the Router Cache has an entry for the layout. For a freshly-created org the user
is routed from `selectOrganizationAction` → `redirect(ROUTES.ONBOARDING)`, so
the layout may have been rendered at the redirect origin and cached. Either way,
`revalidatePath` is the correct mechanism to force a fresh server render.

### Comparison With `acceptStructure`

`acceptStructure()` **does** call `revalidatePath('/dashboard', 'layout')`:

```ts
// features/onboarding/api/onboarding.ts:111
revalidatePath('/dashboard', 'layout');
```

`skipOnboarding()` must do the same. This is a missing line that the original
plan overlooked — it stated "setting a cookie in a Server Action automatically
invalidates the Router Cache", which is not reliably true in practice for the
layout-level RSC cache.

---

## Proposed Fix

### Change 1 — Add `revalidatePath` to `skipOnboarding()`

**File:** `features/onboarding/api/onboarding.ts`

```ts
export async function skipOnboarding(orgId: number): Promise<void> {
  const store = await cookies();

  store.set({
    name: 'onboarding_skipped',
    value: String(orgId),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  revalidatePath('/dashboard', 'layout'); // ← add this line
}
```

`revalidatePath` is already imported at line 3 of this file (used by
`acceptStructure`). No new import needed.

> **Why `'layout'`?** The `'layout'` second argument invalidates the layout
> segment and all its children. The onboarding gate lives in
> `app/dashboard/layout.tsx`, so `'/dashboard'` + `'layout'` is the minimal
> correct scope — same pattern used by `acceptStructure`.

---

## Acceptance Criteria

- [x] After creating a new org → arriving at `/onboarding` → clicking "Skip for
      now": user lands on `/dashboard/today` with no flash and no redirect back
- [x] Clicking "Skip for now" from any wizard step (input, needs_info, error,
      timeout) navigates cleanly to the dashboard
- [x] After skip, navigating to `/dashboard/today`, `/dashboard/issues`, etc.
      works without redirect loop
- [x] After browser restart (session cookie cleared), the onboarding gate
      correctly redirects unboarded users back to `/onboarding` — the fix does
      not permanently suppress the gate

---

## Files to Modify

| File                                    | Change                                                             |
| --------------------------------------- | ------------------------------------------------------------------ |
| `features/onboarding/api/onboarding.ts` | Add `revalidatePath('/dashboard', 'layout')` to `skipOnboarding()` |

**Total: 1 line added.**

---

## References

- `features/onboarding/api/onboarding.ts:70–81` — `skipOnboarding` (add
  `revalidatePath`)
- `features/onboarding/api/onboarding.ts:111` — `acceptStructure` already calls
  `revalidatePath('/dashboard', 'layout')` — same pattern to replicate
- `app/dashboard/layout.tsx:26–38` — the onboarding gate that checks
  `onboarding_skipped` cookie
- `docs/plans/2026-05-14-fix-onboarding-redirect-loop-and-edge-cases-plan.md` —
  the original redirect loop fix that introduced `skipOnboarding()`
