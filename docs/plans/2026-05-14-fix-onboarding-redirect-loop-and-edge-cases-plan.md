---
title: 'fix: Onboarding infinite redirect loop and edge case hardening'
type: fix
status: active
date: 2026-05-14
---

# fix: Onboarding infinite redirect loop and edge case hardening

## Enhancement Summary

**Deepened on:** 2026-05-14 **Research agents used:** security-sentinel,
architecture-strategist, julik-frontend-races-reviewer,
kieran-typescript-reviewer, performance-oracle, code-simplicity-reviewer,
best-practices-researcher, adversarial-review, correctness-verification,
framework-docs-researcher

### Key Improvements Added by Research

1. **`try/finally` is required in `handleAccept`, `handleGenerate`, and
   `handleSkip`** — Missing `finally` blocks cause permanent UI lockouts on
   unexpected throws; all three async handlers need them.
2. **Org-scoped cookie is REQUIRED, not optional** — Unscoped
   `onboarding_skipped=1` allows skipping Org A to bypass Org B's onboarding
   gate; `value: String(orgId)` must be used.
3. **`cookies().set()` in Server Component layouts is architecturally impossible
   in Next.js** — The "heal the cookie in the layout" enhancement is removed
   from scope; it would throw at runtime.
4. **`POLL_RESULT` reducer has no step guard** — A late poll tick can snap
   `input` → `preview` unexpectedly; this is a documented architectural gap.
5. **Cancel button requires explicit prop wiring** — `OnboardingProcessingStep`
   currently renders with zero props; the `onCancel` prop must be threaded
   through the wizard render.
6. **`handleSkip` must wrap `skipOnboarding()` in try/catch and always
   navigate** — If the Server Action fails, navigation must still proceed to
   prevent a new stuck state.
7. **`isSubmitting` in `handleGenerate` becomes dead code after
   `GENERATE_STARTED` dispatch** — It can be removed; the step transition
   provides the real guard.

---

## Overview

The onboarding wizard has an infinite redirect loop triggered by a specific
interaction sequence: user fills in fields → clicks "Generate structure" →
backend starts AI generation (draft status: `pending`/`processing`) → user
clicks "Back" → user clicks "Skip for now" → user is permanently trapped, unable
to reach the dashboard.

Beyond the primary bug, the onboarding flow has several additional edge cases,
security gaps, and code quality issues identified during this audit.

---

## Problem Statement

### Primary Bug: Infinite Redirect Loop

**Trigger sequence:**

1. User is on `/onboarding`, fills in description, clicks "Generate structure"
2. `generateStructure()` Server Action fires → backend creates a draft with
   `status: 'pending'`
3. Wizard transitions to `step: 'processing'` — spinner is shown
4. User clicks browser Back button OR the wizard has a `BACK_TO_INPUT` dispatch
5. Wizard returns to `step: 'input'`
6. User clicks "Skip for now" → `handleSkip()` →
   `router.push('/dashboard/today')`

**What happens next (the loop):**

`/dashboard/today` is rendered inside `app/dashboard/layout.tsx`, which runs the
onboarding gate:

```ts
// app/dashboard/layout.tsx:26–38
const isOnboarded = cookieStore.get('org_onboarded')?.value === '1';
if (!isOnboarded) {
  const { data: org } = await getOrganization(orgId);
  if (!org?.onboarded_at) {
    redirect(ROUTES.ONBOARDING); // ← user sent back to /onboarding
  }
}
```

Since "Skip for now" does NOT set the `org_onboarded` cookie or call
`acceptStructure`, the gate correctly redirects to `/onboarding`. Once at
`/onboarding`, the Server Component calls `getLatestDraft(orgId)`, which returns
the still-in-flight draft with `status: 'pending'` or `'processing'`. The
`buildInitialState` function sees this and initializes the wizard to
`step: 'processing'`.

**The trap:** `OnboardingProcessingStep` renders ONLY a spinner with no Back,
Skip, or Cancel affordances. The user is stuck. Every attempt to navigate to the
dashboard repeats the same cycle until either:

