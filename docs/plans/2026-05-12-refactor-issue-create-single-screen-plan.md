---
title:
  'refactor: Collapse issue create form to single screen, remove dead code,
  align with project conventions'
type: refactor
status: active
date: 2026-05-12
---

# refactor: Collapse issue create form to single screen, remove dead code, align with project conventions

## Enhancement Summary

**Deepened on:** 2026-05-12 **Agents used:** TypeScript reviewer, Architecture
strategist, Simplicity reviewer, Performance oracle, Race condition reviewer,
Security sentinel, Pattern recognition specialist, Spec-flow analyzer,
Feasibility + coherence reviewer, Best practices researcher, httpClient
migration researcher

### Key Improvements Over Original Plan

1. **`useState` not `useMemo`** for `uploadToken` — `useMemo` stability is not
   guaranteed by React's contract; React Compiler may inline it, regenerating
   the token mid-session and orphaning uploads.
2. **Separate PR for `httpClient` migration** — bundling mechanical fetch
   migration with the UX collapse makes the diff harder to review and rollback.
   Keep Phase 3 as its own commit.
3. **Keep `IssueFormValues` in `issue-form.tsx`** — it is a UI-layer form-bag
   type, not a domain type. Moving it to `model/types.ts` mixes UI concerns into
   the model layer.
4. **Use `UserBasicProps` from `entities/user`** for `currentUser` — not a new
   type in `model/types.ts`.
5. **`isDirty` guard must be relaxed on create path** — the submit button is
   disabled on a fresh page, trapping users with default values.
6. **Edit form must NOT gain `PendingAttachmentUploader`** — internalizing
   `uploadToken` without a mode guard adds an unexpected upload widget to the
   edit form.
7. **Correct implementation order** — delete the file only AFTER removing the
   `index.ts` export and updating the page import; wrong order breaks the build.
8. **Critical security finding** — `ChatMessageContent` has a stored XSS via
   markdown attachment preview (`innerHTML` + script re-execution); tracked as a
   separate P0 item.

### New Considerations Discovered

- `getArchivedCount` silently returns `0` on error — `httpClient` would throw
  instead; handle separately
- `getIssue` calls `notFound()` on 404/403 — must be preserved explicitly after
  `httpClient` migration with `ServerError.status` check
- 11 raw `fetch` calls in `api/issues.ts`, not 8 — `dispatchIssue`,
  `answerAgentFlow`, `getEpics` also need migration
- `createIssue` has no `revalidatePath` — natural place to fix during migration
- Cross-feature FSD violation: `issue-form.tsx` imports `getTeams` from
  `@/features/teams/api/team` directly
- `IssuesTabsNav` consumed via deep path from `(progress)/layout.tsx` — also
  needs `index.ts` export
- No `loading.tsx` for the `(create)` route group — violates CLAUDE.md
  convention
- `onCreated`-absent path already works today (line 235) — the behavioral change
  is already wired

---

## Overview

The issue-create flow currently uses a **two-screen state machine** inside
`IssueCreatePageClient`: Screen 1 renders `IssueForm` (with
`PendingAttachmentUploader`), and Screen 2 appears after successful creation
showing a success banner + `IssueAttachments` (a post-creation upload panel) + a
"Go to task" link.

This two-screen pattern is unnecessary. The `PendingAttachmentUploader` already
handles file uploads _before_ the issue exists (via `upload_token`), so
attachments are fully available at creation time. The second screen adds UX
friction and code complexity with no benefit. The `IssueForm` at `[id]/page.tsx`
already renders without any wrapper and navigates directly — the create page
should do the same.

**Goal:** single screen create form, delete the wrapper component, fix FSD
boundary violations, and scope the `httpClient` migration as a separate commit.

---

## Problem Statement

### 1. Two-screen create flow is a UX anti-pattern here

- Screen 2 (`IssueAttachments`) exists because on the backend,
  `POST /attachments/pending` binds files to a `upload_token`, and on creation
  those become real `issue_attachments`.
- The backend already returns the created issue with its `attachments` populated
  — there is no functional reason to stay on a post-creation "attach more files"
  screen.
- The detail page at `app/dashboard/issues/[id]/page.tsx` already fetches
  `getIssueAttachments` and renders `IssueAttachments` — it is the canonical
  post-create destination.
- The user expects a single form → submit → redirect to issue detail.

### 2. `IssueCreatePageClient` is a thin dead wrapper

- Its only purpose is the 2-state machine
  (`createdIssue === null ? form : success`).
