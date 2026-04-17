---
name: ts-strict
description: >
  Enforce WandaAsk TypeScript conventions when writing or reviewing TypeScript
  code in this project. Use when writing new types, interfaces, API response
  types, Zod schemas, or when asked to check/fix TypeScript quality. Trigger
  phrases: "check types", "fix typescript", "write types for", "define
  interface", "type this response", "strict typescript", "no any".
---

# TypeScript Strict Conventions — WandaAsk Frontend

Apply these rules when writing or reviewing any TypeScript in this project. The
project runs `strict: true` in tsconfig.json — treat compiler errors as bugs.

## The no-any rule

Never write `any`. Every unknown shape has a better alternative:

| Situation                          | Use instead of `any`             |
| ---------------------------------- | -------------------------------- |
| Truly unknown external data        | `unknown` + type guard/Zod parse |
| API response not yet typed         | Read the PHP Resource/DTO first  |
| Callback with generic params       | Generic `<T>` parameter          |
| Error caught in catch block        | `error instanceof ServerError`   |
| JSON.parse result                  | `z.parse(schema, data)` with Zod |
| Type assertion you're unsure about | Stop and define the real type    |

If you see `any` in existing code you're modifying, fix it in the same PR.

## API response types — mandatory workflow

Before writing any `interface` for an API response:

1. Open the backend at `/Users/slavapopov/Documents/WandaAsk_backend`
2. Find the controller in `app/Http/Controllers/API/v1/`
3. Identify whether it returns a Resource or DTO
4. Read that file's `toArray()` method
5. Map every PHP field to TypeScript using this table:

| PHP                  | TypeScript                                      |
| -------------------- | ----------------------------------------------- |
| `int` / `integer`    | `number`                                        |
| `string`             | `string`                                        |
| `?string`            | `string \| null`                                |
| `bool`               | `boolean`                                       |
| `Carbon` / timestamp | `string` (ISO 8601)                             |
| indexed `array`      | `T[]`                                           |
| assoc `array`        | specific interface or `Record<string, unknown>` |
| backed enum          | string union                                    |

Never guess field names from context — read the source.

## Interfaces vs types

Use `interface` for object shapes that may be extended:

```ts
interface UserProps {
  id: number;
  name: string;
  email: string;
}
```

Use `type` for unions, intersections, and computed types:

```ts
type IssueStatus = 'open' | 'in_progress' | 'closed';
type IssueListItem = Pick<IssueProps, 'id' | 'title' | 'status'>;
```

Never use `type` just to avoid writing `interface` — they're different tools.

## Nullable vs optional

Match the backend exactly:

- Field always present but may be null → `field: string | null`
- Field may be absent from the response → `field?: string`
- Never use `undefined` for API fields — the backend returns `null`

## Zod v4 syntax

This project uses Zod v4, which has breaking API changes from v3:

```ts
// ✅ v4
z.email(); // not z.string().email()
z.url(); // not z.string().url()
z.uuid(); // not z.string().uuid()
z.literal('open', { error: '...' }); // not errorMap

// ❌ v3 (will not compile)
z.string().email();
z.string().url();
```

## Enums as string unions

Never use TypeScript `enum` — use string union types:

```ts
// ✅
export type Status = 'active' | 'inactive' | 'pending';

// ❌ — generates runtime code, hard to serialize
export enum Status {
  Active = 'active',
  Inactive = 'inactive',
}
```

## Generic patterns

When writing functions that work with multiple types, use generics rather than
`any` or duplicating code:

```ts
// ✅ generic ActionResult already defined in shared/types/server-action.ts
import type { ActionResult } from '@/shared/types/server-action';

export async function createItem(payload: CreatePayload): Promise<ActionResult<ItemProps>> { ... }
```

## Type file location rules

| Type category                       | File location                    |
| ----------------------------------- | -------------------------------- |
| Domain type shared across features  | `entities/<name>/model/types.ts` |
| Feature-local type                  | `features/<name>/types.ts`       |
| API response shape (single feature) | `features/<name>/types.ts`       |
| Shared utility types                | `shared/types/<name>.ts`         |
| Never define types in `api/` files  | —                                |

## After writing types

Run `npm run lint` to catch:

- Unused imports
- `any` escapes
- Missing return type annotations on exported functions
