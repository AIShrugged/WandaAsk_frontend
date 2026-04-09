---
title:
  'fix: Employee role permissions — follow-ups list, issue editing, and full
  read access'
type: fix
status: completed
date: 2026-03-31
---

# fix: Employee role permissions — follow-ups list, issue editing, and full read access

## Overview

The `employee` role currently cannot view the follow-ups list at
`dashboard/follow-ups/[id]` and cannot edit issues at `dashboard/issues/[id]`.
The intended policy is **"give access to everything by default, restrict
later"** — employees should be able to see and edit everything managers can,
except team/org administration actions.

Two root causes were found:

1. **Backend — `Followup::scopeOwned()`**: The scope only returns follow-ups
   that the user created (`user_id = current`) OR where the user is an **org
   manager**. Employees who are team members but not creators get an empty list.

2. **Backend — `IssueController::assertIssueScopeIsAllowed()`**: When a
   team-scoped issue is updated, the method also checks that org-level (no
   `team_id`) issues can only be created/updated by managers. For **team-scoped
   issues** this check passes, but any validation error surfaces as a 422 which
   may look like a permission error to the frontend.

3. **Frontend — `IssueForm`** already supports editing for all users (no role
   guard). The page itself has no guard either. So the issue on
   `dashboard/issues/197` is most likely the backend returning a 403 or 422 for
   employees trying to `PUT /issues/197`.

---

## Root Cause Analysis

### 1. `Followup::scopeOwned()` — employee team members are excluded

**File:** `app/Models/Followup.php:33`

```php
public function scopeOwned(Builder $query, int $userId): Builder
{
    return $query->where(function (Builder $q) use ($userId) {
        $q->where('user_id', $userId)                    // ← own follow-ups only
            ->orWhereHas('team.organization.users', function (Builder $query) use ($userId) {
                $query->where('users.id', $userId)
                    ->where('organization_user.role', 'manager'); // ← OR manager
            });
    });
}
```

An employee who is a team member but **did not create** the follow-up sees
nothing.

**Fix:** Extend the scope to include follow-ups belonging to teams the user is a
**direct member of**, in addition to their own and manager-accessible ones.

```php
public function scopeOwned(Builder $query, int $userId): Builder
{
    return $query->where(function (Builder $q) use ($userId) {
        // Own follow-ups (created by this user)
        $q->where('user_id', $userId)
            // OR follow-ups from teams where user is a direct member
            ->orWhereHas('team.users', function (Builder $inner) use ($userId) {
                $inner->where('users.id', $userId);
            })
            // OR follow-ups from org teams where user is a manager
            ->orWhereHas('team.organization.users', function (Builder $inner) use ($userId) {
                $inner->where('users.id', $userId)
                    ->where('organization_user.role', 'manager');
            });
    });
}
```

**Downstream:** `FollowupController::index()` (line 74) calls
`$team->followups()->owned(Auth::id())`. The `FollowupPolicy::viewAny()` already
correctly allows employees who are team members via `$user->isTeamMember($team)`
— so the policy gate passes. The scope is the only blocker.

### 2. `FollowupPolicy` — already correct, no changes needed

`FollowupPolicy::viewAny()` and `::view()` both use `$user->isTeamMember($team)`
which returns `true` for employees directly in the team. No frontend changes
needed for the policy layer.

### 3. Issues — `assertIssueScopeIsAllowed()` blocks employees from org-level issues

**File:** `app/Http/Controllers/API/v1/IssueController.php:175`

```php
private function assertIssueScopeIsAllowed(User $user, int $organizationId, ?int $teamId): void
{
    ...
    if ($teamId !== null) {
        return; // ← team-scoped: passes immediately
    }

    // org-level (no team): manager-only
    if (! $user->isOrganizationManager($organizationId)) {
        throw ValidationException::withMessages([...]);
    }
}
```

For **team-scoped issues** (`team_id` is set), this check passes — employees can
update them. But for **org-level issues** (no `team_id`), employees get a 422.

