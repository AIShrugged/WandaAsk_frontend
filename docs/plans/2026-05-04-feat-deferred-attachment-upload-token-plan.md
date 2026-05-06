---
title: 'feat: Deferred Attachment Binding via upload_token'
type: feat
status: active
date: 2026-05-04
deepened: 2026-05-04
---

# Deferred Attachment Binding via upload_token

## Enhancement Summary

**Deepened on:** 2026-05-04 **Review agents run:** DHH Rails reviewer, Frontend
Races reviewer, TypeScript reviewer, Data Migration Expert, Data Integrity
Guardian, Security Sentinel, Architecture Strategist, Performance Oracle,
Deployment Verification, Best Practices Researcher

### Key Improvements Over Original Plan

1. **Critical: `uploadOrphanAttachment` cannot be a Server Action** — `File`
   objects are not serializable across the Next.js Server/Client boundary. Must
   be a plain async client-side function calling the API directly.
2. **Critical: Replace `uploadingCount: number` with
   `pendingOperations: Set<string>`** — the counter can go stale on error paths;
   a Set is structurally immune to going negative and must cover both uploads
   AND deletes.
3. **Critical: Migration safety** — two `Schema::table` calls must be merged
   into one; `uploaded_at` index must be verified to exist; nullable FK change
   may require pt-online-schema-change on MySQL < 8.0.
4. **High: Authorization belongs in a Policy, not `abort_unless`** —
   `IssueAttachmentPolicy::deleteOrphan()` is the idiomatic Laravel pattern.
5. **High: Extract `ORPHAN_TTL_HOURS` constant** — used in both the model scope
   and the prune command; a magic `25` in a query scope is a maintenance trap.
6. **High: Delete-in-flight + submit race** — submit must be disabled while any
   delete is in progress, not just uploads.
7. **High: Stale refresh race in existing `IssueAttachments`** — concurrent
   refresh calls can restore deleted attachments; add an abort guard.
8. **Medium: `useMemo` instead of `useRef` for token generation** — same
   semantics, clearer intent.
9. **Medium: Rename `/orphan` → `/pending`** — "orphan" is an internal
   implementation concept; `pending` is the clearer public-facing name.
10. **Medium: Merge two Schema::table calls** — reduces lock window and
    round-trips on production DB.

---

## Overview

Unified attachment UX for issue create and edit forms. Today the create flow is
a mandatory two-step sequence: submit the issue first, then upload attachments
on the second screen. The edit form allows inline uploads. This divergence
creates friction and inconsistent UX.

The solution introduces an `upload_token` (UUID v4) generated on the frontend
when the create form mounts. Files are uploaded with this token before the issue
exists. When the issue is submitted, the backend binds all orphan attachments
matching that token to the newly-created issue — atomically, inside a
transaction. The edit form is unchanged; it continues to upload directly to the
existing issue endpoint.

---

## Design Decisions

### One token per form session (not per file)

All files uploaded during a single create session share one UUID. The
`POST /api/v1/issues` payload sends `upload_token: string | null`. The backend
runs:

```sql
UPDATE issue_attachments
SET issue_id = :newIssueId, upload_token = NULL
WHERE upload_token = :token
  AND issue_id IS NULL
  AND uploaded_by_user_id = :currentUserId
  AND uploaded_at >= NOW() - INTERVAL 24 HOUR
```

**Why one token, not one per file:** Simpler client state (a single `useMemo`
value), simpler payload (`upload_token: string`), simpler backend binding query.
Per-file tokens add no security benefit since authorization is enforced via
`uploaded_by_user_id`, not token secrecy.

### Authorization model for orphan uploads

The new upload endpoint is auth-guarded. At upload time the backend stores
`uploaded_by_user_id = $request->user()->id`. At binding time it filters by
`uploaded_by_user_id = authenticated_user_id`. This prevents cross-user token
injection even if an attacker knows the victim's UUID.

Authorization for delete is in `IssueAttachmentPolicy::deleteOrphan()` — not
inline `abort_unless` (which belongs in business logic, not the controller).

### Atomicity

`IssueController::store` wraps issue creation + attachment binding in a single
`DB::transaction()`. `$userId` is extracted **before** the closure (don't pass
`$request` into a transaction closure — it holds a large object graph for the
lock duration). If binding throws, the issue is rolled back.

### Cleanup race condition prevention

The cleanup job uses `lockForUpdate()` to lock candidate rows before deleting
files and records. This prevents the TOCTOU gap where a cleanup SELECT and a
binding UPDATE race on the same row.

The binding scope filters `uploaded_at >= NOW() - INTERVAL 24 HOUR` (matching
the cleanup TTL exactly — the 1-hour safety margin in the original plan was
unnecessarily complex). The `lockForUpdate` in the cleanup job already prevents
the race; the window guard is redundant and was simplified.

### TTL constant in one place

`IssueAttachment::ORPHAN_TTL_HOURS = 24` is the single source of truth used by
both `scopePending()` and `PruneOrphanAttachments`.

### Submit button disabled while any operation is in-flight

The frontend tracks all in-flight operations (uploads AND deletes) in a
`Set<string>`. The "Create task" button is disabled while the Set is non-empty.
This is structurally immune to going negative and covers the delete-in-flight +
submit race.

### `uploadOrphanAttachment` is NOT a Server Action

`File` is not serializable across the Next.js Server/Client boundary. The upload
function must be a plain `async` client-side function that calls the API
directly using `fetch` with auth headers. It follows the same safe JSON-parsing
pattern documented in
`docs/solutions/integration-issues/server-action-html-response-json-parse.md` —
use `httpClient` from `shared/lib/httpClient` which already handles this
correctly.

`deleteOrphanAttachment` can be a Server Action since it only takes a `number`
(serializable). But for consistency in the same file, both can be plain async
functions called from the client component directly.

### Orphan deletion before form submit

