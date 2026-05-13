---
title:
  'feat: Onboarding role field — InputDropdown + app-wide UserRole consistency'
type: feat
status: completed
date: 2026-05-13
deepened: 2026-05-13
---

# feat: Onboarding role field — InputDropdown + app-wide UserRole consistency

## Enhancement Summary

**Deepened on:** 2026-05-13 **Research agents used:**
kieran-typescript-reviewer, architecture-strategist, code-simplicity-reviewer,
pattern-recognition-specialist, security-sentinel, best-practices-researcher,
fsd-boundary-guard, unit-test-booster

### Key Improvements Discovered

1. **Scope reduction:** The 6-file plan collapses to 5 targeted files —
   `pivot.role` and `OrganizationTeamMapEntry.role` narrowing to `UserRole` is
   unsafe without Zod runtime validation at the API call site; leave those as
   `string` for now.
2. **Critical type safety:** Replace `as UserRole` cast in the `onChange`
   handler with `UserRoleSchema.safeParse()` — no casts.
3. **Security bug discovered:** `isOrganizationManager()` grants access to both
   `manager` AND `employee`, meaning it is actually "is org member" not "is
   manager". This is a pre-existing bug that should be fixed in a separate PR,
   not as part of this dropdown change.
4. **FSD violations to fix en-passant:** Two deep-path import violations exist
   in files being touched; fix them in this PR.
5. **Zod as single source of truth:** Define `UserRoleSchema = z.enum(...)`
   first, derive `UserRole` from it via `z.infer`. Use `UserRoleSchema.options`
   for the dropdown option array — no duplication.
6. **InputDropdown prop:** Add `searchable={false}` — two options don't need a
   search box.
7. **Test breakage:** `wizard-reducer.test.ts` uses `role: 'Engineer'` which
   will fail TypeScript after the type change.

### New Risks Discovered

- `EditableTeamMember` has fields (`_id`, `found_in`, `already_in_system`,
  `system_user_id`) not in the original plan — do not redefine the interface,
  only update the `role` field.
- Legacy AI draft data may contain non-enum role strings — use `.catch(null)` on
  parse-side schema only.
- `InputDropdown` deep-path import (`@/shared/ui/input/InputDropdown`) may be an
  FSD violation — import from `@/shared/ui/input` index instead (verify index
  exports it).

---

## Overview

Replace the free-text `Input` for the "Role" field in the onboarding team member
row with an `InputDropdown` constrained to the two valid backend values
(`manager` / `employee`). In the same pass, introduce a canonical `UserRole`
TypeScript union derived from a Zod schema, and fix two pre-existing FSD import
violations in the touched files.

The `isOrganizationManager()` access-control bug (treats both `manager` and
`employee` as managers) is **out of scope** — it is a separate security fix that
warrants its own PR.

## Problem Statement

The backend defines a strict two-value enum (`app/Enums/UserRole.php`):

```php
enum UserRole: string
{
    case MANAGER = 'manager';
    case EMPLOYEE = 'employee';
}
```

The DB column `organization_user.role` is a MySQL `ENUM('manager', 'employee')`
— any other value causes a DB-level error. The onboarding UI renders the role
field as a plain free-text `<Input>`:

- `features/onboarding/ui/onboarding-team-member-row.tsx:36` — plain
  `<Input label="Role">`
- `features/onboarding/model/types.ts:53,65` — `role: string | null` (no union
  constraint)
- `features/onboarding/model/schemas.ts:73` — `z.string().max(255).optional()`
  (no enum validation)

No frontend `UserRole` type exists. Role values are untyped `string` throughout.

## Proposed Solution

1. **Define `UserRoleSchema`** in `entities/organization/model/types.ts`, derive
   `UserRole` from it via `z.infer`. Export both from
   `entities/organization/index.ts`.
