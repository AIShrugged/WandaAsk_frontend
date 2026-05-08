---
title: 'refactor: Dead Code Elimination & Codebase Reduction'
type: refactor
status: in_progress
date: 2026-05-08
deepened: 2026-05-08
---

# refactor: Dead Code Elimination & Codebase Reduction

## Enhancement Summary

**Deepened on:** 2026-05-08  
**Research agents used:** best-practices-researcher, code-simplicity-reviewer,
architecture-strategist, kieran-typescript-reviewer,
pattern-recognition-specialist, performance-oracle, fsd-boundary-guard,
learning-file-check, document-coherence-review

### Key Corrections from Research (were wrong in original plan)

- **`motion` is NOT unused** — 5 test files mock `motion/react-client` directly
  (e.g. `jest.mock('motion/react-client', ...)`). Only `gsd-pi` can be removed
  in Phase 2.
- **FSD violations: 17 found, not 3** — additional violations:
  `today-briefing → issues`, `issues → agents`, `organization → agents`,
  `teams → decisions`, `calendar → meetings`, `user-profile → menu`
- **Alias files: 5 found, not 2** — also includes
  `features/event/model/types.ts`, `features/user/model/types.ts`, partial
  re-export block in `features/kanban/model/types.ts`
- **Phase 8 has hard exclusions**: `auth.ts` (pre-auth, no token), `kanban.ts`
  (multi-page parallel fetch), `calendar/source.ts` (fail-silent pattern),
  `calendar.ts` (bespoke `SOURCE_ALREADY_EXISTS` 4xx parsing), `agents.ts`
  (custom `hasMore` pagination formula)
- **Phase 9 is an import-path fix, not a type move** — `IssueStatus` already
  exists in `entities/issue/model/types.ts`; the problem is that consumers
  import it from `@/features/issues/model/types` instead
- **Phase 10 scope is wrong** — the three date util locations serve different
  concerns (event display, ISO formatting, transcript playhead). Only
  `app/dashboard/meetings/list/page.tsx` and `features/event/lib/options.tsx`
  have true duplicates worth removing.

### New Additions from Research

- **Phase 0**: Run Knip to get a definitive dead-code baseline before deleting
  anything
- **Phase 2b** (new): Add `"sideEffects": false` to `package.json` — barrels are
  not currently tree-shaken by Webpack
- **Phase 8**: Add `httpClient` JSON parse safety audit (from institutional
  learning: HTML error pages cause `SyntaxError` if `res.json()` is called
  unconditionally)
- **Phase 8**: Detailed PR groupings for the 20-file migration
- **tsconfig.json**: Add `noUnusedLocals` and `noUnusedParameters`

---

## Overview

Systematic removal of dead code, unused dependencies, redundant abstractions,
and duplicated patterns across the WandaAsk frontend. No functional changes —
pure reduction in lines of code, file count, and cognitive overhead. Grouped
into independent, safely-releasable phases, ordered by risk/effort.

---

## Phase 0 — Baseline with Knip (Before Any Deletions)

Run Knip to get a definitive, machine-verified dead-code report before manually
deleting anything. `ts-prune` is abandoned (last maintained 2021); Knip is the
2025–2026 standard.

```bash
npm install --save-dev knip
npx knip --include exports,files,dependencies
```

Minimal `knip.json` for this project:

```json
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",
  "entry": [
    "app/**/{page,layout,loading,error,global-error,route}.{tsx,ts}",
    "instrumentation.ts",
    "next.config.ts",
    "eslint-rules/**/*.{ts,js}"
  ],
  "project": [
    "app/**/*.{ts,tsx}",
    "features/**/*.{ts,tsx}",
    "entities/**/*.{ts,tsx}",
    "shared/**/*.{ts,tsx}",
    "widgets/**/*.{ts,tsx}"
  ],
  "ignoreExportsUsedInFile": true
}
```

**Gotchas:**

- Server Actions exported from `features/*/api/*.ts` may show as unused — they
  are called by `app/` pages. If Knip doesn't trace them, add
  `features/**/api/*.ts` to `entry`.
