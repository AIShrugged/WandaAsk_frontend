---
title: fix: Issues Edge Cases — Critical and High Severity
type: fix
status: completed
date: 2026-05-05
---

# fix: Issues Edge Cases — Critical and High Severity

## Overview

Comprehensive audit of `app/dashboard/issues` and `features/issues/` uncovered 25+ edge cases. This plan addresses the ones that cause **data loss, data corruption, security risk, or broken core flows**. Low-severity cosmetic issues are out of scope.

---

## Problem Areas and Edge Cases

### 🔴 Critical

#### C1 — `waiting_for_user` agent flow state has no UI
- `IssueAgentFlowStatus` includes `waiting_for_user`, which means the agent is paused waiting for user input.
- There is no component that renders an input form or triggers the `/api/v1/issues/:id/agent-flow/answer` endpoint.
- The user sees the agent stuck with no actionable path forward.

---

### 🟠 High Severity

#### H1 — `moveKanbanCard` PATCH omits critical fields (potential data loss)
- `moveKanbanCard` sends only: `name`, `description`, `type`, `status`, `organization_id`, `team_id`, `assignee_id`.
- Fields omitted: `due_date`, `priority`, `epic_id`, `author_id`, `upload_token`.
- **Must verify** against `IssueController::update` in the backend: if absent fields are nulled out (not treated as "do not change"), every drag-and-drop on the kanban silently destroys `due_date`, `priority`, and `epic_id`.
- File: `features/kanban/api/kanban.ts`

#### H2 — `review` and `reopen` issues invisible on kanban board
- `KANBAN_COLUMNS` in `features/kanban/model/types.ts` defines only 4 statuses: `open`, `in_progress`, `paused`, `done`.
- `IssueStatus` has 6 values: `open`, `in_progress`, `paused`, `review`, `reopen`, `done`.
- Issues with status `review` or `reopen` silently disappear from the board.
- **Question for stakeholders:** Are `review`/`reopen` intentionally not rendered, or is this an oversight?

#### H3 — Kanban 100-card hard limit silently truncates columns
- `buildKanbanQuery` hardcodes `limit: 100`.
- Orgs with >100 issues in any status see silently truncated columns with no warning.
- File: `features/kanban/api/kanban.ts`

#### H4 — `assignee_id` URL default overwrites an explicit "All" selection
- In `IssuesLayoutClient`, if `assignee_id` is absent from the URL, it is defaulted to `currentUserId`.
- When a user selects "All" in the dropdown, `assignee_id` is removed from the URL.
- On next page load or refresh, the default kicks in again, silently overwriting the user's choice.
- There is no way to encode "show all regardless of assignee" in a shareable URL.
- File: `features/issues/ui/issues-layout-client.tsx`

#### H5 — In-flight pagination chunk appended after filter change
- `useInfiniteScroll` does not cancel in-flight `loadIssuesChunk` requests when `initialItems` changes.
- If scroll fires a fetch, and a filter changes before the fetch resolves, the stale results are appended to the new list.
- This is a silent data corruption bug in the list view.
- Files: `features/issues/ui/issues-page.tsx`, `shared/hooks/use-infinite-scroll.ts`

#### H6 — No blocked extension or file size check before attachment upload
- `IssueAttachments` and `PendingAttachmentUploader` accept all files with no client-side filtering.
- Backend blocks `.php`, `.sh`, `.exe`, `.bat`, `.cmd` and enforces 10 MB limit.
- User must wait for the upload to complete before receiving rejection. For large files this is a poor UX.
- Files: `features/issues/ui/issue-attachments.tsx`, `features/issues/ui/pending-attachment-uploader.tsx`

#### H7 — Pending attachments orphaned if user navigates away before submitting
- On the create page, files uploaded via `PendingAttachmentUploader` are stored server-side under the upload token.
- If the user navigates away without submitting, these files remain on the server indefinitely.
- No `beforeunload` handler, no `useEffect` cleanup, no cleanup route call.
- File: `features/issues/ui/issue-create-page-client.tsx`

#### H8 — Delete issue has no confirmation dialog
- `IssueForm` calls `deleteIssue` immediately on button click inside `startTransition`.
- No confirmation modal or "Are you sure?" prompt. Deletion is permanent.
- File: `features/issues/ui/issue-form.tsx`

#### H9 — Assignee dropdown not scoped to selected organization
- `getPersons()` fetches all persons with no org filter.
- A user can assign an issue to a person from a different organization.
- The backend will reject with 422, but the UI allows selection with no warning.
- Files: `features/issues/api/issues.ts`, `features/issues/ui/issue-form.tsx`