2. **Update onboarding types** — narrow only
   `AcceptStructurePayload.team[].role` to `UserRole | null`. Leave
   `DraftTeamMember.role` and `EditableTeamMember.role` as `string | null` (AI
   draft output is uncontrolled).
3. **Tighten submit-side Zod schema** to
   `z.enum(['manager', 'employee']).optional()`. Add `.catch(null)` only on the
   parse-side (AI draft response).
4. **Swap `Input` for `InputDropdown`** with `searchable={false}`, safe onChange
   handler using `safeParse`.
5. **Fix two FSD import violations** en-passant in the touched files.

## Acceptance Criteria

- [x] `onboarding-team-member-row.tsx` renders an `InputDropdown` with options
      `manager` and `employee`
- [x] `InputDropdown` has `searchable={false}` (two options need no search)
- [x] Role is optional — dropdown shows placeholder "Select role" when `null`,
      submits `null` when not selected
- [x] `onChange` uses `UserRoleSchema.safeParse()` — no `as UserRole` cast
- [x] `UserRoleSchema` is defined in `features/onboarding/model/schemas.ts`,
      exported for use in the row component
- [x] `UserRole` plain type is in `entities/organization/model/types.ts`,
      exported from `entities/organization/index.ts`
- [x] Submit-side Zod schema: `z.enum(['manager', 'employee']).optional()`
- [x] Parse-side Zod schema (AI draft): `z.string().nullable()` left unchanged
- [x] `AcceptStructurePayload.team[].role` uses `UserRole | undefined` (omitted
      when not selected — matches wizard behavior)
- [x] `features/onboarding/model/types.ts:1` import fixed:
      `@/features/issues/model/types` → `@/features/issues`
- [x] `features/agents/lib/access.ts:3` import fixed:
      `@/features/organization/api/organization` → `@/features/organization`
- [x] `wizard-reducer.test.ts` — no change needed (`role: 'Engineer'` is on
      `DraftTeamMember` which stays `string | null`)
- [x] New unit tests for `onboarding-team-member-row.tsx` — 7 test cases, all
      passing
- [x] No TypeScript or ESLint errors

## Technical Approach

### Step 1 — Define `UserRoleSchema` and `UserRole`

**File:** `entities/organization/model/types.ts`

The 2026 best practice is to define the Zod schema first and derive the
TypeScript type from it — single source of truth, no drift risk.

```ts
// entities/organization/model/types.ts — add near the top, before other interfaces
import { z } from 'zod';

export const UserRoleSchema = z.enum(['manager', 'employee']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// Runtime array for dropdowns — no duplication needed
// Access via UserRoleSchema.options: readonly ['manager', 'employee']
```

> **Why `z.enum().options` instead of a separate `ROLE_OPTIONS` constant?**
> `z.enum(['manager', 'employee'])` stores `options` as a `readonly` tuple on
> the schema object. Reusing it for the dropdown array keeps the enum values in
> exactly one place — the schema definition. Adding a third role later only
> requires updating the schema.

**File:** `entities/organization/index.ts`

```ts
// Add to existing exports:
export { UserRoleSchema } from './model/types';
export type { UserRole } from './model/types';
```

### Step 2 — Update onboarding types (targeted change only)

**File:** `features/onboarding/model/types.ts`

> **Important:** `EditableTeamMember` has more fields than the original plan
> showed (`_id`, `found_in`, `already_in_system`, `system_user_id`). Do NOT
> rewrite the interfaces. Only change the `role` field type in
> `AcceptStructurePayload`.

Changes:

- `DraftTeamMember.role` — leave as `string | null` (AI draft output is
  uncontrolled free text)
- `EditableTeamMember.role` — leave as `string | null` (inherited from
  `DraftTeamMember`, same reason)
- `AcceptStructurePayload.team[].role` — change from `string` to
  `UserRole | null`