- `"sideEffects": false` must be in `package.json` (Phase 2b) for Knip's bundle
  analysis to be accurate.
- Run report-only for one pass before adding to CI.

### Acceptance Criteria

- [ ] Knip report generated; output compared against this plan's file lists
- [ ] Any discrepancies resolved before proceeding to Phase 1

---

## Phase 1 — Delete Dead Files (Zero Risk, ~150 lines removed)

These files have been confirmed to have no importers anywhere in the codebase.

### Files to delete

| File                                         | Reason                                                                                                                                                                                                                                                                        |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/today-briefing/api/task-stats.ts`  | Backwards-compat shim; comment says "re-exports kept for migration" — no callers remain. Callers (`closed-tasks-block.tsx`, `task-stats-block.tsx`) already import directly from `@/features/issues`.                                                                         |
| `features/user-profile/types.ts`             | Re-exports only `Identity`; zero files import from this path.                                                                                                                                                                                                                 |
| `shared/ui/layout/generic-list.tsx`          | Exported from `shared/ui/layout/index.ts` but never consumed anywhere. **Note:** Without `"sideEffects": false` (Phase 2b), this component may currently be bundled wherever `shared/ui/layout` is imported. Deleting it AND adding `"sideEffects": false` compounds the win. |
| `features/decisions/ui/key-points-table.tsx` | Defines `KeyPointsTable`; no page or widget renders it. Check `app/dashboard/decisions/` first.                                                                                                                                                                               |
| `features/decisions/api/key-points.ts`       | Defines `getKeyPoints`; nothing calls it.                                                                                                                                                                                                                                     |

**Before deleting `decisions/`:** grep for any hidden consumer:

```bash
grep -rn "KeyPointsTable\|getKeyPoints" . --include="*.tsx" --include="*.ts"
```

**Also remove:** their lines from any `index.ts` that re-exports them.

### Acceptance Criteria

- [ ] All 5 files deleted
- [ ] Their re-export lines removed from relevant `index.ts` files
- [ ] `npm run build` passes
- [ ] `npm test -- --ci --passWithNoTests` passes

---

## Phase 2 — Remove Unused npm Dependency

```bash
npm remove gsd-pi
```

| Package  | Reason                                                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `gsd-pi` | CLI tool (`bin: gsd`), never imported anywhere in `.ts`/`.tsx` files. 2.9 MB from `node_modules`. Zero bundle impact, speeds up `npm install`. |

**⚠️ Do NOT remove `motion`** — it is required by 5 test files that mock
`motion/react-client` directly (e.g. `jest.mock('motion/react-client', ...)`).
`framer-motion` does not export the `motion/react-client` path; removing
`motion` breaks those mocks.

**Verify before removal:**

```bash
npx depcheck --ignores="@types/*,eslint-*,prettier,tailwindcss,husky,lint-staged"
```

### Acceptance Criteria

- [ ] `gsd-pi` removed from `package.json` and `package-lock.json`
- [ ] `npm run build` passes
- [ ] `npm test -- --ci` passes (especially `login-form.test.tsx`,
      `menu-nested-item.test.tsx`)

---

## Phase 2b — Add `"sideEffects": false` to `package.json` (Bundle Tree-Shaking)

**Finding from performance audit:** `package.json` has no `"sideEffects"` field.
Without it, Webpack conservatively assumes every barrel export has side effects
and includes the entire module when any export is imported. Dead components in
`shared/ui/layout/index.ts` and other barrels are likely being bundled.

```json
// package.json — add at top level
{
  "sideEffects": false
}
```

**Caveat:** If any file has genuine import-time side effects (e.g. global CSS
imports, polyfill registration), list them explicitly:

```json
{
  "sideEffects": ["./app/globals.css", "./instrumentation.ts"]
}
```

Check `app/globals.css` and `instrumentation.ts` — both likely need to be
listed.

**Impact:** Enables Webpack to properly tree-shake all barrel exports across
`shared/ui/`. Compounds with Phase 1 (dead component removal). Small but
compounding improvement across all client chunks.

### Acceptance Criteria

- [ ] `"sideEffects": false` (or with explicit exceptions) in `package.json`
- [ ] `npm run build` passes with no "critical dependency" warnings
- [ ] Test for any missing CSS by visual regression of key pages

---

## Phase 3 — Delete Alias Re-Export Files (~50 lines removed)

**Updated count: 5 alias files, not 2.** These files exist purely to re-export
symbols. Replace callers with direct imports, then delete.

⚠️ **Dependency: Phase 9 must run first** — some alias files re-export types
that need to move to `entities/` first.

### Alias files to delete (after Phase 9)

| File                                               | Re-exports from                                             | Action                                                                                                             |
| -------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `features/today-briefing/ui/task-status-badge.tsx` | `entities/issue/ui/issue-status-badge` as `TaskStatusBadge` | 1 caller: `agenda-list.tsx` — update to `IssueStatusBadge` from `@/entities/issue`                                 |
| `features/issues/ui/issue-status-badge.tsx`        | `entities/issue/ui/issue-status-badge`                      | Callers: `issues-page.tsx`, `archived-section.tsx`, `critical-path-node-detail.tsx` — update to `@/entities/issue` |
| `features/event/model/types.ts`                    | `entities/event`                                            | Verify zero consumers with grep, then delete                                                                       |
| `features/user/model/types.ts`                     | `entities/user`                                             | Verify zero consumers with grep, then delete                                                                       |

**Partial re-export block in `features/kanban/model/types.ts`:**

```ts
// Lines 95–99 — remove after Phase 9 moves types to entities/issue
export {
  type IssueStatus,
  type SharedFilters,
  type PersonOption,
} from '@/features/issues/model/types';
```

**Semantic check for `TaskStatusBadge` deletion:** `agenda-list.tsx` passes
`MeetingTask.status` to the badge. Verify `MeetingTask.status` uses
`IssueStatus` values (not `MeetingTaskStatus`) before replacing. If they use
different status enums, the alias is semantically meaningful and should be kept.

```bash
grep -rn "TaskStatusBadge\|task-status-badge" . --include="*.tsx" --include="*.ts"
```

### Acceptance Criteria

- [ ] All 4 alias files deleted (kanban re-export block removed)
- [ ] All callers updated to import directly from source
- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] `verbatimModuleSyntax: true` preserved — use `import type` for type-only
      imports

---

## Phase 4 — Remove Dead Function/Component Exports (~60 lines removed)

### `features/meetings/model/utils.ts` — `getDefaultDateRange`

Lines 27–47: exported but never imported. **Also delete its test cases** — there
is a dedicated test file with 5 test cases for this function. Leaving the tests
after deleting the export causes an import error.

```bash
grep -rn "getDefaultDateRange" . --include="*.ts" --include="*.tsx"
```

### `features/meetings/ui/meetings-list.tsx` — `MeetingsList` export

The named export `MeetingsList` has no external consumer. Remove the `export`
keyword; keep the component for internal use (if it's used internally) or remove
entirely if the page uses `MeetingsColumnView` directly.

```bash
grep -rn "MeetingsList" . --include="*.tsx" --include="*.ts"
```

### Acceptance Criteria

- [ ] `getDefaultDateRange` removed from `utils.ts` **and** its test cases
      deleted
- [ ] Dead export(s) removed from `meetings-list.tsx`
- [ ] `npm run build` passes
- [ ] Re-run after Phase 9 — moving types may expose additional dead exports in
      `features/issues/index.ts`

---

## Phase 5 — Collapse Micro-Constant Files (~20 lines removed)

**Reduced scope from original** — only `meetings/model/constants.ts` is worth
collapsing.

### `features/meetings/model/constants.ts`

```ts
// Single line: export const MEETINGS_PAGE_SIZE = 20;
// Used only in: features/meetings/ui/meetings-list.tsx
```

**Action:** Inline `const MEETINGS_PAGE_SIZE = 20` at the top of
`meetings-list.tsx`, delete `constants.ts`. Keep the named constant — do not
inline the bare number `20`.

### `features/meetings/index.ts` — `MeetingsDayView` export

`MeetingsDayView` has no consumer outside the feature. Remove from the public
API.

**Skip:** `features/calendar/lib/options.ts`, `features/auth/lib/options.tsx`,
`features/participants/lib/options.ts` — these are actively used or their
consumers require coordination with other phases.

### Acceptance Criteria

- [ ] `constants.ts` deleted, `const MEETINGS_PAGE_SIZE = 20` inlined in
      `meetings-list.tsx`
- [ ] `MeetingsDayView` removed from `features/meetings/index.ts`
- [ ] `npm run build` passes

---

## Phase 6 — Fix `shared/ui/participant/` FSD Violation (Architecture Fix)

**3 violations confirmed** in `shared/ui/participant/`:

- `participant-data.tsx` line 3: imports `@/features/participants/lib/options`
- `participant-data.tsx` line 4: imports
  `@/features/participants/ui/participants`
- `participant-matching.tsx` line 6: imports
  `@/features/participants/api/participants`

**Decision: Option B — move `shared/ui/participant/` entirely into
`features/participants/ui/`**

Option A (move only `ParticipantData`) leaves `participant-matching.tsx` still
violating the boundary. The entire directory belongs in
`features/participants/ui/` since all its files are tightly coupled to that
feature.

**Callers to update:**

- `widgets/meeting/ui/event-overview.tsx` — import from
  `@/features/participants` (valid: widgets can import features)
- `features/participants/ui/__tests__/participant-data.test.tsx` — update import
  paths within tests

**Steps:**

1. Move `shared/ui/participant/*.tsx` into `features/participants/ui/`
2. Export `ParticipantData`, `ParticipantMatching`, `ParticipantMatcher` from
   `features/participants/index.ts`
3. Update `widgets/meeting/ui/event-overview.tsx` to import from
   `@/features/participants`
4. Update test file import paths
5. Remove `shared/ui/participant/` directory

### Acceptance Criteria

- [ ] `shared/ui/participant/` directory deleted
- [ ] Components live in `features/participants/ui/`
- [ ] `widgets/meeting/` imports from `@/features/participants`
- [ ] `fsd-boundary-guard` passes for `shared/` layer
- [ ] All tests pass

---

## Phase 7 — Fix and Remove `InputTextarea` Wrapper (~20 lines removed)

`shared/ui/input/InputTextarea.tsx` is a 7-line wrapper around `Textarea` with
`// @ts-ignore` suppressing a type mismatch between `InputProps` (requires
`value: string`) and `TextareaProps` (accepts `value?: string`). The `onChange`
types also diverge: `ChangeEvent<HTMLInputElement>` vs
`ChangeEvent<HTMLTextAreaElement>`.

**Correct TypeScript fix:** Replace the `InputProps` inheritance with
`ComponentPropsWithoutRef<typeof Textarea>`:

```tsx
// The correct approach — no @ts-ignore needed
import { type ComponentPropsWithoutRef } from 'react';
import Textarea from '@/shared/ui/input/textarea';

type InputTextareaProps = ComponentPropsWithoutRef<typeof Textarea>;

export default function InputTextarea(props: InputTextareaProps) {
  return <Textarea {...props} />;
}
```

**Do NOT use `@ts-expect-error`** as an alternative — it still hides the type
mismatch.

After fixing the type, verify all 4 callers still compile. If callers pass
`onChange: (e: ChangeEvent<HTMLInputElement>) => void`, those callers are wrong
and must be fixed to use `ChangeEvent<HTMLTextAreaElement>`.

Once all 4 callers compile cleanly against `Textarea` directly, delete
`InputTextarea.tsx`.

### Acceptance Criteria

- [ ] No `@ts-ignore` or `@ts-expect-error` in `shared/ui/`
- [ ] TypeScript strict mode passes (`tsc --noEmit`)
- [ ] `InputTextarea.tsx` deleted (or properly typed if callers truly need the
      wrapper)
- [ ] Remove from `shared/ui/input/index.ts`

---

## Phase 8 — Migrate Raw `fetch` → `httpClient` (~20 files, deduplicates ~250 lines)

**This is API standardization, not dead code removal.** It is the highest-effort
phase with real regression risk. Each file has unique error handling that must
be individually audited.

### Pre-migration safety check: audit `httpClient` for JSON parse safety

From institutional learning
(`docs/solutions/integration-issues/server-action-html-response-json-parse.md`):
when Laravel returns a 5xx HTML error page, calling `res.json()` unconditionally
throws `SyntaxError`. Verify `shared/lib/httpClient.ts` uses the two-step safe
pattern:

```ts
// ✅ Safe pattern
const text = await res.text();
try {
  const json = JSON.parse(text) as Record<string, unknown>;
} catch {
  throw new ServerError('Server error. Please try again later.', ...);
}
```

If `httpClient` uses `res.json()` directly, fix it before migrating any files.

### Hard exclusions (do NOT migrate)

| File                                               | Reason                                                                                                                                                                                                |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/auth/api/auth.ts`                        | Pre-auth; `httpClient` calls `getAuthHeaders()` which throws if no token. Login/register/forgot/reset must stay as raw fetch.                                                                         |
| `features/kanban/api/kanban.ts`                    | `getKanbanIssues()` reads `Items-Count` then fires parallel `Promise.all` for remaining pages. `httpClientList` returns one page — incompatible. Requires a multi-page variant or stays as raw fetch. |
| `features/calendar/api/source.ts` — `getSources()` | Returns `[]` on any non-OK response (fail-silent). `httpClient` throws `ServerError`. Changing this contract silently breaks callers.                                                                 |

### Files requiring per-function audit before migration

| File                                                        | Issue                                                                                                                                                                                                             |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/calendar/api/calendar.ts` — `attachCalendar()`    | Parses `meta.error_code === 'SOURCE_ALREADY_EXISTS'` from 4xx body. After migration, read from `error instanceof ServerError ? parseApiError(error.responseBody) : ...`. Do not silently drop this error message. |
| `features/agents/api/agents.ts`                             | Has a private `requestAgentApi`/`actionAgentApi` wrapper; custom `hasMore` formula for pagination (`safeOffset + data.length < totalCount`). Delete wrappers; keep custom hasMore logic.                          |
| `features/chat/api/messages.ts` — `pollRun()`               | Called from a client component polling loop. Verify whether it goes through a Server Action wrapper or is called directly before migrating.                                                                       |
| `features/organization/api/organization.ts`                 | `getOrganizations`/`getOrganization` wrapped with React `cache()` — intentional request deduplication during SSR. Preserve the `cache()` wrapper after migration.                                                 |
| All files with `redirect('/api/auth/clear-session')` on 401 | `httpClient` redirects to `ROUTES.AUTH.LOGIN` instead. Verify whether `/api/auth/clear-session` is a Route Handler that clears the Sanctum cookie before normalizing the 401 target.                              |

### Migration pattern

```ts
// ❌ Before
const authHeaders = await getAuthHeaders();
const res = await fetch(`${API_URL}/teams/${id}`, { headers: authHeaders });
if (res.status === 401) redirect('/api/auth/clear-session');
if (!res.ok) throw new Error(await res.text());
const json = await res.json();
return json.data;

// ✅ After (read-only, returns data or throws)
const { data } = await httpClient<TeamProps>(`${API_URL}/teams/${id}`);
return data;

// ✅ After (mutation, returns ActionResult<T> — Rule 3 pattern)
try {
  const { data } = await httpClient<TeamProps>(`${API_URL}/teams/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  });
  return { data, error: null };
} catch (error) {
  if (error instanceof ServerError) {
    const parsed = parseApiError(
      error.responseBody ?? '',
      'Failed to update team',
    );
    return {
      data: null,
      error: parsed.message,
      fieldErrors: parsed.fieldErrors,
    };
  }
  throw error;
}

// ✅ After (fire-and-forget — use explicit void type)
await httpClient<void>(`${API_URL}/agent-tasks/${id}/dispatch`, {
  method: 'POST',
});

// ✅ After (paginated list — use httpClientList)
return httpClientList<TeamProps>(`${API_URL}/teams`);
```

**TypeScript: no implicit `any`** — always provide the type parameter. If the
response is discarded, use `httpClient<void>`. If `tsc --noEmit` passes without
a type parameter, the result is `unknown` (safe, but imprecise — add `<void>`
explicitly).

### Also migrate: local `*ActionError` types → `ActionResult<T>`

`features/chat/api/chats.ts` defines `ChatActionError`,
`features/chat/api/messages.ts` defines `MessageActionError`, etc. These are all
`{ data: null; error: string; fieldErrors?: ... }` — exactly
`ActionResult<never>`. Replace with `ActionResult<T>` from
`@/shared/types/server-action` in the same PR.

### PR groupings (recommended order)

| PR                      | Files                                                                                                        | Notes                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Auth                    | `features/auth/api/auth.ts`                                                                                  | Mark as intentional exception, add comment explaining why it stays raw fetch               |
| User + UserProfile      | `features/user/api/user.ts`, `features/user-profile/api/profile.ts`                                          | Same `/users/me` backend endpoint                                                          |
| Demo                    | `features/demo/api/seed-demo.ts`, `features/demo/api/delete-demo.ts`, `features/demo/api/get-demo-status.ts` | Also remove local `DemoSeedApiResponse` types → use `ApiResponse<T>`                       |
| Calendar + Participants | `features/calendar/api/calendar.ts`, `features/participants/api/participants.ts`                             | Preserve `SOURCE_ALREADY_EXISTS` error handling; preserve `cache()` wrappers               |
| Chat + Telegram         | `features/chat/api/chats.ts`, `features/chat/api/messages.ts`, `features/chat/api/telegram.ts`               | Replace `*ActionError` types with `ActionResult<T>`                                        |
| Organization            | `features/organization/api/organization.ts`                                                                  | Remove `console.error` suppressions (replaced by `httpClient` logging); preserve `cache()` |
| Agents                  | `features/agents/api/agents.ts`, `features/agents/api/activity.ts`                                           | Delete private `requestAgentApi`/`actionAgentApi` wrappers; keep custom hasMore            |
| Teams + Kanban          | `features/teams/api/team.ts`, `features/teams/api/notification-settings.ts`                                  | Run after Phase 9; `kanban.ts` stays as raw fetch (excluded above)                         |
| Issues + Event          | `features/issues/api/issues.ts`, `features/event/api/calendar-events.ts`                                     |                                                                                            |

### Acceptance Criteria

- [ ] `shared/lib/httpClient.ts` uses safe two-step JSON parse before any file
      is migrated
- [ ] `getAuthHeaders` is no longer imported by any migrated `features/*/api/`
      file
- [ ] Auth endpoints documented as intentional raw-fetch exceptions
- [ ] All `*ActionError` local types replaced with `ActionResult<T>`
- [ ] All existing tests pass
- [ ] No change to 401 redirect behavior without explicit decision

---

## Phase 9 — Fix Cross-Feature Type Imports (FSD Violation, Import-Path Fix)

**Clarification:** `IssueStatus` already exists in
`entities/issue/model/types.ts` and is re-exported from
`entities/issue/index.ts`. The problem is that `features/kanban/` and others
import it from `@/features/issues/model/types` (a deep cross-feature path)
instead of `@/entities/issue`.

This phase is primarily a search-and-replace of import paths, not a type move.

### What genuinely needs to move to `entities/issue/`

| Symbol               | Currently in                                 | Action                                                        |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| `IssueStatus`        | Already in `entities/issue/model/types.ts` ✓ | Just fix import paths                                         |
| `IssuePriority`      | `features/issues/model/types.ts`             | Move to `entities/issue/model/types.ts`                       |
| `getPriorityLevel`   | `features/issues/model/types.ts`             | Move to `entities/issue/model/types.ts`                       |
| `IssuePriorityBadge` | `features/issues/ui/`                        | Move to `entities/issue/ui/`                                  |
| `PersonOption`       | `features/issues/model/types.ts`             | Move to `entities/issue/model/types.ts` (or `entities/user/`) |
| `SharedFilters`      | `features/issues/model/types.ts`             | Move to `entities/issue/model/types.ts`                       |

**Also found:** `IssueStatus` is duplicated in
`features/teams/model/dashboard-types.ts`. Resolve this divergent definition
before migrating — it likely maps to the same values but is independently
declared.

### Migration strategy (temporary bridge, not permanent)

```ts
// Step 1: Move/confirm types in entities/issue/model/types.ts
// Step 2: Add temporary re-export bridge in features/issues/model/types.ts:
// TODO: remove after all cross-feature imports are migrated to @/entities/issue
export type {
  IssueStatus,
  PersonOption,
  SharedFilters,
  IssuePriority,
} from '@/entities/issue/model/types';
export { getPriorityLevel } from '@/entities/issue/model/types';

