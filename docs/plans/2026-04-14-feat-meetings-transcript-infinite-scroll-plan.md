---
title: feat: Add infinite scroll to meetings transcript page
type: feat
status: completed
date: 2026-04-14
---

# feat: Add Infinite Scroll to Meetings Transcript Page

## Overview

The page `app/dashboard/meetings/[id]/transcript/page.tsx` currently fetches all
transcript entries in a single request (capped at 50) and renders them as a
plain list. This needs to be replaced with paginated infinite scroll, consistent
with how the follow-ups transcript page works.

## Problem Statement

- `getMeetingTranscript()` in `features/meetings/api/meetings.ts` loads only 50
  segments with a hard `limit: '50'` — longer meetings are truncated.
- No pagination or infinite scroll — the entire list is dumped synchronously on
  the server and hydrated all at once.
- The `features/transcript/api/transcript.ts` uses raw `fetch` directly,
  violating the project rule of using `httpClient`/`httpClientList` instead.
- Tests for the transcript page (`app/dashboard/meetings/[id]/transcript/`) are
  missing entirely.

## Proposed Solution

Reuse the existing `features/transcript/` slice that already has a full infinite
scroll implementation (used by the follow-ups transcript page). The meetings
transcript page simply needs to delegate to the same `<Transcript id={id} />`
server component, exactly like the follow-ups page does.

Additionally, fix `features/transcript/api/transcript.ts` to use
`httpClientList` instead of raw `fetch`.

## Technical Approach

### Architecture

The `features/transcript/` feature already contains:

- `features/transcript/ui/transcript.tsx` — async Server Component that fetches
  the first chunk and passes it to `TranscriptHistory`
- `features/transcript/ui/transcript-history.tsx` — Client Component using
  `useInfiniteScroll`
- `features/transcript/api/transcript.ts` — Server Action
  `loadTranscriptChunk(id, offset, limit)`
- `features/transcript/lib/options.ts` — `filters.limit = 10`

The follow-ups page already does this correctly:

```tsx
// app/dashboard/follow-ups/analysis/[id]/transcript/page.tsx
export default async function FollowUpTranscriptPage({ params }) {
  const { id } = await params;
  return <Transcript id={id} />;
}
```

The meetings transcript page should adopt the same pattern.

### Implementation Steps

#### Step 1 — Fix `features/transcript/api/transcript.ts`

Replace the raw `fetch` call with `httpClientList` to comply with the API Layer
Conventions.

**Current (violates conventions):**

```ts
// features/transcript/api/transcript.ts
const authHeaders = await getAuthHeaders();
const res = await fetch(`${API_URL}/calendar-events/${id}/transcript?...`, {
  method: 'GET',
  headers: { ...authHeaders },
  cache: 'no-store',
});
if (!res.ok) {
  throw new Error('Failed to load transcript chunk');
}
const data = await res.json();
const totalCount = Number(res.headers.get('Items-Count') || '0');
return { data, totalCount, hasMore: offset + limit < totalCount };
```

**Target (correct):**

```ts
// features/transcript/api/transcript.ts
'use server';

import { API_URL } from '@/shared/lib/config';
import { httpClientList } from '@/shared/lib/httpClient';
import type {
  TranscriptProps,
  TranscriptsProps,
} from '@/features/transcript/model/types';

export async function loadTranscriptChunk(
  id: string,
  offset: number,
  limit: number,
) {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  });
  const { data, totalCount } = await httpClientList<TranscriptProps>(
    `${API_URL}/calendar-events/${id}/transcript?${params.toString()}`,
  );
  // httpClientList reads Items-Count header and returns totalCount
  const hasMore = offset + data.length < totalCount;
  return {
    data: {
      data,
      message: '',
      meta: [],
      status: 200,
      success: true,
    } as TranscriptsProps,
    totalCount,
    hasMore,
  };
}
```

