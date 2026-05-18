---
title: 'feat: Telegram chats — direct registration (replace attach-code flow)'
type: feat
status: completed
date: 2026-05-15
---

# feat: Telegram Chats — Direct Registration

## Enhancement Summary

**Deepened on:** 2026-05-15 **Research agents used:**
kieran-typescript-reviewer, security-sentinel, performance-oracle,
code-simplicity-reviewer, architecture-strategist,
julik-frontend-races-reviewer, best-practices-researcher, general-purpose
(correctness/gaps)

### Key Improvements Over Original Plan

1. **Critical: Zod schema uses `setValueAs` not `valueAsNumber`** — empty
   `type="number"` input returns `NaN` with `valueAsNumber`; use
   `register('telegram_chat_id', { setValueAs: v => v === '' ? undefined : parseInt(v, 10) })`
   instead of `Controller`
2. **Critical: Telegram IDs must be negative** — schema must use `.negative()`
   not `.refine(n => n !== 0)`, with a helpful message
3. **Critical: `organization_id`/`team_id` must be stored as `string` in the
   form** — `TenantScopeFields` works with `string` values internally; coerce to
   `number` only at submit time
4. **Critical: Bot username needs an env var** — add
   `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` to `.env.example`; display
   `@${botUsername}` in instructions
5. **Critical: Two `useRef` guards needed** — double-submit on create +
   double-click on delete confirm both need `isSubmittingRef`/`isDeletingRef`
   guards
6. **Architecture fix: `TelegramWorkspaceChatCreatePayload` must live in
   `model/types.ts`** — not in `api/telegram.ts` (CLAUDE.md rule)
7. **Simplification: Use `router.refresh()` instead of local `chats` state** —
   drop `useState(initialChats)`, render from `initialChats` prop directly, call
   `router.refresh()` after mutations (removes ~20 LOC)
8. **Performance: Slim `organizations` prop at the page level** — strip to
   `{ id: number; name: string }` before serializing to client
9. **Backend security issues found** — see Security section; two HIGH-severity
   issues in the backend should be fixed alongside this frontend change

### New Considerations Discovered

- `useState(initialChats)` does NOT re-initialize when RSC re-renders after
  `router.refresh()` — this is why the plan must use `router.refresh()` + direct
  prop rendering instead of local list state
- `z.number({ error: '...' })` is valid Zod v4 syntax (alias: both `error` and
  `message` work), but chained constraints use their own error messages
- `chatStatusBadge` should be named `ChatStatusBadge` and rendered as a
  component (`<ChatStatusBadge chat={chat} />`), not called as a function
- `TelegramChatCard` should be extracted to its own file given the component
  file will be large
- The `name` POST field is write-only — it is NOT returned in the Resource
  response; the card always uses `chat_title` as the display title
- `ButtonIcon` uses `onClickAction` prop, not `onClick` — using the wrong name
  causes silent failure

---

## Overview

Replace the old `/attach CODE` mechanism (fully removed on the backend) with a
new direct-registration flow. The page now lets managers:

1. **List** registered workspace chats from `GET /api/v1/telegram/chats`
2. **Add** a chat by submitting `POST /api/v1/telegram/chats` with
   `telegram_chat_id` + `organization_id` + optional `team_id` + optional `name`
3. **Delete** a chat registration via `DELETE /api/v1/telegram/chats/{id}` (not
   allowed for private chats — API returns 422)

Status is now a simple **binary**: `is_bound` (true = active, false = waiting
for bot). All attach-code logic, 5-second polling, code expiry timers,
`issueTelegramAttachCode`, and related state are removed.

---

## Backend Contracts (verified against commit `8f6db10b`)

### `TelegramChatRegistration` Resource (exact fields returned by API)

