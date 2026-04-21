## What

<!-- One sentence: what does this PR do? -->

## Why

<!-- Context: what problem does it solve, what ticket/issue does it address? -->

---

## Code quality checklist

Before requesting review, confirm each item. Leave unchecked if not applicable
and explain why.

### API layer (`features/*/api/`)

- [ ] Every new/modified `api/*.ts` file starts with `'use server';`
- [ ] No raw `fetch()` calls — using `httpClient` or `httpClientList` from
      `@/shared/lib/httpClient`
- [ ] Mutations that show UI errors return `ActionResult<T>` — not throwing
- [ ] GET actions called from Server Components throw on error (no try/catch
      swallowing)
- [ ] One file per resource (3+ resources → split into separate files)
- [ ] `revalidatePath(...)` called after every mutation with a specific path
- [ ] No types defined inside `api/` files — types are in `model/types.ts`
- [ ] No local helpers duplicating `httpClient`, `parseApiError`, or
      `ServerError`

### FSD boundaries

- [ ] `features/A` does NOT import from `features/B` (use `entities/` or
      `shared/` for shared logic)
- [ ] `entities/` does NOT import from `features/`
- [ ] `shared/` does NOT import from `entities/` or `features/`
- [ ] New feature types shared across features live in
      `entities/<name>/model/types.ts`
- [ ] Every new `features/<name>/` and `entities/<name>/` has an `index.ts`
      public API

### Types

- [ ] No TypeScript `any` — all API response fields are typed
- [ ] API response types derived from the backend Resource/DTO (not guessed)
- [ ] PHP → TypeScript mapping followed (see CLAUDE.md)

### General

- [ ] `npm run lint` passes with no new errors
- [ ] `npm test -- --ci --passWithNoTests` passes
- [ ] UI text is in English (no Russian in JSX output)