// Step 3: Update all kanban imports:
// Before: import type { IssueStatus } from '@/features/issues/model/types';
// After:  import type { IssueStatus } from '@/entities/issue';

// Step 4: Remove the bridge once all imports are updated
```

**`verbatimModuleSyntax: true` requirement:** all re-exported types must use
`export type { ... }`, not `export { ... }`.

### All violations to fix

Cross-feature imports confirmed by FSD audit:

- `features/kanban/api/kanban.ts:9` → `@/features/issues/model/types`
- `features/kanban/model/types.ts:6,99` → `@/features/issues/model/types`
- `features/kanban/ui/kanban-board.tsx:12` → `@/features/issues/model/types`
  (getPriorityLevel)
- `features/kanban/ui/kanban-card-item.tsx:6` →
  `@/features/issues/ui/issue-priority-badge`
- `features/today-briefing/ui/closed-tasks-block.tsx:3` →
  `@/features/issues/api/issue-stats`
- `features/today-briefing/ui/task-stats-block.tsx:4` →
  `@/features/issues/api/issue-stats`

Additionally, add missing exports to incomplete `index.ts` files:

- `features/menu/index.ts` — add `MenuProps` (imported by 4 files in
  `features/user-profile/`)
- `features/decisions/index.ts` — add `DecisionsPage` (imported by
  `features/teams/`)
- `features/issues/index.ts` — add `getPriorityLevel` (imported by
  `features/kanban/`)

**Note:** Adding to `index.ts` fixes Rule 3 (deep path bypasses) but not Rule 1
(cross-feature). Cross-feature dependencies on `MenuProps` and `DecisionsPage`
are separate violations worth tracking but lower priority than the kanban→issues
type coupling.

### Acceptance Criteria

- [ ] `features/kanban` has no imports from `features/issues`
- [ ] `features/today-briefing` direct imports from `features/issues` replaced
      (use `@/features/issues` public index, not deep paths)
- [ ] `entities/issue/index.ts` exports `IssueStatus`, `IssuePriority`,
      `getPriorityLevel`, `IssuePriorityBadge`, `PersonOption`, `SharedFilters`
- [ ] `fsd-boundary-guard` passes for kanban and today-briefing layers
- [ ] `tsc --noEmit` passes

---

## Phase 10 — Deduplicate Local Date Utils (~40 lines removed)

**Narrowed scope from original** — only two locations have true duplicates with
`shared/lib`.

### `app/dashboard/meetings/list/page.tsx`

```ts
// Lines 4–17 — local functions that duplicate shared utilities:
function toDateParam(date: Date) { ... }  // already in shared/lib/date-nav.ts
function formatColumnDate(date: Date) { ... }  // use format(date, 'dd.MM') from date-fns
```

**Action:** Import `toDateParam` from `@/shared/lib/date-nav`, replace
`formatColumnDate` with `format(date, 'dd.MM')` from `date-fns`. Verify the
format string produces identical output before replacing.

### `features/event/lib/options.tsx`

```tsx
// Local formatDate / formatTime (lines 14–34) — wrap date-fns format() locally
```

**Action:** Replace with direct `format` calls from `date-fns`. Verify locale
behavior — if the current implementation uses `toLocaleDateString('en-GB', ...)`
or a locale-specific format, match that exactly with the date-fns format string.

**Do NOT merge:** `features/agents/lib/format.ts` (formats `dd.MM.yyyy HH:mm`)
and `features/transcript/lib/chatTime.ts` (formats seconds-as-float into
`mm:ss.cc`) — these serve different concerns and are not duplicates.

### Acceptance Criteria

- [ ] No local date formatting functions in
      `app/dashboard/meetings/list/page.tsx`
- [ ] No local formatting wrappers in `features/event/lib/options.tsx`
- [ ] Output format verified to be identical before and after
- [ ] `npm run build` passes

---

## Phase 11 — TypeScript Compiler Strictness (New)

Add two compiler flags to catch future dead code at development time:

```json
// tsconfig.json — add to "compilerOptions"
{
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

These are compatible with the existing `"strict": true` baseline. They would
have caught `getDefaultDateRange` and unused destructured params during normal
development.

**After enabling**, run `tsc --noEmit` and fix all newly-surfaced errors. Common
patterns to expect:

- Unused import bindings (remove or add `_` prefix to suppress intentionally
  unused params)
- Unused destructured variables in components
- Unused type parameters on generic functions

### Acceptance Criteria

- [ ] `noUnusedLocals: true` and `noUnusedParameters: true` in `tsconfig.json`
- [ ] `tsc --noEmit` produces zero errors
- [ ] CI lint step passes

---

## Execution Order

Phases are ordered by dependency and risk. Each is independently mergeable
within its group.

### Group A — Zero risk, no dependencies (do first)

| Phase                            | Effort | Lines Saved            |
| -------------------------------- | ------ | ---------------------- |
| 0 — Knip baseline                | XS     | —                      |
| 2 — Remove `gsd-pi`              | XS     | 0 (install time)       |
| 2b — `"sideEffects": false`      | XS     | 0 (bundle improvement) |
| 1 — Delete dead files            | S      | ~150                   |
| 5 — Collapse micro-constants     | S      | ~20                    |
| 7 — Remove InputTextarea wrapper | S      | ~20                    |

### Group B — Architecture fixes (do together or in order: 9 → 6 → 3)

| Phase                              | Effort | Notes                                               |
| ---------------------------------- | ------ | --------------------------------------------------- |
| 9 — Fix cross-feature type imports | M      | Import-path fix; `IssueStatus` already in entities/ |
| 6 — Fix `shared/ui/participant/`   | M      | Move to `features/participants/ui/`                 |
| 3 — Delete alias files             | S      | Blocked until Phase 9 complete                      |
| 4 — Remove dead exports            | S      | Re-check after Phase 9                              |

### Group C — Standardization (per-PR, not in one batch)

| Phase                              | Effort | Risk                                    |
| ---------------------------------- | ------ | --------------------------------------- |
| 8 — Migrate raw fetch → httpClient | L      | Medium — 8 PRs, per-feature, audit each |
| 10 — Deduplicate date utils        | S      | Low                                     |
| 11 — TypeScript strictness         | S      | Low                                     |

**Total estimated:** ~640 lines removed, 1 npm package dropped, ~8 files
deleted, 17 FSD violations addressed (partially — the most critical ones),
bundle improved via tree-shaking.

---

## References

- Project API Layer Rules: `CLAUDE.md` → "API Layer Conventions"
- FSD Import Rules: `CLAUDE.md` → "FSD Layer Rules"
- Institutional learning:
  `docs/solutions/integration-issues/server-action-html-response-json-parse.md`
  — HTML response causes SyntaxError if `res.json()` called unconditionally
- `shared/lib/httpClient.ts` — target client for Phase 8 migration
- `entities/issue/model/types.ts` — `IssueStatus` already defined here
- `entities/issue/index.ts` — existing entity public API
- `shared/lib/date-nav.ts` — target for Phase 10 date util consolidation
- Knip: https://knip.dev/ — recommended dead code detection tool (replaces
  ts-prune)
- FSD types guide: https://feature-sliced.design/docs/guides/examples/types
