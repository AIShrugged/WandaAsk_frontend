---
status: pending
priority: p3
issue_id: '004'
tags: [code-review, quality, profile, naming]
dependencies: []
---

# Fix redirect component name: `PasswordRedirect` → `ProfilePasswordPage`

## Problem Statement

The plan names the redirect component in
`app/dashboard/profile/password/page.tsx` as `PasswordRedirect`. The established
convention in this codebase names page components after their route segment, not
after what they do.

## Findings

- All redirect-only pages in the codebase use the pattern: name the function
  after the route segment
  - `app/dashboard/profile/page.tsx` → `ProfilePage`
  - `app/dashboard/agents/page.tsx` → `AgentsPage`
  - `app/dashboard/meetings/page.tsx` → `MeetingsPage`
- The plan proposes `PasswordRedirect` — a verb-description name, inconsistent
  with the noun-route convention
- Pattern-recognition-specialist confirmed: "The convention is to name the
  function after the route segment, not after what it does"

## Proposed Solutions

### Option 1: Name it `ProfilePasswordPage`

```tsx
// app/dashboard/profile/password/page.tsx
import { redirect } from 'next/navigation';
import { ROUTES } from '@/shared/lib/routes';

export default function ProfilePasswordPage() {
  redirect(ROUTES.DASHBOARD.PROFILE_ACCOUNT);
}
```

**Effort:** 2 minutes  
**Risk:** None

## Recommended Action

Use `ProfilePasswordPage`. Trivial fix.

## Technical Details

**Affected files:**

- `app/dashboard/profile/password/page.tsx` — rename default export function

## Acceptance Criteria

- [ ] Function is named `ProfilePasswordPage` (or `PasswordPage` following
      shorter segment convention)
- [ ] Consistent with other redirect page component names in `app/`

## Work Log

### 2026-05-15 — Discovered during plan review

**By:** Claude Code  
**Actions:** Pattern-recognition-specialist reviewed naming conventions across
all `app/` page files