```ts
// features/onboarding/model/types.ts

// Fix pre-existing FSD violation on line 1:
// Before: import type { IssueAttachment } from '@/features/issues/model/types';
// After:
import type { IssueAttachment } from '@/features/issues';

import type { UserRole } from '@/entities/organization';

// Only change AcceptStructurePayload — do not touch DraftTeamMember or EditableTeamMember
// AcceptStructurePayload.team[].role?: string → UserRole | null
team?: Array<{
  name: string;
  email?: string | null;
  role?: UserRole | null;   // was: string
}> | null;
```

### Step 3 — Tighten submit-side Zod schema

**File:** `features/onboarding/model/schemas.ts`

Two schemas are relevant:

- Line 26 — **parse-side** (`onboardingDraftResultCompleteSchema.team[].role`):
  this parses raw AI output and may contain arbitrary strings. Leave as
  `z.string().nullable()`. Do not tighten.
- Line 73 — **submit-side** (`teamMemberSchema.role`): this validates what the
  user selected in the UI — tighten to enum.

```ts
// Line 73 — teamMemberSchema (submit-side only)
// Before: role: z.string().max(255).optional()
// After:
role: z.enum(['manager', 'employee']).optional(),
```

> **Why `.optional()` and not `.nullish()`?** The `AcceptStructurePayload` sends
> `role?: UserRole | null`. The backend validates it as
> `nullable, string, max:255`. Using `.optional()` means an absent role key is
> valid; if you need to also accept `null` explicitly in the JSON body, use
> `.nullable().optional()`. Check the wizard's submit logic to confirm whether
> `role: null` or omitting the key is the actual behavior.

> **Why NOT tighten the parse-side schema?** Old AI drafts may have role strings
> like `'HR Manager'` or `'Lead'`. Tightening parse-side would cause the wizard
> to crash or silently lose team data when the user returns to an in-progress
> onboarding. Only the submit path needs constraint.

### Step 4 — Replace Input with InputDropdown

**File:** `features/onboarding/ui/onboarding-team-member-row.tsx`

```tsx
'use client';

import { InputDropdown } from '@/shared/ui/input'; // import from index, not deep path
import { UserRoleSchema } from '@/entities/organization';
import type { UserRole } from '@/entities/organization';

// Derived from the schema — single source of truth, no duplication
const ROLE_OPTIONS = UserRoleSchema.options.map((value) => ({
  value,
  label: value,
}));

// Replace the role Input with:
<InputDropdown
  label='Role'
  options={ROLE_OPTIONS}
  value={member.role ?? ''} // '' maps to no-selection; never pass null to a controlled input
  placeholder='Select role'
  searchable={false} // two options need no search box
  onChange={(val) => {
    const raw = Array.isArray(val) ? val[0] : val;
    const parsed = UserRoleSchema.safeParse(raw);
    onUpdate({ ...member, role: parsed.success ? parsed.data : null });
  }}
/>;
```

> **Why `value={member.role ?? ''}` instead of `?? undefined`?** React
> controlled components should never receive `null` — it causes the component to
> switch to uncontrolled mode. An empty string `''` is unambiguous: it maps to
> "nothing selected" and lets the `placeholder` show. Using `undefined` has the
> same behavioral outcome but is semantically murkier.

> **Why `UserRoleSchema.safeParse()` instead of `as UserRole`?** `safeParse`
> validates that the dropdown returned a value that is actually in the schema's
> valid set. If `ROLE_OPTIONS` ever gains a third value that the
> `UserRoleSchema` doesn't accept (or vice versa), `safeParse` catches it at
> runtime instead of silently passing bad data. It also handles the
> clear/empty-string case (`'' → null`) without special-casing.

> **Note on import path:** Import from `@/shared/ui/input` (the index), not from
> `@/shared/ui/input/InputDropdown` (deep path). Verify that
> `shared/ui/input/index.ts` re-exports `InputDropdown`. If it doesn't, add the
> export rather than using the deep path.

### Step 5 — Fix `features/agents/lib/access.ts` import (FSD only)