A `DELETE /api/v1/attachments/pending/:id` endpoint allows removing a queued
file before submit. The submit button is blocked while any delete is in-progress
(via the pending operations Set).

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│  Browser (Create form)                               │
│                                                      │
│  mount → generate upload_token (UUID, useMemo)       │
│                                                      │
│  pick file → POST /api/v1/attachments/pending        │
│   (direct fetch, NOT Server Action)                  │
│              { file, upload_token }                  │
│              ← { id, original_name, upload_token }   │
│                                                      │
│  submit → Server Action → POST /api/v1/issues        │
│           { ...fields, upload_token }                │
│           ← { id, name, ..., attachments: [...] }    │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Browser (Edit form)                                 │
│  pick file → POST /api/v1/issues/:id/attachments     │
│              (unchanged)                             │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Cleanup Job (hourly via Laravel scheduler)          │
│  SELECT ... FOR UPDATE SKIP LOCKED                   │
│  WHERE issue_id IS NULL                              │
│    AND uploaded_at < NOW() - INTERVAL 24 HOUR        │
│  → delete files from storage (with error logging)    │
│  → delete DB rows                                    │
└──────────────────────────────────────────────────────┘
```

---

## Database Changes (Backend)

### New migration: `2026_05_04_000000_extend_issue_attachments_for_upload_token.php`

> **Pre-flight:** Before running in production, verify:
>
> 1. `SHOW COLUMNS FROM issue_attachments LIKE 'uploaded_at';` — must exist
> 2. MySQL/MariaDB version — if < 8.0, the nullable FK change may require
>    `pt-online-schema-change`
> 3. Run
>    `EXPLAIN ALTER TABLE issue_attachments MODIFY COLUMN issue_id BIGINT UNSIGNED NULL;`
>    on staging and check for `algorithm=copy`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Single ALTER TABLE call — minimizes lock window and round-trips
        Schema::table('issue_attachments', function (Blueprint $table) {
            // Make nullable to allow pre-creation orphan uploads.
            // Existing rows all have a non-null issue_id — no backfill needed.
            // WARNING: On MySQL < 8.0 with FK constraints, this may cause a
            // full table lock. Verify INSTANT DDL eligibility on staging first.
            $table->foreignId('issue_id')->nullable()->change();

            // Groups all files uploaded in one create-form session
            $table->string('upload_token', 64)->nullable()->after('issue_id');

            // Owner of the pending upload — verified at bind time for authorization
            $table->foreignId('uploaded_by_user_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete()  // if user deleted, cleanup job collects orphans
                  ->after('upload_token');

            // Fast orphan lookup: WHERE upload_token = ? AND uploaded_by_user_id = ?
            $table->index(['upload_token', 'uploaded_by_user_id'], 'ia_token_user_idx');

            // Fast cleanup sweep: WHERE issue_id IS NULL AND uploaded_at < cutoff
            // Note: uploaded_at column must already exist (confirmed pre-flight)
            $table->index(['issue_id', 'uploaded_at'], 'ia_issue_uploaded_at_idx');
        });
    }

    public function down(): void
    {
        Schema::table('issue_attachments', function (Blueprint $table) {
            $table->dropIndex('ia_token_user_idx');
            $table->dropIndex('ia_issue_uploaded_at_idx');
            $table->dropColumn(['upload_token', 'uploaded_by_user_id']);
            // NOTE: issue_id NOT NULL constraint is NOT restored here.
            // If any orphan rows were written during this migration's lifetime,
            // restoring NOT NULL requires a manual DELETE of orphans first:
            //   DELETE FROM issue_attachments WHERE issue_id IS NULL;
            //   ALTER TABLE issue_attachments MODIFY COLUMN issue_id BIGINT UNSIGNED NOT NULL;
        });
    }
};
```

**Index change from original plan:** replaced single `(uploaded_at)` index with
composite `(issue_id, uploaded_at)`. The cleanup job queries
`WHERE issue_id IS NULL AND uploaded_at < ?`. A composite index with `issue_id`
first lets MySQL use the index for the NULL filter and then the date range —
more selective than a bare date index.

**Why `varchar(64)` not `uuid` type:** MySQL's UUID column type is not
universally available; `varchar(64)` is portable and indexed efficiently. UUID
v4 is always 36 chars so there is no wasted storage.

---

## Backend Changes

### 1. `IssueAttachment` model

**File:** `app/Models/IssueAttachment.php`

```php
// TTL constant — single source of truth for both scope and prune command
public const ORPHAN_TTL_HOURS = 24;

// Add to $casts
protected $casts = [
    'uploaded_at'         => 'datetime',
    'uploaded_by_user_id' => 'integer',
];

// Relation to uploader
public function uploadedBy(): BelongsTo
{
    return $this->belongsTo(User::class, 'uploaded_by_user_id');
}

// Scope for pending (unbound) attachments belonging to this user+token.
// Uses ORPHAN_TTL_HOURS so the window matches the cleanup job exactly.
public function scopePending(Builder $query, string $token, int $userId): Builder
{
    return $query
        ->whereNull('issue_id')
        ->where('upload_token', $token)
        ->where('uploaded_by_user_id', $userId)
        ->where('uploaded_at', '>=', now()->subHours(self::ORPHAN_TTL_HOURS));
}
```

**Note on scope name:** renamed from `scopeOrphanFor` → `scopePending` to match
the public-facing endpoint name (`pending`) and to better describe the state
from the user's perspective.

### 2. `IssueAttachmentPolicy` — authorization for orphan/pending delete

**File:** `app/Policies/IssueAttachmentPolicy.php`

```php
<?php

namespace App\Policies;

use App\Models\IssueAttachment;
use App\Models\User;

class IssueAttachmentPolicy
{
    /**
     * Authorize deletion of a pending (unbound) attachment.
     * Only the uploader can delete their own pending files.
     */
    public function deletePending(User $user, IssueAttachment $attachment): bool
    {
        return $attachment->issue_id === null
            && $attachment->uploaded_by_user_id === $user->id;
    }
}
```

Register in `AuthServiceProvider::policies()`:

```php
IssueAttachment::class => IssueAttachmentPolicy::class,
```

### 3. New routes

**File:** `routes/api.php`

