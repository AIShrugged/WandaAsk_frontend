---
title: 'fix: Onboarding skip behavior + UX improvements'
type: fix
status: active
date: 2026-05-13
---

# fix: Onboarding skip behavior + UX improvements

## Enhancement Summary

**Deepened on:** 2026-05-13 **Research agents used:** 14 parallel agents —
TypeScript reviewer, race conditions reviewer, code simplicity reviewer,
architecture strategist, security sentinel, performance oracle, pattern
recognition specialist, UX best-practices researcher, Next.js framework docs
researcher, coherence

- feasibility reviewer, product + design lens reviewer, scope guardian +
  adversarial reviewer, learnings researcher, E2E coverage agent.

### Key Improvements Added by Research

1. **Critical architectural fix**: `onSkip` must be `redirectAfterSkip: string`
   (not a function callback) — Server Components cannot pass `() => void` across
   the server/client boundary. Both `app/onboarding/page.tsx` and
   `app/dashboard/profile/onboarding/page.tsx` are Server Components; string
   props are serializable, function props are not.

2. **Bug discovered by race conditions agent**: `handleSkip` currently has
   `setIsSubmitting(false)` missing on the success path (line 197) — after the
   new server-action-free skip is implemented this is moot, but also discovered
   that `onboarding-file-upload.tsx` has no mounted-check in its upload
   `.then()`.

3. **localStorage must use `buildInitialState` lazy initializer**, not
   `useEffect` — avoids the SSR flash-of-empty-state. Use
   `globalThis.localStorage` (ESLint `unicorn/prefer-global-this`), validate
   restored JSON with Zod `safeParse`, scope key to
   `onboarding_draft_${userId}_${orgId}` (not just orgId — shared-device
   security).

4. **`animate-in fade-in` IS available** — confirmed in `PopupProvider.tsx:157`.
   No new dependency needed. Use `animate-in fade-in-0` (not `fade-in`) to match
   the existing pattern.

5. **Step indicator: pass scalar `step` + `totalSteps` props**, not a
   `ReactNode` stepBadge prop — consistent with how all other control-flow data
   (isSubmitting, hasFilePending) flows in this codebase. Render the badge
   inside each step component.

6. **Processing step: use `setTimeout` chain** (not `setInterval`) — matches the
   existing `ThinkingIndicator` pattern in
   `features/chat/ui/thinking-indicator.tsx`. Avoids tab-background drift, safer
   cleanup.

7. **Scope split recommendation**: Bug fix (3 files, ~20 LOC) should ship
   independently from UX polish. Four of the seven proposed file changes are
   pure UX work that can be a follow-up PR.

8. **New FSD violation found**: `app/onboarding/page.tsx:4` imports directly
   from `@/features/onboarding/ui/onboarding-wizard` — must change to
   `@/features/onboarding` (public API via `index.ts`).

9. **Duplicate `getLatestDraft` function** exists verbatim in both onboarding
   pages and uses raw `fetch` + manual auth headers — violates CLAUDE.md Rule 2.
   Should be extracted to `features/onboarding/api/onboarding.ts` using
   `httpClient`.

### New Considerations Discovered

- `onSkip` function prop cannot cross the Server/Client boundary — use
  `redirectAfterSkip: string`
- `onboarding-file-upload.tsx` has a stale state-update-after-unmount bug
  (upload `.then()` has no mounted check) — should be fixed alongside this PR
- `JSON.parse(raw) as T` is unsafe — Zod `safeParse` with a typed schema is
  required
- `use-onboarding-poll.ts` discards the `setTimeout` return value, making
  cancel-on-cleanup unreliable for one tick
- `lucide-react` is not in `optimizePackageImports` in `next.config.ts` — free
  bundle win to add

---

## Overview

The "Skip for now" button in the onboarding wizard currently calls
`skipOnboarding()`, which internally calls `acceptStructure()` — setting
`onboarded_at` on the backend and writing the `org_onboarded` cookie. This means
skipping onboarding permanently seals the org's onboarding state, making it
impossible to re-enter the wizard from the profile tab or `/onboarding` route.

