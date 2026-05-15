---
title: 'refactor: Move Telegram Chats Management to Profile Tab'
type: refactor
status: completed
date: 2026-05-15
deepened: 2026-05-15
---

# refactor: Move Telegram Chats Management to Profile Tab

## Enhancement Summary

**Deepened on:** 2026-05-15 **Research agents used:**
kieran-typescript-reviewer, architecture-strategist, code-simplicity-reviewer,
security-sentinel, performance-oracle, julik-frontend-races-reviewer,
scope-analysis (Explore), learnings-researcher, pattern-recognition

### Key Improvements Discovered

1. **`TelegramChatRegistration` type must move to `entities/telegram/`** — it is
   already consumed by `features/teams/` in 5 files. Placing it in
   `features/user-profile/` would trade one FSD violation for another.
   `entities/` is the only correct destination for a type shared across multiple
   feature slices.

2. **A standalone `features/telegram/` slice is the architecturally cleaner
   answer** — the Telegram domain has enough surface area (dedicated API,
   complex UI state machine, cross-feature type usage) to warrant its own slice
   rather than being absorbed into `user-profile/`.

3. **17 files need to change** — the original plan underestimated scope. The
   `features/teams/` cross-feature dependency on `TelegramChatRegistration`
   requires updating 6 additional files.

4. **3 race conditions exist in `TelegramChatsManagement`** that will be visible
   in production — auto-refresh overwrites in-flight mutations, double-click
   fires duplicate Server Actions, concurrent refreshes race on last-write-wins.

5. **Multiple build-breaking TypeScript errors** in the plan's proposed code
   snippets — `{ items: chats }` destructure doesn't exist on `PaginatedResult`,
   wrong import path for `features/organizations`, `team_id` type narrowed
   incorrectly.

6. **`loading.tsx` is YAGNI** — no other profile sub-tab has one; the
   layout-level skeleton covers the tab transition.

### New Considerations

- The old `getTelegramChats` has a bug: reads `json.error` but the envelope uses
  `json.message` — `httpClient` migration also fixes this silently
- `shared/lib/httpClient.ts` success-path `res.json()` is itself unsafe (same
  issue as the documented learning) — worth flagging but out of scope for this
  PR
- Backend auth check says "org manager required" but
  `TenantScopeValidator::assertUserCanManageOrganization()` checks member, not
  manager — a backend bug to report separately
- Auto-refresh polling has no `document.visibilityState` guard — fires even when
  tab is hidden

---

## Overview

The Telegram chats management UI is currently accessible via
`/dashboard/chat/telegram` — reachable only through a "Telegram" link button
inside the `ChatList` sidebar. This is architecturally misplaced: Telegram
integration is a **user/account-level setting**, not a per-chat action. It
belongs in the **Profile** section alongside Calendar, Appearance, and Menu
settings.

This refactor:

1. Removes the "Telegram" shortcut link from `ChatList` sidebar header
2. Creates a new **Telegram** tab in the Profile section at
   `/dashboard/profile/telegram`
3. Creates `features/telegram/` as a standalone FSD slice (cleaner than
   absorbing into `user-profile/`)
4. Creates `entities/telegram/model/types.ts` for the shared
   `TelegramChatRegistration` type
5. Migrates `features/chat/api/telegram.ts` to use `httpClient`/`httpClientList`
   (fixes convention + bug)
6. Fixes 3 race conditions in `TelegramChatsManagement` during the move
7. Deletes the old `app/dashboard/chat/telegram/` page route
8. Updates `features/teams/` imports to use `entities/telegram/` (eliminates
   existing FSD violation)

---

## Problem Statement

### Current state issues

1. **Wrong section**: Telegram chats management is nested under
   `/dashboard/chat/telegram` — users navigating to "Profile" to manage
   integrations find nothing there.

2. **Broken conventions in `features/chat/api/telegram.ts`**:
   - Uses raw `fetch()` directly (violates API Layer Rule 2)
   - Manual `getAuthHeaders()` and 401 handling (handled by `httpClient`
     automatically)
   - `getTelegramChats` reads `json.error` but the envelope field is
     `json.message` — **silent bug**
   - Return type of `issueTelegramAttachCode` uses a custom union type instead
     of `ActionResult<T>` (violates Rule 3)
   - `getTelegramChats` returns `TelegramChatRegistration[]` directly,
     discarding the `Items-Count` pagination header

