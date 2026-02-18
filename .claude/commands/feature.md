Create a new FSD feature module with the name: $ARGUMENTS

Follow the Feature Sliced Design architecture of this project. Create the following structure inside `features/<feature-name>/`:

1. `ui/` — directory for React components, with `index.ts` re-export
2. `model/` — directory for business logic, Zod schemas, DTO transformations
3. `api/` — directory for Server Actions (`'use server'`) and API calls
4. `hooks/` — directory for feature-specific hooks
5. `types.ts` — feature-specific TypeScript types/interfaces
6. `index.ts` — public API barrel export

Rules:
- Use TypeScript strict mode, no `any`
- Server Actions must have `'use server'` directive
- Components are Client Components only if interactivity is required, otherwise Server Components
- Zod v4 syntax: use `z.email()` not `z.string().email()`
- Look at existing features (auth, meeting, etc.) for naming and structure conventions before creating files

Create placeholder files with proper exports. Ask me what the feature should do if the name alone is not descriptive enough.