The correct behavior: **skip = just leave**, no backend mutation. Additionally,
the onboarding is the first screen a new user sees, so its UX quality directly
impacts conversion. This plan covers the core fix, optional localStorage draft
persistence, and UX improvements to make the wizard feel polished and "selling".

---

## Problem Statement

### 1. Skip calls `acceptStructure` — incorrect

```
handleSkip() → skipOnboarding(orgId, orgName, orgDescription) → acceptStructure(orgId, payload)
```

`acceptStructure` on the backend (`OnboardingController@accept`) does:

- Sets `organization.onboarded_at = now()`
- Creates epics/tasks from the goals payload (junk "Getting started" epic)
- Returns success → frontend sets `org_onboarded` cookie

After this, `app/dashboard/layout.tsx` gate (`org_onboarded` cookie +
`org.onboarded_at`) no longer redirects to `/onboarding`, so the user can never
re-enter the wizard unless the cookie and `onboarded_at` are manually reset in
the database.

The backend also guards against re-accepting:

```php
// OnboardingController.php:64–66
if ($organization->onboarded_at !== null) {
    return ApiResponse::error('Онбординг для этой организации уже был проведён', null, 422);
}
```

This 422 would cause `acceptStructure` to fail from the profile onboarding tab
anyway if the user had previously skipped — a double trap.

Note: all three `handleSkip` callsites share the same function —

- "Skip for now" button in `OnboardingInputStep` (line 299)
- "Go to dashboard" secondary action in the `timeout` state (line 218)
- "Skip for now" secondary action in the `error` state (line 234)

All three are intentionally fixed by making `handleSkip` a plain
`router.push()`.

### 2. No UX continuity for partial input

If the user typed a description and then skips, all that work is lost. No draft
is persisted client-side (the server draft only saves after "Generate structure"
is clicked).

### 3. Onboarding UX doesn't match a "first impression" quality bar

- `OnboardingProcessingStep` shows a bare spinner with static text for a 30–60
  second wait
- No step indicator or progress context
- No animated transitions between steps
- The page layout (`app/onboarding/layout.tsx`) is minimal — no branding

---

## Proposed Solution

### PR 1 — Core fix (ship first, ~20 LOC, 3 files)

#### Fix 1a — Replace `handleSkip` with plain navigation

**In `features/onboarding/ui/onboarding-wizard.tsx`:**

```tsx
// Before (async, calls server action)
async function handleSkip() {
  if (isSubmitting) return;
  setIsSubmitting(true);
  const result = await skipOnboarding(orgId, orgName, orgDescription);
  setIsSubmitting(false);
  if (result.error) {
    toast.error(result.error);
    return;
  }
  router.push(ROUTES.DASHBOARD.TODAY);
}

// After (sync, no server call)
function handleSkip() {
  router.push(redirectAfterSkip ?? ROUTES.DASHBOARD.TODAY);
}
```

Remove the `skipOnboarding` import. Remove `isSubmitting` state — it is no
longer needed for skip. (Keep it for `handleAccept` which still calls
`acceptStructure`.)

#### Fix 1b — `redirectAfterSkip` string prop (not a function callback)

**Critical architecture note:** Both `app/onboarding/page.tsx` and
`app/dashboard/profile/onboarding/page.tsx` are Server Components. Server
Components **cannot** pass function props (`() => void`) across the
server/client boundary — functions are not serializable. The correct pattern is
a string prop:

```tsx
// features/onboarding/ui/onboarding-wizard.tsx
interface Props {
  orgId: number;
  orgName: string;
  orgDescription: string;
  initialDraft: OnboardingDraftResponse | null;
  redirectAfterSkip?: string; // serializable — safe from Server Component
  redirectAfterAccept?: string; // optional — defaults to ROUTES.DASHBOARD.ISSUES_LIST
}

function handleSkip() {
  router.push(redirectAfterSkip ?? ROUTES.DASHBOARD.TODAY);
}

// In handleAccept success path (line 183), replace hardcoded route:
router.push(redirectAfterAccept ?? ROUTES.DASHBOARD.ISSUES_LIST);
```