- The AI generation completes (transitions to `preview` or `error`)
- The 15-minute polling timeout fires (transitions to `timeout`, but "Go to
  dashboard" on that screen also triggers the same loop)

### Root Cause Analysis

The issue has **two interacting parts**:

1. **`processing` step has no escape hatch** — The dashboard gate correctly
   blocks unboarded users. The SSR page correctly restores `step: 'processing'`
   from an in-flight draft. But the processing step UI has zero navigation
   affordances, so the user cannot exit.

2. **`timeout` step's "Go to dashboard" also loops** — The `timeout` state has a
   "Go to dashboard" button that calls `handleSkip()`, which also triggers the
   same dashboard gate redirect.

3. **`useOnboardingPoll` cleanup cannot cancel a scheduled `setTimeout`** — The
   `poll()` function at line 73 of `use-onboarding-poll.ts` discards the
   `setTimeout` return value. The cleanup sets `active = false` and
   `stoppedRef.current = true`, but a scheduled tick that fires after unmount
   will still call `fetchDraft()`. The `!active` guard prevents the dispatch,
   but the network request is wasted.

### Secondary Issues

4. **`buildInitialState` always forces `processing` from a pending/processing
   draft** — When the user deliberately navigates to `/onboarding` after
   skipping, they get dropped into the spinner with no way out.

5. **`latestDraft` API route 404 handling** — The backend `latestDraft` uses
   `firstOrFail()`, which throws 404. The frontend `getLatestDraft()` correctly
   handles it as `null`. The `/api/onboarding/draft/route.ts` also handles 404
   (returns `{ status: 'not_found' }`). Already correct — no fix needed.

6. **`app/onboarding/page.tsx` does not pass `redirectAfterSkip`** — Skip falls
   back to the hardcoded `ROUTES.DASHBOARD.TODAY` (which triggers the gate
   loop).

7. **Profile onboarding page does not check `org` existence** —
   `ProfileOnboardingPage` does `orgId={org?.id ?? Number(orgId)}`. If `org` is
   null, `Number(orgId)` could be `NaN`.

8. **Double-submit race condition in `handleAccept`** — `isSubmitting` state is
   asynchronous. A user double-clicking before React re-renders can trigger two
   `acceptStructure` calls.

9. **`handleAccept` / `handleGenerate` missing `try/finally`** — If
   `acceptStructure()` or `generateStructure()` re-throws a non-`ServerError`
   (e.g., network drop), `setIsSubmitting(false)` is never called. The button
   stays permanently disabled until page refresh.

10. **`handleGenerate` ordering: `setIsSubmitting(true)` after
    `dispatch('GENERATE_STARTED')`** — `GENERATE_STARTED` immediately
    transitions to `processing` step, unmounting the input UI. `isSubmitting`
    becomes dead code at that point. This should be cleaned up.

---

## Proposed Solution

### Fix 1 (Primary): Set org-scoped session cookie on skip

**Why the cookie approach is correct:** Setting a cookie is the only way to
communicate "user explicitly chose to skip" across the server-side redirect
boundary. The alternative (adding a query parameter to the dashboard URL) is
visible to users and doesn't survive redirects. Middleware would require
significant restructuring.

**The `skipOnboarding(orgId: number)` Server Action:**

```ts
// features/onboarding/api/onboarding.ts
export async function skipOnboarding(orgId: number): Promise<void> {
  const store = await cookies();
  store.set({
    name: 'onboarding_skipped',
    value: String(orgId), // org-scoped: prevents Org A skip from bleeding to Org B
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // No maxAge → session cookie (cleared on browser close)
  });
}
```

> **Research insight (security):** `sameSite: 'lax'` is correct here. `'strict'`
> would break OAuth redirect flows. The cookie value stores the orgId (not
> `'1'`) — org-scoping is **required for correctness**, not optional. An
> unscoped `'1'` value allows a user who skipped Org A to bypass Org B's
> onboarding gate when they switch organizations.

> **Research insight (architecture):** This pattern follows the same shape as
> `acceptStructure()` in `onboarding.ts:86–96` which already calls
> `cookies().set()` in a Server Action called from a Client Component. This is
> an explicitly supported Next.js App Router pattern.

**The updated `handleSkip()` — always navigates, even on SA failure:**

```ts
async function handleSkip() {
  try {
    await skipOnboarding(orgId);
  } catch {
    // Cookie write failed — proceed with navigation anyway.
    // Worst case: user is re-redirected on next visit and can skip again.
    // Do NOT leave the user stuck here.
  }
  router.push(redirectAfterSkip ?? ROUTES.DASHBOARD.TODAY);
}
```

> **Research insight (race conditions):** Calling `router.push()` after
> component unmount is safe in Next.js App Router — it operates on the router
> singleton, not React component state. No warning, no error, navigation
> succeeds.

> **Research insight (performance):** The `await skipOnboarding()` round-trip
> takes 50–200ms on LAN. This is required for correctness — if we
> `router.push()` before the cookie is set, the dashboard layout re-renders
> before reading the cookie and still redirects. The `await` is not optional.

**Dashboard layout gate — add `onboarding_skipped` check:**

```ts
// app/dashboard/layout.tsx
const isOnboarded = cookieStore.get('org_onboarded')?.value === '1';
const skippedOrgId = cookieStore.get('onboarding_skipped')?.value;
const orgIdFromCookie = cookieStore.get('organization_id')?.value;
const hasSkipped =
  skippedOrgId !== undefined && skippedOrgId === orgIdFromCookie;

if (!isOnboarded && !hasSkipped) {
  if (orgIdFromCookie) {
    const { data: org } = await getOrganization(orgIdFromCookie);
    if (!org?.onboarded_at) {
      redirect(ROUTES.ONBOARDING);
    }
  }
}
```

> **Research insight (performance):** Cookie reads are in-process synchronous
> operations — zero I/O overhead. The extra `onboarding_skipped` check adds
> effectively zero latency. The `getOrganization()` DB call is the only real
> cost, and both cookie checks serve as short-circuits to avoid it.

> **Research insight (architecture — IMPORTANT CONSTRAINT):** Do NOT add
> `cookies().set()` in this layout file. `app/dashboard/layout.tsx` is a Server
> Component, not a Server Action. In Next.js 16, `cookies().set()` throws
> `"Cookies can only be modified in a Server Action or Route Handler"` if called
> in a Server Component. The "heal the cookie in the layout" enhancement
> described in earlier plan drafts is **architecturally impossible** and has
> been removed from scope.

### Fix 2: Fix `useOnboardingPoll` `setTimeout` cleanup leak

```ts
// features/onboarding/hooks/use-onboarding-poll.ts
useEffect(() => {
  if (!enabled) return;
  let active = true;
  let timerId: ReturnType<typeof setTimeout> | null = null;
  stoppedRef.current = false;
  attemptsRef.current = 0;

  async function poll() {
    if (!active || stoppedRef.current) return;

    if (attemptsRef.current >= POLL_MAX_ATTEMPTS) {
      stoppedRef.current = true;
      onTimeoutRef.current();
      return;
    }

    attemptsRef.current++;

    try {
      const draft = await fetchDraft(orgId);
      if (!active || stoppedRef.current) return;

      if (draft !== null) {
        onResultRef.current(draft);
        if (isDone(draft)) return;
      }
    } catch {
      // Network error — keep polling
    }

    timerId = setTimeout(poll, POLL_INTERVAL_MS);
  }

  timerId = setTimeout(poll, POLL_INTERVAL_MS);

  return () => {
    active = false;
    stoppedRef.current = true;
    if (timerId !== null) clearTimeout(timerId);
  };
}, [orgId, enabled]);
```

> **Research insight (race conditions):** The single `timerId` variable is
> correct because the poll chain is strictly sequential — each tick schedules
> the next only AFTER the async `fetchDraft` returns. There is no concurrent
> tick overlap.

> **Research insight (race conditions):** Rapid `enabled` flip (false→true) is
> safe. React guarantees cleanup runs synchronously before the new effect body.
> Old `active` closure variable is false, new one is true — two distinct
> closures, no interference.

> **Note on AbortController:** Using `AbortController` to cancel the in-flight
> `fetchDraft` would also cancel spurious network requests after unmount, but
> it's engineering overkill for a 5-second polling interval. The `active` flag
> correctly suppresses dispatch; the wasted network roundtrip is acceptable.

### Fix 3: `try/finally` in `handleAccept` + ref-based double-submit guard

```ts
// features/onboarding/ui/onboarding-wizard.tsx
const isSubmittingRef = useRef(false);

async function handleAccept() {
  if (state.step !== 'preview' || isSubmittingRef.current) return;

  isSubmittingRef.current = true;
  setIsSubmitting(true);

  try {
    // ... build payload ...
    const result = await acceptStructure(orgId, payload);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success('Organization set up!', {
      description: 'Your goals are ready in the issue tracker.',
      duration: 5000,
    });
    router.push(redirectAfterAccept ?? ROUTES.DASHBOARD.ISSUES_LIST);
  } finally {
    isSubmittingRef.current = false;
    setIsSubmitting(false);
  }
}
```

> **Research insight (race conditions — CRITICAL):** The `try/finally` block is
> **required**. `acceptStructure()` re-throws non-`ServerError` exceptions
> (network failure, runtime error). Without `finally`, `isSubmittingRef.current`
> stays `true` permanently and the Accept button is locked forever until page
> reload. This bug exists in the current code and must be fixed here.

> **Research insight (double-submit):** `useRef`-based guard is correct.
> `useState` is asynchronous — a rapid double-click within the same event loop
> tick reads the previous render's `isSubmitting: false` and bypasses the guard.
> `useRef` mutation is synchronous and correctly prevents the second call.

### Fix 4: `try/finally` in `handleGenerate` + remove dead `isSubmitting` call

```ts
async function handleGenerate() {
  if (isSubmitting || hasFilePending) return;

  const payload = {
    description: inputState.description.trim(),
    // ...
  };

  dispatch({ type: 'GENERATE_STARTED' });
  // Note: setIsSubmitting(true) removed — GENERATE_STARTED immediately
  // transitions to processing step, unmounting the input UI and making
  // the isSubmitting guard irrelevant. The real protection is the step
  // transition itself and the if-guard at the top of this function.

  try {
    const result = await generateStructure(orgId, payload);

    if (result.error) {
      toast.error(result.error);
      dispatch({ type: 'BACK_TO_INPUT' });
    }
  } catch {
    dispatch({ type: 'BACK_TO_INPUT' });
    throw; // re-throw unexpected errors to error boundary
  }
}
```

> **Research insight (simplicity):** `setIsSubmitting(true)` in `handleGenerate`
> is dead code — React 19 batches the `setIsSubmitting` and `dispatch` updates
> in the same microtask. When the re-render fires, `step === 'processing'` and
> the input UI is gone. No component reads `isSubmitting` at that point.
> Removing it eliminates confusion. The
> `if (isSubmitting || hasFilePending) return` guard at the top still works
> because it reads the previous render's state value synchronously.

### Fix 5: Add `CANCEL_GENERATION` action + Cancel button in processing step

**Reducer addition (`features/onboarding/model/wizard-reducer.ts`):**

```ts
// WizardAction type — add new member:
| { type: 'CANCEL_GENERATION' }

// Reducer case:
case 'CANCEL_GENERATION': {
  return { step: 'input', inputState };
}
```

> **Note on `CANCEL_GENERATION` vs `BACK_TO_INPUT`:** Both transitions produce
> `{ step: 'input', inputState }`. `CANCEL_GENERATION` is semantically distinct
> — it comes from user intent to abort, while `BACK_TO_INPUT` comes from seeing
> preview and wanting to edit. Keep them separate for clarity and to allow
> divergent logic in the future (e.g., cancelling might eventually call a
> backend abort endpoint if one is added).

**`OnboardingProcessingStep` — add Cancel affordance:**

```tsx
// features/onboarding/ui/onboarding-processing-step.tsx
interface Props {
  onCancel?: () => void;
}

export function OnboardingProcessingStep({ onCancel }: Props) {
  return (
    <div className='flex flex-col items-center justify-center gap-6 py-16 text-center'>
      <Loader2 className='h-10 w-10 animate-spin text-primary' />
      <div>
        <h2 className='text-xl font-semibold text-foreground'>
          Analyzing your organization
        </h2>
        <p className='mt-2 text-sm text-muted-foreground max-w-sm'>
          Our AI is generating a structure based on your description. This
          usually takes 30–60 seconds.
        </p>
      </div>
      {onCancel && (
        <button
          type='button'
          className='text-sm text-muted-foreground hover:underline focus-visible:outline-none focus-visible:underline'
          onClick={onCancel}
        >
          Cancel and skip for now
        </button>
      )}
    </div>
  );
}
```

**Wire `onCancel` in the wizard (critical prop threading):**

```tsx
// features/onboarding/ui/onboarding-wizard.tsx
// In the processing step render:
if (state.step === 'processing') {
  return (
    <OnboardingProcessingStep
      onCancel={async () => {
        dispatch({ type: 'CANCEL_GENERATION' });
        // Also skip immediately — user chose to abort
        await handleSkip();
      }}
    />
  );
}
```

> **Research insight (correctness — CRITICAL):** `OnboardingProcessingStep`
> currently renders with **zero props** at `onboarding-wizard.tsx:193`:
> `return <OnboardingProcessingStep />;`. The `onCancel` prop MUST be explicitly
> threaded through this render call. Without this wiring, the Cancel button
> never appears regardless of what is added to the component.

> **Research insight (UX note):** When `CANCEL_GENERATION` dispatches, the
> wizard's `inputState` will be `EMPTY_INPUT` because `buildInitialState` for a
> `pending/processing` draft returns `EMPTY_INPUT`. The description the user
> typed before generating is lost on page refresh. This is a UX regression that
> can be addressed in a follow-up by persisting `inputState` to
> `sessionStorage`.

> **Note on backend draft after cancel:** Dispatching `CANCEL_GENERATION` does
> NOT cancel the backend job — the AI generation continues. If the user re-opens
> the wizard later, `buildInitialState` will detect the completed draft and show
> the `preview` step. This is intentional and correct.

### Fix 6: Guard null `org` in profile onboarding page

```ts
// app/dashboard/profile/onboarding/page.tsx
export default async function ProfileOnboardingPage() {
  const orgId = await getOrganizationId();
  const [{ data: org }, initialDraft] = await Promise.all([
    getOrganization(orgId),
    getLatestDraft(orgId),
  ]);

  if (!org) {
    redirect(ROUTES.DASHBOARD.PROFILE_ACCOUNT);
  }

  if (org.onboarded_at) {
    redirect(ROUTES.DASHBOARD.PROFILE_ACCOUNT);
  }

  return (
    <OnboardingWizard
      orgId={org.id}
      orgName={org.name}
      initialDraft={initialDraft}
      redirectAfterSkip={ROUTES.DASHBOARD.PROFILE_ACCOUNT}
      redirectAfterAccept={ROUTES.DASHBOARD.PROFILE_ACCOUNT}
    />
  );
}
```

> **Research insight:** Note `org.id` (not `org?.id ?? Number(orgId)`) after the
> null guard. Eliminates `NaN` risk entirely.

---

## Technical Approach

### Files to Modify

| File                                                    | Change                                                                                                                                                               |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/onboarding/api/onboarding.ts`                 | Add `skipOnboarding(orgId: number)` Server Action (org-scoped cookie, session-scoped)                                                                                |
| `features/onboarding/ui/onboarding-wizard.tsx`          | `handleSkip()` async with try/catch; `handleAccept` try/finally + ref guard; `handleGenerate` remove dead `setIsSubmitting`; wire `onCancel` prop to processing step |
| `features/onboarding/ui/onboarding-processing-step.tsx` | Add `onCancel?: () => void` prop + Cancel button                                                                                                                     |
| `features/onboarding/model/wizard-reducer.ts`           | Add `CANCEL_GENERATION` to `WizardAction` union and reducer                                                                                                          |
| `features/onboarding/hooks/use-onboarding-poll.ts`      | Store `timerId`, `clearTimeout` in cleanup                                                                                                                           |
| `app/dashboard/layout.tsx`                              | Check `onboarding_skipped` cookie (org-scoped comparison). **Do NOT write cookies here.**                                                                            |
| `app/dashboard/profile/onboarding/page.tsx`             | Guard null `org` with early redirect                                                                                                                                 |

### TypeScript Notes

> **Research insight (TypeScript):** `ReturnType<typeof setTimeout>` is the
> correct type in Next.js — it resolves to `NodeJS.Timeout` in Node.js context
> and `number` in browser context. Using `ReturnType<typeof setTimeout>` is the
> right cross-environment approach, preferred over explicitly typing
> `NodeJS.Timeout | number`. The idiomatic pattern:
> `let timerId: ReturnType<typeof setTimeout> | null = null`.

> **Research insight (TypeScript):** `orgId` is `number` in the wizard component
> (from `org.id`). `String(orgId)` in the Server Action produces a clean decimal
> string. `organization_id` cookie value in the layout is also a decimal string
> (set by `selectOrganizationAction`). The comparison
> `skippedOrgId === orgIdFromCookie` is string-to-string equality — both are
> decimal integers as strings. No float or leading-zero edge case possible from
> integer IDs.

> **Research insight (TypeScript):** `useRef(false)` has correct type inference
> as `MutableRefObject<boolean>`. No need for `useRef<boolean>(false)`.

### Next.js Platform Constraints (Confirmed by Official Docs)

> **Confirmed:** `cookies().set()` is NOT allowed in Server Components
> (layouts/pages). It throws
> `"Cookies can only be modified in a Server Action or Route Handler"`. This is
> by design — Server Component rendering has no HTTP response object to write
> `Set-Cookie` headers to. Only Server Actions and Route Handlers own the
> response cycle. Source:
> [Next.js cookies API reference](https://nextjs.org/docs/app/api-reference/functions/cookies).

> **Confirmed:** Setting a cookie in a Server Action **automatically invalidates
> the Router Cache** (client-side navigation cache). No `revalidatePath` is
> needed for the route cache to be fresh after `skipOnboarding()` sets its
> cookie. However, if server-side fetch caches need busting, `revalidatePath` is
> still required. For this fix, no `revalidatePath` is needed in
> `skipOnboarding()` since we only need the next navigation to re-evaluate the
> layout gate. Source:
> [Next.js caching docs](https://nextjs.org/docs/app/getting-started/caching).

> **Confirmed:** `router.push()` after component unmount (or when component is
> in `Activity hidden` state in Next.js 16's view transitions) is safe — it
> operates on the router singleton, not component state. No warning, no error.
> In Next.js 16's Activity/Offscreen model, components may remain in
> `display: none` rather than truly unmounting, so cleanup effects may not fire
> on navigation. This is not relevant to our fix but is worth knowing for future
> work. Source:
> [React Activity GitHub discussion](https://github.com/vercel/next.js/discussions/87110).

### Acceptance Criteria

#### Primary Bug Fix

- [ ] User fills in fields → clicks "Generate" → clicks "Back" → clicks "Skip
      for now" → lands on `/dashboard/today` without redirect loop
- [ ] After skip, user can navigate freely within the dashboard
- [ ] After skip, user can re-enter the wizard from
      `/dashboard/profile/onboarding`
- [ ] After browser restart (session cookie cleared), the gate correctly
      redirects unboarded users to `/onboarding`
- [ ] On `/onboarding` with an in-flight draft: wizard shows processing step
      with "Cancel and skip for now" button

#### Processing step escape hatch

- [ ] Clicking "Cancel and skip for now" on processing step: (1) dispatches
      `CANCEL_GENERATION` → wizard returns to input step, AND (2) calls
      `handleSkip()` → `skipOnboarding()` cookie set → navigate to dashboard
- [ ] The background AI job continues running — if user re-enters wizard later
      and draft is complete, they see `preview` step

#### Timeout step

- [ ] "Go to dashboard" on the timeout step correctly skips (cookie set) and
      lands on dashboard without redirect loop

#### Poll cleanup

- [ ] Navigating away from the wizard while polling does not leave orphaned
      `setTimeout` ticks that make network requests

#### Double-submit guard

- [ ] Rapidly double-clicking "Confirm and continue" in preview step does not
      trigger two `acceptStructure` calls

#### Error recovery

- [ ] If `acceptStructure()` throws an unexpected error, `isSubmitting` resets
      to false (try/finally) and the Accept button is clickable again
- [ ] If `skipOnboarding()` Server Action fails, `router.push()` still navigates
      (skip wrapped in try/catch)

#### Null org guard

- [ ] `/dashboard/profile/onboarding` with a null org redirects to profile
      account instead of rendering with `NaN` orgId

### Non-Functional Requirements

- [ ] `skipOnboarding()` Server Action has `'use server'` directive (inherited
      from file-level directive)
- [ ] Session cookie has no `maxAge` (session-scoped only)
- [ ] Cookie is `httpOnly: true`, `secure: true` in production,
      `sameSite: 'lax'`
- [ ] Cookie value is org-scoped (`String(orgId)`, not `'1'`)
- [ ] `CANCEL_GENERATION` does NOT call any backend endpoint (no abort/cancel
      API exists in backend routes)
- [ ] No `cookies().set()` is added to `app/dashboard/layout.tsx` (Server
      Component — not allowed by Next.js)
- [ ] All modified files pass `npm run lint` and `npm run type-check`
- [ ] Export `skipOnboarding` from `features/onboarding/index.ts` if needed by
      other consumers (currently only used internally by the wizard)

---

## Edge Cases

### 1. User Generates → AI Completes → Back → Skip

Poll transitions wizard to `preview`. User clicks "Back" → `BACK_TO_INPUT`. User
clicks "Skip for now" → `skipOnboarding()` sets cookie → navigate to dashboard.
Gate: `hasSkipped=true` → passes. ✓

### 2. User Generates → AI Completes → User Comes Back Later (Session Cookie Cleared)

After browser restart, `onboarding_skipped` is gone. Gate DB check runs →
`onboarded_at` is null → redirects to `/onboarding`. SSR: `getLatestDraft()`
returns completed draft → `buildInitialState` shows `preview` step. User can
accept or skip again. ✓

### 3. User Generates → Skip → Later Accepts From Profile Tab

User navigates to `/dashboard/profile/onboarding`. Session cookie still present
→ gate bypassed. Backend draft may be completed → `buildInitialState` shows
`preview`. User accepts → `acceptStructure()` sets `org_onboarded=1`. ✓

### 4. Two Browser Tabs — One Skips, One Is On Processing

Tab B sets `onboarding_skipped`. Tab A's poll completes → `preview`. No crash.
Tab A still needs separate accept/skip. ✓

### 5. `generate-structure` API Fails (5xx)

`generateStructure()` → `{ error: message }`. Wizard dispatches `BACK_TO_INPUT`.
Skip path works with cookie fix. ✓

### 6. `skipOnboarding()` Server Action Fails

`handleSkip()` wraps in try/catch → navigation happens regardless. User may be
re-redirected on next visit but can skip again. **Not a permanent trap.** ✓

### 7. `latestDraft` Returns 404 (No Draft Exists)

`getLatestDraft()` → `null`. `buildInitialState(null)` → `step: 'input'`. ✓

### 8. `acceptStructure` Returns 422 (Already Onboarded in DB)

Backend returns 422. `acceptStructure()` → `{ error: parsed.message }`. Toast
error, `isSubmitting` resets via `finally`. `org_onboarded` cookie not set. On
next dashboard navigation, DB fallback check runs → `onboarded_at` IS set → gate
does NOT redirect. User reaches dashboard. The `org_onboarded` cookie is never
set in this path, so every subsequent unboarded-cookie dashboard visit incurs
the `getOrganization()` call. **Acceptable behavior — not worth the complexity
of fixing in this PR.**

> **Architecture constraint reminder:** The "lazy cookie heal" (set
> `org_onboarded=1` in the layout when DB check confirms onboarding) is NOT
> possible in a Server Component layout. It would require a separate Server
> Action or middleware change. Out of scope for this fix.

### 9. Organization Switched Mid-Onboarding

User skipped Org A (cookie: `onboarding_skipped=123`). Switches to Org B (org_id
cookie becomes `456`). Layout: `skippedOrgId === orgIdFromCookie` →
`"123" === "456"` → false. Gate fires DB check. Org B not onboarded → redirect
to `/onboarding`. **Correct behavior** — org-scoped cookie prevents skip bleed.
✓

### 10. Skip+Complete Concurrency: Poll Completes While Skip Is In-Flight

User is on processing step. Poll returns completed draft → `POLL_RESULT` →
wizard transitions to `preview`. Simultaneously, user had already clicked Cancel
→ `skipOnboarding()` SA is in-flight. SA resolves → `router.push('/dashboard')`.
User never sees the preview. **Acceptable behavior** — the completed draft is
preserved on the backend. If the user re-enters the wizard (from profile or
directly), `buildInitialState` loads the completed draft and shows `preview`. No
data loss.

### 11. POLL_RESULT Fires on `input` Step (Late Tick Race)

The `POLL_RESULT` reducer has no step guard. If the `active` flag check somehow
fails (edge case where the in-flight network call resolves in the same microtask
as the cleanup), a `POLL_RESULT` with a completed draft can transition `input` →
`preview` unexpectedly.

**Analysis:** The `active` flag in `useOnboardingPoll` guards this correctly —
after `CANCEL_GENERATION` sets `enabled=false`, the effect cleanup sets
`active=false` before any new render. In-flight requests check `active` after
resolving. Fix 2's `clearTimeout` prevents new ticks from starting. The window
where a `POLL_RESULT` could fire on `input` step is effectively zero. **Document
as a known architectural gap** but no code fix needed. If unexpected behavior is
observed, add a step guard to the reducer:
`if (state.step !== 'processing') return state`.

---

## Security Considerations

### Cookie Hardening

All onboarding-related cookies must use:

```ts
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
}
```

- `httpOnly: true` — prevents JS access (XSS mitigation)
- `secure: false` in development is intentional — HTTPS is not available
  locally. This is standard Next.js practice and does not create a production
  security gap.
- `sameSite: 'lax'` — sufficient. `'strict'` would break cross-site navigation
  flows (OAuth redirects). The cookie is a skip flag, not a write-permission
  token.
- No `maxAge` on `onboarding_skipped` — session-scoped, auto-cleared on browser
  close

### Why httpOnly Protects Against Forgery

An attacker cannot forge the `onboarding_skipped` cookie client-side because
`httpOnly` prevents JavaScript access. The only way to set it is via the
`skipOnboarding()` Server Action, which requires a valid Sanctum Bearer token
(all Server Actions are authenticated). An authenticated user forging their own
skip cookie gains only the ability to bypass their own onboarding — which is a
legitimate user action. No security concern.

### What `sameSite: 'lax'` Permits and Blocks

- **Blocks:** Cookie is NOT sent on cross-site POST requests (primary CSRF
  vector)
- **Allows:** Cookie IS sent on top-level GET navigations (needed for
  `router.push` to work correctly after skip)

---

## Implementation Order

1. **`features/onboarding/api/onboarding.ts`** — Add
   `skipOnboarding(orgId: number)` Server Action (org-scoped cookie)
2. **`features/onboarding/model/wizard-reducer.ts`** — Add `CANCEL_GENERATION`
   to `WizardAction` union and reducer case
3. **`features/onboarding/ui/onboarding-processing-step.tsx`** — Add
   `onCancel?: () => void` prop + Cancel button UI
4. **`features/onboarding/ui/onboarding-wizard.tsx`** — Wire all changes:
   - `handleSkip()` → async, try/catch around `skipOnboarding(orgId)`, always
     navigate
   - `handleAccept()` → `isSubmittingRef` guard + `try/finally` to reset ref and
     state
   - `handleGenerate()` → remove dead `setIsSubmitting(true)`, add try/catch for
     re-throw
   - Processing step render → pass `onCancel` prop
5. **`features/onboarding/hooks/use-onboarding-poll.ts`** — Store `timerId`,
   `clearTimeout` in cleanup
6. **`app/dashboard/layout.tsx`** — Add `onboarding_skipped` cookie check
   (org-scoped). No `cookies().set()`.
7. **`app/dashboard/profile/onboarding/page.tsx`** — Guard null `org` with early
   redirect

---

## References

### Internal Code

- `features/onboarding/api/onboarding.ts:70–113` — `acceptStructure` (reference
  pattern for cookie-setting Server Action)
- `features/onboarding/api/onboarding.ts:86–96` — existing `cookies().set()`
  call (verify security settings match)
- `features/onboarding/model/wizard-reducer.ts:149–153` — `GENERATE_STARTED`
  case (reference for `CANCEL_GENERATION` shape)
- `features/onboarding/model/wizard-reducer.ts:153–189` — `POLL_RESULT` case (no
  step guard — documented gap)
- `app/dashboard/layout.tsx:26–38` — the onboarding gate to extend
- `features/onboarding/hooks/use-onboarding-poll.ts:43–83` — polling cleanup bug
  (Fix 2)
- `features/onboarding/ui/onboarding-wizard.tsx:102–127` — `handleGenerate` dead
  `isSubmitting` (Fix 4)
- `features/onboarding/ui/onboarding-wizard.tsx:129–184` — `handleAccept`
  missing try/finally (Fix 3)
- `features/onboarding/ui/onboarding-wizard.tsx:192–194` — zero-prop
  `<OnboardingProcessingStep />` render (must add `onCancel`)
- `app/onboarding/page.tsx:25–31` — `OnboardingWizard` usage without redirect
  props (skip defaults to `ROUTES.DASHBOARD.TODAY` which works after the cookie
  fix)
- `app/dashboard/profile/onboarding/page.tsx:10–29` — null org unsafe access
  (Fix 6)

### Backend

- `OnboardingController.php:26–29` — `generate()` cancels any pending/processing
  draft before creating a new one. Calling `generateStructure` a second time
  DOES replace the old draft.
- `OnboardingController.php:64–66` — `accept()` returns 422 if already onboarded
- `routes/api.php:272–278` — No cancel/delete endpoint for drafts. Backend job
  runs to completion regardless of frontend cancel.

### Related Plans

- `docs/plans/2026-05-13-fix-onboarding-skip-and-ux-improvements-plan.md` — UX
  improvements (textarea auto-grow, description overflow)
- `docs/plans/2026-05-13-feat-onboarding-goals-appear-in-issues-plan.md` —
  Post-onboarding issue redirect
- `docs/solutions/integration-issues/server-action-html-response-json-parse.md`
  — Server Action HTML error pattern. NOT applicable to `skipOnboarding()` (no
  backend HTTP call), but applies to `generateStructure` and `acceptStructure`.
