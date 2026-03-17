---
title: 'feat: E2E Full Coverage — All App Routes'
type: feat
status: active
date: 2026-03-13
---

# E2E Full Coverage — All App Routes

## Overview

Extend Playwright E2E coverage from **32 tests across 3 spec files** to **~110
tests across 12 spec files**, covering all major routes and user flows of the
WandaAsk frontend.

## Current State

| Spec file                         | Tests  | Routes covered                            |
| --------------------------------- | ------ | ----------------------------------------- |
| `e2e/auth/auth.spec.ts`           | 6      | `/auth/login`, redirect from `/dashboard` |
| `e2e/dashboard/dashboard.spec.ts` | 10     | `/dashboard`                              |
| `e2e/profile/profile.spec.ts`     | 16     | `/dashboard/profile`                      |
| **Total**                         | **32** | **3 of 21 routes (~14%)**                 |

## Infrastructure Notes

- **Auth**: `e2e/.auth/user.json` — storageState with `token` +
  `organization_id` cookies, created by `e2e/global-setup.ts`
- **Backend**: live dev backend at `https://dev-api.shrugged.ai` — no API
  mocking; tests use real data
- **Dynamic IDs**: navigate to list page → extract `href` from first link →
  visit detail URL
- **Base URL**: `http://localhost:8080`
- **Selector strategy**: always prefer `getByRole` / `getByLabel` over CSS
  selectors

### Dynamic ID helper pattern (reuse across specs)

```ts
// e2e/helpers.ts  (create this shared file in Phase 1)
export async function getFirstResourceId(
  page: Page,
  listUrl: string,
  linkPattern: RegExp,
): Promise<string | null> {
  await page.goto(listUrl);
  const link = page.locator(`a[href]`).filter({ hasText: linkPattern }).first();
  const href = await link.getAttribute('href');
  return href?.split('/').pop() ?? null;
}
```

---

## Phase 1 — List Pages (High Priority)

> Create spec files for the three main list pages. These are the most-used pages
> and have stable structure.

### Files to create

#### `e2e/chat/chat-list.spec.ts`

```
Unauthenticated:
  - [ ] redirects /dashboard/chat to /auth/login

Authenticated — structure:
  - [ ] renders "AI Chat" heading or sidebar with chat list
  - [ ] renders "New chat" button or equivalent CTA
  - [ ] shows empty state when no chats ("Select a chat or create a new one")
  - [ ] renders at least one chat item if chats exist

Authenticated — navigation:
  - [ ] clicking a chat item navigates to /dashboard/chat/[id]
  - [ ] "New chat" button navigates to /dashboard/chat (stays on page or opens chat)
```

#### `e2e/teams/teams.spec.ts`

```
Unauthenticated:
  - [ ] redirects /dashboard/teams to /auth/login

Authenticated — structure:
  - [ ] renders "Teams" heading
  - [ ] renders "Create Team" button (or link)
  - [ ] renders team list OR empty state "No team in this organization"
  - [ ] each team row shows team name

Authenticated — navigation:
  - [ ] clicking a team name navigates to /dashboard/teams/[id]
  - [ ] "Create Team" button navigates to /dashboard/teams/create

Create Team page:
  - [ ] redirects /dashboard/teams/create to /auth/login when unauthenticated
  - [ ] renders form with "Team name" field
  - [ ] shows validation error when submitted empty
  - [ ] "Back" button/link returns to /dashboard/teams
```

#### `e2e/methodology/methodology.spec.ts`

```
Unauthenticated:
  - [ ] redirects /dashboard/methodology to /auth/login

Authenticated — structure:
  - [ ] renders "Methodologies" heading
  - [ ] renders "Create Methodology" button
  - [ ] renders methodology list OR empty state

Authenticated — navigation:
  - [ ] clicking a methodology navigates to /dashboard/methodology/[id]
  - [ ] "Create Methodology" navigates to /dashboard/methodology/create

Create page:
  - [ ] redirects to login when unauthenticated
  - [ ] renders form with name field
  - [ ] "Back" returns to /dashboard/methodology
```

---

## Phase 2 — Detail Pages (Medium Priority)

> Detail pages require extracting dynamic IDs from list pages. All tests assume
> at least one resource exists for the test user.

### Files to create

#### `e2e/chat/chat-room.spec.ts`