```php
// Inside the authenticated middleware group.
// Place BEFORE the public download route to prevent early matching.
Route::post('/attachments/pending', [IssueAttachmentController::class, 'storePending'])
     ->middleware('throttle:30,1')  // 30 uploads/min per user — storage abuse protection
     ->name('attachments.pending.store');

Route::delete('/attachments/pending/{attachment}', [IssueAttachmentController::class, 'destroyPending'])
     ->name('attachments.pending.destroy');
```

**Naming rationale:** `pending` communicates the lifecycle state to API
consumers; `orphan` is an internal implementation detail. The URL is
public-facing.

### 4. `IssueAttachmentController` — new methods

**File:** `app/Http/Controllers/API/v1/IssueAttachmentController.php`

```php
/**
 * Upload a file before the issue exists (pending/pre-creation upload).
 * File is stored with upload_token; bound to an issue on IssueController::store.
 */
public function storePending(StoreOrphanAttachmentRequest $request): JsonResponse
{
    $token = $request->input('upload_token');
    $file  = $request->file('file');

    $path = $file->store(
        "attachments/pending/{$token}",
        config('filesystems.issue_attachments_disk'),
    );

    $attachment = IssueAttachment::create([
        'file_path'           => $path,
        'issue_id'            => null,
        'upload_token'        => $token,
        'uploaded_by_user_id' => $request->user()->id,
        'uploaded_at'         => now(),
    ]);

    return response()->json([
        'success' => true,
        'data'    => IssueAttachmentResource::make($attachment),
        'message' => 'File uploaded',
        'status'  => 201,
        'meta'    => [],
    ], 201);
}

/**
 * Delete a pending attachment (not yet bound to any issue).
 * Authorization via IssueAttachmentPolicy::deletePending.
 */
public function destroyPending(IssueAttachment $attachment): JsonResponse
{
    $this->authorize('deletePending', $attachment);

    Storage::disk(config('filesystems.issue_attachments_disk'))
           ->delete($attachment->file_path);

    $attachment->delete();

    return response()->json([
        'success' => true,
        'data'    => null,
        'message' => 'Attachment deleted',
        'status'  => 200,
        'meta'    => [],
    ]);
}
```

**Why no `Request $request` in `destroyPending`?** Policy authorization via
`$this->authorize()` uses the authenticated user from the request context
automatically — injecting `$request` just for `->user()` is unnecessary.

**Security note on MIME types:** The current
`'file' => ['required', 'file', 'max:10240']` rule has no MIME restriction.
Consider adding
`'mimes:jpg,jpeg,png,gif,webp,pdf,txt,csv,doc,docx,xls,xlsx,zip'` or equivalent.
Without it, executable files (`.php`, `.exe`, `.sh`) can be uploaded. Since the
download route serves files directly, a malicious PHP file stored on a local
disk and served through a PHP web server could be executed. **At minimum, block
PHP extensions** — add `'not_regex:/\.php\d?$/i'` to the file validation rules.

### 5. `StoreOrphanAttachmentRequest`

**File:** `app/Http/Requests/API/v1/StoreOrphanAttachmentRequest.php`

```php
<?php

namespace App\Http\Requests\API\v1;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrphanAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'max:10240',
                // Block server-executable extensions — critical security requirement
                'not_regex:/\.(php\d?|phtml|phar|htaccess|sh|bash|exe|bat|cmd)$/i',
            ],
            'upload_token' => [
                'required',
                'string',
                // Strict UUID v4 format — blocks arbitrary string probing
                'regex:/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
            ],
        ];
    }
}
```

### 6. `IssueController::store` — binding logic

**File:** `app/Http/Controllers/API/v1/IssueController.php`

```php
public function store(IssueRequest $request): JsonResponse
{
    $validated = $request->validated();
    $token     = $validated['upload_token'] ?? null;

    // Extract scalar before transaction — avoids capturing full $request object
    // in the closure (large memory footprint held for the lock duration)
    $userId = $request->user()->id;

    $issue = DB::transaction(function () use ($validated, $token, $userId) {
        $issue = Issue::create(/* ...existing fields from $validated... */);

        if ($token !== null) {
            // Bind all pending files owned by this user with this token.
            // lockForUpdate in the cleanup job prevents concurrent deletion
            // of these rows during the UPDATE.
            IssueAttachment::pending($token, $userId)
                ->update([
                    'issue_id'     => $issue->id,
                    'upload_token' => null,  // clear after binding — no token leakage
                ]);
        }

        return $issue;
    });

    // Load attachments so client gets them in the create response —
    // prevents the empty-state flash on the post-create screen
    $issue->load('attachments');

    return response()->json([
        'success' => true,
        'data'    => IssueResource::make($issue),
        'message' => 'Issue created',
        'status'  => 201,
        'meta'    => [],
    ], 201);
}
```

### 7. `IssueRequest` — add `upload_token` validation

**File:** `app/Http/Requests/API/v1/IssueRequest.php`

```php
// Add to the 'issues.store' rules block:
'upload_token' => [
    'nullable',
    'string',
    'regex:/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
],
```

### 8. `IssueResource` — include attachments (lazy-loaded only)

**File:** `app/Http/Resources/API/v1/IssueResource.php`

```php
// Add to toArray():
'attachments' => IssueAttachmentResource::collection($this->whenLoaded('attachments')),
```

`whenLoaded` ensures this field is absent when `load('attachments')` was not
called — list endpoints remain N+1 free.

### 9. `IssueAttachmentResource` — expose `upload_token`

**File:** `app/Http/Resources/API/v1/IssueAttachmentResource.php`

```php
// Add to toArray():
'upload_token' => $this->upload_token,  // null after binding; present during pending phase
```

### 10. Cleanup job

**File:** `app/Console/Commands/PruneOrphanAttachments.php`

