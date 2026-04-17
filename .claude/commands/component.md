Create a new React component: $ARGUMENTS

The argument format is: `<feature-or-shared>/<ComponentName>` (e.g.,
`auth/LoginForm`, `shared/StatusBadge`, `issues/IssueListItem`).

Before writing code, read 2-3 existing components in the target directory to
understand naming, spacing, and import conventions.

## Placement rules

| Argument prefix    | Create in                          |
| ------------------ | ---------------------------------- |
| `shared/<Name>`    | `shared/ui/<name>.tsx`             |
| `<feature>/<Name>` | `features/<feature>/ui/<name>.tsx` |
| `entities/<Name>`  | `entities/<name>/ui/<name>.tsx`    |
| `widgets/<Name>`   | `widgets/<name>/ui/<name>.tsx`     |

## Decomposition rules (critical)

**200-line limit**: If the component would exceed 200 lines, split it. Signs
that a component needs splitting:

- It has more than one distinct visual section with its own heading or border
- It contains a `map()` with a body longer than ~10 lines
- It has an inline modal, dialog, or drawer
- It has an inline empty state or error state

**Extract sub-components** into sibling files in the same `ui/` directory:

```
ui/
  issue-list.tsx          # the list itself (renders IssueListItem[])
  issue-list-item.tsx     # one row — extracted, not inline
  issue-list-empty.tsx    # empty state — extracted, not inline
  issue-list-skeleton.tsx # loading state — extracted, not inline
```

**Generic pieces go to shared/**: If the extracted sub-component has no
feature-specific knowledge (e.g., a status badge, a user avatar row, a
collapsible section), create it in `shared/ui/` instead.

**Constants in constants files**: If you write a string value (label, color
class, route) more than once in the component, extract to:

- `features/<name>/model/constants.ts` — for feature-specific constants
- `shared/lib/constants.ts` — for project-wide constants

## TypeScript rules

- Define a `Props` interface at the top of the file
- No `any` — use specific types or `unknown` with narrowing
- Nullable props: `prop?: string` (optional) vs `prop: string | null` (always
  present but may be null — match what the API returns)

## Styling rules

- Tailwind CSS v4 — utility classes only, no inline `style={}` unless CSS
  variables are needed (e.g., dynamic colors from data)
- Use `clsx` for conditional class merging:
  ```ts
  import clsx from 'clsx';
  <div className={clsx('base-class', isActive && 'active-class')} />
  ```
- Follow the existing design system: dark background `bg-[hsl(240_30%_7%)]`,
  violet primary (`violet-*`), terminal green accent (`green-400`)

## Component type rules

- Default to **Server Component** — no directive needed
- Add `'use client'` only when the component:
  - Uses `useState`, `useEffect`, `useRef`, or any React hook
  - Needs event handlers (`onClick`, `onChange`, etc.)
  - Uses browser APIs
- If only a small part needs interactivity, extract just that part as a Client
  Component and keep the wrapper as a Server Component

## Standard imports

```ts
import clsx from 'clsx';
import { SomeIcon } from 'lucide-react';
import { toast } from 'sonner'; // for notifications
```

## After creating

Update the relevant `ui/index.ts` barrel export to include the new component.
