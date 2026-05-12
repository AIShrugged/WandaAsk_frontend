---
title: 'refactor: Clean up app/api — remove orphaned meetings route'
type: refactor
status: active
date: 2026-05-08
---

# refactor: Clean up app/api — remove orphaned meetings route

## Overview

The `app/api/` directory contains two Next.js Route Handlers. One is actively
used and architecturally correct; the other is an orphaned proxy that duplicates
an existing Server Action and is never called. This refactor removes the dead
route and keeps the one that serves a legitimate purpose Route Handlers can't be
replaced by Server Actions.

## Findings

### `app/api/attachment/route.ts` — KEEP ✅

**Purpose:** Binary file download proxy. Accepts `?id=<n>`, fetches
`${API_URL}/attachments/{id}/download` with a Bearer token, and streams the
response with its original `Content-Type` / `Content-Disposition` headers.

**Why a Route Handler is correct here:** Server Actions return JSON. Browsers
need a direct URL to render `<img>`, `<video>`, `<audio>`, `<iframe>` elements
inline. A proxy Route Handler is the only way to inject the auth token for these
media elements.

**Active usages:**

- `features/issues/ui/issue-attachments.tsx:48` — `attachmentUrl()` generates
  `/api/attachment?id=${attachment.id}`
- Rendered as `<img>`, `<iframe>`, `<audio>`, `<video>` and fetched for text
  previews

---

### `app/api/meetings/route.ts` — DELETE ❌

**Purpose:** Paginated proxy for `GET /calendar-events?offset=&limit=`. Returns
events + `Items-Count` header.

**Why it should be deleted:**

1. **Never called.** No `fetch('/api/meetings')` reference exists anywhere in
   the codebase.
2. **Fully duplicated by a Server Action.** `features/meetings/api/meetings.ts`
   → `loadMeetingsChunk(offset, limit)` calls the same backend URL
   (`${API_URL}/calendar-events?offset…&limit…`) with the same auth.
3. **Wrong pattern.** The project convention (CLAUDE.md) mandates Server Actions
   for data fetching. Route Handlers exist only when a browser-native URL is
   required (file download, webhooks, SSE).

**Server Actions that cover this functionality:** | Function | Backend call |
|---|---| | `loadMeetingsChunk(offset, limit)` |
`GET /calendar-events?offset&limit` | | `getMeetingsForDate(date)` |
`GET /calendar-events?date=YYYY-MM-DD&limit=50` | | `getMeetingsForThreeDays()`
| 3× `getMeetingsForDate` in parallel | | `getCalendarEventsForMonth(month)` |
N× `getMeetingsForDate` per day in month |

---

### `app/api/auth/` — EMPTY DIRECTORY, DELETE ❌

The directory was created but contains no files. Nothing references it.

---

## What to do

### Step 1 — Delete orphaned files

```
app/api/meetings/route.ts        → delete
app/api/auth/                    → delete empty directory
```

### Step 2 — Verify nothing calls `/api/meetings`

```bash
grep -r "api/meetings" . \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=.next --exclude-dir=node_modules
```

Expected: zero results (confirmed by research).

### Step 3 — Audit `loadMeetingsChunk`

The Server Action `loadMeetingsChunk` is exported but currently has zero callers
in UI components. This is dead code that existed alongside the Route Handler.
After deleting the Route Handler, decide:

- If infinite-scroll pagination for the meetings list is planned → wire up
  `loadMeetingsChunk` to the UI.
- If it will never be used → delete `loadMeetingsChunk` from
  `features/meetings/api/meetings.ts` too.

The other meeting functions (`getMeetingsForDate`, etc.) are actively used.

---

## Acceptance Criteria

- [ ] `app/api/meetings/route.ts` deleted
- [ ] `app/api/auth/` directory deleted
- [ ] `grep -r "api/meetings"` returns zero results
- [ ] `app/api/attachment/route.ts` unchanged and still working
- [ ] `npm run lint` passes
- [ ] `npm run build` passes (no dead imports)
- [ ] Decision made on `loadMeetingsChunk` (keep wired up, or delete)

## Files Affected

| File                                | Action                                                      |
| ----------------------------------- | ----------------------------------------------------------- |
| `app/api/meetings/route.ts`         | Delete                                                      |
| `app/api/auth/`                     | Delete (empty directory)                                    |
| `features/meetings/api/meetings.ts` | Optionally remove `loadMeetingsChunk` if no plans to use it |
| `app/api/attachment/route.ts`       | No change — keep                                            |

## References

- `app/api/attachment/route.ts` — active binary proxy
- `app/api/meetings/route.ts` — orphaned proxy
- `features/meetings/api/meetings.ts` — Server Actions that cover the same
  endpoint
- `features/issues/ui/issue-attachments.tsx:48` — caller of the attachment route
- CLAUDE.md § "API Layer Conventions" — Server Actions are the mandatory
  pattern; raw `fetch` only in `shared/lib/`
