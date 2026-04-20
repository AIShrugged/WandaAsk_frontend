---
title: 'feat: Issue Type Filter Options from Backend'
type: feat
status: completed
date: 2026-04-20
---

# feat: Issue Type Filter Options from Backend

## Overview

The `Type` dropdown in issue/task filter bars currently uses three separate
hardcoded `TYPE_OPTIONS` arrays scattered across filter components. The backend
already provides per-organization issue types via
`OrganizationProps.issue_types` (a field returned by
`GET /api/v1/organizations/{id}`). This plan replaces all hardcoded type option
arrays with data derived from the backend, removes dead code, and updates
related tests.

---

## Problem Statement

There are **3 duplicate hardcoded** `TYPE_OPTIONS` arrays in the frontend:

| File                                         | Lines | Problem                                                                |
| -------------------------------------------- | ----- | ---------------------------------------------------------------------- |
| `features/issues/ui/shared-filters-bar.tsx`  | 27–31 | Hardcoded `[development, organization]` — missing `frontend`/`backend` |
| `features/issues/ui/tasks-kanban-client.tsx` | 44–48 | Same 2 types — duplicate definition                                    |
| `features/issues/ui/filters-modal.tsx`       | 27–31 | Same 2 types — duplicate definition                                    |

Meanwhile, `features/issues/model/types.ts` already exports `ISSUE_TYPE_OPTIONS`
with **4 types**, and `entities/organization/model/types.ts` defines
`OrganizationIssueType` which is already populated from the backend
(`OrganizationProps.issue_types`). The filter components are simply not wired to
either of these.

---

## Backend Context

The backend already handles this correctly:

- **Table**: `organization_issue_types` — per-org or global defaults
- **Resolution**: `Organization::resolvedIssueTypes()` — merges org-specific
  overrides with global defaults
- **API**: `GET /api/v1/organizations/{id}` returns
  `issue_types: OrganizationIssueType[]` via `OrganizationResource`
- **Types**: Each `OrganizationIssueType` has
  `{ key, name, base_type, is_active, ... }`

**No new API endpoint is required.** The data is already in the org object.

**Important**: Backend canonical types are `development` and `organization`.
`frontend` and `backend` are deprecated (kept for backward compatibility).
Filters should show what the backend provides, not a hardcoded list.

---

## Existing Relevant Types

```typescript
// entities/organization/model/types.ts
interface OrganizationIssueType {
  id: number;
  key: string;           // e.g. 'development', 'organization', 'frontend'
  name: string;          // e.g. 'Development', 'Organization'
  base_type: string;
  is_active: boolean;
  // ...
}

interface OrganizationProps {
  // ...
  issue_types?: OrganizationIssueType[];
}

// features/issues/model/types.ts
export type IssueType = 'development' | 'organization' | 'frontend' | 'backend';
export const ISSUE_TYPE_OPTIONS = [...]; // 4 items — not used by filters
export const isIssueType = (value: string): value is IssueType => [...];

interface SharedFilters {
  type: IssueType | '';
  // ...
}
```

---

## Proposed Solution

### Strategy

Use `organization.issue_types` (already fetched, already typed) to derive filter
options. Map `OrganizationIssueType[]` → `{ value: string; label: string }[]`
using `key` and `name` fields. Pass derived options into the shared filter
components.

No new server action or API call is needed — the org data is already in scope
where filters are rendered.

### Key Decisions

1. **No new API call** — derive options from the org object already available in
   context
2. **Replace local `TYPE_OPTIONS`** in all 3 filter files with a prop or derived
   value
3. **Keep `IssueType` union type** for TypeScript narrowing, but consider
   widening to `string` for the filter value since backend keys are dynamic
4. **Remove `ISSUE_TYPE_OPTIONS` constant** from
   `features/issues/model/types.ts` if nothing else uses it after migration
   (dead code cleanup)
5. **Fallback**: If `issue_types` is empty or undefined, fall back to
   `ISSUE_TYPE_OPTIONS` to avoid breaking existing behavior

---

## Implementation Plan

### Step 1 — Add a mapper utility

**File**: `features/issues/model/types.ts` (or
`features/issues/lib/issue-type-options.ts`)

```typescript
// features/issues/lib/issue-type-options.ts
import type { OrganizationIssueType } from '@/entities/organization';

export function issueTypeOptionsFromOrg(
  issueTypes: OrganizationIssueType[] | undefined,
): { value: string; label: string }[] {
  if (!issueTypes || issueTypes.length === 0) {
    return ISSUE_TYPE_OPTIONS; // fallback
  }
  return issueTypes
    .filter((t) => t.is_active)
    .map((t) => ({ value: t.key, label: t.name }));
}
```

### Step 2 — Update `SharedFiltersBar` props

**File**: `features/issues/ui/shared-filters-bar.tsx`

- Remove local `TYPE_OPTIONS` constant (lines 27–31)
- Add `issueTypes?: OrganizationIssueType[]` to `SharedFiltersBarProps`
- Derive options inline:
  `const typeOptions = issueTypeOptionsFromOrg(issueTypes)`
- Pass `typeOptions` to `<InputDropdown options={typeOptions} />`

### Step 4 — Update `TasksKanbanClient`

**File**: `features/issues/ui/tasks-kanban-client.tsx`

- Remove local `TYPE_OPTIONS` (lines 44–48)
- Accept `issueTypes` prop or derive from org context if available
- Pass derived options to the filter bar

