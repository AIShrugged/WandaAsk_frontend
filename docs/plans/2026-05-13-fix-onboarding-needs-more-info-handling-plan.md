---
title: 'fix: Handle needs_more_info response in Onboarding wizard'
type: fix
status: completed
date: 2026-05-13
---

# fix: Handle needs_more_info response in Onboarding wizard

## Enhancement Summary

**Deepened on:** 2026-05-13 **Research agents used:**
kieran-typescript-reviewer, code-simplicity-reviewer,
pattern-recognition-specialist, architecture-strategist,
julik-frontend-races-reviewer, unit-test-booster, feasibility/coherence
reviewer, best-practices-researcher (React 19 + SSR patterns)

### Key Improvements Added by Research

1. **Simpler `buildInitialState` structure** — the code-simplicity agent found
   that the plan's 3-branch approach repeats `status === 'completed' && result`
   twice. Restructure using early-return on `status` to eliminate the
   double-negative `!isNeedsMoreInfo` guard.
2. **`active` local closure variable in the poll hook** — the races reviewer
   identified that `stoppedRef` alone is insufficient; old in-flight fetches can
   still dispatch stale `POLL_RESULT` after a new effect starts. A local
   `active` boolean fixes this cleanly.
3. **Double `POLL_TIMEOUT` dispatch gap** — one-liner fix: set
   `stoppedRef.current = true` before calling `onTimeoutRef.current()`.
4. **TypeScript guard for `OnboardingDraftResultComplete`** — the TS reviewer
   found that `!isNeedsMoreInfo(r)` does not narrow the type to
   `OnboardingDraftResultComplete`. A companion `isComplete` guard is needed for
   type-safe access to `.organization`, `.goals`, `.team`.
5. **Missing `buildInitialState` unit tests** — 20 test case specs defined
   across all branches including 8 new cases for the `needs_info` branch and
   edge cases.