- `IssueForm` already has the fallback `router.push(...)` on line 235 — the
  `else if (onCreated)` branch is the only reason the wrapper exists.
- `[id]/page.tsx` renders `IssueForm` directly today with no wrapper, proving
  the pattern works.

### 3. Dead code and FSD violations

- `IssueProgressPage`, `IssueProgressChart`, `IssueProgressKpiCards`,
  `IssueWeeklySummary` — consumed via deep paths from outside the feature (FSD
  violation).
- `IssuesTabsNav` — consumed via deep path from `(progress)/layout.tsx` (FSD
  violation).
- `IssueCreatePageClient` and `PendingAttachmentUploader` exported from
  `index.ts` but have no external consumers.
- Cross-feature import: `issue-form.tsx:20` imports `getTeams` from
  `@/features/teams/api/team` directly.
- `self-referential path`: `index.ts:44` uses
  `'../issues/ui/tasks-kanban-client'` instead of `'./ui/tasks-kanban-client'`.

### 4. `api/issues.ts` has 11 raw `fetch` calls (separate PR)

Violates API Layer Rule 2. Full list with migration complexity:

| Function            | Line | Migration complexity                                               |
| ------------------- | ---- | ------------------------------------------------------------------ |
| `getIssues`         | 124  | Standard → `httpClientList`                                        |
| `loadIssuesChunk`   | 159  | Standard → `httpClientList` (consider merging with `getIssues`)    |
| `getArchivedCount`  | 203  | ⚠️ Returns `0` silently on error — must preserve with `try/catch`  |
| `loadArchivedChunk` | 234  | Standard → `httpClientList`                                        |
| `getIssue`          | 269  | ⚠️ Calls `notFound()` on 404/403 — must catch `ServerError.status` |
| `createIssue`       | 296  | Standard → `httpClient` + `ActionResult`                           |
| `updateIssue`       | 335  | Standard → `httpClient` + `ActionResult`                           |
| `deleteIssue`       | 373  | Standard → `httpClient<void>`                                      |
| `dispatchIssue`     | 396  | ⚠️ Returns `{ error: string \| null }` — non-throwing contract     |
| `answerAgentFlow`   | 428  | ⚠️ Returns `{ error: string \| null }` — non-throwing contract     |
| `getEpics`          | 463  | Standard → `httpClient`                                            |

**This migration is scoped to a separate commit/PR.** Do not bundle it with the
create-flow collapse.

### 5. `isDirty` guard silently blocks the create form

`IssueForm` line 415: `disabled={isPending || !isDirty || hasPendingOps}`. In
create mode the form pre-fills `defaultValues` from props (`defaultDueDate()`,
`priority: 0`, etc.), so `isDirty` starts `false`. A user who accepts defaults
and clicks Submit sees a disabled button with no explanation. This must be fixed
as part of collapsing the flow.

---

## Proposed Solution

### Phase 1 — Collapse create flow (THIS PR)

#### Step 1.1 — Fix `uploadToken` generation in `IssueForm`

Replace the existing `uploadToken` prop with an internal `useState` lazy
initializer. Use `useState`, not `useMemo` — `useMemo` is a performance hint and
React (especially with React Compiler enabled) may discard and recompute it,
regenerating the UUID mid-session and orphaning uploaded attachments.

```tsx
// features/issues/ui/issue-form.tsx

// ✅ Correct — lazy initializer runs exactly once per mount, guaranteed stable
const [uploadToken] = useState<string>(() => crypto.randomUUID());

// ❌ Wrong — useMemo stability not guaranteed by React contract; Compiler may inline
// const uploadToken = useMemo(() => crypto.randomUUID(), []);

// ❌ Wrong — eager useRef evaluates on every render call
// const uploadToken = useRef(crypto.randomUUID()).current;
```

The `uploadToken` must only be active in **create mode** (when `issue` prop is
absent). Gate the `PendingAttachmentUploader` render and the cleanup `useEffect`
on `!issue`:

```tsx
// Cleanup — only fires in create mode
useEffect(() => {
  if (issue) return; // edit mode has no pending attachments
  return () => {
    if (isSubmittedRef.current) return;
    for (const att of pendingAttachmentsRef.current) {
      void deletePendingAttachment(att.id);
    }
  };
}, []); // eslint-disable-line react-hooks/exhaustive-deps

// Render — only in create mode
{!issue && (
  <PendingAttachmentUploader
    uploadToken={uploadToken}
    attachments={pendingAttachments}
    onUploaded={...}
    onDeleted={...}
    onPendingChange={setHasPendingOps}
  />
)}
```

