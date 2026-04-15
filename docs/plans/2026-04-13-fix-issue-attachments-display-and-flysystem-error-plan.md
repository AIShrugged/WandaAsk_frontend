---
title:
  Fix Issue Attachments — Remove Preview Toggle, Show Files Inline, Fix
  Flysystem file_size Error
type: fix
status: completed
date: 2026-04-13
---

# Fix Issue Attachments — Remove Preview Toggle, Show Files Inline, Fix Flysystem file_size Error

## Overview

Three related problems with the issue attachment system:

1. **UX: Preview is hidden behind a toggle button** — images, PDFs, audio,
   video, and text files are shown only after clicking "Preview". The
   requirement is to display the file content immediately (always-open inline
   display).
2. **UX: Attachment display when editing** — the attachment panel is only
   visible on the issue detail page. When a user opens an issue for editing (via
   `IssueForm`), attachments should also be visible and manageable.
3. **Backend: Flysystem `UnableToRetrieveMetadata` crash** — the download
   endpoint (`GET /v1/attachments/{id}/download`) calls
   `Storage::disk()->response()` which internally calls `fileSize()` on the
   file. If the file is missing from disk (e.g. orphan DB record, failed upload,
   wrong disk config), Flysystem throws
   `League\Flysystem\UnableToRetrieveMetadata`. This error propagates as a 500
   and crashes the request entirely — and it surfaces when the frontend tries to
   open or preview any attachment.

---

## Problem Statements

### 1. Preview Toggle UX

**Current flow:**

- Each attachment card has a "Preview" (Eye icon) button
- Clicking it toggles `previewAttachmentId` state
- `renderPreview()` is called inside the card JSX
- Preview appears/disappears inline

**Desired flow:**

- No toggle button
- For supported types (`image`, `pdf`, `audio`, `video`, `markdown`, `text`),
  the content is always rendered below the card header
- For `none` kind (unsupported file types), show only the "Open" link

### 2. Attachment Display on Issue Edit

**Current behavior:**

- `IssueForm` (`features/issues/ui/issue-form.tsx`) handles only metadata fields
- `IssueAttachments` is placed in a separate right-column card in the detail
  page (`app/dashboard/issues/[id]/page.tsx`)
- No attachment panel on the create page (`/dashboard/issues/create`)

**Gap:**

- When a user is in "edit mode" on an issue (inline editing within `IssueForm`),
  attachments are still visible in the right column — this part works fine
- The create page (`/dashboard/issues/create`) has no attachment UI — this is
  acceptable because the issue must exist before attachments can be linked

**Action:** Verify the current layout is actually broken during editing, or
confirm the issue is specifically about the visual separation between the form
and attachments panel.

### 3. Flysystem `UnableToRetrieveMetadata` on `file_size`

**Error:**

```
"message": "Unable to retrieve the file_size for file at location: issues/284/Po0QAwmvL3rrxKDf7CL2zwuA1YWW6Qg9y3SHcOiV.jpg"
"exception": "League\\Flysystem\\UnableToRetrieveMetadata"
"file": "/var/www/vendor/league/flysystem/src/UnableToRetrieveMetadata.php"
```

**Root cause:**

The download endpoint in `IssueAttachmentController::download()` calls:

```php
return Storage::disk($this->attachmentDisk())->response(
    $record->file_path,
    basename($record->file_path),
    [...]
);
```

`Storage::disk()->response()` uses Symfony's `StreamedResponse` which internally
calls Flysystem's `fileSize()` to set the `Content-Length` header. If the file
at `file_path` doesn't exist on the configured disk, Flysystem throws
`UnableToRetrieveMetadata`.

The frontend uses `file_url` from `IssueAttachmentResource` — this is a
temporary signed URL pointing to `route('attachments.download', ...)`. Every
"Open" click and every image/PDF/video/audio preview hits this endpoint.

**Triggers:**

- Orphaned DB records (file deleted from disk but record remains)
- Wrong disk configuration (`ISSUE_ATTACHMENTS_DISK` env var misconfigured
  between upload and download)
- File upload to S3/cloud succeeds but the configured download disk is `local`
  (or vice versa)
- Failed partial uploads that created a DB record without a real file