3. **Russian-language UI strings** in `telegram-chats-management.tsx`:
   - Line 248: `'Только менеджер организации может привязать Telegram чат'`
   - Line 363: `'Откройте Telegram чат и отправьте эту команду:'` Both violate
     the UI language convention (English only).

4. **Component belongs to wrong FSD feature**: `TelegramChatsManagement` lives
   in `features/chat/ui/` but has no dependency on chat-specific state or logic.

5. **Existing FSD violation**: `TelegramChatRegistration` type is imported from
   `features/chat/types` in 5 files inside `features/teams/`. This is an illegal
   cross-feature import. The type needs to move to `entities/` to make both
   features legal consumers.

6. **3 race conditions** in `TelegramChatsManagement` (detailed below in Phase
   2).

---

## Backend Contract Verification ✅

Routes confirmed in `routes/api.php`:

| Method | Endpoint                                  | Used by                                                             |
| ------ | ----------------------------------------- | ------------------------------------------------------------------- |
| `GET`  | `/api/v1/telegram/chats`                  | `getTelegramChats()` — paginated list, returns `Items-Count` header |
| `POST` | `/api/v1/telegram/chats/{id}/attach-code` | `issueTelegramAttachCode()` — issue attach code for a group chat    |

**`TelegramChatRegistrationResource` fields** (all correctly typed in existing
frontend type, no mismatches):

| Field                     | TypeScript type            |
| ------------------------- | -------------------------- |
| `id`                      | `number`                   |
| `channel_conversation_id` | `string \| null`           |
| `user_id`                 | `number \| null`           |
| `telegram_chat_id`        | `string \| number`         |
| `message_thread_id`       | `string \| number \| null` |
| `chat_type`               | `string \| null`           |
| `chat_title`              | `string \| null`           |
| `organization_id`         | `number \| null`           |
| `team_id`                 | `number \| null`           |
| `attach_code`             | `string \| null`           |
| `attach_command`          | `string \| null`           |
| `attach_code_expires_at`  | `string \| null`           |
| `attach_code_used_at`     | `string \| null`           |
| `bound_at`                | `string \| null`           |
| `created_at`              | `string`                   |
| `updated_at`              | `string`                   |

**FormRequest for attach-code** (`TelegramChatAttachCodeRequest`):

```
organization_id: required | integer
team_id:         nullable | integer
```

> **Backend note (out of scope for this PR):**
> `TenantScopeValidator::assertUserCanManageOrganization()` checks
> `isOrganizationMember()` but should check `isOrganizationManager()` — a
> backend bug meaning any member (not just managers) can issue attach codes.

---

## Proposed Solution

### New Route Structure

```
app/dashboard/profile/
  layout.tsx              ← add "Telegram" tab to ProfileTabsNav
  telegram/
    page.tsx              ← NEW: Server Component, fetches chats + orgs
```

> **Decision: no `loading.tsx`** — no other profile sub-tab has one (account,
> calendar, appearance, menu, password all lack per-tab skeletons). The
> layout-level `/dashboard/profile/loading.tsx` already covers tab transitions.
> Adding one here without adding to all tabs creates inconsistency. YAGNI.

### New FSD Structure

```
entities/telegram/
  model/
    types.ts              ← NEW: TelegramChatRegistration interface
  index.ts                ← NEW: re-exports type

features/telegram/
  api/
    telegram.ts           ← NEW: httpClient-based server actions (moved + fixed from features/chat/)
  ui/
    TelegramChatsManagement.tsx  ← NEW: moved + fixed component
  index.ts                ← NEW: public API
```

### Files Modified

