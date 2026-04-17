Create a domain entity: $ARGUMENTS

Entities are shared domain objects used by multiple features. They define the
canonical shape, display components, and utilities for a core domain concept.
Before creating, check existing entities in `entities/` — the new entity may
already exist or should extend one that does.

## Structure

```
entities/<name>/
  model/
    types.ts      # entity interfaces and enums
    schemas.ts    # Zod v4 validation schemas
    constants.ts  # display labels, color maps, status maps
  ui/             # presentational-only components (no data fetching)
    <name>-badge.tsx
    <name>-avatar.tsx
    <name>-card.tsx
    index.ts
  lib/            # pure utility functions
    formatters.ts # date/number/string formatters for this entity
    helpers.ts    # domain logic (e.g., isOverdue, canEdit)
  index.ts        # public barrel export
```

## Decomposition rules

**One file per concern** — never put types, formatters, and constants together
in one file. Split them:

| What                          | File                      |
| ----------------------------- | ------------------------- |
| Interfaces / enums / TS types | `model/types.ts`          |
| Zod schemas                   | `model/schemas.ts`        |
| String labels, color maps     | `model/constants.ts`      |
| Formatting functions          | `lib/formatters.ts`       |
| Pure domain logic             | `lib/helpers.ts`          |
| UI card/badge/avatar          | `ui/<name>-<variant>.tsx` |

**Extract constants immediately**: if you write a status label string or a color
class name more than once, it goes into `model/constants.ts`.

**UI components are presentational only**: entity UI components receive data as
props and render it. They never call `fetch`, use Server Actions, or import from
`features/`. If a component needs data, it belongs in a feature.

**Formatters are pure functions**: `lib/formatters.ts` functions take a value
and return a string. No React, no side effects.

## TypeScript rules

- No `any`. Use `unknown` and narrow where needed.
- Enums as string unions, not TypeScript `enum`:
  ```ts
  // ✅
  export type IssueStatus = 'open' | 'in_progress' | 'closed';
  // ❌
  export enum IssueStatus { Open = 'open', ... }
  ```
- Match PHP backend types exactly — read the Eloquent model and Resource/DTO
  before writing types (see CLAUDE.md type mapping table).
- Nullable fields: `string | null` not `string | undefined` (backend returns
  `null`).

## Zod v4 syntax

`z.email()` not `z.string().email()`. `z.literal(value, { error: '...' })` not
`errorMap`. Check `features/*/model/schemas.ts` for examples.

## Constants pattern

```ts
// model/constants.ts
export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  closed: 'Closed',
};

export const ISSUE_STATUS_COLORS: Record<IssueStatus, string> = {
  open: 'text-blue-400',
  in_progress: 'text-yellow-400',
  closed: 'text-green-400',
};
```

## index.ts public API

Every `entities/<name>/` must have an `index.ts` that exports everything
consumers need. Consumers import from `@/entities/<name>`, never from deep
paths.

```ts
export type { IssueProps, IssueStatus } from './model/types';
export { issueStatusSchema } from './model/schemas';
export { ISSUE_STATUS_LABELS, ISSUE_STATUS_COLORS } from './model/constants';
export { formatIssueDuration } from './lib/formatters';
export { IssueBadge } from './ui/issue-badge';
```
