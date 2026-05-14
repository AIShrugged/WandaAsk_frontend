---
title: 'feat: Onboarding goals/tasks appear in /dashboard/issues'
type: feat
status: completed
date: 2026-05-13
---

# Onboarding Goals and Tasks Appear in /dashboard/issues

## Enhancement Summary

**Deepened on:** 2026-05-13  
**Research agents used:** 6 agents — framework-docs-researcher (×2),
best-practices-researcher (UX patterns), code-simplicity-reviewer,
julik-frontend-races-reviewer, architecture-strategist

### Key Improvements From Research

1. **Plan simplified from 3 fixes to 2 line changes** — the proposed
   `revalidatePath('/dashboard/issues', 'layout')` addition is unnecessary and
   was dropped (confirmed by 3 independent agents)
2. **Critical reliability concern added** — `org_onboarded` cookie timing: if
   the layout API fallback fires before the DB fully commits, users could be
   bounced back to `/onboarding` (see Edge Cases)
3. **Double-click race condition identified** — `isSubmitting` is React state
   (async); a synchronous ref guard should be used
4. **Toast should use `duration: 5000`** — consistent with project pattern
   (`issues-page.tsx:454`)
5. **UX research validates redirect to issues list** — industry pattern (Linear,
   Asana, Notion): post-AI-generation should land on the generated content, not
   a generic dashboard
6. **`?source=onboarding` banner pattern** — optional enhancement: add a
   one-time callout on issues list for orientation

### New Considerations Discovered

- `revalidatePath('/dashboard', 'layout')` already cascades to ALL descendant
  routes via the `_N_T_/dashboard/layout` soft tag — confirmed in Next.js 16
  docs
- `getIssues()` uses `cache: 'no-store'` on all fetches — no server-side data
  cache to bust; `revalidatePath` only affects the client Router Cache here
- `cookies().set()` in a Server Action already purges the entire client Router
  Cache — `revalidatePath` is additive, not a replacement
- Sonner toast queue is client-side state in `Providers.tsx` — persists across
  `router.push()` navigation (user will see the toast on the issues page)
- Pre-existing FSD violation: `features/onboarding/` imports `IssueAttachment`
  directly from `features/issues/` (separate ticket, not a blocker)

---

## Overview

After a user completes onboarding (`acceptStructure` or `skipOnboarding`), the
goals and their tasks are persisted as `Issue` records (type `epic` + children)
in the backend. Currently the frontend sends users to `/dashboard/today` after
onboarding, and the issues list page has no signal that new items exist.

This plan covers **two targeted changes** (originally three — one dropped after
research):

1. **Redirect** — after successful `accept` onboarding, send the user to
   `/dashboard/issues/list` instead of `/dashboard/today`.
2. **Success toast with description** — update the toast to inform users where
   their goals now live, with extended duration.

~~3. Cache invalidation~~ — **dropped**:
`revalidatePath('/dashboard', 'layout')` already cascades to all `/dashboard/**`
descendants. Adding a child call is redundant.

---

## Problem Statement

### Backend behavior (verified in `OnboardingController::accept`)

`accept-structure` runs a DB transaction that:

1. Updates the `Organization` record (name, context, `onboarded_at = now()`).
2. For each goal → creates an `Issue` with `type = 'epic'`, `status = 'open'`.
3. For each task inside a goal → creates a child `Issue` with `epic_id`.

All issues are scoped to `organization_id`, `team_id = null`.

`skipOnboarding` calls the same `acceptStructure` with a single dummy goal
`{ title: 'Getting started' }` — same data creation path.

### Frontend gap

`features/onboarding/api/onboarding.ts:99` — after `acceptStructure` succeeds:

```ts
revalidatePath('/dashboard', 'layout');
return { data, error: null };
// Then in onboarding-wizard.tsx:179-180:
toast.success('Organization setup complete!');
router.push(ROUTES.DASHBOARD.TODAY);
```

Problems:

- User lands on Today dashboard, not the list of just-created goals
- Success toast gives no information about where the work breakdown lives
- No `duration` override — toast disappears before users register its
  significance

### Why NOT add more `revalidatePath` calls

Confirmed by Next.js 16.2.6 documentation and framework-docs-researcher:

> `revalidatePath('/dashboard', 'layout')` invalidates the
> `_N_T_/dashboard/layout` soft tag, which is present in the soft tag set of
> EVERY page under `/dashboard/**`.

Adding `revalidatePath('/dashboard/issues', 'layout')` is fully redundant.
Additionally:

- `getIssues()` uses `cache: 'no-store'` on all `fetch()` calls — no server-side
  data cache exists to invalidate