6. **UX gap: blank description after refresh** — explicitly called out as
   known/acceptable (backend doesn't store user input); plan now documents this
   intentionally.

### New Considerations Discovered

- `EMPTY_INPUT.uploadToken` is module-level `crypto.randomUUID()` — shared
  across all SSR branches; latent hydration hazard if token ever renders to DOM
  (currently safe)
- A one-shot "confirm draft is current" fetch on `needs_info` mount protects
  against stale SSR cache scenarios
- `assertNever` exhaustion pattern is available for future wizard step additions

---

## Overview

When the backend returns `needs_more_info: true` after a user submits an
insufficient description in the Onboarding wizard, the frontend must display the
AI's clarifying questions and allow the user to refine their input and
regenerate. This case was partially implemented but has a critical gap: **the
`needs_info` step is not restored from SSR on page refresh**, so a user who gets
the questions panel and then refreshes the browser loses all context and sees a
blank input form.

---

## Problem Statement

### What the backend returns

When the description is too short or vague, the backend responds with:

```json
{
  "data": {
    "id": 43,
    "status": "completed",
    "error": null,
    "result": {
      "needs_more_info": true,
      "message": "Предоставленной информации недостаточно...",
      "questions": [
        "Какую проблему решает ваш продукт и кто ваша целевая аудитория?",
        "На какой стадии находится проект?",
        "Каковы ваши бизнес-цели на 3–6 месяцев?"
      ]
    }
  }
}
```

### What already exists (do NOT re-implement)

The entire `needs_more_info` flow is **already built** end-to-end and working
during a live session:

| File                                                     | What it does                                                                  |
| -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `features/onboarding/model/types.ts:21–35`               | `OnboardingDraftResultNeedsInfo` type + `isNeedsMoreInfo()` type guard        |
| `features/onboarding/model/schemas.ts:34–38`             | `onboardingDraftResultNeedsInfoSchema` Zod schema                             |
| `features/onboarding/model/wizard-reducer.ts:167–175`    | `POLL_RESULT` handler: transitions to `{ step: 'needs_info', needsInfoData }` |
| `features/onboarding/ui/onboarding-wizard.tsx:266–268`   | Extracts `needsInfoData` from state, passes to `OnboardingInputStep`          |
| `features/onboarding/ui/onboarding-input-step.tsx:76–93` | Renders the callout box with `message` and `questions[]`                      |
| `app/api/onboarding/draft/route.ts`                      | Validates response shape including `needs_more_info` via Zod                  |

### The actual gap: SSR state restoration

`buildInitialState` in `wizard-reducer.ts:287–316` does NOT handle the
`needs_info` case:

```ts
// wizard-reducer.ts:297–302 — current code
if (
  initialDraft?.status === 'completed' &&
  initialDraft.result &&
  !isNeedsMoreInfo(initialDraft.result)  // ← only enters preview if NOT needs_more_info
) {
  return { step: 'preview', ... };
}

// Falls through to:
return { step: 'input', inputState: EMPTY_INPUT };  // ← needs_info is silently dropped
```

**User-visible bug:** A user submits a short description → backend responds
`needs_more_info` → wizard correctly shows questions panel → user **refreshes
the page** → wizard reloads, fetches the latest draft (which is still
`completed` + `needs_more_info`) → but `buildInitialState` ignores it and shows
a blank input form. The questions are gone, no context is given.

### Known UX limitation (out of scope, intentional)

When the user refreshes from `needs_info`, `inputState` is restored as
`EMPTY_INPUT` — meaning the description textarea will be **blank**. The backend
does not store the user's original input, only the AI result. This cannot be
fixed on the frontend without a backend contract change
(`OnboardingDraftResponse` would need to include the original `description`
field). The questions panel will be shown correctly; only the description will
be blank. This is **intentional and acceptable** for this fix.

---

## Proposed Solution

### Primary fix: `buildInitialState` — restructured with cleaner branching

**File:** `features/onboarding/model/wizard-reducer.ts`

The code-simplicity agent identified that the original plan's 3-branch structure
repeats `initialDraft?.status === 'completed' && initialDraft.result` twice and
uses a double-negative `!isNeedsMoreInfo`. The cleaner structure branches on
`status` once, then on `result` shape inside:

```ts
export function buildInitialState(
  initialDraft: OnboardingDraftResponse | null,
): WizardStep {
  // (1) In-flight — resume polling
  if (
    initialDraft?.status === 'pending' ||
    initialDraft?.status === 'processing'
  ) {
    return { step: 'processing', inputState: EMPTY_INPUT };
  }

  // (2) Not a usable completed result — start fresh
  if (initialDraft?.status !== 'completed' || !initialDraft.result) {
    return { step: 'input', inputState: EMPTY_INPUT };
  }

  // (3) Now: status === 'completed' && result !== null
  const { result } = initialDraft;

  if (isNeedsMoreInfo(result)) {
    return {
      step: 'needs_info',
      inputState: EMPTY_INPUT,
      needsInfoData: {
        message: result.message,
        questions: result.questions,
      },
    };
  }

  // (4) Full result — must be OnboardingDraftResultComplete
  return {
    step: 'preview',
    inputState: EMPTY_INPUT,
    previewData: {
      organization: result.organization,
      goals: result.goals,
      team: result.team.map((m) => toEditableTeamMember(m)),
    },
  };
}
```

**Why this structure is better than the original plan's version:**

- `status === 'completed'` is checked exactly once (branch 2 absorbs `failed`,
  `null`, and unknown)
- The `!isNeedsMoreInfo` double-negative is eliminated — branch 4 is the natural
  else after branch 3 returns
- `result` is extracted to a local const before the guard, reducing repetition
- Matches the existing `POLL_RESULT` handler's structure (lines 152–189) exactly

### TypeScript note: type narrowing for `OnboardingDraftResultComplete`

After `isNeedsMoreInfo(result)` returns and we reach branch (4), TypeScript
knows `result` is `OnboardingDraftResult` but **cannot narrow it to
`OnboardingDraftResultComplete`** from the negated guard alone. This is a
pre-existing issue in the file.

Two options:

1. **Add a companion type guard** (recommended for long-term correctness):

   ```ts
   // in types.ts, alongside isNeedsMoreInfo
   export function isComplete(
     r: OnboardingDraftResult,
   ): r is OnboardingDraftResultComplete {
     return !isNeedsMoreInfo(r);
   }
   ```

   Then: `if (isComplete(result)) { return { step: 'preview', ... } }`

2. **Type assertion** (acceptable given the logic is provably correct):
   ```ts
   const complete = result as OnboardingDraftResultComplete;
   ```

Verify at PR time whether the existing branch 4 already compiles without error.
If it does (because `OnboardingDraftResultComplete` properties exist on neither
union member without the guard), then option 1 is the clean fix. If TypeScript
is already failing silently, treat this as a pre-existing issue to address in
the same PR.

---

## Secondary fixes (bundled — all in `use-onboarding-poll.ts`)

### Fix 1: `active` local closure variable (medium severity race condition)

**Problem (identified by races reviewer):** `stoppedRef` alone is insufficient
to cancel in-flight fetches. When `enabled` transitions `true → false → true`
(user hits Regenerate), the new effect sets `stoppedRef.current = false`. An old
in-flight `fetch` that resolves after cleanup finds
`stoppedRef.current === false` (the new effect reset it) and dispatches a stale
`POLL_RESULT` from the previous generation, jumping the wizard forward or
backward unexpectedly.

**Fix:** Add a `let active = true` local closure variable checked after every
`await`:

```ts
useEffect(() => {
  if (!enabled) return;

  let active = true; // ← new: local per-effect flag
  stoppedRef.current = false;
  attemptsRef.current = 0;

  async function poll() {
    if (!active || stoppedRef.current) return;

    if (attemptsRef.current >= POLL_MAX_ATTEMPTS) {
      stoppedRef.current = true; // ← new: prevent double-fire (Fix 2)
      onTimeoutRef.current();
      return;
    }

    attemptsRef.current++;

    try {
      const res = await fetch(`/api/onboarding/draft?orgId=${orgId}`);
      if (!active || stoppedRef.current) return; // ← new: check after await

      if (res.ok) {
        const data: { status: string } = await res.json();
        if (!active || stoppedRef.current) return; // ← new: check after second await

        if (data.status !== 'not_found') {
          const draft = data as OnboardingDraftResponse;
          onResultRef.current(draft);

          if (draft.status === 'completed' || draft.status === 'failed') return;
        }
      }
    } catch {
      // Network error — keep polling
    }

    if (active && !stoppedRef.current) {
      setTimeout(poll, POLL_INTERVAL_MS);
    }
  }

  setTimeout(poll, POLL_INTERVAL_MS);

  return () => {
    active = false; // ← new: invalidate this effect's closures
    stoppedRef.current = true;
  };
}, [orgId, enabled]);
```

### Fix 2: Double `POLL_TIMEOUT` dispatch (low severity, one liner)

Set `stoppedRef.current = true` before calling `onTimeoutRef.current()` to
prevent the loop from firing a second timeout if React batches the state update:

```ts
if (attemptsRef.current >= POLL_MAX_ATTEMPTS) {
  stoppedRef.current = true; // ← prevent re-entry before React re-renders
  onTimeoutRef.current();
  return;
}
```

This is already included in the Fix 1 snippet above.

---

## Files to change

| File                                                         | Change                                                                       | Severity                         |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------- | -------------------------------- |
| `features/onboarding/model/wizard-reducer.ts`                | Add `needs_info` branch in `buildInitialState`, restructure for cleaner flow | **Required** (the bug fix)       |
| `features/onboarding/hooks/use-onboarding-poll.ts`           | Add `active` closure variable + `stoppedRef` on timeout                      | Recommended (race condition fix) |
| `features/onboarding/model/types.ts`                         | Optionally add `isComplete` companion guard                                  | Optional (TS correctness)        |
| `features/onboarding/model/__tests__/wizard-reducer.test.ts` | New file: unit tests for `buildInitialState`                                 | Recommended                      |

---

## Acceptance Criteria

- [x] When a user navigates to `/onboarding` and the latest draft is `completed`
      with `needs_more_info: true`, the wizard immediately renders the
      `needs_info` step (questions callout visible, heading shows "A few more
      details needed")
- [x] On page refresh after receiving `needs_more_info`, the questions panel is
      still shown — the description textarea will be blank (intentional —
      backend does not persist user input)
- [x] User can update the description and click "Regenerate": the wizard
      transitions to `processing`, polling resumes, and a new draft result is
      handled normally
- [x] If the second generation returns a full result, the wizard correctly
      transitions to `preview`
- [x] If the second generation returns `needs_more_info` again, the wizard shows
      the updated questions
- [x] `buildInitialState` branches on `status` once — no repeated compound
      guards, no double-negative
- [x] `buildInitialState` is consistent with the `POLL_RESULT` reducer logic
      (same guard: `isNeedsMoreInfo`)
- [x] In-flight poll fetches are cancelled correctly when the user clicks
      Regenerate (no stale `POLL_RESULT` dispatch from previous generation)
- [x] No new TypeScript errors, no ESLint warnings
- [x] Unit tests cover all 4 branches of `buildInitialState` including the new
      `needs_info` branch and edge cases

---

## Unit Test Specification

**File:** `features/onboarding/model/__tests__/wizard-reducer.test.ts` (No React
render — pure TypeScript function, Jest only, no RTL mocks needed)

### `buildInitialState` — null / no draft

| #   | Test name                                                        | Asserts                   |
| --- | ---------------------------------------------------------------- | ------------------------- |
| 1   | returns input step when draft is null                            | `result.step === 'input'` |
| 2   | returns input step when draft status is "failed"                 | `result.step === 'input'` |
| 3   | returns input step when status is "completed" but result is null | `result.step === 'input'` |

### `buildInitialState` — in-flight draft

| #   | Test name                                           | Asserts                                                                |
| --- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| 4   | returns processing step when status is "pending"    | `result.step === 'processing'`                                         |
| 5   | returns processing step when status is "processing" | `result.step === 'processing'`                                         |
| 6   | uses EMPTY_INPUT as inputState for processing step  | `description === ''`, `links.length === 0`, `attachments.length === 0` |

### `buildInitialState` — completed with full result

| #   | Test name                                                                      | Asserts                                                                                 |
| --- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| 7   | returns preview step when status is "completed" and result is a complete draft | `result.step === 'preview'`                                                             |
| 8   | maps organization fields into previewData                                      | `previewData.organization.name` and `.description` match fixture                        |
| 9   | maps goals into previewData                                                    | `previewData.goals` deep-equals fixture goals array                                     |
| 10  | maps team members with generated `_id` field                                   | each `previewData.team[n]` has all `DraftTeamMember` fields plus non-empty string `_id` |

### `buildInitialState` — completed with needs_more_info (new branch)

| #   | Test name                                                     | Asserts                                                        |
| --- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| 12  | returns needs_info step when result has needs_more_info: true | `result.step === 'needs_info'`                                 |
| 13  | populates needsInfoData.message from result                   | `result.needsInfoData.message === fixture.result.message`      |
| 14  | populates needsInfoData.questions from result                 | `result.needsInfoData.questions` deep-equals fixture questions |
| 15  | uses EMPTY_INPUT as inputState for needs_info step            | `description === ''`, `links.length === 0`                     |
| 16  | preserves questions array order                               | given `['Q2', 'Q1', 'Q3']`, returned order is identical        |

### Edge cases

| #   | Test name                                                          | Why                                                         |
| --- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| 17  | returns needs_info when questions array is empty                   | `questions: []` is valid — must not collapse to input       |
| 18  | returns needs_info when message is empty string                    | guard is on `needs_more_info: true`, not on message content |
| 19  | does NOT return preview step when result has needs_more_info: true | confirms branch ordering is correct — `step !== 'preview'`  |
| 20  | returns preview step when result lacks needs_more_info property    | confirms `isNeedsMoreInfo` guard rejects incomplete object  |

**Notes for test implementation:**

- `EMPTY_INPUT.uploadToken` is a non-deterministic UUID — assert
  `expect.any(String)` for this field, or assert other fields only
- Do NOT mock `isNeedsMoreInfo` — test the integration of the guard with the
  branch
- Construct fixture objects directly, no factory functions needed

---

## Technical Approach — Architecture Notes

### Why `buildInitialState` is the right place (not a `useEffect` dispatch)

React best practice for `useReducer` + SSR-derived data is to pass the raw
server data as `initialArg` and a pure transform function as the third argument.
The initializer runs exactly once on mount, producing the correct initial state
without any intermediate render with wrong state (no flicker). A `useEffect`
that dispatches `HYDRATE` after mount produces a double-render flash where the
user briefly sees blank state.

### SSR prop serialization

`OnboardingDraftResponse` is already serializable (no `Date` objects, no class
instances). The prop boundary from the Server Component page to the Client
Component wizard is clean.

### `EMPTY_INPUT` upload token note

`EMPTY_INPUT` uses `crypto.randomUUID()` at module initialization. All branches
of `buildInitialState` share this reference. This is currently safe because
`uploadToken` is never rendered into the DOM (no hydration mismatch risk).
Future work: move `uploadToken` generation into the initializer itself if this
invariant becomes unclear:

```ts
const freshInput = (): InputState => ({
  ...EMPTY_INPUT,
  uploadToken: crypto.randomUUID(),
});
```

### One-shot draft confirmation on `needs_info` mount (optional improvement)

A stale SSR cache could deliver a `needs_more_info` snapshot while the backend
has already moved the draft to `pending` (e.g., a retry mechanism). Since
polling is disabled in `needs_info` state, the user would be stuck with stale
questions. A lightweight mitigation is a single fetch on mount to confirm the
draft ID and status haven't changed. If the confirmed draft is
`pending/processing`, dispatch `GENERATE_STARTED` to re-arm polling. This is an
optional improvement beyond the scope of this fix.

---

## Dependencies & Risks

**Risk:** Extremely low. The primary change is a pure logic change in one
function. The secondary poll hook changes are additive (no behavior change on
the happy path). The `active` variable addition is idiomatic React and cannot
regress the non-Regenerate path.

**No new UI components, no API changes, no new types required.** The
`WizardStep` discriminated union already has the `needs_info` variant. The
`isNeedsMoreInfo` guard is already imported at the top of the file.

---

## References

### Internal code locations

- `features/onboarding/model/wizard-reducer.ts:287–316` — `buildInitialState`
  (primary file to modify)
- `features/onboarding/model/wizard-reducer.ts:152–189` — `POLL_RESULT` handler
  (template for the new branch — mirror this structure)
- `features/onboarding/model/types.ts:31–35` — `isNeedsMoreInfo` type guard
- `features/onboarding/hooks/use-onboarding-poll.ts` — secondary fix location
- `features/onboarding/ui/onboarding-wizard.tsx:266–268` — wizard renders
  `needs_info` step (no change needed)
- `features/onboarding/ui/onboarding-input-step.tsx:76–93` — callout UI (no
  change needed)
- `app/api/onboarding/draft/route.ts` — polling proxy (no change needed)

### External references

- [useReducer — React official docs](https://react.dev/reference/react/useReducer)
  — third-arg initializer pattern
- [React 19 `use()` hook](https://react.dev/reference/react/use) — alternative
  for Promise-based SSR data
- [Next.js Hydration Error guide](https://nextjs.org/docs/messages/react-hydration-error)
  — crypto.randomUUID() and module-level side effects
