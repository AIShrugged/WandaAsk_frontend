---
title:
  'fix: Issue attachments broken — expired signed URLs and missing create-page
  integration'
type: fix
status: active
date: 2026-04-14
---

# fix: Issue attachments broken — expired signed URLs + missing on create page

## Overview

Two distinct problems affect the `IssueAttachments` feature:

1. **Expired signed URL → "Attachment file not found"** —
   `IssueAttachmentResource` generates a 30-minute
   `URL::temporarySignedRoute(...)` for every attachment. When the frontend
   re-renders a cached/stale attachment list (e.g. after page revisit, SSR, or
   browser back-navigation), the signed URL has already expired. The Laravel
   `ValidateSignature` middleware rejects the request. The download controller
   never reaches the filesystem check and aborts with 404. The image `<img>` tag
   shows a broken icon because the URL returns a 404 JSON body instead of the
   binary file.

2. **Attachments missing from the create page** —
   `app/dashboard/issues/(create)/create/page.tsx` renders only `IssueForm`. The
   `IssueAttachments` component, which requires an existing `issueId`, is not
   mounted there. Users cannot attach files while creating an issue.

---

## Problem Analysis

### Why the "file not found" error is misleading

The actual error chain:

```
GET /api/attachments/8/download?expires=1776153771&signature=5e4ef...
→ ValidateSignature middleware checks: now() > expires → true → throws 403 "Invalid signature"
→ Handler rendering treats this as 404 (or the abort(404) is hit because ValidateSignature
  prevents reaching the controller body)
→ Response body: {"message": "Attachment file not found"}
→ <img src="...expired-url"> → receives 4xx body → broken image
```

> Note: the file itself exists on disk; the error is a URL expiry problem, not
> storage corruption.

### Root cause in the backend

`IssueAttachmentResource::toArray()` bakes in an expiry at API response time:

```php
// app/Http/Resources/API/v1/IssueAttachmentResource.php:17-21
'file_url' => URL::temporarySignedRoute(
    'attachments.download',
    now()->addMinutes(30),   // ← 30 minutes, then broken forever
    ['attachment' => $this->id],
),
```

When the frontend gets this response (SSR at page load), the URL is valid. If
the user leaves the page open, returns via back-navigation, or if Next.js caches
the Server Component response, the URL will be stale. Any `<img>`, `<a>`,
`<iframe>`, `<audio>`, or `<video>` tag pointing to the stale URL will fail.

### Why attachments cannot exist at create time

`IssueAttachments` requires `issueId: number` — a persisted issue's database ID.
On the create page, no issue exists yet. The solution is a **post-creation
redirect with attachment upload flow** (redirect to detail page after successful
create) — the create page itself does not need the attachment widget. However,
the create page should visually communicate that attachments can be added after
creation.

---

## Proposed Solution

### Strategy: Replace temporary signed URLs with permanent Sanctum-authenticated URLs

The current download endpoint uses `->middleware('signed')` instead of
`auth:sanctum`. The intent was to allow unauthenticated direct-link access via
signed URLs. However:

- Attachments are scoped to issues visible to the user — anonymous access is not
  a design goal
- Signed URLs expire, breaking all existing UI renderings after 30 minutes
- The frontend already sends `Authorization: Bearer <token>` on all requests via
  `httpClient`

**Fix**: Add an authenticated download route protected by Sanctum (no expiry),
keep the signed route for external/email share links (optional, longer TTL), and
update the Resource to return the permanent URL by default.

---

## Backend Changes

### 1. Add authenticated download route

**File:** `routes/api.php`

Inside the `auth:sanctum` middleware group, add:

```php
// Inside the authenticated group (same block as issues.attachments.index)
Route::get('attachments/{attachment}/download', [IssueAttachmentController::class, 'download'])
    ->name('attachments.download.auth');
```

Keep the existing `signed` route as `attachments.download` for backward compat /
share links.

### 2. Add ownership check to authenticated download

**File:** `app/Http/Controllers/API/v1/IssueAttachmentController.php`

Add a second `download` method variant, or change the existing one to accept an
optional user:

```php
public function downloadAuthenticated(Request $request, int $attachment): StreamedResponse
{
    $record = IssueAttachment::query()
        ->whereHas('issue', fn ($query) => $query->visibleTo($request->user()))
        ->findOrFail($attachment);

    $disk = $this->attachmentDisk();

    if (!Storage::disk($disk)->exists($record->file_path)) {
        abort(404, 'Attachment file not found');
    }

    return Storage::disk($disk)->response(
        $record->file_path,
        basename($record->file_path),
        ['Content-Disposition' => 'inline; filename="' . basename($record->file_path) . '"']
    );
}
```

This adds visibility scoping: users can only download attachments for issues
they can see.

### 3. Update Resource to return permanent authenticated URL

**File:** `app/Http/Resources/API/v1/IssueAttachmentResource.php`

```php
public function toArray(Request $request): array
{
    return [
        'id'            => $this->id,
        'file_path'     => $this->file_path,
        'original_name' => $this->file_path ? basename($this->file_path) : null,
        'file_url'      => route('attachments.download.auth', ['attachment' => $this->id]),
        'issue_id'      => $this->issue_id,
        'uploaded_at'   => $this->uploaded_at,
    ];
}
```