> **Note:** Verify the exact shape returned by `httpClientList` against
> `TranscriptsProps`. The `TranscriptHistory` component expects
> `initialData.data` to be the array. Adjust the returned object to match.

#### Step 2 — Rewrite `app/dashboard/meetings/[id]/transcript/page.tsx`

Replace the current full-fetch implementation with a delegation to
`<Transcript>`:

**Target:**

```tsx
// app/dashboard/meetings/[id]/transcript/page.tsx
import Transcript from '@/features/transcript/ui/transcript';

export default async function MeetingTranscriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Transcript id={id} />;
}
```

- Remove `getMeetingTranscript` import and usage
- Remove the inline `formatTime` helper (it is no longer needed here)
- Remove the inline empty state JSX — `Transcript`/`TranscriptHistory` already
  handle empty state via `InfiniteScrollStatus`

> **Open question:** The current page has its own empty state UI (MicOff icon +
> styled card). Check if `TranscriptHistory` shows an adequate empty state when
> `initialData.data` is empty and `initialTotal === 0`. If not, the `Transcript`
> server component may need to handle the 404/empty case and delegate to a
> dedicated empty state. Consider adding the empty state to
> `features/transcript/ui/transcript.tsx` if it's absent.

#### Step 3 — Clean up `features/meetings/api/meetings.ts`

Remove `getMeetingTranscript` function and its associated `TranscriptEntry` /
`TranscriptParticipant` interfaces — they are no longer used by any page. The
canonical types live in `features/transcript/model/types.ts`.

**Files affected:**

- `features/meetings/api/meetings.ts` — remove `getMeetingTranscript`,
  `TranscriptEntry`, `TranscriptParticipant`

#### Step 4 — Write tests

**4a. New test: `features/transcript/api/__tests__/transcript.test.ts`**

Tests for `loadTranscriptChunk` after migration to `httpClientList`:

```ts
// features/transcript/api/__tests__/transcript.test.ts
jest.mock('@/shared/lib/httpClient');
jest.mock('@/shared/lib/config', () => ({ API_URL: 'http://api' }));

describe('loadTranscriptChunk', () => {
  it('calls httpClientList with correct URL params', async () => { ... });
  it('returns correct hasMore=true when more items available', async () => { ... });
  it('returns correct hasMore=false when all items fetched', async () => { ... });
  it('passes data as TranscriptsProps shape', async () => { ... });
});
```

**4b. New test: `features/transcript/ui/__tests__/transcript-page.test.tsx`**
(for the meetings page)

Actually, the page test should live next to the page file. Since Next.js pages
under `app/` are not conventionally co-located with tests, and the logic is now
entirely delegated to `features/transcript/ui/transcript.tsx`, the existing
`features/transcript/ui/__tests__/transcript.test.tsx` already covers
`<Transcript>`.

Update `transcript.test.tsx` to ensure it correctly covers the delegation from
`MeetingTranscriptPage`:

```tsx
// features/transcript/ui/__tests__/transcript.test.tsx
// Verify: renders TranscriptHistory with eventId and totalCount
// Verify: empty data (totalCount = 0) renders gracefully
// Verify: loadTranscriptChunk called with offset=0 and limit*2 initially
```

**4c. Update existing `transcript-history.test.tsx`**

Current tests already cover the main cases. Add missing coverage:

- `renders sentinel div when hasMore=true` (currently missing)
- `does not render sentinel div when hasMore=false` (currently missing)

**4d. Tests for removed `getMeetingTranscript`**

If `getMeetingTranscript` had tests (check `features/meetings/api/__tests__/`),
remove them. Currently there are no API-level tests for meetings in
`features/meetings/api/__tests__/`.

### Empty State Handling

Current transcript page shows a styled empty state (MicOff icon). After
switching to `<Transcript>`, confirm the `TranscriptHistory` component handles
the case where `items.length === 0` and `!hasMore`. If `InfiniteScrollStatus` is
only shown when `items.length > 0`, the zero-item case renders nothing —
unacceptable UX.