Also update `IssueUpsertDTO` payload in `onSubmit` to send
`upload_token: issue ? null : uploadToken` — do not send the token on PATCH.

#### Step 1.2 — Remove `onCreated` prop from `IssueForm`

The success branch in `onSubmit` (lines 232–236) already has the correct
fallback: `router.push(ROUTES.DASHBOARD.ISSUES/${result.data.id})`. Remove the
`onCreated` prop entirely — it has exactly one caller (`IssueCreatePageClient`
line 54) which is being deleted. Also fix the narrowing for
`ActionResult<Issue>`: after the guard `if (result.error)`, the success value is
`result.data`, not `result as Issue`.

```tsx
// After guard — result is narrowed to Issue (createIssue returns Issue | IssueActionError in Phase 1)
isSubmittedRef.current = true;
toast.success('Issue created');
router.push(`${ROUTES.DASHBOARD.ISSUES}/${(result as Issue).id}`);
```

Note: `result.data.id` applies only after Phase 2 when `createIssue` is migrated
to return `ActionResult<Issue>`. In Phase 1 keep the existing `result as Issue`
cast.

#### Step 1.3 — Fix `isDirty` guard for create mode

The submit button must be enabled on a fresh create form. Apply the guard only
in edit mode:

```tsx
<Button
  type="submit"
  loading={isPending}
  disabled={isPending || (!!issue && !isDirty) || hasPendingOps}
>
```

#### Step 1.4 — Fix the no-op alias

Delete line 153 (`const filteredPersons = persons`) and use `persons` directly
in the `personOptions` derivation.

#### Step 1.5 — Use `UserBasicProps` from `entities/user` for `currentUser` prop

The `CurrentUser` interface is defined identically in both `issue-form.tsx:39`
and `issue-create-page-client.tsx:18`. Both are identical to `UserBasicProps` in
`entities/user/model/types.ts`. Do not create a third definition. Import and use
`UserBasicProps`:

```tsx
import type { UserBasicProps } from '@/entities/user';

interface IssueFormProps {
  currentUser?: UserBasicProps | null;
  // ...
}
```

Verify `entities/user/index.ts` exports `UserBasicProps` — add it if missing.

#### Step 1.6 — Update `create/page.tsx` to render `IssueForm` directly

```tsx
// app/dashboard/issues/(create)/create/page.tsx
import { IssueForm } from '@/features/issues'; // via index.ts public API

export default async function IssueCreatePage() {
  const [...] = await Promise.all([...]);

  return (
    <Card className="h-full flex flex-col">
      <PageHeader hasButtonBack title="Create task" />
      <div className="h-full overflow-y-auto">
        <CardBody>
          <IssueForm
            organizations={organizationsResponse.data ?? []}
            persons={persons}
            epics={epics}
            defaultOrganizationId={organizationId}
            currentUser={userResponse.data ?? null}
          />
        </CardBody>
      </div>
    </Card>
  );
}
```

Note: no `uploadToken` prop passed — the form generates it internally in create
mode.

#### Step 1.7 — Remove `IssueCreatePageClient` export from `index.ts`

Do this BEFORE deleting the file to avoid a build-breaking window.

```ts
// features/issues/index.ts — remove:
export { IssueCreatePageClient } from './ui/issue-create-page-client';
export { PendingAttachmentUploader } from './ui/pending-attachment-uploader';
```

`PendingAttachmentUploader` has no external consumers — confirmed by codebase
search. Remove it from the public API.

#### Step 1.8 — Delete `issue-create-page-client.tsx`

Only after steps 1.6 and 1.7 are committed. Deleting before removing the export
creates a TypeScript compile error.

#### Step 1.9 — Fix FSD `index.ts` exports and deep-path imports

Add to `index.ts` (components currently imported via deep paths from outside the
feature):

```ts
// Only IssueProgressPage is consumed by app/ consumers — the three sub-components
// (IssueProgressChart, IssueProgressKpiCards, IssueWeeklySummary) are only used
// internally by IssueProgressPage and must NOT be added here.
export { IssueProgressPage } from './ui/issue-progress-page';
export { IssuesTabsNav } from './ui/issues-tabs-nav';
```

Update consumer import paths:

- `app/dashboard/issues/(progress)/progress/page.tsx` — change to
  `@/features/issues`