#### H10 — Re-dispatch while agent is already running creates duplicate runs
- The Dispatch/Re-dispatch button is visible even when agent run is in `processing` status.
- There is no frontend guard checking current run status before permitting re-dispatch.
- File: `features/issues/ui/issue-linked-task.tsx`

---

### 🟡 Medium Severity (documented for prioritization)

#### M1 — Form: no client-side name length or required validation
- `name` field has no `maxLength` rule and no `required` rule in `react-hook-form`.
- A user can submit an empty name or a 256+ character name; 422 response only after server round-trip.
- `type` field is also not registered as required client-side.

#### M2 — Filter change silently resets `show_archived` to `false`
- Any call to `handleFiltersChange` hardcodes `show_archived: false`, collapsing the archived section.
- File: `features/issues/ui/issues-layout-client.tsx`

#### M3 — Out-of-scope issue shows error boundary instead of 404
- `getIssue` throws a generic `Error` on 403/404. Should call `notFound()` from `next/navigation`.
- File: `features/issues/api/issues.ts`

#### M4 — Comment: no 10,000 char limit client-side
- The `Textarea` for comments has no `maxLength` and no character counter.
- Backend enforces `max:10000`. User discovers limit only after submit.
- File: `features/issues/ui/issue-comments.tsx`

#### M5 — Attachment proxy route auth unknown
- `/api/attachment?id=...` proxies attachments through a Next.js API route.
- If the route does not forward auth tokens and enforce ownership, any user with an attachment ID can download files.
- File: `app/api/attachment/route.ts` — needs audit.

#### M6 — Pagination: silent failure on re-fetch error
- Filter-change re-fetch in `IssuesPage` has a `.catch(() => { /* silently fail */ })`.
- Stale data is shown with no error indicator when the network request fails.
- File: `features/issues/ui/issues-page.tsx`

#### M7 — Archived section cannot unarchive from list view
- `ArchivedSection` renders a read-only view. Users must navigate to the detail page to change status.
- An inline "Move to open" action would improve UX significantly.

---

## Acceptance Criteria

### Critical

- [ ] **C1**: When `agent_flow.status === 'waiting_for_user'`, the `IssueLinkedTask` or agent flow section renders a text input and a "Submit Answer" button. Submitting calls `POST /api/v1/issues/:id/agent-flow/answer` and refreshes the flow state.

### High

- [ ] **H1**: Verify `IssueController::update` handles partial PATCH correctly. If it nulls absent fields, `moveKanbanCard` must send the full issue payload (fetch current values first if needed). Add a note in `features/kanban/api/kanban.ts`.
- [ ] **H2**: Decision made and documented: either add `review` and `reopen` columns to `KANBAN_COLUMNS`, or add a visual indicator on the kanban that issues with those statuses are shown in a separate section.
- [ ] **H3**: Kanban column queries use `limit: 500` (or a sensible higher value) and show a banner if the count is truncated, OR implement column-level "Load more" pagination.
- [ ] **H4**: `assignee_id=` (empty string) is preserved in the URL as a distinct "All" state. The initialization logic in `IssuesLayoutClient` only applies the current-user default when `assignee_id` is truly absent AND no explicit empty-string signal is present. Refreshing after selecting "All" preserves the "All" selection.
- [ ] **H5**: `useInfiniteScroll` or the `IssuesPage` effect uses an abort controller or version token to discard results from stale in-flight requests when filters change.
- [ ] **H6**: `IssueAttachments` and `PendingAttachmentUploader` validate file extension and size before uploading. Blocked extensions show an inline error; oversized files show an inline size error. No server round-trip for these validations.
- [ ] **H7**: `IssueCreatePageClient` registers a cleanup effect that calls `deletePendingAttachment` for each uploaded pending attachment if the component unmounts without a successful `createIssue` call.
- [ ] **H8**: Clicking "Delete" in `IssueForm` opens a confirmation dialog (e.g., `AlertDialog` or existing modal primitive). Deletion only proceeds after explicit confirmation.
- [ ] **H9**: Persons shown in the assignee dropdown in `IssueForm` are filtered to match the selected `organization_id`. When org changes, the assignee list reloads and an invalid previous assignee selection is cleared.
- [ ] **H10**: The Dispatch/Re-dispatch button in `IssueLinkedTask` is disabled (or hidden) when agent run status is `queued` or `processing`. Tooltip or status label explains the agent is already running.