**Recommended:** Add an explicit empty state check in
`features/transcript/ui/transcript.tsx` or `transcript-history.tsx`:

```tsx
if (items.length === 0 && !isLoading && !hasMore) {
  return <TranscriptEmptyState />;
}
```

Or handle at the server level in `transcript.tsx` — if `initialTotal === 0`,
render the empty state directly (no need to hydrate a client component at all).

## Acceptance Criteria

- [x] `app/dashboard/meetings/[id]/transcript/page.tsx` uses infinite scroll via
      `<Transcript>` — no inline data fetching
- [x] Transcript loads in chunks of `filters.limit` (10 per page) with
      `filters.limit * 2` (20) initial load
- [x] `IntersectionObserver` sentinel triggers next chunk as user scrolls
- [x] `InfiniteScrollStatus` shown when all segments are loaded
- [x] `SpinLoader` shown while fetching next chunk
- [x] Empty state (no transcript) is shown correctly — not a blank page
- [x] `features/transcript/api/transcript.ts` uses `httpClientList` — no raw
      `fetch`
- [x] `getMeetingTranscript` removed from `features/meetings/api/meetings.ts`
- [x] `TranscriptEntry` / `TranscriptParticipant` interfaces removed from
      `features/meetings/api/meetings.ts`
- [x] Tests cover: `loadTranscriptChunk` API function, `Transcript` server
      component, `TranscriptHistory` sentinel rendering

## Files to Modify

| File                                              | Change                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| `app/dashboard/meetings/[id]/transcript/page.tsx` | Replace full implementation with `<Transcript id={id} />`                 |
| `features/transcript/api/transcript.ts`           | Replace raw `fetch` with `httpClientList`                                 |
| `features/meetings/api/meetings.ts`               | Remove `getMeetingTranscript`, `TranscriptEntry`, `TranscriptParticipant` |
| `features/transcript/ui/transcript.tsx`           | Add empty state handling if not present                                   |

## New Test Files

| File                                                           | Tests                                            |
| -------------------------------------------------------------- | ------------------------------------------------ |
| `features/transcript/api/__tests__/transcript.test.ts`         | `loadTranscriptChunk` with `httpClientList` mock |
| `features/transcript/ui/__tests__/transcript-history.test.tsx` | Add sentinel/no-sentinel cases                   |
| `features/transcript/ui/__tests__/transcript.test.tsx`         | Update for empty initial data case               |

## Dependencies & Risks

- **No backend change required** —
  `/calendar-events/{id}/transcript?offset={offset}&limit={limit}` already
  supports pagination (used by follow-ups page).
- **Risk: `loadTranscriptChunk` return shape** — `TranscriptHistory` expects
  `initialData: TranscriptsProps` (envelope
  `{ data: [], message, meta, status, success }`). After migrating to
  `httpClientList`, we get back `{ data: T[], totalCount }`. The wrapper shape
  needs to be maintained or `TranscriptHistory` needs to be updated to accept a
  flat array. Prefer updating `TranscriptHistory` to accept
  `initialItems: TranscriptProps[]` directly to simplify.
- **Risk: empty state regression** — The current page shows a styled empty
  state; ensure it's preserved.

## References

- `features/transcript/ui/transcript-history.tsx` — current infinite scroll
  implementation
- `features/transcript/ui/transcript.tsx` — server component with initial fetch
- `features/transcript/api/transcript.ts:13` — `loadTranscriptChunk` (uses raw
  fetch, needs fixing)
- `app/dashboard/follow-ups/analysis/[id]/transcript/page.tsx` — example of
  correct page delegation
- `shared/hooks/use-infinite-scroll.ts` — the hook used
- `shared/lib/httpClient.ts` — `httpClientList` for paginated endpoints
- `features/transcript/ui/__tests__/transcript-history.test.tsx` — existing
  tests to extend