```php
<?php

namespace App\Console\Commands;

use App\Models\IssueAttachment;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PruneOrphanAttachments extends Command
{
    protected $signature   = 'attachments:prune-orphans {--hours= : Override TTL in hours (default: IssueAttachment::ORPHAN_TTL_HOURS)}';
    protected $description = 'Delete pending issue attachments that were never bound to an issue.';

    public function handle(): int
    {
        $hours  = (int) ($this->option('hours') ?? IssueAttachment::ORPHAN_TTL_HOURS);
        $cutoff = now()->subHours($hours);
        $disk   = config('filesystems.issue_attachments_disk');
        $deleted = 0;

        // Process in chunks to avoid memory exhaustion on large sets.
        // lockForUpdate() here is critical: it prevents a concurrent
        // IssueController::store binding UPDATE from racing with our DELETE.
        // Without this lock, the sequence (cleanup SELECTs row) → (store binds row)
        // → (cleanup DELETEs file) would leave a DB row pointing to a missing file.
        DB::transaction(function () use ($cutoff, $disk, &$deleted) {
            IssueAttachment::query()
                ->whereNull('issue_id')
                ->where('uploaded_at', '<', $cutoff)
                ->lockForUpdate()
                ->chunkById(100, function ($orphans) use ($disk, &$deleted) {
                    foreach ($orphans as $orphan) {
                        try {
                            Storage::disk($disk)->delete($orphan->file_path);
                        } catch (\Throwable $e) {
                            // File missing from storage is acceptable — always delete the DB row
                            // to prevent perpetual re-queuing of unresolvable orphans.
                            Log::warning('PruneOrphanAttachments: file not found on disk', [
                                'attachment_id' => $orphan->id,
                                'file_path'     => $orphan->file_path,
                                'error'         => $e->getMessage(),
                            ]);
                        }

                        $orphan->delete();
                        $deleted++;
                    }
                });
        });

        $this->info("Pruned {$deleted} pending attachment(s) older than {$hours} hours.");
        return Command::SUCCESS;
    }
}
```

**Register in scheduler** (`app/Console/Kernel.php` or `routes/console.php`):

```php
Schedule::command('attachments:prune-orphans')->hourly();
```

---

## Frontend Changes

### Critical architectural note: upload is NOT a Server Action

`File` objects are not serializable across the Next.js Server/Client boundary.
`uploadOrphanAttachment` **must** be a plain `async` function called directly
from the client component — it cannot have `'use server'` and cannot go through
a Server Action invocation.

It uses `fetch` directly with the auth token from `getAuthHeaders()` (following
the same pattern as `shared/lib/httpClient.ts`). This is consistent with the
documented learning in
`docs/solutions/integration-issues/server-action-html-response-json-parse.md`:
use safe JSON parsing, never call `res.json()` directly.

`deleteOrphanAttachment` takes only a `number` (serializable) and can be a
Server Action, but for consistency in the same module both functions are plain
client-callable async functions.

### 1. Types

**File:** `features/issues/model/types.ts`

```ts
export interface IssueAttachment {
  id: number;
  issue_id?: number | null;
  upload_token?: string | null; // present when pending; null after binding
  name?: string | null;
  file_name?: string | null;
  original_name?: string | null;
  file_path?: string | null;
  file_url?: string | null;
  url?: string | null;
  uploaded_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Issue {
  // ...existing fields...
  attachments?: IssueAttachment[]; // populated only on create response (whenLoaded)
}

export interface IssueUpsertDTO {
  // ...existing fields...
  upload_token?: string | null;
}
```

### 2. Upload/delete functions (client-side, NOT Server Actions)

**File:** `features/issues/api/pending-attachments.ts`

```ts
// No 'use server' — File is not serializable across the Server Action boundary.
// These are plain async functions called from client components.

import { getAuthHeaders } from '@/shared/lib/httpClient';
import { parseApiError } from '@/shared/lib/apiError';

import type { ActionResult } from '@/shared/types/server-action';
import type { IssueAttachment } from '@/features/issues/model/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function uploadPendingAttachment(
  file: File,
  uploadToken: string,
): Promise<ActionResult<IssueAttachment>> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_token', uploadToken);

    const authHeaders = await getAuthHeaders();
    // Do NOT set Content-Type — browser sets multipart/form-data with boundary
    const res = await fetch(`${API_URL}/attachments/pending`, {
      method: 'POST',
      headers: authHeaders, // auth only, no Content-Type override
      body: formData,
    });

    // Safe JSON parsing — handles HTML error pages from Laravel (see docs/solutions/...)
    const text = await res.text();
    let json: Record<string, unknown>;
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { data: null, error: 'Server error. Please try again.' };
    }

    if (!res.ok) {
      const parsed = parseApiError(
        JSON.stringify(json),
        'Failed to upload file',
      );
      return {
        data: null,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      };
    }

    return {
      data: normalizeIssueAttachment(json.data as IssueAttachment),
      error: null,
    };
  } catch {
    return { data: null, error: 'Upload failed. Check your connection.' };
  }
}

export async function deletePendingAttachment(
  attachmentId: number,
): Promise<ActionResult<null>> {
  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_URL}/attachments/pending/${attachmentId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    if (!res.ok) {
      const text = await res.text();
      let json: Record<string, unknown> = {};
      try {
        json = JSON.parse(text) as Record<string, unknown>;
      } catch {
        /* ignore */
      }
      const parsed = parseApiError(
        JSON.stringify(json),
        'Failed to delete file',
      );
      return { data: null, error: parsed.message };
    }

    return { data: null, error: null };
  } catch {
    return { data: null, error: 'Delete failed. Check your connection.' };
  }
}
```

### 3. New component: `PendingAttachmentUploader`

**File:** `features/issues/ui/pending-attachment-uploader.tsx`

Handles the pre-creation upload flow. Completely separate from
`IssueAttachments` to avoid coupling the two modes. The `pendingOps` Set
replaces the fragile `uploadingCount` counter.