```
Setup:
  - beforeAll: navigate to /dashboard/chat, extract first chat ID from link href

Unauthenticated:
  - [ ] redirects /dashboard/chat/1 to /auth/login

Authenticated — structure:
  - [ ] renders message list area
  - [ ] renders message input (textarea or input)
  - [ ] renders send button
  - [ ] renders artifacts panel or toggle
  - [ ] back/close button visible

Authenticated — interactions:
  - [ ] typing in message input updates its value
  - [ ] artifacts panel shows artifact list or empty state
```

#### `e2e/teams/team-detail.spec.ts`

```
Setup:
  - beforeAll: navigate to /dashboard/teams, extract first team ID

Unauthenticated:
  - [ ] redirects /dashboard/teams/[id] to /auth/login

Authenticated — structure:
  - [ ] renders team name as heading
  - [ ] renders back button (navigates to /dashboard/teams)
  - [ ] renders member list or empty state
  - [ ] renders "Add Member" button

Authenticated — navigation:
  - [ ] back button navigates to /dashboard/teams
```

#### `e2e/meeting/meeting.spec.ts`

```
Setup:
  - beforeAll: navigate to /dashboard/calendar or /dashboard/follow-ups,
    extract first meeting/event ID from a link

Unauthenticated:
  - [ ] redirects /dashboard/meeting/[id] to /auth/login

Authenticated — structure:
  - [ ] renders meeting title as heading
  - [ ] renders tab list with 4 tabs: Summary, Follow-up, Transcript, Analysis
  - [ ] "Summary" tab is active by default
  - [ ] renders back button

Authenticated — tab navigation:
  - [ ] clicking "Follow-up" tab shows follow-up content (updates ?tab= param)
  - [ ] clicking "Transcript" tab shows transcript content
  - [ ] clicking "Analysis" tab shows analysis content
  - [ ] reloading with ?tab=followup shows Follow-up tab active
```

#### `e2e/follow-ups/follow-ups.spec.ts`

```
Unauthenticated:
  - [ ] redirects /dashboard/follow-ups to /auth/login (if such a route exists)
    OR redirects /dashboard/follow-ups/[id] to /auth/login

Authenticated — /dashboard/follow-ups/[id]:
  - [ ] renders heading or team name
  - [ ] renders follow-up list or empty state
  - [ ] renders back button

Authenticated — /dashboard/follow-ups/analysis/[id]:
  - [ ] renders analysis heading
  - [ ] renders analysis content sections
  - [ ] renders back button
```

---

## Phase 3 — Auth Flows & Organization (Medium Priority)

### Files to create / extend

#### `e2e/auth/register.spec.ts`

```
Structure:
  - [ ] renders "Create account" heading
  - [ ] renders name, email, password, confirm password fields
  - [ ] renders submit button

Validation:
  - [ ] shows error when submitted empty
  - [ ] shows error when passwords do not match
  - [ ] shows error when email format is invalid
  - [ ] shows error when email already registered

(Success flow skipped to avoid creating real accounts in live backend)
```

#### `e2e/organization/organization.spec.ts`

```
Unauthenticated:
  - [ ] redirects /dashboard/organization to /auth/login

Authenticated — /dashboard/organization (list):
  - [ ] renders organization list or empty state
  - [ ] each org shows name
  - [ ] "Create Organization" link is visible

Authenticated — /dashboard/organization/[id]:
  - [ ] renders org name as heading
  - [ ] renders member list
  - [ ] renders back button

Authenticated — /dashboard/organization/create:
  - [ ] renders form with org name field
  - [ ] shows validation error when submitted empty
  - [ ] "Back" returns to /dashboard/organization
```

---

## Phase 4 — Analytics, Calendar, Landing (Lower Priority)

### Files to create

#### `e2e/summary/summary.spec.ts`

```
Unauthenticated:
  - [ ] redirects /dashboard/summary to /auth/login
  - [ ] /dashboard/statistics redirects to /dashboard/summary (or /auth/login)

Authenticated — structure:
  - [ ] renders "Statistics" heading
  - [ ] renders 5 KPI metric cards (Meetings, Unique participants, Tasks, Follow-ups, Summaries)
  - [ ] each card shows a numeric value
  - [ ] charts area renders (no JS errors)
```

#### `e2e/calendar/calendar.spec.ts`

```
Unauthenticated:
  - [ ] redirects /dashboard/calendar to /auth/login

Authenticated — connected calendar state:
  - [ ] renders month/week view or calendar widget
  - [ ] renders navigation buttons (previous/next month)

Authenticated — no calendar connected:
  - [ ] renders "Connect your calendar" CTA or onboarding message
```