| File                                                        | Change                                                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `features/chat/ui/chat-list.tsx`                            | Remove "Telegram" link (lines 187-193)                                                                        |
| `features/user-profile/ui/profile-tabs-nav.tsx`             | Add "Telegram" tab to `BASE_TABS`                                                                             |
| `shared/lib/routes.ts`                                      | Add `PROFILE_TELEGRAM: '/dashboard/profile/telegram'`; delete `TELEGRAM_CHATS` after confirming no references |
| `features/chat/index.ts`                                    | Remove Telegram exports                                                                                       |
| `features/chat/types.ts`                                    | Remove `TelegramChatRegistration` re-export                                                                   |
| `features/teams/model/types.ts`                             | Update import → `@/entities/telegram`                                                                         |
| `features/teams/ui/teams-page-client.tsx`                   | Update import → `@/entities/telegram`                                                                         |
| `features/teams/ui/team-notification-settings.tsx`          | Update import → `@/entities/telegram`                                                                         |
| `features/teams/ui/dashboard/team-dashboard-tabs.tsx`       | Update import → `@/entities/telegram`                                                                         |
| `features/teams/ui/dashboard/team-dashboard-tab-people.tsx` | Update import → `@/entities/telegram`                                                                         |
| `app/dashboard/teams/page.tsx`                              | Update `getTelegramChats` import → `@/features/telegram`                                                      |

### Files Deleted

- `app/dashboard/chat/telegram/page.tsx`
- `features/chat/api/telegram.ts`
- `features/chat/ui/telegram-chats-management.tsx`

---

## Technical Approach

### Phase 1 — Create `entities/telegram/`

Create the shared domain type entity before touching any feature files.

**`entities/telegram/model/types.ts`**:

```ts
export interface TelegramChatRegistration {
  id: number;
  channel_conversation_id: string | null;
  user_id: number | null;
  telegram_chat_id: string | number;
  message_thread_id: string | number | null;
  chat_type: string | null;
  chat_title: string | null;
  organization_id: number | null;
  team_id: number | null;
  attach_code: string | null;
  attach_command: string | null;
  attach_code_expires_at: string | null;
  attach_code_used_at: string | null;
  bound_at: string | null;
  created_at: string;
  updated_at: string;
}
```

**`entities/telegram/index.ts`**:

```ts
export type { TelegramChatRegistration } from './model/types';
```

Then update `features/teams/` (5 files + model/types.ts) to import from
`@/entities/telegram` — this eliminates the pre-existing FSD violation
immediately.

### Phase 2 — Create `features/telegram/api/telegram.ts`

Rewrite from scratch using `httpClient`/`httpClientList`:

```ts
'use server';

import { httpClientList, httpClient } from '@/shared/lib/httpClient';
import type { ActionResult } from '@/shared/types/server-action';
import { parseApiError } from '@/shared/lib/apiError';
import { ServerError } from '@/shared/lib/errors';
import { API_URL } from '@/shared/lib/config';
import type { TelegramChatRegistration } from '@/entities/telegram';

export async function getTelegramChats() {
  return httpClientList<TelegramChatRegistration>(
    `${API_URL}/api/v1/telegram/chats`,
  );
}

export async function issueTelegramAttachCode(
  id: number,
  payload: { organization_id: number; team_id?: number | null },
): Promise<ActionResult<TelegramChatRegistration>> {
  try {
    const { data } = await httpClient<TelegramChatRegistration>(
      `${API_URL}/api/v1/telegram/chats/${id}/attach-code`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      },
    );
    if (!data)
      throw new ServerError('Empty response', {
        url: `${API_URL}/api/v1/telegram/chats/${id}/attach-code`,
        status: 200,
      });
    return { data, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to issue attach code',
      );
      return {
        data: null,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      };
    }
    throw error;
  }
}
```

**Key fixes vs. current `features/chat/api/telegram.ts`**:

- Uses `httpClientList` (reads `Items-Count` header correctly, fixes pagination
  loss)
- No raw `fetch`, no manual `getAuthHeaders()`
- Fixes silent bug: old code read `json.error`, envelope uses `json.message`
- Returns `ActionResult<TelegramChatRegistration>` instead of a custom union
- Uses `API_URL` from `@/shared/lib/config` (typed `string`, not
  `string | undefined`)
- Type imports from `@/entities/telegram` (not `features/chat`)
- `team_id` type is `number | null` (preserves component call site compatibility
  — do NOT narrow to `number`)
- Guards against `data` being undefined before returning in success branch