### Medium

- [ ] **M1**: `IssueForm` registers `name` with `{ required: 'Name is required', maxLength: { value: 255, message: 'Max 255 characters' } }`. `type` is registered with `{ required: 'Type is required' }`. Inline error messages appear below fields.
- [ ] **M3**: `getIssue` calls `notFound()` on 404 and 403 responses.
- [ ] **M5**: `app/api/attachment/route.ts` is audited to confirm it validates the session and enforces ownership before proxying the file.

---

## Technical Notes

### H1 — Backend PATCH behavior (verify first)
```bash
# Check IssueController::update in the backend
cat /Users/slavapopov/Documents/WandaAsk_backend/app/Http/Controllers/API/v1/IssueController.php | grep -A 40 'function update'
# Also check UpdateIssueRequest to see which fields are 'sometimes'
cat /Users/slavapopov/Documents/WandaAsk_backend/app/Http/Requests/API/v1/UpdateIssueRequest.php
```

### H4 — URL encoding "All" state
Two options:
1. Use sentinel value `assignee_id=all` — clear and explicit, requires changes to `IssuesLayoutClient` initialization and `SharedFiltersBar`
2. Use `assignee_id=0` as "All" sentinel — simpler but less readable

Recommended: option 1 (`assignee_id=all`), matching how `status=` empty vs `status=open` works.

### H5 — Stale pagination requests
Add an abort controller pattern:
```ts
// In IssuesPage filter-change effect
const controller = new AbortController();
loadIssuesChunk({ ...filters, signal: controller.signal })
  .then(setItems)
  .catch(() => {});
return () => controller.abort();
```
`loadIssuesChunk` must pass `signal` through to `fetch`.

### H7 — Pending attachment cleanup
```ts
// In IssueCreatePageClient
useEffect(() => {
  return () => {
    if (!isSubmitted) {
      pendingAttachments.forEach(att => deletePendingAttachment(att.id));
    }
  };
}, []);
```
Requires tracking `pendingAttachments` list and `isSubmitted` flag in state.

### C1 — Agent flow answer endpoint
```
POST /api/v1/issues/:id/agent-flow/answer
```
Payload: `{ answer: string }` — verify in backend `IssueController@agentFlowAnswer` or relevant controller.

---

## Files to Change

| File | Change |
|------|--------|
| `features/kanban/api/kanban.ts` | H1: verify + fix PATCH payload; H3: raise limit or add pagination |
| `features/kanban/model/types.ts` | H2: add/decide on `review`/`reopen` columns |
| `features/issues/ui/issues-layout-client.tsx` | H4: fix assignee "All" URL encoding; M2: preserve show_archived |
| `features/issues/ui/issues-page.tsx` | H5: abort stale fetches; M6: show error on re-fetch fail |
| `shared/hooks/use-infinite-scroll.ts` | H5: support cancellation |
| `features/issues/ui/issue-attachments.tsx` | H6: client-side extension + size validation |
| `features/issues/ui/pending-attachment-uploader.tsx` | H6: same; H7: expose attachment list for cleanup |
| `features/issues/ui/issue-create-page-client.tsx` | H7: cleanup effect |
| `features/issues/ui/issue-form.tsx` | H8: confirmation dialog; H9: scope assignee to org; M1: validation rules |
| `features/issues/ui/issue-linked-task.tsx` | H10: disable re-dispatch when running; C1: waiting_for_user UI |
| `features/issues/api/issues.ts` | M3: `notFound()` on 403/404 |
| `features/issues/ui/issue-comments.tsx` | M4: maxLength on textarea |
| `app/api/attachment/route.ts` | M5: audit auth |

---

## Out of Scope

- M7 (inline unarchive in list view) — UX improvement, not a bug
- Browser back/forward filter history (low risk, large scope)
- Progress stats org scoping (product decision)
- Critical path polling details — separate subsystem
- All low-severity cosmetic issues

---

## References

- Backend controller: `/Users/slavapopov/Documents/WandaAsk_backend/app/Http/Controllers/API/v1/IssueController.php`
- Backend request: `/Users/slavapopov/Documents/WandaAsk_backend/app/Http/Requests/API/v1/UpdateIssueRequest.php`
- Kanban queries: `features/kanban/api/kanban.ts`
- Filter context: `features/issues/ui/issues-layout-client.tsx`
- Agent flow answer route: `routes/api.php` — `issues.agent-flow.answer`
