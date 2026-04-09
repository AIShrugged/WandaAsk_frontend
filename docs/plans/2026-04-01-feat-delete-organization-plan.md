---
title: 'feat: Add Organization Delete'
type: feat
status: completed
date: 2026-04-01
---

# feat: Add Organization Delete

## Overview

Allow organization owners/managers/employees to permanently delete an
organization from the settings page. Deletion is irreversible and cascades to
all teams, members, meetings, and related data on the backend.

---

## Problem Statement

There is no way to delete an organization in the UI. The backend
`DELETE /api/v1/organizations/{id}` endpoint already exists and is fully
implemented (including cascade delete of teams and data), but the frontend has
no Server Action or UI for it.

---

## Proposed Solution

Add a "Danger Zone" section to the General tab of the organization settings page
(`/dashboard/organization/[id]`). The delete button opens a confirmation modal
where the user must type the organization's name before the destructive action
is permitted. On success, the active organization cookie is cleared server-side
and the user is redirected to the organization list.

---

## Technical Approach

### Backend Contract (already exists)

| Detail           | Value                                                            |
| ---------------- | ---------------------------------------------------------------- |
| Endpoint         | `DELETE /api/v1/organizations/{organization}`                    |
| Auth             | Bearer Sanctum token; Policy — only owner/manager                |
| Success response | `{ success: true, data: null, message: "Success", status: 200 }` |
| Error code       | `ORGANIZATION_DELETE_FAILED` (DB transaction failure)            |
| 403              | Role not permitted                                               |
| Cascade          | Deletes all teams (+ their data), detaches all users             |

Source: `app/Http/Controllers/API/v1/OrganizationController.php:149–154`,
`app/Models/Organization.php:69–90`

### Frontend Architecture

#### 1. Server Action — `features/organization/api/organization.ts`

Add `deleteOrganization(id: number): Promise<ActionResult<void>>`:

```ts
// features/organization/api/organization.ts
export async function deleteOrganization(
  id: number,
): Promise<ActionResult<void>> {
  try {
    await httpClient<void>(`${API_URL}/organizations/${id}`, {
      method: 'DELETE',
    });
    cookies().delete('organization_id');
    revalidatePath('/dashboard/organization');
    return { data: null, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to delete organization',
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

> **Note:** The existing org API file uses raw `fetch` with manual auth headers
> (tech debt, violates Rule 2). The new function must use `httpClient` from
> `@/shared/lib/httpClient`. Do not refactor the existing functions in the same
> PR — keep the scope tight.

Cookie must be deleted **before** `redirect()` is called. In this plan, the
redirect is handled client-side after the Server Action resolves (the action
returns `{ data: null, error: null }` and the client calls
`router.push('/dashboard/organization')`). This avoids the Next.js 16
restriction where `redirect()` inside a Server Action cannot be caught.

#### 2. Confirmation Modal — `features/organization/ui/delete-organization-modal.tsx`

Client Component. Uses existing `Modal*` primitives from `@/shared/ui/modal/`.

**Behavior:**

- Receives `org: OrganizationProps` and `onClose: () => void` as props
- Contains a text input where the user must type the exact org name to enable
  the confirm button
- Confirm button: disabled until input matches, shows spinner during in-flight
  request, disabled during in-flight
- Modal is non-dismissible (locks backdrop click + ESC) while the request is in
  flight
- On success: calls `onClose()`, shows `toast.success('Organization deleted')`,
  then navigates to `/dashboard/organization`
- On error: shows `toast.error(error)`, re-enables the form

```tsx
// features/organization/ui/delete-organization-modal.tsx
'use client';

interface DeleteOrganizationModalProps {
  org: OrganizationProps;
  onClose: () => void;
}
```

#### 3. Danger Zone Section — `features/organization/ui/organization-danger-zone.tsx`

Client Component. Renders only if the current user's role in the org is `owner`
or `manager` or `member`.

- "Delete Organization" button with `variant='danger'` and `Trash` icon
  (lucide-react)
- Opens `DeleteOrganizationModal` via `useState` (no need for `useModal` — it's
  a single modal)
- Includes a short description text: "Permanently deletes this organization and
  all its teams and data."

```tsx
// features/organization/ui/organization-danger-zone.tsx
'use client';

