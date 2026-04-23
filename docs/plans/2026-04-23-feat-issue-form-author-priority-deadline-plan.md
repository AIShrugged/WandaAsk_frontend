---
title: 'feat: Add author, priority, and deadline fields to issue form'
type: feat
status: active
date: 2026-04-23
---

# feat: Add author, priority, and deadline (due_date) fields to issue form

## Overview

Add three new fields to the issue create/edit form:

| Field        | Backend column                         | Notes                                                   |
| ------------ | -------------------------------------- | ------------------------------------------------------- |
| **Author**   | `user_id` (exists)                     | Auto-filled with current user; editable dropdown        |
| **Deadline** | `due_date` (exists in DB, not exposed) | Defaults to now + 24h; editable date input              |
| **Priority** | `priority` (does NOT exist)            | Integer −1,000,000…+1,000,000; UI shows labeled presets |

Both the frontend and backend need changes. The backend changes are:

- Expose `due_date` and `user_id`/`author_id` in `IssueRequest` and
  `IssueResource` (column already exists)
- Add new `priority` column via migration + wire it through
  request/resource/model

---

## Background research findings

### Backend — what already exists

- **`due_date`** — column exists in the `issues` table (was part of the original
  `tasks` table schema). The model already casts it as `'date'`. It is used in
  `IssueStatsService` for overdue calculation. BUT it is **not** in
  `IssueRequest` (validation) or `IssueResource` (API response). No frontend
  wires it at all.
- **`user_id`** — the creator field. Set automatically in
  `IssueController@store` as `$request->user()->id`. It is NOT in `IssueRequest`
  (cannot be overridden) and NOT in `IssueResource` (not returned). We need to
  expose it so the form can optionally override the author.
- **`priority`** — does not exist anywhere. Needs new migration.

### Frontend — relevant patterns

- **`getUser()`** from `features/user/api/user.ts` — returns the current user
  (including `id` and `name`). Used in `IssueDetailPage` already. The create
  page (`IssueCreatePage`) does NOT call it yet — needs to be added.
- **`assignee_id`** — the existing pattern for a searchable person dropdown.
  Author follows the exact same pattern.
- **`InputDropdown`** from `shared/ui/input/InputDropdown.tsx` — the standard
  dropdown/searchable component. Used for all dropdowns.
- **`Input`** from `shared/ui/input/Input.tsx` — standard text input with
  floating label. `type="date"` or `type="datetime-local"` can be used for the
  deadline.
- **`IssueFormProps`** — needs a new `currentUser` prop (from the page Server
  Component).

---

## Priority level design (proposed — discuss before implementation)

The raw priority is an integer. The UI maps it to labeled presets using these
threshold rules:

| Label                        | Raw value stored | Color / icon      |
| ---------------------------- | ---------------- | ----------------- |
| 🔴 **Critical** (Срочное)    | `500`            | Red badge         |
| 🟠 **High** (Важное)         | `100`            | Orange badge      |
| 🟡 **Normal** (Обычное)      | `0`              | Default, no color |
| 🔵 **Low** (Низкое)          | `-100`           | Muted blue        |
| ⚪ **Minimal** (Минимальное) | `-500`           | Gray / muted      |

**Display rule:** a priority value falls into the bucket whose threshold it
meets or exceeds (highest matching threshold wins). E.g. `300` → High, `600` →
Critical, `-50` → Normal, `-200` → Low.

**Form UX:** a `InputDropdown` with these 5 options (each stores its threshold
value). Default is `0` (Normal). Advanced users can also type a custom integer
if needed — though this can be a v2. Start simple with the 5-preset dropdown.

**Display in lists/cards (future):** badge component `IssuePriorityBadge` based
on thresholds.

> **Open question for user:** Do these 5 levels and thresholds make sense?
> Should the form also allow typing a raw integer, or just the 5 preset values?

---

## Changes required

### Backend

#### 1. New migration — add `priority` column

**File:**
`database/migrations/2026_04_23_000001_add_priority_to_issues_table.php`

```php
Schema::table('issues', function (Blueprint $table) {
    $table->integer('priority')->default(0)->after('assignee_id');
    $table->index('priority');
});
```

#### 2. Update `Issue` model

**File:** `app/Models/Issue.php`