```ts
// entities/telegram/model/types.ts — full replacement
export interface TelegramChatRegistration {
  id: number;
  channel_conversation_id: number | null; // was string | null — fixed to number
  user_id: number | null;
  telegram_chat_id: number; // was string | number — fixed to number
  message_thread_id: number | null; // was string | number | null — fixed to number
  chat_type: 'private' | 'group' | 'supergroup' | null;
  chat_title: string | null;
  organization_id: number | null;
  team_id: number | null;
  attach_code: string | null; // always null now — keep field, never render
  attach_command: string | null; // always null now — keep field, never render
  attach_code_expires_at: string | null; // always null now
  attach_code_used_at: string | null; // always null now
  is_bound: boolean; // NEW — add this field
  bound_at: string | null;
  created_at: string;
  updated_at: string;
}
```

> **Note on unused fields:** `attach_code`, `attach_command`,
> `attach_code_expires_at`, `attach_code_used_at` are kept in the interface
> because the backend still returns them (always `null`). They must never be
> rendered. The fields serve as an explicit reminder of what was removed and let
> the type compile if legacy code is encountered.

### POST payload (defined in `features/telegram/model/types.ts`, not in api/)

```ts
// features/telegram/model/types.ts
export interface TelegramWorkspaceChatCreatePayload {
  telegram_chat_id: number; // required, negative integer for groups
  organization_id: number; // required
  team_id: number | null; // optional
  name: string | null; // optional — write-only, NOT returned in the Resource
}
```

### DELETE response

On success: `{ success: true, data: null }` — no body to parse. On private-chat
delete attempt:
`{ success: false, data: null, message: "Private chats cannot be removed from the workspace chat list.", status: 422 }`
— no `errorCode`, just `message`.

### Validation errors from POST (Laravel 422)

- `telegram_chat_id` already registered → field error on `telegram_chat_id`:
  `"A workspace chat with this Telegram chat ID is already registered."`
- Standard required/type errors per field

---

## What to Change

### 1. `entities/telegram/model/types.ts`

Replace the entire interface with the corrected version above. Key fixes:

- `channel_conversation_id: number | null` (was `string | null`)
- `telegram_chat_id: number` (was `string | number`)
- `message_thread_id: number | null` (was `string | number | null`)
- Add `is_bound: boolean`

Do NOT create a second parallel interface — update the existing one in place.

### 2. `.env.example` (new env var)

Add:

```
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=wandabot
```

Then in `shared/lib/config.ts` (or wherever `API_URL` etc. are exported):

```ts
export const TELEGRAM_BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? null;
```

This is used in the "Add workspace chat" instruction text to show `@botname` to
managers.

### 3. `features/telegram/model/types.ts` (new file)

```ts
export interface TelegramWorkspaceChatCreatePayload {
  telegram_chat_id: number;
  organization_id: number;
  team_id: number | null;
  name: string | null;
}
```

### 4. `features/telegram/model/schemas.ts` (new file)

```ts
import { z } from 'zod';

export const addTelegramChatSchema = z.object({
  // telegram_chat_id is handled with register + setValueAs, not Controller
  // The schema receives the already-coerced number (or undefined if empty)
  telegram_chat_id: z
    .number({ error: 'Required — enter a group Chat ID' })
    .int()
    .negative({
      message: 'Group Chat IDs must be negative (e.g. -1003888134038)',
    }),
  name: z
    .string()
    .max(255)
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
  // TenantScopeFields uses string values internally — coerce to number at submit time
  organization_id: z.string().min(1, 'Select an organization'),
  team_id: z.string().optional(),
});

export type AddTelegramChatFormValues = z.infer<typeof addTelegramChatSchema>;
```

**Key decisions:**

- `telegram_chat_id` uses `register` with `setValueAs` (not `Controller`) so
  empty input sends `undefined` → triggers "Required" message correctly.
  `valueAsNumber` returns `NaN` for empty input which Zod cannot distinguish
  from a type error.
- `organization_id` and `team_id` are `string` types — `TenantScopeFields` works
  with strings; coerce to `number` at submit.
- `name` transforms `''` and `undefined` to `null` to match the backend's
  `nullable string` type.

**At submit time, coerce to payload:**

