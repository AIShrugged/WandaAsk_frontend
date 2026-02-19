---
status: pending
priority: p1
issue_id: "005"
tags: [code-review, quality, security]
---

# `auth.ts` silently redirects to org page even when token not set

## Problem Statement

In `features/auth/api/auth.ts`, both `login` and `register` redirect to `/auth/organization` regardless of whether a token was returned in the response. If the backend returns HTTP 200 without a `token` field, the cookie is never set but the redirect still happens, producing a silent redirect loop: `/auth/organization` → middleware detects no token → `/auth/login`.

Additionally, the current fix (uncommitted) uses `as string` casts on `json.token` without runtime validation — if the backend returns a non-string token, it passes silently.

## Findings

```typescript
// Current code (both committed and uncommitted fix)
if (json.token) {
  cookieStore.set({ name: 'token', value: json.token as string, ... });
}
redirect(ROUTES.AUTH.ORGANIZATION); // runs even if token was absent!
```

No error is shown to the user if login "succeeds" but no token is returned.

## Proposed Solution

Make token mandatory and validate its type:
```typescript
if (!json.token || typeof json.token !== 'string') {
  throw new Error('Authentication failed. Please try again.');
}
const cookieStore = await cookies();
cookieStore.set({ name: 'token', value: json.token, ... });
redirect(ROUTES.AUTH.ORGANIZATION);
```

**Effort:** Small. **Risk:** None — only shows error in an edge case that currently causes a silent loop.

## Acceptance Criteria
- [ ] `login` throws a user-visible error if `json.token` is absent or not a string
- [ ] `register` throws a user-visible error if `json.token` is absent or not a string
- [ ] Redirect to `/auth/organization` only happens after token is confirmed set
- [ ] `as string` casts replaced with `typeof` guards

## Affected Files
- `features/auth/api/auth.ts`
