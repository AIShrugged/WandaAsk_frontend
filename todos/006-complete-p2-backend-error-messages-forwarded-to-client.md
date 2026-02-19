---
status: pending
priority: p2
issue_id: "006"
tags: [code-review, security]
---

# Backend error messages forwarded verbatim to the client

## Problem Statement

`features/auth/api/auth.ts` passes the raw Laravel `json.message` field directly into `throw new Error(...)`, which is then rendered in the DOM via `handleFormError` and `errors.root?.message`. A verbose backend error (stack trace, DB error, internal path) would appear in the login/register form.

Also: `shared/lib/httpClient.ts` includes the full internal URL + raw response body in thrown errors:
```typescript
throw new Error(`${method} ${url} failed: ${res.status} ${res.statusText} — ${text}`);
```
If this error reaches a React error boundary, the full API URL and backend response are visible to users.

## Proposed Solutions

### Option A: Allowlist known safe messages (Recommended for auth)
```typescript
const SAFE_MESSAGES = ['Invalid credentials', 'Email already taken', 'User not found'];
const rawMessage = json?.message as string;
const userMessage = SAFE_MESSAGES.includes(rawMessage) ? rawMessage : 'Login failed';
throw new Error(userMessage);
```

### Option B: Use HTTP status code to pick frontend string
```typescript
const message = res.status === 401 ? 'Invalid credentials'
  : res.status === 422 ? 'Please check your input'
  : 'Login failed';
throw new Error(message);
```

### Option C: Fix httpClient to separate logging from user message
```typescript
// Server-side only
console.error(`[httpClient] ${method} ${url} → ${res.status}: ${text}`);
throw new Error('A server error occurred. Please try again.');
```

## Acceptance Criteria
- [ ] Auth actions never show raw backend message in the UI
- [ ] `httpClient` doesn't include internal URL or backend body in thrown errors
- [ ] Error message shown to user is always controlled by frontend code

## Affected Files
- `features/auth/api/auth.ts`
- `shared/lib/httpClient.ts`
- `features/organization/api/organization.ts` (similar pattern)
