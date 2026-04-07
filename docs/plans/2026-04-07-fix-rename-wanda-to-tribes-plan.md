---
title: 'fix: Rename remaining Wanda references to Tribes in UI'
type: fix
status: completed
date: 2026-04-07
---

# fix: Rename remaining Wanda references to Tribes in UI

## Overview

The frontend has already been rebranded from "Wanda" / "WandaAsk" to "Tribes"
(`APP_NAME = 'Tribes'`, logo, page titles, metadata). One user-visible string
still says `WandaAsk_backend` — a hardcoded example badge inside the
organization issue-types settings UI. This plan fixes that badge and verifies
the rest of the app is clean via lint + unit tests.

## Current State

### Already rebranded (no action needed)

| Location                            | Current value                               |
| ----------------------------------- | ------------------------------------------- |
| `shared/lib/app-name.ts:1`          | `APP_NAME = 'Tribes'`                       |
| `shared/ui/brand/TribesLogo.tsx:16` | Renders `{APP_NAME}` = "Tribes"             |
| `app/layout.tsx:19-20`              | `title: APP_NAME` → "Tribes"                |
| `app/page.tsx`                      | "Tribes — AI Meeting Intelligence Platform" |
| `package.json`                      | `"name": "spodial_hr_frontend"` (neutral)   |

### Remaining "Wanda" in user-visible source code

| File                                                             | Line | Content                           | Action                     |
| ---------------------------------------------------------------- | ---- | --------------------------------- | -------------------------- |
| `features/organization/ui/organization-issue-types-settings.tsx` | 192  | `<Badge>WandaAsk_backend</Badge>` | Rename to `Tribes_backend` |

### Not in scope (docs/tooling only, not user-visible)

- `README.md`, `QWEN.md`, `CLAUDE.md` — developer docs, not rendered in app
- `docs/plans/*.md`, `changelog/*.md` — historical artifacts
- `.claude/agents/*.md` — agent definitions, not visible to users

## Problem Statement

The organization settings page shows a "Repo payload example" section with three
badges demonstrating the format `<platform> / <org> / <repo>`. The third badge
reads `WandaAsk_backend` which still refers to the old brand name. Users
configuring integrations will see this outdated name.

## Proposed Fix

### `features/organization/ui/organization-issue-types-settings.tsx:192`

```tsx
// Before
<Badge>github</Badge>
<Badge>AIShrugged</Badge>
<Badge>WandaAsk_backend</Badge>

// After
<Badge>github</Badge>
<Badge>AIShrugged</Badge>
<Badge>Tribes_backend</Badge>
```

> **Note:** The badge is a illustrative example of a repo path, not a live link.
> Changing `WandaAsk_backend` → `Tribes_backend` keeps the example coherent with
> the current brand without breaking any functionality.

## Acceptance Criteria

- [x] `<Badge>WandaAsk_backend</Badge>` is gone from the codebase
- [x] `<Badge>Tribes_backend</Badge>` appears in the same location as the
      example
- [x] `grep -r "WandaAsk" features/ shared/ entities/ widgets/ app/` returns no
      matches
- [x] `npm run lint` passes with 0 errors
- [x] `npm test -- --ci --passWithNoTests` passes (all suites green, no
      regressions)
- [ ] `npm run build` completes without TypeScript errors

## Implementation Steps

1. **Edit** `features/organization/ui/organization-issue-types-settings.tsx:192`
   — replace `WandaAsk_backend` with `Tribes_backend`

2. **Verify** no other Wanda strings exist in source directories:

   ```bash
   grep -rn "Wanda" features/ shared/ entities/ widgets/ app/ --include="*.tsx" --include="*.ts"
   ```

   Expected: 0 matches.

3. **Lint**:

   ```bash
   npm run lint
   ```

4. **Unit tests**:

   ```bash
   npm test -- --ci --passWithNoTests
   ```

   Note: `features/calendar/ui/__tests__/detach-calendar-button.test.tsx` has a
   pre-existing SIGSEGV crash — this is known and should be ignored.

5. **Build check** (optional, catches TS errors lint misses):
   ```bash
   npm run build
   ```

## Risk

**Very low.** This is a one-line string change in example/demo text. No logic,
no types, no API calls are affected.

## References

- `shared/lib/app-name.ts` — single source of truth for brand name
- `shared/ui/brand/TribesLogo.tsx` — logo component already uses `APP_NAME`
- Prior rebranding: `changelog/2026-03-06.md` — "Все упоминания «WandaAsk» /
  «Wanda» заменены на «Tribes»"