- `cookies().set('org_onboarded', ...)` in the same action already purges the
  entire client Router Cache

**Route groups and `revalidatePath`:** The issues list lives at
`app/dashboard/issues/(list)/list/page.tsx`. If you ever need to revalidate this
specific page (not via layout ancestor), you'd need to include the group:
`revalidatePath('/dashboard/issues/(list)/list', 'page')`. But since the layout
approach covers it, this is not needed here.

---

## Acceptance Criteria

- [ ] After `acceptStructure` resolves without error, user redirects to
      `/dashboard/issues/list` (not `/dashboard/today`)
- [ ] Success toast has description:
      `'Your goals are ready in the issue tracker.'`
- [ ] Toast uses `duration: 5000` (consistent with `issues-page.tsx:454`)
- [ ] After `skipOnboarding`, redirect stays on `/dashboard/today`
- [ ] No changes to `features/onboarding/api/onboarding.ts`
- [ ] `isSubmitting` ref guard added to prevent double-fire (see Technical
      Approach)
- [ ] Existing tests (`wizard-reducer.test.ts`) still pass

---

## Technical Approach

### File: `features/onboarding/ui/onboarding-wizard.tsx`

**Change 1 — success toast + redirect** (lines 179-180):

```ts
// Before
toast.success('Organization setup complete!');
router.push(ROUTES.DASHBOARD.TODAY);

// After
toast.success('Organization set up!', {
  description: 'Your goals are ready in the issue tracker.',
  duration: 5000,
});
router.push(ROUTES.DASHBOARD.ISSUES_LIST);
```

**Change 2 — synchronous double-click guard** (defensive, medium severity):

React's `setIsSubmitting(true)` is async — there is a one-render-cycle window
(~16ms) where `isSubmitting` is `false` in state but a second click has already
arrived. Add a `useRef` as a synchronous lock:

```ts
// Add near other refs:
const isSubmittingRef = useRef(false);

// In handleAccept:
async function handleAccept() {
  if (state.step !== 'preview' || isSubmitting || isSubmittingRef.current)
    return;
  isSubmittingRef.current = true;
  setIsSubmitting(true);

  // ... existing logic ...

  isSubmittingRef.current = false;
  setIsSubmitting(false);
  // ...
}
```

Apply the same pattern to `handleGenerate` and `handleSkip` (all three share the
same `isSubmitting` state).

**`handleSkip` (line 194) — no change to redirect:**

```ts
// Keep as-is — skip creates a dummy epic, not a full structure
router.push(ROUTES.DASHBOARD.TODAY);
```

### File: `features/onboarding/api/onboarding.ts` — no changes needed

The existing code is correct and sufficient:

```ts
// acceptStructure — current code, no changes needed
revalidatePath('/dashboard', 'layout'); // already covers /dashboard/issues/* via soft tag cascade
cookies().set({ name: 'org_onboarded', value: '1', ... });
return { data, error: null };
```

---

## Research Insights

### Next.js `revalidatePath` Deep Dive

**Confirmed from Next.js 16 documentation and GitHub analysis:**

| Question                                                                      | Answer                                                                                    |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Does `'layout'` type cascade to descendants?                                  | Yes — all pages and nested layouts under the path are invalidated via shared soft tags    |
| Does `revalidatePath('/dashboard', 'layout')` cover `/dashboard/issues/list`? | Yes — fully covered, no explicit child call needed                                        |
| Effect when fetches use `cache: 'no-store'`?                                  | No server-side data cache to clear; `revalidatePath` still busts client Router Cache      |
| `cookies().set()` + `revalidatePath()` interaction?                           | `cookies().set()` already clears entire client Router Cache; `revalidatePath` is additive |
| Route group paths (`(groupName)`) in path arg?                                | Must include group name for exact matching; ancestor layout call avoids this entirely     |

**Gotcha for future work:** If `getIssues()` is ever refactored to use
`fetch(..., { next: { tags: ['issues'] } })` for ISR, add
`revalidateTag('issues')` in `acceptStructure`. Current `cache: 'no-store'`
approach doesn't need it.

### UX Research: Post-Onboarding Redirect

**Consensus from industry research (Linear, Asana, Notion pattern analysis):**

The optimal post-AI-generation redirect lands directly on the generated content.
The reasoning: the aha moment ("the AI built something for me") is completed
only when the user **sees** what was built. Redirecting to a generic home
dashboard breaks this loop.

- **Linear**: after workspace setup, lands on the issues workspace with new
  items visible
- **Asana**: after AI project generation, opens the project task list
- **Notion**: after AI outline, shows the created page directly

