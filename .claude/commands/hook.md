Create a custom React hook: $ARGUMENTS

The argument format is: `<feature-or-shared>/<useHookName>` (e.g.,
`auth/useAuth` or `shared/useDebounce`).

Rules:

- If `shared/`, create in `shared/lib/` or `shared/hooks/`
- If a feature name, create in `features/<feature>/hooks/`
- Must start with `use` prefix
- TypeScript with proper return type annotation
- No `any` types — define interfaces for all return values
- Keep side effects isolated within the hook
- Update barrel exports in `index.ts`
- Look at existing hooks for naming and pattern conventions