No expiry. Access is controlled by `auth:sanctum` middleware on the route.

> **Optional**: Keep `share_url` as the temporary signed URL for email/external
> sharing (30 min or longer, e.g. 7 days), add it as a separate field if needed
> later.

---

## Frontend Changes

### 4. Fix `normalizeIssueAttachment` to use `file_url` directly

**File:** `features/issues/api/issues.ts` — `normalizeIssueAttachment` function

Currently, `url` is set from a fallback chain:
`file_url → attachment.url → constructed from FILES_URL`. With the permanent
URL, `file_url` will always be present and valid. No change needed to the
normalization itself — it already prefers `file_url` first:

```ts
// Already correct priority — file_url is used first
url: item.file_url ?? item.url ?? constructedUrl ?? null,
```

Verify this is the case when reading the current code. If `file_url` is being
overwritten or ignored, fix the priority.

### 5. Fix attachment API calls to use `httpClient` (CLAUDE.md compliance)

**File:** `features/issues/api/issues.ts`

The three attachment server actions use raw `fetch`. Migrate to
`httpClient`/`httpClientList`:

```ts
// getIssueAttachments — use httpClientList
export async function getIssueAttachments(
  issueId: number,
): Promise<IssueAttachment[]> {
  const result = await httpClientList<IssueAttachmentApiResource>(
    `${API_URL}/issues/${issueId}/attachments`,
  );
  return result.items.map(normalizeIssueAttachment);
}

// uploadIssueAttachment — use httpClient with FormData
// Note: do NOT set Content-Type — let the browser set multipart boundary
export async function uploadIssueAttachment(
  issueId: number,
  formData: FormData,
): Promise<ActionResult<IssueAttachment>> {
  try {
    const { data } = await httpClient<IssueAttachmentApiResource>(
      `${API_URL}/issues/${issueId}/attachments`,
      { method: 'POST', body: formData },
    );
    if (!data) return { data: null, error: 'Upload failed' };
    return { data: normalizeIssueAttachment(data), error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(error.responseBody ?? '', 'Upload failed');
      return {
        data: null,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      };
    }
    throw error;
  }
}

// deleteAttachment — use httpClient
export async function deleteAttachment(
  attachmentId: number,
): Promise<ActionResult<null>> {
  try {
    await httpClient(`${API_URL}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
    return { data: null, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(error.responseBody ?? '', 'Delete failed');
      return { data: null, error: parsed.message, fieldErrors: null };
    }
    throw error;
  }
}
```

### 6. Update `IssueAttachments` to use the new `ActionResult<T>` shape

**File:** `features/issues/ui/issue-attachments.tsx`

The component checks `'error' in result` (line 315). After migrating to
`ActionResult<T>`, change to:

```ts
if (result.error) {
  toast.error(result.error);
  return;
}
toast.success('Attachment uploaded');
await refresh();
```

Similarly for deleteAttachment:

```ts
const result = await deleteAttachment(attachment.id);
if (result.error) {
  toast.error(result.error);
  return;
}
toast.success('Attachment deleted');
await refresh();
```

### 7. Fix broken-image state in `AttachmentInlinePreview`

**File:** `features/issues/ui/issue-attachments.tsx` — `AttachmentInlinePreview`
component

Currently, when `<img src={url}>` receives a 4xx/5xx, it silently shows a broken
icon. Add error handling with a fallback state:

```tsx
function AttachmentInlinePreview({ attachment }: AttachmentInlinePreviewProps) {
  const [imgError, setImgError] = useState(false);
  const url = attachmentUrl(attachment);
  const kind = getAttachmentPreviewKind(attachment);

  if (!url || kind === 'none') return null;

  if (kind === 'image') {
    if (imgError) {
      return (
        <div className='flex items-center gap-2 rounded-[var(--radius-card)] border border-border bg-background/30 p-3 text-sm text-muted-foreground'>
          <Paperclip className='h-4 w-4' />
          Preview unavailable — open the file to view it.
        </div>
      );
    }
    return (
      <div className='overflow-hidden rounded-[var(--radius-card)] border border-border bg-black/10'>
        <img
          src={url}
          alt={attachmentLabel(attachment)}
          className='max-h-[420px] w-full object-contain'
          onError={() => setImgError(true)}
        />
      </div>
    );
  }
  // ... rest of preview kinds
}
```

### 8. Add post-creation redirect to issue detail page (attachment flow)

**File:** `features/issues/api/issues.ts` — `createIssue` (or similar mutation)
**File:** `features/issues/ui/issue-form.tsx`

After a successful issue creation, redirect to
`ROUTES.DASHBOARD.ISSUE_DETAIL(id)` so the user lands on the detail page where
`IssueAttachments` is available. This gives a natural "create then attach" UX
without needing to embed attachment upload in the create flow.

Add a visual hint on the create page:

**File:** `app/dashboard/issues/(create)/create/page.tsx`

```tsx
// After IssueForm, add a subtle hint
<p className='mt-4 text-sm text-muted-foreground'>
  You can add attachments after saving the task.