```tsx
'use client';

import { Paperclip, Trash2, Upload } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  deletePendingAttachment,
  uploadPendingAttachment,
} from '@/features/issues/api/pending-attachments';
import { BUTTON_VARIANT } from '@/shared/types/button';
import { Button } from '@/shared/ui/button/Button';

import type { IssueAttachment } from '@/features/issues/model/types';

interface PendingAttachmentUploaderProps {
  uploadToken: string;
  attachments: IssueAttachment[];
  onUploaded: (attachment: IssueAttachment) => void;
  onDeleted: (attachmentId: number) => void;
  /** Called whenever the pending-operations Set changes — parent disables submit when size > 0 */
  onPendingChange: (pendingOps: Set<string>) => void;
}

export function PendingAttachmentUploader({
  uploadToken,
  attachments,
  onUploaded,
  onDeleted,
  onPendingChange,
}: PendingAttachmentUploaderProps) {
  // Set of operation IDs — structurally immune to going negative
  const [pendingOps, setPendingOps] = useState<Set<string>>(() => new Set());

  function addOp(id: string) {
    setPendingOps((prev) => {
      const next = new Set(prev);
      next.add(id);
      onPendingChange(next);
      return next;
    });
  }

  function removeOp(id: string) {
    setPendingOps((prev) => {
      const next = new Set(prev);
      next.delete(id);
      onPendingChange(next);
      return next;
    });
  }

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium text-foreground'>Attachments</span>
        <label
          className={[
            'inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-button)]',
            'border border-input bg-background px-3 py-1.5 text-sm font-medium',
            'text-foreground hover:bg-accent',
            pendingOps.size > 0 ? 'pointer-events-none opacity-50' : '',
          ].join(' ')}
        >
          <Upload className='h-3.5 w-3.5' />
          {pendingOps.size > 0 ? 'Uploading...' : 'Add file'}
          <input
            type='file'
            className='hidden'
            disabled={pendingOps.size > 0}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              event.target.value = ''; // reset so same file can be re-selected

              const opId = crypto.randomUUID();
              addOp(opId);

              uploadPendingAttachment(file, uploadToken)
                .then((result) => {
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }
                  if (result.data) onUploaded(result.data);
                })
                .catch(() => {
                  toast.error('Upload failed');
                })
                .finally(() => {
                  removeOp(opId);
                });
            }}
          />
        </label>
      </div>

      {attachments.length > 0 && (
        <ul className='flex flex-col gap-2'>
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className='flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-background/30 px-3 py-2'
            >
              <div className='flex min-w-0 items-center gap-2'>
                <Paperclip className='h-4 w-4 shrink-0 text-muted-foreground' />
                <span className='truncate text-sm text-foreground'>
                  {attachment.original_name ??
                    attachment.file_name ??
                    `#${attachment.id}`}
                </span>
              </div>
              <Button
                type='button'
                variant={BUTTON_VARIANT.ghost}
                className='h-7 w-7 shrink-0 p-0'
                disabled={pendingOps.size > 0} // block delete while upload in progress
                onClick={() => {
                  const opId = crypto.randomUUID();
                  addOp(opId);

                  deletePendingAttachment(attachment.id)
                    .then((result) => {
                      if (result.error) {
                        toast.error(result.error);
                        return;
                      }
                      onDeleted(attachment.id);
                    })
                    .catch(() => {
                      toast.error('Delete failed');
                    })
                    .finally(() => {
                      removeOp(opId);
                    });
                }}
              >
                <Trash2 className='h-3.5 w-3.5' />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**Why `pendingOps` Set lives inside the component, not in the parent?** The
parent only needs to know "is anything pending?" (boolean for disabling submit).
The Set details are internal to the uploader. `onPendingChange` passes the full
Set up so the parent can read `.size > 0` without needing to understand the
internals.

### 4. Fix stale-refresh race in existing `IssueAttachments`

**File:** `features/issues/ui/issue-attachments.tsx`

The current `refresh()` function has a stale-write race: concurrent refresh
calls can restore a deleted attachment if the earlier (stale) response resolves
after the newer one. Add an abort guard:

```tsx
// Add inside IssueAttachments component:
const refreshSeq = useRef(0);

const refresh = async () => {
  const seq = ++refreshSeq.current;
  const next = await getIssueAttachments(issueId);
  // Only apply if this is still the latest refresh call
  if (seq === refreshSeq.current) {
    setAttachments(next);
  }
};
```

This fix is not strictly part of the new feature but is a pre-existing bug that
becomes more visible when the post-create screen shows already-bound attachments
and then the user immediately uploads/deletes.

### 5. `IssueForm` — integrate uploader for create mode

**File:** `features/issues/ui/issue-form.tsx`

```tsx
'use client';

import { useState } from 'react';
// ... existing imports ...
import { PendingAttachmentUploader } from './pending-attachment-uploader';
import type { IssueAttachment } from '@/features/issues/model/types';

interface IssueFormProps {
  // ...existing props...
  uploadToken?: string;  // present only in create mode
}

export function IssueForm({ ..., uploadToken }: IssueFormProps) {
  const [orphanAttachments, setOrphanAttachments] = useState<IssueAttachment[]>([]);
  // pendingOps from uploader — disables submit when non-empty
  const [hasPendingOps, setHasPendingOps] = useState(false);

  // ...existing form setup unchanged...

  const onSubmit = (values: IssueFormValues) => {
    // ...existing validation...
    const payload = {
      // ...existing fields...
      upload_token: uploadToken ?? null,
    };
    // ...rest unchanged...
  };

  return (
    <form className='flex flex-col gap-4' onSubmit={handleSubmit(onSubmit)}>
      {/* All existing fields unchanged */}

      {uploadToken !== undefined && (
        <PendingAttachmentUploader
          uploadToken={uploadToken}
          attachments={orphanAttachments}
          onUploaded={(attachment) => {
            setOrphanAttachments((prev) => [...prev, attachment]);
          }}
          onDeleted={(id) => {
            setOrphanAttachments((prev) => prev.filter((a) => a.id !== id));
          }}
          onPendingChange={(ops) => {
            setHasPendingOps(ops.size > 0);
          }}
        />
      )}

      {rootError ? <p className='text-sm text-destructive'>{rootError}</p> : null}

      <div className='grid gap-2 md:grid-cols-2'>
        <Button
          type='submit'
          loading={isPending}
          disabled={isPending || !isDirty || hasPendingOps}
        >
          {hasPendingOps ? 'Uploading...' : issue ? 'Save changes' : 'Create task'}
        </Button>
        {/* Delete button unchanged */}
      </div>
    </form>
  );
}
```

