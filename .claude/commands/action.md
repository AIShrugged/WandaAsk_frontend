Create a Server Action for: $ARGUMENTS

The argument format is: `<feature>/<actionName>` (e.g., `auth/login` or
`meeting/createMeeting`).

Rules:

- Create the file in `features/<feature>/api/`
- Add `'use server'` directive at the top of the file
- Define input validation with Zod v4 schema in `features/<feature>/model/`
- Define TypeScript interfaces for request/response types in
  `features/<feature>/types.ts`
- Use the centralized API client from `shared/api/` for HTTP calls to the
  Laravel backend
- Handle errors gracefully, return typed results
- Follow patterns from existing Server Actions in the project
- Update barrel exports in `index.ts`

Look at existing actions in the codebase first to match the established
patterns.