Redirecting to `/dashboard/today` after the user just approved a work breakdown
creates a "where did my stuff go?" moment that requires an extra navigation and
dilutes the onboarding value.

**Toast copy research:**

- Specific beats generic: `"Your goals are ready in the issue tracker."` >
  `"Organization setup complete!"`
- Duration: 5s is appropriate for onboarding-level events (one-time moment, user
  should notice)
- If toast had a CTA link (not needed here since we redirect), it must use
  `duration: Infinity` — auto-dismissing a toast with an action is a UX
  anti-pattern

### Timing and Race Conditions

**No race condition between Server Action and router.push:**

Sequence:

1. `acceptStructure()` completes on server: DB committed, cookie set
   (`Set-Cookie` header), `revalidatePath` executed
2. Browser processes response: `Set-Cookie` header applied (cookie now in
   browser jar)
3. `handleAccept` receives `ActionResult` on client
4. `toast.success(...)` queued in Sonner (client state in Providers.tsx —
   persists across navigation)
5. `router.push(ROUTES.DASHBOARD.ISSUES_LIST)` fires

By step 5, the server has committed the transaction and issued issues. The
navigation request to `/dashboard/issues/list` will SSR with fresh data. No gap.

**Toast persistence:** Sonner's `<Toaster>` lives in `app/Providers.tsx` (root
layout — never unmounted). The toast will be visible after `router.push()`,
displayed on top of the issues list. Users will see
`"Your goals are ready in the issue tracker."` while already viewing their
epics.

### FSD Architecture Review

**No FSD violation:** Navigating to `ROUTES.DASHBOARD.ISSUES_LIST` (a string
from `shared/lib/routes.ts`) is not a cross-feature import. FSD prohibits module
imports across feature slices; URL constants from `shared/` are the correct seam
for inter-feature navigation.

**Separate pre-existing FSD issue (not a blocker):**
`features/onboarding/model/types.ts` imports `IssueAttachment` directly from
`features/issues/model/types` — a cross-feature boundary violation.
`IssueAttachment` should live in `entities/attachment/` or `shared/types/`.
Track as a separate ticket.

**`acceptStructure` knowing about `/dashboard/issues` path string:** Acceptable
and consistent with project conventions. `features/issues/api/issues.ts` lines
360-361 already call `revalidatePath('/dashboard/issues')` and
`revalidatePath('/dashboard/kanban')`. Path strings in `revalidatePath` are not
module coupling.

**Future scalability:** If a second conditional post-onboarding destination is
ever needed, extract to:

```ts
// features/onboarding/model/post-onboarding-destination.ts
export function resolvePostOnboardingRoute(context: OnboardingContext): string {
  if (context.hasGeneratedIssues) return ROUTES.DASHBOARD.ISSUES_LIST;
  if (context.hasTeamMembers) return ROUTES.DASHBOARD.TEAMS;
  return ROUTES.DASHBOARD.TODAY;
}
```

Not needed now — two fixed destinations don't warrant an abstraction.

---

## Implementation Checklist

- [ ] `features/onboarding/ui/onboarding-wizard.tsx:179` — update
      `toast.success` to add description and duration
- [ ] `features/onboarding/ui/onboarding-wizard.tsx:180` — change `router.push`
      from `TODAY` to `ISSUES_LIST`
- [ ] `features/onboarding/ui/onboarding-wizard.tsx` — add `isSubmittingRef` +
      apply to all 3 handlers
- [ ] Smoke-test: complete onboarding with ≥1 goal → land on
      `/dashboard/issues/list` → see epics
- [ ] Smoke-test: skip onboarding → land on `/dashboard/today`
- [ ] Smoke-test: `org_onboarded` cookie prevents re-trigger of onboarding gate
      on `/dashboard/issues/list`
- [ ] Smoke-test: double-click "Confirm and continue" — only one request fires

---

## Edge Cases

### Critical: layout gate could bounce user back to `/onboarding`

**The dashboard layout gate** (`app/dashboard/layout.tsx:26-37`) has a two-tier
check:

```ts
const isOnboarded = cookieStore.get('org_onboarded')?.value === '1'; // tier 1: cookie

if (!isOnboarded) {
  const { data: org } = await getOrganization(orgId); // tier 2: API fallback
  if (!org?.onboarded_at) {
    redirect(ROUTES.ONBOARDING); // ← danger zone
  }
}
```

**Tier 1 (cookie):** `acceptStructure` sets `org_onboarded=1` via
`cookies().set()`. The browser applies this `Set-Cookie` header before
`router.push()` fires, so the cookie is present on the next navigation request.
Tier 1 passes correctly.

