---
status: pending
priority: p2
issue_id: "010"
tags: [code-review, quality]
---

# `auth.ts` duplicates JSON parsing and cookie options 3x

## Problem Statement

`features/auth/api/auth.ts` has two nearly identical duplication problems:

**1. JSON parsing block** — copy-pasted verbatim in `login` (lines 28-34) and `register` (lines 66-72):
```typescript
const text = await res.text();
let json: Record<string, unknown>;
try {
  json = JSON.parse(text) as Record<string, unknown>;
} catch {
  throw new Error('Server error. Please try again later.');
}
```

**2. Cookie options** — `{ httpOnly, secure, sameSite, path, maxAge }` repeated 3 times (token in login, token in register, organization_id in register).

**3. `cookies()` called twice in `register`** — awaited separately for `token` (line 80) and `organization_id` (line 92).

## Proposed Solutions

### Extract `parseJsonResponse` helper
```typescript
async function parseJsonResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error('Server error. Please try again later.');
  }
}

// Usage:
const json = await parseJsonResponse(res);
```

### Extract cookie options constant
```typescript
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
} as const;

// Usage:
cookieStore.set({ name: 'token', value: json.token, ...SESSION_COOKIE_OPTIONS });
```

### Call `cookies()` once in register
```typescript
const cookieStore = await cookies(); // once at top
if (json.token) cookieStore.set({ ... });
if (json.organization_id) cookieStore.set({ ... });
```

**Estimated reduction:** ~15 lines. **Effort:** Small.

## Acceptance Criteria
- [ ] `parseJsonResponse` extracted as a private helper
- [ ] Cookie options extracted as a const (can be shared with `organization.ts` fix in #002)
- [ ] `cookies()` called once in `register`
- [ ] Behavior unchanged

## Affected Files
- `features/auth/api/auth.ts`