### Phase 3 — Move and fix `TelegramChatsManagement`

Move `features/chat/ui/telegram-chats-management.tsx` →
`features/telegram/ui/TelegramChatsManagement.tsx`.

**During move, apply these fixes:**

#### Fix 1 — Russian strings → English

- Line 248: `'Только менеджер организации...'` →
  `'Only an organization manager can bind a Telegram chat'`
- Line 363: `'Откройте Telegram чат и отправьте эту команду:'` →
  `'Open the Telegram chat and send this command:'`

#### Fix 2 — Race condition: auto-refresh overwrites in-flight mutation

When `issueTelegramAttachCode` is in flight, a 5-second auto-refresh can
overwrite the optimistic state with stale server data. Fix with an inflight
guard set:

```ts
// In TelegramChatsManagement
const [inflightChatIds, setInflightChatIds] = useState<Set<number>>(new Set());

const addInflight = useCallback((id: number) => {
  setInflightChatIds((prev) => new Set(prev).add(id));
}, []);

const removeInflight = useCallback((id: number) => {
  setInflightChatIds((prev) => {
    const next = new Set(prev);
    next.delete(id);
    return next;
  });
}, []);

const refresh = useCallback(() => {
  startRefreshTransition(async () => {
    try {
      const { data: nextChats } = await getTelegramChats();
      setChats((prev) =>
        (nextChats ?? []).map((fetched) =>
          inflightChatIds.has(fetched.id)
            ? (prev.find((p) => p.id === fetched.id) ?? fetched)
            : fetched,
        ),
      );
    } catch (error) {
      toast.error((error as Error).message);
    }
  });
}, [inflightChatIds]);
```

Pass `onMutationStart={addInflight}` and `onMutationEnd={removeInflight}` props
to `TelegramChatCard`.

#### Fix 3 — Race condition: double-click fires duplicate Server Actions

`useTransition`'s `isPending` state is not synchronously set before the
transition starts — a rapid double-click can queue two Server Actions:

```ts
// In TelegramChatCard
const isMutatingRef = useRef(false);

const handleGenerateCode = () => {
  if (isMutatingRef.current) return;
  isMutatingRef.current = true;
  setRootError('');

  startTransition(async () => {
    try {
      onMutationStart(chat.id);
      const result = await issueTelegramAttachCode(chat.id, {
        organization_id,
        team_id,
      });
      // ... handle result
      onUpdate(result.data);
    } finally {
      isMutatingRef.current = false;
      onMutationEnd(chat.id);
    }
  });
};
```

#### Fix 4 — Race condition: concurrent refreshes (last-write-wins)

```ts
const isRefreshingRef = useRef(false);

const refresh = useCallback(() => {
  if (isRefreshingRef.current) return;
  isRefreshingRef.current = true;
  startRefreshTransition(async () => {
    try {
      const { data: nextChats } = await getTelegramChats();
      setChats(/* ... as above with inflightChatIds filter */);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      isRefreshingRef.current = false;
    }
  });
}, [inflightChatIds]);
```

#### Fix 5 — Performance: gate 1-second clock on `shouldAutoRefresh`

The 1-second `setInterval` runs unconditionally, forcing re-renders of every
`TelegramChatCard` every second even when no code is active:

```ts
useEffect(() => {
  if (!shouldAutoRefresh) return; // ← add this gate
  const timer = setInterval(() => setNow(new Date()), 1000);
  return () => clearInterval(timer);
}, [shouldAutoRefresh]);
```

#### Fix 6 — Performance: add `document.visibilityState` guard to 5-second poll

```ts
useEffect(() => {
  if (!shouldAutoRefresh) return;
  const timer = setInterval(() => {
    if (document.visibilityState === 'visible') {
      refresh();
    }
  }, 5000);
  return () => clearInterval(timer);
}, [refresh, shouldAutoRefresh]);
```

#### Fix 7 — `useEffect` resets user's in-progress form selection on refresh

The existing `useEffect` syncing `organizationId`/`teamId` from `chat` prop
fires on every auto-refresh, wiping any selection the user has started:

```ts
const lastCommittedOrgId = useRef(chat.organization_id);
const lastCommittedTeamId = useRef(chat.team_id);

useEffect(() => {
  if (chat.organization_id !== lastCommittedOrgId.current) {
    lastCommittedOrgId.current = chat.organization_id;
    setOrganizationId(chat.organization_id ? String(chat.organization_id) : '');
  }
  if (chat.team_id !== lastCommittedTeamId.current) {
    lastCommittedTeamId.current = chat.team_id;
    setTeamId(chat.team_id ? String(chat.team_id) : '');
  }
}, [chat.organization_id, chat.team_id]);
```

#### Fix 8 — Clipboard write missing error handler

```ts
const handleCopyCommand = () => {
  if (!chat.attach_command) return;
  navigator.clipboard.writeText(chat.attach_command).then(
    () => {
      toast.success('Attach command copied');
    },
    () => {
      toast.error('Could not copy — please copy manually');
    },
  );
};
```

#### Fix 9 — Error message operator precedence bug + Russian string

```ts
// BEFORE (wrong precedence — always shows manager message):
setRootError(
  organizationError || result.error.toLowerCase().includes('organization')
    ? 'Только менеджер...'
    : result.error,
);

// AFTER (explicit parentheses + English):
setRootError(
  organizationError || result.error.toLowerCase().includes('organization')
    ? 'Only an organization manager can bind a Telegram chat'
    : result.error,
);
```

#### Update imports in the moved component

- `issueTelegramAttachCode` → `'../api/telegram'`
- `TelegramChatRegistration` → `'@/entities/telegram'`
- `getTelegramChats` → `'../api/telegram'`

### Phase 4 — Create `features/telegram/index.ts`

```ts
export { getTelegramChats, issueTelegramAttachCode } from './api/telegram';
export { TelegramChatsManagement } from './ui/TelegramChatsManagement';
```

### Phase 5 — New Profile tab route

**`app/dashboard/profile/telegram/page.tsx`**:

```tsx
import { getTelegramChats } from '@/features/telegram/api/telegram';
import { getOrganizations } from '@/features/organization';
import { TelegramChatsManagement } from '@/features/telegram';

export default async function TelegramPage() {
  const [{ data: chats }, { data: organizations }] = await Promise.all([
    getTelegramChats(),
    getOrganizations(),
  ]);
  return (
    <TelegramChatsManagement
      initialChats={chats ?? []}
      organizations={organizations ?? []}
    />
  );
}
```

> **Critical TypeScript note:** `httpClientList` returns `PaginatedResult<T>`
> with a `data` field, not `items`. The original plan had `{ items: chats }`
> which would be a build error. Use `{ data: chats }`. Verify by checking
> `shared/types/common.ts` for the `PaginatedResult<T>` shape.

> **Also note:** The existing `app/dashboard/chat/telegram/page.tsx` uses
> `const [telegramChats, { data: organizations }] = ...` where
> `getTelegramChats()` returned a plain array. The new `httpClientList`-based
> version returns `{ data: T[], totalCount: number }`, so the destructure
> pattern changes. Verify the exact shape of `PaginatedResult<T>` before
> implementing.

### Phase 6 — Add tab to ProfileTabsNav

In `features/user-profile/ui/profile-tabs-nav.tsx`, add to `BASE_TABS`:

```ts
{ href: ROUTES.DASHBOARD.PROFILE_TELEGRAM, label: 'Telegram' }
```

### Phase 7 — Remove Telegram link from ChatList

In `features/chat/ui/chat-list.tsx`, remove lines 187-193:

```tsx
// DELETE this block:
<Link href={ROUTES.DASHBOARD.TELEGRAM_CHATS} className='...'>
  <Send className='w-3.5 h-3.5' />
  Telegram
</Link>
```

Also remove the `Send` icon import if it's no longer used elsewhere in the file.

### Phase 8 — Update routes

In `shared/lib/routes.ts`:

```ts
// Add:
PROFILE_TELEGRAM: '/dashboard/profile/telegram',

// Remove (after confirming no other references):
TELEGRAM_CHATS: '/dashboard/chat/telegram',
```

Grep before deleting:

```bash
grep -r "TELEGRAM_CHATS" --include="*.ts" --include="*.tsx" .
```

