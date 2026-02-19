---
title: "Server Action JSON Parse Failure on Laravel 5xx HTML Error Responses"
problem_type: integration-issues
category: api-error-handling
tags:
  - server-actions
  - fetch
  - json-parsing
  - laravel
  - error-handling
  - next.js
affected_files:
  - features/auth/api/auth.ts
  - shared/api/
symptoms:
  - "SyntaxError: Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON"
  - "POST /auth/login or /auth/register throws on res.json()"
  - "Server Action crashes when backend returns a 5xx HTML error page"
  - "Browser DevTools shows POST to localhost instead of backend URL (this is normal)"
framework: "Next.js 16"
date: 2026-02-19
---

# Server Action JSON Parse Failure on Laravel 5xx HTML Error Responses

## Problem Description

When the Laravel backend encountered an error and returned a 5xx HTML error page instead of a JSON body, the Next.js Server Action called `res.json()` unconditionally, which caused a `SyntaxError` because `JSON.parse()` choked on the `<!DOCTYPE html>` preamble. The error propagated unhandled, surfacing a cryptic JavaScript engine exception to the user instead of a friendly message.

A secondary confusion arose because developers inspecting browser DevTools saw `POST /auth/login` going to `localhost:3000` — this looks wrong but is **expected** Next.js Server Action behavior (see Architecture section below).

---

## Root Cause Analysis

The immediate cause was calling `res.json()` directly on a fetch response without first verifying the body contains valid JSON. When Laravel is down, misconfigured, or throws an unhandled exception, it returns an HTML error page. `res.json()` internally parses the raw text with `JSON.parse()` and throws a `SyntaxError` when it encounters HTML.

The second problem was that this error was unhandled inside the Server Action. Because it propagated unhandled, Next.js had no friendly error to surface — users saw either a generic "Something went wrong" with no actionable guidance, or in development mode, the raw SyntaxError with "Unexpected token '<'" which tells the user nothing useful.

---

## Solution

### Fix: Replace `res.json()` with safe two-step parse

```typescript
// features/auth/api/auth.ts

export async function login(data: LoginInput): Promise<void> {
  const validated = LoginSchema.parse(data);

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validated),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000), // prevent hanging
  });

  // ✅ Safe JSON parsing — handles HTML error responses from backend
  const text = await res.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error('Server error. Please try again later.');
  }

  if (!res.ok) {
    throw new Error((json?.message as string) || 'Login failed');
  }

  // ✅ Validate token presence and type before use
  if (!json.token || typeof json.token !== 'string') {
    throw new Error('Authentication failed. Please try again.');
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: 'token',
    value: json.token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect(ROUTES.AUTH.ORGANIZATION);
}
```

### Extractable Helper: `parseJsonResponse`

Extract into `shared/api/` so every Server Action benefits from safe parsing:

```typescript
// shared/api/safe-fetch.ts (proposed)

async function parseJsonResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error('Server error. Please try again later.');
  }
}
```

Usage in any Server Action:
```typescript
const json = await parseJsonResponse(res);
if (!res.ok) {
  throw new Error((json?.message as string) || 'Request failed');
}
```

---

## Server Action Request Flow Architecture

The POST to `localhost` in DevTools is **correct and expected**. The browser never communicates with Laravel directly:

```
Browser                    Next.js Server              Laravel Backend
   |                            |                            |
   |-- POST /auth/login ------> |                            |
   |   (visible in DevTools)    |-- fetch(API_URL/auth) ---> |
   |                            |   NOT visible in DevTools  |
   |                            |                            |
   |                            |<-- HTML 500 error -------- |
   |                            |   (triggers SyntaxError    |
   |                            |    on res.json())          |
   |<-- 500 from Next.js ------ |
   |   SyntaxError in console
```

**Why this matters for debugging:**
- The internal backend fetch is invisible in browser DevTools — check the **terminal** running `npm run dev` instead
- The `POST /auth/login` in DevTools is the Server Action invocation, not the Laravel request
- All backend errors must be caught server-side and converted to user-friendly messages before reaching the client

---

## Prevention Strategies

### 1. Never use `res.json()` directly in Server Actions

Always use the safe two-step pattern or the `parseJsonResponse` helper. Add to code review checklist:

- ❌ `const json = await res.json()` — throws on HTML responses
- ✅ `const json = await parseJsonResponse(res)` — handles HTML gracefully

### 2. Code Review Checklist for Server Actions

When reviewing any file with `'use server'`:
- [ ] No direct calls to `res.json()`
- [ ] `res.ok` checked before accessing response fields
- [ ] Token/required fields validated with `typeof` guards (not just truthiness)
- [ ] No raw backend error messages forwarded to the user
- [ ] `AbortSignal.timeout()` set on fetch to prevent hanging requests

### 3. Detect HTML responses during debugging

Temporarily add this to identify the issue:

```typescript
const contentType = res.headers.get('content-type');
console.log('[Debug] Backend content-type:', contentType);
// Expect: application/json
// Red flag: text/html; charset=utf-8

const text = await res.text();
console.log('[Debug] Raw response (first 200 chars):', text.slice(0, 200));
```

### 4. Alternative: Content-Type guard (strict mode)

```typescript
async function parseJsonResponse(res: Response): Promise<Record<string, unknown>> {
  const contentType = res.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    // Backend returned non-JSON (likely HTML error page)
    throw new Error('Server error. Please try again later.');
  }
  return res.json() as Promise<Record<string, unknown>>;
}
```

Use the text-based approach for production resilience; use the content-type guard for strict API contracts.

### 5. Team mental model

> **Server Actions run on the server.** Treat them like API route handlers, not client-side fetch calls. When debugging, read the **terminal**, not just the browser console. The backend request is invisible in DevTools by design.

---

## Related

- `features/auth/api/auth.ts` — where the fix was applied
- `shared/lib/config.ts` — `API_URL` env var used in Server Actions
- `todos/006-pending-p2-backend-error-messages-forwarded-to-client.md` — related improvement: don't forward raw backend messages to users
