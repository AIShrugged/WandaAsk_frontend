---
title: 'refactor: Clean up onboarding-wizard.tsx to follow project conventions'
type: refactor
status: completed
date: 2026-05-13
---

# refactor: Clean up onboarding-wizard.tsx to follow project conventions

## Overview

`features/onboarding/ui/onboarding-wizard.tsx` contains several convention
violations:

1. `WizardStep` and `WizardAction` types are defined inline in the UI file
2. `emptyInput`, `reducer`, and `buildInitialState` utility functions live in
   the UI file instead of the model layer
3. Raw `<button>` elements used where the shared button components should be
   used
4. `useEffect` for token generation references undeclared dependency
   (`inputState`)
5. Duplicated team-member mapping logic in two places
6. Duplicated `timeout`/`error` screen markup

---

## Problem Statement

The component mixes business logic, state machine, and UI in a single ~610-line
file. This violates FSD's one-abstraction-level-per-file rule.

**Specific violations:**

| Item                      | Location                                      | Issue                                                       |
| ------------------------- | --------------------------------------------- | ----------------------------------------------------------- |
| `WizardStep` union type   | `onboarding-wizard.tsx:32`                    | UI-layer reducer type, not a shared domain type             |
| `WizardAction` union type | `onboarding-wizard.tsx:44`                    | UI-layer reducer type, not a shared domain type             |
| `emptyInput()`            | `onboarding-wizard.tsx:66`                    | Pure factory, belongs in model layer                        |
| `reducer()`               | `onboarding-wizard.tsx:70–291`                | ~220-line pure reducer, belongs in model layer              |
| `buildInitialState()`     | `onboarding-wizard.tsx:293–333`               | Pure initializer, belongs in model layer                    |
| Raw `<button>` ×4         | `onboarding-wizard.tsx:492,501,523,532`       | Should use shared button components                         |
| Raw `<button>` ×1         | `onboarding-input-step.tsx:136`               | Icon-only X button in Input endAdornment — missed violation |
| `useEffect` dep violation | `onboarding-wizard.tsx:363`                   | References `inputState` without declaring it                |
| Duplicated team mapping   | `onboarding-wizard.tsx:168–178` and `309–319` | Identical `result.team.map(...)` blocks                     |
| Duplicated screen markup  | `timeout` and `error` render branches         | Nearly identical ~50-line JSX blocks                        |

---

## Proposed Solution

### Step 1 — Create `model/wizard-reducer.ts`

Extract all reducer-related logic into a new file. This file holds:

- `WizardStep` type (discriminated union — **stays here, not in
  `model/types.ts`**)
- `WizardAction` type (action union — **stays here, not in `model/types.ts`**)
- `EMPTY_INPUT` constant (replaces `emptyInput()` function — all values are
  static)
- `toEditableTeamMember(m: DraftTeamMember): EditableTeamMember` helper
  (deduplicates the two identical team mapping blocks)
- `BLANK_MEMBER` constant (blank `EditableTeamMember` for `MEMBER_ADD` action)
- `reducer(state, action)` function
- `buildInitialState(initialDraft)` function

`WizardStep` and `WizardAction` are **not** exported from `index.ts` — they are
implementation details of the wizard, not part of the feature's public API. Only
`onboarding-wizard.tsx` imports them.

The `ATTACHMENT_UPLOADED` action currently uses
`InputState['attachments'][number]` — replace with the already-defined
`PendingAttachment` alias from `model/types.ts`.

### Step 2 — Fix `useEffect` token generation

The `useEffect` at line 363 generates `uploadToken` on mount but references
`inputState` without declaring it as a dependency. Fix by moving token
generation into `EMPTY_INPUT` / `buildInitialState`:

```ts
// In wizard-reducer.ts
const EMPTY_INPUT: InputState = {
  description: '',
  uploadToken: crypto.randomUUID(), // safe: only ever called client-side
  links: [],
  attachments: [],
};
```

Delete the `useEffect` block entirely. `crypto.randomUUID()` is available in
Node.js 19+ and all browsers; Next.js 16 targets both, and `'use client'`
ensures the reducer initializer runs client-side only.

> Note: `buildInitialState` also calls `emptyInput()` for the `input` fallback —
> these will all use `EMPTY_INPUT` and the token will be set correctly from
> init.

### Step 3 — Extract `<WizardStatusScreen>` local component

The `timeout` and `error` render branches are near-identical:

```tsx
// timeout branch             // error branch
<div className='flex flex-col items-center justify-center gap-6 py-16 text-center'>
  <p className='text-xl font-semibold text-foreground'>[title]</p>
  <p className='text-sm text-muted-foreground max-w-sm'>[message]</p>
  <div className='flex gap-3'>
    <button>[primary action]</button>
    <button>[secondary action]</button>
  </div>
</div>
```