Call sites in Server Components can pass these as string literals:

```tsx
// app/onboarding/page.tsx — no change needed (both props use defaults)
<OnboardingWizard
  orgId={org.id}
  orgName={org.name}
  orgDescription={org.context ?? ''}
  initialDraft={initialDraft}
/>

// app/dashboard/profile/onboarding/page.tsx
<OnboardingWizard
  orgId={org.id}
  orgName={org.name}
  orgDescription={org.context ?? ''}
  initialDraft={initialDraft}
  redirectAfterSkip={ROUTES.DASHBOARD.PROFILE_ACCOUNT}
  redirectAfterAccept={ROUTES.DASHBOARD.PROFILE_ACCOUNT}
/>
```

#### Fix 1c — Remove `skipOnboarding` from the API layer

Delete `features/onboarding/api/onboarding.ts:49–68` (the `skipOnboarding`
function). It is called only from `handleSkip`; after the fix it has zero
callers.

#### Fix 1d — Fix the FSD import violation in `app/onboarding/page.tsx`

```tsx
// Before (deep path — FSD violation)
import { OnboardingWizard } from '@/features/onboarding/ui/onboarding-wizard';

// After (public API — correct)
import { OnboardingWizard } from '@/features/onboarding';
```

---

### PR 2 — UX improvements (follow-up, ~80 LOC, 4 additional files)

#### Fix 2a — localStorage draft persistence for description

**Architecture:** Store in `buildInitialState` (reducer lazy initializer), not
in a `useEffect`. The initializer runs synchronously before the first render, so
there is no flash-of-empty-state. This is the recommended React 19 pattern for
merging localStorage into reducer state.

**Extract to a hook** (`features/onboarding/hooks/use-onboarding-draft.ts`) —
raw `localStorage` access in a component is an abstraction level violation in
this codebase.

```ts
// features/onboarding/hooks/use-onboarding-draft.ts
import { onboardingLocalDraftSchema } from '../model/schemas';

const DRAFT_KEY = (userId: number, orgId: number) =>
  `onboarding_draft_${userId}_${orgId}`;

// Scope key to BOTH userId AND orgId — shared-device security
// (two users sharing a browser could otherwise see each other's drafts)

export function loadInputDraft(
  userId: number,
  orgId: number,
): { description: string } | null {
  try {
    const raw = globalThis.localStorage?.getItem(DRAFT_KEY(userId, orgId));
    if (!raw) return null;
    const result = onboardingLocalDraftSchema.safeParse(JSON.parse(raw));
    if (!result.success) return null;
    // TTL: discard if older than 7 days
    if (Date.now() - (result.data.savedAt ?? 0) > 7 * 86400 * 1000) {
      globalThis.localStorage?.removeItem(DRAFT_KEY(userId, orgId));
      return null;
    }
    return { description: result.data.description ?? '' };
  } catch {
    return null;
  }
}

export function saveInputDraft(
  userId: number,
  orgId: number,
  description: string,
): void {
  try {
    globalThis.localStorage?.setItem(
      DRAFT_KEY(userId, orgId),
      JSON.stringify({ description, savedAt: Date.now() }),
    );
  } catch {
    // Storage quota exceeded or private mode — ignore
  }
}

export function clearInputDraft(userId: number, orgId: number): void {
  try {
    globalThis.localStorage?.removeItem(DRAFT_KEY(userId, orgId));
  } catch {
    // ignore
  }
}
```

Add schema to `features/onboarding/model/schemas.ts`:

```ts
// Add to existing schemas.ts
export const onboardingLocalDraftSchema = z.object({
  description: z.string().max(10_000).optional(),
  savedAt: z.number().optional(),
});
```