- Add `'priority' => 'integer'` to `casts()`
- Add priority threshold constants:

```php
public const PRIORITY_CRITICAL = 500;
public const PRIORITY_HIGH = 100;
public const PRIORITY_NORMAL = 0;
public const PRIORITY_LOW = -100;
public const PRIORITY_MINIMAL = -500;
```

#### 3. Update `IssueResource`

**File:** `app/Http/Resources/API/v1/IssueResource.php`

Add to `toArray()`:

```php
'user_id'   => $this->user_id,
'author'    => $this->whenLoaded('user', fn () => [
    'id'    => $this->user->id,
    'name'  => $this->user->name,
    'email' => $this->user->email,
]),
'due_date'  => $this->due_date?->toDateString(),   // Y-m-d
'priority'  => $this->priority ?? 0,
```

Also ensure the controller loads the `user` relation where needed
(store/show/update).

#### 4. Update `IssueRequest`

**File:** `app/Http/Requests/API/v1/IssueRequest.php`

Add to `issues.store` rules:

```php
'author_id' => ['nullable', 'integer', 'exists:users,id'],
'due_date'  => ['nullable', 'date'],
'priority'  => ['nullable', 'integer', 'min:-1000000', 'max:1000000'],
```

Add to `issues.update` rules:

```php
'author_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
'due_date'  => ['sometimes', 'nullable', 'date'],
'priority'  => ['sometimes', 'nullable', 'integer', 'min:-1000000', 'max:1000000'],
```

Update `getStoreData()`:

```php
'author_id' => $this->input('author_id'),   // mapped to user_id in controller
'due_date'  => $this->input('due_date'),
'priority'  => $this->input('priority') ?? 0,
```

Update `getUpdateData()` — add same three fields.

#### 5. Update `IssueController@store`

**File:** `app/Http/Controllers/API/v1/IssueController.php`

In `store()`:

```php
$issue = Issue::create([
    'user_id'       => $data['author_id'] ?? $request->user()->id,  // allow override
    'due_date'      => $data['due_date'] ?? null,
    'priority'      => $data['priority'] ?? 0,
    // ... existing fields
])->load(['assignee', 'issueType', 'user']);
```

In `update()` — add `due_date`, `priority`, and allow `user_id` change if
`author_id` sent.

---

### Frontend

#### 6. Update `IssueUpsertDTO`

**File:** `features/issues/model/types.ts`

```typescript
export interface IssueUpsertDTO {
  name: string;
  description: string | null;
  type: string;
  status: IssueStatus;
  organization_id: number | null;
  team_id: number | null;
  assignee_id: number | null;
  author_id: number | null; // ← new
  due_date: string | null; // ← new (ISO date "YYYY-MM-DD")
  priority: number; // ← new (default 0)
}
```

#### 7. Update `Issue` interface

**File:** `features/issues/model/types.ts`

```typescript
export interface Issue {
  // ... existing fields ...
  user_id: number | null; // ← expose creator
  author?: PersonOption | null; // ← loaded relation (optional)
  due_date: string | null; // ← new (was not exposed)
  priority: number; // ← new
}
```

#### 8. Add priority constants and helpers

**File:** `features/issues/model/types.ts`

```typescript
export const PRIORITY_LEVELS = [
  { value: 500, label: 'Critical', color: 'text-red-500' },
  { value: 100, label: 'High', color: 'text-orange-400' },
  { value: 0, label: 'Normal', color: 'text-foreground' },
  { value: -100, label: 'Low', color: 'text-blue-400' },
  { value: -500, label: 'Minimal', color: 'text-muted-foreground' },
] as const;

export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

/** Returns the matching priority label for a raw integer priority value */
export function getPriorityLevel(priority: number): PriorityLevel {
  return (
    [...PRIORITY_LEVELS].find((level) => priority >= level.value) ??
    PRIORITY_LEVELS[PRIORITY_LEVELS.length - 1]
  );
}

export const PRIORITY_OPTIONS = PRIORITY_LEVELS.map((level) => ({
  value: String(level.value),
  label: level.label,
}));
```

#### 9. Update `IssueFormValues` and `IssueFormProps`

**File:** `features/issues/ui/issue-form.tsx`

