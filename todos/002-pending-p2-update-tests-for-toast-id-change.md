---
status: pending
priority: p2
issue_id: '002'
tags: [code-review, testing, profile, toasts]
dependencies: []
---

# Update ProfileForm and ChangePasswordForm tests for toast `id` option

## Problem Statement

If toast deduplication IDs are added to `ProfileForm.tsx` and
`ChangePasswordForm.tsx` (as proposed in the plan), the existing test files will
fail. Both test files use Jest's `toHaveBeenCalledWith('...')` with exact
single-argument matching. Adding `{ id: '...' }` as a second argument changes
the call signature and breaks these assertions.

## Findings

- `features/user-profile/ui/__tests__/ProfileForm.test.tsx` uses
  `toHaveBeenCalledWith('Profile updated successfully')` (single string arg)
- `features/user-profile/ui/__tests__/ChangePasswordForm.test.tsx` uses
  `toHaveBeenCalledWith(...)` on toast calls (exact single-string matching)
- Plan step 6 changes toast calls to:
  `toast.success('Profile updated successfully', { id: 'profile-update' })`
- Jest's `toHaveBeenCalledWith` does strict argument matching — adding a second
  argument causes assertion failures
- These test files are **not listed** in the plan's "Files to Touch" table

Additionally: pattern-recognition-specialist found that **no existing toast call
in the codebase uses the `id` option**. This means:

1. The toast `id` change introduces a new convention with no precedent
2. It is worth deciding whether to add toast IDs at all (simplicity reviewer
   says skip it; it solves a problem that doesn't exist since both submit
   buttons self-disable)

## Proposed Solutions

### Option 1: Skip toast ID change entirely (Recommended by simplicity reviewer)

**Approach:** Do not add `id` to any toast calls. Both forms already disable
their own submit button via `isPending` during transitions. The success messages
are distinct enough that stacked toasts are not confusing. No test changes
needed.

**Pros:**

- No test changes needed
- No new convention introduced
- Simpler

**Cons:**

- Theoretical rapid-submit stacking remains possible (but unlikely in practice)

**Effort:** 0 minutes (nothing to do)  
**Risk:** None

---

### Option 2: Add toast IDs and update tests

**Approach:** Add `{ id: 'profile-update' }` / `{ id: 'password-change' }` to
toast calls AND update test assertions to match.

```ts
// Updated test assertions:
expect(toast.success).toHaveBeenCalledWith('Profile updated successfully', {
  id: 'profile-update',
});

// Or use asymmetric matchers:
expect(toast.success).toHaveBeenCalledWith(
  'Profile updated successfully',
  expect.objectContaining({ id: 'profile-update' }),
);
```

**Pros:**

- Prevents stacked toasts on same-page rapid submissions

**Cons:**

- Introduces a new convention with no project precedent
- Requires touching 2 additional test files

**Effort:** 30 minutes  
**Risk:** Low

## Recommended Action

To be filled during triage. Simplicity reviewer recommendation: skip toast IDs
entirely (Option 1). If toast IDs are kept, Option 2 is required.

## Technical Details

**Affected files:**

- `features/user-profile/ui/__tests__/ProfileForm.test.tsx` — update toast
  assertions if IDs are added
- `features/user-profile/ui/__tests__/ChangePasswordForm.test.tsx` — update
  toast assertions if IDs are added
- `features/user-profile/ui/ProfileForm.tsx` — add `{ id: 'profile-update' }` if
  kept
- `features/user-profile/ui/ChangePasswordForm.tsx` — add
  `{ id: 'password-change' }` if kept

## Resources

- Plan:
  `docs/plans/2026-05-15-refactor-profile-merge-info-password-into-account-tab-plan.md`
  (Step 6)
- Architecture reviewer finding: test files not listed in "Files to Touch"
- Simplicity reviewer: "Drop step 6 entirely — solves a problem that doesn't
  exist"
- Sonner docs: `id` option deduplicates toasts with same ID

## Acceptance Criteria

- [ ] Either: toast `id` is not added (simplest path)
- [ ] Or: toast `id` is added AND both test files are updated to match new call
      signature
- [ ] `npm test` passes with no failures in `ProfileForm.test.tsx` or
      `ChangePasswordForm.test.tsx`

## Work Log

### 2026-05-15 — Discovered during plan review

**By:** Claude Code  
**Actions:**

- Architecture-strategist identified test breakage risk from toast call
  signature change
- Tests were not listed in the plan's "Files to Touch" table
- Simplicity reviewer recommended skipping toast IDs altogether
