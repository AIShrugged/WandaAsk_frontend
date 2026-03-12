---
status: pending
priority: p3
issue_id: '011'
tags: [code-review, quality]
---

# `callbackUrl` set in middleware but never consumed

## Problem Statement

`middleware.ts` sets `callbackUrl` on the redirect URL when unauthenticated
users try to access `/dashboard`:

```typescript
const loginUrl = new URL('/auth/login', request.url);
loginUrl.searchParams.set('callbackUrl', pathname);
```

However, no component reads `callbackUrl` from search params. Searching the
codebase finds zero usages. This dead code creates a future open redirect risk
if someone adds a consumer without proper path validation.

## Proposed Solutions

### Option A: Remove the dead parameter (Recommended)

```typescript
return NextResponse.redirect(new URL('/auth/login', request.url));
```

### Option B: Implement redirect-after-login properly

Read `callbackUrl` in login form, validate it starts with `/dashboard/`, and
redirect after successful login instead of always going to `/auth/organization`.

## Acceptance Criteria

- [ ] Either `callbackUrl` is removed from middleware OR properly consumed with
      path validation
- [ ] No open redirect risk (only allow paths starting with `/`)

## Affected Files

- `middleware.ts`
- `features/auth/ui/login-form.tsx` (if implementing option B)
