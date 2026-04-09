Refactor the specified code: $ARGUMENTS

The argument can be a file path, feature name, or component name.

## Refactoring checklist (apply what's relevant)

### FSD Architecture compliance

- Feature isolation: no direct imports between features (use shared/ or pass via
  props/context)
- Correct layer placement: UI in `ui/`, logic in `model/`, API in `api/`, hooks
  in `hooks/`
- Public API via `index.ts` barrel exports

### Component patterns

- Server Component by default; `'use client'` only for interactivity
- Extract static parts out of Client Components into Server Components
- One abstraction level per component
- Props interfaces defined, no `any`

### Code quality

- SOLID/DRY: small functions, single responsibility
- Remove dead code, unused imports, commented-out code
- Replace magic strings/numbers with named constants
- Extract repeated patterns into shared utilities

### Forms (if applicable)

- Use `react-hook-form` + `zodResolver` pattern (as in `login-form.tsx`)
- Zod schemas in `model/`, form UI in `ui/`
- `useTransition` + `startTransition` for Server Action calls
- Error handling via `handleFormError` from `shared/lib/formErrors`
- Field config via `VARIANT_MAPPER` from `shared/lib/fieldMapper`

### State management (if applicable)

- Zustand with granular selectors
- Avoid prop drilling > 2 levels — use Zustand or React Context
- Derived state instead of `useEffect` + `useState`

Show before/after for each change. Run lint after refactoring.