**Fix location:** `IssueAttachmentController::download()` in backend. Must add
file existence check before calling `response()` and return a proper 404 when
the file is missing.

---

## Technical Approach

### Frontend Changes

#### A. Remove preview toggle in `issue-attachments.tsx`

**File:** `features/issues/ui/issue-attachments.tsx`

1. Remove state:
   - `previewAttachmentId` (line 145)
   - `textPreviewCache` (line 148)
   - `textPreviewErrors` (line 151)
   - `loadingPreviewId` (line 154)
   - `previewAttachment` memo (line 156)

2. Remove the `useEffect` for fetching text/markdown content (lines 162–214) —
   replace with a simple `useEffect` per attachment card or a `useCallback`

3. Remove `renderPreview()` function — inline the rendering directly or keep it
   as a pure renderer (no toggle logic)

4. Remove Eye icon import and "Preview" / "Hide preview" button from each card

5. Always render the preview element below the card header for `kind !== 'none'`

6. For `markdown` and `text` kinds: the fetch must happen on mount rather than
   on button click. Use `useEffect` per-attachment-id, keyed on `attachment.id`,
   to fetch the text. Use `AbortController` for cleanup. Keep a local state map
   for loaded text.

   **Alternative (simpler):** Extract a child component
   `<TextAttachmentPreview url={url} kind={kind} />` with its own
   `useState`/`useEffect` — avoids the global cache state entirely.

#### B. Verify attachment display during issue editing

**File:** `app/dashboard/issues/[id]/page.tsx`

Current layout (right column):

```tsx
<Card>
  <IssueAttachments issueId={issueId} initialAttachments={attachments} />
</Card>
```

The attachment card is always visible alongside `IssueForm` in a two-column
grid. During editing, the form and the attachment panel are both on screen
simultaneously — this is the correct behavior. Confirm there is no bug here, or
identify the specific scenario where attachments disappear.

**If the issue is about the attachment panel not appearing during editing:**
Check if `IssueForm` conditionally hides the right column, or if the page layout
changes on mobile viewports.

#### C. API Server Actions — `original_name` field

**File:** `features/issues/api/issues.ts`

The `normalizeIssueAttachment` function (lines 51–78) constructs `url` from
`file_url`, `url`, or `file_path`. But `original_name` is not in the backend
`IssueAttachmentResource::toArray()` — only `id`, `file_path`, `file_url`,
`issue_id`, `uploaded_at` are returned.

The `attachmentLabel()` function falls back:
`original_name → file_name → name → Attachment #id`. Since none of
`original_name`, `file_name`, or `name` are returned by the backend, all
attachment labels will show as `Attachment #id`.

**Fix in backend (separate task):** Add `original_name` (or derive it from
`file_path`) to `IssueAttachmentResource::toArray()`.

**Fix in frontend (interim):** Derive display name from `file_path` if none of
the name fields are set:

```ts
function attachmentLabel(attachment: IssueAttachment) {
  return (
    attachment.original_name ??
    attachment.file_name ??
    attachment.name ??
    (attachment.file_path ? attachment.file_path.split('/').pop() : null) ??
    `Attachment #${attachment.id}`
  );
}
```

### Backend Changes

#### D. Fix `UnableToRetrieveMetadata` in `IssueAttachmentController::download()`

**File:** `app/Http/Controllers/API/v1/IssueAttachmentController.php`

Add existence check before streaming the file:

```php
public function download(int $attachment): StreamedResponse|ApiResponse
{
    $record = IssueAttachment::query()->findOrFail($attachment);
    $disk = $this->attachmentDisk();

    if (!Storage::disk($disk)->exists($record->file_path)) {
        abort(404, 'Attachment file not found');
    }

    return Storage::disk($disk)->response(
        $record->file_path,
        basename($record->file_path),
        ['Content-Disposition' => 'inline; filename="'.basename($record->file_path).'"']
    );
}
```

**Additional hardening in `store()`:** The `store()` method calls
`$request->file('file')->store(...)` — this can silently fail if the disk is
misconfigured (returns `false`). Add a check:

```php
$path = $request->file('file')->store("issues/{$task->id}", $disk);