interface OrganizationDangerZoneProps {
  org: OrganizationProps;
  userRole: 'owner' | 'manager' | 'member'; // from org pivot
}
```

Role is already available from `OrganizationProps.pivot.role` (mapped from the
backend `OrganizationResource`).

#### 4. Integrate into Settings Page

In `features/organization/ui/organization-form.tsx` (or the General tab
section), import and render `OrganizationDangerZone` below the existing form
fields, separated by a horizontal rule and "Danger Zone" heading.

In the settings page (`app/dashboard/organization/[id]/page.tsx`), the current
user's role is available via `org.pivot.role` — pass it down to the
form/danger-zone component.

### File Map

| File                                                     | Change                                     |
| -------------------------------------------------------- | ------------------------------------------ |
| `features/organization/api/organization.ts`              | Add `deleteOrganization` Server Action     |
| `features/organization/ui/delete-organization-modal.tsx` | New — confirmation modal                   |
| `features/organization/ui/organization-danger-zone.tsx`  | New — Danger Zone UI section               |
| `features/organization/ui/organization-form.tsx`         | Import and render `OrganizationDangerZone` |
| `features/organization/index.ts`                         | Export new components if needed externally |

---

## Edge Cases & Decisions

### Cookie clearing order

`cookies().delete('organization_id')` runs inside the Server Action before
returning. The client-side router then redirects. This ensures the cookie is
gone before any subsequent navigation reads it.

### Role gating

The `OrganizationDangerZone` component checks `userRole` and renders `null` for
`member` role. The backend also enforces via Policy (403), providing
defense-in-depth.

### Typed-name confirmation

The user must type the exact organization name (case-sensitive) to enable the
delete button. This prevents accidental deletion given the cascading
irreversible scope.

### Active org deletion

If the deleted org matches the `organization_id` cookie, clearing it server-side
before redirect handles this case. After redirect to `/dashboard/organization`,
the org list page renders without an active selection — user can select or
create a new org.

### 404 from backend

Treat 404 as success (org already deleted by another owner). Clear cookie and
redirect.

### Empty org list after deletion

The `/dashboard/organization` list page already shows an empty state with a
"Create Organization" link. No additional work needed.

### In-flight state

Confirm button disabled + spinner, modal non-dismissible, cancel button
disabled. Prevents double-submit.

---

## Acceptance Criteria

### Functional

- [ ] A "Danger Zone" section appears in the General tab of the organization
      settings page
- [ ] The section is not visible (renders nothing) for users with `member` role
- [ ] Clicking "Delete Organization" opens a confirmation modal
- [ ] The modal shows the organization name and a warning about cascade deletion
- [ ] The confirm button is disabled until the user types the exact org name
- [ ] During the in-flight request, the confirm button shows a spinner and the
      modal is non-dismissible
- [ ] On success: `organization_id` cookie is cleared, user is redirected to
      `/dashboard/organization`, `toast.success` is shown
- [ ] On error: `toast.error` is shown with the backend message, modal stays
      open and form is re-enabled
- [ ] A 403 response shows a clear "You don't have permission to delete this
      organization" message
- [ ] `revalidatePath('/dashboard/organization')` is called in the Server Action
      after successful deletion

### Non-Functional

- [ ] New `deleteOrganization` Server Action uses `httpClient`, not raw `fetch`
- [ ] No TypeScript `any` types
- [ ] Passes ESLint without warnings
- [ ] FSD boundaries respected: no cross-feature imports

---

## Dependencies & Risks

| Item                                  | Notes                                                                                    |
| ------------------------------------- | ---------------------------------------------------------------------------------------- |
| Backend endpoint                      | Already exists — `DELETE /api/v1/organizations/{id}` via `Route::apiResource`            |
| `httpClient`                          | Already in `@/shared/lib/httpClient`                                                     |
| Modal primitives                      | `ModalRoot`, `ModalHeader`, `ModalBody` in `@/shared/ui/modal/`                          |
| `ActionResult<T>`                     | `@/shared/types/server-action`                                                           |
| `parseApiError`                       | `@/shared/lib/apiError`                                                                  |
| Risk: existing org API uses raw fetch | Do not refactor in same PR — just add the new function with `httpClient`                 |
| Risk: cookie timing                   | Must delete cookie before redirect; handled by server-side deletion inside Server Action |

---

## References

### Frontend

- Organization settings page: `app/dashboard/organization/[id]/page.tsx`
- Org feature API: `features/organization/api/organization.ts`
- Org types: `entities/organization/model/types.ts`
- Delete team pattern: `features/teams/api/team.ts:86–100`
- Team delete UI: `features/teams/ui/team-actions.tsx:55–70`
- Modal primitives: `shared/ui/modal/`
- `useModal` hook: `shared/hooks/use-modal`
- Routes: `shared/lib/routes.ts:24`

### Backend

- Destroy controller:
  `app/Http/Controllers/API/v1/OrganizationController.php:149–154`
- Cascade model method: `app/Models/Organization.php:69–90`
- Error code: `ORGANIZATION_DELETE_FAILED`
- Route: `routes/api.php:199` (`Route::apiResource('organizations', ...)`)