### 6. `IssueCreatePageClient` — stable token, simplified post-create

**File:** `features/issues/ui/issue-create-page-client.tsx`

```tsx
'use client';

import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';

import { ROUTES } from '@/shared/lib/routes';
import { IssueAttachments } from './issue-attachments';
import { IssueForm } from './issue-form';

import type { OrganizationProps } from '@/entities/organization';
import type { Issue, PersonOption } from '@/features/issues/model/types';

interface CurrentUser {
  id: number;
  name: string;
  email: string;
}

interface IssueCreatePageClientProps {
  organizations: OrganizationProps[];
  persons: PersonOption[];
  defaultOrganizationId: string;
  currentUser: CurrentUser | null;
}

export function IssueCreatePageClient({
  organizations,
  persons,
  defaultOrganizationId,
  currentUser,
}: IssueCreatePageClientProps) {
  // useMemo with empty deps — generated once on mount, stable across re-renders.
  // Clearer than useRef(crypto.randomUUID()).current.
  const uploadToken = useMemo(() => crypto.randomUUID(), []);
  const [createdIssue, setCreatedIssue] = useState<Issue | null>(null);

  if (createdIssue === null) {
    return (
      <IssueForm
        organizations={organizations}
        persons={persons}
        defaultOrganizationId={defaultOrganizationId}
        currentUser={currentUser}
        onCreated={setCreatedIssue}
        uploadToken={uploadToken}
      />
    );
  }

  // Post-create: attachments already bound — pass them as initialAttachments
  // so there is no empty-state flash before the first fetch.
  return (
    <div className='flex flex-col gap-6'>
      <p className='text-sm font-medium text-green-500'>
        Task #{createdIssue.id} created successfully.
      </p>
      <IssueAttachments
        issueId={createdIssue.id}
        initialAttachments={createdIssue.attachments ?? []}
      />
      <a
        href={`${ROUTES.DASHBOARD.ISSUES}/${createdIssue.id}`}
        className='inline-flex items-center gap-2 self-end text-sm font-medium text-primary hover:underline'
      >
        Go to task
        <ArrowRight className='h-4 w-4' />
      </a>
    </div>
  );
}
```

### 7. Update `features/issues/index.ts`

```ts
export { PendingAttachmentUploader } from './ui/pending-attachment-uploader';
export {
  uploadPendingAttachment,
  deletePendingAttachment,
} from './api/pending-attachments';
```

---

## Edge Cases — Full Matrix

| Scenario                                      | Handling                                                                                                                                                                                                                            |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Token not sent (no files uploaded)            | Backend skips binding (`upload_token === null`). No side effects.                                                                                                                                                                   |
| Token sent, 0 matching pending rows           | Binding UPDATE affects 0 rows. Issue created normally. If files were cleaned up, they are gone silently — acceptable (25 h window is generous).                                                                                     |
| Validation error on issue create → resubmit   | Token is stable (`useMemo([])`). Pending rows still exist. Second submit binds them. Works correctly as long as cleanup has not run (24 h window).                                                                                  |
| Network failure during file upload            | `removeOp(opId)` called in `.finally()`. Set returns to previous size. Toast shown. No pending row created (upload never completed). User can retry.                                                                                |
| Upload succeeds, issue submit network timeout | Issue may or may not exist. Pending rows remain. Cleanup collects after 24 h. Worst case: silent attachment loss. This is acceptable — no data corruption.                                                                          |
| Browser refresh during form fill              | New token on remount. Prior pending rows unreachable by new token. Cleanup handles. Acceptable UX trade-off.                                                                                                                        |
| Two tabs, same user                           | Each tab has its own token. Files in tab A are not bound by tab B's submit. Expected and safe — tokens are per-session.                                                                                                             |
| Token guessing attack                         | UUID v4 has 122 bits of entropy. `uploaded_by_user_id` check at binding prevents cross-user binding even if token known.                                                                                                            |
| High-volume malicious uploads                 | `throttle:30,1` (30/min). 10 MB/file. Max exposure: 300 MB/min per user before throttling. Add per-user daily quota if needed.                                                                                                      |
| Cleanup job races with binding                | `lockForUpdate` on cleanup prevents concurrent binding. If cleanup holds the lock, binding waits → finds 0 rows (already deleted) → issue created with no attachments.                                                              |
| Cleanup job — file not on disk                | `Storage::delete` in try/catch. Logs warning, always deletes DB row. No re-accumulation.                                                                                                                                            |
| `uploaded_by_user_id` null (user deleted)     | `nullOnDelete` → field becomes null. Cleanup picks up row (still `issue_id IS NULL`).                                                                                                                                               |
| Large file (>10 MB)                           | Rejected by `StoreOrphanAttachmentRequest` (max:10240). No file stored. Frontend shows toast. `removeOp` called in `.finally()`.                                                                                                    |
| Multiple files, one fails                     | Each file is independent. Successful ones show in list. Failed one shows toast. User retries that file.                                                                                                                             |
| Delete while upload in progress               | Upload and delete both tracked in same Set. Delete button disabled while Set is non-empty. Structurally prevented.                                                                                                                  |
| Submit while any op in progress               | `disabled={hasPendingOps}` blocks submit. Button shows "Uploading...".                                                                                                                                                              |
| Orphan file removal before submit             | `DELETE /api/v1/attachments/pending/:id` — Policy checks `issue_id IS NULL AND uploaded_by = auth()->id()`. DB + file deleted. `onDeleted` removes from local state.                                                                |
| `IssueResource` N+1 on list endpoints         | `whenLoaded('attachments')` — absent unless explicitly loaded. List endpoints unaffected.                                                                                                                                           |
| `upload_token` not valid UUID                 | Rejected by regex in both `StoreOrphanAttachmentRequest` and `IssueRequest`. 422 returned.                                                                                                                                          |
| Executable file upload (`.php`, `.sh`)        | Blocked by `not_regex` rule in `StoreOrphanAttachmentRequest`. 422 returned.                                                                                                                                                        |
| Double-submit (form submitted twice)          | First submit creates issue + binds. Second submit finds 0 pending rows (already bound). Creates a second empty issue. Mitigated by `disabled={isPending}` on button. No server-side idempotency key — acceptable for this use case. |