```ts
const payload: TelegramWorkspaceChatCreatePayload = {
  telegram_chat_id: values.telegram_chat_id,
  organization_id: Number(values.organization_id),
  team_id: values.team_id ? Number(values.team_id) : null,
  name: values.name, // already null | string after transform
};
```

### 5. `features/telegram/api/telegram.ts`

**Remove:**

- `issueTelegramAttachCode()` — endpoint deleted from backend

**Add:**

- `createTelegramWorkspaceChat(payload)` — POST `/telegram/chats`
- `deleteTelegramWorkspaceChat(id)` — DELETE `/telegram/chats/{id}`

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { parseApiError } from '@/shared/lib/apiError';
import { API_URL } from '@/shared/lib/config';
import { ServerError } from '@/shared/lib/errors';
import { httpClient, httpClientList } from '@/shared/lib/httpClient';
import type { TelegramChatRegistration } from '@/entities/telegram';
import type { TelegramWorkspaceChatCreatePayload } from '@/features/telegram/model/types';
import type { ActionResult } from '@/shared/types/server-action';

export async function getTelegramChats() {
  return httpClientList<TelegramChatRegistration>(`${API_URL}/telegram/chats`);
}

export async function createTelegramWorkspaceChat(
  payload: TelegramWorkspaceChatCreatePayload,
): Promise<ActionResult<TelegramChatRegistration>> {
  try {
    const { data } = await httpClient<TelegramChatRegistration>(
      `${API_URL}/telegram/chats`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      },
    );
    if (!data) {
      throw new ServerError('Empty response from server', {
        url: `${API_URL}/telegram/chats`,
        status: 200,
      });
    }
    revalidatePath('/dashboard/profile/telegram');
    return { data, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to register chat',
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

export async function deleteTelegramWorkspaceChat(
  id: number,
): Promise<ActionResult<void>> {
  try {
    await httpClient<null>(`${API_URL}/telegram/chats/${id}`, {
      method: 'DELETE',
    });
    revalidatePath('/dashboard/profile/telegram');
    return { data: undefined, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to remove chat',
      );
      return { data: undefined, error: parsed.message };
    }
    throw error;
  }
}
```

> **Note:** Using `ActionResult<void>` (not `ActionResult<null>`) for delete —
> with `ActionResult<null>` both success and error branches have `data: null`,
> making `if (result.data)` always falsy and confusing. `ActionResult<void>`
> makes the success/error distinction explicit via `result.error`.

### 6. `features/telegram/ui/telegram-chat-card.tsx` (new file — extracted)

Extract `TelegramChatCard` to its own file for maintainability. The rewrite
makes `TelegramChatsManagement.tsx` large enough (form + list + card) that
co-location hurts readability.

**Props:**

```ts
interface TelegramChatCardProps {
  chat: TelegramChatRegistration;
  organizations: Array<{ id: number; name: string }>;
  onDelete: (id: number) => void;
}
```

**Key rendering decisions:**

- Status badge: extract as a `ChatStatusBadge` component (capital C — returns
  JSX, must be a component not a function)
- Chat title: `chat.chat_title?.trim() || \`Telegram chat
  #${chat.telegram_chat_id}\``
- Organization:
  `organizations.find(o => o.id === chat.organization_id)?.name ?? \`Org
  #${chat.organization_id}\``
- Team: `chat.team_id ? \`Team #${chat.team_id}\` : '—'` (raw ID acceptable;
  full name resolution needs extra API call)
- `chat_type` display: use `formatChatType()` helper (see below) — "supergroup"
  → "Supergroup"
- Delete button: `ButtonIcon` with `onClickAction` prop (NOT `onClick` — wrong
  prop name would silently fail), `Trash2` icon, `variant="danger"`,
  `aria-label="Remove chat"` — hidden for `chat.chat_type === 'private'`

**`formatChatType` helper:**

```ts
function formatChatType(type: string | null): string {
  if (!type) return 'Unknown';
  if (type === 'supergroup') return 'Supergroup';
  return type.charAt(0).toUpperCase() + type.slice(1);
}
```

**`ChatStatusBadge` component:**

```tsx
function ChatStatusBadge({ chat }: { chat: TelegramChatRegistration }) {
  if (chat.chat_type === 'private') {
    return <Badge variant='default'>Private</Badge>;
  }
  return chat.is_bound ? (
    <Badge variant='success' dot>
      Active
    </Badge>
  ) : (
    <Badge variant='warning' dot>
      Waiting for bot
    </Badge>
  );
}
```

**Inline two-step delete confirmation with `useRef` guard:**

```tsx
const isDeletingRef = useRef(false);
const [isConfirming, setIsConfirming] = useState(false);
const [isPending, startTransition] = useTransition();

const handleConfirmDelete = () => {
  if (isDeletingRef.current) return;
  isDeletingRef.current = true;

  startTransition(async () => {
    try {
      const result = await deleteTelegramWorkspaceChat(chat.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      onDelete(chat.id);
      toast.success('Chat removed');
    } finally {
      isDeletingRef.current = false;
      setIsConfirming(false);
    }
  });
};
```

The `isDeletingRef` guard prevents double-click firing two DELETE requests
before `isPending` from `useTransition` is set (React transition pending state
is not synchronous — a second click can slip through before the first render).

**`is_bound = false` info banner:**

```tsx
{
  !chat.is_bound && chat.chat_type !== 'private' ? (
    <div className='rounded-[var(--radius-card)] border border-warning/20 bg-warning/10 p-4 text-sm'>
      <p className='font-medium text-foreground'>Bot not yet in group</p>
      <p className='mt-1 text-muted-foreground'>
        Add the bot as an administrator to the Telegram group for this chat to
        activate.
      </p>
    </div>
  ) : null;
}
```

### 7. `features/telegram/ui/TelegramChatsManagement.tsx` — rewrite

**State: no `useState` for the chats list.** Render directly from `initialChats`
prop and use `router.refresh()` after mutations. This avoids the
`useState(initialChats)` gotcha — `useState` only reads the initial value once
at mount; if the component re-renders with new props from RSC after
`router.refresh()`, local state would not update.

```ts
// Simpler state: no chats array in state
const router = useRouter();

// After create: router.refresh() re-fetches from server
// After delete: same
```

**Props:**

```ts
interface TelegramChatsManagementProps {
  initialChats: TelegramChatRegistration[];
  organizations: Array<{ id: number; name: string }>; // slimmed — only id + name needed
}
```

**Add Chat form (react-hook-form + Zod):**

```tsx
const form = useForm<AddTelegramChatFormValues>({
  resolver: zodResolver(addTelegramChatSchema),
  defaultValues: {
    name: '',
    organization_id: '',
    team_id: '',
  },
});

// telegram_chat_id: use register with setValueAs (NOT Controller/valueAsNumber)
<Input
  type='number'
  inputMode='numeric'
  label='Telegram Chat ID'
  placeholder='-1003888134038'
  error={form.formState.errors.telegram_chat_id?.message}
  {...form.register('telegram_chat_id', {
    setValueAs: (v: string) => (v === '' ? undefined : parseInt(v, 10)),
  })}
/>;
```

**Submit handler with `useRef` guard:**

```ts
const isSubmittingRef = useRef(false);

const onSubmit = form.handleSubmit(async (values) => {
  if (isSubmittingRef.current) return;
  isSubmittingRef.current = true;

  try {
    const payload: TelegramWorkspaceChatCreatePayload = {
      telegram_chat_id: values.telegram_chat_id,
      organization_id: Number(values.organization_id),
      team_id: values.team_id ? Number(values.team_id) : null,
      name: values.name,
    };

    const result = await createTelegramWorkspaceChat(payload);

    if (result.error) {
      if (result.fieldErrors?.telegram_chat_id) {
        form.setError('telegram_chat_id', {
          message: result.fieldErrors.telegram_chat_id,
        });
      } else {
        form.setError('root', { message: result.error });
      }
      return;
    }

    toast.success('Chat registered');
    form.reset();
    router.refresh();
  } finally {
    isSubmittingRef.current = false;
  }
});
```

**After delete** (callback from `TelegramChatCard`):

```ts
const handleDeleteChat = () => {
  router.refresh();
};
```

**Layout:**

```
┌─── Header card ──────────────────────────────────────────────┐
│  "Telegram chats"  subtitle                                   │
│  [Web chats link]  (keep existing ButtonLink)                 │
└───────────────────────────────────────────────────────────────┘
┌─── Add workspace chat ───────────────────────────────────────┐
│  "Add workspace chat" heading                                 │
│  [Telegram Chat ID input]   [Name input (optional)]          │
│  [Organization select]      [Team select (optional)]         │
│  ── Instructions ────────────────────────────────────────── │
│  1. Get group ID via @userinfobot or forward a message       │
│  2. Enter the ID here (it's always negative, e.g. -100123)   │
│  3. Add @{botUsername ?? 'the bot'} as admin to the group    │
│  4. Status will become "Active" automatically                 │
│  [root error display]                                         │
│  [Add chat  button  loading={isSubmitting}]                  │
└───────────────────────────────────────────────────────────────┘
┌─── Chat list ────────────────────────────────────────────────┐
│  TelegramChatCard × N  (or EmptyState if initialChats empty) │
└───────────────────────────────────────────────────────────────┘
```

Form disabled state: pass `disabled={form.formState.isSubmitting}` to all inputs
and `TenantScopeFields` to prevent editing mid-submission.

### 8. `features/telegram/index.ts`

```ts
export {
  getTelegramChats,
  createTelegramWorkspaceChat,
  deleteTelegramWorkspaceChat,
} from './api/telegram';
export { TelegramChatsManagement } from './ui/TelegramChatsManagement';
export type { TelegramWorkspaceChatCreatePayload } from './model/types';
```

Remove `issueTelegramAttachCode` export.

### 9. `app/dashboard/profile/telegram/page.tsx`

Slim the `organizations` prop before passing to the Client Component:

```ts
export default async function TelegramPage() {
  const [{ data: chats }, { data: organizations }] = await Promise.all([
    getTelegramChats(),
    getOrganizations(),
  ]);

  // Strip heavy optional fields (issue_types, team_map, context) before serialization
  const slimOrgs = (organizations ?? []).map(({ id, name }) => ({ id, name }));

  return (
    <TelegramChatsManagement
      initialChats={chats ?? []}
      organizations={slimOrgs}
    />
  );
}
```

This avoids serializing up to 50+ `OrganizationProps` objects with heavy
optional fields (`issue_types`, `team_map`, `context`) across the RSC wire when
only `id` and `name` are needed.

### 10. `app/dashboard/profile/telegram/loading.tsx` (new file)

```tsx
import { SkeletonList } from '@/shared/ui/layout/skeleton';

export default function TelegramLoading() {
  return <SkeletonList count={3} />;
}
```

---

## Dead Code to Remove

| Location                                           | Dead code                                            | Reason                                             |
| -------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| `features/telegram/api/telegram.ts`                | `issueTelegramAttachCode()`                          | Endpoint deleted from backend                      |
| `features/telegram/ui/TelegramChatsManagement.tsx` | `TelegramDisplayStatus` type                         | Replaced by `is_bound` boolean                     |
| same                                               | `getTelegramStatus()`                                | No longer needed                                   |
| same                                               | `statusBadgeProps()`                                 | Replaced by `ChatStatusBadge` component            |
| same                                               | `replaceTelegramChat()`                              | No longer used — no local chats state              |
| same                                               | `mergeRefreshedChats()`                              | No auto-refresh                                    |
| same                                               | `shouldAutoRefresh` useMemo                          | No polling                                         |
| same                                               | Both auto-refresh `useEffect`s                       | No polling                                         |
| same                                               | `inflightChatIds` + `addInflight` + `removeInflight` | No inflight tracking needed                        |
| same                                               | `isMutatingRef` in `TelegramChatCard`                | No longer needed (replaced by new `isDeletingRef`) |
| same                                               | `lastCommittedOrgId/TeamId` refs                     | No auto-refresh to guard against                   |
| same                                               | `handleCopyCommand`, `handleGenerateCode`            | Attach-code flow removed                           |
| same                                               | `canGenerateCode`, `isExpired`, `expirationLabel`    | Attach-code flow removed                           |
| same                                               | `TenantScopeFields` block inside `TelegramChatCard`  | Scope is set at creation, not on the card          |
| same                                               | Attach-command code block                            | Attach-code flow removed                           |
| same                                               | `issueTelegramAttachCode` import                     | Function removed                                   |
| same                                               | `RefreshCw`, `TimerReset`, `Copy` lucide imports     | Icons no longer used                               |
| same                                               | Refresh button on each card                          | Not needed without polling                         |

---

## Edge Cases

| Scenario                                  | Handling                                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `chat_title` is null                      | Show `"Telegram chat #${chat.telegram_chat_id}"` as fallback                                                     |
| `organization_id` null (private chat)     | Show `"—"` for org field                                                                                         |
| Organization deleted after registration   | `organizations.find(...)?.name ?? \`Org #${chat.organization_id}\`` — show ID as fallback                        |
| Delete private chat                       | Delete button hidden for `chat_type === 'private'`; backend 422 guard handles edge case where type is null/stale |
| Duplicate `telegram_chat_id` on POST      | Field error on `telegram_chat_id` → displayed under the input via `setError`                                     |
| `is_bound = false` (bot not in group yet) | Show yellow "Waiting for bot" badge + info banner with instruction                                               |
| `team_id` non-null                        | Show `"Team #${chat.team_id}"` — full name needs extra API call per card (not worth it)                          |
| Empty chat list                           | Use `EmptyState` from `shared/ui/feedback/empty-state`                                                           |
| Form reset after success                  | `form.reset()` from `useForm` after successful create                                                            |
| User submits form twice rapidly           | `isSubmittingRef = useRef(false)` guard prevents second Server Action from firing                                |
| User clicks delete confirm twice          | `isDeletingRef = useRef(false)` guard prevents second DELETE request                                             |
| `telegram_chat_id` positive number        | Schema `.negative()` rejects it with "Group Chat IDs must be negative" message                                   |
| `telegram_chat_id` empty input            | `setValueAs` converts `""` → `undefined` → triggers "Required" error via Zod                                     |
| Bot username not configured               | Show `"the bot"` as fallback when `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` is unset                                   |
| `chat_type` is null (unusual state)       | `formatChatType(null)` returns "Unknown"; delete button visible (backend enforces its own guard)                 |

---

## Security Notes

The backend security audit found these issues that should be fixed **in the
backend repo** as part of or alongside this frontend change:

| Severity | Issue                                                                                                                            | Backend fix needed                                                                       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| HIGH     | `assertUserCanManageOrganization` uses member check instead of manager check — any employee can register workspace chats         | Change `isOrganizationMember` → `isOrganizationManager` in `TenantScopeValidator.php:65` |
| HIGH     | `GET /telegram/chats` returns all non-private chats cross-tenant (no org filter) — leaks chat metadata to any authenticated user | Add org-scope filter to `index()` in `TelegramChatRegistrationController.php`            |
| MEDIUM   | `DELETE` endpoint has no authorization check — any user can delete any org's chat                                                | Add `assertScopeIsValid` + `assertUserCanManageOrganization` to `destroy()`              |
| MEDIUM   | `telegram_chat_id` stored as `unsignedBigInteger` but Telegram group IDs are negative integers                                   | Change column to signed `bigInteger` in a new migration                                  |
| LOW      | No rate limiting on `POST /telegram/chats`                                                                                       | Add `throttle:20,1` to the store route                                                   |

The frontend is not vulnerable to these issues from a client-side perspective
(React escapes output, Server Actions have auth headers), but the backend
vulnerabilities allow cross-tenant data access.

---

## Acceptance Criteria

- [ ] `GET /api/v1/telegram/chats` response drives the chat list; `is_bound`
      field drives status badge
- [ ] Status badge: `is_bound = true` →
      `<Badge variant="success" dot>Active</Badge>`; `is_bound = false` →
      `<Badge variant="warning" dot>Waiting for bot</Badge>`; private chat →
      `<Badge variant="default">Private</Badge>`
- [ ] "Add workspace chat" form: Telegram Chat ID (required, must be negative
      integer), Name (optional), Organization (required), Team (optional via
      TenantScopeFields)
- [ ] `telegram_chat_id` field uses `register` + `setValueAs` — not
      `Controller` + `valueAsNumber`
- [ ] `organization_id` and `team_id` stored as `string` in form; coerced to
      `number` at submit
- [ ] Entering a positive Chat ID shows "Group Chat IDs must be negative" error
- [ ] Empty Chat ID input shows "Required" error (not a NaN type error)
- [ ] On successful POST: `toast.success('Chat registered')` + `form.reset()` +
      `router.refresh()`
- [ ] Field error from backend (`telegram_chat_id` duplicate) rendered under the
      input
- [ ] Root error rendered above the submit button
- [ ] Delete button visible only on non-private chats; uses `onClickAction` prop
      (not `onClick`) on `ButtonIcon`
- [ ] Delete has two-step inline confirmation; confirm button is
      `disabled={isPending}` via `useTransition`
- [ ] `isDeletingRef` ref guard prevents double-delete from rapid clicks
- [ ] `isSubmittingRef` ref guard prevents double-create from rapid clicks
- [ ] After delete: `router.refresh()` re-fetches the list from server
- [ ] No attach-code UI anywhere on the page
- [ ] No polling / auto-refresh (removed)
- [ ] `entities/telegram/model/types.ts` has `is_bound: boolean` and corrected
      field types
- [ ] `TelegramWorkspaceChatCreatePayload` defined in
      `features/telegram/model/types.ts` (not in api/)
- [ ] `issueTelegramAttachCode` fully deleted; no import or call remains
- [ ] `attach_code`, `attach_command`, `attach_code_expires_at`,
      `attach_code_used_at` never rendered
- [ ] `app/dashboard/profile/telegram/loading.tsx` exists with skeleton loader
- [ ] `revalidatePath('/dashboard/profile/telegram')` called after create and
      delete
- [ ] `organizations` prop slimmed to `{ id: number; name: string }[]` at the
      page level
- [ ] `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` added to `.env.example`
- [ ] `@{botUsername}` shown in instructions (or "the bot" fallback if env var
      not set)
- [ ] Bot status instruction is shown under the add-chat form
- [ ] `ChatStatusBadge` is a proper React component (capital C), not a plain
      function returning JSX
- [ ] `TelegramChatCard` extracted to
      `features/telegram/ui/telegram-chat-card.tsx`
- [ ] `formatChatType()` helper formats "supergroup" → "Supergroup"
- [ ] Form inputs all have `disabled={isSubmitting}` during submission

---

## Files to Change

| File                                               | Action                                                                                              |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `entities/telegram/model/types.ts`                 | Update types — fix field types, add `is_bound`, keep deprecated null fields                         |
| `entities/telegram/index.ts`                       | Verify `TelegramChatRegistration` is re-exported (probably no change)                               |
| `features/telegram/model/types.ts`                 | NEW — `TelegramWorkspaceChatCreatePayload` interface                                                |
| `features/telegram/model/schemas.ts`               | NEW — Zod schema for add-chat form                                                                  |
| `features/telegram/api/telegram.ts`                | Remove `issueTelegramAttachCode`, add `createTelegramWorkspaceChat` + `deleteTelegramWorkspaceChat` |
| `features/telegram/ui/telegram-chat-card.tsx`      | NEW — extracted `TelegramChatCard` component                                                        |
| `features/telegram/ui/TelegramChatsManagement.tsx` | Full rewrite — new form + simplified list, no local chats state                                     |
| `features/telegram/index.ts`                       | Update exports                                                                                      |
| `app/dashboard/profile/telegram/page.tsx`          | Slim `organizations` prop (strip to `{id, name}`)                                                   |
| `app/dashboard/profile/telegram/loading.tsx`       | NEW — skeleton loading state                                                                        |
| `.env.example`                                     | Add `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`                                                             |
| `shared/lib/config.ts`                             | Add `TELEGRAM_BOT_USERNAME` export                                                                  |

---

## Shared Components Used (no new components needed)

| Component                       | Import path                             | Key props / notes                                                           |
| ------------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| `Badge`                         | `@/shared/ui/badge`                     | `success`/`warning`/`default` variants + `dot` prop                         |
| `Button`                        | `@/shared/ui/button`                    | `loading={isSubmitting}` on submit; `loading={isPending}` on confirm delete |
| `ButtonIcon`                    | `@/shared/ui/button`                    | `onClickAction` (NOT `onClick`), `Trash2` icon, `variant="danger"`          |
| `ButtonLink`                    | `@/shared/ui/button`                    | "Web chats" link (existing, keep)                                           |
| `Card`, `CardBody`              | `@/shared/ui/card`                      | Section wrappers                                                            |
| `Input`                         | `@/shared/ui/input/Input`               | Chat ID (`type="number"`, `inputMode="numeric"`, register+setValueAs), Name |
| `TenantScopeFields`             | `@/shared/ui/input/tenant-scope-fields` | Organization + Team selects (uses string values)                            |
| `EmptyState`                    | `@/shared/ui/feedback/empty-state`      | Empty chat list                                                             |
| `Skeleton`, `SkeletonList`      | `@/shared/ui/layout/skeleton`           | loading.tsx                                                                 |
| `Bot`, `Trash2`, `ExternalLink` | `lucide-react`                          | Icons                                                                       |

---

## References

### Internal

- Backend commit: `8f6db10b534dd84f82fc93c8db2c29fe100010ef`
- Backend controller:
  `/Users/slavapopov/Documents/WandaAsk_backend/app/Http/Controllers/API/v1/TelegramChatRegistrationController.php`
- Backend resource:
  `/Users/slavapopov/Documents/WandaAsk_backend/app/Http/Resources/API/v1/TelegramChatRegistrationResource.php`
- Backend FormRequest:
  `/Users/slavapopov/Documents/WandaAsk_backend/app/Http/Requests/API/v1/TelegramWorkspaceChatCreateRequest.php`
- Frontend page: `app/dashboard/profile/telegram/page.tsx`
- Existing UI (full rewrite): `features/telegram/ui/TelegramChatsManagement.tsx`
- TenantScopeFields: `shared/ui/input/tenant-scope-fields.tsx`
- Badge: `shared/ui/badge/Badge.tsx` — variants: `success`, `warning`,
  `default`, `neutral`, `danger`, `info`
- ButtonIcon: `shared/ui/button/button-icon.tsx` — use `onClickAction` prop
- EmptyState: `shared/ui/feedback/empty-state.tsx`
- Institutions learning:
  `docs/solutions/integration-issues/server-action-html-response-json-parse.md`
  — already addressed by using `httpClient` which handles HTML error responses
  internally

### External

- [Zod v4 error customization](https://zod.dev/error-customization)
- [react-hook-form setValueAs for number inputs](https://react-hook-form.com/docs/useform/register)
- [Next.js router.refresh() — preserves client state](https://nextjs.org/docs/app/api-reference/functions/use-router)
- [Next.js mutating data with Server Actions](https://nextjs.org/docs/app/getting-started/mutating-data)
- [Cloudscape delete confirmation pattern](https://cloudscape.design/patterns/resource-management/delete/delete-with-additional-confirmation/)