**In `buildInitialState`** (pass `userId` as a second arg, or handle in wizard
init):

Since `buildInitialState` is the third arg to `useReducer` and currently takes
`OnboardingDraftResponse | null`, the simplest approach is to call
`loadInputDraft` inside `buildInitialState` and merge it when `step === 'input'`
and no server draft:

```ts
// wizard-reducer.ts — buildInitialState signature extended
export function buildInitialState(args: {
  initialDraft: OnboardingDraftResponse | null;
  userId: number;
  orgId: number;
}): WizardStep {
  const base = deriveFromDraft(args.initialDraft);
  if (base.step === 'input') {
    const saved = loadInputDraft(args.userId, args.orgId);
    if (saved?.description) {
      return withInputState(base, {
        ...base.inputState,
        description: saved.description,
      });
    }
  }
  return base;
}
```

The wizard calls it as:

```tsx
const [state, dispatch] = useReducer(
  reducer,
  { initialDraft, userId, orgId },
  buildInitialState,
);
```

**On skip** — save before navigating:

```tsx
function handleSkip() {
  if (inputState.description.trim().length > 0) {
    saveInputDraft(userId, orgId, inputState.description);
  }
  router.push(redirectAfterSkip ?? ROUTES.DASHBOARD.TODAY);
}
```

**On accept success** — clear draft:

```tsx
// In handleAccept, after acceptStructure succeeds
clearInputDraft(userId, orgId);
router.push(redirectAfterAccept ?? ROUTES.DASHBOARD.ISSUES_LIST);
```

**Pass `userId` as a prop to `OnboardingWizard`** — it is already available in
the `app/onboarding/page.tsx` SSR context (fetch from the user cookie or pass
alongside orgId).

#### Fix 2b — Step indicator using scalar props

Pass `step` and `totalSteps` as scalar props to step components (not a
`ReactNode` badge prop — passing a composed node from the orchestrator is
inconsistent with how control-flow data flows in this codebase):

```tsx
// In onboarding-input-step.tsx — add to Props interface:
step?: number;
totalSteps?: number;

// Render above the <h1>:
{step !== undefined && totalSteps !== undefined && (
  <span className='text-xs text-muted-foreground font-medium tracking-wider uppercase'>
    Step {step} of {totalSteps}
  </span>
)}
```

Wizard passes:

```tsx
<OnboardingInputStep step={1} totalSteps={2} ... />   // input + needs_info
<OnboardingPreviewStep step={2} totalSteps={2} ... />  // preview
```

The `needs_info` state shares step 1 — the label stays "Step 1 of 2" through the
needs_info sub-step. The `processing`, `error`, and `timeout` states show no
badge (they are transition/error screens, not user steps).

#### Fix 2c — Animated step transitions

`animate-in fade-in-0` is **confirmed available** (used in
`PopupProvider.tsx:157`). No new dependency needed. Add to outermost `<div>` of
each step component:

```tsx
// onboarding-input-step.tsx — outermost div (line 62)
<div className='flex flex-col gap-6 animate-in fade-in-0 duration-300'>

// onboarding-preview-step.tsx — outermost div
<div className='flex flex-col gap-8 animate-in fade-in-0 duration-300'>
```

Add `prefers-reduced-motion` protection via Tailwind's built-in
`motion-safe:animate-in` modifier, or simply use `motion-reduce:transition-none`
on the same element:

```tsx
<div className='flex flex-col gap-6 animate-in fade-in-0 duration-300 motion-reduce:animate-none'>
```

#### Fix 2d — Processing step with staged feedback

Replace the static spinner with a `setTimeout`-chain pattern (matches
`features/chat/ui/thinking-indicator.tsx` — the established project reference):

