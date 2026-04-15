---
title: refactor: Use shared Input component in profile forms
type: refactor
status: completed
date: 2026-04-13
---

# refactor: Use shared Input component in profile forms

♻️ Replace raw `<input>` elements in the two user profile forms with the shared
`Input` / `InputPassword` components from `shared/ui/input/`.

## Overview

`ProfileForm.tsx` and `ChangePasswordForm.tsx` are the only forms in the project
that bypass the shared input components and instead use raw `<input>` elements
with duplicated inline Tailwind class strings, manual `<label>` elements, and
manual error `<p>` elements. Every other form (`IssueForm`, `AgentProfileForm`,
`ChatFormModal`, etc.) already uses the established pattern. This refactor
brings the profile forms in line with the rest of the codebase.

## Problem Statement

Both forms contain this repeated boilerplate per field:

```tsx
// features/user-profile/ui/ProfileForm.tsx (lines 55–61)
<div className='flex flex-col gap-1.5'>
  <label htmlFor='name' className='text-sm font-medium text-foreground'>
    Name
  </label>
  <input
    id='name'
    type='text'
    {...register('name', { required: 'Name is required' })}
    className='rounded-[var(--radius-button)] border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30'
    placeholder='Your full name'
  />
  {errors.name && (
    <p className='text-xs text-destructive'>{errors.name.message}</p>
  )}
</div>
```

This duplicates logic already encapsulated in `shared/ui/input/Input.tsx`:

- Floating `<label>` is handled by the `label` prop
- Error message + `role="alert"` are handled by the `error` prop
- Consistent border/focus ring styles are built-in

## Proposed Solution

Replace each raw `<input>` with `Input` and each raw `<input type="password">`
with `InputPassword`, following the established codebase pattern.

### Target files

| File                                              | Fields to migrate                                                      |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| `features/user-profile/ui/ProfileForm.tsx`        | `name` (text), `email` (email)                                         |
| `features/user-profile/ui/ChangePasswordForm.tsx` | `current_password`, `password`, `password_confirmation` (all password) |

### Established pattern (from `features/agents/ui/agent-profile-form.tsx`)

```tsx
// features/user-profile/ui/ProfileForm.tsx — after refactor
import Input from '@/shared/ui/input/Input';

<Input
  {...register('name')}
  label='Name'
  value={watch('name')}
  error={errors.name?.message}
/>

<Input
  {...register('email')}
  label='Email'
  type='email'
  value={watch('email')}
  error={errors.email?.message}
/>
```

```tsx
// features/user-profile/ui/ChangePasswordForm.tsx — after refactor
import InputPassword from '@/shared/ui/input/InputPassword';

<InputPassword
  {...register('current_password')}
  label='Current password'
  value={watch('current_password')}
  error={errors.current_password?.message}
/>

<InputPassword
  {...register('password')}
  label='New password'
  value={watch('password')}
  error={errors.password?.message}
/>

<InputPassword
  {...register('password_confirmation')}
  label='Confirm new password'
  value={watch('password_confirmation')}
  error={errors.password_confirmation?.message}
/>
```

After migration, each field's manual `<div>`, `<label>`, and error `<p>`
wrappers are removed — `Input` manages its own container.

## Technical Considerations

- **`value` is required** — `Input` is controlled-only. Must pass
  `value={watch('fieldName')}` for every field.
- **No manual `<label>` or error `<p>`** — remove them; they are replaced by
  `label` and `error` props.
- **`InputPassword` has no `type` prop** — it manages `type="password"` and the
  eye-toggle internally. Do not pass `type`.
- **Validation rules stay in `register()`** — inline validation rules in
  `register(...)` continue to work. No Zod migration required for this refactor
  (keep scope minimal).
- **No layout wrapper changes** — the outer form structure (`<form>`, section
  headings, submit button) stays unchanged.
- **`clearErrors` on change** — optionally add
  `onChange: () => clearErrors('fieldName')` inside `register()` to clear errors
  on keystroke, matching the pattern in `agent-profile-form.tsx`. This is
  optional but improves UX.

## Acceptance Criteria

- [x] `ProfileForm.tsx` uses `Input` from `shared/ui/input/Input` for `name` and
      `email` fields
- [x] `ChangePasswordForm.tsx` uses `InputPassword` from
      `shared/ui/input/InputPassword` for all three password fields
- [x] No raw `<input>` HTML elements remain in either file
- [x] No manual `<label>` elements remain alongside migrated fields
- [x] No manual error `<p>` elements remain alongside migrated fields
- [x] `value={watch('fieldName')}` is passed to every `Input` / `InputPassword`
      instance
- [x] Validation errors still display correctly (field-level messages from
      `react-hook-form`)
- [x] Form submission behavior is unchanged (same actions, same success/error
      toasts)
- [x] ESLint and TypeScript pass with no new errors
      (`npm run lint && npx tsc --noEmit`)

## References

### Internal References

- Shared Input component: `shared/ui/input/Input.tsx`
- Shared InputPassword component: `shared/ui/input/InputPassword.tsx`
- Established pattern example: `features/agents/ui/agent-profile-form.tsx`
- Another pattern example: `features/issues/ui/issue-form.tsx`
- Chat form example (simplest): `features/chat/ui/chat-form-modal.tsx`
- Target file 1: `features/user-profile/ui/ProfileForm.tsx`
- Target file 2: `features/user-profile/ui/ChangePasswordForm.tsx`
