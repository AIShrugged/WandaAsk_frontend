---
status: pending
priority: p2
issue_id: "009"
tags: [code-review, quality]
---

# `auth.ts` fetch calls have no timeout — can hang indefinitely

## Problem Statement

Both `login` and `register` Server Actions call `fetch` without a timeout. If the Laravel backend is slow or unresponsive, the Server Action hangs indefinitely, blocking the user's request with no feedback.

## Proposed Solution

Add `AbortSignal.timeout()` to both fetch calls:
```typescript
const res = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(validated),
  cache: 'no-store',
  signal: AbortSignal.timeout(10_000), // 10 seconds
});
```

When the timeout fires, fetch throws `DOMException: The operation was aborted`. This should be caught and shown as a user-friendly error ("Request timed out, please try again").

Consider adding this to `shared/lib/httpClient.ts` as well for consistency across all API calls.

**Effort:** Small. **Risk:** None (strictly improves behavior).

## Acceptance Criteria
- [ ] `login` fetch has 10s timeout
- [ ] `register` fetch has 10s timeout
- [ ] Timeout error shown as user-friendly message (not raw DOMException)
- [ ] Consider adding to `httpClient.ts` for all other API calls

## Affected Files
- `features/auth/api/auth.ts`
- `shared/lib/httpClient.ts` (optional, for consistency)
