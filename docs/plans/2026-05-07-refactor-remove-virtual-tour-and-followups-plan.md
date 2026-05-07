---
title: 'refactor: Remove Virtual Tour and Follow-ups Feature'
type: refactor
status: completed
date: 2026-05-07
---

# refactor: Remove Virtual Tour and Follow-ups Feature

## Overview

Two features need to be fully excised from the codebase:

1. **Virtual Tour** — an onboarding tour that was implemented but never wired
   into any layout, provider, or page. It is completely inert dead code with no
   consumers.
2. **Follow-ups** — the `/dashboard/follow-ups` route, all its sub-pages, and
   the `features/follow-up/` module. Has tentacles into `features/teams/`,
   `features/event/`, `entities/team/`, and shared navigation.

No external libraries are involved — neither feature pulled in a tour library
(react-joyride, shepherd.js, etc.) or anything not already used elsewhere.

---

## Scope

### Virtual Tour — completely isolated

`features/virtual-tour/` was never imported outside of itself. Only side-effect:
residual `data-tour="..."` HTML attributes scattered in 4 files.

### Follow-ups — partially entangled

`features/follow-up/` and its route tree have references in:

- `features/teams/` (team-scoped API calls and team action)
- `features/event/` (calendar-scoped API calls)
- `entities/team/` (shared DTO type)
- `shared/lib/routes.ts` (route constant)
- `features/menu/` (sidebar nav item)
- `features/meeting/` (tab nav component)

---

## Files to DELETE

### Virtual Tour

```
features/virtual-tour/                          # entire directory (13 files)
  index.ts
  api/tour.ts
  model/types.ts
  model/tour-store.ts
  model/steps.ts
  ui/TourProvider.tsx
  ui/TourPortal.tsx
  ui/TourOverlay.tsx
  ui/TourStepContent.tsx
  ui/TourControls.tsx
  ui/TourProgress.tsx
  ui/RestartTourSection.tsx
  ui/use-tour-spotlight.ts

docs/plans/2026-04-20-feat-virtual-tour-onboarding-plan.md    # optional
```

### Follow-ups — Route Tree

```
app/dashboard/follow-ups/                       # entire directory (~15 files)
  page.tsx
  loading.tsx
  [id]/
    page.tsx
    loading.tsx
  analysis/[id]/
    layout.tsx
    loading.tsx
    page.tsx
    analysis/page.tsx
    analysis/loading.tsx
    summary/page.tsx
    summary/loading.tsx
    tasks/page.tsx
    tasks/loading.tsx
    transcript/page.tsx
    transcript/loading.tsx

app/api/follow-ups/[id]/export/route.ts         # PDF export API route
```

### Follow-ups — Feature Module

```
features/follow-up/                             # entire directory (~14 files)
  index.ts
  api/follow-up.ts
  api/__tests__/follow-up.test.ts
  model/types.ts
  ui/follow-up-list.tsx
  ui/follow-up-item.tsx
  ui/follow-up-analysis.tsx
  ui/follow-up-analysis-polling.tsx
  ui/export-button.tsx
  ui/deprecated-followup-modal.tsx
  ui/__tests__/deprecated-followup-modal.test.tsx
  ui/__tests__/export-button.test.tsx
  ui/__tests__/follow-up-item.test.tsx
  ui/__tests__/follow-up-list.test.tsx
```

### Follow-ups — Shared tab nav (only used by follow-ups layout)

```
features/meeting/ui/follow-up-tabs-nav.tsx
```

---

## Files to MODIFY

### Virtual Tour — remove `data-tour` attributes only

| File                                                | What to remove                                                             |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| `app/dashboard/layout.tsx`                          | `data-tour='sidebar'` on `<aside>`, `data-tour='main-content'` on `<main>` |
| `features/menu/ui/menu-nested-item.tsx`             | `data-tour={\`nav-${item.id}\`}`on`<Link>`                                 |
| `features/teams/ui/teams-header.tsx`                | `data-tour='create-team-btn'` on the button                                |
| `widgets/dashboard-chat/ui/DashboardChatColumn.tsx` | `data-tour='chat-panel'`                                                   |

### Follow-ups — partial removals

| File                                                | What to remove                                                                          |
| --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `shared/lib/routes.ts`                              | Line: `FOLLOWUPS: '/dashboard/follow-ups',`                                             |
| `features/menu/lib/options.ts`                      | Entire follow-ups menu item object (lines 59–65)                                        |
| `features/meeting/index.ts`                         | Line: `export { FollowUpTabsNav } from './ui/follow-up-tabs-nav';`                      |
| `features/teams/ui/team-actions.tsx`                | `handleViewTeamFollowUp` function + `'view'` entry from `actionMap`                     |
| `features/teams/api/team.ts`                        | `getTeamFollowUps` and `getTeamFollowUp` functions + their `FollowUpDetailProps` import |
| `features/teams/index.ts`                           | Remove `getTeamFollowUps` and `getTeamFollowUp` from exports                            |
| `features/teams/api/__tests__/team.test.ts`         | Remove `getTeamFollowUps`/`getTeamFollowUp` describe blocks + imports                   |
| `entities/team/model/types.ts`                      | Remove `TeamFollowUpDTO` interface                                                      |
| `entities/team/index.ts`                            | Remove `TeamFollowUpDTO` from exports                                                   |
| `features/teams/model/types.ts`                     | Remove `TeamFollowUpDTO` re-export                                                      |
| `features/event/api/calendar-events.ts`             | Remove `getFollowUps` and `getEventFollowUp` functions                                  |
| `features/event/index.ts`                           | Remove `getFollowUps` and `getEventFollowUp` from exports                               |
| `entities/team/model/types.ts`                      | Remove `'view'` from `TeamActionType` union (only used in deleted follow-ups page)      |
| `features/teams/ui/__tests__/team-actions.test.tsx` | Remove assertions referencing `'view'` action type                                      |
| `features/teams/ui/__tests__/team-list.test.tsx`    | Remove assertions referencing `'view'` action type                                      |