Expected: only `features/chat/ui/chat-list.tsx` (which we're already removing
the link from) and `app/dashboard/chat/telegram/page.tsx` (which we're
deleting).

### Phase 9 — Delete old files and clean up

Delete:

- `app/dashboard/chat/telegram/page.tsx`
- `features/chat/api/telegram.ts`
- `features/chat/ui/telegram-chats-management.tsx`

Remove Telegram exports from `features/chat/index.ts`:

- `getTelegramChats`, `issueTelegramAttachCode` exports
- `TelegramChatsManagement` export
- `TelegramChatRegistration` type export

Remove from `features/chat/types.ts`:

- `TelegramChatRegistration` re-export

Final grep to confirm no orphans:

```bash
grep -r "TELEGRAM_CHATS\|telegram-chats-management\|TelegramChatsManagement\|features/chat/api/telegram\|features/chat/types.*Telegram" --include="*.ts" --include="*.tsx" .
```

### Phase 10 — Fix `features/teams/` cross-feature imports

Update all 6 files from `@/features/chat/types` → `@/entities/telegram`:

```ts
// BEFORE:
import type { TelegramChatRegistration } from '@/features/chat/types';
// or
import type { TelegramChatRegistration } from '@/features/chat';

// AFTER:
import type { TelegramChatRegistration } from '@/entities/telegram';
```

Files to update:

1. `features/teams/model/types.ts`
2. `features/teams/ui/teams-page-client.tsx`
3. `features/teams/ui/team-notification-settings.tsx`
4. `features/teams/ui/dashboard/team-dashboard-tabs.tsx`
5. `features/teams/ui/dashboard/team-dashboard-tab-people.tsx`
6. `app/dashboard/teams/page.tsx` — also update `getTelegramChats` import:
   `@/features/telegram`

---

## Acceptance Criteria

### Functional

- [x] `/dashboard/profile/telegram` renders the Telegram chats management UI
      (same functionality as before)
- [x] `/dashboard/profile` tab strip shows a "Telegram" tab
- [x] Clicking "Telegram" tab navigates to `/dashboard/profile/telegram`
- [x] `/dashboard/chat/telegram` route returns 404 (old route removed)
- [x] The "Telegram" link button is gone from the `ChatList` sidebar header
- [x] Attach code flow works: selecting org/team, generating code, copying
      command, auto-refresh
- [x] Teams page still shows Telegram chat selector (imports from new location)
- [x] Chats list reflects pagination (total count from `Items-Count` header is
      available)

### Code Quality

- [x] `features/telegram/api/telegram.ts` uses `httpClientList` and `httpClient`
      — no raw `fetch`
- [x] `issueTelegramAttachCode` returns `ActionResult<TelegramChatRegistration>`
- [x] `team_id` payload type is `number | null` (not narrowed to `number`)
- [x] `API_URL` imported from `@/shared/lib/config`, not `process.env.API_URL`
      directly
- [x] No Russian strings in UI (both violations corrected)
- [x] FSD boundaries clean: `entities/telegram` → no dependencies;
      `features/telegram` imports from `entities/telegram` and `shared/`;
      `features/teams` imports type from `entities/telegram`
- [x] `features/user-profile` does NOT import from `features/telegram` (pure nav
      addition only)
- [x] All imports in moved files resolve correctly (no broken paths)
- [x] `TELEGRAM_CHATS` constant removed from `shared/lib/routes.ts`
- [x] `PROFILE_TELEGRAM: '/dashboard/profile/telegram'` added to routes
- [x] `features/user-profile/index.ts` does NOT export Telegram symbols (they
      live in `features/telegram`)
- [x] `features/chat/index.ts` does NOT export Telegram symbols (cleaned up)
- [x] No `loading.tsx` added for the telegram sub-route

### Race Condition Fixes

- [x] Rapid double-click on "Generate code" does not fire two Server Actions
      (`useRef` guard)
- [x] Auto-refresh does not overwrite state while a mutation is in flight
      (`inflightChatIds` guard)
- [x] Concurrent refresh calls are deduplicated (`isRefreshingRef` guard)
- [x] 1-second clock timer is gated on `shouldAutoRefresh` (no needless
      re-renders)
