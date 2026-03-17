---
name: test
description:
  Run unit tests, E2E tests, or check test coverage for WandaAsk frontend. Use
  when asked to run tests, check if tests pass, write and run tests, verify
  coverage, or debug test failures. Triggers on "run tests", "check tests", "are
  tests passing", "test coverage", "run jest", "run playwright", "e2e tests", or
  any request involving test execution or test results.
---

# Test Runner Skill

Run and report on unit tests (Jest) and E2E tests (Playwright) for WandaAsk
frontend.

## Commands

```bash
# Unit tests (all)
npm test -- --ci --passWithNoTests

# Unit tests — specific file or pattern
npm test -- --ci --testPathPattern="features/chat"

# Unit tests with coverage
npm test -- --ci --coverage --passWithNoTests

# E2E tests (requires dev server running on port 8080)
npm run test:e2e

# E2E — specific spec file
npx playwright test e2e/profile/profile.spec.ts

# E2E auth setup (run once before E2E tests if e2e/.auth/user.json is missing)
npm run test:e2e -- --project=setup
```

## Workflow

### 1 — Understand the request

Determine which test scope is needed:

- **Unit** (`npm test`): component logic, server actions, hooks, utilities
- **E2E** (`npm run test:e2e`): user flows in a real browser
- **Coverage**: add `--coverage` flag to unit test run

If ambiguous, default to running unit tests only.

### 2 — Run the tests

Run the appropriate command. For unit tests, prefer adding `--testPathPattern`
to narrow scope when the user mentions a specific feature or file — it's faster
and reduces noise.

### 3 — Parse results

**Jest output** — look for:

- `Tests: N failed, N passed, N total`
- `Test Suites: N failed`
- Failed test names (lines starting with `✕` or `×`)
- Coverage table (if `--coverage` was passed)

**Playwright output** — look for:

- `N passed`, `N failed`
- Screenshot diffs (saved to `e2e/...spec.ts-snapshots/`)
- Timeout errors (usually means dev server is not running)

### 4 — Report results

Summarize concisely:

```
✅ 570 tests passed (99 suites)

or

❌ 3 tests failed:

- features/chat/ui/__tests__/chat.test.tsx
  › renders empty state when no messages
  Expected: "No messages yet"
  Received: undefined
```

If coverage was requested, show the summary table and flag any metrics below the
thresholds:

- Branches: 20%
- Functions: 24%
- Lines: 23%
- Statements: 22%

### 5 — On failure

If tests fail:

1. Read the failing test file to understand what's being tested
2. Read the implementation file being tested
3. Diagnose the root cause (broken import, missing mock, logic error)
4. If the user asked to fix tests, apply the fix; otherwise report findings

## Common issues

| Symptom                               | Likely cause                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| `Cannot find module '@/...'`          | Path alias issue; check `jest.config.mjs` moduleNameMapper                     |
| `useRouter is not a function`         | Missing `next/navigation` mock in test setup                                   |
| `IntersectionObserver is not defined` | Add mock via `Object.defineProperty(globalThis, 'IntersectionObserver', ...)`  |
| E2E: `net::ERR_CONNECTION_REFUSED`    | Dev server not running on port 8080                                            |
| E2E: auth errors                      | Run setup project first: `npm run test:e2e -- --project=setup`                 |
| Snapshot mismatch                     | Update with `npx playwright test --update-snapshots` (confirm with user first) |

## Project conventions

- Test files: `__tests__/` subdirectory inside feature, or `*.test.tsx`
  alongside source
- Mocks: `__mocks__/` at project root + inline `jest.mock()` calls
- `framer-motion` / `motion/react-client` → mocked to plain divs
- `sonner` → `toast.error/success` are `jest.fn()`
- `next/navigation` → `useRouter` is `jest.fn()`
- Async server components → `render(await Component(props))`