- `app/dashboard/today/progress/page.tsx` — change to `@/features/issues`
- `app/dashboard/issues/(progress)/layout.tsx` — change `IssuesTabsNav` import
  to `@/features/issues`

Fix the self-referential path in `index.ts:44`:

```ts
// Before
export { TasksKanbanClient } from '../issues/ui/tasks-kanban-client';
// After
export { TasksKanbanClient } from './ui/tasks-kanban-client';
```

#### Step 1.10 — Add `loading.tsx` for the create route

```tsx
// app/dashboard/issues/(create)/create/loading.tsx
import { Card, CardBody } from '@/shared/ui/card';
import { Skeleton, SkeletonList } from '@/shared/ui/layout/skeleton';

export default function Loading() {
  return (
    <Card className='h-full flex flex-col'>
      <div className='p-4 border-b border-border'>
        <Skeleton className='h-6 w-32' />
      </div>
      <CardBody>
        <SkeletonList count={8} />
      </CardBody>
    </Card>
  );
}
```

---

### Phase 2 — `httpClient` migration (SEPARATE COMMIT/PR)

Scope this independently to keep diffs reviewable.

#### Functions with non-trivial migration behavior (handle with care)

**`getIssue` — preserve `notFound()` on 404/403:**

```ts
export async function getIssue(id: number): Promise<Issue> {
  try {
    const { data } = await httpClient<Issue>(`${API_URL}/issues/${id}`);
    return data!;
  } catch (error) {
    if (
      error instanceof ServerError &&
      (error.status === 404 || error.status === 403)
    ) {
      notFound(); // throws internally — renders not-found.tsx
    }
    throw error;
  }
}
```

**`getArchivedCount` — preserve silent-zero on error:**

```ts
export async function getArchivedCount(
  filters: IssueFilters = {},
): Promise<number> {
  try {
    const { totalCount } = await httpClientList<Issue>(
      `${API_URL}/issues?${query}`,
    );
    return totalCount;
  } catch {
    return 0; // intentional silent failure — UI degrades gracefully
  }
}
```

**`dispatchIssue` / `answerAgentFlow` — preserve `{ error: string | null }`
contract (non-throwing):**

These functions return a typed error result instead of throwing. Wrap in
try/catch and convert `ServerError` to the existing contract shape.

**`createIssue` — add `revalidatePath`:**

```ts
revalidatePath(ROUTES.DASHBOARD.ISSUES);
revalidatePath(ROUTES.DASHBOARD.KANBAN);
```

**`updateIssue` — already has `revalidatePath`**, verify it also hits
`/dashboard/issues/${id}`.

**401 handling — extend `httpClient` before migrating:**

The raw fetch calls `clearSession()` before redirecting on 401. `httpClient`
currently calls `redirect()` directly without clearing the cookie, which creates
a stale-token redirect loop. Add `clearSession()` to `httpClient` on 401:

```ts
// shared/lib/httpClient.ts — extend 401 block
import { clearSession } from '@/shared/api/session';
if (res.status === 401) {
  await clearSession();
  redirect(ROUTES.AUTH.LOGIN);
}
```

**`hasMore` calculation — use offset-aware formula:**

`httpClientList` uses `data.length < totalCount`, which is wrong mid-list when
backend returns fewer items than `limit` for reasons other than end-of-list.
After migration, compute `hasMore` explicitly:

```ts
const { data, totalCount } = await httpClientList<Issue>(
  `${API_URL}/issues?${query}`,
);
return {
  data,
  totalCount,
  hasMore: (filters.offset ?? 0) + (filters.limit ?? 10) < totalCount,
};
```

**Cross-feature `getTeams` import — track separately:**

`issue-form.tsx:20` imports `getTeams` from `@/features/teams/api/team`
directly. This FSD violation is pre-existing and not in scope for either PR, but
should be tracked. Move `getTeams` to `entities/team` or expose it via
`@/features/teams` public API.

---

## Race Conditions and Timing

### `isSubmittedRef` vs cleanup destructor — safe as-is

`router.push()` in Next.js App Router does NOT synchronously unmount the
component. The sequence is:

```
isSubmittedRef.current = true   ← sync, runs first
toast.success(...)              ← sync
router.push(...)                ← schedules navigation, returns immediately
... [async navigation work] ...
IssueForm unmounts
cleanup destructor runs → isSubmittedRef.current === true → no deletion
```

The ref assignment wins the race. Safe.

### `PendingAttachmentUploader` mid-flight uploads on unmount

If an upload completes after the cleanup destructor runs, the attachment lands
on the backend but the cleanup loop already finished — the attachment is
orphaned until the prune job runs. To mitigate:

