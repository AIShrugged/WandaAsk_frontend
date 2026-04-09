Create a form component with validation: $ARGUMENTS

The argument format is: `<feature>/<FormName>` (e.g., `auth/LoginForm` or
`meeting/CreateMeetingForm`).

This creates a complete form setup:

1. **Zod schema** in `features/<feature>/model/` — validation rules using Zod v4
   syntax
   - Use `z.email()` not `z.string().email()`
   - Use `z.literal(value, { error })` not `errorMap`
2. **Form component** in `features/<feature>/ui/` — Client Component with
   `'use client'`
   - `react-hook-form` with `useForm({ resolver: zodResolver(schema) })`
   - `@hookform/resolvers` v5
   - Use shared UI components (Button, Input) from `shared/ui`
   - Tailwind CSS v4 for styling
3. **Server Action** in `features/<feature>/api/` — form submission handler
   - `'use server'` directive
   - Validate input with the same Zod schema
   - Use `useToast()` for error notifications

Look at existing forms in the codebase first to match established patterns.
