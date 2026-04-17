Create a new FSD feature module with the name: $ARGUMENTS

Follow the Feature Sliced Design architecture of this project. Before writing
any code, look at 2-3 existing features (e.g., `features/organization/`,
`features/issues/`, `features/teams/`) to understand naming, structure, and
import conventions.

## Required directory structure

```
features/<feature-name>/
  ui/
    <feature-name>-page.tsx       # top-level page component (if needed)
    <feature-name>-list.tsx       # list component
    <feature-name>-list-item.tsx  # single item in a list
    <feature-name>-form.tsx       # create/edit form
    <feature-name>-card.tsx       # card/summary display
    <feature-name>-empty.tsx      # empty state
    <feature-name>-skeleton.tsx   # loading skeleton
    <some-action>-modal.tsx       # modal for a specific action
    index.ts                      # barrel re-export
  model/
    schemas.ts                    # Zod v4 validation schemas
    types.ts                      # DTO transformations and local types
  api/
    <resource>.ts                 # Server Actions for this resource
  hooks/
    use-<feature-name>.ts         # feature-specific hooks
  types.ts                        # feature-level TypeScript interfaces
  index.ts                        # public API
```

## Decomposition rules (critical — enforce these)

**File size limit**: No single UI file should exceed 200 lines. If it does,
extract sub-components into separate files.

**One concern per file**: Each file should have one clear responsibility:

- Page component = assembles sections, handles layout
- List component = renders a collection, handles empty/loading states
- List item = renders one item, handles its interactions
- Form = form fields, validation feedback, submit logic
- Modal = wraps a form or destructive action in a dialog
- Skeleton = loading placeholder matching the real component's shape

**Extract immediately when you see:**

- A section of JSX that has its own heading or visual boundary → new component
- The same JSX pattern used twice → extract to shared/ui/ if generic, or a named
  sub-component in ui/ if feature-specific
- A `map()` body longer than 10 lines → extract the item to its own file
- A modal/dialog → always its own `*-modal.tsx` file
- An empty state block → always its own `*-empty.tsx` file

**Reusable pieces go to shared/:**

- Generic UI primitives (badges, status chips, avatar groups) → `shared/ui/`
- Constants used in display logic (status labels, color maps) → extract to a
  `constants.ts` file inside `model/` or at feature root
- Date/number formatters used in multiple places → `shared/lib/`

## TypeScript rules

- `strict: true` — zero `any`. If a type is unknown, use `unknown` and narrow.
- All API response shapes must match the backend Resource/DTO exactly — read the
  PHP file before defining types (see CLAUDE.md workflow).
- Types for domain objects shared across features →
  `entities/<name>/model/types.ts`
- Types used only within this feature → `features/<name>/types.ts`
- Never define types inside `api/` files.

## API layer rules

Every file in `api/` must:

1. Start with `'use server';`
2. Use `httpClient` or `httpClientList` from `@/shared/lib/httpClient` — never
   raw `fetch`
3. For mutations: return `ActionResult<T>` from `@/shared/types/server-action`
4. Call `revalidatePath(...)` after every mutation

## Component rules

- Default to Server Component
- Add `'use client'` only when the component needs event handlers, hooks, or
  state
- Use Tailwind CSS v4 classes (no `tailwind.config.ts`, config is in
  `globals.css`)
- Use `clsx` for conditional classes
- Icons from `lucide-react`
- Toast notifications: `import { toast } from 'sonner'`

## Zod v4 syntax

Use `z.email()` not `z.string().email()`. Use
`z.literal(value, { error: '...' })` not `errorMap`. Check existing schemas in
`features/*/model/schemas.ts` for patterns.

## Constants rule

If you write a string or number more than once (status labels, color classes,
route paths, error messages), extract it to a named constant:

```ts
// model/constants.ts
export const STATUS_LABELS: Record<IssueStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  closed: 'Closed',
};
```

Never scatter magic strings across JSX.

## index.ts public API

The `index.ts` at feature root must explicitly re-export everything consumers
need. Keep it clean — only export what other layers actually import.

```ts
// features/<name>/index.ts
export { FeatureNameList } from './ui/feature-name-list';
export { FeatureNameForm } from './ui/feature-name-form';
export type { FeatureNameProps } from './types';
```

Ask me what the feature should do if the name alone is insufficient to determine
which components, API endpoints, or entities are needed.