1. Pass a cancellation flag to `PendingAttachmentUploader` via ref:

```tsx
const cancelledRef = useRef(false);
useEffect(
  () => () => {
    cancelledRef.current = true;
  },
  [],
);
```

2. In the upload `.then()`:

```ts
.then((result) => {
  if (cancelledRef.current) {
    if (result.data) void deletePendingAttachment(result.data.id);
    return;
  }
  if (result.error) { toast.error(result.error); return; }
  if (result.data) onUploaded(result.data);
})
```

### `onPendingChange` inside state updater — fix the side effect

Currently `onPendingChange` is called inside `setPendingOps` updater function (a
side effect in a pure function). Move to `useEffect`:

```ts
// PendingAttachmentUploader — replace inline onPendingChange calls with effect
useEffect(() => {
  onPendingChange(pendingOps.size > 0);
}, [pendingOps.size, onPendingChange]);
```

---

## Security Notes

### P0 — Stored XSS in `ChatMessageContent` (pre-existing, not introduced here)

`features/chat/ui/chat-message-content.tsx` uses `innerHTML` assignment +
explicit `<script>` re-execution for HTML-starting content. A file named `*.md`
containing `<script>alert(document.cookie)</script>` triggers this path via
attachment preview in `IssueAttachments`. The extension blocklist on the backend
does not block `.md`, `.html`, `.js`, `.svg`. **Track as a separate security
fix.** Add DOMPurify sanitization before any `innerHTML` assignment and remove
the script re-execution block.

### P1 — `httpClient` must call `clearSession()` on 401

See Phase 2 notes above. Without this, stale Sanctum tokens cause a redirect
loop.

### P2 — Add Content-Security-Policy header

`next.config.ts` has HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy` but no CSP. A CSP blocking inline scripts would have limited
the XSS above even without fixing the innerHTML code. Track separately.

---

## Acceptance Criteria

### Functional

- [ ] Issue create form renders all fields AND attachments on a single screen
- [ ] Submitting the create form redirects to `ROUTES.DASHBOARD.ISSUES/${id}`
      immediately (no intermediate screen)
- [ ] Submit button is enabled immediately on a fresh create page (even with
      pre-filled default values)
- [ ] Attachments uploaded before submit are bound to the created issue via
      `upload_token` (backend contract unchanged)
- [ ] Abandoning the create form (unmount without submit) still deletes pending
      attachments
- [ ] Edit form (`issue` prop provided) is unchanged in behavior — no
      `PendingAttachmentUploader`, no `upload_token` in PATCH payload
- [ ] `PendingAttachmentUploader` does NOT appear on the edit form at
      `[id]/page.tsx`
- [ ] Deep-path FSD violations fixed: `IssueProgressPage`, `IssuesTabsNav`
      accessible via `@/features/issues`

### Code quality

- [ ] `issue-create-page-client.tsx` is deleted
- [ ] `IssueForm` has no `onCreated` prop
- [ ] `IssueForm` has no `uploadToken` prop — generated internally via
      `useState(() => crypto.randomUUID())`
- [ ] `currentUser` prop in `IssueForm` typed as `UserBasicProps | null` from
      `@/entities/user`
- [ ] `IssueFormValues` stays in `issue-form.tsx` (not moved to
      `model/types.ts`)
- [ ] `index.ts` self-referential `../issues/` path fixed to `./`
- [ ] `loading.tsx` added to `app/dashboard/issues/(create)/create/`
- [ ] ESLint passes with no errors on changed files (`npm run lint`)
- [ ] Existing Jest tests pass (`npm test -- --passWithNoTests`)

---

## Implementation Order (safe sequence)

```
1. features/issues/model/types.ts
   - Confirm UserBasicProps is exported from entities/user/index.ts
     (add it if missing)

2. features/issues/ui/issue-form.tsx
   - Replace uploadToken prop with useState(() => crypto.randomUUID())
   - Gate PendingAttachmentUploader and cleanup useEffect on !issue
   - Remove onCreated prop and its call site
   - Fix createIssue success branch: result.data.id, not result.id
   - Fix isDirty guard: disabled={isPending || (!!issue && !isDirty) || hasPendingOps}
   - Remove filteredPersons no-op alias
   - Change currentUser type to UserBasicProps | null
   - Gate upload_token in payload: issue ? null : uploadToken

3. app/dashboard/issues/(create)/create/page.tsx
   - Import IssueForm from '@/features/issues' (not deep path)
   - Remove IssueCreatePageClient usage
   - Pass no uploadToken prop