```typescript
interface IssueFormProps {
  organizations: OrganizationProps[];
  persons: PersonOption[];
  issue?: Issue;
  defaultOrganizationId?: string;
  currentUser?: { id: number; name: string; email: string } | null; // ← new
}

interface IssueFormValues {
  name: string;
  description: string;
  type: string;
  status: IssueStatus | '';
  organization_id: string;
  team_id: string;
  assignee_id: string;
  author_id: string; // ← new (stored as string ID, like assignee_id)
  due_date: string; // ← new (ISO date "YYYY-MM-DD" or datetime-local)
  priority: string; // ← new (stored as string number for form; converted to int on submit)
}
```

Default values:

```typescript
const defaultDeadline = useMemo(() => {
  if (issue?.due_date) return issue.due_date;
  // now + 24h in "YYYY-MM-DD" format
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}, [issue]);

const defaultValues = useMemo<IssueFormValues>(
  () => ({
    // ... existing defaults ...
    author_id: issue?.user_id
      ? String(issue.user_id)
      : String(currentUser?.id ?? ''),
    due_date: defaultDeadline,
    priority: String(issue?.priority ?? 0),
  }),
  [issue, currentUser, defaultDeadline],
);
```

#### 10. Update form JSX — add three new fields

Layout changes in `issue-form.tsx`:

```
[Name]                    (full width, unchanged)
[Description]             (full width, unchanged)
[Type]        [Status]    (2-col, unchanged)
[Org]         [Team]      (TenantScopeFields, unchanged)
[Assignee]    [Author]    (2-col — Author is new, same pattern as Assignee)
[Deadline]    [Priority]  (2-col — both new)
```

**Author field** (same pattern as Assignee — searchable `InputDropdown` with
person options):

```tsx
<InputDropdown
  label='Author'
  options={authorOptions} // same list as assigneeOptions
  value={watch('author_id')}
  onChange={(value) => {
    setValue('author_id', value as string, { shouldDirty: true });
    clearErrors('author_id');
  }}
  searchable
  error={errors.author_id?.message}
/>
```

**Deadline field** (native date input via `Input` with `type="date"`):

```tsx
<Input
  {...register('due_date', {
    onChange: () => {
      clearErrors('due_date');
      setRootError('');
    },
  })}
  type='date'
  label='Deadline'
  value={watch('due_date')}
  error={errors.due_date?.message}
/>
```

> **Note:** If `Input.tsx` doesn't support `type="date"` well (floating label
> conflict), we may need to use a plain `<input type="date">` with the same
> styling class or extend `Input` to handle it. Check the floating label
> behavior.

**Priority field** (`InputDropdown` with the 5 preset options):

```tsx
<InputDropdown
  label='Priority'
  options={PRIORITY_OPTIONS}
  value={watch('priority')}
  onChange={(value) => {
    setValue('priority', value as string, { shouldDirty: true });
    clearErrors('priority');
  }}
  error={errors.priority?.message}
/>
```

#### 11. Update `onSubmit` payload

```typescript
const payload: IssueUpsertDTO = {
  // ... existing fields ...
  author_id: values.author_id ? Number(values.author_id) : null,
  due_date: values.due_date || null,
  priority: Number(values.priority) || 0,
};
```

Also update field error mapping — add `author_id`, `due_date`, `priority` to the
`field in defaultValues` check.

#### 12. Update create page — pass `currentUser`

**File:** `app/dashboard/issues/(create)/create/page.tsx`

```typescript
import { getUser } from '@/features/user';

export default async function IssueCreatePage() {
  const [organizationsResponse, persons, organizationId, userResponse] =
    await Promise.all([
      getOrganizations(),
      getPersons(),
      getOrganizationId(),
      getUser(),
    ]);

  return (
    ...
    <IssueForm
      organizations={organizationsResponse.data ?? []}
      persons={persons}
      defaultOrganizationId={organizationId}
      currentUser={userResponse.data ?? null}   // ← new
    />
  );
}
```

The `IssueDetailPage` already calls `getUser()` — just pass `userResponse.data`
as `currentUser` prop there too.

#### 13. (Optional) `IssuePriorityBadge` component

**File:** `features/issues/ui/issue-priority-badge.tsx`

A reusable badge using `getPriorityLevel()` to display priority in issue lists
and cards.

