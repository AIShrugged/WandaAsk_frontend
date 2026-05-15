---
status: pending
priority: p3
issue_id: '009'
tags: [code-review, documentation, preferences-tab-refactor]
dependencies: []
---

# Consolidate plan steps (10→7) and rename "What Is NOT Deleted" section

## Problem Statement

The plan's Implementation Plan has 10 steps where 3 pairs are logically atomic.
Separating them adds reading friction with no isolation benefit. Also, the
section title "What Is NOT Deleted" uses a double-negative that reads as
defensive rather than informative.

## Findings

### Step consolidation opportunities

| Current steps                                              | Merge reason                                                           |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| Step 1 (routes.ts) + Step 2 (profile-tabs-nav.tsx)         | Both are "update navigation constants" — always done together          |
| Step 3 (PreferencesSection.tsx) + Step 8 (index.ts export) | The export exists solely because the component was created; one action |
| Step 6 (next.config.ts redirects) + Step 9 (rm -rf)        | Redirects should exist before directories are deleted — causal pair    |

Revised order (7 steps):

1. Update `routes.ts` + `profile-tabs-nav.tsx`
2. Create `PreferencesSection.tsx` + add export to
   `features/user-profile/index.ts`
3. Create `preferences/page.tsx`
4. Create `preferences/loading.tsx`
5. Add `next.config.ts` redirects + delete `menu/` and `appearance/` directories
6. Update `sidebar-footer.tsx` and `mobile-sidebar.tsx`
7. Grep sweep for stale references

### Section rename

Current title: **"What Is NOT Deleted"** (double-negative, defensive) Proposed
title: **"Components Reused"** (positive framing, same information)

## Proposed Solutions

### Option A — Update the plan document (Small)

Edit
`docs/plans/2026-05-15-refactor-merge-menu-appearance-into-preferences-tab-plan.md`:

1. Merge the three step pairs into atomic steps (reduces 10 → 7)
2. Rename "What Is NOT Deleted" → "Components Reused"

**Pros:** Cleaner plan document; easier to follow during implementation.
**Cons:** None.

## Recommended Action

Option A.

## Technical Details

**Affected file:**

- `docs/plans/2026-05-15-refactor-merge-menu-appearance-into-preferences-tab-plan.md`

## Acceptance Criteria

- [ ] Implementation Plan section has 7 steps (not 10)
- [ ] "What Is NOT Deleted" section renamed to "Components Reused"
- [ ] All content preserved — only structure and titles changed

## Work Log

- 2026-05-15: Identified by code-simplicity-reviewer during `/workflows:review`.