```tsx
// features/onboarding/ui/onboarding-processing-step.tsx
'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const MESSAGES = [
  'Analyzing your description…',
  'Identifying team structure…',
  'Mapping goals and tasks…',
  'Building task breakdown…',
  'Almost there…',
] as const;

export function OnboardingProcessingStep() {
  const indexRef = useRef(0);
  const [message, setMessage] = useState(MESSAGES[0]);

  useEffect(() => {
    let cancelled = false;

    function tick() {
      if (cancelled) return;
      indexRef.current = (indexRef.current + 1) % MESSAGES.length;
      setMessage(MESSAGES[indexRef.current]);
      setTimeout(tick, 3000);
    }

    const id = setTimeout(tick, 3000);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, []);

  return (
    <div className='flex flex-col items-center justify-center gap-6 py-16 text-center'>
      <Loader2 className='h-10 w-10 animate-spin text-primary' />
      <div>
        <h2 className='text-xl font-semibold text-foreground'>
          Analyzing your organization
        </h2>
        <p className='mt-2 text-sm text-muted-foreground max-w-sm'>{message}</p>
      </div>
      <p className='text-xs text-muted-foreground/60'>
        Usually takes 30–60 seconds
      </p>
    </div>
  );
}
```

**Why `setTimeout` chain instead of `setInterval`:** Matches the
`ThinkingIndicator` precedent. Each tick is scheduled after the previous fires —
avoids drift when the tab is backgrounded. The `cancelled` flag ensures cleanup
is deterministic even in React Strict Mode's double-mount.

#### Fix 2e — Layout upgrade: TribesLogo + card wrapper

```tsx
// app/onboarding/layout.tsx
import type { PropsWithChildren } from 'react';
import { TribesLogo } from '@/shared/ui/brand';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className='min-h-screen w-full bg-background flex flex-col items-center justify-start pt-12 px-4 pb-16'>
      <div className='mb-8 flex flex-col items-center gap-3'>
        <TribesLogo />
        <p className='text-sm text-muted-foreground'>
          Let Wanda build your workspace
        </p>
      </div>
      <div
        className='w-full max-w-2xl rounded-[var(--radius-card)] border border-border bg-surface/60 p-8'
        style={{
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
```

Note: `backdrop-blur-sm` (4px) is safe on this page — there is no scrolling
content behind the card, so no iOS Safari jank risk. Use inline `style` with the
`-webkit-` prefix (matching the pattern in `app/dashboard/layout.tsx:51–53`).

---

## Backend Verification

**Key constraint confirmed from `OnboardingController@accept` (line 64–66):**

```php
if ($organization->onboarded_at !== null) {
    return ApiResponse::error('Онбординг для этой организации уже был проведён', null, 422);
}
```

Skip must never call the backend. The `skipOnboarding` function creates junk
epics AND permanently seals onboarding state. **Delete it entirely.**

**Cookie state:** After the fix, users who skip will have no `org_onboarded`
cookie. The dashboard gate in `app/dashboard/layout.tsx` checks both the cookie
AND `org.onboarded_at`. Since both are absent/null after a true skip, the gate
will correctly continue to offer the onboarding path. Verify no other middleware
or layout checks `org_onboarded` cookie in a way that could break the skip path.

**No new backend endpoints needed.** The fix is entirely frontend.

---

## Code Quality Notes from Research

### ESLint compliance for the localStorage hook

- Use `globalThis.localStorage` (not `localStorage` directly) — required by
  `unicorn/prefer-global-this`
- Empty catch blocks: use `catch { }` with no binding (consistent with
  `use-onboarding-poll.ts:69` and 9 other `catch { }` usages — no `/* ignore */`
  comment needed)
- Use `.trim().length > 0` not `.trim()` as truthy check —
  `unicorn/explicit-length-check`
- The `sonarjs/no-duplicate-string` rule requires the storage key to be
  extracted to a constant (`DRAFT_KEY` function) — it appears in save, load, and
  clear operations

### `JSON.parse` safety

Never use `JSON.parse(raw) as T` — it is a runtime lie. Always use Zod
`safeParse`:

```ts
// Correct pattern (already used in app/onboarding/page.tsx:29)
const result = onboardingLocalDraftSchema.safeParse(JSON.parse(raw));
if (!result.success) return null;
```

---

## Opportunistic fixes (same PR as core fix)

### Fix upload component stale state bug

`features/onboarding/ui/onboarding-file-upload.tsx` — the upload handler's
`.then()` has no mounted check. If the wizard transitions to `processing` while
an upload is in flight, the `.then()` fires on an unmounting component. Fix:

```tsx
const isMountedRef = useRef(true);
useEffect(() => {
  return () => { isMountedRef.current = false; };
}, []);

// In upload .then():
.then((result) => {
  if (!isMountedRef.current) return;
  // ... rest of handler
})
```

### Fix FSD import in `app/onboarding/page.tsx`

```tsx
// Change:
import { OnboardingWizard } from '@/features/onboarding/ui/onboarding-wizard';
// To:
import { OnboardingWizard } from '@/features/onboarding';
```

### Add `lucide-react` to `optimizePackageImports`

In `next.config.ts`, the `optimizePackageImports` array is missing
`'lucide-react'`. This is a free bundle optimization that benefits all pages
importing Lucide icons:

```ts
optimizePackageImports: [
  'lodash',
  'date-fns',
  'rxjs',
  'framer-motion',
  '@tanstack/react-query',
  'react-hook-form',
  'lucide-react', // add this
],
```

### Consolidate duplicate `getLatestDraft`

The `getLatestDraft` function is copy-pasted verbatim in both:

- `app/onboarding/page.tsx:13–33`
- `app/dashboard/profile/onboarding/page.tsx` (if it exists there too)

Both use raw `fetch` + manual auth headers, violating CLAUDE.md Rule 2. Extract
to `features/onboarding/api/onboarding.ts` using `httpClient`:

```ts
// features/onboarding/api/onboarding.ts
export async function getLatestDraft(
  orgId: string,
): Promise<OnboardingDraftResponse | null> {
  try {
    const { data } = await httpClient<OnboardingDraftResponse>(
      `${API_URL}/organizations/${orgId}/drafts/latest`,
      { cache: 'no-store' },
    );
    const parsed = onboardingDraftResponseSchema.safeParse(data);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
```

---

## Acceptance Criteria

### PR 1 — Core fix

- [ ] "Skip for now" on `/onboarding` redirects to `/dashboard/today` without
      calling any backend endpoint
- [ ] All three `handleSkip` callsites (input step, timeout screen, error
      screen) use the same updated `handleSkip` function
- [ ] After skipping, the user can navigate to `/dashboard/profile/onboarding`
      and re-enter the wizard (`org.onboarded_at` is still null)
- [ ] After skipping, navigating back to `/onboarding` works (server guard
      checks `org.onboarded_at`, which is null → wizard renders)
- [ ] `skipOnboarding` function is deleted from
      `features/onboarding/api/onboarding.ts`
- [ ] No junk "Getting started" epics are created in the issue tracker when
      skipping
- [ ] `OnboardingWizard` accepts `redirectAfterSkip?: string` and
      `redirectAfterAccept?: string` props; both default to their existing
      routes when omitted
- [ ] Profile onboarding tab passes
      `redirectAfterSkip={ROUTES.DASHBOARD.PROFILE_ACCOUNT}`
- [ ] `app/onboarding/page.tsx` imports `OnboardingWizard` from
      `@/features/onboarding` (not deep path)
- [ ] `npm run lint` passes, `npm run build` passes

### PR 2 — UX improvements

- [ ] localStorage description is saved on skip (only if description is
      non-empty)
- [ ] On returning to the wizard (step === 'input', no server draft),
      description is pre-filled from localStorage
- [ ] Restore uses Zod `safeParse` — malformed localStorage data is silently
      ignored