```tsx
import { getPriorityLevel } from '@/features/issues/model/types';

interface IssuePriorityBadgeProps {
  priority: number;
}

export function IssuePriorityBadge({ priority }: IssuePriorityBadgeProps) {
  const level = getPriorityLevel(priority);
  return (
    <span className={`text-xs font-medium ${level.color}`}>{level.label}</span>
  );
}
```

---

## Implementation order (step-by-step)

1. **Backend migration** — `add_priority_to_issues_table` — creates the
   `priority` column
2. **Backend model** — add `priority` cast and constants to `Issue.php`
3. **Backend resource** — expose `user_id`, `author`, `due_date`, `priority` in
   `IssueResource`
4. **Backend request** — add validation for `author_id`, `due_date`, `priority`
   in `IssueRequest`
5. **Backend controller** — wire `author_id`→`user_id`, `due_date`, `priority`
   in `store()` and `update()`
6. **Frontend types** — update `Issue`, `IssueUpsertDTO`, add priority helpers
   in `types.ts`
7. **Frontend form** — update `IssueFormProps`, `IssueFormValues`, default
   values, layout, submit
8. **Frontend pages** — pass `currentUser` prop to `IssueForm` in create/detail
   pages
9. **Optional** — `IssuePriorityBadge` component for use in list views

---

## Acceptance criteria

- [ ] Author field auto-fills with the current logged-in user on create; can be
      changed to any person
- [ ] On edit, author shows the existing creator (user_id); can be changed
- [ ] Deadline defaults to current time + 24 hours on create form; can be
      changed
- [ ] On edit, deadline shows the existing `due_date`; can be changed or cleared
- [ ] Priority dropdown shows 5 preset levels: Critical, High, Normal, Low,
      Minimal
- [ ] Priority defaults to "Normal" (value 0) on create
- [ ] Saving an issue sends `author_id`, `due_date`, `priority` to the backend
- [ ] Backend validates `due_date` as a date, `priority` as an integer in range
      −1,000,000..+1,000,000
- [ ] Backend returns `user_id`, `due_date`, `priority` in the issue response
- [ ] Overdue calculation in `IssueStatsService` continues to work correctly
      with exposed `due_date`
- [ ] Existing issues without priority show as "Normal" (default 0)
- [ ] No regression on existing create/edit/delete flows

---

## Open questions to resolve before implementation

1. **Priority thresholds** — Do the proposed 5 levels (Critical=500, High=100,
   Normal=0, Low=-100, Minimal=-500) make sense? Should there be more
   granularity?
2. **Custom priority input** — Should users be able to type a raw integer, or
   only pick from the 5 presets?
3. **Date input UX** — Use `type="date"` (date only, no time) or
   `type="datetime-local"` (date + time)? The backend `due_date` is a `date`
   column (no time).
4. **Author editability** — On an existing issue, should ANY user be able to
   reassign the author, or only certain roles? (Backend currently has no
   restriction — anyone with edit access can change `user_id`.)
5. **`IssuePriorityBadge` scope** — Should priority badges appear in the issues
   list and kanban board in this same PR, or as a follow-up?

---

## References

### Internal code locations

- `features/issues/ui/issue-form.tsx` — main form to modify
- `features/issues/model/types.ts` — types and constants
- `features/issues/api/issues.ts` — server actions (`createIssue`,
  `updateIssue`)
- `app/dashboard/issues/(create)/create/page.tsx` — create page (needs
  `getUser()`)
- `app/dashboard/issues/[id]/page.tsx` — detail page (already has `getUser()`)
- `shared/ui/input/InputDropdown.tsx` — used for author + priority dropdowns
- `shared/ui/input/Input.tsx` — used for deadline date input (check floating
  label with `type="date"`)
- `shared/lib/getCurrentUserId.ts` — simpler alternative if only ID is needed
- `features/user/api/user.ts:11` — `getUser()` for full user object
- Backend: `app/Models/Issue.php:46` — `due_date` cast already present
- Backend: `app/Http/Resources/API/v1/IssueResource.php` — add three fields here
- Backend: `app/Http/Requests/API/v1/IssueRequest.php` — add validation rules
  here
- Backend: `app/Http/Controllers/API/v1/IssueController.php` — wire in
  store/update
- Backend: `app/Services/IssueStatsService.php:26-27` — uses `due_date` for
  overdue, will work as-is
