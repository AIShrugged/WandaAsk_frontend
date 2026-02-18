Create a widget (composite component): $ARGUMENTS

Widgets combine multiple features into a cohesive UI block. Create in `widgets/<name>/ui/`.

## Rules

- Widgets live in `widgets/` directory at project root
- A widget imports from multiple `features/` and `shared/` modules
- A widget does NOT contain business logic — it composes feature components
- Structure: `widgets/<name>/ui/<ComponentName>.tsx` with `index.ts` barrel export
- Server Component by default; `'use client'` only if the widget itself needs interactivity
- If the widget just wraps feature components that are already Client Components, the widget can stay as Server Component

## Pattern
```
widgets/
  <name>/
    ui/
      <WidgetName>.tsx
      index.ts
```

Look at existing widgets in `widgets/` directory (e.g., `widgets/auth/`) for conventions before creating.