---

## Implementation Phases

### Phase 1 — Backend foundation

1. Pre-flight: confirm `uploaded_at` exists; check MySQL version for instant DDL
   eligibility
2. Write and run migration (single `Schema::table` call)
3. Update `IssueAttachment` model (`ORPHAN_TTL_HOURS`, casts, `scopePending()`,
   `uploadedBy()`)
4. Write `IssueAttachmentPolicy` with `deletePending()`, register in
   `AuthServiceProvider`
5. Write `StoreOrphanAttachmentRequest` (with executable extension block)
6. Add `storePending()` and `destroyPending()` to `IssueAttachmentController`
7. Register routes in `routes/api.php` (with throttle)
8. Add `upload_token` nullable rule to `IssueRequest` for `issues.store`
9. Update `IssueController::store` (extract `$userId`, transaction, `pending()`
   scope, `load('attachments')`)
10. Update `IssueResource` (`whenLoaded('attachments')`)
11. Update `IssueAttachmentResource` (`upload_token` field)
12. Write `PruneOrphanAttachments` command (references `ORPHAN_TTL_HOURS`,
    `lockForUpdate`, try/catch on delete)
13. Register scheduler entry

**Test with cURL:**

```bash
# 1. Upload pending file
curl -X POST https://dev-api.shrugged.ai/api/v1/attachments/pending \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@test.pdf" \
  -F "upload_token=xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"

# 2. Create issue with token
curl -X POST https://dev-api.shrugged.ai/api/v1/issues \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","upload_token":"xxxxxxxx-...","status":"open",...}'

# 3. Verify attachments bound (issue_id set, upload_token null)
# 4. Test cleanup: php artisan attachments:prune-orphans --hours=0
```

### Phase 2 — Frontend

1. Add `upload_token` to `IssueAttachment`, `upload_token` to `IssueUpsertDTO`,
   `attachments?` to `Issue`
2. Create `features/issues/api/pending-attachments.ts` (plain async functions,
   NOT Server Actions)
3. Write `PendingAttachmentUploader` component (Set-based pending tracking)
4. Fix stale-refresh race in `IssueAttachments` (sequence counter guard)
5. Extend `IssueForm` (add `uploadToken?` prop, `hasPendingOps` state, integrate
   uploader)
6. Update `IssueCreatePageClient` (`useMemo` token, populate
   `initialAttachments`)
7. Update `features/issues/index.ts` exports

### Phase 3 — Validation

1. Run `backend-contract-validator` agent — verify TypeScript types match
   backend Resources
2. Run `fsd-boundary-guard` — check no FSD violations
3. Manual QA: happy path create with attachments; cancel (navigate away); edit
   form (unchanged); prune command with `--hours=0`
4. Verify list endpoints not N+1 (`/dashboard/issues` should not load
   attachments)
5. Run `mr-reviewer` before push

---

## Deployment Checklist

### Pre-deployment

- [ ] Run migration against staging clone of production data (not fixtures)
- [ ] On staging:
      `EXPLAIN ALTER TABLE issue_attachments MODIFY COLUMN issue_id BIGINT UNSIGNED NULL;`
      — confirm not `algorithm=copy` on your MySQL version
- [ ] Confirm `SELECT COUNT(*) FROM issue_attachments WHERE issue_id IS NULL;`
      returns 0 before migration (no pre-existing orphans)
- [ ] Back up `issue_attachments` table
- [ ] Schedule migration during low-traffic window if MySQL < 8.0

### Deployment order

```
1. Run migration (expand step — additive, backward compatible)
2. Deploy backend code (new routes, controller methods, policy, scheduler)
3. Deploy frontend code
4. Verify scheduler: php artisan schedule:list | grep prune-orphans
```

Backend code can deploy before frontend — new routes simply won't be called yet.
Old frontend still works against old endpoints. No rollout risk.

### Post-deployment verification SQL

```sql
-- Confirm nullable change
SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'issue_attachments' AND COLUMN_NAME = 'issue_id';
-- Expected: YES

-- Confirm new columns exist
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'issue_attachments'
  AND COLUMN_NAME IN ('upload_token', 'uploaded_by_user_id');

-- Confirm indexes
SHOW INDEX FROM issue_attachments
WHERE Key_name IN ('ia_token_user_idx', 'ia_issue_uploaded_at_idx');

-- Confirm no existing data corrupted
SELECT COUNT(*) AS total,
       COUNT(issue_id) AS with_issue,
       SUM(issue_id IS NULL) AS without_issue
FROM issue_attachments;
-- without_issue should be 0 immediately post-migration

-- Confirm FK on uploaded_by_user_id with SET NULL delete rule
SELECT CONSTRAINT_NAME, DELETE_RULE
FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
WHERE TABLE_NAME = 'issue_attachments';
```

### Rollback procedure

```bash
# 1. Roll back frontend (deploy previous build)
# 2. Roll back backend code
# 3. Run migration rollback:
php artisan migrate:rollback --step=1

# If orphan rows exist (issue_id IS NULL), NOT NULL cannot be restored automatically.
# Manual cleanup first:
# DELETE FROM issue_attachments WHERE issue_id IS NULL;
# ALTER TABLE issue_attachments MODIFY COLUMN issue_id BIGINT UNSIGNED NOT NULL;
```

---

## Acceptance Criteria

### Functional

- [ ] User can upload files while filling the create form (before submitting)
- [ ] After issue creation, uploaded files are immediately visible (no
      empty-state flash)
- [ ] "Create task" button is disabled while any file upload or delete is in
      progress
- [ ] User can remove an uploaded file from the queue before submitting
- [ ] Cancelling the form leaves no visible orphan data; cleanup handles files
      silently after 24 h
- [ ] Edit form is unchanged — direct upload to issue endpoint, no token
      involved
- [ ] Executable files (`.php`, `.sh`, `.exe`) are rejected at upload time

### Non-functional