#### `e2e/landing/landing.spec.ts`

```
(No auth required)
  - [ ] renders page without redirect
  - [ ] renders main hero heading
  - [ ] renders navigation bar with logo
  - [ ] renders CTA button (e.g., "Get started", "Sign in", "Log in")
  - [ ] CTA button links to /auth/login or /auth/register
  - [ ] page snapshot (visual regression, maxDiffPixelRatio: 0.02)
```

---

## Shared Infrastructure (create alongside Phase 1)

### `e2e/helpers.ts`

```ts
// e2e/helpers.ts
import type { Page } from '@playwright/test';

/**
 * Navigates to a list page and extracts the ID from the first resource link.
 * Returns null if no items exist.
 */
export async function getFirstId(
  page: Page,
  listUrl: string,
  linkHrefPattern: RegExp,
): Promise<string | null> {
  await page.goto(listUrl);
  const link = page
    .locator('a[href]')
    .filter({ has: page.locator(`[href*="${linkHrefPattern.source}"]`) })
    .first();
  const href = await link.getAttribute('href').catch(() => null);
  return href?.split('/').pop() ?? null;
}

/**
 * Clears an input and triggers react-hook-form onChange.
 */
export async function clearInput(
  page: Page,
  locator: import('@playwright/test').Locator,
) {
  await locator.click();
  await locator.selectText();
  await page.keyboard.press('Backspace');
}
```

---

## Prioritized File Creation Order

| #   | File                                    | Phase | Est. tests | Route(s)                                        |
| --- | --------------------------------------- | ----- | ---------- | ----------------------------------------------- |
| 1   | `e2e/helpers.ts`                        | 1     | —          | shared utility                                  |
| 2   | `e2e/chat/chat-list.spec.ts`            | 1     | 7          | `/dashboard/chat`                               |
| 3   | `e2e/teams/teams.spec.ts`               | 1     | 9          | `/dashboard/teams`, `/dashboard/teams/create`   |
| 4   | `e2e/methodology/methodology.spec.ts`   | 1     | 8          | `/dashboard/methodology`, `*/create`            |
| 5   | `e2e/chat/chat-room.spec.ts`            | 2     | 7          | `/dashboard/chat/[id]`                          |
| 6   | `e2e/teams/team-detail.spec.ts`         | 2     | 6          | `/dashboard/teams/[id]`                         |
| 7   | `e2e/meeting/meeting.spec.ts`           | 2     | 8          | `/dashboard/meeting/[id]`                       |
| 8   | `e2e/follow-ups/follow-ups.spec.ts`     | 2     | 8          | `/dashboard/follow-ups/[id]`, `*/analysis/[id]` |
| 9   | `e2e/auth/register.spec.ts`             | 3     | 6          | `/auth/register`                                |
| 10  | `e2e/organization/organization.spec.ts` | 3     | 8          | `/dashboard/organization*`                      |
| 11  | `e2e/summary/summary.spec.ts`           | 4     | 6          | `/dashboard/summary`, `/dashboard/statistics`   |
| 12  | `e2e/calendar/calendar.spec.ts`         | 4     | 4          | `/dashboard/calendar`                           |
| 13  | `e2e/landing/landing.spec.ts`           | 4     | 5          | `/`                                             |
|     | **New total**                           |       | **~82**    |                                                 |
|     | **+ existing**                          |       | **+32**    |                                                 |
|     | **Grand total**                         |       | **~114**   |                                                 |

---

## Acceptance Criteria

- [ ] All 13 new spec files created and passing
- [ ] All existing 32 tests still pass (no regressions)
- [ ] Total: ~114 tests covering 21 routes
- [ ] `e2e/helpers.ts` extracted for shared patterns
- [ ] Every spec has at least one unauthenticated redirect test
- [ ] Dynamic IDs extracted at runtime from list pages (no hardcoded IDs)
- [ ] All selectors use `getByRole` / `getByLabel` — no CSS class selectors
- [ ] Tests are idempotent: repeated runs produce same result

## References

- Existing auth spec: `e2e/auth/auth.spec.ts:1`
- Existing dashboard spec: `e2e/dashboard/dashboard.spec.ts:1`
- Existing profile spec: `e2e/profile/profile.spec.ts:1`
- Global setup: `e2e/global-setup.ts:1`
- Playwright config: `playwright.config.ts`
