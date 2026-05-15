---
status: pending
priority: p3
issue_id: '005'
tags: [code-review, architecture, api-layer, profile, pre-existing]
dependencies: []
---

# Migrate `updateProfile` and `changePassword` from raw `fetch` to `httpClient`

## Problem Statement

`features/user-profile/api/profile.ts` uses raw `fetch()` with manual
`getAuthHeaders()` for both `updateProfile` and `changePassword`. This violates
CLAUDE.md Rule 2 (API Layer Conventions): "Do not call `fetch(...)` directly.
Use the clients from `@/shared/lib/httpClient`."

This is a pre-existing issue unrelated to the current tab-merge plan, but it was
independently flagged by 3 separate review agents (security-sentinel,
performance-oracle, agent-native-reviewer) during the plan review.

## Findings

- `features/user-profile/api/profile.ts:21–22` — `updateProfile` uses raw
  `fetch` + manual `getAuthHeaders()`
- `features/user-profile/api/profile.ts:51–88` — `changePassword` uses raw
  `fetch` + manual `getAuthHeaders()`
- Both bypass centralized error logging, `ServerError` normalization, and
  automatic 401 redirect
- `httpClient` handles: auth headers, 401 redirect to login, `ServerError`
  throwing, request logging
- Raw `fetch` means if the session expires while the user is on the Account
  page, they get an unhandled error instead of a redirect to login

## Proposed Solutions

### Option 1: Migrate both functions to `httpClient`

**Approach:** Replace raw `fetch` calls with `httpClient` from
`@/shared/lib/httpClient`. Wrap in try/catch using `ServerError` for the
`ActionResult` pattern.

```ts
// updateProfile — after migration
export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<ActionResult<UserProps>> {
  try {
    const { data } = await httpClient<UserProps>(`${API_URL}/users/me`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    revalidatePath(ROUTES.DASHBOARD.PROFILE_ACCOUNT);
    return { data, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to update profile',
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

**Pros:**

- Complies with CLAUDE.md Rule 2
- Gets 401-redirect-to-login for free
- Consistent with rest of codebase
- Centralized request logging

**Cons:**

- Touches two Server Actions in production code
- Requires test updates if mocking changes

**Effort:** 1–2 hours  
**Risk:** Low

## Recommended Action

To be filled during triage. This is a pre-existing violation — recommended to
fix as a separate PR from the tab-merge refactor to keep the changes isolated.

## Technical Details

**Affected files:**

- `features/user-profile/api/profile.ts` — `updateProfile` (lines 17–34),
  `changePassword` (lines 45–88)
- Potentially `features/user-profile/ui/__tests__/` — if tests mock `fetch`
  directly they'll need updating

**Dependencies:**

- `shared/lib/httpClient.ts` — `httpClient<T>`
- `shared/lib/errors.ts` — `ServerError`
- `shared/lib/apiError.ts` — `parseApiError`

## Resources

- CLAUDE.md — "Rule 2 — Use shared HTTP clients, never raw `fetch`"
- `shared/lib/httpClient.ts` — correct client to use
- Plan:
  `docs/plans/2026-05-15-refactor-profile-merge-info-password-into-account-tab-plan.md`
- Flagged by: security-sentinel, performance-oracle, agent-native-reviewer

## Acceptance Criteria

- [ ] `updateProfile` uses `httpClient` — no raw `fetch`
- [ ] `changePassword` uses `httpClient` — no raw `fetch`
- [ ] 401 responses trigger automatic redirect to login
- [ ] All existing tests pass

## Work Log

### 2026-05-15 — Discovered during plan review

**By:** Claude Code  
**Actions:**

- Three independent review agents flagged this pre-existing violation
- Identified as separate from tab-merge scope — create as standalone fix
