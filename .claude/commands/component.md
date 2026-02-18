Create a new React component: $ARGUMENTS

The argument format is: `<feature-or-shared>/<ComponentName>` (e.g., `auth/LoginForm` or `shared/Modal`).

Rules:
- If the path starts with `shared/`, create in `shared/ui/`
- If the path starts with a feature name, create in `features/<feature>/ui/`
- Use TypeScript, define Props interface
- Default to Server Component; add `'use client'` only if the component needs interactivity (event handlers, hooks, state)
- Use Tailwind CSS v4 classes for styling
- Use `clsx` for conditional classes
- Icons from `lucide-react`
- Update the relevant `index.ts` barrel export
- Look at existing components in the same directory for style conventions before writing code
