Create a Zustand store for: $ARGUMENTS

The argument format is: `<feature>/<storeName>` (e.g., `meeting/useMeetingStore`
or `shared/useThemeStore`).

## Rules

- If `shared/`, create in `shared/store/`
- If a feature name, create in `features/<feature>/model/` or
  `features/<feature>/store/`
- Use Zustand v5 with TypeScript
- Follow the existing `create-cached-list-store` pattern from `shared/store/` as
  reference
- Use selectors for granular subscriptions to prevent unnecessary re-renders:
  ```ts
  // Good: granular selector
  const items = useStore((s) => s.items);
  // Bad: selecting entire state
  const state = useStore();
  ```
- Define the store interface explicitly
- Keep actions inside the store (Zustand v5 pattern)
- No `any` types
- Export both the hook and the store type
- Update barrel exports

Look at existing stores in `shared/store/` and feature directories first to
match conventions.