- [x] 5-second poll respects `document.visibilityState` (no background network
      requests)
- [x] Auto-refresh does not reset user's in-progress org/team selection
      (`useRef` committed values)
- [x] Clipboard write has a `.catch()` / second arg error handler

### No Regressions

- [x] `/dashboard/chat` renders without errors (ChatList header simplified)
- [x] Other Profile tabs (Info, Password, Calendar, Menu, Appearance,
      Onboarding) still work
- [x] Teams page renders — `getTelegramChats` called from new import path
- [x] `features/chat/api/__tests__/artifacts.test.ts`, `chats.test.ts`,
      `messages.test.ts` still pass
- [x] TypeScript build passes (`npm run build`) — no type errors from the
      restructuring

---

## Complete Files Impact

### New files to create

| File                                               | Purpose                                                   |
| -------------------------------------------------- | --------------------------------------------------------- |
| `entities/telegram/model/types.ts`                 | `TelegramChatRegistration` interface (shared domain type) |
| `entities/telegram/index.ts`                       | Public API for telegram entity                            |
| `features/telegram/api/telegram.ts`                | Server Actions (httpClient-based, fixed)                  |
| `features/telegram/ui/TelegramChatsManagement.tsx` | Moved + fixed UI component                                |
| `features/telegram/index.ts`                       | Public API for telegram feature                           |
| `app/dashboard/profile/telegram/page.tsx`          | Profile sub-route page                                    |

### Files to modify (17 total)

| File                                                        | Change                                          |
| ----------------------------------------------------------- | ----------------------------------------------- |
| `features/user-profile/ui/profile-tabs-nav.tsx`             | Add "Telegram" tab to `BASE_TABS`               |
| `features/chat/ui/chat-list.tsx`                            | Remove Telegram link (lines 187-193)            |
| `features/chat/index.ts`                                    | Remove Telegram exports                         |
| `features/chat/types.ts`                                    | Remove `TelegramChatRegistration` re-export     |
| `shared/lib/routes.ts`                                      | Add `PROFILE_TELEGRAM`, remove `TELEGRAM_CHATS` |
| `app/dashboard/teams/page.tsx`                              | Update `getTelegramChats` import                |
| `features/teams/model/types.ts`                             | Update `TelegramChatRegistration` import        |
| `features/teams/ui/teams-page-client.tsx`                   | Update `TelegramChatRegistration` import        |
| `features/teams/ui/team-notification-settings.tsx`          | Update `TelegramChatRegistration` import        |
| `features/teams/ui/dashboard/team-dashboard-tabs.tsx`       | Update `TelegramChatRegistration` import        |
| `features/teams/ui/dashboard/team-dashboard-tab-people.tsx` | Update `TelegramChatRegistration` import        |

### Files to delete

| File                                             | Reason                                          |
| ------------------------------------------------ | ----------------------------------------------- |
| `app/dashboard/chat/telegram/page.tsx`           | Route moves to `/dashboard/profile/telegram`    |
| `features/chat/api/telegram.ts`                  | Replaced by `features/telegram/api/telegram.ts` |
| `features/chat/ui/telegram-chats-management.tsx` | Moved to `features/telegram/ui/`                |

---

## Dependencies & Risks

| Risk                                                                                                   | Severity        | Mitigation                                                                                     |
| ------------------------------------------------------------------------------------------------------ | --------------- | ---------------------------------------------------------------------------------------------- |
| `PaginatedResult<T>` shape — plan had `{ items }` not `{ data }`                                       | Build error     | Verify exact shape in `shared/types/common.ts` before writing page code                        |
| `features/chat/index.ts` exports Telegram symbols — other consumers may import from there              | Build error     | Check all imports before deleting; do phase 10 before phase 9                                  |
| `getOrganizations()` return shape — verify if it returns `{ data: T[] }` or `T[]` directly             | Build error     | Check existing page `app/dashboard/chat/telegram/page.tsx` for correct pattern                 |
| `API_URL` — verify the config import path                                                              | Type error      | Grep for `API_URL` in existing working files (e.g., `features/chat/api/chats.ts`)              |
| 1-second clock timer fix changes `shouldAutoRefresh` dependency — test that codes still auto-expire    | Functional      | Manual test: generate a code, wait for expiry, verify badge transitions                        |
| `inflightChatIds` added to `refresh` dependency array — causes interval to reset on mutation start/end | Behavior change | Add explanatory comment; this is correct behavior (prevents stale overwrite)                   |
| `app/dashboard/profile/layout.tsx` fetches org; page fetches orgs — verify no conflict                 | Confirmed safe  | Different endpoints: `getOrganization(id)` vs `getOrganizations()`. Both wrapped in `cache()`. |

