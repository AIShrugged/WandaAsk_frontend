---
title: refactor: Remove demo organization creation feature
type: refactor
status: completed
date: 2026-05-12
---

# refactor: Remove demo organization creation feature

## Enhancement Summary

**Deepened on:** 2026-05-12 **Agents used:** architecture-strategist,
code-simplicity-reviewer, pattern-recognition-specialist, feasibility-reviewer,
security-sentinel, scope-guardian-reviewer

### Key Improvements Over Original Plan

1. **Critical gap found:** `is_demo` field removal breaks 3 test fixture files
   not listed in original scope — all five agents independently flagged this as
   the only real risk.
2. **Improved audit grep:** Original `from.*demo` pattern is imprecise; replaced
   with two targeted commands that catch static imports, dynamic imports, and
   `jest.mock()` path strings.
3. **Files Changed table expanded** from 3 to 6 entries.
4. **`is_demo` phantom field documented:** Field was never serialized by the
   backend `UserResource` — it was always `undefined` at runtime.
5. **Operational note added:** Users with in-progress demo generations at deploy
   time will have stuck jobs; backend cleanup recommended.

---

## Overview

Полностью удалить всю логику, компоненты и код, связанный с созданием demo
organization. Функциональность включает: сидирование демо-данных, отслеживание
прогресса генерации, удаление демо, флаг `is_demo` на пользователе и интеграцию
в layout дашборда.

## Scope — What Gets Removed

### Feature Directory (удаляется целиком)

```
features/demo/
  index.ts
  model/
    types.ts                  # DemoGenerationStatus, DemoStatusResult, SeedDemoParams, SeedDemoResult
  api/
    seed-demo.ts              # POST /demo/seed
    get-demo-status.ts        # GET /demo/status
    delete-demo.ts            # DELETE /demo
    __tests__/
      demo.test.ts
  ui/
    demo-seed-button.tsx      # Main interactive component (Client Component)
    demo-dropdown.tsx         # Config panel with SegmentedControl, Stepper
    demo-overlay.tsx          # Full-page progress indicator (portal)
    demo-seed-button-loader.tsx  # Dynamic import wrapper (ssr: false)
    __tests__/
      demo-seed-button.test.tsx
```

### Integration Point (правка)

```
app/dashboard/layout.tsx      # Remove import + <DemoSeedButtonLoader />
```

### Residual Type Field (убрать + фикстуры в тестах)

```
entities/user/model/types.ts                              # Remove `is_demo: boolean` from UserProps
features/user/ui/__tests__/user-info.test.tsx             # Remove `is_demo: false` from mock fixture (line 39)
features/user/ui/__tests__/user-menu-popup.test.tsx       # Remove `is_demo: false` from mock fixture (line 34)
features/user-profile/ui/__tests__/ProfileForm.test.tsx   # Remove `is_demo: false` from mock fixture (line 35)
```

> **Note on `is_demo`:** This field was never returned by
> `UserResource::toArray()` in the backend — it was always `undefined` at
> runtime. Its removal corrects a phantom type declaration, not a real data
> field.

## Acceptance Criteria

- [x] Директория `features/demo/` полностью удалена (все 11 файлов)
- [x] `app/dashboard/layout.tsx` не содержит импорта `DemoSeedButtonLoader` и не
      рендерит его
- [x] Поле `is_demo` удалено из `UserProps` в `entities/user/model/types.ts`
- [x] `is_demo: false` удалён из mock-фикстур в трёх тест-файлах
      (`user-info.test.tsx`, `user-menu-popup.test.tsx`, `ProfileForm.test.tsx`)
- [x] `npm run build` проходит без ошибок
- [x] `npm run lint` проходит без ошибок
- [x] `npm test -- --ci --passWithNoTests` проходит
- [x] Нет dangling imports на `@/features/demo` в других файлах

## Implementation Steps

### Step 1 — Audit all references

Перед удалением запустить следующие grep-команды и убедиться, что за пределами
`features/demo/` нет неожиданных зависимостей:

```bash
# Static ES module imports
grep -rn "from ['\"]@/features/demo" . --include="*.ts" --include="*.tsx"

# Dynamic imports (next/dynamic, import())
grep -rn "import(.*features/demo" . --include="*.ts" --include="*.tsx"

# jest.mock() path strings (not caught by import grep)
grep -rn "jest\.mock.*features/demo" . --include="*.ts" --include="*.tsx"

# Exported symbol names outside the feature
grep -rn "DemoSeedButton\|DemoSeedButtonLoader\|DemoDropdown\|DemoOverlay\|deleteDemo\|seedDemo\|getDemoStatus\|DemoGenerationStatus\|DemoStatusResult\|SeedDemoParams" \
  . --include="*.ts" --include="*.tsx" | grep -v "features/demo/"

# is_demo field — should return exactly 4 results (1 interface + 3 test fixtures)
grep -rn "is_demo" . --include="*.ts" --include="*.tsx" | grep -v "node_modules"

# Confirm no ROUTES.DEMO constant
grep -rn "DEMO\b" ./shared/lib/routes.ts
```

**Expected results:** Only `app/dashboard/layout.tsx` (import + JSX) for the
first three commands. Exactly 4 hits for `is_demo` (1 typedef + 3 test
fixtures).

### Step 2 — Remove demo feature directory

```bash
rm -rf features/demo/
```

### Step 3 — Update `app/dashboard/layout.tsx`

Удалить строку импорта:

```tsx
// REMOVE:
import { DemoSeedButtonLoader } from '@/features/demo';
```

Удалить JSX-элемент из header (line ~80):

```tsx
// REMOVE:
<DemoSeedButtonLoader />
```

### Step 4 — Remove `is_demo` from UserProps

**File:** `entities/user/model/types.ts` (line 25)

```typescript
// REMOVE this line from UserProps:
readonly is_demo: boolean;
```

### Step 4b — Remove `is_demo` from test fixtures

Three test files contain `is_demo: false` in mock `UserProps` objects. Remove
that line from each:

- `features/user/ui/__tests__/user-info.test.tsx` — line 39
- `features/user/ui/__tests__/user-menu-popup.test.tsx` — line 34
- `features/user-profile/ui/__tests__/ProfileForm.test.tsx` — line 35

Without this step, TypeScript strict mode will reject these as excess-property
errors and `npm run build` will fail.

### Step 5 — Verify

```bash
npm run lint:fix
npm run build
npm test -- --ci --passWithNoTests
```

## Files Changed

| File                                                      | Action                                             |
| --------------------------------------------------------- | -------------------------------------------------- |
| `features/demo/` (entire dir, 11 files)                   | Delete                                             |
| `app/dashboard/layout.tsx`                                | Edit — remove import + JSX element                 |
| `entities/user/model/types.ts`                            | Edit — remove `is_demo` field                      |
| `features/user/ui/__tests__/user-info.test.tsx`           | Edit — remove `is_demo: false` from mock (line 39) |
| `features/user/ui/__tests__/user-menu-popup.test.tsx`     | Edit — remove `is_demo: false` from mock (line 34) |
| `features/user-profile/ui/__tests__/ProfileForm.test.tsx` | Edit — remove `is_demo: false` from mock (line 35) |

## Risks

- **`is_demo` test fixtures (HIGH if missed):** Three test files outside
  `features/demo/` include `is_demo: false` in `UserProps` mock objects.
  Removing the field from the type without updating these fixtures causes a
  TypeScript excess-property error and a build failure. Addressed in Step 4b.
- **Other features depending on `features/demo`:** Not expected — FSD forbids
  cross-feature imports and the Step 1 audit confirms no cross-feature usage.
  The only consumer is `app/dashboard/layout.tsx` (which is in scope).
- **Backend routes still exist:** Removing frontend code doesn't affect backend.
  `/demo/seed`, `/demo/status`, `DELETE /demo` remain functional on the backend
  — this is acceptable.
- **Users with in-progress demo generation at deploy time (operational):** If
  any user has a `DemoGeneration` record in `generating` or `pending` state when
  the frontend is deployed, their generation job will complete or fail on the
  backend but they will have no UI to see the result or clean up. Consider
  running a backend admin script to purge active `DemoGeneration` records before
  or shortly after deployment.

## References

- Integration point: `app/dashboard/layout.tsx:5,80`
- Feature public API: `features/demo/index.ts`
- User type: `entities/user/model/types.ts:25`
- Test fixtures with `is_demo`:
  `features/user/ui/__tests__/user-info.test.tsx:39`,
  `features/user/ui/__tests__/user-menu-popup.test.tsx:34`,
  `features/user-profile/ui/__tests__/ProfileForm.test.tsx:35`