### ⚠️ Do NOT touch — incidental "follow-up" text

These files contain follow-up as a **backend API field or plain English text** —
they are unrelated to the deleted feature:

- `features/meetings/model/types.ts` — `followup` field from calendar event API
- `features/meetings/ui/meeting-detail.tsx` — renders `data.followup`
- `app/dashboard/meetings/[id]/overview/page.tsx` — renders
  `<DetailBlock title='Follow-up'>`
- `features/chat/model/types.ts` — `followup_data` backend message field
- `features/agents/model/types.ts` — `followup` agent metadata field
- `features/summary/` — analytics dashboard showing follow-up counts from
  `/api/v1/dashboard`
- `features/today-briefing/ui/ai-prep-panel.tsx` — plain text
- `features/landing/` — marketing copy

---

## Implementation Order

Execute in this order to avoid broken imports at any intermediate step:

### Phase 1 — Modify shared files first (remove references)

1. `shared/lib/routes.ts` — remove `FOLLOWUPS`
2. `features/menu/lib/options.ts` — remove follow-ups nav item
3. `features/teams/api/team.ts` — remove follow-up API functions
4. `features/teams/api/__tests__/team.test.ts` — remove follow-up test blocks
5. `features/teams/index.ts` — remove follow-up exports
6. `features/teams/ui/team-actions.tsx` — remove `handleViewTeamFollowUp` and
   `'view'` action
7. `features/teams/ui/__tests__/team-actions.test.tsx` — remove `'view'`
   assertions
8. `features/teams/ui/__tests__/team-list.test.tsx` — remove `'view'` assertions
9. `features/event/api/calendar-events.ts` — remove follow-up API functions
10. `features/event/index.ts` — remove follow-up exports
11. `entities/team/model/types.ts` — remove `TeamFollowUpDTO` and `'view'` from
    `TeamActionType`
12. `entities/team/index.ts` — remove `TeamFollowUpDTO` export
13. `features/teams/model/types.ts` — remove `TeamFollowUpDTO` re-export
14. `features/meeting/index.ts` — remove `FollowUpTabsNav` export

### Phase 2 — Remove data-tour attributes from 4 files

15. `app/dashboard/layout.tsx`
16. `features/menu/ui/menu-nested-item.tsx`
17. `features/teams/ui/teams-header.tsx`
18. `widgets/dashboard-chat/ui/DashboardChatColumn.tsx`

### Phase 3 — Delete directories and orphaned files

19. Delete `features/virtual-tour/` (entire directory)
20. Delete `features/follow-up/` (entire directory)
21. Delete `app/dashboard/follow-ups/` (entire route directory)
22. Delete `app/api/follow-ups/[id]/export/route.ts`
23. Delete `features/meeting/ui/follow-up-tabs-nav.tsx`

### Phase 4 — Verify

```bash
# No remaining imports of deleted modules
grep -r "features/virtual-tour" . --include="*.ts" --include="*.tsx" -l
grep -r "features/follow-up" . --include="*.ts" --include="*.tsx" -l
grep -r "FOLLOWUPS" . --include="*.ts" --include="*.tsx" -l
grep -r "follow-ups" app/ --include="*.ts" --include="*.tsx" -l

# Build, lint, tests
npm run lint
npm test -- --ci --passWithNoTests
npm run build
```

---

## Acceptance Criteria

- [x] `features/virtual-tour/` directory does not exist
- [x] `features/follow-up/` directory does not exist
- [x] `app/dashboard/follow-ups/` directory does not exist
- [x] `app/api/follow-ups/` directory does not exist
- [x] No `data-tour` attributes remain in any `.tsx` file
- [x] `ROUTES.DASHBOARD.FOLLOWUPS` constant removed from `routes.ts`
- [x] Follow-ups no longer appears in sidebar navigation
- [x] `TeamFollowUpDTO` type gone from all exports
- [x] `TeamActionType` no longer includes `'view'`
- [x] `npm run lint` passes with zero errors
- [x] `npm test` passes (139 suites, 927 tests — all passing)
- [x] `npm run build` produces no type errors or import errors
- [x] `features/summary/` follow-up analytics block is untouched and still works
- [x] Meeting detail follow-up field is untouched and still renders

---

## References

- Methodology removal precedent:
  `docs/plans/2026-05-07-refactor-remove-methodology-feature-plan.md`
- Virtual tour plan (to delete):
  `docs/plans/2026-04-20-feat-virtual-tour-onboarding-plan.md`
- FSD rules: CLAUDE.md § FSD Layer Rules
