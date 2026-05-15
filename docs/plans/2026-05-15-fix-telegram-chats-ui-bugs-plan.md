---
title: fix: Telegram Chats UI — button width, label/placeholder overlap, inline form → modal
type: fix
status: completed
date: 2026-05-15
---

# fix: Telegram Chats UI Bugs

Three visual regressions in the Telegram Chats management page that need to be
fixed.

## Bug 1 — "Add chat" button stretches full-width on mobile

**File:** `features/telegram/ui/TelegramChatsManagement.tsx:105-116`

**Root cause:** The `Button` component has `fullWidth=true` as its default prop.
On mobile, the parent container switches to `flex-col` (breakpoint:
`sm:flex-row`), so each child becomes full-width. The `className='w-auto'`
override is applied last via `clsx`, but the Tailwind class `w-full` from the
`fullWidth` prop also compiles and may win due to specificity order in the
generated CSS.

**Fix:** Replace the `className='w-auto shrink-0 px-4'` override with the
explicit `fullWidth={false}` prop. This is the semantic/canonical way the Button
component is designed to handle this.

```tsx
// Before
<Button
  type='button'
  className='w-auto shrink-0 px-4'
  onClick={...}
>

// After
<Button
  type='button'
  fullWidth={false}
  className='shrink-0'
  onClick={...}
>
```

No changes to `Button.tsx` needed — `fullWidth={false}` renders `w-auto` (line
66 of `Button.tsx`). `shrink-0` must be kept: in `sm:flex-row` mode the button
can shrink when the title text is long without it.

---

## Bug 2 — Input floating label overlaps placeholder text

**File:** `shared/ui/input/Input.tsx:44-45` and
`features/telegram/ui/TelegramChatsManagement.tsx:129-149`

**Root cause:** The label renders in its resting "placeholder" position
(vertically centered, full size) at the same time as the HTML `placeholder`
attribute is visible. Both overlap.

The `hasValue` logic at line 44–45:

```ts
const hasValue =
  (value || rest.placeholder) !== undefined && (value || '').length > 0;
```

This evaluates to `false` when `value=''` even if `placeholder` is set — the
label stays in the large centered resting position while the `placeholder` text
is also displayed.

**Two possible fixes — choose one:**

### Option A — Fix `hasValue` in Input.tsx (global fix, affects all inputs)

When a `placeholder` prop is passed alongside a `label`, treat the label as
always floating-active. This prevents the overlap system-wide.

```ts
// shared/ui/input/Input.tsx line 44-45
// Old (broken — left side of && is always truthy, dead code):
// const hasValue = (value || rest.placeholder) !== undefined && (value || '').length > 0;
const hasValue = (value || '').length > 0 || (floating && !!rest.placeholder);
```

If the field has a value → float. If `floating=true` and a `placeholder` is
provided → always keep the label in small-top position so placeholder text is
always visible underneath.

**Risk:** Low — only changes behavior when both `label` and `placeholder` are
passed simultaneously, which was already visually broken. No inputs currently
rely on the broken behavior.

### Option B — Remove `placeholder` from the two Telegram inputs (local fix)

Since the Telegram inputs already have `label` that conveys the same meaning as
the placeholder, just remove the `placeholder` prop:

```tsx
// features/telegram/ui/TelegramChatsManagement.tsx
// Remove placeholder from both inputs
<Input
  {...register('telegram_chat_id', ...)}
  label='Telegram Chat ID'
  type='number'
  value={String(watch('telegram_chat_id') ?? '')}
  // placeholder='-1003888134038'  ← remove
  error={errors.telegram_chat_id?.message}
  disabled={isPending}
/>
<Input
  {...register('name')}
  label='Chat name (optional)'
  value={watch('name') ?? ''}
  // placeholder='Auto-detected if bot is in the chat'  ← remove
  error={errors.name?.message}
  disabled={isPending}
/>
```

**Risk:** Zero — only affects this one form.