if ($path === false) {
    return ApiResponse::error('Failed to store attachment', 500);
}
```

#### E. Backend: Add `original_name` to `IssueAttachmentResource`

**File:** `app/Http/Resources/API/v1/IssueAttachmentResource.php`

```php
return [
    'id' => $this->id,
    'file_path' => $this->file_path,
    'original_name' => $this->file_path ? basename($this->file_path) : null,
    'file_url' => URL::temporarySignedRoute(
        'attachments.download',
        now()->addMinutes(30),
        ['attachment' => $this->id],
    ),
    'issue_id' => $this->issue_id,
    'uploaded_at' => $this->uploaded_at,
];
```

Note: `basename()` returns the hashed filename from Flysystem (e.g.
`Po0QAwmvL3rrxKDf7CL2zwuA1YWW6Qg9y3SHcOiV.jpg`), not the user's original
filename. If original names should be preserved, a separate `original_name` DB
column is needed — that's a separate migration/task.

---

## Acceptance Criteria

- [x] Attachment cards in `IssueAttachments` always show the file content inline
      — no "Preview" / "Hide preview" toggle button
- [x] Images render as `<img>` immediately when the card appears
- [x] PDFs render as `<iframe>` immediately
- [x] Audio/video render with native player controls immediately
- [x] Markdown and text files begin fetching on mount; show a loading skeleton
      while fetching, then render content
- [x] For `kind === 'none'`, only the "Open" link is shown (no inline content,
      no toggle)
- [x] The "Open" link (external link icon) is still present for all attachment
      types
- [x] Attachment panel is visible on the issue detail page both when reading and
      when editing fields
- [x] `GET /v1/attachments/{id}/download` returns `404` (not 500) when the file
      is missing from disk
- [x] Uploading a file still works end-to-end
- [x] Deleting an attachment still works end-to-end
- [x] TypeScript `strict` — no new `any`, no new type errors
- [x] ESLint passes (`npm run lint`)

---

## Implementation Order

1. **Backend fix first** — `IssueAttachmentController::download()` existence
   check (D)
2. **Backend Resource** — add `original_name` derived from `file_path` (E)
3. **Frontend: Remove preview toggle** — refactor `issue-attachments.tsx` (A)
4. **Frontend: Label fallback** — derive name from `file_path` when
   `original_name` is absent (C)
5. **Frontend: Verify edit layout** — inspect the detail page layout during
   editing (B)

---

## References

### Internal Code Locations

| File                                                        | Line(s) | Purpose                                                                            |
| ----------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------- |
| `features/issues/ui/issue-attachments.tsx`                  | 61–126  | `getAttachmentPreviewKind()` — extension → kind mapping                            |
| `features/issues/ui/issue-attachments.tsx`                  | 140–469 | `IssueAttachments` component — full implementation                                 |
| `features/issues/ui/issue-attachments.tsx`                  | 145–160 | Preview-related state to remove                                                    |
| `features/issues/ui/issue-attachments.tsx`                  | 162–214 | `useEffect` fetching text/markdown for preview                                     |
| `features/issues/ui/issue-attachments.tsx`                  | 228–336 | `renderPreview()` function to transform                                            |
| `features/issues/api/issues.ts`                             | 51–78   | `normalizeIssueAttachment()` — URL resolution                                      |
| `features/issues/api/issues.ts`                             | 416–523 | Server actions: `getIssueAttachments`, `uploadIssueAttachment`, `deleteAttachment` |
| `features/issues/model/types.ts`                            | 82–94   | `IssueAttachment` interface                                                        |
| `app/dashboard/issues/[id]/page.tsx`                        | 40, 71  | Server page — fetches + renders `IssueAttachments`                                 |
| `app/Http/Controllers/API/v1/IssueAttachmentController.php` | 52–61   | `download()` — where the crash occurs                                              |
| `app/Http/Resources/API/v1/IssueAttachmentResource.php`     | 11–24   | `toArray()` — response fields                                                      |
| `app/Models/IssueAttachment.php`                            | 1–32    | Model — no `original_name` column                                                  |

### Related Issues

- Backend error originates in
  `vendor/league/flysystem/src/UnableToRetrieveMetadata.php:49`
- Frontend signed URL lifetime: 30 minutes — if a user leaves the page open,
  preview URLs may expire and images will stop rendering (separate
  consideration)