- [ ] `DRAFT_KEY` is a named constant in the hook, not inlined in three places
- [ ] localStorage key is scoped to `onboarding_draft_${userId}_${orgId}`
- [ ] Draft is cleared on successful `acceptStructure`
- [ ] `OnboardingInputStep` shows "Step 1 of 2" via `step={1} totalSteps={2}`
      props
- [ ] `OnboardingPreviewStep` shows "Step 2 of 2" via `step={2} totalSteps={2}`
      props
- [ ] Step transitions use `animate-in fade-in-0 duration-300` (matches
      PopupProvider pattern)
- [ ] `motion-reduce:animate-none` applied for `prefers-reduced-motion` users
- [ ] `OnboardingProcessingStep` cycles through 5 messages using `setTimeout`
      chain (not `setInterval`)
- [ ] `app/onboarding/layout.tsx` shows TribesLogo + tagline above the content
      card
- [ ] Card has border, surface background, and `backdrop-blur` (with `-webkit-`
      prefix)
- [ ] No regressions: completing the wizard still calls `acceptStructure`, sets
      cookie, revalidates, and redirects to `/dashboard/issues/list`

---

## Files to Touch

### PR 1 (core fix — 3 files)

| File                                           | Change                                                                                                          |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `features/onboarding/api/onboarding.ts`        | Delete `skipOnboarding` (lines 49–68); add `getLatestDraft` using `httpClient`                                  |
| `features/onboarding/ui/onboarding-wizard.tsx` | Add `redirectAfterSkip?`/`redirectAfterAccept?` props; replace `handleSkip`; fix upload component mounted check |
| `app/onboarding/page.tsx`                      | Fix import path to `@/features/onboarding`; use extracted `getLatestDraft`                                      |
| `app/dashboard/profile/onboarding/page.tsx`    | Pass `redirectAfterSkip` + `redirectAfterAccept` props                                                          |
| `next.config.ts`                               | Add `'lucide-react'` to `optimizePackageImports`                                                                |

### PR 2 (UX polish — 5 files)

| File                                                    | Change                                                                                        |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `features/onboarding/model/schemas.ts`                  | Add `onboardingLocalDraftSchema`                                                              |
| `features/onboarding/hooks/use-onboarding-draft.ts`     | **New** — `loadInputDraft`, `saveInputDraft`, `clearInputDraft`                               |
| `features/onboarding/model/wizard-reducer.ts`           | Extend `buildInitialState` to accept `{ initialDraft, userId, orgId }` and merge localStorage |
| `features/onboarding/ui/onboarding-wizard.tsx`          | Add `userId` prop; integrate draft hook; pass `step`/`totalSteps` to step components          |
| `features/onboarding/ui/onboarding-input-step.tsx`      | Add `step?`/`totalSteps?` props; render step badge; add `animate-in` to outermost div         |
| `features/onboarding/ui/onboarding-preview-step.tsx`    | Add `step?`/`totalSteps?` props; render step badge; add `animate-in` to outermost div         |
| `features/onboarding/ui/onboarding-processing-step.tsx` | Replace static spinner with `setTimeout`-chain cycling messages                               |
| `app/onboarding/layout.tsx`                             | Add TribesLogo, tagline, card wrapper                                                         |

---

## Implementation Order

### PR 1 — Core fix (~30 min)

1. Delete `skipOnboarding` from `onboarding.ts`
2. Replace `handleSkip` body with
   `router.push(redirectAfterSkip ?? ROUTES.DASHBOARD.TODAY)`
3. Add `redirectAfterSkip?` and `redirectAfterAccept?` to `Props` interface
4. Fix profile page to pass both redirect props
5. Fix the FSD import violation in `app/onboarding/page.tsx`
6. Extract `getLatestDraft` to `features/onboarding/api/onboarding.ts` using
   `httpClient`
7. Add `lucide-react` to `optimizePackageImports`
8. Run `npm run lint:fix && npm run format`

### PR 2 — UX polish (~1.5 hours)

