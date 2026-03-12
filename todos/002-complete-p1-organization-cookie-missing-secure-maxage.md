---
status: pending
priority: p1
issue_id: '002'
tags: [code-review, security]
---

# `organization_id` cookie missing `secure` flag and `maxAge`

## Problem Statement

In `features/organization/api/organization.ts`, the `organization_id` cookie is
set without `secure: true` (in production) and without `maxAge`. By contrast,
the `token` cookie in `auth.ts` correctly sets both.

The `organization_id` cookie controls which organization's data the user sees. A
stolen or injected value can pivot an authenticated user into another
organization's data scope if the backend doesn't independently re-authorize it.

## Findings

Two places in `features/organization/api/organization.ts` set `organization_id`
without security options:

- `setActiveOrganization` (approx. lines 116–122)
- `selectOrganizationAction` (approx. lines 134–140)

Without `secure`: cookie transmitted over plain HTTP. Without `maxAge`: session
cookie, browser may persist indefinitely.

## Proposed Solutions

### Option A: Add missing options to match `token` cookie (Recommended)

```typescript
store.set({
  name: 'organization_id',
  value: id,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days, same as token
});
```

**Pros:** Consistent with existing auth cookie pattern. **Effort:** Small.
**Risk:** None.

### Option B: Extract shared cookie options constant

```typescript
// features/auth/api/auth.ts or shared/lib/cookie-options.ts
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
} as const;
```

Then use `{ name: 'organization_id', value: id, ...SESSION_COOKIE_OPTIONS }`
everywhere.

**Pros:** Eliminates duplication across auth.ts + organization.ts. **Effort:**
Small-Medium.

## Acceptance Criteria

- [ ] `secure: process.env.NODE_ENV === 'production'` added to
      `setActiveOrganization`
- [ ] `maxAge: 60 * 60 * 24 * 7` added to `setActiveOrganization`
- [ ] Same fixes applied to `selectOrganizationAction`
- [ ] No regression in organization switching behavior

## Affected Files

- `features/organization/api/organization.ts`