- [ ] Orphan uploads older than 24 h are pruned hourly
- [ ] Cleanup job uses `lockForUpdate` to prevent TOCTOU race
- [ ] Issue creation + attachment binding are atomic (one DB transaction)
- [ ] Orphan upload endpoint is rate-limited (30/min per user)
- [ ] `upload_token` validated as UUID v4 on both upload and issue-create
      requests
- [ ] Cross-user token binding is impossible (`uploaded_by_user_id` check at
      binding)
- [ ] `IssueResource` list endpoints have no N+1 from attachments (`whenLoaded`)
- [ ] `upload_token` cleared to NULL after binding

### Security

- [ ] `POST /api/v1/attachments/pending` requires authentication
- [ ] `DELETE /api/v1/attachments/pending/:id` checked via
      `IssueAttachmentPolicy::deletePending`
- [ ] Binding in `IssueController::store` scopes by
      `uploaded_by_user_id = auth()->id()`
- [ ] UUID v4 regex validated on both upload and issue-create requests
- [ ] File size limit (10 MB) and executable extension block enforced

---

## Files Changed

### Backend (`/Users/slavapopov/Documents/WandaAsk_backend`)

| File                                                                                  | Change                                                                                              |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `database/migrations/2026_05_04_000000_extend_issue_attachments_for_upload_token.php` | **New** — single ALTER TABLE: nullable `issue_id`, `upload_token`, `uploaded_by_user_id`, 2 indexes |
| `app/Models/IssueAttachment.php`                                                      | Add `ORPHAN_TTL_HOURS`, casts, `uploadedBy()`, `scopePending()`                                     |
| `app/Policies/IssueAttachmentPolicy.php`                                              | **New** — `deletePending()` ability                                                                 |
| `app/Http/Requests/API/v1/StoreOrphanAttachmentRequest.php`                           | **New** — validation with UUID regex + executable extension block                                   |
| `app/Http/Controllers/API/v1/IssueAttachmentController.php`                           | Add `storePending()`, `destroyPending()`                                                            |
| `app/Http/Controllers/API/v1/IssueController.php`                                     | Wrap `store()` in transaction; extract `$userId`; use `pending()` scope; `load('attachments')`      |
| `app/Http/Requests/API/v1/IssueRequest.php`                                           | Add `upload_token` nullable UUID rule to `issues.store`                                             |
| `app/Http/Resources/API/v1/IssueResource.php`                                         | Add `whenLoaded('attachments')`                                                                     |
| `app/Http/Resources/API/v1/IssueAttachmentResource.php`                               | Add `upload_token` field                                                                            |
| `app/Console/Commands/PruneOrphanAttachments.php`                                     | **New** — cleanup command referencing `ORPHAN_TTL_HOURS`, with `lockForUpdate` and try/catch        |
| `app/Console/Kernel.php` / `routes/console.php`                                       | Register hourly scheduler entry                                                                     |
| `routes/api.php`                                                                      | Add 2 new pending attachment routes with throttle                                                   |
| `app/Providers/AuthServiceProvider.php`                                               | Register `IssueAttachmentPolicy`                                                                    |

### Frontend (`/Users/slavapopov/Documents/WandaAsk_frontend`)

| File                                                 | Change                                                                                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `features/issues/model/types.ts`                     | Extend `IssueAttachment` (`upload_token`), `Issue` (`attachments?`), `IssueUpsertDTO` (`upload_token`)            |
| `features/issues/api/pending-attachments.ts`         | **New** — plain async client functions (NOT Server Actions): `uploadPendingAttachment`, `deletePendingAttachment` |
| `features/issues/ui/pending-attachment-uploader.tsx` | **New** — pre-create upload widget with Set-based pending tracking                                                |
| `features/issues/ui/issue-attachments.tsx`           | Fix stale-refresh race (sequence counter guard)                                                                   |
| `features/issues/ui/issue-form.tsx`                  | Add `uploadToken?` prop, `hasPendingOps` state, integrate `PendingAttachmentUploader`                             |
| `features/issues/ui/issue-create-page-client.tsx`    | `useMemo` token, populate `initialAttachments` from create response                                               |
| `features/issues/index.ts`                           | Export new component and functions                                                                                |

---

## Open Questions (Resolved)

1. **Redirect vs. stay on page after create** — Keep the two-step reveal for
   now. The post-create screen lets users add more attachments if needed.
   Removing it is a separate UX decision.

2. **Storage path for orphans** — Keep
   `attachments/pending/{upload_token}/{filename}` permanently. Moving files
   after binding adds complexity and a failure mode. `file_path` in the DB
   stores the full path; download routes work regardless of path structure.

3. **Maximum files per token** — Implicitly limited by `throttle:30,1` and the
   10 MB cap. Explicit per-token file count cap (e.g., 20) can be added in
   `storePending` if storage abuse becomes a concern in practice. Defer until
   needed.

4. **Notify user if 0 attachments bound after create** — Not implemented. The 24
   h window is generous enough that this scenario is extremely rare in normal
   usage. Add monitoring/alerting on the backend if it becomes a real concern.

---

## References

### Backend

- `app/Http/Controllers/API/v1/IssueAttachmentController.php` — existing
  `store()` and `destroy()` reference
- `app/Http/Requests/API/v1/IssueRequest.php:64-66` — existing file validation
  pattern
- `app/Models/IssueAttachment.php` — `$guarded = []`,
  `CREATED_AT = 'uploaded_at'`
- `database/migrations/2026_03_20_100300_rename_tasks_table_to_issues.php:13-29`
  — current FK constraints

### Frontend

- `features/issues/api/issues.ts:460-493` — `uploadIssueAttachment` reference
  (but note: this is a Server Action that builds FormData —
  `uploadPendingAttachment` must NOT be a Server Action)
- `features/issues/ui/issue-attachments.tsx:287-415` — existing
  `IssueAttachments` component
- `shared/lib/httpClient.ts:26-28` — FormData + auth header handling pattern
- `shared/types/server-action.ts` — `ActionResult<T>` pattern
- `docs/solutions/integration-issues/server-action-html-response-json-parse.md`
  — safe JSON parsing for direct fetch calls