4. features/issues/index.ts
   - Remove IssueCreatePageClient export (BEFORE deleting file)
   - Remove PendingAttachmentUploader export
   - Add IssueProgressPage, IssuesTabsNav exports
     (DO NOT add IssueProgressChart/KpiCards/WeeklySummary — internal only)
   - Fix self-referential '../issues/ui/tasks-kanban-client' → './ui/tasks-kanban-client'

5. features/issues/ui/issue-create-page-client.tsx
   - DELETE (only after steps 3+4 are clean)

6. app/dashboard/issues/(progress)/progress/page.tsx
   app/dashboard/today/progress/page.tsx
   app/dashboard/issues/(progress)/layout.tsx
   - Update deep-path imports to '@/features/issues'

7. app/dashboard/issues/(create)/create/loading.tsx
   - CREATE new file

8. Run: npm run lint:fix && npm run format && npm test
   Run: fsd-boundary-guard agent to verify no remaining violations

--- SEPARATE COMMIT ---

9. shared/lib/httpClient.ts
   - Add clearSession() before redirect() on 401

10. features/issues/api/issues.ts
    - Migrate 11 raw fetch calls to httpClient/httpClientList
    - See Phase 2 notes for non-trivial functions
    - Add revalidatePath to createIssue
```

---

## Files to Touch

| File                                                | Action                                                                                    | Phase |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----- |
| `features/issues/ui/issue-form.tsx`                 | Modify — internalize `uploadToken`, remove `onCreated`, fix `isDirty`, mode-gate uploader | 1     |
| `features/issues/ui/issue-create-page-client.tsx`   | **DELETE**                                                                                | 1     |
| `app/dashboard/issues/(create)/create/page.tsx`     | Modify — render `IssueForm` directly                                                      | 1     |
| `app/dashboard/issues/(create)/create/loading.tsx`  | **CREATE**                                                                                | 1     |
| `features/issues/index.ts`                          | Modify — remove dead exports, add missing ones, fix self-ref path                         | 1     |
| `app/dashboard/issues/(progress)/progress/page.tsx` | Modify — fix deep-path imports                                                            | 1     |
| `app/dashboard/today/progress/page.tsx`             | Modify — fix deep-path imports                                                            | 1     |
| `app/dashboard/issues/(progress)/layout.tsx`        | Modify — fix deep-path imports                                                            | 1     |
| `entities/user/index.ts`                            | Modify (if needed) — add `UserBasicProps` export                                          | 1     |
| `shared/lib/httpClient.ts`                          | Modify — add `clearSession()` on 401                                                      | 2     |
| `features/issues/api/issues.ts`                     | Modify — migrate 11 raw `fetch` to `httpClient`                                           | 2     |

---

## What NOT to touch

- `PendingAttachmentUploader` component itself — stays as-is, becomes a private
  internal component
- `IssueAttachments` — no change; it lives on the detail page and is the
  canonical post-create attachment UI
- All issue detail / list / kanban / progress pages — no behavioral change
- Backend API — no contract changes; `upload_token` flow is preserved
- `auth.ts` — legitimate exception to httpClient migration (auth calls need
  special cookie/timeout handling)

---

## References

- `features/issues/ui/issue-create-page-client.tsx` — 2-screen state machine
  being eliminated
- `features/issues/ui/issue-form.tsx:105-114` — cleanup `useEffect` (preserve,
  but mode-gate)
- `features/issues/ui/issue-form.tsx:232-236` — `onCreated` call site (replace
  with direct `router.push`)
- `features/issues/ui/issue-form.tsx:415` — `isDirty` guard (fix for create
  mode)
- `features/issues/ui/issue-form.tsx:153` — `filteredPersons` no-op alias
  (delete)
- `features/issues/api/issues.ts:124` — first raw `fetch` call (Phase 2)
- `features/issues/index.ts:44` — self-referential path to fix
- `entities/user/model/types.ts` — `UserBasicProps` (use instead of local
  `CurrentUser`)
- `CLAUDE.md` — API Layer Rules 1-7, Tab Navigation Convention (loading.tsx
  requirement)
- [tkdodo.eu — useState for one-time initializations](https://tkdodo.eu/blog/use-state-for-one-time-initializations)
- [React Compiler + useMemo stability — Daishi Kato newsletter, March 2025](https://newsletter.daishikato.com/p/using-useref-for-lazy-initialization-with-react-compiler)