</p>
```

### 9. Export `IssueAttachments` through `index.ts` (FSD compliance)

**File:** `features/issues/index.ts`

Add:

```ts
export { IssueAttachments } from './ui/issue-attachments';
```

Update the import in `app/dashboard/issues/[id]/page.tsx` from:

```ts
import { IssueAttachments } from '@/features/issues/ui/issue-attachments'; // ❌ deep path
```

to:

```ts
import { IssueAttachments } from '@/features/issues'; // ✅ public API
```

---

## File Checklist

### Backend files to modify

| File                                                        | Change                                                                                                |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `routes/api.php`                                            | Add `attachments/{attachment}/download` inside `auth:sanctum` group, name `attachments.download.auth` |
| `app/Http/Controllers/API/v1/IssueAttachmentController.php` | Add `downloadAuthenticated()` method with `visibleTo` scope                                           |
| `app/Http/Resources/API/v1/IssueAttachmentResource.php`     | Change `file_url` from `temporarySignedRoute` to `route('attachments.download.auth', ...)`            |

### Frontend files to modify

| File                                            | Change                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------- |
| `features/issues/api/issues.ts`                 | Migrate 3 attachment actions from raw `fetch` to `httpClient`/`httpClientList`  |
| `features/issues/ui/issue-attachments.tsx`      | Update error handling for `ActionResult<T>`, add `onError` fallback for `<img>` |
| `features/issues/index.ts`                      | Export `IssueAttachments`                                                       |
| `app/dashboard/issues/[id]/page.tsx`            | Update import to use public `index.ts` API                                      |
| `app/dashboard/issues/(create)/create/page.tsx` | Add "attachments available after save" hint                                     |

---

## Acceptance Criteria

- [ ] Uploading an attachment on the issue detail page works without errors
- [ ] Opening an attachment uploaded more than 30 minutes ago works (no "file
      not found")
- [ ] Images render inline without broken-image icons, even after URL expiry
- [ ] Broken `<img>` shows a graceful fallback message instead of a broken icon
- [ ] Deleting an attachment removes it from the list
- [ ] All three attachment server actions use `httpClient`/`httpClientList` (no
      raw `fetch`)
- [ ] `IssueAttachments` is exported from `features/issues/index.ts`
- [ ] Create page shows a hint: "Attachments can be added after saving"
- [ ] After creating an issue, user is redirected to the detail page (if not
      already the case)
- [ ] No TypeScript errors (`npm run build` passes)
- [ ] No ESLint errors (`npm run lint` passes)

## Non-Functional Requirements

- [ ] Attachment download is gated by `auth:sanctum` — unauthenticated requests
      return 401
- [ ] Attachment download is scoped by `visibleTo($user)` — users cannot
      download attachments for issues they cannot see
- [ ] No secrets or tokens are embedded in any URL returned to the client

---

## Risk Analysis

| Risk                                                                                  | Severity | Mitigation                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing signed URLs cached/bookmarked by users will break                            | Low      | They were already broken after 30 min — this is not a regression                                                                                                                                                 |
| `attachments.download` (signed) route is still used by old email notifications        | Medium   | Keep the signed route, do not remove it. Only the Resource stops generating it by default                                                                                                                        |
| `httpClient` does not support `FormData` body (multipart upload)                      | Low      | `httpClient` passes `body` directly to `fetch` — FormData works as-is; only `Content-Type` must not be set manually                                                                                              |
| S3/MinIO storage for production — `Storage::disk()->response()` may not work directly | Medium   | Check `ISSUE_ATTACHMENTS_DISK` env in production. For S3, use `Storage::disk()->temporaryUrl()` with a long TTL (e.g. 24h) inside the authenticated controller — wrap in server action that proxies or redirects |

---

## References

### Internal

- `features/issues/ui/issue-attachments.tsx:272` — `IssueAttachments` component
- `features/issues/api/issues.ts` — attachment server actions (raw fetch, needs
  migration)
- `features/issues/model/types.ts:82-94` — `IssueAttachment` interface
- `app/dashboard/issues/[id]/page.tsx` — where `IssueAttachments` is currently
  mounted
- `app/dashboard/issues/(create)/create/page.tsx` — create page missing
  attachments
- `shared/lib/httpClient.ts` — `httpClient` and `httpClientList` to use
- `shared/types/server-action.ts` — `ActionResult<T>` return type

### Backend

- `app/Http/Controllers/API/v1/IssueAttachmentController.php:56-70` —
  `download()` method
- `app/Http/Resources/API/v1/IssueAttachmentResource.php:17-21` — expiring
  signed URL
- `routes/api.php:82-84` — signed download route (outside auth:sanctum)
- `app/Models/IssueAttachment.php` — `CREATED_AT = 'uploaded_at'`
- `config/filesystems.php:18` — `issue_attachments_disk` config

### Laravel Docs

- [`URL::temporarySignedRoute`](https://laravel.com/docs/11.x/urls#signed-urls)
  — signed URL generation
- [`ValidateSignature` middleware](https://laravel.com/docs/11.x/urls#validating-signed-route-requests)
  — signature validation behavior