**Tier 2 (API fallback):** If tier 1 fails for any reason (cookie expired,
different browser tab, SSR edge case), the layout makes a
`getOrganization(orgId)` API call to Laravel and checks `org.onboarded_at`. The
backend's `OnboardingController::accept` sets `onboarded_at = now()` **inside
the same DB transaction** as issue creation, so by the time the Server Action
response reaches the browser, `onboarded_at` is committed. Tier 2 is safe.

**Risk:** Negligible in normal flow. The cookie is set before `router.push()`.
The only failure scenario is a browser that rejects the `Set-Cookie` header
(SameSite policy, third-party context) — but since this is a first-party
same-origin cookie, that cannot happen.

**Verify:** Confirm that `OnboardingController::accept` sets `onboarded_at`
synchronously in the transaction (it does —
`$organization->update(['onboarded_at' => now()])` is inside
`DB::transaction()`). ✓

### Empty issues list on redirect

**Scenario:** User lands on `/dashboard/issues/list` but list is empty.

**Why this won't happen:**

- Issues list is filtered by `organization_id` from the `organization_id` cookie
  (set at login, not at onboarding)
- Backend creates issues scoped to the same org (verified:
  `'organization_id' => $organization->id`)
- The DB transaction is synchronous — issues exist before the API response
  returns
- `getIssues()` uses `cache: 'no-store'` — will always fetch fresh data

**If it does happen:** The only failure scenario would be DB replication lag (if
primary/replica setup exists). The issues page already has a proper empty state
with a "No issues found" message. Not ideal UX but not a broken state.

### Optional UX Enhancement: Orientation Banner

Per UX research, a one-time banner on the issues page confirms context for new
users:

```tsx
// In app/dashboard/issues/(list)/list/page.tsx — read searchParam
const isFromOnboarding = params.source === 'onboarding';

// Pass to IssuesListTab, render a dismissible callout:
{
  isFromOnboarding && (
    <div className='rounded-card border border-primary/20 bg-primary/5 p-3 text-sm text-foreground'>
      Your AI-generated work breakdown is ready.{' '}
      <button onClick={dismiss}>Dismiss</button>
    </div>
  );
}
```

**Implementation:** Change redirect to
`ROUTES.DASHBOARD.ISSUES_LIST + '?source=onboarding'`.

This is optional — the redirect + toast combination is already sufficient. Add
this only if user research shows orientation confusion.

---

## Files Changed

| File                                           | Change                                         | Lines |
| ---------------------------------------------- | ---------------------------------------------- | ----- |
| `features/onboarding/ui/onboarding-wizard.tsx` | Update toast + change redirect + add ref guard | ~5-8  |

**Total: 0 new files. No API changes. No backend changes.**

---

## Out of Scope

- Highlighting newly-created issues in the list (visual "new" badge) — requires
  backend to return created issue IDs in the accept response (currently returns
  org fields only)
- Filtering issues list to show only onboarding-created items — not needed; org
  filter already scopes correctly
- Inviting team members detected during onboarding — separate feature
- Moving `IssueAttachment` out of `features/issues/` to fix the pre-existing FSD
  violation — separate ticket
- `revalidateTag` for issues — would require refactoring `getIssues()` to use
  tagged fetches; not justified by this change

---

## References

### Code References

- Backend controller (issue creation):
  `/Users/slavapopov/Documents/WandaAsk_backend/app/Http/Controllers/API/v1/OnboardingController.php:91-116`
- Frontend onboarding API: `features/onboarding/api/onboarding.ts:71-114`
- Frontend wizard: `features/onboarding/ui/onboarding-wizard.tsx:130-181`
- Dashboard layout gate: `app/dashboard/layout.tsx:26-37`
- Issues list page: `app/dashboard/issues/(list)/list/page.tsx`
- `getOrganizationId`: `shared/lib/getOrganizationId.ts`
- Routes: `shared/lib/routes.ts:21,41`
- Project toast duration pattern: `features/issues/ui/issues-page.tsx:454`

### Documentation

- Next.js `revalidatePath`:
  https://nextjs.org/docs/app/api-reference/functions/revalidatePath
- Next.js revalidation guide:
  https://nextjs.org/docs/app/guides/how-revalidation-works
- Sonner toast API: https://sonner.emilkowal.ski/toast
- Next.js GitHub #62071 (layout type cache fix):
  https://github.com/vercel/next.js/issues/62071
- Next.js GitHub #52075 (cookies + revalidatePath ordering):
  https://github.com/vercel/next.js/issues/52075