1. Add `onboardingLocalDraftSchema` to schemas.ts
2. Create `use-onboarding-draft.ts` hook
3. Extend `buildInitialState` signature and implementation
4. Add `userId` prop to wizard; integrate draft hook
5. Add `step`/`totalSteps` props to input and preview steps; render badge
6. Add `animate-in fade-in-0 motion-reduce:animate-none` to step outermost divs
7. Replace processing step with `setTimeout`-chain implementation
8. Upgrade layout with logo + card
9. Run `npm run lint:fix && npm run format`

---

## Risk Analysis

| Risk                                                          | Likelihood | Mitigation                                                                                                              |
| ------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| `org_onboarded` cookie consumers break on skip path           | Low        | Audit `app/dashboard/layout.tsx` gate — already handles null/absent cookie correctly                                    |
| `redirectAfterSkip` not passed → wrong default                | None       | Default is `ROUTES.DASHBOARD.TODAY` — same as current behavior                                                          |
| `buildInitialState` signature change breaks tests             | Medium     | Update `features/onboarding/model/__tests__/wizard-reducer.test.ts` to pass new arg shape                               |
| `globalThis.localStorage` is `undefined` in SSR               | None       | `buildInitialState` runs client-side in the lazy initializer; `globalThis.localStorage?.getItem` optional-chains safely |
| `animate-in fade-in-0` not matching PopupProvider             | None       | Confirmed in `PopupProvider.tsx:157` — same class, same source                                                          |
| Profile page `ROUTES.DASHBOARD.PROFILE_ACCOUNT` doesn't exist | Low        | Verify route constant exists before implementing; it is already used in the profile onboarding page's redirect guard    |
| `setTimeout` chain leaks if component remounts fast           | None       | `cancelled` flag + `clearTimeout` in cleanup handles React Strict Mode double-mount                                     |

---

## E2E Test Cases to Add

No Playwright setup exists yet. When added, prioritize these test cases:

1. **Skip → redirects to `/dashboard/today`** — assert `page.url()` contains
   `/dashboard/today`
2. **Skip → wizard is accessible at `/dashboard/profile/onboarding`** — confirm
   `org.onboarded_at` is still null after skip
3. **Full happy path**: fill description → generate → preview → accept →
   redirect to `/dashboard/issues/list`
4. **Preview "Back" preserves description** — input state carries through
   reducer transitions
5. **Timeout "Keep waiting"** → transitions back to processing step
6. **Error "Skip for now"** → same redirect as core skip
7. **Already-onboarded user** → `/onboarding` redirects to `/dashboard/today`
8. **Profile tab visibility** → "Onboarding" tab appears only when
   `org.onboarded_at` is null
9. **localStorage restore** → fill description, skip, return, description is
   pre-filled _(requires PR 2 to be implemented first)_

---

## References

### Core files

- `features/onboarding/api/onboarding.ts:49–68` — `skipOnboarding` (delete)
- `features/onboarding/ui/onboarding-wizard.tsx:68–73` — `Props` interface (add
  `redirectAfterSkip`)
- `features/onboarding/ui/onboarding-wizard.tsx:186–198` — `handleSkip`
  (replace)
- `features/onboarding/model/wizard-reducer.ts:288–328` — `buildInitialState`
  (extend)
- `features/onboarding/ui/onboarding-input-step.tsx:167–175` — Skip button
  location

### Reference implementations

- `features/chat/ui/thinking-indicator.tsx` — `setTimeout`-chain message cycling
  pattern
- `app/providers/PopupProvider.tsx:157` — confirms `animate-in fade-in-0` is
  available
- `app/dashboard/layout.tsx:51–53` — `backdropFilter` + `WebkitBackdropFilter`
  inline style pattern
- `app/onboarding/page.tsx:13–33` — `getLatestDraft` to extract and consolidate

### Backend

- `OnboardingController.php:64–66` — backend guard (cannot re-accept, confirms
  skip must not call backend)
- CLAUDE.md — FSD layer rules, API layer conventions (Rule 2: use `httpClient`,
  never raw `fetch`)