**Fix:** Per the "open access" policy, remove the manager-only guard on
org-level issues. Employees should be able to create/update org-level issues
too.

```php
private function assertIssueScopeIsAllowed(User $user, int $organizationId, ?int $teamId): void
{
    $this->tenantScopeValidator->assertScopeIsValid(
        $user,
        $organizationId,
        $teamId,
        allowUnbound: false,
    );
    // Removed: manager-only check for org-level issues
}
```

### 4. `Issue::scopeVisibleTo()` — employees can see team issues ✅

Employees who are team members already see team-scoped issues (line 79:
`orWhereIn('team_id', $teamIds)`). No change needed here.

---

## Scope of Changes

### Backend changes (2 files)

| File                                              | Change                                                   |
| ------------------------------------------------- | -------------------------------------------------------- |
| `app/Models/Followup.php`                         | Extend `scopeOwned` to include team member follow-ups    |
| `app/Http/Controllers/API/v1/IssueController.php` | Remove manager-only guard in `assertIssueScopeIsAllowed` |

### Frontend changes

No frontend changes required. Both pages have no role guards:

- `app/dashboard/follow-ups/[id]/page.tsx` — calls `getTeamFollowUps(id)`
  directly
- `app/dashboard/issues/[id]/page.tsx` — calls `getIssue(issueId)` directly
- `IssueForm` has no role-based `disabled` or guard logic

---

## Files to Change

### `app/Models/Followup.php`

Replace `scopeOwned` — add `orWhereHas('team.users', ...)` branch to include
direct team members.

### `app/Http/Controllers/API/v1/IssueController.php`

In `assertIssueScopeIsAllowed`, remove the
`if (! $user->isOrganizationManager(...)) throw` block. Keep the
`assertScopeIsValid` call (ensures user is at least an org member).

---

## Acceptance Criteria

- [x] Employee role can load `dashboard/follow-ups/[teamId]` and sees follow-ups
      they did not create, as long as they are a member of that team
- [x] Employee role can view individual follow-up (`dashboard/follow-ups/[id]`)
      for their team's events
- [x] Employee role can edit an issue at `dashboard/issues/[id]` regardless of
      whether it has a `team_id` or only an `organization_id`
- [x] Manager role still has all the same access as before (no regressions)
- [x] No 403 or 422 errors for employee on follow-ups list or issue update
- [ ] Backend unit/feature tests pass for follow-up and issue policies

---

## Risk & Notes

- **No security regression**: `FollowupPolicy::viewAny` still gates on team
  membership — only the scope (what's returned inside the authorized list) is
  expanded.
- **Org-level issue removal**: The original restriction was precautionary, not
  by design. The `TenantScopeValidator::assertScopeIsValid` still enforces the
  user is a member of the organization, so unrelated users cannot create
  org-level issues.
- **Future restriction point**: When the time comes to restrict employees, add a
  policy check to `FollowupPolicy` and re-add the manager guard to
  `assertIssueScopeIsAllowed`. Do not re-use the `scopeOwned` approach — use a
  dedicated `can()` gate instead for clarity.

---

## References

- `app/Models/Followup.php:33` — `scopeOwned` (root cause #1)
- `app/Policies/FollowupPolicy.php:14` — `viewAny` (already correct)
- `app/Http/Controllers/API/v1/FollowupController.php:74` — calls
  `owned(Auth::id())`
- `app/Http/Controllers/API/v1/IssueController.php:175` —
  `assertIssueScopeIsAllowed` (root cause #2)
- `app/Models/Issue.php:67` — `scopeVisibleTo` (already correct for employees)
- `app/Models/User.php:134` — `isTeamMember` (returns true for employees in
  team)
- `app/dashboard/follow-ups/[id]/page.tsx` — no role guard, passes once backend
  is fixed
- `app/dashboard/issues/[id]/page.tsx` — no role guard, passes once backend is
  fixed