### Step 5 — Propagate org `issue_types` to filter components

Trace call sites for `SharedFiltersBar`, and the kanban filter:

- **`features/issues/ui/issues-page.tsx`** — likely receives org data, pass
  `issue_types` down
- **`features/issues/ui/issues-layout-client.tsx`** — same
- **Kanban page** — check how org data arrives, pass through

The org data should already be available in the page-level server components
since they fetch the current organization. Confirm via grep:

- `features/issues/ui/issues-page.tsx`
- `app/dashboard/issues/page.tsx`
- `app/dashboard/kanban/page.tsx`

### Step 6 — Dead code audit

After migration, check if the following are still used anywhere:

- `ISSUE_TYPE_OPTIONS` in `features/issues/model/types.ts` — remove export if
  unused
- `TYPE_OPTIONS` local constants — already removed in Steps 2–4
- `isIssueType()` guard — keep if used in validation; remove if not
- `IssueType` union — consider widening to `string` if backend keys are dynamic,
  or keep as runtime-checked guard

**Search commands:**

```bash
grep -r "ISSUE_TYPE_OPTIONS" --include="*.ts" --include="*.tsx" .
grep -r "TYPE_OPTIONS" --include="*.ts" --include="*.tsx" .
grep -r "isIssueType" --include="*.ts" --include="*.tsx" .
```

### Step 7 — Update existing tests

Files to check for test updates:

- `features/issues/ui/__tests__/shared-filters-bar.test.tsx` (if exists)
- `features/issues/ui/__tests__/filters-modal.test.tsx` (if exists)
- `features/issues/ui/__tests__/tasks-kanban-client.test.tsx` (if exists)
- Any snapshot tests referencing `TYPE_OPTIONS` or specific type label strings

**Test update pattern**: Tests that currently rely on static options will need
to pass mock `issueTypes` prop:

```typescript
const mockIssueTypes: OrganizationIssueType[] = [
  { id: 1, key: 'development', name: 'Development', base_type: 'development', is_active: true },
  { id: 2, key: 'organization', name: 'Organization', base_type: 'organization', is_active: true },
];

render(<SharedFiltersBar ... issueTypes={mockIssueTypes} />);
```

---

## Acceptance Criteria

- [x] `shared-filters-bar.tsx` has no local `TYPE_OPTIONS` constant
- [x] `filters-modal.tsx` has no local `TYPE_OPTIONS` constant
- [x] `tasks-kanban-client.tsx` has no local `TYPE_OPTIONS` constant
- [x] All three filter components derive type options from
      `OrganizationIssueType[]` prop
- [x] Fallback to `ISSUE_TYPE_OPTIONS` (or empty) when `issue_types` is not
      provided
- [x] `issueTypeOptionsFromOrgs()` utility added to
      `features/issues/model/types.ts`
- [x] No `ISSUE_TYPE_OPTIONS` export removed (still used in `issue-form.tsx` and
      as fallback)
- [x] All existing tests pass (1130 passed)
- [x] Type dropdown in issues list, kanban, and filter modal all show
      backend-provided labels
- [x] `is_active: false` types are excluded from filter options

---

## Dead Code Candidates

| Symbol                 | File                                 | Action                                          |
| ---------------------- | ------------------------------------ | ----------------------------------------------- |
| `TYPE_OPTIONS` (local) | `shared-filters-bar.tsx:27`          | Remove                                          |
| `TYPE_OPTIONS` (local) | `tasks-kanban-client.tsx:44`         | Remove                                          |
| `TYPE_OPTIONS` (local) | `filters-modal.tsx:27`               | Remove                                          |
| `ISSUE_TYPE_OPTIONS`   | `features/issues/model/types.ts:11`  | Remove if no remaining usages                   |
| `isIssueType()`        | `features/issues/model/types.ts:148` | Keep if used in runtime validation; else remove |

---

## Risks & Considerations

| Risk                                         | Mitigation                                                                         |
| -------------------------------------------- | ---------------------------------------------------------------------------------- |
| Org data not in scope at filter render time  | Trace props from page level; add `issueTypes` to `SharedFiltersBarProps`           |
| `issue_types` undefined for some orgs        | Fallback to local `ISSUE_TYPE_OPTIONS`                                             |
| `IssueType` union mismatch with dynamic keys | Keep `IssueType` as a type guard, widen `SharedFilters.type` to `string` if needed |
| Breaking kanban page if org fetch not there  | Check `app/dashboard/kanban/page.tsx` for org context                              |

---

## References

### Internal

- `entities/organization/model/types.ts` — `OrganizationIssueType`,
  `OrganizationProps`
- `features/issues/model/types.ts:9` — `IssueType` union, `ISSUE_TYPE_OPTIONS`
- `features/issues/ui/shared-filters-bar.tsx:27` — current `TYPE_OPTIONS`
- `features/issues/ui/filters-modal.tsx:27` — current `TYPE_OPTIONS`
- `features/issues/ui/tasks-kanban-client.tsx:44` — current `TYPE_OPTIONS`
- `features/organization/ui/organization-issue-types-settings.tsx` — already
  uses backend types in settings UI (reference implementation)
- Backend: `app/Models/Organization.php:41` — `resolvedIssueTypes()`
- Backend: `app/Http/Resources/API/v1/OrganizationResource.php:19` —
  `issue_types` in response