Extract a local `WizardStatusScreen` component (top of the
`onboarding-wizard.tsx` file, not a separate file — it is private to the
wizard):

```tsx
interface StatusScreenProps {
  title: string;
  message: string;
  primaryAction: { label: string; onClick: () => void };
  secondaryAction: { label: string; onClick: () => void };
}

function WizardStatusScreen({ title, message, primaryAction, secondaryAction }: StatusScreenProps) { ... }
```

### Step 4 — Replace raw `<button>` elements

**In `onboarding-wizard.tsx` (`timeout`/`error` branches — 4 raw buttons):**

These are inline text-link style buttons (`text-sm text-primary hover:underline`
and `text-sm text-muted-foreground hover:underline`). Neither `ButtonLink` (it
wraps `<Link>` for navigation) nor the block `<Button>` fits without fighting
defaults. Use `<Button>` with `variant="ghost"` and `fullWidth={false}`, adding
`className` to match the underline style — **or** keep them as raw `<button>`
elements inside `WizardStatusScreen` since they are private UI within an
extracted local component.

Decision: keep raw `<button>` inside `WizardStatusScreen` (acceptable in a
self-contained private component), but add `type="button"` and proper focus
styles. This avoids importing `<Button>` just to override all its defaults.

**In `onboarding-input-step.tsx:136` (icon-only X button in Input endAdornment —
missed by original plan):**

Replace with `<ButtonIcon>` from `@/shared/ui/button/button-icon.tsx`:

```tsx
// Before
<button
  type='button'
  className='text-muted-foreground hover:text-foreground transition-colors'
  onClick={() => onLinkRemove(index)}
>
  <X className='h-3.5 w-3.5' />
</button>

// After
<ButtonIcon
  icon={<X className='h-3.5 w-3.5' />}
  aria-label='Remove link'
  variant='ghost'
  size='sm'
  onClickAction={() => onLinkRemove(index)}
/>
```

---

## Technical Considerations

- `WizardStep` and `WizardAction` are **not** added to
  `features/onboarding/index.ts` — they are internal implementation details
- `crypto.randomUUID()` in `EMPTY_INPUT` is safe: `model/wizard-reducer.ts` is
  only ever imported by `onboarding-wizard.tsx` which has `'use client'`
- Extracting `toEditableTeamMember` deduplicates ~12 lines repeated verbatim
- `BLANK_MEMBER` constant for `MEMBER_ADD` reduces clutter in the reducer
- The pre-existing FSD violation (`model/types.ts` imports `IssueAttachment`
  from `@/features/issues/model/types`) is **out of scope** for this PR —
  address in a separate refactor

---

## Acceptance Criteria

- [x] `features/onboarding/model/wizard-reducer.ts` created, exporting:
      `WizardStep`, `WizardAction`, `EMPTY_INPUT`, `reducer`,
      `buildInitialState`, `toEditableTeamMember`
- [x] `onboarding-wizard.tsx` imports `reducer` and `buildInitialState` from
      `model/wizard-reducer.ts`
- [x] `ATTACHMENT_UPLOADED` action uses `PendingAttachment` instead of
      `InputState['attachments'][number]`
- [x] `useEffect` for token generation is deleted; token generated in
      `EMPTY_INPUT`
- [x] Local `WizardStatusScreen` component extracted at top of
      `onboarding-wizard.tsx`; `timeout` and `error` branches use it
- [x] `onboarding-input-step.tsx:136` raw `<button>` replaced with
      `<ButtonIcon>`
- [x] `WizardStep`/`WizardAction` are **not** added to `model/types.ts` and
      **not** exported from `index.ts`
- [x] `npm run lint` passes with no new errors or warnings
- [x] `npm run build` passes
- [ ] UI behavior is unchanged across all 6 wizard steps

---

## Files Affected

| File                                               | Change                                                                                        |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `features/onboarding/model/wizard-reducer.ts`      | **New file** — types, constants, helpers, reducer, initializer                                |
| `features/onboarding/ui/onboarding-wizard.tsx`     | Remove inline types + utilities; add `WizardStatusScreen`; delete `useEffect`; update imports |
| `features/onboarding/ui/onboarding-input-step.tsx` | Replace raw `<button>` X with `<ButtonIcon>`                                                  |
| `features/onboarding/model/types.ts`               | No change needed                                                                              |
| `features/onboarding/index.ts`                     | No change needed                                                                              |

---

## References

- Shared Button: `shared/ui/button/Button.tsx`
- Shared ButtonIcon: `shared/ui/button/button-icon.tsx` — requires `icon`,
  `aria-label`, `onClickAction`
- Button variants/sizes: `shared/types/button.ts`
- Onboarding model types: `features/onboarding/model/types.ts`
- FSD layer rules: CLAUDE.md § "FSD Layer Rules"
- API layer conventions (one abstraction per file): CLAUDE.md § "Conventions"