**Recommendation:** Apply **Option A** as it fixes the bug at the root and
prevents future occurrences for any Input with both label and placeholder.

---

## Bug 3 — Inline "Add Telegram chat" form → Modal

**Current behavior:** The form expands inline below the header via `isFormOpen`
state. This causes layout shift and looks inconsistent with other add-item flows
in the project (e.g., `AddDecisionModal`, `ChatFormModal`, `KanbanCardModal`).

**Target behavior:** Clicking "+ Add chat" opens a `Modal` dialog with the form
inside.

### Files to create/modify

| File                                               | Action                                                    |
| -------------------------------------------------- | --------------------------------------------------------- |
| `features/telegram/ui/add-telegram-chat-modal.tsx` | **Create** — extract form into a new modal component      |
| `features/telegram/ui/TelegramChatsManagement.tsx` | **Modify** — remove inline form, import and use new modal |
| `features/telegram/index.ts`                       | No change needed (modal is internal to the feature)       |

### New file: `features/telegram/ui/add-telegram-chat-modal.tsx`

Extract the form (lines 120–215 of `TelegramChatsManagement.tsx`) into a
dedicated modal component. Follow the exact pattern from
`features/decisions/ui/add-decision-modal.tsx`.

**Important padding note:** `Modal` wraps children in `ModalBody` which already
applies `px-[var(--sp-6)] py-[var(--sp-5)]`. The form must NOT add its own `p-4`
— use `className='flex flex-col gap-4'` only.

**Double-submit guard:** Remove `isSubmittingRef` — it is redundant with
`useTransition`. `isPending=true` while the transition runs and the submit
button has `loading={isPending}` which disables it.

```tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { getTeams } from '@/entities/team/api/team';
import { createTelegramWorkspaceChat } from '@/features/telegram/api/telegram';
import {
  addTelegramChatSchema,
  type AddTelegramChatFormInput,
  type AddTelegramChatFormValues,
} from '@/features/telegram/model/schemas';
import { Button } from '@/shared/ui/button';
import Input from '@/shared/ui/input/Input';
import { TenantScopeFields } from '@/shared/ui/input/tenant-scope-fields';
import { Modal } from '@/shared/ui/modal/modal';

import type { OrganizationProps } from '@/entities/organization';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  organizations: OrganizationProps[];
  botUsername: string;
}

export function AddTelegramChatModal({
  isOpen,
  onClose,
  organizations,
  botUsername,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddTelegramChatFormInput, unknown, AddTelegramChatFormValues>({
    resolver: zodResolver(addTelegramChatSchema),
    defaultValues: { name: '', organization_id: '', team_id: '' },
  });

  const organizationId = watch('organization_id');
  const teamId = watch('team_id');

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (values: AddTelegramChatFormValues) => {
    startTransition(async () => {
      const result = await createTelegramWorkspaceChat({
        telegram_chat_id: values.telegram_chat_id,
        organization_id: Number(values.organization_id),
        team_id: values.team_id ? Number(values.team_id) : null,
        name: values.name ?? null,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        result.data?.is_bound
          ? 'Chat registered and bot is already active'
          : 'Chat registered — add the bot to activate it',
      );
      handleClose();
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title='Add Telegram chat'
      size='md'
    >
      {/* No p-4 here — ModalBody already provides padding */}
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Input
            {...register('telegram_chat_id', {
              setValueAs: (v: string) =>
                v === '' ? undefined : Number.parseInt(v, 10),
            })}
            label='Telegram Chat ID'
            type='number'
            value={String(watch('telegram_chat_id') ?? '')}
            error={errors.telegram_chat_id?.message}
            disabled={isPending}
          />
          <Input
            {...register('name')}
            label='Chat name (optional)'
            value={watch('name') ?? ''}
            error={errors.name?.message}
            disabled={isPending}
          />
        </div>

        <TenantScopeFields
          organizations={organizations}
          organizationId={organizationId}
          teamId={teamId ?? ''}
          fetchTeams={getTeams}
          onOrganizationChange={(value) => {
            setValue('organization_id', value, { shouldValidate: true });
            setValue('team_id', '');
          }}
          onTeamChange={(value) => {
            setValue('team_id', value, { shouldValidate: true });
          }}
          organizationError={errors.organization_id?.message}
          disabled={isPending}
        />

        <div className='rounded-[var(--radius-card)] border border-border bg-background/40 p-4 text-sm text-muted-foreground'>
          <p className='font-medium text-foreground'>
            How to find your Telegram Chat ID
          </p>
          <ol className='mt-2 flex flex-col gap-1 ps-4 [list-style:decimal]'>
            <li>
              Forward a message from the group to{' '}
              <span className='font-mono text-foreground'>@userinfobot</span> —
              it will reply with the chat ID
            </li>
            <li>Enter the ID above and save</li>
            <li>
              Add{' '}
              <span className='font-mono text-foreground'>
                @{'{'}botUsername{'}'}
              </span>{' '}
              as an administrator to the group
            </li>
            <li>
              Status will automatically change to{' '}
              <span className='font-medium text-foreground'>Active</span>
            </li>
          </ol>
        </div>

        <div className='flex justify-end gap-2 pt-2'>
          <Button
            type='button'
            variant='secondary'
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type='submit' loading={isPending} loadingText='Saving…'>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

### Modified: `features/telegram/ui/TelegramChatsManagement.tsx`

- Remove `isFormOpen` state and the entire inline
  `{isFormOpen ? (<form ...>) : null}` block
- Replace with `isModalOpen` state
- Import `AddTelegramChatModal` and render it
- Remove `useRef`, `useTransition`, `useForm` imports (they move to the modal)
- The "Add chat" `Button` sets `isModalOpen(true)` instead

Simplified result:

```tsx
// features/telegram/ui/TelegramChatsManagement.tsx
export function TelegramChatsManagement({
  initialChats,
  organizations,
  orgMap,
  botUsername,
}: TelegramChatsManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold text-foreground'>Telegram chats</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Register your Telegram group chats to connect them with your organization.
          </p>
        </div>
        <Button
          type='button'
          fullWidth={false}
          className='shrink-0'
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className='h-4 w-4' />
          Add chat
        </Button>
      </div>

      <AddTelegramChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        organizations={organizations}
        botUsername={botUsername}
      />

      {initialChats.length === 0 ? (
        <EmptyState ... />
      ) : (
        initialChats.map(chat => <TelegramChatCard key={chat.id} ... />)
      )}
    </div>
  );
}
```

---

## Acceptance Criteria

- [x] "Add chat" button renders at auto/content width on all screen sizes
      (mobile included) — does not stretch to full container width
- [x] Input fields with `label` and no value do not overlap with `placeholder`
      text (label stays at top, small, when placeholder is present)
- [x] Clicking "+ Add chat" opens a modal dialog — no inline form expansion
- [x] Modal closes on: successful save, Cancel button, Escape key, backdrop
      click
- [x] After successful save, the chat list updates (revalidatePath already
      handles this in the server action)
- [x] Form resets on modal close (cancel or success)
- [x] All existing behavior preserved: validation errors, loading state, toast
      notifications

## Implementation Order

1. Fix `shared/ui/input/Input.tsx` — `hasValue` logic (Option A)
2. Create `features/telegram/ui/add-telegram-chat-modal.tsx`
3. Update `features/telegram/ui/TelegramChatsManagement.tsx` — remove inline
   form, use modal, fix button prop

## References

- Modal pattern: `features/decisions/ui/add-decision-modal.tsx`
- Button fullWidth prop: `shared/ui/button/Button.tsx:43,66`
- Input floating label: `shared/ui/input/Input.tsx:44-45,61`
- Current Telegram management:
  `features/telegram/ui/TelegramChatsManagement.tsx`