**File:** `features/agents/lib/access.ts`

Only fix the deep-path import violation. Do NOT change `isOrganizationManager()`
logic — that function has a security bug (treats `employee` as manager) that is
a separate concern deserving its own PR and review.

```ts
// Line 3 — fix FSD deep-path violation:
// Before: import { getOrganizations } from '@/features/organization/api/organization';
// After:
import { getOrganizations } from '@/features/organization';
```

If the team decides to fix `isOrganizationManager()` as part of this PR, the
correct split is:

```ts
// Correct RBAC semantics (separate PR recommended):
import type { UserRole } from '@/entities/organization';

export function isManager(role: UserRole | string | null | undefined): boolean {
  return role?.trim() === 'manager';
}

export function isMember(role: UserRole | string | null | undefined): boolean {
  const r = role?.trim();
  return r === 'manager' || r === 'employee';
}
```

Keep `.trim()` — removing case normalization is only safe after `pivot.role` is
retyped to `UserRole` (not done in this PR). Rename uses of `canManageAgents` /
`managerOrganizations` accordingly.

## Files to Change

| File                                                    | Change                                                                               | Notes                                             |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `entities/organization/model/types.ts`                  | Add `UserRoleSchema` + `UserRole`                                                    | Zod schema first, type derived                    |
| `entities/organization/index.ts`                        | Export `UserRoleSchema` and `UserRole`                                               | Public API                                        |
| `features/onboarding/model/types.ts`                    | Narrow `AcceptStructurePayload.team[].role` to `UserRole \| null`; fix line 1 import | Do NOT rewrite DraftTeamMember/EditableTeamMember |
| `features/onboarding/model/schemas.ts`                  | Tighten submit-side only: `z.enum(['manager', 'employee']).optional()`               | Leave parse-side as `z.string().nullable()`       |
| `features/onboarding/ui/onboarding-team-member-row.tsx` | Replace `Input` with `InputDropdown`; `searchable={false}`; `safeParse` onChange     | Import from `@/shared/ui/input` index             |
| `features/agents/lib/access.ts`                         | Fix line 3 deep-path import only                                                     | Do NOT change `isOrganizationManager` logic       |

## Edge Cases and Risks

### Legacy free-text draft data (AI output)

Old AI-generated drafts may contain `team_map` entries with role strings like
`'HR Manager'` or `'Lead'`. The parse-side schema (`schemas.ts:26`) must stay as
`z.string().nullable()` — do NOT tighten it. The dropdown will receive these as
`member.role` and render them as `value={member.role ?? ''}`. Since `''` doesn't
match any option value, `InputDropdown` will show the placeholder — the invalid
value is silently dropped when the user makes a selection.

### `EditableTeamMember` has extra fields

The actual type has `_id` (not `id`), plus `found_in`, `already_in_system`, and
`system_user_id`. Do not rewrite the interface — only update the `role` field
type inherited from `DraftTeamMember`.

### `InputDropdown` deep-path import

Check whether `shared/ui/input/index.ts` re-exports `InputDropdown`. If not,
add: `export { default as InputDropdown } from './InputDropdown';` — then import
from `@/shared/ui/input`.

### `onChange` empty-string → null coercion

When the user clears the dropdown (if supported), `InputDropdown` calls
`onChange('')`. `UserRoleSchema.safeParse('')` returns `{ success: false }`, so
the `onUpdate` call receives `role: null`. This is correct behavior — empty
selection maps to no role.

### TypeScript breakage in existing test

`wizard-reducer.test.ts` uses `role: 'Engineer'` in `COMPLETE_RESULT`. After
narrowing `AcceptStructurePayload.team[].role` to `UserRole | null`, this will
fail tsc. Fix: change `role: 'Engineer'` to `role: 'manager'` (or `null` if the
intent is "no role specified").

## Testing

### Fix in `wizard-reducer.test.ts`

Line in `COMPLETE_RESULT` uses `role: 'Engineer'`. After the type change:

```ts
// Before:
role: 'Engineer',  // type error after change

// After (pick whichever reflects intent):
role: 'manager',   // or: role: null
```

### New tests for `onboarding-team-member-row.tsx`

Mock `InputDropdown` to avoid portal/positioning complexity in jsdom:

```ts
jest.mock('@/shared/ui/input', () => ({
  InputDropdown: jest.fn(({ value, onChange, options, label, disabled }) => (
    <select
      aria-label={label}
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
    >
      <option value=''>Select role</option>
      {options.map((o: { value: string; label: string }) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )),
}));
```

**Minimum test cases:**

| Test name                                                  | What it verifies                                                                             |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `renders name and email inputs`                            | `name` and `email` Input fields render with correct values                                   |
| `renders role dropdown with current role selected`         | `InputDropdown` receives `value="manager"` when `member.role === 'manager'`                  |
| `renders role dropdown with placeholder when role is null` | `value=""` is passed when `member.role === null`                                             |
| `calls onUpdate with manager when manager selected`        | Simulates select change to `'manager'`; asserts `onUpdate({ ...member, role: 'manager' })`   |
| `calls onUpdate with employee when employee selected`      | Simulates select change to `'employee'`; asserts `onUpdate({ ...member, role: 'employee' })` |
| `calls onUpdate with null when role cleared`               | Simulates select change to `''`; asserts `onUpdate({ ...member, role: null })`               |
| `calls onRemove when delete button clicked`                | Click trash icon; assert `onRemove()` called once                                            |

## Security Note

`isOrganizationManager()` in `features/agents/lib/access.ts` returns `true` for
both `'manager'` and `'employee'`. This means `canManageAgents` is `true` for
all org members, and `managerOrganizations` actually returns all organizations
the user belongs to. The function name implies a privilege check that the
implementation does not enforce.

This is a pre-existing security issue unrelated to the dropdown change. It
should be tracked and fixed in a separate PR where the intended RBAC semantics
can be confirmed with the product team:

- If both roles can manage agents: rename to `isOrgMember`
- If only managers can manage agents: fix to `return role === 'manager'`

## Dependencies

- `shared/ui/input/InputDropdown.tsx` — already exists, used in 10+ other
  components
- `entities/organization/model/types.ts` — already exists
- `zod` — already a project dependency
- No new packages required

## Out of Scope

- Changing display labels to capitalized ("Manager" / "Employee") — user
  preference is lowercase
- Making role required — user preference is optional/nullable
- Backend FormRequest validation changes — `team.*.role` accepts any string by
  design (team_map for AI context only)
- `organization-list.tsx` and `organization-dropdown.tsx` display formatting —
  raw lowercase is acceptable
- Narrowing `pivot.role` or `OrganizationTeamMapEntry.role` to `UserRole` —
  unsafe without Zod runtime validation at the API call site
- Fixing `isOrganizationManager()` RBAC semantics — separate PR

## References

- Backend enum:
  `/Users/slavapopov/Documents/WandaAsk_backend/app/Enums/UserRole.php`
- Backend migration:
  `/Users/slavapopov/Documents/WandaAsk_backend/database/migrations/2025_12_23_211927_create_organization_user_table.php:17`
- Backend FormRequest:
  `/Users/slavapopov/Documents/WandaAsk_backend/app/Http/Requests/API/v1/AcceptOrganizationStructureRequest.php`
- Frontend row component:
  `features/onboarding/ui/onboarding-team-member-row.tsx:36`
- Frontend types: `features/onboarding/model/types.ts:53,65`
- Frontend schema: `features/onboarding/model/schemas.ts:26,73`
- Existing dropdown component: `shared/ui/input/InputDropdown.tsx`
- Access logic: `features/agents/lib/access.ts:11-13`
- Entity org types: `entities/organization/model/types.ts`
- Entity org index: `entities/organization/index.ts`