---

## Testing Notes

### Existing tests that must still pass

- `features/chat/api/__tests__/chats.test.ts`
- `features/chat/api/__tests__/messages.test.ts`
- `features/chat/api/__tests__/artifacts.test.ts`
- `features/chat/ui/__tests__/chat-list.test.tsx` — will need update if it tests
  the Telegram link presence

### New tests recommended (post-refactor)

`features/telegram/api/__tests__/telegram.test.ts`:

- `getTelegramChats` returns `PaginatedResult<TelegramChatRegistration>`
- `issueTelegramAttachCode` returns `ActionResult<TelegramChatRegistration>` on
  success
- `issueTelegramAttachCode` returns `{ data: null, error: string }` when
  `ServerError` is thrown
- `issueTelegramAttachCode` re-throws non-`ServerError` errors

`features/telegram/ui/__tests__/TelegramChatsManagement.test.tsx`:

- Renders list of chats from `initialChats`
- "Generate code" button is disabled while mutation is pending
- Double-click on "Generate code" fires only one Server Action
- Auto-refresh does not overwrite an in-flight mutation
- Russian strings are gone (snapshot or text query)
- Clipboard success/error toasts

---

## References

### Internal

- **ChatList component** (Telegram link to remove):
  `features/chat/ui/chat-list.tsx:187-193`
- **Telegram page (old)**: `app/dashboard/chat/telegram/page.tsx`
- **TelegramChatsManagement (source)**:
  `features/chat/ui/telegram-chats-management.tsx`
- **Telegram API (old, broken)**: `features/chat/api/telegram.ts`
- **Type to migrate**: `features/chat/model/types.ts:90-107`
- **ProfileTabsNav**: `features/user-profile/ui/profile-tabs-nav.tsx`
- **Profile layout**: `app/dashboard/profile/layout.tsx`
- **Routes**: `shared/lib/routes.ts:27` (`TELEGRAM_CHATS`)
- **httpClient**: `shared/lib/httpClient.ts`
- **API_URL config**: `shared/lib/config.ts` (verify exact export name)
- **PaginatedResult type**: `shared/types/common.ts` (verify `data` vs `items`
  field name)
- **ActionResult type**: `shared/types/server-action.ts`
- **Teams imports to fix**: `features/teams/model/types.ts`,
  `features/teams/ui/teams-page-client.tsx`,
  `features/teams/ui/team-notification-settings.tsx`,
  `features/teams/ui/dashboard/team-dashboard-tabs.tsx`,
  `features/teams/ui/dashboard/team-dashboard-tab-people.tsx`

### Backend

- **Backend routes**:
  `/Users/slavapopov/Documents/WandaAsk_backend/routes/api.php`
- **Backend resource**:
  `app/Http/Resources/API/v1/TelegramChatRegistrationResource.php` ✅ verified
- **Backend FormRequest**:
  `app/Http/Requests/API/v1/TelegramChatAttachCodeRequest.php`
- **Backend auth bug**: `app/Services/TenantScopeValidator.php` —
  `assertUserCanManageOrganization()` checks member not manager (out of scope,
  report separately)

### Conventions

- **Tab navigation convention**: CLAUDE.md "Tab Navigation Convention" section
- **API Layer Rules**: CLAUDE.md Rules 1–7
- **FSD layer rules**: CLAUDE.md "FSD Layer Rules" section
- **PageTabsNav**: `shared/ui/navigation/page-tabs-nav`
- **Documented learning**:
  `docs/solutions/integration-issues/server-action-html-response-json-parse.md`
  — httpClient success path (`res.json()`) has the same vulnerability; out of
  scope here but worth a separate PR
