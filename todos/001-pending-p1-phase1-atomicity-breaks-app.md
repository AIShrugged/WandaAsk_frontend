---
status: pending
priority: p1
issue_id: "001"
tags: [code-review, architecture, design-system, migration]
dependencies: []
---

# Phase 1 Token Migration Creates Full-App Breakage Window

## Problem Statement

The plan sequences Phase 1 (globals.css token system rewrite) as a standalone PR that lands before Phase 3 (shared UI component updates). This is a guaranteed breakage window that will make the app non-functional for an unknown period.

**Why it breaks:** Phase 1 redefines the semantic meaning of every token class:
- `text-accent` was green text (`#4FB268`) → becomes light gray-green tint (near-invisible on white)
- `text-secondary` was muted gray text → becomes the secondary *surface* background color as text (invisible)
- `border-primary` was a CSS shorthand `border: 1px solid var(--border-primary)` → Tailwind generates only `border-color` (no border-width), so all borders disappear
- `bg-secondary` was a light green tint → becomes zinc/gray neutral

After Phase 1 merges, every component in the app that uses these classes renders incorrectly. Phases 2, 3, and 4 fix them — but that is at minimum hours to days of broken state.

## Findings

- `text-accent` used in 25+ locations: `features/follow-up/ui/follow-up-item.tsx:26`, `features/chat/ui/chat-list.tsx:95`, `features/chat/ui/chat-window.tsx:75`, navigation, buttons, icons throughout
- `text-secondary` used in 15+ locations across feature pages
- `border-primary` used in all form inputs (`Input.tsx`, `InputDropdown.tsx`, `textarea.tsx`) — losing borders on all form fields is a critical UX failure
- `bg-secondary` used in `globals.css` `chat-html-content` CSS block (lines 144, 153) — cannot be fixed by find-and-replace of class names, requires separate CSS update

## Proposed Solutions

### Option A: Combine Phase 1 + Phase 3 into a single atomic PR (Recommended)
Merge the token system rewrite and all shared UI component updates into one PR. Since shared components (`shared/ui/`) are consumed by every feature, they must be updated atomically with the token system.

**Pros:** No breakage window. Clean "before/after" PR.
**Cons:** Larger PR (~30 files). More to review at once.
**Effort:** Medium (same work, just one PR instead of two)
**Risk:** Low

### Option B: Feature flag the new token system
Add a `.redesign` class to `<html>`. Phase 1 defines new tokens only under `.redesign :root`. Phase 3 migrates components to new tokens while `.redesign` is present. Remove flag when complete.

**Pros:** No breakage. Can test new design incrementally.
**Cons:** Extra complexity. Must clean up the flag class.
**Effort:** Medium
**Risk:** Low

### Option C: Accept the breakage window (Not recommended)
Implement as planned. App is broken between Phase 1 and Phase 3 merge.

**Pros:** Simpler branching.
**Cons:** App is non-functional in production.
**Effort:** Low
**Risk:** High

## Acceptance Criteria
- [ ] At no point during implementation does `text-accent` render as an invisible color on page backgrounds
- [ ] At no point are form input borders missing due to token class changes
- [ ] The app renders correctly after every PR merge

## Work Log
- 2026-02-20: Identified during multi-agent plan review (architecture-strategist)
